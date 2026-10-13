# AI 实干派 · 待办

做完的打勾，过一阵清理一次。日期是加入的日期。

## AI 生活栏目（2026-10-12 新开）

- [ ] 补中文一手来源。小红书、即刻、公众号都没有 RSS，只能自建 RSSHub
- [ ] 两周后（约 2026-10-26）看 `state/source-stats.md`：四个生活来源（Lifehacker、少数派、Tom's Guide、NYT Personal Tech）的成稿数。为 0 的换掉或调 `titlePattern`
- [ ] 观察两周，再决定要不要每期保底一条生活类，以及 15 分钟预算下七个栏目是否太多

## 播客

- [ ] Replicate 充值后仍按「余额不足 $5」限速（2026-10-12：余额 $9.28，8 个连续请求 7 个 429）。过一天复测，还不行就找 Replicate support。限速期间节目照常出，只是慢一两分钟
- [ ] 在小宇宙创作者后台认领 RSS（podcaster.xiaoyuzhoufm.com，验证码发到 feed 里的 owner 邮箱）
- [ ] 每天听一集，读错的英文词加进 `config/pronunciation.json`
- [ ] 可选：改成双人对话（需要支持多人的 TTS，稿子规则要重写）
- [ ] 如果国内听众反映播放慢，考虑把音频放到国内可达的 CDN；MP3 在 git 历史里每年约 1.3GB，仓库变大后迁到 Cloudflare R2

## 内容来源

- [ ] 没有逐字稿的播客（No Priors、a16z、Training Data 等 Megaphone / Simplecast 的 feed，以及 How I AI 等 anchor.fm 的 feed）仍然只有 show notes。可以只对初筛入选的这几条，用 OpenAI 转写音频（约 $0.2 一集）。2026-10-12 加入
- [ ] YouTube 字幕在 GitHub runner 上被拦截（2026-10-12 排练：12 个视频全部返回 `LOGIN_REQUIRED: Sign in to confirm you're not a bot`，本机正常）。视频候选目前仍只有简介。可选方案：对初筛入选的视频改用 OpenAI 转写音频，或换一台非数据中心 IP 的机器抓字幕。播客 feed 自带的逐字稿在 runner 上正常（同一次排练 6 条）

## 其他

- [ ] follow-builders fork：现名 `ai-builders`，播客 workflow 已停用。待确认后改回原名，删除 gh-pages 分支和测试 release `episode-2026-10-11`
- [ ] 本机的 follow-builders 邮件摘要（`~/.follow-builders/run-digest.sh`）从未加入定时任务，决定要不要恢复
