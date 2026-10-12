#!/usr/bin/env node

// ============================================================================
// AI 实战派 — Step 2: screen and curate with Claude
// ============================================================================
// Two stages, so the issue stays readable as the source list grows:
//
// 1. Screen: Claude sees every candidate as title + short excerpt and returns
//    a ranked shortlist (prompts/screen.md). Skipped when the pool is small.
// 2. Curate: Claude sees the shortlist in full and writes the issue
//    (prompts/curate.md), told to stay within the reading budget.
//
// Then code enforces what prompts cannot guarantee:
// - every item must cite candidate ids that exist in today's pool
// - sources are rebuilt from those candidates, never taken from model output
// - any Markdown link not pointing at a cited candidate URL is unlinked
// - the issue must read in MAX_READING_MINUTES; lowest-priority items are
//   dropped until it does
//
// Output: public/ai-practice/data/issues/<date>.json.
//
// Usage: node curate.js [--date YYYY-MM-DD] [--force] [--engine api|cli]
//   --engine api (default): Claude API, needs ANTHROPIC_API_KEY
//   --engine cli: local Claude Code CLI (`claude -p`), uses your subscription
// ============================================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { todayPacific } from "./lib/dates.js";
import { issueReadingMinutes, MAX_READING_MINUTES, ZH_CHARS_PER_MIN } from "./lib/reading.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CANDIDATES_DIR = join(ROOT, "state", "candidates");
// Site files live in the blog repo's public/ so Vite copies them into docs/.
const ISSUES_DIR = join(ROOT, "..", "public", "ai-practice", "data", "issues");
const CATEGORIES = JSON.parse(await readFile(join(ROOT, "config", "categories.json"), "utf-8"));
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const MODEL = "claude-opus-5-5";

// Screening only runs when the pool is bigger than what the writer should read.
const SCREEN_THRESHOLD = 20;
const SHORTLIST_MAX = 12;
// Enough of each candidate for the screener to judge relevance.
const SCREEN_EXCERPT_CHARS = 700;

const ScreenSchema = z.object({
  shortlist: z.array(z.object({ id: z.string(), reason: z.string() })),
});

const ItemSchema = z.object({
  candidateIds: z.array(z.string()),
  category: z.enum(CATEGORY_IDS),
  kind: z.enum(["本周动态", "经营复盘", "本周演示", "机会观察", "观点访谈"]),
  eventDate: z.string(),
  headline: z.string(),
  oneLiner: z.string(),
  who: z.string(),
  how: z.string(),
  result: z.string(),
  tryThis: z.string(),
  caveat: z.string(),
  body: z.string(),
});

const IssueSchema = z.object({
  title: z.string(),
  items: z.array(ItemSchema),
  action: z.string(),
});

// Structured outputs reject the "$schema" key zod emits; everything else in
// these schemas (objects, arrays, strings, enums) is in the supported subset.
function jsonSchema(zodSchema) {
  const { $schema, ...schema } = z.toJSONSchema(zodSchema);
  return schema;
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

// Strip Markdown links that point anywhere other than the cited candidates.
function sanitizeLinks(markdown, allowedUrls) {
  return markdown.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) =>
    allowedUrls.has(url) ? m : text,
  );
}

function compactCandidate(c, textChars) {
  return {
    id: c.id,
    source: c.source,
    categoryHint: c.categoryHint,
    region: c.region,
    title: c.title,
    url: c.url,
    publishedAt: c.publishedAt,
    author: c.author,
    text: textChars ? c.text.slice(0, textChars) : c.text,
    ...(c.engagement ? { engagement: c.engagement } : {}),
  };
}

// ---- Claude calls ----------------------------------------------------------

