#!/usr/bin/env bash
# ============================================================
# PSM VALVE — بکاپ روزانهٔ دادهٔ سایت و داراییهای آپلودشده
#
# نصب روی cron (ساعت ۳ بامداد):
#   0 3 * * * /var/www/psm-valve/deploy/backup.sh >> /var/www/psm-valve/logs/backup.log 2>&1
#
# چرا مهم است؟ دادهٔ سایت در دیتابیس نیست؛ فقط در همین فایلهاست:
#   data/*.json            → محتوا، تنظیمات، پیامهای تماس، کاربران
#   public/uploads/**      → تصاویر، ویدیو، کاتالوگهای آپلودشده
#   lib/products.js        → لیست محصولات (پنل آن را بازنویسی میکند)
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

echo "[backup] $STAMP — شروع"

# ۱) دادهٔ سایت
tar -czf "$BACKUP_DIR/data-$STAMP.tar.gz" data

# ۲) داراییهای آپلودشده
if [ -d public/uploads ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" public/uploads
fi

# ۳) فایلهایی که با پنل بازنویسی میشوند یا پیکربندیاند
[ -f lib/products.js ] && cp -a lib/products.js "$BACKUP_DIR/products.js-$STAMP"
[ -f ecosystem.config.js ] && cp -a ecosystem.config.js "$BACKUP_DIR/ecosystem.config.js-$STAMP"
if [ -f .env.production ]; then
  cp -a .env.production "$BACKUP_DIR/env-production-$STAMP"
  chmod 600 "$BACKUP_DIR/env-production-$STAMP"
fi

# ۴) پاکسازی نسخههای قدیمی
find "$BACKUP_DIR" -type f \( -name "data-*.tar.gz" -o -name "uploads-*.tar.gz" \) -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -type f \( -name "products.js-*" -o -name "ecosystem.config.js-*" -o -name "env-production-*" \) -mtime +"$KEEP_DAYS" -delete

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