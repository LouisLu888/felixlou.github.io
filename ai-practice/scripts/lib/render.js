// ============================================================================
// Shared rendering helpers for static pages, RSS, sitemap and emails.
// One place for public URLs, Markdown handling and per-category labels.
// ============================================================================

export const SITE_ORIGIN = "https://www.jiabinlu.com";
export const BASE_PATH = "/ai-practice/";
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;
export const BRAND = "AI 实干派";
export const TAGLINE = "看真正用 AI 拿到结果的人怎么做";
export const DESCRIPTION = "每天几条一手材料：真正用 AI 拿到结果的人怎么做。工作提效、内容创作、商业闭环、真实收入，也有用 AI 办生活里的事。每条都附原文和口径。";

// Static permalinks. The single-page app keeps its #/ routes; these pages are
// what gets shared, indexed and linked from emails.
export const issuePath = (date) => `${BASE_PATH}d/${date}/`;
export const itemPath = (id) => `${BASE_PATH}i/${id}/`;
export const categoryPath = (id) => `${BASE_PATH}c/${id}/`;
export const subscribePath = () => `${BASE_PATH}subscribe/`;
export const ogImagePath = (date) => `${BASE_PATH}og/${date}.png`;
export const DEFAULT_OG_IMAGE = `${BASE_PATH}og/default.png`;
export const absolute = (path) => `${SITE_ORIGIN}${path}`;

export const FACT_LABELS = {
  default: ["谁·场景", "怎么用", "结果", "你可以试", "注意"],
  perspective: ["谁说的", "核心观点", "依据", "对你的意义", "争议·条件"],
};

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const pad3 = (n) => String(n).padStart(3, "0");

// Minimal Markdown used everywhere: paragraphs, **bold**, [text](http-url).
// Input is escaped first, so only these constructs become HTML.
export function mdToHtml(text, { pStyle = "", aStyle = "", strongStyle = "" } = {}) {
  const attr = (style) => (style ? ` style="${style}"` : "");
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((para) => {
      let h = esc(para.trim());
      h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2"${attr(aStyle)}>$1</a>`);
      h = h.replace(/\*\*([^*]+)\*\*/g, `<strong${attr(strongStyle)}>$1</strong>`);
      return h ? `<p${attr(pStyle)}>${h.replace(/\n/g, "<br>")}</p>` : "";
    })
    .join("");
}

export function mdToText(text) {
  return String(text ?? "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1（$2）")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

export function factsRows(it) {
  const labels = FACT_LABELS[it.category] || FACT_LABELS.default;
  return [it.who, it.how, it.result, it.tryThis, it.caveat]
    .map((v, i) => [labels[i], v])
    .filter(([, v]) => v);
}

// tldr predates oneLiner; trust it only when it lines up with the items.
export function oneLiners(issue) {
  const tldrOk = issue.tldr?.length === issue.items.length;
  return issue.items.map((it, i) => it.oneLiner || (tldrOk ? issue.tldr[i].text : it.headline));
}

export function fmtDateZh(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = "日一二三四五六"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y} 年 ${m} 月 ${d} 日 · 周${wd}`;
}
