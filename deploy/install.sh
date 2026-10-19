#!/usr/bin/env bash
# ============================================================
# PSM VALVE — نصب و راهاندازی کامل خودکار روی سرور لینوکسی (Ubuntu/Debian)
#
#   sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com
#
# این یک فایل، همهٔ کارهای انتشار را انجام میدهد:
#    ۱) بررسی پیشنیازها و سیستمعامل
#    ۲) نصب Node.js 20 LTS، PM2، Nginx، Certbot و ابزار بیلد
#    ۳) ساخت کاربر اجراکننده، پوشهها و سواپ (برای بیلد روی سرور کمحافظه)
#    ۴) دریافت کد از گیت (clone در نصب اول، pull در اجرای دوباره)
#    ۵) نصب وابستگیها (npm ci)
#    ۶) ساخت .env.production با اسرار تصادفی
#    ۷) تنظیم رمز مدیر بهصورت هش bcrypt در data/admin.json
#    ۸) بیلد نسخهٔ تولید
#    ۹) اجرای دائمی با PM2 + راهاندازی خودکار پس از ریاستارت سرور
#   ۱۰) Nginx + گواهی SSL رایگان Let's Encrypt (+ فایروال و fail2ban)
#   ۱۱) cron بکاپ روزانه + بررسی سلامت + خلاصهٔ پایان کار
#
# اجرای دوباره بیخطر است (idempotent) و دادهٔ موجود (data/, public/uploads)
# را پاک نمیکند.
# ============================================================
set -euo pipefail

# ---------- پیشفرضها (با متغیر محیطی هم قابل تغییرند) ----------
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
REPO_URL="${REPO_URL:-https://github.com/AHSHNO1/psm-valve.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/psm-valve}"
APP_USER="${APP_USER:-psm}"
APP_NAME="${APP_NAME:-psm-valve}"
APP_PORT="${APP_PORT:-3000}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/psm-valve}"
NODE_MAJOR="${NODE_MAJOR:-20}"
ENABLE_SSL=true
ENABLE_FIREWALL=true
RUN_BUILD=true
ENABLE_CRON=true

TOTAL_STEPS=11
STEP=0

usage() {
  cat <<'EOF'
PSM VALVE — نصب خودکار روی سرور (Ubuntu/Debian)

  sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com

گزینهها:
  --domain <domain>         دامنهٔ اصلی (اجباری). پیشوند www خودکار مدیریت میشود.
  --email <email>           ایمیل Let's Encrypt (پیشفرض: admin@<domain>)
  --repo <git-url>          آدرس مخزن گیت (پیشفرض: مخزن پروژه)
  --branch <name>           شاخهٔ انتشار (پیشفرض: main)
  --app-dir <path>          مسیر نصب (پیشفرض: /var/www/psm-valve)
  --app-user <user>         کاربر اجراکنندهٔ سرویس (پیشفرض: psm)
  --port <number>           پورت اپلیکیشن (پیشفرض: 3000) — در فایل .app-port ذخیره و در Nginx هم استفاده میشود
  --admin-user <user>       نام کاربری پنل مدیریت (پیشفرض: admin)
  --admin-password <pass>   رمز پنل؛ اگر ندهید رمز تصادفی ساخته و نمایش داده میشود
  --no-ssl                  بدون SSL (فقط HTTP؛ موقت)
  --no-firewall             بدون تنظیم ufw و fail2ban
  --skip-build              پرش از بیلد (اگر .next از قبل آماده است)
  --no-cron                 بدون نصب cron بکاپ روزانه
  -h, --help                همین راهنما

متغیرهای محیطی همپوشان: DOMAIN · EMAIL · REPO_URL · BRANCH · APP_DIR · APP_USER · APP_PORT
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift ;;
    --domain=*) DOMAIN="${1#*=}" ;;
    --email) EMAIL="${2:-}"; shift ;;
    --email=*) EMAIL="${1#*=}" ;;
    --repo) REPO_URL="${2:-}"; shift ;;
    --repo=*) REPO_URL="${1#*=}" ;;
    --branch) BRANCH="${2:-}"; shift ;;
    --branch=*) BRANCH="${1#*=}" ;;
    --app-dir) APP_DIR="${2:-}"; shift ;;
    --app-dir=*) APP_DIR="${1#*=}" ;;
    --app-user) APP_USER="${2:-}"; shift ;;
    --app-user=*) APP_USER="${1#*=}" ;;
    --port) APP_PORT="${2:-}"; shift ;;
    --port=*) APP_PORT="${1#*=}" ;;
    --admin-user) ADMIN_USER="${2:-}"; shift ;;
    --admin-user=*) ADMIN_USER="${1#*=}" ;;
    --admin-password) ADMIN_PASSWORD="${2:-}"; shift ;;
    --admin-password=*) ADMIN_PASSWORD="${1#*=}" ;;
    --no-ssl) ENABLE_SSL=false ;;
    --no-firewall) ENABLE_FIREWALL=false ;;
    --skip-build) RUN_BUILD=false ;;
    --no-cron) ENABLE_CRON=false ;;
    -h|--help) usage; exit 0 ;;
    *) echo "✖ گزینهٔ ناشناخته: $1"; usage; exit 1 ;;
  esac
  shift
