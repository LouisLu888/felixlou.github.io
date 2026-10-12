#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Step 4: email the day's issue
// ============================================================================
// Renders public/ai-practice/data/issues/<date>.json as an HTML + plain-text
// email and sends it through Resend. state/sent.json records which dates were
// emailed, so reruns of the workflow never send the same issue twice.
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

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DATA_DIR = join(ROOT, "..", "public", "ai-practice", "data");
const SENT_PATH = join(ROOT, "state", "sent.json");
const SITE_URL = "https://www.jiabinlu.com/ai-practice/";
// Resend lets the shared resend.dev domain send only to the account owner's
// own address, which is exactly this use case. A verified domain is needed
// before sending to anyone else.
const DEFAULT_FROM = "AI 实干派 <digest@resend.dev>";

const FACT_LABELS = {
  default: ["谁·场景", "怎么用", "结果", "你可以试", "注意"],
  perspective: ["谁说的", "核心观点", "依据", "对你的意义", "争议·条件"],
};

const C = {
  bg: "#F7F3EC",
  card: "#FFFDF8",
  text: "#2A2420",
  text2: "#5E544B",
  muted: "#8C8177",
  border: "#E3DACD",
  accent: "#B4532A",
  soft: "#F6E3D8",
  fact: "#F0EAE0",
};

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Same minimal Markdown as the site: paragraphs, **bold**, [text](url).
function mdToHtml(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((para) => {
      let h = esc(para.trim());
      h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2" style="color:${C.accent}">$1</a>`);
      h = h.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.text}">$1</strong>`);
      return h ? `<p style="margin:0 0 12px;font-size:16px;line-height:1.75;color:${C.text2}">${h.replace(/\n/g, "<br>")}</p>` : "";
    })
    .join("");
}

