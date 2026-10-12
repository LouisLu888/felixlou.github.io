# AI 实战派

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

`public/` 是源，`docs/` 是副本。手动跑 `npm run build` 构建博客时，Vite 会清空 `docs/` 再从 `public/` 复制，所以 AI 实战派的页面会原样保留。

### 15 分钟读完

每期在代码里计算阅读时间：汉字按每分钟 400 字、英文按每分钟 200 词，计入标题、速读、要点框、正文和「今天可以做的一件事」（`scripts/lib/reading.js`）。成稿时 Claude 会拿到这个预算；如果写出来仍超过 15 分钟，代码按重要性从后往前删条目，删掉的标题记在该期 JSON 的 `meta.droppedForLength`。网站上每期显示「约 N 分钟读完」。

### 防止编造

除了 prompt 里的证据纪律，代码里另有三道检查：

1. 每条内容必须引用当天候选池里真实存在的 `candidateIds`，否则丢弃。
2. 原文链接从候选池重建，不用模型输出的链接。
3. 正文里指向候选之外的链接会被去掉，只留文字。

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

在 GitHub 仓库 Settings → Secrets and variables → Actions 添加 `ANTHROPIC_API_KEY`。没有它，流水线照常抓取，但不出新一期。然后在 Actions 页手动运行一次 **AI 实战派 daily issue**。

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
- 付费墙内容只能拿到 RSS 里的公开部分。
- Every Consulting、Morningside 案例页、PJ Ace、硬地骇客、Starter Story 网站本身没有可用的 RSS，暂未接入。
- The Bootstrapped Founder 的博客和播客都在 2026-04-03 之后停更，来源保留，恢复更新会自动进入候选。
