#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Podcast step 1: turn one issue into an MP3
// ============================================================================
// Reads public/ai-practice/data/issues/<date>.json, asks an OpenAI model to
// rewrite it as a spoken Chinese script (same items, same order, same facts),
// synthesizes it with OpenAI TTS and encodes one MP3 (48kbps mono, about 3.5MB per 10 minutes).
//
// Usage: node podcast-build.js --out <dir> [--date YYYY-MM-DD]
//
// Env:
//   OPENAI_API_KEY        required
//   PODCAST_SCRIPT_MODEL  default gpt-5.5
//   PODCAST_TTS_MODEL     default gpt-4o-mini-tts-2025-12-15
//   PODCAST_VOICE         default marin
//
// Writes to <dir>: episode.mp3, episode.json (metadata), script.txt.
// If the issue does not exist, writes episode.json with { "skip": true } only.
// Requires ffmpeg and ffprobe on PATH.
// ============================================================================

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { todayPacific } from "./lib/dates.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ISSUES_DIR = join(ROOT, "..", "public", "ai-practice", "data", "issues");
const ISSUE_PAGE = "https://www.jiabinlu.com/ai-practice/#/d/";

const SCRIPT_MODEL = process.env.PODCAST_SCRIPT_MODEL || "gpt-5.5";
const TTS_MODEL = process.env.PODCAST_TTS_MODEL || "gpt-4o-mini-tts-2025-12-15";
const VOICE = process.env.PODCAST_VOICE || "marin";

const CHARS_PER_MINUTE = 270;          // typical spoken Mandarin pace
const MAX_SCRIPT_CHARS = 6000;         // about 22 minutes
const MAX_TTS_CHUNK_CHARS = 900;       // keeps each TTS request well under the input limit
const SAMPLE_RATE = 24000;             // OpenAI "pcm" format: 24kHz, 16-bit LE, mono
const GAP_SECONDS = 0.35;              // silence inserted between chunks

const TTS_INSTRUCTIONS =
  "用标准普通话播报，语气自然、亲切、像在跟朋友聊天的科技播客主持人。" +
  "语速适中偏快，句间停顿自然。英文人名、公司名、产品名和技术术语用地道的英文发音。";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

async function openai(path, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    const text = await res.text();
    if (attempt >= 3 || (res.status < 500 && res.status !== 429)) {
      throw new Error(`OpenAI ${path} HTTP ${res.status}: ${text.slice(0, 500)}`);
    }
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

// -- Script ------------------------------------------------------------------

// Spoken length tracks the written issue: the parts a listener needs, minus
// the summary fields that repeat the body.
function targetChars(issue) {
  const strip = (s) => (s || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, "");
  const written = issue.items.reduce((n, it) => n + strip(it.body).length + strip(it.tryThis).length + strip(it.caveat).length, 0)
    + strip(issue.action).length;
  return Math.min(MAX_SCRIPT_CHARS, Math.round(written / 100) * 100);
}

async function writeScript(issue) {
  const template = await readFile(join(ROOT, "prompts", "podcast.md"), "utf-8");
  const prompt = template.replaceAll("{{TARGET_CHARS}}", String(targetChars(issue)));
  const { title, items, action } = issue;
  const res = await openai("chat/completions", {
    model: SCRIPT_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Today's date: ${issue.date}\n\n${JSON.stringify({ title, items, action })}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "podcast_script",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["script"],
          properties: { script: { type: "string" } },
        },
      },
    },
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content).script;
}

// -- TTS ---------------------------------------------------------------------

function splitForTts(script) {
  const pieces = [];
  for (const para of script.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    if (para.length <= MAX_TTS_CHUNK_CHARS) { pieces.push(para); continue; }
    // Oversized paragraph: break after sentence-ending punctuation.
    let buf = "";
    for (const sentence of para.match(/[^。！？!?]+[。！？!?]*/g) || [para]) {
      if (buf && buf.length + sentence.length > MAX_TTS_CHUNK_CHARS) { pieces.push(buf); buf = ""; }
      buf += sentence;
    }
    if (buf) pieces.push(buf);
  }
  // Merge short neighbours so we make fewer requests.
  const chunks = [];
  for (const piece of pieces) {
    const last = chunks[chunks.length - 1];
    if (last && last.length + piece.length + 2 <= MAX_TTS_CHUNK_CHARS) chunks[chunks.length - 1] = `${last}\n\n${piece}`;
    else chunks.push(piece);
  }
  return chunks;
}

async function synthesize(text) {
  // gpt-4o-mini-tts occasionally pads output with long silence; retry once if the
  // audio is far longer than the text could plausibly take to read.
  const expectedSeconds = text.length / (CHARS_PER_MINUTE / 60);
  let pcm;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await openai("audio/speech", {
      model: TTS_MODEL, voice: VOICE, input: text, instructions: TTS_INSTRUCTIONS, response_format: "pcm",
    });
    pcm = Buffer.from(await res.arrayBuffer());
    const seconds = pcm.length / (SAMPLE_RATE * 2);
    if (seconds <= expectedSeconds * 2.5 + 5) break;
    console.error(`  chunk audio ${seconds.toFixed(0)}s vs ~${expectedSeconds.toFixed(0)}s expected, retrying`);
  }
  return pcm;
}

// -- Main --------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) throw new Error("--out <dir> is required");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  await mkdir(args.out, { recursive: true });

  const date = args.date || todayPacific();
  const issuePath = join(ISSUES_DIR, `${date}.json`);
  if (!existsSync(issuePath)) {
    await writeFile(join(args.out, "episode.json"), JSON.stringify({ skip: true, date }, null, 2));
    console.error(`No issue for ${date} — skipping episode`);
    return;
  }
  const issue = JSON.parse(await readFile(issuePath, "utf-8"));

  const script = await writeScript(issue);
  await writeFile(join(args.out, "script.txt"), script);
  console.error(`Script: ${script.length} chars (target ${targetChars(issue)})`);

  const chunks = splitForTts(script);
  const gap = Buffer.alloc(Math.round(SAMPLE_RATE * GAP_SECONDS) * 2);
  const parts = [];
  for (const [i, chunk] of chunks.entries()) {
    console.error(`TTS ${i + 1}/${chunks.length} (${chunk.length} chars)`);
    parts.push(await synthesize(chunk), gap);
  }
  const pcmPath = join(args.out, "episode.pcm");
  await writeFile(pcmPath, Buffer.concat(parts));

  // Collapse any leftover long silences, then encode speech-friendly mono MP3.
  const mp3Path = join(args.out, "episode.mp3");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", pcmPath,
    "-af", "silenceremove=stop_periods=-1:stop_duration=1.5:stop_threshold=-50dB:stop_silence=0.6",
    "-c:a", "libmp3lame", "-b:a", "48k", mp3Path,
  ]);
  const duration = Math.round(Number(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3Path,
  ]).toString().trim()));

  // Show notes come from the issue itself, not the model, so links are always real.
  const meta = {
    skip: false,
    date,
    title: issue.title,
    summary: issue.items.map((it) => it.headline).join("；"),
    link: `${ISSUE_PAGE}${date}`,
    items: issue.items.map((it) => ({ headline: it.headline, sources: it.sources || [] })),
    duration,
    scriptModel: SCRIPT_MODEL,
    ttsModel: TTS_MODEL,
    voice: VOICE,
  };
  await writeFile(join(args.out, "episode.json"), JSON.stringify(meta, null, 2));
  console.error(`Done: ${mp3Path} (${Math.floor(duration / 60)}m${duration % 60}s)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
