#!/usr/bin/env node

// ============================================================================
// AI 实干派 — source hit rates
// ============================================================================
// For every source in config/sources.json: how many candidates it supplied,
// how often screening shortlisted it, how often it reached the published
// issue, and when it last did. Sources that never get published are the ones
// to prune at the week-6 review.
//
// Reads issue JSON only (candidate pools are not committed). Issues curated
// before 2026-10-12 lack per-source candidate and shortlist data, so those
// columns start counting from then; published counts cover every issue.
//
// Writes ai-practice/state/source-stats.md. build-index.js runs this on every
// build; run it alone with: node source-stats.js
// ============================================================================

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ISSUES_DIR = join(ROOT, "..", "public", "ai-practice", "data", "issues");
const OUT = join(ROOT, "state", "source-stats.md");

export function computeSourceStats({ issues, sources }) {
  const rows = new Map(
    sources.map((s) => [s.name, { name: s.name, category: s.category || "-", candidates: 0, shortlisted: 0, published: 0, lastPublished: null }]),
  );
  const row = (name) => {
    if (!rows.has(name)) rows.set(name, { name, category: "（已移除）", candidates: 0, shortlisted: 0, published: 0, lastPublished: null });
    return rows.get(name);
  };
  let trackedIssues = 0;
  for (const issue of issues) {
    if (issue.sample) continue;
    const bySource = issue.meta?.candidatesBySource;
    if (bySource) {
      trackedIssues++;
      for (const [name, n] of Object.entries(bySource)) row(name).candidates += n;
    }
    for (const s of issue.meta?.shortlist || []) if (s.source) row(s.source).shortlisted++;
    for (const item of issue.items) {
      // One credit per source per item, even if an item cites it twice.
      for (const label of new Set((item.sources || []).map((s) => s.label))) {
        const r = row(label);
        r.published++;
        if (!r.lastPublished || issue.date > r.lastPublished) r.lastPublished = issue.date;
      }
    }
  }
  const list = [...rows.values()].sort((a, b) => b.published - a.published || b.shortlisted - a.shortlisted || b.candidates - a.candidates);
  const realIssues = issues.filter((i) => !i.sample).length;
  return { list, realIssues, trackedIssues };
}

export function renderSourceStats({ list, realIssues, trackedIssues }) {
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "-");
  const never = list.filter((r) => r.published === 0 && r.category !== "（已移除）");
  const lines = [
    "# AI 实干派 · 来源命中率",
    "",
    `统计范围：${realIssues} 期（不含样刊）。候选数和初筛数从有记录的 ${trackedIssues} 期开始累计。`,
    "",
    "| 来源 | 栏目 | 候选 | 初筛入选 | 成稿 | 成稿率 | 最近成稿 |",
    "|---|---|---|---|---|---|---|",
    ...list.map(
      (r) => `| ${r.name} | ${r.category} | ${r.candidates} | ${r.shortlisted} | ${r.published} | ${pct(r.published, r.candidates)} | ${r.lastPublished || "-"} |`,
    ),
    "",
    `从未成稿的来源：${never.length} 个。第 6 周复盘时，候选多而成稿为 0 的来源优先降权或移除。`,
    "",
  ];
  return lines.join("\n");
}

export async function writeSourceStats({ issues, sources }) {
  await writeFile(OUT, renderSourceStats(computeSourceStats({ issues, sources })));
}

// CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { sources } = JSON.parse(await readFile(join(ROOT, "config", "sources.json"), "utf-8"));
  const files = (await readdir(ISSUES_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
  const issues = await Promise.all(files.map(async (f) => JSON.parse(await readFile(join(ISSUES_DIR, f), "utf-8"))));
  await writeSourceStats({ issues, sources });
  console.log(await readFile(OUT, "utf-8"));
}
