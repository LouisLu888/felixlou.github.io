// ============================================================================
// Transcripts for audio and video sources, so the editor writes from what was
// said instead of an episode description. Every function returns plain text,
// or "" when no transcript is available.
// ============================================================================

import { fetchText, toPlainText, BROWSER_UA } from "./feeds.js";

// WebVTT / SRT -> text: drop the header, cue numbers, timings and inline tags,
// and the repeated lines auto-captions carry over from one cue to the next.
export function captionsToText(raw) {
  const lines = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const t = line.trim();
    if (!t || t === "WEBVTT" || /^(NOTE|STYLE|REGION)\b/.test(t) || /^\d+$/.test(t) || t.includes("-->")) continue;
    const text = t.replace(/<[^>]+>/g, "").trim();
    if (text && text !== lines[lines.length - 1]) lines.push(text);
  }
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

// <podcast:transcript url="..."> from the feed: text/plain, VTT, SRT or HTML.
export async function fetchFeedTranscript(url) {
  const raw = await fetchText(url);
  if (/-->/.test(raw)) return captionsToText(raw);
  if (/<\/?(p|div|span|br)\b/i.test(raw)) return toPlainText(raw);
  return raw.replace(/\s+/g, " ").trim();
}

// YouTube captions through the innertube player API. The web watch page's
// caption URLs now return empty bodies without a proof-of-origin token; the
// Android client still gets usable ones (checked 2026-10-12).
const INNERTUBE_CLIENT = { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "en" };

export async function fetchYouTubeTranscript(watchUrl) {
  const videoId = new URL(watchUrl).searchParams.get("v");
  if (!videoId) return "";
  const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify({ context: { client: INNERTUBE_CLIENT }, videoId }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`player HTTP ${res.status}`);
  const player = await res.json();
  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) {
    const status = player.playabilityStatus?.status;
    if (status && status !== "OK") throw new Error(`player ${status}: ${player.playabilityStatus?.reason || ""}`.trim());
    return "";
  }
  // Uploaded English captions beat auto-generated ones; any English beats other languages.
  const en = tracks.filter((t) => t.languageCode?.startsWith("en"));
  const track = en.find((t) => t.kind !== "asr") || en[0] || tracks[0];
  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "json3");
  const body = await (await fetch(url, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(30000) })).text();
  if (!body) return "";
  const events = JSON.parse(body).events || [];
  return events
    .flatMap((e) => (e.segs || []).map((s) => s.utf8 || ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
