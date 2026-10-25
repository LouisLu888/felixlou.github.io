#!/usr/bin/env bash
# AI 实干派：把播客音频接到 Cloudflare R2（在你自己的 Mac 上运行）
#
#   bash setup-r2.sh
#
# 需要：Node.js（用 npx 跑 wrangler）、GitHub CLI（gh，已 gh auth login）、curl。
# 做的事：
#   1. 登录 Cloudflare（浏览器授权），找到账号和 jiabinlu.com 这个站点
#   2. 建 R2 存储桶，绑定 audio.jiabinlu.com
#   3. 让你粘贴 R2 访问密钥（只写进 GitHub，不保存在本机、不打印）
#   4. 写入 GitHub 仓库的 secrets 和 variables
#   5. 上传一个测试文件，确认 https://audio.jiabinlu.com/ 能访问
# 可以重复运行：已经做过的步骤会跳过。

set -euo pipefail

REPO="LouisLu888/felixlou.github.io"
ZONE="jiabinlu.com"
BUCKET="ai-practice-audio"
DOMAIN="audio.jiabinlu.com"
BASE="https://$DOMAIN/"
WRANGLER=(npx --yes wrangler@4)

say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
say "0/5 检查工具"
command -v node >/dev/null || die "没装 Node.js：brew install node"
command -v gh   >/dev/null || die "没装 GitHub CLI：brew install gh"
command -v curl >/dev/null || die "没有 curl"
gh auth status >/dev/null 2>&1 || die "GitHub CLI 未登录：先运行 gh auth login"
gh repo view "$REPO" >/dev/null 2>&1 || die "gh 当前账号访问不了 $REPO"
ok "node、gh、curl 就绪"

# ---------------------------------------------------------------------------
say "1/5 登录 Cloudflare"
if ! "${WRANGLER[@]}" whoami 2>/dev/null | grep -q "associated with the email"; then
  "${WRANGLER[@]}" login
fi
"${WRANGLER[@]}" whoami >/dev/null   # 顺便刷新登录令牌

# wrangler 把 OAuth 令牌存在这几个位置之一；只用来调 Cloudflare API 查账号和站点 ID。
TOKEN=""
for f in "${XDG_CONFIG_HOME:-/nonexistent}/.wrangler/config/default.toml" \
         "$HOME/Library/Preferences/.wrangler/config/default.toml" \
         "$HOME/.config/.wrangler/config/default.toml" \
         "$HOME/.wrangler/config/default.toml"; do
  if [ -f "$f" ]; then
    TOKEN=$(sed -n 's/^oauth_token *= *"\(.*\)"/\1/p' "$f" | head -1)
    [ -n "$TOKEN" ] && break
  fi
done
[ -n "$TOKEN" ] || die "找不到 wrangler 的登录令牌，重新运行一次脚本试试"

cf() { curl -sS -H "Authorization: Bearer $TOKEN" "https://api.cloudflare.com/client/v4$1"; }
json() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const v=('"$1"');process.stdout.write(v==null?"":String(v))})'; }

ACCOUNTS=$(cf "/accounts")
ACCOUNT_COUNT=$(printf '%s' "$ACCOUNTS" | json 'j.result.length')
[ "${ACCOUNT_COUNT:-0}" -ge 1 ] || die "这个 Cloudflare 登录下没有账号"
ACCOUNT_ID=$(printf '%s' "$ACCOUNTS" | json 'j.result[0].id')
ACCOUNT_NAME=$(printf '%s' "$ACCOUNTS" | json 'j.result[0].name')
[ "$ACCOUNT_COUNT" -eq 1 ] || echo "  有 $ACCOUNT_COUNT 个账号，使用第一个：$ACCOUNT_NAME"
ok "Cloudflare 账号：$ACCOUNT_NAME ($ACCOUNT_ID)"

ZONES=$(cf "/zones?name=$ZONE")
ZONE_ID=$(printf '%s' "$ZONES" | json 'j.result[0]?.id')
ZONE_STATUS=$(printf '%s' "$ZONES" | json 'j.result[0]?.status')
if [ -z "$ZONE_ID" ]; then
  cat <<MSG

  $ZONE 还不在 Cloudflare 上。先做这一步（只能在网页上做）：
    1. 打开 https://dash.cloudflare.com/$ACCOUNT_ID/add-site ，添加 ${ZONE}，选 Free 免费版
    2. 核对导入的 DNS 记录：www 指向 GitHub Pages 的那条必须在
       （通常是 CNAME www → louislu888.github.io，以及根域名的 A 记录）
    3. 到 Namecheap → Domain List → $ZONE 右边的 Manage → NAMESERVERS
       下拉选 Custom DNS，填入 Cloudflare 给的两个 nameserver，点右边的 ✓ 保存
       （如果开着 DNSSEC，先在 Advanced DNS 里关掉，否则切换后域名会解析失败）
    4. 等 Cloudflare 显示站点 Active（几分钟到几小时），再运行本脚本
