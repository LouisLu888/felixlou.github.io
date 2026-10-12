#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Step 3: build indexes, static pages, and publish
// ============================================================================
// 1. Editor notes: ai-practice/notes/<date>.md is merged into that issue's
//    JSON as `editorNote` (deleting the file removes it again).
// 2. Indexes: data/index.json (one row per day, newest first) and
//    data/categories/<id>.json (every item in that category).
// 3. Source hit rates: ai-practice/state/source-stats.md.
// 4. Share cards (only with --og): og/<date>.png via og-images.js.
// 5. Static pages: the home page, d/<date>/, i/<item-id>/, c/ and c/<category>/, subscribe/,
//    plus sitemap.xml, feed.xml and the site-wide robots.txt.
// 6. Mirror public/ai-practice/ into docs/ai-practice/. jiabinlu.com is
//    served straight from docs/ on master, so the daily Action can publish
//    without running the blog's Vite build. public/ stays the source of
//    truth: a later `npm run build` empties docs/ and recopies from public/.
//
// Usage: node build-index.js [--og]
// ============================================================================

import { readFile, writeFile, readdir, mkdir, cp, rm } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { issueReadingMinutes } from "./lib/reading.js";
import { issuePath, itemPath, categoryPath, subscribePath, ogImagePath, DEFAULT_OG_IMAGE, BASE_PATH, SITE_ORIGIN } from "./lib/render.js";
import { renderHomePage, renderCategoriesIndex, renderIssuePage, renderItemPage, renderCategoryPage, renderSubscribePage, renderSitemap, renderRss } from "./lib/pages.js";
import { writeSourceStats } from "./source-stats.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPO = join(ROOT, "..");
const SITE_DIR = join(REPO, "public", "ai-practice");
const PUBLISHED_DIR = join(REPO, "docs", "ai-practice");
const DATA_DIR = join(SITE_DIR, "data");
const ISSUES_DIR = join(DATA_DIR, "issues");
const CATEGORY_DIR = join(DATA_DIR, "categories");
const NOTES_DIR = join(ROOT, "notes");
const RSS_ISSUES = 30;

