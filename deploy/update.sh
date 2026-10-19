#!/usr/bin/env bash
# ============================================================
# PSM VALVE — انتشار نسخهٔ جدید روی سرور با یک دستور
#
#   bash deploy/update.sh
#
# چه میکند؟
#   ۱) پیشبررسی (node scripts/preflight.mjs) — اگر FAIL بدهد متوقف میشود
#   ۲) انتشار: بکاپ دادهٔ زنده → دریافت کد → npm ci → بیلد → pm2 reload
#      (همان کارهای deploy/deploy.sh؛ دادهٔ سرور حفظ میشود)
#   ۳) تستهای رگرسیون (npm test)
#   ۴) بررسی سلامت مسیرهای کلیدی
#
# متغیرها: APP_DIR · BRANCH · APP_NAME · APP_PORT · DOMAIN
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/psm-valve}"
BRANCH="${BRANCH:-main}"
APP_NAME="${APP_NAME:-psm-valve}"
if [ -z "${APP_PORT:-}" ] && [ -f "$APP_DIR/.app-port" ]; then
  APP_PORT="$(tr -dc '0-9' < "$APP_DIR/.app-port" | head -c 5)"
fi
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-}"

cd "$APP_DIR"

echo "[update] ۱/۴ پیشبررسی انتشار"
node scripts/preflight.mjs || {
  echo "[update] ❌ پیشبررسی ناموفق بود — قبل از انتشار خطاها را رفع کنید."
  exit 1
}

echo "[update] ۲/۴ انتشار (بکاپ دادهٔ زنده + کد جدید + بیلد + ریاستارت)"
BRANCH="$BRANCH" APP_DIR="$APP_DIR" APP_NAME="$APP_NAME" bash deploy/deploy.sh

echo "[update] ۳/۴ تستهای رگرسیون"
npm test

echo "[update] ۴/۴ بررسی سلامت"
sleep 2
curl -fsS -o /dev/null -w "  http://127.0.0.1:$APP_PORT/fa → %{http_code}\n" "http://127.0.0.1:$APP_PORT/fa"
curl -s -o /dev/null -w "  /admin → %{http_code} (انتظار: 307 به /admin/login)\n" "http://127.0.0.1:$APP_PORT/admin"
curl -s -o /dev/null -w "  /api/cv-tables → %{http_code} (انتظار: 401 بدون ورود)\n" "http://127.0.0.1:$APP_PORT/api/cv-tables"
if [ -n "$DOMAIN" ]; then
  curl -fsS -o /dev/null -w "  https://www.$DOMAIN/fa → %{http_code}\n" "https://www.$DOMAIN/fa" || \
    echo "  ▲ بررسی دامنه ناموفق بود (DNS/SSL را بررسی کنید)"
fi

echo "[update] ✅ نسخهٔ فعال: $(git log -1 --oneline)"