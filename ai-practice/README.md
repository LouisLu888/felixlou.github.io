# AI 实干派

看真正用 AI 拿到结果的人怎么做：用 AI 提效、做成商业闭环、拿到收入。每天几条一手材料，可以按日期看，也可以按栏目看。

线上地址：https://www.jiabinlu.com/ai-practice/

栏目：AI 认知（方法论与世界观）· AI 咨询 · 内容创作 · Micro SaaS · AI App · 工作提效（`config/categories.json`）。

## 目录

```
ai-practice/                 流水线（本目录）
  config/sources.json        信息源，2026-10-11 实测可解析
  config/categories.json     五个栏目
  prompts/screen.md          初筛规则
  prompts/curate.md          成稿规则
  prompts/example-issue.md   样刊，文风参考
  scripts/                   Node 脚本，独立 package.json
  state/seen.json            去重记录（30 天过期）
  state/candidates/          每日候选池，含原文摘录，不进 git
public/ai-practice/          网站源文件：index.html、app.js、styles.css、data/
docs/ai-practice/            发布副本，由 build-index.js 从 public/ 镜像过来
.github/workflows/ai-practice-daily.yml
```

## 每天的流程

GitHub Actions 每天 14:23 UTC（约太平洋时间 7:23）运行：

1. `fetch-sources.js`：抓 RSS、播客、YouTube 和 follow-builders 的 X feed，写入当天候选池。
2. `curate.js`：分两步调用 Claude（`claude-opus-5-5`）。
   1. 初筛：候选超过 20 条时，Claude 只看标题和开头摘录，按 `prompts/screen.md` 选出最多 12 条并排序。
   2. 成稿：Claude 读这 12 条全文，按 `prompts/curate.md` 挑 3 到 6 条写成中文，输出 `public/ai-practice/data/issues/<date>.json`。
3. `build-index.js`：生成按日期和按栏目的索引，再把 `public/ai-practice/` 镜像到 `docs/ai-practice/`。
4. 提交到 master。jiabinlu.com 直接从 `docs/` 发布，提交即上线，不需要跑博客的 Vite 构建。
5. 静态页面：`build-index.js` 同时生成每期 `/ai-practice/d/<日期>/`、每条 `/ai-practice/i/<条目>/`、每个栏目 `/ai-practice/c/<栏目>/` 和订阅页 `/ai-practice/subscribe/`，带 Open Graph 分享卡片（`og/<日期>.png`，`og-images.js` 用无头 Chrome 生成），以及 `sitemap.xml`、`feed.xml`（RSS）和全站 `robots.txt`。单页应用 `/ai-practice/` 保持不变，每条加了指向静态页的「链接」。
6. `send-email.js`：等 Pages 部署约 90 秒后，通过 Resend 把当期发到 `NEWSLETTER_TO`。`state/sent.json` 记录已发日期，重跑不会重复发。本地预览：`node send-email.js --date <日期> --dry-run`，生成 `state/email-preview.html`。

`public/` 是源，`docs/` 是副本。手动跑 `npm run build` 构建博客时，Vite 会清空 `docs/` 再从 `public/` 复制，所以 AI 实干派的页面会原样保留。

### 订阅（Buttondown）

网页和静态页底部有订阅表单，提交到博客已有的 Buttondown 账号（`325louis`），打上 `ai-practice` 和 `ai-practice-daily` 或 `ai-practice-weekly` 标签。`AI 实干派 subscribers` workflow 每天太平洋时间 9:23 运行 `send-subscribers.js`：给每日订阅者发当期，周日另给每周订阅者发一周精选。

Buttondown 账号和博客共用一个订阅列表，博客的新文章通知会发给所有人，所以 AI 实干派的订阅者也会收到博客通知（表单上写明了）。反过来，每封 AI 实干派邮件都带标签过滤，标签 ID 在发送时解析；解析不到就不发，绝不无过滤地发送。邮件不进博客的公开归档。手动运行默认 dry run。

### 编辑按

在 `ai-practice/notes/<日期>.md` 写一两句，提交后 `AI 实干派 notes` workflow 会合并进当期页面。说明见 `notes/README.md`。

### 来源命中率

每次构建都会更新 `state/source-stats.md`：每个来源的候选数、初筛入选数、成稿数和最近成稿日期。第 6 周复盘时，候选多而成稿为 0 的来源优先降权或移除。

