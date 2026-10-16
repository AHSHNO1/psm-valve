#!/usr/bin/env bash
# ============================================================
# PSM VALVE — انتشار نسخهٔ جدید روی سرور (Deploy)
# اجرا روی سرور:  /var/www/psm-valve/deploy/deploy.sh
#
# چه میکند؟
#   ۱) از دادهٔ زندهٔ سرور (data/ و lib/products.js) بکاپ میگیرد
#   ۲) کد را به آخرین نسخهٔ origin/main میرساند (git reset --hard)
#   ۳) دادهٔ زنده را برمیگرداند (چون git فایلهای data/*.json را بازنویسی میکند)
#   ۴) npm ci + build و ریاستارت بدون قطعی با pm2 reload
#
# ⚠️ این فایل و کد سایت با git میآید، پس هر deploy تغییرات خودش را از دست میدهد.
#    چیزی برای پیکربندی داخلش نگذار؛ از متغیر محیطی استفاده کن.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/psm-valve}"
BRANCH="${BRANCH:-main}"
APP_NAME="${APP_NAME:-psm-valve}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/psm-valve}"
STAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_DIR"
mkdir -p logs "$BACKUP_DIR"

echo "[deploy] ۱/۶ بکاپ دادهٔ زنده"
tar -czf "$BACKUP_DIR/runtime-$STAMP.tar.gz" data
if [ -f lib/products.js ]; then
  cp -a lib/products.js "$BACKUP_DIR/products.js-$STAMP"
fi

echo "[deploy] ۲/۶ دریافت آخرین کد (origin/$BRANCH)"
git fetch --all --prune
git reset --hard "origin/$BRANCH"

echo "[deploy] ۳/۶ برگرداندن دادهٔ زنده (data/ + lib/products.js)"
tar -xzf "$BACKUP_DIR/runtime-$STAMP.tar.gz" -C "$APP_DIR"
if [ -f "$BACKUP_DIR/products.js-$STAMP" ]; then
  cp -a "$BACKUP_DIR/products.js-$STAMP" lib/products.js
fi

echo "[deploy] ۴/۶ نصب وابستگیها"
npm ci

echo "[deploy] ۵/۶ بیلد تولید"
npm run build

echo "[deploy] ۶/۶ ریاستارت با PM2"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo "[deploy] بررسی سلامت سرویس"
sleep 3
if curl -fsS -o /dev/null -w "  /fa → HTTP %{http_code}\n" http://127.0.0.1:3000/fa; then
  echo "[deploy] ✅ موفق — نسخهٔ فعال: $(git log -1 --oneline)"
else
  echo "[deploy] ❌ هشدار: health check ناموفق بود. لاگها: pm2 logs $APP_NAME --lines 50"
  exit 1
fi

# پاکسازی: بکاپهای اجرایی قدیمیتر از ۳۰ روز و نسخههای قدیمی بیلد
find "$BACKUP_DIR" -type f -name "runtime-*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -type f -name "products.js-*" -mtime +30 -delete

echo "[deploy] تمام شد در $(date -Is)"