#!/usr/bin/env node

// ============================================================================
// AI 实干派 — Podcast step 1: turn one issue into an MP3
// ============================================================================
// Reads public/ai-practice/data/issues/<date>.json, asks an OpenAI model to
// rewrite it as a spoken Chinese script (same items, same order, same facts),
// synthesizes it with Inworld TTS-2 via Replicate (OpenAI TTS as whole-episode
// fallback) and encodes one MP3 (48kbps mono, about 3.5MB per 10 minutes).
//
// Usage: node podcast-build.js --out <dir> [--date YYYY-MM-DD] [--script-only]
//
// Env:
//   OPENAI_API_KEY        required (script, and fallback TTS)
//   REPLICATE_API_TOKEN   required for the default Inworld engine
//   PODCAST_SCRIPT_MODEL  default gpt-5.5
//   PODCAST_TTS_ENGINE    inworld (default) or openai
//   PODCAST_INWORLD_VOICE default Xiaoyin
//   PODCAST_TTS_MODEL     OpenAI TTS model, default gpt-4o-mini-tts-2025-12-15
//   PODCAST_VOICE         OpenAI voice, default marin
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
// Inworld TTS-2 won a blind listening test against MiniMax, Gemini, Qwen,
// ElevenLabs and OpenAI on 2026-10-11, and leads Artificial Analysis'
// Mandarin arena. $25 per million characters on Replicate.
const ENGINE = process.env.PODCAST_TTS_ENGINE || "inworld";
const INWORLD_MODEL = "inworld/realtime-tts-2";
const INWORLD_VOICE = process.env.PODCAST_INWORLD_VOICE || "Xiaoyin";
// Bracketed steering is read as an instruction, not spoken.
const INWORLD_STEER = "[say in a relaxed, conversational podcast-host tone]";
const INWORLD_RATE = 0.95;

const CHARS_PER_MINUTE = 250;          // relaxed conversational Mandarin
const MAX_SCRIPT_CHARS = 6000;         // about 24 minutes
const MAX_TTS_CHUNK_CHARS = 900;       // keeps each TTS request well under the input limit
const MAX_SENTENCE_CHARS = 40;         // longer sentences are hard to follow by ear
const SAMPLE_RATE = 24000;             // OpenAI "pcm" format: 24kHz, 16-bit LE, mono
// Pauses inserted between synthesized pieces. Listening research (and the
// ellewiz personal-podcast project) puts paragraph breaks around 0.75s and
// section breaks around 0.9s; a little longer reads as "new story" in Mandarin.
const PARAGRAPH_GAP_SECONDS = 0.7;
const SEGMENT_GAP_SECONDS = 1.2;
// gpt-4o-mini-tts ignores the API speed parameter and reads Mandarin at about
// 280 chars/min, which sounds hurried. Slow the finished audio slightly
// (pitch preserved); ellewiz landed on 0.93 for the same reason.
const TEMPO = { openai: 0.94, inworld: 1 };   // Inworld slows down natively via INWORLD_RATE

// Structured the way OpenAI's own TTS examples are (voice, tone, pacing, pauses,
// pronunciation). No "speed up" wording: the old version sounded rushed.
const TTS_INSTRUCTIONS = [
  "Voice: 温和、清晰、有亲和力的普通话。",
  "Tone: 像跟一位做产品的朋友聊今天看到的几个真实案例。放松、有好奇心。不要播音腔，不要朗读课文的腔调。",
  "Pacing: 正常聊天的语速，不赶。说到关键数字和结论时稍微放慢一点。",
  "Pauses: 句号处自然停顿；每段结束时停顿稍长，像在换一口气。",
  "Emphasis: 句子重音落在有信息量的词上，比如数字、结果、人物做的事。句尾不要拖长，也不要每句都上扬。",
  "Pronunciation: 英文人名、公司名、产品名和技术词按美式英语原样读，不要读成中文腔。缩写按字母读。",
].join("\n");

const AI_DISCLOSURE = "本节目语音由 AI 合成。";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

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

const SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "segments", "outro"],
  properties: {
    intro: { type: "string" },
    outro: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["paragraphs"],
        properties: { paragraphs: { type: "array", items: { type: "string" } } },
      },
    },
  },
};

function sentencesOf(text) {
  return text.split(/(?<=[。！？!?])/).map((x) => x.trim()).filter(Boolean);
}

