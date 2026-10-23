#!/usr/bin/env bash
# ============================================================
# PSM VALVE — ساخت فایل .env.production با اسرار تصادفی
#
#   bash deploy/make-env.sh [--admin-user admin] [--force] [--print]
#
# • اگر .env.production از قبل باشد دست نمیزند (بیخطر برای اجرای دوباره)
#   مگر با --force.
# • JWT_SECRET و CONTACT_CHALLENGE_SECRET تصادفی و ≥۳۲ بایت ساخته میشوند.
# • رمز مدیر اینجا نوشته نمیشود؛ بهصورت هش bcrypt در data/admin.json
#   ذخیره میشود (scripts/rotate-admin-password.mjs).
# • ⚠️ تغییر JWT_SECRET بعد از بیلد، نیازمند بیلد دوباره است (میدلور Edge
#   مقدار را در زمان بیلد درونریزی میکند).
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
ADMIN_USER="${ADMIN_USERNAME:-admin}"
FORCE=false
PRINT=false

while [ $# -gt 0 ]; do
  case "$1" in
    --force) FORCE=true ;;
    --print) PRINT=true ;;
    --admin-user) ADMIN_USER="${2:-admin}"; shift ;;
    --admin-user=*) ADMIN_USER="${1#*=}" ;;
    -h|--help)
      echo "استفاده: bash deploy/make-env.sh [--admin-user admin] [--force] [--print]"
      exit 0
      ;;
    *)
      echo "✖ گزینهٔ ناشناخته: $1"
      exit 1
      ;;
  esac
  shift
done

random_secret() {
  local bytes="${1:-48}"
  if command -v openssl > /dev/null 2>&1; then
    openssl rand -base64 "$bytes" | tr -d '\n'
  else
    head -c "$bytes" /dev/urandom | base64 | tr -d '\n'
  fi
}

if [ -f "$ENV_FILE" ] && [ "$FORCE" != true ]; then
  echo "▲ $ENV_FILE از قبل وجود دارد — دستنخورده ماند."
  echo "  برای بازنویسی: bash deploy/make-env.sh --force"
  if [ "$PRINT" = true ]; then sed -n '1,60p' "$ENV_FILE"; fi
  exit 0
fi

JWT_SECRET="$(random_secret 48)"
CHALLENGE_SECRET="$(random_secret 32)"

umask 077
cat > "$ENV_FILE" <<EOF
# PSM VALVE — متغیرهای محیطی تولید
# ساختهشده توسط deploy/make-env.sh — در گیت ردیابی نمیشود (دسترسی 600).
NODE_ENV=production

# ---------- امنیت (اجباری) ----------
JWT_SECRET=$JWT_SECRET
ADMIN_USERNAME=$ADMIN_USER
# رمز مدیر بهصورت هش bcrypt در data/admin.json نگه داشته میشود.
# فقط اگر میخواهید از متغیر محیطی استفاده کنید یکی از این دو را پر کنید:
ADMIN_PASSWORD=
ADMIN_PASSWORD_HASH=
# در تولید هرگز true نباشد (admin/admin را فعال میکند):
ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS=
CONTACT_CHALLENGE_SECRET=$CHALLENGE_SECRET

# ---------- مسیر دادهٔ پایدار (اختیاری، برای Docker/دیسک جدا) ----------
# PSM_DATA_DIR=$ROOT/data
# PSM_DATABASE_PATH=$ROOT/data/psm-valve.sqlite

# ---------- اعلان ایمیلی فرم تماس (اختیاری) ----------
# جیمیل: تأیید دو مرحلهای را فعال کنید و App Password بسازید.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=psmvalve@gmail.com
SMTP_PASS=
CONTACT_TO=psmvalve@gmail.com
# گیرندهٔ هشدارهای خطای سرور (۵xx و شکست SMTP) — در نبودش همان CONTACT_TO
ALERT_EMAIL_TO=$CONTACT_TO
EOF
chmod 600 "$ENV_FILE"

echo "✅ ساخته شد: $ENV_FILE (دسترسی 600)"
echo "   JWT_SECRET ساخته شد (${#JWT_SECRET} کاراکتر) · CONTACT_CHALLENGE_SECRET ساخته شد"
echo "   گام بعدی: npm ci && npm run build && pm2 reload ecosystem.config.js --update-env"
if [ "$PRINT" = true ]; then sed -n '1,60p' "$ENV_FILE"; fi