### 15 分钟读完

每期在代码里计算阅读时间：汉字按每分钟 400 字、英文按每分钟 200 词，计入标题、速读、要点框、正文和「今天可以做的一件事」（`scripts/lib/reading.js`）。成稿时 Claude 会拿到这个预算；如果写出来仍超过 15 分钟，代码按重要性从后往前删条目，删掉的标题记在该期 JSON 的 `meta.droppedForLength`。网站上每期显示「约 N 分钟读完」。

### 防止编造

除了 prompt 里的证据纪律，代码里另有三道检查：

1. 每条内容必须引用当天候选池里真实存在的 `candidateIds`，否则丢弃。
2. 原文链接从候选池重建，不用模型输出的链接。
3. 正文里指向候选之外的链接会被去掉，只留文字。

## 播客

每期同时有语音版，订阅地址：`https://www.jiabinlu.com/ai-practice/podcast/feed.xml`（Apple Podcasts / Overcast / Pocket Casts 选「通过 URL 添加」）。

`.github/workflows/ai-practice-podcast.yml` 在每日出刊的 workflow 成功后自动运行，与出刊流程分开，失败不影响图文版：

1. `podcast-build.js`：用 Claude Opus（`claude-opus-5-5`，经 Claude Code CLI 走订阅，失败时退回 `gpt-5.5`）把当天这期改写成口播稿。2026-10-11 用同一期对比了 gpt-5.5、Claude Opus 5.5、Gemini 3.1 Pro、DeepSeek V3.1、Qwen3-235B，Claude 最自然、最忠实；Gemini 加了原文没有的评论，DeepSeek 和 Qwen 漏了条目，规则在 `prompts/podcast.md`：条目、顺序和事实与图文版一致，只改成口语。再用 Inworld TTS-2（经 Replicate，音色 Xiaoyin）按故事分段合成、拼接，编码成单声道 MP3。2026-10-11 用同一段文本盲听对比了 Inworld、MiniMax 2.8 HD、Gemini 3.1 Flash TTS、Qwen3-TTS、ElevenLabs v3 和 OpenAI，选了 Inworld（Replicate 上 $25 / 百万字符，每集约 $0.08）。Inworld 失败时整集改用 OpenAI `gpt-4o-mini-tts`，不会一集里混两种声音。
2. `podcast-feed.js`：把 MP3 放进 `public/ai-practice/podcast/audio/`，更新 `episodes.json` 和 `feed.xml`，show notes 里的链接取自当期 JSON，不用模型输出。只保留最近 30 集的 MP3（48kbps，每集约 3.5MB），更早的自动删除。workflow 只把 `podcast/` 目录镜像到 `docs/`，也只提交这个目录，不跑 `build-index.js`，以免和改动 `data/index.json` 的其他提交冲突。
3. 音频必须由 jiabinlu.com 自己提供。GitHub Release 附件返回 `application/octet-stream` 加会过期的跳转，Apple Podcasts 会报 “This episode cannot be played on this device”。

需要仓库 secret `CLAUDE_CODE_OAUTH_TOKEN`（写稿）、`OPENAI_API_KEY`（备用写稿和备用 TTS）和 `REPLICATE_API_TOKEN`（Inworld）。可在 Actions 页手动运行 **AI 实干派 podcast**，填 `date` 补做某一天，勾 `force` 重做。换引擎用环境变量 `PODCAST_TTS_ENGINE`（`inworld` 或 `openai`），换 Inworld 音色用 `PODCAST_INWORLD_VOICE`（默认 `Xiaoyin`）。每集成本约 $0.08（写稿走 Claude 订阅不另计费，语音约 $0.08）。

让语音不生硬的几处设定（2026-10-11 调过一轮，参考了 ellewiz/personalized-news-podcast）：

1. 口播稿句长：大多 12–30 字，上限 40 字；超长时 `podcast-build.js` 会打回模型改一次。也不许切成四字碎句。
2. 开场白、日期和结尾由代码固定生成，模型只写预告和正文。
3. 每个故事单独合成一段，故事之间停 1.2 秒，长故事内部按段落拆开时停 0.7 秒。
4. 语速：Inworld 用自带的 `speaking_rate` 0.95；备用的 OpenAI 不支持语速参数，成品放慢到 0.94 倍（`TEMPO`）。
5. 英文术语读音表在 `config/pronunciation.json`，只作用于送给 TTS 的文本；听到读错的词就加一条。

