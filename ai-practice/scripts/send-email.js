#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Step 4: email the day's issue to Louis
// ============================================================================
// Renders public/ai-practice/data/issues/<date>.json (lib/email.js) and sends
// it through Resend. state/sent.json records which dates were emailed, so
// reruns of the workflow never send the same issue twice. Subscribers get
// their copy separately, through Buttondown (send-subscribers.js).
//
// Usage: node send-email.js [--date YYYY-MM-DD] [--force] [--dry-run]
//   --force    send even if this date was already emailed
//   --dry-run  write the rendered email to state/email-preview.html, send nothing
// Env: RESEND_API_KEY, NEWSLETTER_TO (comma-separated), optional NEWSLETTER_FROM
// ============================================================================

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { todayPacific } from "./lib/dates.js";
import { renderDailyEmail } from "./lib/email.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DATA_DIR = join(ROOT, "..", "public", "ai-practice", "data");
const SENT_PATH = join(ROOT, "state", "sent.json");
// Resend lets the shared resend.dev domain send only to the account owner's
// own address, which is exactly this use case. A verified domain is needed
// before sending to anyone else.
const DEFAULT_FROM = "AI 实干派 <digest@resend.dev>";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

export async function loadIssueContext(date) {
  const issuePath = join(DATA_DIR, "issues", `${date}.json`);
  if (!existsSync(issuePath)) return null;
  const [issue, index, categories] = await Promise.all([
    readFile(issuePath, "utf-8").then(JSON.parse),
    readFile(join(DATA_DIR, "index.json"), "utf-8").then(JSON.parse),
    readFile(join(ROOT, "config", "categories.json"), "utf-8").then(JSON.parse),
  ]);
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return {
    issue,
    index,
    number: index.days.find((d) => d.date === date)?.number ?? 0,
    catName: (id) => names[id] || id,
  };
}

async function main() {
  const date = arg("--date") || todayPacific();
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");

  const ctx = await loadIssueContext(date);
  if (!ctx) {
    console.error(`No issue for ${date}; nothing to send`);
    return;
  }
  const sent = existsSync(SENT_PATH) ? JSON.parse(await readFile(SENT_PATH, "utf-8")) : {};
  if (sent[date] && !force && !dryRun) {
    console.error(`Issue ${date} already emailed at ${sent[date]}; pass --force to resend`);
    return;
  }
  if (!ctx.issue.items.length) {
    console.error(`Issue ${date} has no items; nothing to send`);
    return;
  }

  const { subject, html, text } = renderDailyEmail(ctx.issue, ctx.number, ctx.catName);

  if (dryRun) {
    const previewPath = join(ROOT, "state", "email-preview.html");
    await writeFile(previewPath, html);
    console.error(`Dry run: subject "${subject}"; preview at ${previewPath}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.NEWSLETTER_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) throw new Error("RESEND_API_KEY and NEWSLETTER_TO are required");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from: process.env.NEWSLETTER_FROM || DEFAULT_FROM, to, subject, html, text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend API ${res.status}: ${body.message || JSON.stringify(body)}`);

  sent[date] = new Date().toISOString();
  await writeFile(SENT_PATH, JSON.stringify(sent, null, 2) + "\n");
  console.error(`Emailed issue ${date} to ${to.length} recipient(s), Resend id ${body.id}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("send-email failed:", err.message);
    process.exit(1);
  });
}
