#!/usr/bin/env bash
# ============================================================
# PSM VALVE — آمادهسازی سرور تازه (Ubuntu 22.04 / 24.04)
# اجرا:  sudo bash deploy/bootstrap-server.sh
# فقط یکبار لازم است. بعد از آن ادامهٔ گامهای DEPLOY.md.
# ============================================================
set -euo pipefail

APP_USER="${APP_USER:-psm}"
APP_DIR="${APP_DIR:-/var/www/psm-valve}"

if [ "$(id -u)" -ne 0 ]; then
  echo "این اسکریپت باید با root/sudo اجرا شود: sudo bash deploy/bootstrap-server.sh"
  exit 1
fi

if [ -d /www/server/panel ] && [ "${ALLOW_AAPANEL:-false}" != "true" ]; then
  echo "این سرور aaPanel دارد. برای نصب روی aaPanel از deploy/aapanel/README.md استفاده کنید."
  echo "اگر آگاهانه می‌خواهید Nginx/PM2 سیستمی را جایگزین پنل کنید: ALLOW_AAPANEL=true bash deploy/bootstrap-server.sh"
  exit 1
fi

echo "==> 1/7 بهروزرسانی بستهها و نصب پیشنیازها"
apt update && apt upgrade -y
apt install -y nginx git curl ufw fail2ban build-essential unzip ca-certificates \
  certbot python3-certbot-nginx apache2-utils

echo "==> 2/7 نصب Node.js 22 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v

echo "==> 3/7 نصب PM2"
npm install -g pm2
pm2 -v

echo "==> 4/7 ساخت کاربر اجراکننده: $APP_USER"
if ! id "$APP_USER" > /dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$APP_USER"
fi

# انتقال کلیدهای SSH روت به کاربر برنامه (برای ورود بدون رمز)
if [ -f /root/.ssh/authorized_keys ] && [ ! -f "/home/$APP_USER/.ssh/authorized_keys" ]; then
  mkdir -p "/home/$APP_USER/.ssh"
  cp /root/.ssh/authorized_keys "/home/$APP_USER/.ssh/authorized_keys"
  chown -R "$APP_USER:$APP_USER" "/home/$APP_USER/.ssh"
  chmod 700 "/home/$APP_USER/.ssh"
  chmod 600 "/home/$APP_USER/.ssh/authorized_keys"
  echo "    کلید SSH روت به کاربر $APP_USER منتقل شد."
fi

echo "==> 5/7 ساخت مسیرهای پروژه و بکاپ"
mkdir -p "$APP_DIR" /var/backups/psm-valve "$APP_DIR/logs"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" /var/backups/psm-valve

echo "==> 6/7 ساخت سواپ ۲ گیگابایتی (کمک به بیلد روی سرور ۲GB)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    سواپ فعال شد."
else
  echo "    سواپ از قبل وجود دارد."
fi

echo "==> 7/7 فایروال و سرویسها"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
systemctl enable --now fail2ban nginx

cat <<EOF

✅ آمادهسازی سرور تمام شد.

مرحلههای بعدی:
  1) su - $APP_USER
  2) git clone https://github.com/AHSHNO1/psm-valve.git $APP_DIR
  3) cd $APP_DIR && npm ci && npm run build
  4) ساخت .env.production  (گام ۵ در DEPLOY.md)
  5) pm2 start ecosystem.config.js && pm2 save && pm2 startup
  6) Nginx: sudo cp deploy/nginx-psmvalve.conf /etc/nginx/sites-available/psmvalve.conf
  7) certbot --nginx -d psmvalve.com -d www.psmvalve.com
  8) cron بکاپ روزانه (گام ۵ در DEPLOY.md)

راهنمای کامل: DEPLOY.md
EOF