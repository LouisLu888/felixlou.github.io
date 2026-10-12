// ============================================================================
// Email rendering for AI 实干派: the daily issue and the weekly digest.
// Inline styles and tables only, so Gmail, Outlook and Apple Mail agree.
// Used by send-email.js (Resend, to Louis) and send-subscribers.js
// (Buttondown, to subscribers).
// ============================================================================

import {
  SITE_URL, BRAND, TAGLINE, issuePath, itemPath, subscribePath, absolute,
  esc, pad3, mdToHtml, mdToText, factsRows, oneLiners,
} from "./render.js";

const C = {
  bg: "#F7F3EC", card: "#FFFDF8", text: "#2A2420", text2: "#5E544B", muted: "#8C8177",
  border: "#E3DACD", accent: "#B4532A", soft: "#F6E3D8", fact: "#F0EAE0",
};
const FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Noto Sans SC','Microsoft YaHei',sans-serif";
const SERIF = "'Songti SC','Noto Serif SC',Georgia,serif";

const md = (text) =>
  mdToHtml(text, {
    pStyle: `margin:0 0 12px;font-size:16px;line-height:1.75;color:${C.text2}`,
    aStyle: `color:${C.accent}`,
    strongStyle: `color:${C.text}`,
  });

const tag = (name) =>
  `<span style="display:inline-block;font-size:12px;font-weight:600;color:${C.accent};background:${C.soft};border-radius:4px;padding:0 6px;line-height:20px">${esc(name)}</span>`;

function frame(inner, { footerExtra = "" } = {}) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${C.card};border:1px solid ${C.border};border-radius:12px;font-family:${FONT}">
  <tr><td style="padding:24px 24px 0">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><img src="${SITE_URL}logo.png" width="36" height="36" alt="干" style="display:block;border:0"></td>
      <td style="vertical-align:middle;padding-left:10px">
        <div style="font-size:18px;font-weight:700;color:${C.text};font-family:${SERIF}">${BRAND}</div>
        <div style="font-size:12px;color:${C.muted}">${TAGLINE}</div>
      </td>
    </tr></table>
  </td></tr>
${inner}
  <tr><td style="padding:20px 24px 24px;font-size:12px;line-height:1.7;color:${C.muted}">
    收入和效果按本人披露的口径呈现，不等于审计；每条都附原文链接。<br>
    <a href="${SITE_URL}" style="color:${C.accent}">在网站上按栏目查看往期</a> · <a href="${absolute(subscribePath())}" style="color:${C.accent}">订阅页</a>${footerExtra}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function editorNoteHtml(issue) {
  if (!issue.editorNote) return "";
  return `<tr><td style="padding:16px 24px 0"><div style="border-left:4px solid ${C.accent};padding:4px 0 4px 14px">
      <div style="font-size:14px;font-weight:600;color:${C.text};margin-bottom:6px">编辑按</div>${md(issue.editorNote)}</div></td></tr>`;
}

