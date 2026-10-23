#!/usr/bin/env bash
# ============================================================
# PSM VALVE — به‌روزرسانی امن روی سروری که با aaPanel مدیریت می‌شود
#
#   sudo bash deploy/aapanel/update.sh
#   sudo APP_DIR=/www/wwwroot/psm-valve APP_USER=www bash deploy/aapanel/update.sh
#
# چه می‌کند؟
#   ۱) بکاپ دادهٔ زنده (JSON + snapshot تراکنشی SQLite) در /www/backup/psm-valve
#   ۲) دریافت کد جدید با git (یا SOURCE_DIR) بدون دست‌زدن به env/data/uploads
#   ۳) npm ci + build + pm2 reload (همیشه یک پروسه)
#   ۴) تست‌ها، preflight و بررسی سلامت
#
# متغیرها:
#   APP_DIR     پیش‌فرض /www/wwwroot/psm-valve
#   APP_USER    پیش‌فرض www
#   APP_NAME    پیش‌فرض psm-valve (نام پروسه در PM2)
#   BRANCH      پیش‌فرض main
#   APP_PORT    پیش‌فرض از .app-port یا 3000
#   BACKUP_DIR  پیش‌فرض /www/backup/psm-valve
#   SOURCE_DIR  فقط وقتی مخزن گیت نیست: کد آمادهٔ جدید را از این مسیر همگام می‌کند
#   RUN_TESTS   1 (پیش‌فرض) یا 0
#   PM2_BIN     مسیر مطلق pm2 (اگر در PATH نیست)
#
# ⚠️ برای شروع اولیه از README.md همین پوشه استفاده کنید؛ این اسکریپت برای
#    نصب موجود است و انتظار دارد .env.production و رمز مدیر از قبل تنظیم شده باشند.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/psm-valve}"
APP_USER="${APP_USER:-www}"
APP_NAME="${APP_NAME:-psm-valve}"
BRANCH="${BRANCH:-main}"
BACKUP_DIR="${BACKUP_DIR:-/www/backup/psm-valve}"
SOURCE_DIR="${SOURCE_DIR:-}"
RUN_TESTS="${RUN_TESTS:-1}"
STAMP="$(date +%Y%m%d-%H%M%S)"

die() { echo; echo "✖ $*" >&2; exit 1; }
warn() { echo "  ▲ $*"; }
ok() { echo "  ✔ $*"; }

[ -d "$APP_DIR" ] || die "پوشهٔ پروژه پیدا نشد: $APP_DIR"
[ -f "$APP_DIR/package.json" ] || die "package.json پیدا نشد در $APP_DIR"
[ -f "$APP_DIR/ecosystem.config.js" ] || die "ecosystem.config.js پیدا نشد در $APP_DIR"
[ -f "$APP_DIR/.env.production" ] || die ".env.production موجود نیست. اول با deploy/make-env.sh بسازید."

if [ -z "${APP_PORT:-}" ] && [ -f "$APP_DIR/.app-port" ]; then
  APP_PORT="$(tr -dc '0-9' < "$APP_DIR/.app-port" | head -c 5)"
fi
APP_PORT="${APP_PORT:-3000}"
case "$APP_PORT" in
  ''|*[!0-9]*) die "پورت نامعتبر: $APP_PORT" ;;
esac
export APP_PORT

NODE_BIN="$(command -v node || true)"
NPM_BIN="$(command -v npm || true)"
[ -n "$NODE_BIN" ] || die "node در PATH نیست. Node.js 22 LTS را نصب کنید."
[ -n "$NPM_BIN" ] || die "npm در PATH نیست."
NODE_MAJOR="$("$NODE_BIN" -v | sed 's/^v//' | cut -d. -f1)"
[ "$NODE_MAJOR" -ge 22 ] || die "Node.js فعلی $("$NODE_BIN" -v) است؛ نسخهٔ ۲۲ LTS لازم است."
NODE_DIR="$(dirname "$NODE_BIN")"