function longSentences(draft) {
  const all = [draft.intro, draft.outro, ...draft.segments.flatMap((seg) => seg.paragraphs)];
  return all.flatMap(sentencesOf).filter((x) => x.length > MAX_SENTENCE_CHARS);
}

async function writeScript(issue) {
  const template = await readFile(join(ROOT, "prompts", "podcast.md"), "utf-8");
  const prompt = template.replaceAll("{{TARGET_CHARS}}", String(targetChars(issue)));
  const { title, items, action } = issue;
  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify({ spokenDate: spokenDate(issue.date), title, items, action }) },
  ];
  const ask = async () => {
    const res = await openai("chat/completions", {
      model: SCRIPT_MODEL,
      messages,
      response_format: { type: "json_schema", json_schema: { name: "podcast_script", strict: true, schema: SCRIPT_SCHEMA } },
    });
    const content = (await res.json()).choices[0].message.content;
    return { content, draft: JSON.parse(content) };
  };

  let { content, draft } = await ask();
  // One revision pass if the model still wrote sentences too long to follow by ear.
  const tooLong = longSentences(draft);
  if (tooLong.length > 0) {
    console.error(`Revising ${tooLong.length} sentences over ${MAX_SENTENCE_CHARS} chars`);
    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: `These sentences are over ${MAX_SENTENCE_CHARS} characters. Split each into shorter spoken sentences, ` +
        `keep every fact, change nothing else, and return the full script again:\n${tooLong.join("\n")}`,
    });
    ({ draft } = await ask());
  }
  return draft;
}

// The model writes intro and outro too: fixed template lines read as a station
// announcement. Code only supplies the date in spoken form.
function spokenDate(date) {
  const d = new Date(`${date}T12:00:00Z`);
  const zh = (n) => n <= 10 ? "零一二三四五六七八九十"[n] : n < 20 ? `十${"零一二三四五六七八九"[n - 10]}` :
    `${"零一二三四五六七八九"[Math.floor(n / 10)]}十${n % 10 ? "零一二三四五六七八九"[n % 10] : ""}`;
  return `${zh(d.getUTCMonth() + 1)}月${zh(d.getUTCDate())}号，${WEEKDAYS[d.getUTCDay()]}`;
}

// -- TTS ---------------------------------------------------------------------

// Spoken-form substitutions applied only to TTS input; the saved script keeps
// the original spelling. Longest keys first so "Micro SaaS" wins over "SaaS".
async function loadPronunciation() {
  const path = join(ROOT, "config", "pronunciation.json");
  if (!existsSync(path)) return (text) => text;
  const table = Object.entries(JSON.parse(await readFile(path, "utf-8"))).sort((a, b) => b[0].length - a[0].length);
  return (text) => table.reduce((t, [from, to]) => t.replace(new RegExp(`(?<![A-Za-z])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`, "g"), to), text);
}

// Each segment is synthesized as one piece (split at paragraph boundaries only
// when long), so the voice stays consistent within a story and the pause
// between stories is ours, not the model's.
function piecesOf(paragraphs) {
  const pieces = [];
  for (const para of paragraphs.map((p) => p.trim()).filter(Boolean)) {
    const last = pieces[pieces.length - 1];
    if (last && last.length + para.length + 1 <= MAX_TTS_CHUNK_CHARS) pieces[pieces.length - 1] = `${last}\n${para}`;
    else pieces.push(para);
  }
  return pieces;
}

