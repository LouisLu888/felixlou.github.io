// ============================================================================
// Feed parsing helpers — RSS 2.0, Atom, podcast RSS, YouTube Atom.
// Regex-based on purpose: no XML dependency, same approach as follow-builders.
// Every parser returns { title, url, publishedAt, author, text }.
// ============================================================================

// Some hosts (Substack, YouTube) reject non-browser user agents from cloud IPs.
export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function fetchText(url, timeoutMs = 30000) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Pulls the inner text of the first <tag>…</tag>, unwrapping CDATA.
function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim();
}

function attr(block, tagName, attrName) {
  const re = new RegExp(`<${tagName}\\b[^>]*\\b${attrName}="([^"]*)"`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+|#39);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

// HTML → plain text. Feeds often double-encode HTML inside <description>.
export function toPlainText(html) {
  let s = decodeEntities(html);
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(s)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function toIso(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml) {
  const items = [];

  // RSS 2.0 / podcast feeds
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const b = m[1];
    const body = tag(b, "content:encoded") || tag(b, "description") || tag(b, "itunes:summary");
    items.push({
      title: toPlainText(tag(b, "title")),
      url: decodeEntities(tag(b, "link")),
      audioUrl: attr(b, "enclosure", "url"),
      // Podcasting 2.0 transcript (Flightcast, Transistor, Captivate publish one).
      transcriptUrl: decodeEntities(attr(b, "podcast:transcript", "url")),
      guid: toPlainText(tag(b, "guid")),
      publishedAt: toIso(tag(b, "pubDate") || tag(b, "dc:date")),
      author: toPlainText(tag(b, "dc:creator") || tag(b, "itunes:author") || tag(b, "author")),
      text: toPlainText(body),
    });
  }
  if (items.length > 0) return items;

  // Atom (blogs and YouTube channel feeds)
  for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const b = m[1];
    const alternate =
      b.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i)?.[1] ||
      b.match(/<link\b[^>]*href="([^"]+)"/i)?.[1] ||
      "";
    const body = tag(b, "content") || tag(b, "summary") || tag(b, "media:description");
    items.push({
      title: toPlainText(tag(b, "title")),
      url: decodeEntities(alternate),
      guid: tag(b, "id"),
      publishedAt: toIso(tag(b, "published") || tag(b, "updated")),
      author: toPlainText(tag(tag(b, "author") || "", "name")),
      text: toPlainText(body),
    });
  }
  return items;
}

// Some feeds carry only a short summary. Fetch the article page and keep the
// main text: <article>, else <main>, else <body>, minus nav/header/footer.
export async function fetchArticleText(url) {
  const html = await fetchText(url);
  const pick =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ||
    html;
  return toPlainText(
    pick
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " "),
  );
}
