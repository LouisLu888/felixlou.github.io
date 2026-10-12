#!/usr/bin/env node

// ============================================================================
// AI 实干派 — source health check
// ============================================================================
// Fetches every source in config/sources.json and reports item count, newest
// item date and errors. Read-only: does not touch state/seen.json.
//
// Usage: node check-sources.js [--json]
// ============================================================================

import { readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { fetchSourceItems } from "./lib/sources.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

async function main() {
  const { sources } = JSON.parse(await readFile(join(ROOT, "config", "sources.json"), "utf-8"));
  const results = await Promise.all(
    sources.map(async (s) => {
      try {
        const items = await fetchSourceItems(s);
        const dates = items.map((i) => i.publishedAt).filter(Boolean).sort();
        return { name: s.name, category: s.category, ok: items.length > 0, items: items.length, newest: dates.at(-1)?.slice(0, 10) || null };
      } catch (err) {
        return { name: s.name, category: s.category, ok: false, error: err.message };
      }
    }),
  );

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  for (const r of results) {
    const status = r.ok ? `OK   ${String(r.items).padStart(4)} items, newest ${r.newest}` : `FAIL ${r.error || "0 items"}`;
    console.log(`${(r.category || "-").padEnd(13)} ${r.name.padEnd(34)} ${status}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} sources OK`);
}

main();