async function writePage(urlPath, html) {
  // urlPath is under /ai-practice/, e.g. /ai-practice/d/2026-10-11/
  const file = join(SITE_DIR, urlPath.slice(BASE_PATH.length), "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function mergeEditorNote(issue, file) {
  const notePath = join(NOTES_DIR, `${issue.date}.md`);
  const note = existsSync(notePath) ? (await readFile(notePath, "utf-8")).trim() : "";
  if ((issue.editorNote || "") === note) return false;
  if (note) issue.editorNote = note;
  else delete issue.editorNote;
  await writeFile(join(ISSUES_DIR, file), JSON.stringify(issue, null, 2));
  return true;
}

async function main() {
  const withOg = process.argv.includes("--og");
  const categories = JSON.parse(await readFile(join(ROOT, "config", "categories.json"), "utf-8"));
  const { sources } = JSON.parse(await readFile(join(ROOT, "config", "sources.json"), "utf-8"));
  const files = (await readdir(ISSUES_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();

  // 1-2. Notes and indexes
  const issues = [];
  const days = [];
  const byCategory = Object.fromEntries(categories.map((c) => [c.id, []]));
  const total = files.length; // issue number = chronological position, first is 001
  let notesChanged = 0;
  for (const [i, file] of files.entries()) {
    const issue = JSON.parse(await readFile(join(ISSUES_DIR, file), "utf-8"));
    if (await mergeEditorNote(issue, file)) notesChanged++;
    issues.push(issue);
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
      hasEditorNote: Boolean(issue.editorNote),
      // Older issues predate the budget check, so compute when missing.
      readingMinutes: issue.readingMinutes ?? Math.ceil(issueReadingMinutes(issue)),
      itemCount: issue.items.length,
      categoryCounts: counts,
      headlines: issue.items.map((it) => ({ category: it.category, headline: it.headline })),
    });
  }
  if (notesChanged) console.error(`Editor notes updated in ${notesChanged} issue(s)`);

  await mkdir(CATEGORY_DIR, { recursive: true });
  for (const c of categories) {
    await writeFile(join(CATEGORY_DIR, `${c.id}.json`), JSON.stringify({ category: c, items: byCategory[c.id] }, null, 2));
  }
  const catList = categories.map((c) => ({ ...c, count: byCategory[c.id].length }));
  await writeFile(
    join(DATA_DIR, "index.json"),
    JSON.stringify({ updatedAt: new Date().toISOString(), categories: catList, days }, null, 2),
  );
  console.error(`Indexed ${days.length} issues, ${Object.values(byCategory).flat().length} items`);

  // 3. Source hit rates
  await writeSourceStats({ issues, sources });

  // 4. Share cards
  if (withOg) {
    const { generateShareCards } = await import("./og-images.js");
    await generateShareCards().catch((err) => console.error("::warning::share cards failed:", err.message));
  }
  const cardFor = (date) =>
    existsSync(join(SITE_DIR, "og", `${date}.png`))
      ? ogImagePath(date)
      : existsSync(join(SITE_DIR, "og", "default.png"))
        ? DEFAULT_OG_IMAGE
        : `${BASE_PATH}logo.png`;

  // 5. Static pages. Regenerated from scratch so removed items disappear.
  for (const dir of ["d", "i", "c", "subscribe"]) await rm(join(SITE_DIR, dir), { recursive: true, force: true });
  const catById = Object.fromEntries(catList.map((c) => [c.id, c]));
  const sitemap = [{ path: BASE_PATH, lastmod: days[0]?.date }, { path: subscribePath() }];
  for (const [i, issue] of issues.entries()) {
    const day = days[i];
    const image = cardFor(issue.date);
    await writePage(
      issuePath(issue.date),
      renderIssuePage({ issue, day, newer: days[i - 1], older: days[i + 1], catById, categories: catList, image }),
    );
    sitemap.push({ path: issuePath(issue.date), lastmod: issue.date });
    for (const item of issue.items) {
      await writePage(itemPath(item.id), renderItemPage({ issue, day, item, catById, categories: catList, image }));
      sitemap.push({ path: itemPath(item.id), lastmod: issue.date });
    }
  }
  for (const c of catList) {
    await writePage(categoryPath(c.id), renderCategoryPage({ category: c, items: byCategory[c.id], catById, categories: catList }));
    sitemap.push({ path: categoryPath(c.id), lastmod: byCategory[c.id][0]?.issueDate });
  }
  await writePage(subscribePath(), renderSubscribePage({ categories: catList }));
  // Home and category overview are static too, so every URL a reader can
  // copy from the address bar is a clean, indexable permalink.
  await writePage(BASE_PATH, renderHomePage({ days, categories: catList, catById }));
  await writePage(`${BASE_PATH}c/`, renderCategoriesIndex({ categories: catList }));
  sitemap.push({ path: `${BASE_PATH}c/`, lastmod: days[0]?.date });
  await writeFile(join(SITE_DIR, "sitemap.xml"), renderSitemap(sitemap));
  await writeFile(join(SITE_DIR, "feed.xml"), renderRss({ issues: issues.slice(0, RSS_ISSUES), days, catById }));
  // robots.txt lives at the site root; public/ is the source, docs/ the live copy.
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}${BASE_PATH}sitemap.xml\n`;
  await writeFile(join(REPO, "public", "robots.txt"), robots);
  await writeFile(join(REPO, "docs", "robots.txt"), robots);
  console.error(`Static pages: ${sitemap.length} URLs in sitemap`);

  // 6. Publish
  await rm(PUBLISHED_DIR, { recursive: true, force: true });
  await cp(SITE_DIR, PUBLISHED_DIR, { recursive: true });
  console.error(`Mirrored site to ${PUBLISHED_DIR}`);
}

main().catch((err) => {
  console.error("build-index failed:", err);
  process.exit(1);
});
