// Renders one short passage in the Mandarin Inworld TTS-2 voices and steering
// styles so a new podcast voice can be chosen by ear. Run from the podcast
// workflow with audition=true; the MP3s come back as a workflow artifact.
//
//   REPLICATE_API_TOKEN   required
//   node voice-audition.js --out <dir>

import { execFileSync } from "child_process";
import { mkdir } from "fs/promises";
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

// Inworld's built-in Mandarin voices. The model schema does not enumerate
// voice ids, so this list comes from Inworld's voice library.
const MANDARIN = ["Xinyi", "Jing", "Yichen"];

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

  const takes = [
    ["01-Xiaoyin-current", "Xiaoyin", RELAXED, 0.95],
    ["02-Xiaoyin-upbeat", "Xiaoyin", UPBEAT, 1.0],
    ["03-Xiaoyin-excited", "Xiaoyin", EXCITED, 1.05],
    ...MANDARIN.flatMap((v) => [[`${v}-upbeat`, v, UPBEAT, 1.0], [`${v}-excited`, v, EXCITED, 1.05]]),
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
}

main().catch((err) => { console.error(err); process.exit(1); });
