#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Open Graph share cards
// ============================================================================
// Renders public/ai-practice/og/<date>.png (1200x630) for every issue that
// does not have one yet, plus og/default.png, by screenshotting an HTML card
// with headless Chrome. Existing PNGs are never re-rendered unless --force.
//
// Chrome: $CHROME_BIN, else the macOS app path, else `google-chrome` (present
// on GitHub's Ubuntu runners). Chinese text needs a CJK font; the workflow
// installs fonts-noto-cjk. If Chrome is missing, this exits 0 with a warning
// and pages fall back to og/default.png (or no image when that is missing).
//
// Usage: node og-images.js [--force]   (build-index.js --og calls this too)
// ============================================================================

import { readFile, writeFile, readdir, mkdir, mkdtemp, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { BRAND, TAGLINE, esc, pad3, fmtDateZh } from "./lib/render.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SITE_DIR = join(ROOT, "..", "public", "ai-practice");
const OG_DIR = join(SITE_DIR, "og");
const LOGO = join(SITE_DIR, "logo.svg");

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      execFileSync(c, ["--version"], { stdio: "ignore" });
      return c;
    } catch {
      // try the next one
    }
  }
  return null;
}

function cardHtml({ title, eyebrow, chips }) {
  const logo = `file://${LOGO}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#F7F3EC;font-family:"PingFang SC","Noto Sans CJK SC","Noto Sans SC",sans-serif;color:#2A2420}
  .card{position:absolute;inset:0;padding:64px 72px;box-sizing:border-box;display:flex;flex-direction:column}
  .top{display:flex;align-items:center;gap:22px}
  .top img{width:96px;height:96px}
  .brand{font-family:"Songti SC","Noto Serif CJK SC","Noto Serif SC",serif;font-weight:700;font-size:46px;line-height:1.1}
  .tag{font-size:24px;color:#8C8177;margin-top:6px}
  .eyebrow{margin-top:44px;font-size:26px;color:#8C8177}
  .title{margin-top:14px;font-family:"Songti SC","Noto Serif CJK SC","Noto Serif SC",serif;font-weight:700;font-size:54px;line-height:1.32;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .chips{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap}
  .chip{font-size:22px;font-weight:600;color:#B4532A;background:#F6E3D8;border-radius:8px;padding:6px 14px}
  .bar{position:absolute;left:0;right:0;bottom:0;height:12px;background:#B23A1E}
</style></head><body><div class="card">
  <div class="top"><img src="${logo}"><div><div class="brand">${BRAND}</div><div class="tag">${TAGLINE}</div></div></div>
  ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ""}
  <div class="title">${esc(title)}</div>
  <div class="chips">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
</div><div class="bar"></div></body></html>`;
}

async function screenshot(chrome, html, outPath) {
  const dir = await mkdtemp(join(tmpdir(), "og-"));
  const htmlPath = join(dir, "card.html");
  await writeFile(htmlPath, html);
  const args = [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--allow-file-access-from-files", "--force-device-scale-factor=1",
    "--window-size=1200,630", `--screenshot=${outPath}`, `file://${htmlPath}`,
  ];
  execFileSync(chrome, args, { stdio: "ignore", timeout: 60000 });
  await rm(dir, { recursive: true, force: true });
  if (!existsSync(outPath)) throw new Error(`Chrome did not write ${outPath}`);
}

export async function generateShareCards({ force = false } = {}) {
  const chrome = findChrome();
  if (!chrome) {
    console.error("::warning::No Chrome found; skipping share cards (pages fall back to og/default.png)");
    return;
  }
  await mkdir(OG_DIR, { recursive: true });

  const [index, categories] = await Promise.all([
    readFile(join(SITE_DIR, "data", "index.json"), "utf-8").then(JSON.parse),
    readFile(join(ROOT, "config", "categories.json"), "utf-8").then(JSON.parse),
  ]);
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const defaultPath = join(OG_DIR, "default.png");
  if (force || !existsSync(defaultPath)) {
    await screenshot(chrome, cardHtml({ title: "每天 15 分钟，看几个真实的人怎么用 AI 拿到结果", eyebrow: "", chips: categories.map((c) => c.name) }), defaultPath);
    console.error("  og/default.png");
  }

  let made = 0;
  for (const day of index.days) {
    const out = join(OG_DIR, `${day.date}.png`);
    if (!force && existsSync(out)) continue;
    const chips = [...new Set(day.headlines.map((h) => names[h.category] || h.category))];
    await screenshot(
      chrome,
      cardHtml({ title: day.title, eyebrow: `${pad3(day.number)} · ${fmtDateZh(day.date)} · 约 ${day.readingMinutes} 分钟读完`, chips }),
      out,
    );
    console.error(`  og/${day.date}.png`);
    made++;
  }
  console.error(`Share cards: ${made} new`);
}

// CLI entry. Share cards are nice to have; never fail the publish over them.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generateShareCards({ force: process.argv.includes("--force") }).catch((err) =>
    console.error("::warning::og-images failed:", err.message),
  );
}
