#!/usr/bin/env bash
# ============================================================
# PSM VALVE — بکاپ روزانه در استقرار Docker
#
#   bash deploy/backup-docker.sh
#   cron:  0 3 * * * cd /opt/psm-valve && /bin/bash deploy/backup-docker.sh >> logs/backup.log 2>&1
#
# چه میکند؟
#   ۱) snapshot تراکنشی SQLite محصولات «داخل کانتینر» (بدون توقف سرویس)
#   ۲) آرشیو data/ (JSON) و public/uploads/ از روی هاست (bind mount)
#   ۳) نگهداری .env.production در بکاپ + پاکسازی نسخههای قدیمی
#
# متغیرها: APP_DIR · BACKUP_DIR · KEEP_DAYS
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/psm-valve}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_DIR"

if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "✖ Docker Compose پیدا نشد."
  exit 1
fi

mkdir -p "$BACKUP_DIR" "$APP_DIR/data/backups" "$APP_DIR/logs"

echo "[backup-docker] $STAMP — شروع"

# ۱) snapshot SQLite (نوشتن روی volume → روی هاست ظاهر میشود)
if [ -f "$APP_DIR/data/psm-valve.sqlite" ]; then
  $COMPOSE exec -T app node deploy/backup-products-db.cjs "/app/data/backups/products-$STAMP.sqlite"
  cp -a "$APP_DIR/data/backups/products-$STAMP.sqlite" "$BACKUP_DIR/"
fi

# ۲) دادهٔ JSON و داراییهای آپلودشده
tar -czf "$BACKUP_DIR/data-$STAMP.tar.gz" --exclude='*.sqlite' --exclude='*.sqlite-*' --exclude='backups' data
if [ -d public/uploads ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" public/uploads
fi

# ۳) پیکربندی
if [ -f .env.production ]; then
  cp -a .env.production "$BACKUP_DIR/env-production-$STAMP"
  chmod 600 "$BACKUP_DIR/env-production-$STAMP"
fi
[ -f docker-compose.yml ] && cp -a docker-compose.yml "$BACKUP_DIR/docker-compose.yml-$STAMP"

# ۴) پاکسازی نسخههای قدیمی
find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete
rm -f "$APP_DIR"/data/backups/products-*.sqlite 2>/dev/null || true

echo "[backup-docker] $STAMP — پایان. محتوای پوشهٔ بکاپ:"
du -sh "$BACKUP_DIR"
ls -1t "$BACKUP_DIR" | head -6