上架小宇宙需要两样东西，都已写进 feed：`itunes:owner` 邮箱（325louis@gmail.com，认领节目时收验证码，公开可见），以及 AI 生成标识。中国大陆 2025 年 9 月起施行 AI 生成内容标识规定，所以每集开头固定一句「本节目语音由 AI 合成」，节目简介和每集简介也注明（`AI_DISCLOSURE`）。

## 本地运行

```bash
cd ai-practice/scripts && npm install
node fetch-sources.js              # 抓今天的候选
node curate.js --engine cli        # 用本机 Claude Code（你的订阅，无需 API key）
# 或 ANTHROPIC_API_KEY=... node curate.js   # 用 Claude API，Actions 走这条
node build-index.js                # 建索引并镜像到 docs/
cd ../../docs && python3 -m http.server 8787   # http://localhost:8787/ai-practice/
```

`curate.js` 参数：`--date YYYY-MM-DD`（默认太平洋时间今天），`--force`（覆盖已有的一期）。

## 上线前要做的一次性设置

成稿需要 Claude，两种方式任选其一，作为仓库 secret 加在 Settings → Secrets and variables → Actions：

1. `CLAUDE_CODE_OAUTH_TOKEN`（当前用的这种）：走你的 Claude 订阅，不另外按 API 用量计费。在本机运行 `claude setup-token` 生成，然后 `gh secret set CLAUDE_CODE_OAUTH_TOKEN -R LouisLu888/felixlou.github.io` 粘贴进去。workflow 会在运行时安装 Claude Code，用 `--engine cli` 成稿。
2. `ANTHROPIC_API_KEY`：走 Claude API，按 token 计费。两个都设置时优先用它。

都没有时，流水线照常抓取，但不出新一期。

每日邮件另需两个 secret：`RESEND_API_KEY`（Resend 的 key）和 `NEWSLETTER_TO`（收件邮箱，多个用逗号分隔；放在 secret 里是因为仓库公开）。发件人用 Resend 的共享域名 `resend.dev`，只能发给 Resend 账号本人的邮箱；要发给别人，需要先在 Resend 验证自己的域名并设置 `NEWSLETTER_FROM`。设置后在 Actions 页手动运行一次 **AI 实干派 daily issue** 验证。

## 成本

每天一次 `claude-opus-5-5` 调用，输入约 50 条候选（每条最多 1 万字符摘录）。2026-10-11 本地两次实测分别是 $0.44 和 $0.81，按这个量级每月十几到二十几美元。

## 检查来源

```bash
cd ai-practice/scripts && node check-sources.js
```

逐个抓取所有来源，报告条目数和最新一条的日期，不改动去重记录。加新来源后先跑一次。

`config/sources.json` 每个来源的可选字段：`fullText`（feed 只有摘要时，抓文章页正文）、`skipUrlPattern`（跳过匹配的条目，例如双语站的英文副本）、`episodeLinkTemplate`（只有 mp3 的播客，改用的单集页面链接）、`maxItems`。

## 已知问题

- YouTube 的 Atom feed 会对正常频道间歇返回 404/500（2026-10-11 曾 5 个频道里 4 个同时失败）。脚本先重试 3 次，再改抓频道的 /videos 页面；新视频的完整描述从观看页取。/videos 页面的数据结构 YouTube 随时可能改，届时 `check-sources.js` 会报出来。
- Flightcast 托管的播客（Starter Story、Every）只给 mp3，没有单集网页。`episodeLinkTemplate` 会把链接改成该频道的 YouTube 搜索页。
- Substack 的 `api.substack.com` 播客 feed 在 GitHub Actions 的服务器上返回 403（2026-10-11 实测）。Substack 系的来源一律用作者自己域名的 `/feed`（例如 `www.latent.space/feed`），这个 feed 也包含播客单集。
- 付费墙内容只能拿到 RSS 里的公开部分。
- Every Consulting、Morningside 案例页、PJ Ace、硬地骇客、Starter Story 网站本身没有可用的 RSS，暂未接入。
- The Bootstrapped Founder 的博客和播客都在 2026-04-03 之后停更，来源保留，恢复更新会自动进入候选。
