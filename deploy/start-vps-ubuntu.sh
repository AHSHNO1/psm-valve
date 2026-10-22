#!/usr/bin/env bash
# ============================================================
# PSM VALVE — راه‌اندازی یک‌دستوری روی VPS لینوکسی (Ubuntu/Debian)
#
#   sudo bash deploy/start-vps-ubuntu.sh --domain psmvalve.com --email admin@psmvalve.com
#   sudo bash deploy/start-vps-ubuntu.sh            # بدون دامنه: IP سرور + HTTP
#   curl -fsSL https://raw.githubusercontent.com/AHSHNO1/psm-valve/main/deploy/start-vps-ubuntu.sh | sudo bash
#
# این فایل فقط «پوستهٔ» نصب است: پیش‌نیازهای حداقلی را می‌آورد، IP عمومی را
# تشخیص می‌دهد و deploy/install.sh را با گزینه‌های درست اجرا می‌کند.
# ============================================================
set -euo pipefail

REPO="${PSM_REPO:-https://github.com/AHSHNO1/psm-valve.git}"
BRANCH="${PSM_BRANCH:-main}"

log()  { echo "    $*"; }
ok()   { echo "    ✔ $*"; }
warn() { echo "    ▲ $*"; }
die()  { echo; echo "✖ $*"; exit 1; }

usage() {
  cat <<'EOF'
PSM VALVE — راه‌اندازی یک‌دستوری روی VPS لینوکسی (Ubuntu/Debian)

  sudo bash deploy/start-vps-ubuntu.sh [گزینه‌ها]
  curl -fsSL <raw-url>/deploy/start-vps-ubuntu.sh | sudo bash -s -- [گزینه‌ها]

اگر دامنه ندهید، IP عمومی سرور تشخیص داده می‌شود و سایت روی HTTP بالا می‌آید.

گزینه‌ها (همه به deploy/install.sh پاس داده می‌شوند):
  --domain <domain|ip>      دامنه یا IP سرور (پیش‌فرض: تشخیص خودکار IP)
  --email <email>           ایمیل Let's Encrypt
  --admin-user <user>       نام کاربری پنل مدیریت (پیش‌فرض: admin)
  --admin-password <pass>   رمز پنل (پیش‌فرض: تصادفی و نمایش یک‌باره)
  --admin-password-file <p> رمز را از خط اول فایل می‌خواند (امن‌تر از خط فرمان)
  --app-user <user>         کاربر اجراکنندهٔ سرویس (پیش‌فرض: psm)
  --source <dir>            نصب از کد موجود در همین مسیر (پیش‌فرض در اجرای محلی)
  --repo <git-url>          دریافت کد از مخزن گیت به‌جای منبع محلی
  --branch <name>           شاخهٔ انتشار (پیش‌فرض: main)
  --app-dir <path>          مسیر نصب (پیش‌فرض: /var/www/psm-valve)
  --port <number>           پورت اپلیکیشن (پیش‌فرض: 3000)
  --no-ssl                  فقط HTTP
  --no-firewall             بدون ufw/fail2ban
  --skip-build              بدون بیلد (اگر .next آماده است)
  --no-cron                 بدون بکاپ روزانه
  -h, --help                همین راهنما

  هر گزینهٔ دیگری که بدهی مستقیم به deploy/install.sh منتقل می‌شود
  (مثلاً --no-cron، --skip-build، --admin-password-file).

مثال‌ها:
  sudo bash deploy/start-vps-ubuntu.sh --domain psmvalve.com --email admin@psmvalve.com
  sudo bash deploy/start-vps-ubuntu.sh --domain 203.0.113.10 --no-ssl
  sudo bash deploy/start-vps-ubuntu.sh --source /root/psm-valve --domain 203.0.113.10
EOF
}

for arg in "$@"; do
  case "$arg" in
    -h|--help) usage; exit 0 ;;
  esac
done

SELF="${BASH_SOURCE[0]:-}"
ROOT=""
if [ -n "$SELF" ] && [ -f "$SELF" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$SELF")" && pwd -P)"
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
fi

if [ "$(id -u)" -ne 0 ]; then
  if [ -n "$SELF" ] && command -v sudo > /dev/null 2>&1; then
    echo "→ برای نصب به root نیاز است؛ اجرای دوباره با sudo ..."
    exec sudo -E bash "$SELF" "$@"
  fi
  die "این اسکریپت باید با root اجرا شود:  curl -fsSL <raw-url> | sudo bash"
fi

if ! command -v apt-get > /dev/null 2>&1; then
  die "apt-get پیدا نشد. این اسکریپت برای Ubuntu/Debian است؛ برای Docker از deploy/docker.sh استفاده کنید."
fi

if ! command -v curl > /dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl > /dev/null
fi