done

if [ -z "$DOMAIN" ]; then
  echo "✖ دامنه مشخص نشده است."
  usage
  exit 1
fi
DOMAIN="${DOMAIN#www.}"
DOMAIN="${DOMAIN%/}"
EMAIL="${EMAIL:-admin@$DOMAIN}"

if [ "$(id -u)" -ne 0 ]; then
  echo "✖ این اسکریپت باید با root اجرا شود:  sudo bash deploy/install.sh --domain $DOMAIN"
  exit 1
fi

log()  { echo "    $*"; }
ok()   { echo "    ✔ $*"; }
warn() { echo "    ▲ $*"; }
step() { STEP=$((STEP + 1)); echo; echo "==> [$STEP/$TOTAL_STEPS] $*"; }
die()  { echo; echo "✖ $*"; exit 1; }
case "${APP_PORT:-}" in
  ''|*[!0-9]*) die "پورت نامعتبر: «${APP_PORT}» — یک عدد بدهید (پیشفرض ۳۰۰۰)." ;;
esac
if [ "$APP_PORT" -lt 1 ] || [ "$APP_PORT" -gt 65535 ]; then
  die "پورت خارج از بازهٔ مجاز (۱ تا ۶۵۵۳۵): $APP_PORT"
fi

# اجرای دستور با کاربر سرویس (env تمیز + PATH مطمئن)
as_app() { su - "$APP_USER" -c "export PATH=\"/usr/local/bin:/usr/bin:/bin:\$PATH\"; $1"; }

random_password() {
  local raw
  raw="$(openssl rand -base64 32 | tr -d '\n')"
  printf '%s' "$raw" | tr -dc 'A-Za-z0-9' | cut -c1-"${1:-20}"
}

# ---------- ۱) پیشنیازها ----------
step "بررسی سیستمعامل و پیشنیازها"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  case "${ID:-unknown}" in
    ubuntu|debian) ok "سیستمعامل: ${PRETTY_NAME:-$ID}" ;;
    *) warn "این اسکریپت برای Ubuntu/Debian نوشته شده؛ «${ID:-unknown}» آزمایش نشده است." ;;
  esac
fi
command -v apt-get > /dev/null 2>&1 || die "apt-get پیدا نشد. برای هاست cPanel از deploy/cpanel و برای Docker از deploy/docker.sh استفاده کنید."
ok "root ✓ · دامنه: $DOMAIN · مسیر نصب: $APP_DIR · SSL: $ENABLE_SSL"

# ---------- ۲) بستههای پایه، Node، PM2 ----------
step "نصب بستههای پایه، Node.js $NODE_MAJOR و PM2"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git openssl build-essential python3 unzip nginx > /dev/null
ok "بستههای پایه نصب شدند"

NODE_OK=false
if command -v node > /dev/null 2>&1; then
  CURRENT_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
  if [ "$CURRENT_MAJOR" -ge "$NODE_MAJOR" ]; then NODE_OK=true; fi