// Default engine: Claude API. Used in GitHub Actions with ANTHROPIC_API_KEY.
async function callApi({ system, user, schema, effort }) {
  const client = new Anthropic();
  // Streaming: long input plus a long Chinese issue can exceed HTTP timeouts.
  // fallbacks: "default" re-runs a policy decline on Anthropic's recommended
  // fallback model server-side instead of returning an empty refusal.
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: user }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`Model declined: ${JSON.stringify(message.stop_details)}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Output hit max_tokens; JSON is truncated");
  }
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.error(
    `  tokens in=${message.usage.input_tokens} cache_read=${message.usage.cache_read_input_tokens ?? 0} out=${message.usage.output_tokens}`,
  );
  return { raw: JSON.parse(text), meta: { model: message.model, usage: message.usage } };
}

// Local engine: the Claude Code CLI on the user's own subscription, no API key.
// --setting-sources "" keeps CLAUDE.md and hooks out of the editor's context.
// The CLI has no effort flag; it runs at its default.
async function callCli({ system, user, schema }) {
  const args = [
    "-p",
    "--model", MODEL,
    "--setting-sources", "",
    "--system-prompt", system.map((b) => b.text).join("\n\n"),
    "--output-format", "json",
    "--json-schema", JSON.stringify(schema),
    "--tools", "",
    "--no-session-persistence",
  ];
  const stdout = await new Promise((resolve, reject) => {
    const child = spawn("claude", args, { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}`))));
    child.stdin.end(user);
  });
  const result = JSON.parse(stdout);
  if (result.is_error || !result.structured_output) {
    throw new Error(`claude CLI returned no structured output: ${String(result.result).slice(0, 300)}`);
  }
  console.error(`  cost=$${result.total_cost_usd?.toFixed(2)}`);
  return { raw: result.structured_output, meta: { model: MODEL, usage: result.usage, costUsd: result.total_cost_usd } };
}

// ---- Stages ----------------------------------------------------------------

async function screen(call, pool, screenPrompt) {
  const list = pool.candidates.map((c) => compactCandidate(c, SCREEN_EXCERPT_CHARS));
  const { raw, meta } = await call({
    system: [{ type: "text", text: screenPrompt, cache_control: { type: "ephemeral" } }],
    user: `今天是 ${pool.date}。以下是今天的 ${list.length} 条候选（JSON，正文只有开头摘录）。挑出最多 ${SHORTLIST_MAX} 条，按优先级排序。\n\n${JSON.stringify(list, null, 1)}`,
    schema: jsonSchema(ScreenSchema),
    // Ranking short excerpts does not need deep reasoning.
    effort: "low",
  });
  const known = new Set(pool.candidates.map((c) => c.id));
  const shortlist = ScreenSchema.parse(raw)
    .shortlist.filter((s) => known.has(s.id))
    .slice(0, SHORTLIST_MAX);
  return { shortlist, meta };
}