function mdToText(text) {
  return String(text ?? "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1（$2）")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

function factsRows(it) {
  const labels = FACT_LABELS[it.category] || FACT_LABELS.default;
  return [it.who, it.how, it.result, it.tryThis, it.caveat]
    .map((v, i) => [labels[i], v])
    .filter(([, v]) => v);
}

function oneLiners(issue) {
  // tldr predates oneLiner; trust it only when it lines up with the items.
  const tldrOk = issue.tldr?.length === issue.items.length;
  return issue.items.map((it, i) => it.oneLiner || (tldrOk ? issue.tldr[i].text : it.headline));
}

function renderHtml(issue, number, catName) {
  const issueUrl = `${SITE_URL}#/d/${issue.date}`;
  const lines = oneLiners(issue);
  const tag = (cat) =>
    `<span style="display:inline-block;font-size:12px;font-weight:600;color:${C.accent};background:${C.soft};border-radius:4px;padding:0 6px;line-height:20px">${esc(catName(cat))}</span>`;

  const items = issue.items
    .map(
      (it, i) => `
    <tr><td style="padding:24px 0 8px;border-top:1px solid ${C.border}">
      <div style="font-size:13px;color:${C.muted}">${tag(it.category)} &nbsp;${esc(it.kind)} · ${esc(it.eventDate)}${it.region ? ` · ${esc(it.region)}` : ""}</div>
      <h2 style="margin:8px 0 12px;font-size:20px;line-height:1.4;color:${C.text};font-family:'Songti SC','Noto Serif SC',Georgia,serif">${String(i + 1).padStart(2, "0")}｜${esc(it.headline)}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fact};border-radius:8px;margin:0 0 14px">
        ${factsRows(it)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 10px 6px 12px;font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px 6px 0;font-size:14px;line-height:1.6;color:${C.text2}">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      ${mdToHtml(it.body)}
      <div style="font-size:13px;color:${C.muted}">原文：${(it.sources || [])
        .map((s) => `<a href="${esc(s.url)}" style="color:${C.accent};margin-right:10px">${esc(s.label)}</a>`)
        .join("")}</div>
    </td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(issue.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${C.card};border:1px solid ${C.border};border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Noto Sans SC','Microsoft YaHei',sans-serif">
  <tr><td style="padding:24px 24px 0">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><img src="${SITE_URL}logo.png" width="36" height="36" alt="干" style="display:block;border:0"></td>
      <td style="vertical-align:middle;padding-left:10px">
        <div style="font-size:18px;font-weight:700;color:${C.text};font-family:'Songti SC','Noto Serif SC',Georgia,serif">AI 实干派</div>
        <div style="font-size:12px;color:${C.muted}">看真正用 AI 拿到结果的人怎么做</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:20px 24px 0">
    <div style="font-size:13px;color:${C.muted}">${String(number).padStart(3, "0")} · ${esc(issue.date)} · 约 ${issue.readingMinutes ?? "?"} 分钟读完 · <a href="${issueUrl}" style="color:${C.accent}">网页版</a></div>
    <h1 style="margin:6px 0 16px;font-size:24px;line-height:1.4;color:${C.text};font-family:'Songti SC','Noto Serif SC',Georgia,serif">${esc(issue.title)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:10px">
      <tr><td style="padding:12px 16px 4px;font-size:14px;font-weight:600;color:${C.text}">30 秒速读</td></tr>
      ${issue.items
        .map(
          (it, i) =>
            `<tr><td style="padding:4px 16px 8px;font-size:15px;line-height:1.6;color:${C.text2}">${tag(it.category)} &nbsp;${esc(lines[i])}</td></tr>`,
        )
        .join("")}
      <tr><td style="padding:0 0 6px"></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:8px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table></td></tr>
  ${
    issue.action
      ? `<tr><td style="padding:12px 24px 0"><div style="background:${C.soft};border-left:4px solid ${C.accent};border-radius:8px;padding:14px 16px">
      <div style="font-size:15px;font-weight:600;color:${C.text};margin-bottom:6px">今天可以做的一件事</div>
      <div style="font-size:15px;line-height:1.7;color:${C.text2}">${esc(issue.action)}</div></div></td></tr>`
      : ""
  }
  <tr><td style="padding:20px 24px 24px;font-size:12px;line-height:1.7;color:${C.muted}">
    收入和效果按本人披露的口径呈现，不等于审计；每条都附原文链接。<br>
    <a href="${SITE_URL}" style="color:${C.accent}">在网站上按栏目查看往期</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function renderText(issue, number, catName) {
  const lines = oneLiners(issue);
  const out = [
    `AI 实干派 ${String(number).padStart(3, "0")} · ${issue.date} · 约 ${issue.readingMinutes ?? "?"} 分钟读完`,
    issue.title,
    `网页版：${SITE_URL}#/d/${issue.date}`,
    "",
    "30 秒速读",
    ...issue.items.map((it, i) => `- [${catName(it.category)}] ${lines[i]}`),
  ];
  issue.items.forEach((it, i) => {
    out.push("", "=====", `${String(i + 1).padStart(2, "0")}｜${it.headline}`, `${catName(it.category)} · ${it.kind} · ${it.eventDate}`, "");
    for (const [k, v] of factsRows(it)) out.push(`${k}：${v}`);
    out.push("", mdToText(it.body), "", `原文：${(it.sources || []).map((s) => s.url).join("  ")}`);
  });
  if (issue.action) out.push("", "=====", "今天可以做的一件事", issue.action);
  return out.join("\n");
}

async function main() {
  const date = arg("--date") || todayPacific();
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");

  const issuePath = join(DATA_DIR, "issues", `${date}.json`);
  if (!existsSync(issuePath)) {
    console.error(`No issue for ${date}; nothing to send`);
    return;
  }
  const sent = existsSync(SENT_PATH) ? JSON.parse(await readFile(SENT_PATH, "utf-8")) : {};
  if (sent[date] && !force && !dryRun) {
    console.error(`Issue ${date} already emailed at ${sent[date]}; pass --force to resend`);
    return;
  }

  const [issue, index, categories] = await Promise.all([
    readFile(issuePath, "utf-8").then(JSON.parse),
    readFile(join(DATA_DIR, "index.json"), "utf-8").then(JSON.parse),
    readFile(join(ROOT, "config", "categories.json"), "utf-8").then(JSON.parse),
  ]);
  if (!issue.items.length) {
    console.error(`Issue ${date} has no items; nothing to send`);
    return;
  }
  const number = index.days.find((d) => d.date === date)?.number ?? 0;
  const names = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const catName = (id) => names[id] || id;

  const subject = `AI 实干派 ${String(number).padStart(3, "0")}｜${issue.title}`;
  const html = renderHtml(issue, number, catName);
  const text = renderText(issue, number, catName);

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

main().catch((err) => {
  console.error("send-email failed:", err.message);
  process.exit(1);
});
