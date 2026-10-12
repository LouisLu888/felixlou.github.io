// Reading-time estimate for an issue, shared by curate.js (budget check) and
// build-index.js (shown on the site).
//
// Rates are conservative averages for careful reading on a phone: about 400
// Chinese characters or 200 English words per minute. Link targets are not
// read, so Markdown URLs are stripped before counting.

export const ZH_CHARS_PER_MIN = 400;
export const EN_WORDS_PER_MIN = 200;
export const MAX_READING_MINUTES = 15;

export function readingMinutesOfText(text) {
  const visible = String(text ?? "").replace(/\]\([^)]*\)/g, "]");
  const zh = (visible.match(/[一-鿿]/g) || []).length;
  const en = (visible.match(/[A-Za-z]+/g) || []).length;
  return zh / ZH_CHARS_PER_MIN + en / EN_WORDS_PER_MIN;
}

// Everything a reader sees on the issue page: one-liners, the facts box,
// the body, and the closing action.
export function itemText(item) {
  return [item.headline, item.oneLiner, item.who, item.how, item.result, item.tryThis, item.caveat, item.body].join("\n");
}

export function issueReadingMinutes(issue) {
  const parts = [issue.title, issue.action, ...(issue.tldr || []).map((t) => t.text), ...issue.items.map(itemText)];
  return readingMinutesOfText(parts.join("\n"));
}