export function renderDailyEmail(issue, number, catName) {
  const issueUrl = absolute(issuePath(issue.date));
  const lines = oneLiners(issue);
  const subject = `${BRAND} ${pad3(number)}｜${issue.title}`;

  const items = issue.items
    .map(
      (it, i) => `
    <tr><td style="padding:24px 0 8px;border-top:1px solid ${C.border}">
      <div style="font-size:13px;color:${C.muted}">${tag(catName(it.category))} &nbsp;${esc(it.kind)} · ${esc(it.eventDate)}${it.region ? ` · ${esc(it.region)}` : ""}</div>
      <h2 style="margin:8px 0 12px;font-size:20px;line-height:1.4;font-family:${SERIF}"><a href="${absolute(itemPath(it.id))}" style="color:${C.text};text-decoration:none">${String(i + 1).padStart(2, "0")}｜${esc(it.headline)}</a></h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fact};border-radius:8px;margin:0 0 14px">
        ${factsRows(it)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 10px 6px 12px;font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px 6px 0;font-size:14px;line-height:1.6;color:${C.text2}">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      ${md(it.body)}
      <div style="font-size:13px;color:${C.muted}">原文：${(it.sources || [])
        .map((s) => `<a href="${esc(s.url)}" style="color:${C.accent};margin-right:10px">${esc(s.label)}</a>`)
        .join("")}</div>
    </td></tr>`,
    )
    .join("");

  const inner = `
  <tr><td style="padding:20px 24px 0">
    <div style="font-size:13px;color:${C.muted}">${pad3(number)} · ${esc(issue.date)} · 约 ${issue.readingMinutes ?? "?"} 分钟读完 · <a href="${issueUrl}" style="color:${C.accent}">网页版</a></div>
    <h1 style="margin:6px 0 4px;font-size:24px;line-height:1.4;color:${C.text};font-family:${SERIF}">${esc(issue.title)}</h1>
  </td></tr>
  ${editorNoteHtml(issue)}
  <tr><td style="padding:16px 24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:10px">
      <tr><td style="padding:12px 16px 4px;font-size:14px;font-weight:600;color:${C.text}">30 秒速读</td></tr>
      ${issue.items
        .map((it, i) => `<tr><td style="padding:4px 16px 8px;font-size:15px;line-height:1.6;color:${C.text2}">${tag(catName(it.category))} &nbsp;${esc(lines[i])}</td></tr>`)
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
  }`;

  const text = [
    `${BRAND} ${pad3(number)} · ${issue.date} · 约 ${issue.readingMinutes ?? "?"} 分钟读完`,
    issue.title,
    `网页版：${issueUrl}`,
    ...(issue.editorNote ? ["", "编辑按", mdToText(issue.editorNote)] : []),
    "",
    "30 秒速读",
    ...issue.items.map((it, i) => `- [${catName(it.category)}] ${lines[i]}`),
  ];
  issue.items.forEach((it, i) => {
    text.push("", "=====", `${String(i + 1).padStart(2, "0")}｜${it.headline}`, `${catName(it.category)} · ${it.kind} · ${it.eventDate}`, "");
    for (const [k, v] of factsRows(it)) text.push(`${k}：${v}`);
    text.push("", mdToText(it.body), "", `原文：${(it.sources || []).map((s) => s.url).join("  ")}`);
  });
  if (issue.action) text.push("", "=====", "今天可以做的一件事", issue.action);

  return { subject, html: frame(inner), text: text.join("\n") };
}

// Weekly digest: headline + one-liner per item, grouped by day, linking to the
// static pages. Short by design; full text stays on the site.
export function renderWeeklyEmail({ weekLabel, issues, numberOf, catName }) {
  const subject = `${BRAND} 每周精选｜${weekLabel}`;
  const days = issues
    .map((issue) => {
      const lines = oneLiners(issue);
      return `
  <tr><td style="padding:20px 24px 0">
    <div style="font-size:13px;color:${C.muted}">${pad3(numberOf(issue.date))} · ${esc(issue.date)}</div>
    <h2 style="margin:4px 0 10px;font-size:19px;line-height:1.4;font-family:${SERIF}"><a href="${absolute(issuePath(issue.date))}" style="color:${C.text};text-decoration:none">${esc(issue.title)}</a></h2>
    ${issue.editorNote ? `<div style="border-left:3px solid ${C.accent};padding-left:10px;margin-bottom:10px">${md(issue.editorNote)}</div>` : ""}
    ${issue.items
      .map(
        (it, i) => `<div style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${C.text2}">${tag(catName(it.category))} &nbsp;<a href="${absolute(itemPath(it.id))}" style="color:${C.text};font-weight:600;text-decoration:none">${esc(it.headline)}</a><br>${esc(lines[i])}</div>`,
      )
      .join("")}
  </td></tr>`;
    })
    .join("");
  const inner = `
  <tr><td style="padding:20px 24px 0">
    <h1 style="margin:0 0 4px;font-size:24px;line-height:1.4;color:${C.text};font-family:${SERIF}">每周精选 · ${esc(weekLabel)}</h1>
    <div style="font-size:14px;color:${C.muted}">本周 ${issues.length} 期、${issues.reduce((n, i) => n + i.items.length, 0)} 条，点标题读全文。</div>
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
  return { subject, html: frame(inner), text };
}