PM2_BIN="${PM2_BIN:-}"
if [ -z "$PM2_BIN" ]; then PM2_BIN="$(command -v pm2 || true)"; fi
if [ -z "$PM2_BIN" ] && [ -x /usr/local/bin/pm2 ]; then PM2_BIN="/usr/local/bin/pm2"; fi
if [ -z "$PM2_BIN" ]; then
  PM2_BIN="$(find /www/server/nodejs -maxdepth 5 -type f -path '*/bin/pm2' 2>/dev/null | head -n 1 || true)"
fi
[ -n "$PM2_BIN" ] || die "pm2 پیدا نشد. با npm install -g pm2 نصب کنید یا PM2_BIN بدهید."

APP_HOME="$(getent passwd "$APP_USER" | cut -d: -f6 || true)"
APP_HOME="${APP_HOME:-/home/$APP_USER}"

run_as_app() {
  local cmd="$1"
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u "$APP_USER" -- env HOME="$APP_HOME" bash -c "$cmd"
  elif [ "$(id -un)" = "$APP_USER" ]; then
    bash -c "$cmd"
  else
    sudo -u "$APP_USER" -H bash -c "$cmd"
  fi
}

# جلوگیری از اجرای هم‌زمان دو update
exec 9>"${TMPDIR:-/tmp}/psm-valve-aapanel-update.lock"
flock -n 9 || die "یک به‌روزرسانی دیگر در حال اجراست."

echo "[update] پروژه: $APP_DIR · کاربر: $APP_USER · Node $(node -v) · پورت: $APP_PORT"

# ---------- ۱) بکاپ دادهٔ زنده ----------
echo "[update] ۱/۶ بکاپ دادهٔ زنده"
mkdir -p "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$BACKUP_DIR" 2>/dev/null || true
tar -czf "$BACKUP_DIR/runtime-$STAMP.tar.gz" -C "$APP_DIR" \
  --exclude='*.sqlite' --exclude='*.sqlite-*' data
if [ -f "$APP_DIR/data/psm-valve.sqlite" ]; then
  run_as_app "cd '$APP_DIR' && '$NODE_BIN' deploy/backup-products-db.cjs '$BACKUP_DIR/products-$STAMP.sqlite'" \
    || warn "snapshot SQLite ناموفق بود؛ فایل اصلی دست‌نخورده است."
fi
ok "بکاپ: $BACKUP_DIR/runtime-$STAMP.tar.gz"

# ---------- ۲) کد جدید ----------
echo "[update] ۲/۶ دریافت کد جدید"
if [ -d "$APP_DIR/.git" ]; then
  run_as_app "cd '$APP_DIR' && git fetch --all --prune && git reset --hard 'origin/$BRANCH'"
  ok "کد به origin/$BRANCH به‌روز شد"
elif [ -n "$SOURCE_DIR" ]; then
  [ -d "$SOURCE_DIR" ] || die "SOURCE_DIR پیدا نشد: $SOURCE_DIR"
  [ -f "$SOURCE_DIR/package.json" ] || die "SOURCE_DIR یک پروژهٔ معتبر نیست: $SOURCE_DIR"
  SOURCE_REAL="$(cd "$SOURCE_DIR" && pwd -P)"
  APP_REAL="$(cd "$APP_DIR" && pwd -P)"
  [ "$SOURCE_REAL" != "$APP_REAL" ] || die "SOURCE_DIR با APP_DIR یکی است."
  command -v rsync > /dev/null 2>&1 || die "rsync نصب نیست: apt-get install -y rsync"
  rsync -a --delete \
    --exclude='.git/' --exclude='node_modules/' --exclude='.next/' \
    --exclude='logs/' --exclude='data/' --exclude='public/uploads/' \
    --exclude='.env' --exclude='.env.*' --exclude='.app-port' \
    "$SOURCE_REAL"/ "$APP_DIR"/
  ok "کد از $SOURCE_REAL همگام شد"
else
  die "نه مخزن گیت است و نه SOURCE_DIR داده شده. کد را با git clone مستقر کنید یا SOURCE_DIR بدهید."
