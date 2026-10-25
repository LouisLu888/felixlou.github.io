#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Podcast step 2: add an episode and rewrite the RSS feed
// ============================================================================
// Site files live in public/ai-practice/podcast/ (build-index.js mirrors them
// to docs/): episodes.json (episode list), cover.jpg (artwork), feed.xml
// (generated), audio/<file>.mp3. Feed URL:
// https://www.jiabinlu.com/ai-practice/podcast/feed.xml
//
// Audio: when PODCAST_AUDIO_BASE is set (e.g. https://audio.jiabinlu.com/ai-practice/),
// MP3s live in Cloudflare R2 behind that URL, the workflow uploads them before
// this script runs, and every episode stays in the feed. Without it, MP3s are
// committed under audio/ and served by GitHub Pages, newest MAX_EPISODES only.
// (Apple Podcasts refuses GitHub Release assets: octet-stream, expiring redirect.)
//
// Usage:
//   node podcast-feed.js --episode <episode.json> --audio <path/to/episode.mp3>
//   node podcast-feed.js --rebuild       (re-render feed.xml from episodes.json)
//   node podcast-feed.js --use-audio-base (point every episode at PODCAST_AUDIO_BASE,
//                                         drop the committed MP3s, re-render the feed)
// ============================================================================

import { readFile, writeFile, readdir, copyFile, stat, rm, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PODCAST_DIR = join(ROOT, "..", "public", "ai-practice", "podcast");
const BASE_URL = "https://www.jiabinlu.com/ai-practice/podcast/";

const SHOW = {
  title: "AI 实干派",
  author: "卢佳斌",
  // Podcast directories (小宇宙, Apple, Spotify) send ownership codes here. Public.
  email: "325louis@gmail.com",
  link: "https://www.jiabinlu.com/ai-practice/",
  description: "看真正用 AI 拿到结果的人怎么做：用 AI 提效、做成商业闭环、拿到收入。jiabinlu.com/ai-practice 每日一期的语音版。本节目口播稿与语音均由 AI 生成合成。",
  language: "zh-cn",
};
const AUDIO_DIR = join(PODCAST_DIR, "audio");
const MAX_EPISODES = 30;
const AUDIO_BASE = (process.env.PODCAST_AUDIO_BASE || "").replace(/\/?$/, "/").replace(/^\/$/, "");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hms(seconds) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function mmss(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function renderFeed(episodes) {
  const items = episodes.map((ep) => {
    // Timestamps first (players turn "mm:ss" in show notes into jump links),
    // then each story with its original sources.
    const timeline = ep.chapters?.length
      ? `<p>${ep.chapters.map((c) => `${mmss(c.start)} ${esc(c.title)}`).join("<br>")}</p>`
      : "";
    const notes = `<p><a href="${esc(ep.link)}">图文版</a> · 本集口播稿与语音由 AI 生成合成</p>` + timeline + ep.items.map((it) =>
      `<p><b>${esc(it.headline)}</b><br>${it.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.label || s.title)}</a>`).join(" · ")}</p>`
    ).join("");
    return `    <item>
      <title>${esc(`${ep.date} · ${ep.title}`)}</title>
      <link>${esc(ep.link)}</link>
      <description>${esc(`${ep.summary}（本集语音由 AI 合成）`)}</description>
      <content:encoded><![CDATA[${notes.replace(/]]>/g, "]]&gt;")}]]></content:encoded>
      <enclosure url="${esc(ep.audioUrl)}" length="${ep.audioBytes}" type="audio/mpeg"/>
      <guid isPermaLink="false">ai-practice-${ep.date}</guid>
      <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
      <itunes:duration>${hms(ep.duration)}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SHOW.title)}</title>
    <link>${esc(SHOW.link)}</link>
    <atom:link href="${BASE_URL}feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(SHOW.description)}</description>
    <language>${SHOW.language}</language>
    <itunes:author>${esc(SHOW.author)}</itunes:author>
    <itunes:owner><itunes:name>${esc(SHOW.author)}</itunes:name><itunes:email>${esc(SHOW.email)}</itunes:email></itunes:owner>
    <itunes:image href="${BASE_URL}cover.jpg"/>
    <image><url>${BASE_URL}cover.jpg</url><title>${esc(SHOW.title)}</title><link>${esc(SHOW.link)}</link></image>
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items}
  </channel>
</rss>
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const episodesPath = join(PODCAST_DIR, "episodes.json");
  const episodes = existsSync(episodesPath) ? JSON.parse(await readFile(episodesPath, "utf-8")) : [];

  // One-time move to R2: the workflow has already uploaded and verified every
  // MP3 under AUDIO_BASE; repoint the episodes and stop shipping MP3s in Pages.
  if (process.argv.includes("--use-audio-base")) {
    if (!AUDIO_BASE) throw new Error("PODCAST_AUDIO_BASE is not set");
    for (const ep of episodes) ep.audioUrl = `${AUDIO_BASE}ai-practice-${ep.date}.mp3`;
    await rm(AUDIO_DIR, { recursive: true, force: true });
    await writeFile(episodesPath, JSON.stringify(episodes, null, 2));
    await writeFile(join(PODCAST_DIR, "feed.xml"), renderFeed(episodes));
    console.error(`Audio now served from ${AUDIO_BASE}: ${episodes.length} episodes`);
    return;
  }

  if (process.argv.includes("--rebuild")) {
    await writeFile(join(PODCAST_DIR, "feed.xml"), renderFeed(episodes));
    console.error(`Feed rebuilt: ${episodes.length} episodes`);
    return;
  }

  for (const key of ["episode", "audio"]) {
    if (!args[key]) throw new Error(`--${key} is required`);
  }
  const meta = JSON.parse(await readFile(args.episode, "utf-8"));
  if (meta.skip) throw new Error("episode.json is a skip marker; nothing to publish");

  const file = `ai-practice-${meta.date}.mp3`;
  if (!AUDIO_BASE) {
    await mkdir(AUDIO_DIR, { recursive: true });
    await copyFile(args.audio, join(AUDIO_DIR, file));
  }

  const episode = {
    date: meta.date,
    title: meta.title,
    summary: meta.summary,
    link: meta.link,
    items: meta.items,
    ...(meta.chapters ? { chapters: meta.chapters } : {}),
    duration: meta.duration,
    audioUrl: AUDIO_BASE ? `${AUDIO_BASE}${file}` : `${BASE_URL}audio/${file}`,
    audioBytes: (await stat(args.audio)).size,
    publishedAt: new Date().toISOString(),
  };
  // Re-running a day replaces that day's episode.
  // R2 has room for every episode; Pages keeps only the newest MAX_EPISODES.
  const all = [episode, ...episodes.filter((ep) => ep.date !== episode.date)]
    .sort((a, b) => b.date.localeCompare(a.date));
  const next = AUDIO_BASE ? all : all.slice(0, MAX_EPISODES);

  if (!AUDIO_BASE) {
    // Drop audio for episodes that fell out of the feed.
    const keep = new Set(next.map((ep) => ep.audioUrl.split("/").pop()));
    for (const f of await readdir(AUDIO_DIR)) {
      if (!keep.has(f)) await rm(join(AUDIO_DIR, f));
    }
  }

  await writeFile(episodesPath, JSON.stringify(next, null, 2));
  await writeFile(join(PODCAST_DIR, "feed.xml"), renderFeed(next));
  console.error(`Feed updated: ${next.length} episodes`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
