#!/usr/bin/env bash
# ============================================================
# PSM VALVE — بکاپ روزانهٔ دادهٔ سایت و داراییهای آپلودشده
#
# نصب روی cron (ساعت ۳ بامداد):
#   0 3 * * * /var/www/psm-valve/deploy/backup.sh >> /var/www/psm-valve/logs/backup.log 2>&1
#
# چرا مهم است؟ دادهٔ سایت روی دیسک سرور است:
#   data/*.json            → محتوا، تنظیمات، پیامهای تماس، کاربران
#   data/psm-valve.sqlite  → کاتالوگ محصولات
#   public/uploads/**      → تصاویر، ویدیو، کاتالوگهای آپلودشده
#
# متغیرهای قابل تنظیم: APP_DIR · BACKUP_DIR · KEEP_DAYS
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/psm-valve}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/psm-valve}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_DIR"
mkdir -p "$BACKUP_DIR"
PRODUCT_DB_PATH="${PSM_DATABASE_PATH:-$APP_DIR/data/psm-valve.sqlite}"
case "$PRODUCT_DB_PATH" in
  /*) ;;
  *) PRODUCT_DB_PATH="$APP_DIR/$PRODUCT_DB_PATH" ;;
esac

echo "[backup] $STAMP — شروع"

# ۱) داده‌های JSON سایت
tar -czf "$BACKUP_DIR/data-$STAMP.tar.gz" --exclude='*.sqlite' --exclude='*.sqlite-*' data

# ۲) snapshot تراکنشی SQLite
node deploy/backup-products-db.cjs "$BACKUP_DIR/products-$STAMP.sqlite"
if [ ! -f "$PRODUCT_DB_PATH" ] && [ -f lib/products.js ]; then
  cp -a lib/products.js "$BACKUP_DIR/products-seed-$STAMP.js"
fi

# ۳) داراییهای آپلودشده
if [ -d public/uploads ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" public/uploads
fi

# ۴) پیکربندیها
[ -f ecosystem.config.js ] && cp -a ecosystem.config.js "$BACKUP_DIR/ecosystem.config.js-$STAMP"
[ -f .app-port ] && cp -a .app-port "$BACKUP_DIR/app-port-$STAMP"
if [ -f .env.production ]; then
  cp -a .env.production "$BACKUP_DIR/env-production-$STAMP"
  chmod 600 "$BACKUP_DIR/env-production-$STAMP"
fi

# ۵) پاکسازی نسخههای قدیمی
find "$BACKUP_DIR" -type f \( -name "data-*.tar.gz" -o -name "uploads-*.tar.gz" -o -name "products-*.sqlite" \) -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -type f \( -name "products.js-*" -o -name "products-seed-*.js" -o -name "ecosystem.config.js-*" -o -name "env-production-*" -o -name "app-port-*" \) -mtime +"$KEEP_DAYS" -delete

echo "[backup] $STAMP — پایان. محتوای پوشهٔ بکاپ:"
du -sh "$BACKUP_DIR"
ls -1t "$BACKUP_DIR" | head -6

# ------------------------------------------------------------------
# بکاپ خارج از سرور (توصیهٔ جدی — یکی از دو گزینه را فعال کن)
# ------------------------------------------------------------------
# الف) انتقال به سرور/NAS دوم:
# rsync -az --delete "$BACKUP_DIR/" backupuser@BACKUP_HOST:/backups/psm-valve/
#
# ب) آپلود به فضای ابری (نیازمند rclone config):
# rclone copy "$BACKUP_DIR" remote:psm-valve-backups
# ------------------------------------------------------------------