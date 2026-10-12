#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Step 3: build site indexes and publish
// ============================================================================
// Scans public/ai-practice/data/issues/*.json and writes:
// - data/index.json: one row per day (newest first) + category counts
// - data/categories/<id>.json: every item in that category, newest first
//
// Then mirrors public/ai-practice/ into docs/ai-practice/. jiabinlu.com is
// served straight from docs/ on master, so the daily Action can publish
// without running the blog's Vite build. public/ stays the source of truth:
// a later `npm run build` empties docs/ and recopies it from public/.
// ============================================================================

import { readFile, writeFile, readdir, mkdir, cp, rm } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { issueReadingMinutes } from "./lib/reading.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SITE_DIR = join(ROOT, "..", "public", "ai-practice");
const PUBLISHED_DIR = join(ROOT, "..", "docs", "ai-practice");
const DATA_DIR = join(SITE_DIR, "data");
const ISSUES_DIR = join(DATA_DIR, "issues");
const CATEGORY_DIR = join(DATA_DIR, "categories");

async function main() {
  const categories = JSON.parse(await readFile(join(ROOT, "config", "categories.json"), "utf-8"));
  const files = (await readdir(ISSUES_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();

  const days = [];
  const byCategory = Object.fromEntries(categories.map((c) => [c.id, []]));

  // Issue number = chronological position, so the first issue is 001.
  const total = files.length;
  for (const [i, file] of files.entries()) {
    const issue = JSON.parse(await readFile(join(ISSUES_DIR, file), "utf-8"));
    const number = total - i;
    const counts = {};
    for (const item of issue.items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
      byCategory[item.category]?.push({ ...item, issueDate: issue.date, issueNumber: number });
    }
    days.push({
      date: issue.date,
      number,
      title: issue.title,
      sample: Boolean(issue.sample),
      // Older issues predate the budget check, so compute when missing.
      readingMinutes: issue.readingMinutes ?? Math.ceil(issueReadingMinutes(issue)),
      itemCount: issue.items.length,
      categoryCounts: counts,
      headlines: issue.items.map((it) => ({ category: it.category, headline: it.headline })),
    });
  }

  await mkdir(CATEGORY_DIR, { recursive: true });
  for (const c of categories) {
    await writeFile(
      join(CATEGORY_DIR, `${c.id}.json`),
      JSON.stringify({ category: c, items: byCategory[c.id] }, null, 2),
    );
  }

  await writeFile(
    join(DATA_DIR, "index.json"),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        categories: categories.map((c) => ({ ...c, count: byCategory[c.id].length })),
        days,
      },
      null,
      2,
    ),
  );
  console.error(`Indexed ${days.length} issues, ${Object.values(byCategory).flat().length} items`);

  await rm(PUBLISHED_DIR, { recursive: true, force: true });
  await cp(SITE_DIR, PUBLISHED_DIR, { recursive: true });
  console.error(`Mirrored site to ${PUBLISHED_DIR}`);
}

main().catch((err) => {
  console.error("build-index failed:", err);
  process.exit(1);
});