HAS_DOMAIN=false
HAS_SOURCE=false
HAS_REPO=false
HAS_BRANCH=false
CUSTOM_REPO=""
CUSTOM_BRANCH=""
ARGS=("$@")
idx=0
while [ "$idx" -lt "${#ARGS[@]}" ]; do
  arg="${ARGS[$idx]}"
  case "$arg" in
    --domain) HAS_DOMAIN=true; idx=$((idx + 1)); [ -n "${ARGS[$idx]:-}" ] || die "مقدار --domain داده نشد." ;;
    --domain=*) HAS_DOMAIN=true; [ -n "${arg#*=}" ] || die "مقدار --domain داده نشد." ;;
    --source) HAS_SOURCE=true; idx=$((idx + 1)); [ -n "${ARGS[$idx]:-}" ] || die "مقدار --source داده نشد." ;;
    --source=*) HAS_SOURCE=true; [ -n "${arg#*=}" ] || die "مقدار --source داده نشد." ;;
    --repo) HAS_REPO=true; idx=$((idx + 1)); CUSTOM_REPO="${ARGS[$idx]:-}"; [ -n "$CUSTOM_REPO" ] || die "مقدار --repo داده نشد." ;;
    --repo=*) HAS_REPO=true; CUSTOM_REPO="${arg#*=}"; [ -n "$CUSTOM_REPO" ] || die "مقدار --repo داده نشد." ;;
    --branch) HAS_BRANCH=true; idx=$((idx + 1)); CUSTOM_BRANCH="${ARGS[$idx]:-}"; [ -n "$CUSTOM_BRANCH" ] || die "مقدار --branch داده نشد." ;;
    --branch=*) HAS_BRANCH=true; CUSTOM_BRANCH="${arg#*=}"; [ -n "$CUSTOM_BRANCH" ] || die "مقدار --branch داده نشد." ;;
  esac
  idx=$((idx + 1))
done
[ -n "$CUSTOM_REPO" ] && REPO="$CUSTOM_REPO"
[ -n "$CUSTOM_BRANCH" ] && BRANCH="$CUSTOM_BRANCH"

LOCAL_MODE=false
if [ -n "$ROOT" ] && [ -f "$ROOT/package.json" ] && [ -f "$ROOT/deploy/install.sh" ]; then
  LOCAL_MODE=true
fi

TMP_DIR=""
cleanup() { if [ -n "$TMP_DIR" ]; then rm -rf "$TMP_DIR"; fi; }
trap cleanup EXIT

detect_ip() {
  local ip=""
  for url in https://api.ipify.org https://ifconfig.me/ip https://icanhazip.com; do
    ip="$(curl -4 -fsS --max-time 6 "$url" 2>/dev/null | tr -d '[:space:]' || true)"
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
      printf '%s' "$ip"
      return 0
    fi
  done
  ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    printf '%s' "$ip"
    return 0
  fi
  return 1
}

EXTRA=()
if [ "$HAS_DOMAIN" != true ]; then
  DETECTED_IP="$(detect_ip || true)"
  [ -n "$DETECTED_IP" ] || die "IP عمومی سرور تشخیص داده نشد. دامنه یا IP را دستی بدهید: --domain <domain|ip>"
  EXTRA+=(--domain "$DETECTED_IP" --no-ssl)
  ok "دامنه داده نشد — IP عمومی تشخیص داده شد: $DETECTED_IP (حالت HTTP)"
  warn "برای HTTPS بعداً یک دامنه به این IP وصل کنید و اسکریپت را با --domain دامنه اجرا کنید."
fi

if [ "$LOCAL_MODE" = true ]; then
  if [ "$HAS_SOURCE" != true ] && [ "$HAS_REPO" != true ]; then
    EXTRA+=(--source "$ROOT")
    ok "حالت منبع محلی: کد همین پوشه مستقر می‌شود (شامل تغییرات ذخیره‌نشده)"
  elif [ "$HAS_REPO" = true ]; then
    ok "حالت گیت: کد از $REPO (شاخهٔ $BRANCH) دریافت می‌شود"
  fi
  INSTALLER="$ROOT/deploy/install.sh"
  log "اجرای $INSTALLER ..."
  echo
  bash "$INSTALLER" "$@" ${EXTRA[@]+"${EXTRA[@]}"}
  exit $?
fi

# حالت pipe: فقط خود اسکریپت در دسترس است؛ نصب‌کننده را از همان مخزن می‌آوریم.
TMP_DIR="$(mktemp -d /tmp/psm-bootstrap.XXXXXX)"
INSTALLER="$TMP_DIR/install.sh"
RAW_URL=""
case "$REPO" in
  https://github.com/*/*)
    SLUG="${REPO#https://github.com/}"
    SLUG="${SLUG%.git}"
    RAW_URL="https://raw.githubusercontent.com/$SLUG/$BRANCH/deploy/install.sh"
    ;;
esac

if [ -n "$RAW_URL" ] && curl -fsSL --max-time 30 "$RAW_URL" -o "$INSTALLER" 2>/dev/null; then
  ok "نصب‌کننده از $RAW_URL دریافت شد"
else
  warn "دریافت مستقیم نصب‌کننده ممکن نشد — clone مخزن (ممکن است خصوصی باشد) ..."
  if ! command -v git > /dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq git ca-certificates > /dev/null
  fi
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP_DIR/src" > /dev/null 2>&1 \
    || die "دریافت کد ناموفق بود. مخزن را روی سرور clone کنید و از همان پوشه اجرا کنید: bash deploy/start-vps-ubuntu.sh"
  INSTALLER="$TMP_DIR/src/deploy/install.sh"
  ok "نصب‌کننده از مخزن clone شد"
fi

[ -f "$INSTALLER" ] || die "فایل install.sh در مخزن پیدا نشد."
chmod +x "$INSTALLER" 2>/dev/null || true

echo
log "اجرای نصب‌کننده ..."
echo
bash "$INSTALLER" "$@" ${EXTRA[@]+"${EXTRA[@]}"}
