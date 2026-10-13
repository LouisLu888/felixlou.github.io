# AI 实干派 · 待办

做完的打勾，过一阵清理一次。日期是加入的日期。

## AI 生活栏目（2026-10-12 新开）

- [ ] 找一手来源。这一栏想要的是普通人亲历的用法，例如用 Meta Muse 这类个人助手、清理忘了取消的订阅、让 AI 打客服电话追回退款。这类故事多在 Reddit、X 和小红书，目前都接不进来：
  - Reddit 的 RSS 对脚本返回 403（2026-10-12 实测），要走 Reddit API 申请 OAuth
  - X 上只有 follow-builders 的 builder 列表，需要另建一份生活向账号列表
  - 代打客服电话、代砍账单的厂商（如 Pine AI）博客没有 RSS，内容也偏营销
- [ ] 两周后（约 2026-10-26）看 `state/source-stats.md`：Wonder Tools、Lifehacker、少数派的成稿数。为 0 的换掉或调 `titlePattern`
- [ ] 观察两周，再决定要不要每期保底一条生活类，以及 15 分钟预算下七个栏目是否太多

## 播客

- [ ] Replicate 充值后仍按「余额不足 $5」限速（2026-10-12：余额 $9.28，8 个连续请求 7 个 429）。过一天复测，还不行就找 Replicate support。限速期间节目照常出，只是慢一两分钟
- [ ] 在小宇宙创作者后台认领 RSS（podcaster.xiaoyuzhoufm.com，验证码发到 feed 里的 owner 邮箱）
- [ ] 每天听一集，读错的英文词加进 `config/pronunciation.json`
- [ ] 可选：改成双人对话（需要支持多人的 TTS，稿子规则要重写）
- [ ] 如果国内听众反映播放慢，考虑把音频放到国内可达的 CDN；MP3 在 git 历史里每年约 1.3GB，仓库变大后迁到 Cloudflare R2

## 内容来源

- [ ] 没有逐字稿的播客（No Priors、a16z、Training Data 等 Megaphone / Simplecast 的 feed，以及 How I AI 等 anchor.fm 的 feed）仍然只有 show notes。可以只对初筛入选的这几条，用 OpenAI 转写音频（约 $0.2 一集）。2026-10-12 加入
- [ ] 确认 YouTube 字幕在 GitHub runner 上也能抓到（innertube Android 客户端，本机 2026-10-12 可用）。被拦截时 fetch 日志会有 `transcript failed`

## 其他

- [ ] follow-builders fork：现名 `ai-builders`，播客 workflow 已停用。待确认后改回原名，删除 gh-pages 分支和测试 release `episode-2026-10-11`
- [ ] 本机的 follow-builders 邮件摘要（`~/.follow-builders/run-digest.sh`）从未加入定时任务，决定要不要恢复