async function writeIssue(call, pool, candidates, instructions, example) {
  const budgetChars = Math.round(MAX_READING_MINUTES * ZH_CHARS_PER_MIN * 0.85);
  const list = candidates.map((c) => compactCandidate(c));
  const { raw, meta } = await call({
    system: [
      // Stable prefix first so the instructions and example cache across days.
      { type: "text", text: instructions },
      {
        type: "text",
        text: `## 样刊（文风与结构参考，不要复用其中的事实）\n\n${example}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    user:
      `今天是 ${pool.date}。以下是初筛后的 ${list.length} 条候选（JSON，按优先级排序）。按编辑指令挑选并成稿。\n\n` +
      `篇幅预算：整期读者要在 ${MAX_READING_MINUTES} 分钟内读完，所有可见文字（标题、速读、要点框、正文、今天可以做的一件事）合计不超过约 ${budgetChars} 个汉字。` +
      `items 按重要性从高到低排列；超出预算时，排在最后的条目会被删掉。\n\n${JSON.stringify(list, null, 1)}`,
    schema: jsonSchema(IssueSchema),
    effort: "high",
  });
  return { issue: IssueSchema.parse(raw), meta };
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const date = arg("--date") || todayPacific();
  const force = process.argv.includes("--force");
  const engine = arg("--engine") || "api";
  const call = engine === "cli" ? callCli : callApi;
  const poolPath = join(CANDIDATES_DIR, `${date}.json`);
  const outPath = join(ISSUES_DIR, `${date}.json`);

  if (!existsSync(poolPath)) throw new Error(`No candidate pool at ${poolPath}; run fetch-sources.js first`);
  if (existsSync(outPath) && !force) {
    console.error(`Issue ${date} already exists; pass --force to regenerate`);
    return;
  }

  const pool = JSON.parse(await readFile(poolPath, "utf-8"));
  if (pool.candidates.length === 0) {
    console.error("Empty candidate pool; nothing to curate");
    return;
  }

  const [instructions, example, screenPrompt] = await Promise.all([
    readFile(join(ROOT, "prompts", "curate.md"), "utf-8"),
    readFile(join(ROOT, "prompts", "example-issue.md"), "utf-8"),
    readFile(join(ROOT, "prompts", "screen.md"), "utf-8"),
  ]);
  const byId = new Map(pool.candidates.map((c) => [c.id, c]));

  // Stage 1: screen
  let shortlisted = pool.candidates;
  let screenMeta = null;
  let shortlist = null;
  if (pool.candidates.length > SCREEN_THRESHOLD) {
    console.error(`Screening ${pool.candidates.length} candidates with ${MODEL} via ${engine}...`);
    ({ shortlist, meta: screenMeta } = await screen(call, pool, screenPrompt));
    shortlisted = shortlist.map((s) => byId.get(s.id));
    for (const s of shortlist) console.error(`  + ${byId.get(s.id).source}: ${byId.get(s.id).title.slice(0, 60)}`);
    if (shortlisted.length === 0) {
      console.error("Screening kept nothing; no issue today");
      return;
    }
  }

  // Stage 2: write
  console.error(`Writing issue from ${shortlisted.length} candidates...`);
  const { issue, meta } = await writeIssue(call, pool, shortlisted, instructions, example);

  // Rebuild every item's sources from the candidate pool.
  const items = [];
  for (const item of issue.items) {
    const cited = item.candidateIds.map((id) => byId.get(id)).filter(Boolean);
    if (cited.length === 0) {
      console.error(`  Dropping "${item.headline}": cites no known candidate`);
      continue;
    }
    const allowed = new Set(cited.map((c) => c.url));
    items.push({
      ...item,
      body: sanitizeLinks(item.body, allowed),
      sources: cited.map((c) => ({ label: c.source, title: c.title, url: c.url })),
      region: cited[0].region,
    });
  }

  // Enforce the reading budget: items are ordered by importance, so drop
  // from the end. Always keep at least one item.
  const out = { date, title: issue.title, items, action: issue.action };
  const dropped = [];
  while (out.items.length > 1 && issueReadingMinutes(out) > MAX_READING_MINUTES) {
    dropped.push(out.items.pop().headline);
  }
  for (const h of dropped) console.error(`  Over budget, dropped: ${h}`);
  out.items.forEach((it, i) => (it.id = `${date}-${String(i + 1).padStart(2, "0")}`));
  out.readingMinutes = Math.ceil(issueReadingMinutes(out));
  out.meta = {
    generatedAt: new Date().toISOString(),
    engine,
    candidateCount: pool.candidates.length,
    shortlist,
    droppedForLength: dropped,
    screen: screenMeta,
    ...meta,
  };

  await mkdir(ISSUES_DIR, { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2));
  console.error(`Wrote ${out.items.length} items (~${out.readingMinutes} min read) to ${outPath}`);
}

main().catch((err) => {
  if (err instanceof Anthropic.APIError) {
    console.error(`Claude API error ${err.status}: ${err.message}`);
  } else {
    console.error("curate failed:", err);
  }
  process.exit(1);
});
