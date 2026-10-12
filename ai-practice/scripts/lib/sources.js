// ============================================================================
// Per-source-type fetching, shared by fetch-sources.js and check-sources.js.
// Every function returns items shaped { title, url, publishedAt, author, text }.
// ============================================================================

import { fetchText, parseFeed, BROWSER_UA } from "./feeds.js";

// YouTube's Atom endpoint answers 404/500 intermittently for healthy channels
// (2026-10-11: 4 of 5 channels failing at once from one IP). Try it a few
// times, then fall back to the channel's /videos page.
const YOUTUBE_FEED_ATTEMPTS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchYouTubePage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "en-US,en;q=0.9",
      // Skips the EU consent interstitial that otherwise replaces the page.
      Cookie: "CONSENT=YES+1; SOCS=CAI",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function findAll(node, key, acc = []) {
  if (Array.isArray(node)) for (const v of node) findAll(v, key, acc);
  else if (node && typeof node === "object") {
    if (key in node) acc.push(node[key]);
    for (const v of Object.values(node)) findAll(v, key, acc);
  }
  return acc;
}

// "1 day ago", "3 weeks ago" → approximate ISO date. Good enough for a 7-day
// lookback window; exact upload time is not on the /videos page.
const UNIT_MS = { minute: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 };
function relativeToIso(label) {
  const m = label?.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  return m ? new Date(Date.now() - Number(m[1]) * UNIT_MS[m[2]]).toISOString() : null;
}

// Parses ytInitialData on a channel /videos page (lockupViewModel layout,
// current as of 2026-10). Returns [] if YouTube changes the shape.
function parseYouTubeVideosPage(html) {
  const m = html.match(/var ytInitialData\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (!m) return [];
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return [];
  }
  return findAll(data, "lockupViewModel")
    .filter((l) => l.contentId && l.contentType === "LOCKUP_CONTENT_TYPE_VIDEO")
    .map((l) => {
      const meta = l.metadata?.lockupMetadataViewModel;
      const labels = findAll(meta, "accessibilityLabel").filter((s) => typeof s === "string");
      return {
        title: meta?.title?.content || "",
        url: `https://www.youtube.com/watch?v=${l.contentId}`,
        publishedAt: relativeToIso(labels.find((s) => s.endsWith(" ago"))),
        author: "",
        text: "",
      };
    });
}

// The full video description lives in ytInitialPlayerResponse on the watch page.
export async function fetchYouTubeDescription(watchUrl) {
  const html = await fetchYouTubePage(watchUrl);
  const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  return m ? JSON.parse(`"${m[1]}"`) : "";
}

async function fetchYouTube(source) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
  let feedErr;
  for (let attempt = 1; attempt <= YOUTUBE_FEED_ATTEMPTS; attempt++) {
    try {
      const items = parseFeed(await fetchText(feedUrl));
      if (items.length) return items;
    } catch (err) {
      feedErr = err;
    }
    await sleep(1000 * attempt);
  }
  const items = parseYouTubeVideosPage(await fetchYouTubePage(`${source.url.replace(/\/$/, "")}/videos`));
  if (!items.length) throw new Error(`feed ${feedErr?.message || "empty"}; /videos page had no videos`);
  return items;
}

// The follow-builders feed is already curated per builder; flatten tweets.
async function fetchFollowBuilders(source) {
  const feed = JSON.parse(await fetchText(source.url));
  return (feed.x || []).flatMap((builder) =>
    (builder.tweets || []).map((t) => ({
      title: `${builder.name}: ${t.text.slice(0, 80)}`,
      url: t.url,
      publishedAt: t.createdAt,
      author: `${builder.name} (${builder.bio || "X"})`,
      text: t.text,
      engagement: { likes: t.likes, retweets: t.retweets, replies: t.replies },
    })),
  );
}

export async function fetchSourceItems(source) {
  if (source.type === "youtube") return fetchYouTube(source);
  if (source.type === "follow-builders") return fetchFollowBuilders(source);
  return parseFeed(await fetchText(source.url));
}