fi
if [ "$NODE_OK" = true ]; then
  ok "Node.js موجود است: $(node -v)"
else
  log "افزودن مخزن NodeSource و نصب Node.js $NODE_MAJOR ..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
  ok "Node.js نصب شد: $(node -v)"
fi

if ! command -v pm2 > /dev/null 2>&1; then
  npm install -g pm2 > /dev/null 2>&1
fi
ok "PM2: $(pm2 -v)"

if [ "$ENABLE_SSL" = true ]; then
  apt-get install -y -qq certbot python3-certbot-nginx > /dev/null
  ok "Certbot نصب شد"
fi
if [ "$ENABLE_FIREWALL" = true ]; then
  apt-get install -y -qq ufw fail2ban > /dev/null
  ok "ابزارهای فایروال نصب شدند"
fi

# ---------- ۳) کاربر اجرا، پوشهها، سواپ ----------
step "ساخت کاربر اجراکننده، پوشهها و سواپ"
if id "$APP_USER" > /dev/null 2>&1; then
  ok "کاربر $APP_USER از قبل وجود دارد"
else
  adduser --disabled-password --gecos "" "$APP_USER" > /dev/null
  ok "کاربر $APP_USER ساخته شد"
fi

if [ -f /root/.ssh/authorized_keys ] && [ ! -f "/home/$APP_USER/.ssh/authorized_keys" ]; then
  mkdir -p "/home/$APP_USER/.ssh"
  cp /root/.ssh/authorized_keys "/home/$APP_USER/.ssh/authorized_keys"
  chown -R "$APP_USER:$APP_USER" "/home/$APP_USER/.ssh"
  chmod 700 "/home/$APP_USER/.ssh"
  chmod 600 "/home/$APP_USER/.ssh/authorized_keys"
  ok "کلید SSH روت به کاربر $APP_USER منتقل شد (ورود بدون رمز)"
fi

mkdir -p "$APP_DIR" "$BACKUP_DIR" /var/www/html
chown "$APP_USER:$APP_USER" "$APP_DIR" "$BACKUP_DIR"
ok "پوشهها آمادهاند: $APP_DIR · $BACKUP_DIR"

SWAP_TOTAL="$(free -m | awk '/^Swap:/ {print $2}')"
RAM_TOTAL="$(free -m | awk '/^Mem:/ {print $2}')"
if [ "${SWAP_TOTAL:-0}" -lt 1024 ] && [ "${RAM_TOTAL:-0}" -lt 4096 ] && [ ! -f /swapfile ]; then
  log "حافظه کم است (${RAM_TOTAL}MB) — ساخت سواپ ۲ گیگابایتی برای بیلد ..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile > /dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "سواپ ۲ گیگابایتی فعال شد"
else
  ok "حافظه: RAM ${RAM_TOTAL}MB · Swap ${SWAP_TOTAL}MB"
fi

# ---------- ۴) دریافت کد ----------
step "دریافت کد پروژه (شاخهٔ $BRANCH)"
if [ -d "$APP_DIR/.git" ]; then
  as_app "cd '$APP_DIR' && git fetch --all --prune && git checkout '$BRANCH' && git pull --ff-only"
  ok "کد بهروزرسانی شد"
