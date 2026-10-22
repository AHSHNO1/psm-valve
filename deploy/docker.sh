#!/usr/bin/env bash
# ============================================================
# PSM VALVE — نصب و اجرا با Docker (یک دستور)
#
#   bash deploy/docker.sh [--admin-password <رمز>] [--admin-user <نام>]
#
# چه میکند؟
#   ۱) بررسی Docker و Docker Compose
#   ۲) ساخت .env.production با اسرار تصادفی (اگر نبود)
#   ۳) docker compose up -d --build  (بیلد Next در اولین اجرا داخل کانتینر)
#   ۴) انتظار برای بالا آمدن سرویس و بررسی سلامت
#   ۵) تنظیم رمز مدیر (الزامی برای ورود به پنل)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ADMIN_USER="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
PORT="${PORT:-3000}"

while [ $# -gt 0 ]; do
  case "$1" in
    --admin-password) ADMIN_PASSWORD="${2:-}"; shift ;;
    --admin-password=*) ADMIN_PASSWORD="${1#*=}" ;;
    --admin-user) ADMIN_USER="${2:-}"; shift ;;
    --admin-user=*) ADMIN_USER="${1#*=}" ;;
    -h|--help)
      echo "استفاده: bash deploy/docker.sh [--admin-password <رمز>] [--admin-user <نام>]"
      exit 0
      ;;
    *)
      echo "✖ گزینهٔ ناشناخته: $1"
      exit 1
      ;;
  esac
  shift
done

if ! [[ "$ADMIN_USER" =~ ^[A-Za-z0-9._@-]{1,64}$ ]]; then
  echo "✖ نام کاربری مدیر نامعتبر است: $ADMIN_USER"
  exit 1
fi

if ! command -v docker > /dev/null 2>&1; then
  echo "✖ Docker پیدا نشد. نصب: https://docs.docker.com/engine/install/"
  exit 1
fi
if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "✖ Docker Compose (v2) پیدا نشد."
  exit 1
fi
if ! docker info > /dev/null 2>&1; then
  echo "✖ دسترسی به دیمن Docker نیست (کاربر را به گروه docker اضافه کنید یا با sudo اجرا کنید)."
  exit 1
fi

random_password() {
  local raw
  raw="$(openssl rand -base64 32 2>/dev/null | tr -d '\n' || head -c 32 /dev/urandom | base64 | tr -d '\n')"
  printf '%s' "$raw" | tr -dc 'A-Za-z0-9' | cut -c1-20
}

echo "==> ۱/۵ آمادهسازی متغیرهای محیطی"
if [ ! -f .env.production ]; then
  bash deploy/make-env.sh --admin-user "$ADMIN_USER"
else
  echo "    .env.production از قبل وجود دارد (دستنخورده)"
fi

echo "==> ۲/۵ ساخت ایمیج و اجرای کانتینر"
$COMPOSE up -d --build

echo "==> ۳/۵ انتظار برای بالا آمدن سرویس (اجرای اول: بیلد Next چند دقیقه طول میکشد)"
READY=false
for _ in $(seq 1 90); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/fa" 2>/dev/null; then
    READY=true
    break
  fi
  sleep 5
done
if [ "$READY" = true ]; then
  echo "    ✔ سرویس روی http://127.0.0.1:$PORT پاسخ میدهد"
else
  echo "    ▲ سرویس هنوز پاسخ نداد — لاگ: $COMPOSE logs -f app"
fi

echo "==> ۴/۵ تنظیم رمز پنل مدیریت"
GENERATED_PASSWORD=""
if [ -f data/admin.json ]; then
  echo "    رمز مدیر از قبل تنظیم شده است (data/admin.json) — تغییر نکرد"
elif [ -n "$ADMIN_PASSWORD" ]; then
  printf '%s' "$ADMIN_PASSWORD" | $COMPOSE exec -T app node scripts/rotate-admin-password.mjs --stdin --username "$ADMIN_USER" > /dev/null
  echo "    ✔ رمز مدیر ذخیره شد"
else
  GENERATED_PASSWORD="$(random_password 20)"
  printf '%s' "$GENERATED_PASSWORD" | $COMPOSE exec -T app node scripts/rotate-admin-password.mjs --stdin --username "$ADMIN_USER" > /dev/null
  echo "    ✔ رمز تصادفی مدیر ذخیره و در ادامه نمایش داده میشود"
fi

echo "==> ۵/۵ خلاصهٔ انتشار"
echo "    سایت:    http://<IP-سرور>:$PORT/fa   (برای HTTPS پشت Nginx/کدی/ترافیک بگذارید)"
echo "    پنل:     http://<IP-سرور>:$PORT/admin"
echo "    کاربر:   $ADMIN_USER"
if [ -n "$GENERATED_PASSWORD" ]; then
  echo "    رمز:     $GENERATED_PASSWORD"
  echo "    ⚠️ این رمز فقط یکبار نمایش داده میشود؛ بعد از اولین ورود از بخش «امنیت» پنل عوضش کنید."
fi
echo "    بهروزرسانی: $COMPOSE up -d --build   (بیلد خودکار انجام میشود)"
echo "    بکاپ روزانه: bash deploy/backup-docker.sh  (در cron بگذارید)"
echo "    متوقفکردن:  $COMPOSE down"