async function replicate(model, input) {
  const headers = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=60" };
  const call = async (url, init) => {
    // Low-balance Replicate accounts are rate limited to a few requests a minute.
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url, init);
      if (res.ok) return res;
      const text = await res.text();
      if (attempt >= 8 || (res.status !== 429 && res.status < 500)) {
        throw new Error(`Replicate HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * Number(res.headers.get("retry-after") || 10)));
    }
  };
  let pred = await (await call(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST", headers, body: JSON.stringify({ input }),
  })).json();
  while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise((r) => setTimeout(r, 2000));
    pred = await (await call(pred.urls.get, { headers })).json();
  }
  if (pred.status !== "succeeded") throw new Error(`Replicate ${model} ${pred.status}: ${String(pred.error).slice(0, 300)}`);
  const url = typeof pred.output === "string" ? pred.output : pred.output[0];
  return Buffer.from(await (await call(url, {})).arrayBuffer());
}

// Any audio container -> raw 24kHz 16-bit mono PCM, so pieces can be joined
// with our own silences.
function toPcm(audio) {
  return execFileSync("ffmpeg", ["-loglevel", "error", "-i", "pipe:0", "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "pipe:1"],
    { input: audio, maxBuffer: 1 << 30 });
}

const ENGINES = {
  openai: {
    label: () => `${TTS_MODEL} / ${VOICE}`,
    async speak(text) {
      const res = await openai("audio/speech", {
        model: TTS_MODEL, voice: VOICE, input: text, instructions: TTS_INSTRUCTIONS, response_format: "pcm",
      });
      return Buffer.from(await res.arrayBuffer());
    },
  },
  inworld: {
    label: () => `${INWORLD_MODEL} / ${INWORLD_VOICE}`,
    async speak(text) {
      return toPcm(await replicate(INWORLD_MODEL, {
        text: `${INWORLD_STEER} ${text}`, voice_id: INWORLD_VOICE, language: "zh",
        speaking_rate: INWORLD_RATE, audio_format: "wav", sample_rate: SAMPLE_RATE,
      }));
    },
  },
};

async function synthesize(engine, text) {
  // TTS models occasionally pad output with long silence; retry once if the
  // audio is far longer than the text could plausibly take to read.
  const expectedSeconds = text.length / (CHARS_PER_MINUTE / 60);
  let pcm;
  for (let attempt = 1; attempt <= 2; attempt++) {
    pcm = await ENGINES[engine].speak(text);
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

  const draft = await writeScript(issue);
  // Intro shares a TTS piece with the first story and outro with the last
  // segment, so the voice carries through instead of reading isolated lines.
  if (!draft.intro.includes("实干派")) draft.intro = `这里是 AI 实干派。${draft.intro}`;
  const segments = draft.segments.map((seg) => [...seg.paragraphs]);
  // Explicit AI label at the start: mainland China's AI-generated content
  // labeling rules (in force since 2025-09) apply once the show is on 小宇宙.
  segments[0].unshift(AI_DISCLOSURE, draft.intro);
  segments[segments.length - 1].push(draft.outro);
  const script = segments.map((paras) => paras.join("\n")).join("\n\n");
  await writeFile(join(args.out, "script.txt"), script);
  if (process.argv.includes("--script-only")) return;
  const sentences = sentencesOf(script.replace(/\n/g, ""));
  const lengths = sentences.map((x) => x.length).sort((a, b) => a - b);
  console.error(`Script: ${script.length} chars (target ${targetChars(issue)}), ${sentences.length} sentences, ` +
    `median ${lengths[Math.floor(lengths.length / 2)]}, max ${lengths[lengths.length - 1]}`);

  const speak = await loadPronunciation();
  const silence = (seconds) => Buffer.alloc(Math.round(SAMPLE_RATE * seconds) * 2);
  const total = segments.reduce((sum, paras) => sum + piecesOf(paras).length, 0);
  const render = async (engine) => {
    const parts = [];
    let n = 0;
    for (const paras of segments) {
      const pieces = piecesOf(paras);
      for (const [i, piece] of pieces.entries()) {
        console.error(`TTS ${engine} ${++n}/${total} (${piece.length} chars)`);
        parts.push(await synthesize(engine, speak(piece)));
        parts.push(silence(i < pieces.length - 1 ? PARAGRAPH_GAP_SECONDS : SEGMENT_GAP_SECONDS));
      }
    }
    return Buffer.concat(parts);
  };
  // Fall back for the whole episode, never mid-episode: two voices in one
  // show would be worse than the weaker voice throughout.
  let engine = ENGINE;
  let pcm;
  try {
    pcm = await render(engine);
  } catch (err) {
    if (engine === "openai") throw err;
    console.error(`::warning::${engine} TTS failed (${err.message}); falling back to openai for this episode`);
    engine = "openai";
    pcm = await render(engine);
  }
  const pcmPath = join(args.out, "episode.pcm");
  await writeFile(pcmPath, pcm);

  // Collapse any leftover long silences, then encode speech-friendly mono MP3.
  const mp3Path = join(args.out, "episode.mp3");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", pcmPath,
    "-af", `silenceremove=stop_periods=-1:stop_duration=1.5:stop_threshold=-50dB:stop_silence=0.6,atempo=${TEMPO[engine]}`,
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
    tts: ENGINES[engine].label(),
  };
  await writeFile(join(args.out, "episode.json"), JSON.stringify(meta, null, 2));
  console.error(`Done: ${mp3Path} (${Math.floor(duration / 60)}m${duration % 60}s)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