fi

# ---------- ۳) بازگرداندن دادهٔ زنده ----------
echo "[update] ۳/۶ بازگرداندن دادهٔ زنده"
tar -xzf "$BACKUP_DIR/runtime-$STAMP.tar.gz" -C "$APP_DIR"
mkdir -p "$APP_DIR/logs" "$APP_DIR/public/uploads"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 700 "$APP_DIR/data"
find "$APP_DIR/data" -maxdepth 1 -type f -exec chmod 600 {} \;
chmod -R u+rwX,go-w "$APP_DIR/public/uploads"
chown "$APP_USER:$APP_USER" "$APP_DIR/.env.production"
chmod 600 "$APP_DIR/.env.production"
ok "داده، آپلودها و مجوزها بازگردانده شدند"

# ---------- ۴) نصب وابستگی‌ها و بیلد ----------
echo "[update] ۴/۶ نصب وابستگی‌ها و بیلد"
run_as_app "cd '$APP_DIR' && export PATH='$NODE_DIR:/usr/local/bin:/usr/bin:/bin:\$PATH' && '$NPM_BIN' ci --no-audit --no-fund"
run_as_app "cd '$APP_DIR' && export PATH='$NODE_DIR:/usr/local/bin:/usr/bin:/bin:\$PATH' && NODE_OPTIONS='--max-old-space-size=2048' '$NPM_BIN' run build"
ok "بیلد تولید کامل شد"

# ---------- ۵) ری‌استارت تک‌پروسه با PM2 ----------
echo "[update] ۵/۶ ری‌استارت سرویس"
PM2_CMD="export PATH='$NODE_DIR:/usr/local/bin:/usr/bin:/bin:\$PATH' && cd '$APP_DIR' &&"
if run_as_app "$PM2_CMD '$PM2_BIN' describe '$APP_NAME' > /dev/null 2>&1"; then
  run_as_app "$PM2_CMD '$PM2_BIN' reload ecosystem.config.js --update-env"
else
  run_as_app "$PM2_CMD '$PM2_BIN' start ecosystem.config.js"
fi
run_as_app "$PM2_CMD '$PM2_BIN' save"
ok "PM2: $APP_NAME (instances=1، فقط 127.0.0.1:$APP_PORT)"

# ---------- ۶) تست، preflight و سلامت ----------
echo "[update] ۶/۶ تست و بررسی سلامت"
if [ "$RUN_TESTS" = "1" ]; then
  run_as_app "cd '$APP_DIR' && export PATH='$NODE_DIR:/usr/local/bin:/usr/bin:/bin:\$PATH' && '$NPM_BIN' test"
else
  warn "تست‌ها رد شدند (RUN_TESTS=0)"
fi

run_as_app "cd '$APP_DIR' && export PATH='$NODE_DIR:/usr/local/bin:/usr/bin:/bin:\$PATH' && '$NODE_BIN' scripts/preflight.mjs"

sleep 3
curl -fsS -o /dev/null "http://127.0.0.1:$APP_PORT/fa" \
  || die "health check ناموفق: http://127.0.0.1:$APP_PORT/fa — لاگ: pm2 logs $APP_NAME --lines 80"
curl -s -o /dev/null -w "  /admin → %{http_code} (انتظار 307)\n" "http://127.0.0.1:$APP_PORT/admin"
curl -s -o /dev/null -w "  /api/cv-tables → %{http_code} (انتظار 401)\n" "http://127.0.0.1:$APP_PORT/api/cv-tables"

VERSION="$(run_as_app "cd '$APP_DIR' && git log -1 --oneline 2>/dev/null" || echo 'بدون گیت')"
echo "[update] ✅ نسخهٔ فعال: $VERSION"
echo "[update] بکاپ این اجرا: $BACKUP_DIR/runtime-$STAMP.tar.gz"
echo "[update] اگر deploy/aapanel/nginx-snippet.conf عوض شده، آن را دوباره در کانفیگ سایت aaPanel اعمال کنید."