MSG
  exit 0
fi
if [ "$ZONE_STATUS" != "active" ]; then
  die "$ZONE 已加到 Cloudflare，但状态是 ${ZONE_STATUS}。确认 Namecheap 的 nameserver 已改成 Cloudflare 的，等它变成 active 再运行"
fi
ok "站点 $ZONE 已在 Cloudflare（${ZONE_ID}）"

# ---------------------------------------------------------------------------
say "2/5 存储桶和域名"
if "${WRANGLER[@]}" r2 bucket list 2>/dev/null | grep -qE "(^|[[:space:]])$BUCKET([[:space:]]|$)"; then
  ok "存储桶 $BUCKET 已存在"
else
  "${WRANGLER[@]}" r2 bucket create "$BUCKET"
  ok "已建存储桶 $BUCKET"
fi

if "${WRANGLER[@]}" r2 bucket domain list "$BUCKET" 2>/dev/null | grep -q "$DOMAIN"; then
  ok "$DOMAIN 已绑定"
else
  "${WRANGLER[@]}" r2 bucket domain add "$BUCKET" --domain "$DOMAIN" --zone-id "$ZONE_ID" --force \
    || die "绑定失败。可以在网页上做：https://dash.cloudflare.com/$ACCOUNT_ID/r2/default/buckets/$BUCKET/settings → Custom Domains"
  ok "已绑定 $DOMAIN"
fi

# ---------------------------------------------------------------------------
say "3/5 R2 访问密钥"
EXISTING=$(gh secret list -R "$REPO" 2>/dev/null | awk '{print $1}')
if grep -qx R2_ACCESS_KEY_ID <<<"$EXISTING" && grep -qx R2_SECRET_ACCESS_KEY <<<"$EXISTING"; then
  read -r -p "  GitHub 里已有 R2 密钥，要替换吗？[y/N] " again
else
  again=y
fi
if [[ "$again" =~ ^[Yy]$ ]]; then
  cat <<MSG
  这一步 Cloudflare 不提供命令行，要在网页上点：
    1. 打开 https://dash.cloudflare.com/$ACCOUNT_ID/r2/api-tokens
    2. Create API token（Account API token 或 User API token 都行）
       权限选 Object Read & Write，范围选 Apply to specific buckets only → $BUCKET
    3. 创建后页面会显示 Access Key ID 和 Secret Access Key（只显示一次）
MSG
  read -r -p "  粘贴 Access Key ID：" KEY_ID
  read -r -s -p "  粘贴 Secret Access Key（输入不显示）：" KEY_SECRET; echo
  [ -n "$KEY_ID" ] && [ -n "$KEY_SECRET" ] || die "两个值都要填"

  say "4/5 写入 GitHub（${REPO}）"
  printf '%s' "$ACCOUNT_ID" | gh secret set R2_ACCOUNT_ID -R "$REPO"
  printf '%s' "$KEY_ID"     | gh secret set R2_ACCESS_KEY_ID -R "$REPO"
  printf '%s' "$KEY_SECRET" | gh secret set R2_SECRET_ACCESS_KEY -R "$REPO"
  unset KEY_SECRET
  ok "secrets：R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY"
else
  say "4/5 写入 GitHub（${REPO}）"
  printf '%s' "$ACCOUNT_ID" | gh secret set R2_ACCOUNT_ID -R "$REPO"
  ok "沿用已有密钥"
fi

# ---------------------------------------------------------------------------
say "5/5 测试公开访问"
PROBE="setup-check-$(date +%s).txt"
TMP=$(mktemp); echo "ok" > "$TMP"
"${WRANGLER[@]}" r2 object put "$BUCKET/$PROBE" --file "$TMP" --content-type text/plain --remote >/dev/null
rm -f "$TMP"
served=""
for i in $(seq 1 20); do
  served=$(curl -s --max-time 10 "$BASE$PROBE" || true)
  [ "$served" = "ok" ] && break
  echo "  等待 $DOMAIN 生效（证书和 DNS 可能要几分钟）… $i/20"; sleep 15
done
"${WRANGLER[@]}" r2 object delete "$BUCKET/$PROBE" --remote >/dev/null || true
[ "$served" = "ok" ] || die "$BASE 还访问不了。等 10 分钟再运行一次脚本（已完成的步骤会跳过）"
ok "$BASE 可以访问"

# Variables last: the podcast workflow switches to R2 as soon as these exist,
# so only set them once the bucket is reachable.
gh variable set R2_BUCKET -R "$REPO" --body "$BUCKET"
gh variable set PODCAST_AUDIO_BASE -R "$REPO" --body "$BASE"
ok "variables：R2_BUCKET=${BUCKET}，PODCAST_AUDIO_BASE=$BASE"

cat <<MSG

全部完成。回到 Claude 的会话说一声"R2 配好了"，它会触发 migrate_audio，
把现有的 MP3 搬过去并逐个核对。之后每天的新集都会自动传到 R2。
MSG
