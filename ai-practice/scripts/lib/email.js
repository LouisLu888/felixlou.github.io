// ============================================================================
// Email rendering for AI 实干派: the daily issue and the weekly digest.
// Inline styles and tables only, so Gmail, Outlook and Apple Mail agree.
// Used by send-email.js (Resend, to Louis) and send-subscribers.js
// (Buttondown, to subscribers).
// ============================================================================

import {
  SITE_URL, BRAND, TAGLINE, issuePath, itemPath, subscribePath, absolute,
  esc, pad3, mdToHtml, mdToText, oneLiners, FACT_LABELS,
} from "./render.js";
import { ZH_CHARS_PER_MIN } from "./reading.js";

const C = {
  bg: "#F7F3EC", card: "#FFFDF8", text: "#2A2420", text2: "#5E544B", muted: "#8C8177",
  border: "#E3DACD", accent: "#B4532A", soft: "#F6E3D8", fact: "#F0EAE0",
};
const FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Noto Sans SC','Microsoft YaHei',sans-serif";
const SERIF = "'Songti SC','Noto Serif SC',Georgia,serif";

const md = (text) =>
  mdToHtml(text, {
    pStyle: `margin:0 0 12px;font-size:17px;line-height:1.8;color:${C.text2}`,
    aStyle: `color:${C.accent}`,
    strongStyle: `color:${C.text}`,
  });

const tag = (name) =>
  `<span style="display:inline-block;font-size:13px;font-weight:600;color:${C.accent};background:${C.soft};border-radius:4px;padding:0 6px;line-height:22px">${esc(name)}</span>`;

// Hidden preview text: the line inbox lists show under the subject. The
// trailing zero-width padding stops clients from appending body text to it.
function preheaderHtml(text) {
  if (!text) return "";
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(text)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;
}

// Two wrappers around the same content rows:
// - standalone (Resend, to Louis): a full HTML document, one plain column up
//   to 640px with a 16px gutter. No card or nested background, which on a
//   phone used to eat 70px of width on each side.
// - embedded (Buttondown): just the rows. Buttondown already puts the subject,
//   byline, a forwarded-copy line and its own column around the body, so any
//   frame of ours would nest a second, narrower column inside it.
function frame(inner, { preheader = "", embedded = false } = {}) {
  const footer = `
  <tr><td style="padding:28px 0 0;font-size:16px;line-height:1.75;color:${C.text2}">
    哪条对你有用、哪条没用，直接回复这封邮件告诉我，每封我都会看。
  </td></tr>
  <tr><td style="padding:12px 0 8px;font-size:13px;line-height:1.7;color:${C.muted}">
    收入和效果按本人披露的口径呈现，不等于审计；每条都附原文链接。<br>
    ${embedded ? "" : `朋友转发给你的？<a href="${absolute(subscribePath())}" style="color:${C.accent}">在这里订阅</a> · `}<a href="${SITE_URL}" style="color:${C.accent}">按栏目查看往期</a>
  </td></tr>`;
  const header = `
  <tr><td style="padding:0 0 4px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><img src="${SITE_URL}logo.png" width="32" height="32" alt="干" style="display:block;border:0"></td>
      <td style="vertical-align:middle;padding-left:10px">
        <div style="font-size:17px;font-weight:700;color:${C.text};font-family:${SERIF}">${BRAND}</div>
        <div style="font-size:13px;color:${C.muted}">${TAGLINE}</div>
      </td>
    </tr></table>
  </td></tr>`;
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${FONT};color:${C.text}">${header}${inner}${footer}</table>`;
  if (embedded) return `${preheaderHtml(preheader)}${table}`;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.card}">
