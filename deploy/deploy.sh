#!/usr/bin/env bash
# ============================================================
# PSM VALVE — انتشار نسخهٔ جدید روی سرور (Deploy)
# اجرا روی سرور:  /var/www/psm-valve/deploy/deploy.sh
#
# چه میکند؟
#   ۱) از دادهٔ زندهٔ سرور (data/ شامل SQLite محصولات) بکاپ میگیرد
#   ۲) کد را به آخرین نسخهٔ origin/main میرساند (git reset --hard)
#   ۳) دادهٔ زنده را برمیگرداند (چون git فایلهای محتوای اولیه را بازنویسی میکند)
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

# پورت اپ: اولویت با متغیر محیطی APP_PORT، سپس فایل .app-port، در نهایت ۳۰۰۰
if [ -z "${APP_PORT:-}" ] && [ -f "$APP_DIR/.app-port" ]; then
  APP_PORT="$(tr -dc '0-9' < "$APP_DIR/.app-port" | head -c 5)"
fi
APP_PORT="${APP_PORT:-3000}"

cd "$APP_DIR"
mkdir -p logs "$BACKUP_DIR"

PRODUCT_DB_PATH="${PSM_DATABASE_PATH:-$APP_DIR/data/psm-valve.sqlite}"
case "$PRODUCT_DB_PATH" in
  /*) ;;
  *) PRODUCT_DB_PATH="$APP_DIR/$PRODUCT_DB_PATH" ;;
esac

echo "[deploy] ۱/۶ بکاپ دادهٔ زنده"
tar -czf "$BACKUP_DIR/runtime-$STAMP.tar.gz" --exclude='*.sqlite' --exclude='*.sqlite-*' data
node deploy/backup-products-db.cjs "$BACKUP_DIR/products-$STAMP.sqlite"
if [ ! -f "$PRODUCT_DB_PATH" ] && [ -f lib/products.js ]; then
  cp -a lib/products.js "$BACKUP_DIR/products-seed-$STAMP.js"
fi

echo "[deploy] ۲/۶ دریافت آخرین کد (origin/$BRANCH)"
git fetch --all --prune
git reset --hard "origin/$BRANCH"

echo "[deploy] ۳/۶ برگرداندن دادهٔ زنده (data/)"
tar -xzf "$BACKUP_DIR/runtime-$STAMP.tar.gz" -C "$APP_DIR"
if [ ! -f "$PRODUCT_DB_PATH" ] && [ -f "$BACKUP_DIR/products-seed-$STAMP.js" ]; then
  cp -a "$BACKUP_DIR/products-seed-$STAMP.js" lib/products.js
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
if curl -fsS -o /dev/null -w "  /fa → HTTP %{http_code}\n" http://127.0.0.1:$APP_PORT/fa; then
  echo "[deploy] ✅ موفق — نسخهٔ فعال: $(git log -1 --oneline)"
else
  echo "[deploy] ❌ هشدار: health check ناموفق بود. لاگها: pm2 logs $APP_NAME --lines 50"
  exit 1
fi

# پاکسازی: بکاپهای اجرایی قدیمیتر از ۳۰ روز و نسخههای قدیمی بیلد
find "$BACKUP_DIR" -type f -name "runtime-*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -type f -name "products-*.sqlite" -mtime +30 -delete
find "$BACKUP_DIR" -type f -name "products-seed-*.js" -mtime +30 -delete

echo "[deploy] تمام شد در $(date -Is)"