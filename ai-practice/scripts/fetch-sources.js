#!/usr/bin/env node

// ============================================================================
// AI 实战派 — Step 1: fetch sources
// ============================================================================
// Reads config/sources.json, pulls every feed, keeps items published inside
// the lookback window that we have not seen before, and writes the day's
// candidate pool to state/candidates/<date>.json.
//
// Dedup: state/seen.json maps item URL → first-seen timestamp. Entries older
// than SEEN_TTL_DAYS are pruned. An item is marked seen only after it lands in
// a candidate file, so a failed run does not lose content.
//
// Usage: node fetch-sources.js [--date YYYY-MM-DD]
// ============================================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { fetchArticleText } from "./lib/feeds.js";
import { fetchSourceItems, fetchYouTubeDescription } from "./lib/sources.js";
import { todayPacific } from "./lib/dates.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SOURCES_PATH = join(ROOT, "config", "sources.json");
const SEEN_PATH = join(ROOT, "state", "seen.json");
const CANDIDATES_DIR = join(ROOT, "state", "candidates");

// Podcasts and long videos publish weekly; newsletters and blogs daily.
const LOOKBACK_HOURS = 7 * 24;
const DEFAULT_MAX_ITEMS = 3;
// Longer than LOOKBACK_HOURS so an item can never re-enter after being forgotten.
const SEEN_TTL_DAYS = 30;
// Keeps the curate prompt bounded; the editor model only needs enough to judge.
const MAX_TEXT_CHARS = 10000;

function argDate() {
  const i = process.argv.indexOf("--date");
  return i !== -1 ? process.argv[i + 1] : todayPacific();
}

async function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const date = argDate();
  const { sources } = JSON.parse(await readFile(SOURCES_PATH, "utf-8"));
  const seen = await loadJson(SEEN_PATH, {});
  const cutoff = Date.now() - LOOKBACK_HOURS * 3600 * 1000;
  const candidates = [];
  const errors = [];

  for (const source of sources) {
    try {
      const raw = await fetchSourceItems(source);

      // Some podcast feeds (Flightcast) carry only an .mp3 enclosure, no episode
      // page. Readers need a page, so build one from the source's template.
      for (const it of raw) {
        if (!it.url && source.episodeLinkTemplate) {
          it.url = source.episodeLinkTemplate.replace("{title}", encodeURIComponent(it.title));
        }
        if (!it.url) it.url = it.audioUrl;
      }

      const skip = source.skipUrlPattern ? new RegExp(source.skipUrlPattern) : null;
      const fresh = raw
        .filter((it) => it.url && !seen[it.url])
        .filter((it) => !skip || !skip.test(it.url))
        .filter((it) => !it.publishedAt || new Date(it.publishedAt).getTime() >= cutoff)
        .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
        // follow-builders bundles many builders; let it contribute more items.
        .slice(0, source.type === "follow-builders" ? 40 : source.maxItems || DEFAULT_MAX_ITEMS);

      // Summary-only feeds: pull the article page (or the video description)
      // so the editor sees specifics, not just a title.
      if (source.fullText || source.type === "youtube") {
        for (const it of fresh) {
          try {
            const full =
              source.type === "youtube" ? await fetchYouTubeDescription(it.url) : await fetchArticleText(it.url);
            if (full.length > (it.text || "").length) it.text = full;
          } catch (err) {
            console.error(`    full text failed for ${it.url}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      for (const it of fresh) {
        candidates.push({
          id: `c${candidates.length + 1}`,
          source: source.name,
          sourceType: source.type,
          categoryHint: source.category,
          region: source.region,
          title: it.title,
          url: it.url,
          publishedAt: it.publishedAt,
          author: it.author || "",
          text: (it.text || "").slice(0, MAX_TEXT_CHARS),
          ...(it.engagement ? { engagement: it.engagement } : {}),
        });
      }
      console.error(`  ${source.name}: ${raw.length} items, ${fresh.length} new`);
    } catch (err) {
      errors.push(`${source.name}: ${err.message}`);
      console.error(`  ${source.name}: FAILED ${err.message}`);
    }
  }

  await mkdir(CANDIDATES_DIR, { recursive: true });
  const outPath = join(CANDIDATES_DIR, `${date}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      { date, generatedAt: new Date().toISOString(), count: candidates.length, errors, candidates },
      null,
      2,
    ),
  );

  // Mark seen only after the candidate file is safely written.
  const now = Date.now();
  for (const c of candidates) seen[c.url] = now;
  const ttlCutoff = now - SEEN_TTL_DAYS * 86400 * 1000;
  for (const [url, ts] of Object.entries(seen)) if (ts < ttlCutoff) delete seen[url];
  await writeFile(SEEN_PATH, JSON.stringify(seen, null, 2));

  console.error(`Wrote ${candidates.length} candidates to ${outPath} (${errors.length} source errors)`);
  // Only a total wipe-out is fatal; individual source failures are expected.
  if (candidates.length === 0 && errors.length === sources.length) process.exit(1);
}

main().catch((err) => {
  console.error("fetch-sources failed:", err);
  process.exit(1);
});