${preheaderHtml(preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card}"><tr><td align="center" style="padding:24px 16px">
<div style="max-width:640px;margin:0 auto;text-align:left">${table}</div>
</td></tr></table>
</body></html>`;
}

function editorNoteHtml(issue) {
  if (!issue.editorNote) return "";
  return `<tr><td style="padding:16px 0 0"><div style="border-left:4px solid ${C.accent};padding:4px 0 4px 14px">
      <div style="font-size:16px;font-weight:600;color:${C.text};margin-bottom:6px">编辑按</div>${md(issue.editorNote)}</div></td></tr>`;
}

// Fact rows shown in the email. The lead item keeps its 可以试试 line; the
// rest are a quick scan, and the full write-up lives on the item page.
// Field order: who, how, result, tryThis, caveat.
function emailFacts(it, isLead) {
  const labels = FACT_LABELS[it.category] || FACT_LABELS.default;
  const keep = isLead ? [1, 2, 3, 4] : [1, 2, 4];
  const values = [it.who, it.how, it.result, it.tryThis, it.caveat];
  return keep.filter((i) => values[i]).map((i) => [labels[i], values[i]]);
}

// Subject: the lead item's headline, which curate.md keeps short and specific.
// The brand goes last so a truncated inbox line still shows the story.
export function dailySubject(issue) {
  const lead = issue.items[0]?.headline || issue.title;
  return `${lead}｜${BRAND}`;
}

function dailyPreheader(issue) {
  const rest = issue.items.slice(1).map((it) => it.headline);
  return rest.length ? `另有：${rest.join("；")}` : issue.title;
}

export function renderDailyEmail(issue, number, catName, { embedded = false } = {}) {
  const issueUrl = absolute(issuePath(issue.date));
  const lines = oneLiners(issue);
  const subject = dailySubject(issue);

  const items = issue.items
    .map((it, i) => {
      const facts = emailFacts(it, i === 0);
      return `
    <tr><td style="padding:26px 0 8px;border-top:1px solid ${C.border}">
      <div style="font-size:14px;color:${C.muted}">${tag(catName(it.category))} &nbsp;${i === 0 ? "头条 · " : ""}${esc(it.kind)} · ${esc(it.eventDate)}${it.region ? ` · ${esc(it.region)}` : ""}</div>
      <h2 style="margin:10px 0 10px;font-size:${i === 0 ? 23 : 20}px;line-height:1.45;font-family:${SERIF}"><a href="${absolute(itemPath(it.id))}" style="color:${C.text};text-decoration:none">${esc(it.headline)}</a></h2>
      <p style="margin:0 0 12px;font-size:17px;line-height:1.8;color:${C.text}">${esc(lines[i])}</p>
      ${facts
        .map(
          ([k, v]) =>
            `<p style="margin:0 0 10px;font-size:16px;line-height:1.75;color:${C.text2}"><span style="color:${C.accent};font-weight:600">${k}</span>&nbsp; ${esc(v)}</p>`,
        )
        .join("")}
      <div style="font-size:15px;line-height:1.7;color:${C.muted};margin-top:10px"><a href="${absolute(itemPath(it.id))}" style="color:${C.accent};font-weight:600;margin-right:14px">读全文 →</a>原文：${(it.sources || [])
        .map((s) => `<a href="${esc(s.url)}" style="color:${C.accent};margin-right:10px">${esc(s.label)}</a>`)
        .join("")}</div>
    </td></tr>`;
    })
    .join("");

  // Scan time for what the email itself shows (one-liners and fact lines).
  const shown = issue.items.reduce((n, it, i) => n + lines[i].length + emailFacts(it, i === 0).reduce((m, [, v]) => m + v.length, 0), 0);
  const minutes = Math.max(1, Math.round(shown / ZH_CHARS_PER_MIN));
  const inner = `
  <tr><td style="padding:20px 0 0">
    <div style="font-size:14px;line-height:1.7;color:${C.muted}">${pad3(number)} · ${esc(issue.date)} · ${issue.items.length} 条，约 ${minutes} 分钟看完 · <a href="${issueUrl}" style="color:${C.accent}">网页版全文</a></div>
    <h1 style="margin:6px 0 4px;font-size:21px;line-height:1.5;color:${C.text};font-family:${SERIF}">${esc(issue.title)}</h1>
  </td></tr>
  ${editorNoteHtml(issue)}
  <tr><td style="padding:8px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table></td></tr>
  ${
    issue.action
      ? `<tr><td style="padding:12px 0 0"><div style="background:${C.soft};border-left:4px solid ${C.accent};border-radius:8px;padding:14px 16px">
      <div style="font-size:17px;font-weight:600;color:${C.text};margin-bottom:6px">今天可以做的一件事</div>
      <div style="font-size:17px;line-height:1.8;color:${C.text2}">${esc(issue.action)}</div></div></td></tr>`
      : ""
  }`;

  const text = [
    `${BRAND} ${pad3(number)} · ${issue.date}`,
    issue.title,
    `网页版全文：${issueUrl}`,
    ...(issue.editorNote ? ["", "编辑按", mdToText(issue.editorNote)] : []),
  ];
  issue.items.forEach((it, i) => {
    text.push("", "=====", `${i === 0 ? "【头条】" : ""}${it.headline}`, `${catName(it.category)} · ${it.kind} · ${it.eventDate}`, "", lines[i]);
    for (const [k, v] of emailFacts(it, i === 0)) text.push(`${k}：${v}`);
    text.push(`读全文：${absolute(itemPath(it.id))}`, `原文：${(it.sources || []).map((s) => s.url).join("  ")}`);
  });
  if (issue.action) text.push("", "=====", "今天可以做的一件事", issue.action);
  text.push("", "哪条对你有用、哪条没用，直接回复这封邮件告诉我。", `订阅：${absolute(subscribePath())}`);

  return { subject, html: frame(inner, { preheader: dailyPreheader(issue), embedded }), text: text.join("\n") };
}

// Weekly digest: headline + one-liner per item, grouped by day, linking to the
// static pages. Short by design; full text stays on the site.
export function renderWeeklyEmail({ weekLabel, issues, numberOf, catName, embedded = false }) {
  const subject = `${BRAND} 每周精选｜${weekLabel}`;
  const days = issues
    .map((issue) => {
      const lines = oneLiners(issue);
      return `
  <tr><td style="padding:20px 0 0">
    <div style="font-size:14px;color:${C.muted}">${pad3(numberOf(issue.date))} · ${esc(issue.date)}</div>
    <h2 style="margin:4px 0 10px;font-size:19px;line-height:1.4;font-family:${SERIF}"><a href="${absolute(issuePath(issue.date))}" style="color:${C.text};text-decoration:none">${esc(issue.title)}</a></h2>
    ${issue.editorNote ? `<div style="border-left:3px solid ${C.accent};padding-left:10px;margin-bottom:10px">${md(issue.editorNote)}</div>` : ""}
    ${issue.items
      .map(
        (it, i) => `<div style="margin:0 0 14px;font-size:16px;line-height:1.75;color:${C.text2}">${tag(catName(it.category))} &nbsp;<a href="${absolute(itemPath(it.id))}" style="color:${C.text};font-weight:600;text-decoration:none">${esc(it.headline)}</a><br>${esc(lines[i])}</div>`,
      )
      .join("")}
  </td></tr>`;
    })
    .join("");
  const inner = `
  <tr><td style="padding:20px 0 0">
    <h1 style="margin:0 0 4px;font-size:24px;line-height:1.4;color:${C.text};font-family:${SERIF}">每周精选 · ${esc(weekLabel)}</h1>
    <div style="font-size:15px;color:${C.muted}">本周 ${issues.length} 期、${issues.reduce((n, i) => n + i.items.length, 0)} 条，点标题读全文。</div>
  </td></tr>
  ${days}`;
  const text = [
    subject,
    "",
    ...issues.flatMap((issue) => {
      const lines = oneLiners(issue);
      return [
        `${pad3(numberOf(issue.date))} · ${issue.date} · ${issue.title}`,
        absolute(issuePath(issue.date)),
        ...issue.items.map((it, i) => `- [${catName(it.category)}] ${it.headline}：${lines[i]} ${absolute(itemPath(it.id))}`),
        "",
      ];
    }),
  ].join("\n");
  return { subject, html: frame(inner, { preheader: issues.map((i) => i.title).join("；"), embedded }), text };
}