else
  if [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    die "پوشهٔ $APP_DIR خالی نیست و مخزن گیت ندارد. آن را خالی کنید یا با --app-dir مسیر دیگری بدهید."
  fi
  log "clone از $REPO_URL ..."
  if ! as_app "git clone --branch '$BRANCH' '$REPO_URL' '$APP_DIR'"; then
    die "دریافت کد ناموفق بود. اگر مخزن خصوصی است از SSH یا توکن استفاده کنید: --repo git@github.com:USER/psm-valve.git"
  fi
  ok "مخزن clone شد"
fi
mkdir -p "$APP_DIR/logs"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "نسخهٔ دریافتشده: $(su - "$APP_USER" -c "cd '$APP_DIR' && git log -1 --oneline")"

# ---------- ۵) نصب وابستگیها ----------
step "نصب وابستگیها (npm ci)"
as_app "cd '$APP_DIR' && npm ci --no-audit --no-fund"
ok "node_modules آماده است"

# ---------- ۶) متغیرهای محیطی ----------
step "ساخت فایل .env.production با اسرار تصادفی"
as_app "cd '$APP_DIR' && bash deploy/make-env.sh --admin-user '$ADMIN_USER'"
chown "$APP_USER:$APP_USER" "$APP_DIR/.env.production"
chmod 600 "$APP_DIR/.env.production"
ok "متغیرهای محیطی ساخته شد: $APP_DIR/.env.production (دسترسی 600)"

# ---------- ۷) رمز مدیر ----------
step "تنظیم رمز پنل مدیریت"
GENERATED_PASSWORD=""
SET_PASSWORD=""
if [ -f "$APP_DIR/data/admin.json" ]; then
  ok "رمز مدیر از قبل تنظیم شده است (data/admin.json) — تغییر نکرد"
elif [ -n "$ADMIN_PASSWORD" ]; then
  SET_PASSWORD="$ADMIN_PASSWORD"
else
  SET_PASSWORD="$(random_password 20)"
  GENERATED_PASSWORD="$SET_PASSWORD"
fi
if [ -n "$SET_PASSWORD" ]; then
  as_app "cd '$APP_DIR' && node scripts/rotate-admin-password.mjs --password '$SET_PASSWORD'" > /dev/null
  ok "رمز مدیر ذخیره شد (هش bcrypt) برای کاربر «$ADMIN_USER»"
fi

# ---------- ۸) بیلد تولید ----------
# نکتهٔ مهم: بیلد باید «بعد از» ساخت .env.production انجام شود، چون
# middleware.js روی Edge مقدار JWT_SECRET را در زمان بیلد درونریزی میکند.
step "بیلد نسخهٔ تولید"
if [ "$RUN_BUILD" = true ]; then
  log "این گام روی سرورهای کمرمز چند دقیقه طول میکشد ..."
  as_app "cd '$APP_DIR' && NODE_OPTIONS='--max-old-space-size=2048' npm run build"
  ok "بیلد کامل شد: $APP_DIR/.next"
else
  warn "بیلد رد شد (--skip-build) — قبل از اجرا باید .next موجود باشد"
fi

# ---------- ۹) اجرای دائمی با PM2 ----------
step "اجرای سرویس با PM2 و راهاندازی خودکار پس از ریاستارت سرور"
[ -f "$APP_DIR/ecosystem.config.js" ] || die "ecosystem.config.js در $APP_DIR پیدا نشد."
# پورت اپ: فایل .app-port منبع یکتای پورت است (هم nginx و هم PM2 از آن میخوانند)
# این فایل با git نمیآید و deploy.sh با reset --hard پاکش نمیکند.
if ! printf '%s' "$APP_PORT" > "$APP_DIR/.app-port"; then
  warn "نوشتن $APP_DIR/.app-port ناموفق بود — PM2 روی پورت پیشفرض (۳۰۰۰) اجرا میشود"
else
  chown "$APP_USER:$APP_USER" "$APP_DIR/.app-port" 2>/dev/null || true
fi
if [ "$APP_PORT" != "3000" ]; then
  ok "پورت اپ روی $APP_PORT تنظیم شد (nginx و PM2 هر دو از .app-port میخوانند)"
fi
as_app "cd '$APP_DIR' && (pm2 describe '$APP_NAME' > /dev/null 2>&1 && pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js) && pm2 save"
ok "سرویس $APP_NAME اجرا شد (instances=1 برای درست بودن محدودسازی نرخ در حافظه)"

STARTUP_CMD="$(pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>&1 | grep -E '^(sudo|env) ' | tail -n 1 || true)"
if [ -n "${STARTUP_CMD:-}" ]; then
  eval "$STARTUP_CMD" > /dev/null 2>&1 || warn "اجرای دستور راهاندازی خودکار ناموفق بود. دستی اجرا کنید: $STARTUP_CMD"
  ok "PM2 پس از ریاستارت سرور خودکار بالا میآید"
else
  warn "برای راهاندازی خودکار دستی اجرا کنید: pm2 startup systemd -u $APP_USER --hp /home/$APP_USER"
fi

# ---------- ۱۰) Nginx و SSL ----------
write_http_config() {
  cat > /etc/nginx/sites-available/psmvalve.conf <<EOF
# PSM VALVE — کانفیگ HTTP (بدون SSL) — ساختهشده توسط deploy/install.sh
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 60m;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # مسیر تمدید خودکار گواهی Let's Encrypt
    location /.well-known/acme-challenge/ { root /var/www/html; }

    location ^~ /uploads/ {
        alias $APP_DIR/public/uploads/;
        access_log off;
        expires 30d;
    }

    location ~* ^/(images|documents|hdri|logo|og|icons|fonts)/ {
        root $APP_DIR/public;
        access_log off;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF
}

install_https_config() {
  # کانفیگ پختهٔ پروژه با جایگزینی مسیر نصب، دامنه و پورت
  sed -e "s#/var/www/psm-valve#$APP_DIR#g" \
      -e "s/psmvalve\.com/$DOMAIN/g" \
      -e "s/127\.0\.0\.1:3000/127.0.0.1:$APP_PORT/g" \
    "$APP_DIR/deploy/nginx-psmvalve.conf" > /etc/nginx/sites-available/psmvalve.conf
}

reload_nginx() {
  nginx -t > /dev/null 2>&1 || die "کانفیگ Nginx نامعتبر است — /etc/nginx/sites-available/psmvalve.conf را بررسی کنید."
  systemctl enable nginx > /dev/null 2>&1 || true
  systemctl reload nginx || systemctl restart nginx
}

step "Nginx، گواهی SSL و فایروال"
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/psmvalve.conf /etc/nginx/sites-enabled/psmvalve.conf

SSL_READY=false
if [ "$ENABLE_SSL" = true ]; then
  write_http_config
  reload_nginx
  ok "کانفیگ HTTP فعال شد (سایت از همین حالا روی HTTP در دسترس است)"

  if [ -d "/etc/letsencrypt/live/www.$DOMAIN" ]; then
    SSL_READY=true
    ok "گواهی SSL از قبل موجود است"
  else
    log "درخواست گواهی Let's Encrypt برای www.$DOMAIN و $DOMAIN ..."
    if certbot certonly --webroot -w /var/www/html -d "www.$DOMAIN" -d "$DOMAIN" \
        --non-interactive --agree-tos --no-eff-email -m "$EMAIL" --keep-until-expiring > /dev/null 2>&1; then
      SSL_READY=true
      ok "گواهی SSL صادر شد"
    else
      warn "صدور گواهی ناموفق بود (احتمالاً DNS دامنه هنوز به این سرور اشاره نمیکند)."
      warn "بعد از تنظیم DNS اجرا کنید: certbot certonly --webroot -w /var/www/html -d www.$DOMAIN -d $DOMAIN"
    fi
  fi

  mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOS'
#!/bin/sh
systemctl reload nginx
EOS
  chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

  if [ "$SSL_READY" = true ]; then
    install_https_config
    reload_nginx
    ok "کانفیگ نهایی HTTPS فعال شد (هدایت http→https و $DOMAIN→www.$DOMAIN)"
  else
    warn "تا فعال شدن SSL، سایت روی HTTP سرو میشود."
  fi
else
  write_http_config
  reload_nginx
  warn "SSL غیرفعال است (--no-ssl) — سایت فقط روی HTTP است."
fi

if [ "$ENABLE_FIREWALL" = true ]; then
  ufw allow OpenSSH > /dev/null
  ufw allow 'Nginx Full' > /dev/null
  ufw --force enable > /dev/null
  systemctl enable --now fail2ban > /dev/null 2>&1 || true
  ok "فایروال (OpenSSH + 80/443) و fail2ban فعال شد"
fi

# ---------- ۱۱) بکاپ روزانه، بررسی سلامت و خلاصه ----------
step "بکاپ روزانه، بررسی سلامت و خلاصهٔ انتشار"
if [ "$ENABLE_CRON" = true ]; then
  CRON_LINE="0 3 * * * su - $APP_USER -c 'cd $APP_DIR && bash deploy/backup.sh' >> $APP_DIR/logs/backup.log 2>&1"
  TMP_CRON="$(mktemp)"
  crontab -l 2>/dev/null | grep -v 'psm-valve' > "$TMP_CRON" || true
  echo "$CRON_LINE" >> "$TMP_CRON"
  crontab "$TMP_CRON"
  rm -f "$TMP_CRON"
  ok "بکاپ روزانه ساعت ۳ بامداد در cron ثبت شد (نگهداری ۱۴ روز → $BACKUP_DIR)"
else
  warn "cron بکاپ نصب نشد (--no-cron)"
fi

as_app "cd '$APP_DIR' && node scripts/preflight.mjs" > /tmp/psm-preflight.log 2>&1 \
  && ok "بررسی پیشازانتشار (preflight) بدون خطا بود" \
  || warn "preflight هشدار داد — جزئیات: /tmp/psm-preflight.log"

HEALTH=false
for _ in $(seq 1 20); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$APP_PORT/fa" 2>/dev/null; then
    HEALTH=true
    break
  fi
  sleep 3
done

if [ -n "$GENERATED_PASSWORD" ]; then
  echo "$GENERATED_PASSWORD" > /root/psm-initial-admin-password.txt
  chmod 600 /root/psm-initial-admin-password.txt
fi

echo
echo "============================================================"
echo "  PSM VALVE — انتشار کامل شد"
echo "============================================================"
echo
if [ "$ENABLE_SSL" = true ] && [ "$SSL_READY" = true ]; then
  echo "  آدرس سایت :  https://www.$DOMAIN/fa   (و https://$DOMAIN)"
  echo "  پنل مدیریت:  https://www.$DOMAIN/admin"
else
  echo "  آدرس سایت :  http://$DOMAIN/fa   (تا فعال شدن SSL)"
  echo "  پنل مدیریت:  http://$DOMAIN/admin"
fi
echo "  کاربر پنل :  $ADMIN_USER"
if [ -n "$GENERATED_PASSWORD" ]; then
  echo "  رمز پنل   :  $GENERATED_PASSWORD"
  echo "               (در /root/psm-initial-admin-password.txt هم ذخیره شد)"
  echo "               ⚠️ بعد از اولین ورود از بخش «امنیت» پنل تغییرش دهید."
elif [ -n "$ADMIN_PASSWORD" ]; then
  echo "  رمز پنل   :  همان رمزی که با --admin-password دادید"
else
  echo "  رمز پنل   :  از قبل تنظیمشده (data/admin.json) — بدون تغییر"
fi
echo
echo "  مسیر پروژه:  $APP_DIR   (کاربر: $APP_USER)"
echo "  لاگها     :  $APP_DIR/logs/pm2-out.log · pm2-error.log"
echo "  بکاپها    :  $BACKUP_DIR"
echo "  کانفیگ وب :  /etc/nginx/sites-available/psmvalve.conf"
if [ "$HEALTH" = true ]; then
  echo "  سلامت سرویس: ✔ پاسخدهی روی http://127.0.0.1:$APP_PORT تأیید شد"
else
  echo "  سلامت سرویس: ▲ هنوز پاسخ نداد — بررسی کنید: pm2 logs $APP_NAME"
fi
echo
echo "  بهروزرسانی بعدی:  su - $APP_USER -c 'bash $APP_DIR/deploy/update.sh'"
echo "  بازرسی وضعیت    :  su - $APP_USER -c 'pm2 status'"
echo "  ورود به پنل     :  https://www.$DOMAIN/admin/login"
echo
if [ "$ENABLE_SSL" = true ] && [ "$SSL_READY" != true ]; then
  echo "  ⚠️ SSL صادر نشد. بعد از اینکه DNS دامنه به این سرور (IP این سرور) اشاره کرد:"
  echo "     certbot certonly --webroot -w /var/www/html -d www.$DOMAIN -d $DOMAIN && \\"
  echo "     bash $APP_DIR/deploy/install.sh --domain $DOMAIN --skip-build"
  echo
fi
echo "============================================================"