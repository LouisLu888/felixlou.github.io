#!/usr/bin/env node

// ============================================================================
// AI 实干派 — email subscribers through Buttondown
// ============================================================================
// Subscribers sign up on the site (lib/pages.js subscribeForm) and get the
// tag ai-practice plus ai-practice-daily or ai-practice-weekly.
//
//   --mode daily   today's issue to ai-practice-daily
//   --mode weekly  the past 7 days' issues to ai-practice-weekly
//
// Safety: the Buttondown account is shared with the blog's newsletter, whose
// list is larger. Every send therefore carries a tag filter resolved to the
// tag's ID at send time. If the tag cannot be resolved, the script stops;
// it never sends without a filter. It also skips when the tag has no active
// subscribers, and emails are kept out of the blog's public archive.
// state/subscribers-sent.json makes reruns idempotent.
//
// Usage: node send-subscribers.js --mode daily|weekly [--date YYYY-MM-DD] [--dry-run]
// Env: BUTTONDOWN_API_KEY
// ============================================================================

import { readFile, writeFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { todayPacific } from "./lib/dates.js";
import { renderDailyEmail, renderWeeklyEmail } from "./lib/email.js";
import { loadIssueContext } from "./send-email.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ISSUES_DIR = join(ROOT, "..", "public", "ai-practice", "data", "issues");
const SENT_PATH = join(ROOT, "state", "subscribers-sent.json");
const API = "https://api.buttondown.com/v1";
const TAGS = { daily: "ai-practice-daily", weekly: "ai-practice-weekly" };

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

async function bd(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Buttondown ${method} ${path} ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

async function resolveTagId(name) {
  for (let page = 1; page <= 20; page++) {
    const data = await bd(`/tags?page_size=100&page=${page}`);
    const hit = (data.results || []).find((t) => t.name === name);
    if (hit) return hit.id;
    if (!data.next) break;
  }
  return null;
}

// Buttondown wraps emails in its own template; the embedded render is only the
// content rows (no document or frame), so it sits directly in that template.
function bodyFragment(html) {
  const inner = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html;
  return `<!-- buttondown-editor-mode: fancy -->${inner}`;
}

function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function buildDaily(date) {
  const ctx = await loadIssueContext(date);
  if (!ctx || !ctx.issue.items.length) return null;
  return { key: date, ...renderDailyEmail(ctx.issue, ctx.number, ctx.catName, { embedded: true }) };
}

async function buildWeekly(endDate) {
  const start = addDays(endDate, -6);
  const files = (await readdir(ISSUES_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  const issues = [];
  for (const f of files) {
    const date = f.slice(0, 10);
    if (date < start || date > endDate) continue;
    const issue = JSON.parse(await readFile(join(ISSUES_DIR, f), "utf-8"));
    if (!issue.sample && issue.items.length) issues.push(issue);
  }
  if (!issues.length) return null;
  const ctx = await loadIssueContext(issues[0].date);
  const numberOf = (d) => ctx.index.days.find((x) => x.date === d)?.number ?? 0;
  return { key: endDate, ...renderWeeklyEmail({ weekLabel: `${start} 至 ${endDate}`, issues, numberOf, catName: ctx.catName, embedded: true }) };
}

async function main() {
  const mode = arg("--mode");
  if (!TAGS[mode]) throw new Error("--mode daily|weekly is required");
  const date = arg("--date") || todayPacific();
  const dryRun = process.argv.includes("--dry-run");

  const email = mode === "daily" ? await buildDaily(date) : await buildWeekly(date);
  if (!email) {
    console.error(`No content for ${mode} ${date}; nothing to send`);
    return;
  }
  const sent = existsSync(SENT_PATH) ? JSON.parse(await readFile(SENT_PATH, "utf-8")) : { daily: {}, weekly: {} };
  if (sent[mode]?.[email.key]) {
    console.error(`${mode} ${email.key} already sent (${sent[mode][email.key]}); skipping`);
    return;
  }
  if (!process.env.BUTTONDOWN_API_KEY) throw new Error("BUTTONDOWN_API_KEY is required");

  const tagName = TAGS[mode];
  const tagId = await resolveTagId(tagName);
  if (!tagId) {
    // The tag is created by Buttondown on the first signup that uses it.
    console.error(`Tag ${tagName} does not exist yet (no signups); not sending`);
    return;
  }
  const subs = await bd(`/subscribers?tag=${encodeURIComponent(tagId)}&type=regular&page_size=1`);
  if (!subs.count) {
    console.error(`Tag ${tagName} has no active subscribers; not sending`);
    return;
  }

  const payload = {
    subject: email.subject,
    body: bodyFragment(email.html),
    status: "about_to_send",
    archival_mode: "disabled",
    filters: { filters: [{ field: "subscriber.tags", operator: "contains", value: tagId }], groups: [], predicate: "and" },
  };
  if (!payload.filters.filters[0].value) throw new Error("Refusing to send without a tag filter");

  if (dryRun) {
    console.error(`Dry run: would send "${email.subject}" to ${subs.count} subscriber(s) tagged ${tagName} (${tagId})`);
    return;
  }
  const created = await bd("/emails", { method: "POST", body: payload });
  sent[mode] = { ...(sent[mode] || {}), [email.key]: created.id || new Date().toISOString() };
  await writeFile(SENT_PATH, JSON.stringify(sent, null, 2) + "\n");
  console.error(`Sent ${mode} ${email.key} to ${subs.count} subscriber(s) tagged ${tagName}; Buttondown id ${created.id}`);
}

main().catch((err) => {
  console.error("send-subscribers failed:", err.message);
  process.exit(1);
});
