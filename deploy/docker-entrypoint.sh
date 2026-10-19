#!/usr/bin/env bash
# ============================================================
# PSM VALVE — نقطهٔ ورود کانتینر (Docker)
#
# کارها:
#   ۱) اطمینان از وجود پوشهٔ دادهٔ پایدار و پوشهٔ آپلود
#   ۲) در اولین اجرا (وقتی volume خالی است) داده و آپلودهای اولیه را از
#      «نسخهٔ داخل ایمیج» (.seed) کپی میکند تا سایت خالی بالا نیاید
#   ۳) اجرای Next.js در حالت تولید (تکپروسه)
#
# متغیرها: PSM_DATA_DIR (پیشفرض /app/data) · PORT (پیشفرض 3000)
# ============================================================
set -euo pipefail

DATA_DIR="${PSM_DATA_DIR:-/app/data}"
UPLOAD_DIR="${PSM_UPLOAD_DIR:-/app/public/uploads}"

mkdir -p "$DATA_DIR" "$UPLOAD_DIR"

if [ -d /app/.seed/data ] && [ -z "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
  echo "[entrypoint] دادهٔ اولیهٔ سایت از ایمیج بازگردانی شد → $DATA_DIR"
  cp -a /app/.seed/data/. "$DATA_DIR"/
fi

if [ -d /app/.seed/uploads ] && [ -z "$(ls -A "$UPLOAD_DIR" 2>/dev/null)" ]; then
  echo "[entrypoint] داراییهای آپلودشدهٔ اولیه از ایمیج بازگردانی شد → $UPLOAD_DIR"
  cp -a /app/.seed/uploads/. "$UPLOAD_DIR"/
fi

export PSM_DATA_DIR="$DATA_DIR"
export PSM_DATABASE_PATH="${PSM_DATABASE_PATH:-$DATA_DIR/psm-valve.sqlite}"

# ── بیلد در اولین اجرا (یا وقتی کد تازهتر از خروجی بیلد است) ──
# دلیل: میدلور روی Edge، JWT_SECRET را در زمان بیلد درونریزی میکند؛
# پس بیلد باید با متغیرهای محیطی زمان اجرا انجام شود، نه داخل ایمیج.
# نکته: public/uploads از بررسی «تازهتر» کنار گذاشته شده، چون آپلودهای
# مدیر در زمان اجرا آن را تغییر میدهند و نباید باعث بیلد مجدد شوند
# (برای بیلد اجباری: PSM_FORCE_BUILD=1 docker compose up -d).
NEEDS_BUILD=false
if [ "${PSM_FORCE_BUILD:-}" = "1" ]; then
  NEEDS_BUILD=true
elif [ ! -f .next/BUILD_ID ]; then
  NEEDS_BUILD=true
elif [ -n "$(find app components lib messages middleware.js next.config.mjs package.json -newer .next/BUILD_ID -print -quit 2>/dev/null)" ]; then
  NEEDS_BUILD=true
elif [ -n "$(find public -path public/uploads -prune -o -type f -newer .next/BUILD_ID -print -quit 2>/dev/null)" ]; then
  NEEDS_BUILD=true
fi

if [ "$NEEDS_BUILD" = true ]; then
  echo "[entrypoint] بیلد نسخهٔ تولید (چند دقیقه طول میکشد) ..."
  NODE_OPTIONS="--max-old-space-size=2048" npm run build
  echo "[entrypoint] بیلد کامل شد."
fi

echo "[entrypoint] اجرای PSM VALVE روی پورت ${PORT:-3000} (داده: $PSM_DATA_DIR)"
exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}"