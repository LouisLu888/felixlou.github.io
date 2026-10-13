// Renders one short passage in several Inworld TTS-2 voices and steering
// styles so a new podcast voice can be chosen by ear. Run from the podcast
// workflow with audition=true; the MP3s come back as a workflow artifact.
//
//   REPLICATE_API_TOKEN   required
//   node voice-audition.js --out <dir>

import { execFileSync } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const MODEL = "inworld/realtime-tts-2";
const SAMPLE_RATE = 24000;
const TEXT =
  "早上好，这里是 AI 实干派。有位开发者给 coding agent 立了规矩，可它总是不听。" +
  "后来他换了个办法，不改说明文档，直接加一个 Git 钩子，不合规的提交当场失败。" +
  "结果呢？十次里，十次都守住了。";

const RELAXED = "[say in a relaxed, conversational podcast-host tone]";
const UPBEAT = "[say in a warm, upbeat, energetic podcast-host tone]";
const EXCITED = "[say with energy and enthusiasm, like a lively podcast host excited to share today's stories]";

// Mandarin voice names are pinyin; the list itself is read from the model schema.
const PINYIN = /^(xiao|yi|jing|xin|wei|hao|ming|mei|lin|yu|zh|ch|sh|qi|jia|hui|lei|fang|ying|yun|tian|kai|bo|jun|ya|ruo|zi|hong|feng|long|wen|xue|na|lan)/i;

const headers = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json", Prefer: "wait=60" };

async function call(url, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    const text = await res.text();
    if (attempt >= 8 || (res.status !== 429 && res.status < 500)) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 1000 * Number(res.headers.get("retry-after") || 10)));
  }
}

// Finds the enum that lists voice ids anywhere in the model's OpenAPI schema.
function findVoiceEnum(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node.enum) && node.enum.includes("Xiaoyin")) return node.enum;
  for (const v of Object.values(node)) {
    const hit = findVoiceEnum(v);
    if (hit) return hit;
  }
  return null;
}

async function speak(voice, steer, rate) {
  let pred = await (await call(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST", headers,
    body: JSON.stringify({ input: { text: `${steer} ${TEXT}`, voice_id: voice, language: "zh", speaking_rate: rate, audio_format: "wav", sample_rate: SAMPLE_RATE } }),
  })).json();
  while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise((r) => setTimeout(r, 2000));
    pred = await (await call(pred.urls.get, { headers })).json();
  }
  if (pred.status !== "succeeded") throw new Error(`${pred.status}: ${String(pred.error).slice(0, 200)}`);
  const url = typeof pred.output === "string" ? pred.output : pred.output[0];
  return Buffer.from(await (await call(url)).arrayBuffer());
}

async function main() {
  const out = process.argv[process.argv.indexOf("--out") + 1];
  if (!out || out.startsWith("--")) throw new Error("--out <dir> is required");
  if (!process.env.REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN is not set");
  await mkdir(out, { recursive: true });

  const model = await (await call(`https://api.replicate.com/v1/models/${MODEL}`, { headers })).json();
  const voices = findVoiceEnum(model.latest_version?.openapi_schema) || ["Xiaoyin"];
  console.log(`All voices (${voices.length}): ${voices.join(", ")}`);
  const mandarin = voices.filter((v) => PINYIN.test(v) && v !== "Xiaoyin");
  console.log(`Mandarin-looking voices: ${mandarin.join(", ") || "(none)"}`);

  const takes = [
    ["01-Xiaoyin-current", "Xiaoyin", RELAXED, 0.95],
    ["02-Xiaoyin-upbeat", "Xiaoyin", UPBEAT, 1.0],
    ["03-Xiaoyin-excited", "Xiaoyin", EXCITED, 1.05],
    ...mandarin.flatMap((v) => [[`${v}-upbeat`, v, UPBEAT, 1.0], [`${v}-excited`, v, EXCITED, 1.05]]),
  ];
  for (const [name, voice, steer, rate] of takes) {
    try {
      const wav = await speak(voice, steer, rate);
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", "pipe:0", "-ac", "1", "-b:a", "96k", join(out, `${name}.mp3`)], { input: wav });
      console.log(`ok   ${name}`);
    } catch (err) {
      console.log(`fail ${name}: ${err.message}`);
    }
  }
  await writeFile(join(out, "voices.txt"), voices.join("\n") + "\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
