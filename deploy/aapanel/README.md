# انتشار PSM VALVE روی Ubuntu 24.04 با aaPanel

این راهنما برای نصب **پترو سازه میهن** روی یک VPS تازهٔ **Ubuntu 24.04** با پنل
**aaPanel 7.x** نوشته شده است. خروجی: سایت روی `https://www.<domain>`، پنل مدیریت روی
`/admin`، پروسهٔ Next.js روی `127.0.0.1:3000` و داده روی دیسک پایدار سرور.

> پیش‌نیازها: دسترسی `root` با SSH، دامنه با رکوردهای `A` برای `domain` و `www`،
> حداقل ۲GB RAM (بیلد Next به ۱.۵GB نیاز دارد) و دیسک پایدار.
>
> این پروژه روی **Vercel/Netlify/serverless** کار نمی‌کند: SQLite، فایل‌های JSON و
> `public/uploads` باید روی دیسک ماندگار باشند.

---

## ۰) معماری این مسیر

```
اینترنت
   │ 443/80
   ▼
Nginx داخل aaPanel (SSL + کش دارایی‌ها + محدودیت آپلود)
   │ 127.0.0.1:3000  (فقط loopback)
   ▼
Next.js 14 — یک پروسهٔ PM2 با کاربر www
   │
   ├── data/*.json            محتوا، تنظیمات، کاربران، پیام‌ها
   ├── data/psm-valve.sqlite  کاتالوگ محصولات
   └── public/uploads/**      تصاویر، ویدیو، کاتالوگ‌ها
```

سه قاعدهٔ این پروژه را به‌هم نزنید:

1. **همیشه یک instance** از Next اجرا شود؛ محدودسازی نرخ ورود/فرم تماس در حافظهٔ
   همان پروسه است.
2. **پورت 3000 هرگز از اینترنت باز نشود**؛ فقط Nginx به آن وصل شود.
3. `data/` و `public/uploads/` روی **دیسک پایدار** و در بکاپ باشند.

---

## ۱) نصب aaPanel روی Ubuntu 24.04

با کاربر `root` وارد سرور شوید:

```bash
apt-get update
apt-get install -y curl
URL=https://www.aapanel.com/script/install_7.0_en.sh && curl -ksSO "$URL" && bash install_7.0_en.sh aapanel
```

در پایان نصب، آدرس پنل، نام کاربری و رمز عبور یک‌بار نمایش داده می‌شود. آن را در جای
امن نگه دارید. اگر گم شد:

```bash
bt default      # نمایش آدرس/کاربر/رمز پنل
bt              # منوی مدیریت پنل (تغییر پورت، ری‌استارت، لاگ و…)
```

سپس:

1. در **Security Group فایروال ابری** (پنل ارائه‌دهندهٔ VPS) پورت پنل را فقط برای IP
   خودتان باز کنید. پورت ۸۰ و ۴۴۳ را برای همه باز بگذارید.
2. آدرس پنل را باز کنید و وارد شوید.
3. بلافاصله از **Panel → Settings → Security**:
   - رمز پیش‌فرض را عوض کنید.
   - پورت پنل را به یک عدد تصادفی تغییر دهید (پیش‌فرض ۸۸۸۸ نباشد).
   - **Panel SSL** را فعال کنید (دامنه یا IP).
   - **IP Whitelist / Bind IP** را فعال کنید تا پنل فقط از IP شما باز شود.
   - در صورت وجود، **BasicAuth** و **Google Authenticator / 2FA** را فعال کنید.
4. در **App Store** فقط چیزهایی را نصب کنید که لازم دارید. PHP/MySQL/Apache برای این
   پروژه لازم نیستند و بهتر است نصب نشوند.

> نکته: از `ufw` جداگانه استفاده نکنید. aaPanel فایروال خودش را مدیریت می‌کند و
> فعال‌کردن هم‌زمان `ufw` باعث قفل‌شدن پورت‌ها یا رفتار متناقض می‌شود.

---

## ۲) نصب Node.js 22 LTS و PM2

Node 20 در آوریل ۲۰۲۶ به پایان پشتیبانی رسیده؛ این پروژه روی **Node 22 LTS** آزمایش
شده است.

```bash
apt-get update
apt-get install -y ca-certificates curl build-essential python3
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v          # باید v22.x باشد
npm -v
npm install -g pm2
pm2 -v
```

اگر در App Store پنل، **Node.js Manager** را نصب کرده‌اید و Node 22 آنجاست، می‌توانید
از همان استفاده کنید؛ فقط مطمئن شوید `node` و `pm2` برای کاربر `www` هم در `PATH`
هستند. مسیر معمول نسخه‌های پنل:

```bash
ls /www/server/nodejs/
export PATH=/www/server/nodejs/v22.<patch>/bin:$PATH
```

برای جلوگیری از سردرگمی، نصب NodeSource بالا (که `node` را در `/usr/bin` می‌گذارد)
توصیه می‌شود.

---

## ۳) ساخت سایت و دریافت کد

### ۳.۱) سایت را در aaPanel بسازید

**Website → Add Site**:

| فیلد | مقدار |
| --- | --- |
| Domain | `psmvalve.com` و `www.psmvalve.com` (هر دو در یک سایت) |
| Root | `/www/wwwroot/psm-valve` |
| FTP | بدون FTP |
| Database | بدون دیتابیس |
| PHP | Pure static / No PHP |

اگر aaPanel در ریشهٔ سایت فایل‌های پیش‌فرض (`index.html`، `404.html`، `.htaccess`)
ساخت، آن‌ها را از **File Manager** پاک کنید؛ این یک سایت تازه است و بعداً کانفیگ
Nginx را خودمان می‌گذاریم.

### ۳.۲) کد را روی سرور بگیرید

در **Terminal** پنل یا با SSH:

```bash
cd /www/wwwroot/psm-valve
git clone https://github.com/AHSHNO1/psm-valve.git .
```

اگر مخزن خصوصی است، از SSH یا توکن GitHub استفاده کنید. اگر کد را با ZIP از ویندوز
می‌آورید، آن را در همین مسیر extract کنید و **`node_modules/` و `.next/` ویندوز را
آپلود نکنید**؛ باید روی سرور ساخته شوند.

سپس مالکیت را به کاربر `www` بدهید (Nginx و اپ هر دو با این کاربر اجرا می‌شوند):

```bash
chown -R www:www /www/wwwroot/psm-valve
```

### ۳.۳) دادهٔ موجود را منتقل کنید (اگر از نصب قبلی می‌آیید)

اگر سایت از قبل داده دارد، **قبل از بیلد** این‌ها را منتقل کنید:

- `data/*.json`
- `data/psm-valve.sqlite`
- `public/uploads/**`

از ویندوز:

```powershell
.\deploy\push-assets.ps1 -Server <IP> -User root -RemotePath /www/wwwroot/psm-valve
```

`push-assets.ps1` به‌طور پیش‌فرض `admin.json`، `users.json` و `messages.json` را منتقل
نمی‌کند. اگر مهاجرت کامل می‌خواهید و از بکاپ سرور قبلی مطمئن هستید:

```powershell
.\deploy\push-assets.ps1 -Server <IP> -User root -RemotePath /www/wwwroot/psm-valve -IncludePrivateData
```

بعد از انتقال، روی سرور:

```bash
cd /www/wwwroot/psm-valve
mkdir -p data public/uploads logs
chown -R www:www data public/uploads logs
chmod 700 data
find data -maxdepth 1 -type f -exec chmod 600 {} \;
chmod -R u+rwX,go-w public/uploads
```

> اگر سرور تازه است، `data/` از مخزن می‌آید و رمز مدیر را در گام ۴ می‌سازید؛
> `data/admin.json` را از سیستم محلی منتقل نکنید.

---

## ۴) متغیرهای محیطی، رمز مدیر و مجوزها

### ۴.۱) ساخت `.env.production`

```bash
cd /www/wwwroot/psm-valve
bash deploy/make-env.sh --admin-user admin
chown www:www .env.production
chmod 600 .env.production
```

فایل را باز کنید و فقط موارد لازم را پر کنید:

```bash
nano .env.production
```

حداقل‌ها:

```dotenv
NODE_ENV=production
JWT_SECRET=<حداقل ۳۲ بایت تصادفی>
ADMIN_USERNAME=admin
ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS=
CONTACT_CHALLENGE_SECRET=<حداقل ۳۲ بایت تصادفی>
```

ایمیل فرم تماس (اختیاری):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=psmvalve@gmail.com
SMTP_PASS=<App Password>
CONTACT_TO=psmvalve@gmail.com
```

`JWT_SECRET` را بعد از بیلد عوض نکنید؛ میدل‌ور مقدار را در زمان بیلد درون‌ریزی
می‌کند و تغییر آن نیازمند بیلد دوباره است. اگر عوض کردید، گام ۵ را تکرار کنید.

### ۴.۲) تنظیم رمز پنل (هش bcrypt)

رمز را از آرگومان خط فرمان ندهید (در تاریخچهٔ شل می‌ماند). یکی از دو روش:

```bash
# تعاملی
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && node scripts/rotate-admin-password.mjs --username admin'
```

```bash
# غیرتعاملی (مثلاً از یک فایل امن)
read -r -s -p "New admin password: " PSM_PASS; echo
printf '%s' "$PSM_PASS" | sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && node scripts/rotate-admin-password.mjs --stdin --username admin'
unset PSM_PASS
```

رمز حداقل ۱۲ کاراکتر و تصادفی باشد. خروجی هش در `data/admin.json` با دسترسی `600`
ذخیره می‌شود.

### ۴.۳) مجوزها

```bash
cd /www/wwwroot/psm-valve
chown -R www:www .
chmod 700 data
find data -maxdepth 1 -type f -exec chmod 600 {} \;
chmod 600 .env.production
chmod -R u+rwX,go-w public/uploads
chmod 755 logs
```

`public/uploads` باید برای کاربر Nginx (که در aaPanel معمولاً `www` است) قابل خواندن
باشد؛ به همین دلیل `755/644` است. `data/` نباید توسط Nginx خوانده شود.

---

## ۵) نصب وابستگی‌ها و بیلد

```bash
cd /www/wwwroot/psm-valve
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && npm ci --no-audit --no-fund'
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && NODE_OPTIONS=--max-old-space-size=2048 npm run build'
```

اگر سرور ۲GB RAM دارد و بیلد با `Killed` قطع شد، ۲GB سواپ اضافه کنید:

```bash
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

بیلد باید بعد از `.env.production` انجام شود. اگر `better-sqlite3` در نصب خطا داد:

```bash
apt-get install -y build-essential python3
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && npm rebuild better-sqlite3'
```

---

## ۶) اجرای دائمی با PM2

```bash
cd /www/wwwroot/psm-valve
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && pm2 start ecosystem.config.js && pm2 save'
```

`ecosystem.config.js` این پروژه:

- `instances: 1` و `exec_mode: fork` (به‌خاطر rate limit در حافظه و نوشتن فایل)
- `next start -H 127.0.0.1 -p 3000` (فقط loopback)
- لاگ در `logs/pm2-out.log` و `logs/pm2-error.log`

بررسی:

```bash
sudo -u www -H pm2 status
sudo -u www -H pm2 logs psm-valve --lines 50
curl -I http://127.0.0.1:3000/fa
```

اگر `/fa` پاسخ 200 داد، اپ سالم است. حالا آن را بعد از ری‌استارت سرور هم بالا بیاورید:

```bash
pm2 startup systemd -u www --hp /home/www
```

دستوری که چاپ می‌شود را با `sudo` اجرا کنید. مسیر home کاربر `www` را با
`getent passwd www` 확인 کنید؛ اگر `/www` بود، همان را در `--hp` بگذارید.

> اگر پنل شما از قبل یک پروسهٔ `psm-valve` در PM2 دارد، اول آن را حذف کنید:
> `sudo -u www -H pm2 delete psm-valve` تا دو پروسه روی پورت ۳۰۰۰ با هم نجنگند.

---

## ۷) Nginx و SSL در aaPanel

### ۷.۱) گواهی SSL را از پنل بگیرید

**Website → psmvalve.com → SSL → Let's Encrypt**:

- هر دو دامنه `psmvalve.com` و `www.psmvalve.com` را انتخاب کنید.
- قبل از این کار DNS باید به IP سرور اشاره کند.
- گواهی را صادر کنید و **Force HTTPS** را فعال کنید.

مسیر گواهی در aaPanel معمولاً این است:

```
/www/server/panel/vhost/cert/psmvalve.com/fullchain.pem
/www/server/panel/vhost/cert/psmvalve.com/privkey.pem
```

اگر در SSL پنل مسیر دیگری دیدید، همان را در گام بعد استفاده کنید.

### ۷.۲) کانفیگ اختصاصی سایت را اعمال کنید

فایل آمادهٔ این مخزن: [`nginx-snippet.conf`](./nginx-snippet.conf)

```bash
cd /www/wwwroot/psm-valve
sed -e 's#__DOMAIN__#psmvalve.com#g' \
    -e 's#__APP_DIR__#/www/wwwroot/psm-valve#g' \
    -e 's#__APP_PORT__#3000#g' \
    -e 's#__CERT_DIR__#/www/server/panel/vhost/cert/psmvalve.com#g' \
    deploy/aapanel/nginx-snippet.conf > /tmp/psmvalve-site.conf

# بکاپ کانفیگ فعلی پنل
cp /www/server/panel/vhost/nginx/psmvalve.com.conf \
   /www/backup/psmvalve-nginx-$(date +%F-%H%M).conf

# جای‌گذاری (یا محتوای /tmp/psmvalve-site.conf را در Website → Config بچسبانید)
cp /tmp/psmvalve-site.conf /www/server/panel/vhost/nginx/psmvalve.com.conf

/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

این کانفیگ:

- HTTP را به HTTPS و `domain` را به `www.domain` هدایت می‌کند.
- `client_max_body_size 60m` می‌گذارد (API آپلود تا ۵۰MB).
- `/uploads/` و تصاویر را مستقیم از دیسک سرو می‌کند.
- بقیهٔ درخواست‌ها، از جمله `/_next/static`، `sitemap`، `robots` و `/admin` را به
  Next پروکسی می‌کند.
- هدرهای `X-Real-IP` و `X-Forwarded-Proto` را می‌فرستد؛ بدون این‌ها rate limit و
  کوکی `Secure` درست کار نمی‌کنند.

نکات:

- اگر Nginx خطای **duplicate map** برای `connection_upgrade` داد، بلوک `map` بالای
  فایل را حذف کنید (پنل از قبل آن را دارد).
- اگر مسیر گواهی فرق دارد، `__CERT_DIR__` را با مسیر واقعی عوض کنید.
- **مهم:** اگر بعداً از تب SSL/دامنه در پنل استفاده می‌کنید، ممکن است aaPanel فایل
  کانفیگ را بازنویسی کند. بعد از هر تغییر، `nginx -t` بزنید و در صورت نیاز همین
  snippet را دوباره اعمال کنید. تمدید خودکار گواهی معمولاً کانفیگ را عوض نمی‌کند.
- `nginx` سیستمی را اجرا نکنید؛ Nginx این پروژه همان Nginx پنل در
  `/www/server/nginx/sbin/nginx` است.

### ۷.۳) تست نهایی مسیرها

```bash
curl -I https://www.psmvalve.com/fa                 # 200
curl -I https://www.psmvalve.com/admin              # 307 → /admin/login
curl -I https://www.psmvalve.com/api/cv-tables      # 401 بدون ورود
curl -I http://psmvalve.com                         # 301 → https://www
curl -I https://www.psmvalve.com/uploads/<file>     # 200 و Cache-Control
```

اگر روی IP تست می‌کنید، `Host` را ست کنید:

```bash
curl -I -H 'Host: www.psmvalve.com' http://127.0.0.1/fa
```

---

## ۸) امنیت سرور و پنل

- [ ] پورت پنل تصادفی + SSL + IP Whitelist + 2FA
- [ ] رمز `root` غیرفعال، فقط کلید SSH؛ ورود با رمز SSH خاموش
- [ ] فایروال aaPanel: فقط `22` (یا پورت SSH)، `80`، `443` و پورت پنل (محدود به IP شما)
- [ ] پورت `3000` در فایروال و Security Group بسته است
- [ ] `3306`، `6379`، `888` و پورت‌های مدیریتی از اینترنت بسته‌اند
- [ ] `fail2ban` یا محافظت SSH پنل فعال است
- [ ] PHP/MySQL/Apache غیرضروری نصب نشده یا خاموش است
- [ ] `data/` دسترسی `700` و فایل‌های حساس `600`
- [ ] `.env.production` دسترسی `600` و در گیت نیست
- [ ] `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS` خالی است
- [ ] رمز مدیر از رمز قبلی/افشاشده متفاوت است
- [ ] `JWT_SECRET` تصادفی ≥۳۲ بایت و بعد از آخرین تغییر، بیلد شده است
- [ ] بکاپ هفتگی + یک نسخهٔ خارج از سرور
- [ ] `https://www.<domain>/admin` بدون ورود به `/admin/login` می‌رود
- [ ] `https://www.<domain>/api/cv-tables` بدون کوکی `401` می‌دهد

بررسی خودکار روی سرور:

```bash
cd /www/wwwroot/psm-valve
sudo -u www -H bash -c 'cd /www/wwwroot/psm-valve && node scripts/preflight.mjs'
```

---

## ۹) بکاپ هفتگی با Cron پنل

**Cron → Add Cron → Shell Script** (چرخهٔ هفتگی، روز جمعه، مثلاً ۰۳:۰۰):

```bash
cd /www/wwwroot/psm-valve && \
APP_DIR=/www/wwwroot/psm-valve \
BACKUP_DIR=/www/backup/psm-valve \
KEEP_DAYS=7 \
bash deploy/backup.sh >> /www/wwwlogs/psm-backup.log 2>&1
```

این اسکریپت:

- `data/*.json` را tar می‌کند،
- از SQLite یک snapshot تراکنشی می‌گیرد (کپی خام در حین نوشتن امن نیست)،
- `public/uploads` و `.env.production` را بکاپ می‌کند،
- نسخه‌های قدیمی‌تر از ۷ روز را پاک می‌کند (یعنی همیشه یک بکاپ هفتگی در دسترس است).

بکاپ روی همان سرور کافی نیست. یکی از این‌ها را فعال کنید:

```bash
# سرور/NAS دوم
rsync -az --delete /www/backup/psm-valve/ backupuser@BACKUP_HOST:/backups/psm-valve/

# یا rclone به فضای ابری
rclone copy /www/backup/psm-valve remote:psm-valve-backups
```

بازگردانی:

```bash
cd /www/wwwroot/psm-valve
sudo -u www -H pm2 stop psm-valve
tar -xzf /www/backup/psm-valve/data-<stamp>.tar.gz -C .
cp /www/backup/psm-valve/products-<stamp>.sqlite data/psm-valve.sqlite
chown -R www:www data
chmod 700 data && find data -maxdepth 1 -type f -exec chmod 600 {} \;
sudo -u www -H pm2 start ecosystem.config.js
```

> بکاپ داخلی aaPanel را می‌توانید برای کل سایت هم فعال کنید، اما به‌تنهایی برای
> SQLite در حال نوشتن قابل اتکا نیست؛ اسکریپت بالا snapshot تراکنشی می‌گیرد.

---

## ۱۰) به‌روزرسانی نسخه

```bash
cd /www/wwwroot/psm-valve
sudo bash deploy/aapanel/update.sh
```

اسکریپت [`update.sh`](./update.sh):

1. از `data/` و SQLite بکاپ می‌گیرد،
2. `git fetch` + `git reset --hard origin/main` (یا همگام‌سازی از `SOURCE_DIR`)،
3. دادهٔ زنده، `.env.production` و `public/uploads` را حفظ می‌کند،
4. `npm ci` و `npm run build` را با کاربر `www` انجام می‌دهد،
5. با PM2 **reload** می‌کند (پروسهٔ دوم نمی‌سازد)،
6. تست‌ها، preflight و health check را اجرا می‌کند.

برای کدی که با ZIP آمده و مخزن گیت نیست:

```bash
sudo SOURCE_DIR=/root/psm-valve-new bash deploy/aapanel/update.sh
```

بعد از آپدیت، اگر `deploy/aapanel/nginx-snippet.conf` تغییر کرده بود، گام ۷.۲ را
دوباره انجام دهید.

---

## ۱۱) اگر می‌خواهید پروسه را از Node Project پنل اجرا کنید

روش اصلی این راهنما PM2 + کانفیگ اختصاصی Nginx است. اگر ترجیح می‌دهید از
**Website → Node Project** پنل استفاده کنید:

1. اول پروسهٔ PM2 این راهنما را حذف کنید تا دو پروسه روی پورت ۳۰۰۰ نداشته باشید:
   ```bash
   sudo -u www -H pm2 delete psm-valve
   sudo -u www -H pm2 save
   ```
2. **Node Project → Add**:
   - Project name: `psm-valve`
   - Path: `/www/wwwroot/psm-valve`
   - Node version: `v22.x`
   - Port: `3000`
   - User: `www`
   - Domain: `www.<domain>` (و دامنهٔ اصلی)
   - Run option: گزینهٔ **Next.js / NEXT START**؛ اگر نبود، دستور سفارشی:
     `node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000`
3. بیلد را قبل از Start در Terminal انجام دهید (گام ۵).
4. در کانفیگ پروژه، `client_max_body_size 60m` را اضافه کنید.
5. SSL را از تب SSL همان پروژه بگیرید.
6. **نکته‌های این روش:**
   - اگر Run option را عوض کنید، aaPanel ممکن است کانفیگ Nginx را بازنویسی کند؛
     snippet و `client_max_body_size` را دوباره بررسی کنید.
   - در برخی نسخه‌ها، Stop کردن پروژه پروسهٔ `next-server` را orphan می‌کند و پورت
     ۳۰۰۰ آزاد نمی‌شود. در این حالت:
     ```bash
     ss -lntp | grep 3000
     sudo -u www -H pm2 list
     sudo -u www -H pm2 delete <name>
     ```
   - این روش از `ecosystem.config.js` استفاده نمی‌کند؛ مطمئن شوید فقط یک instance
     اجرا می‌شود (پنل معمولاً یک instance می‌سازد، اما چک کنید).
   - کانفیگ مستقیم `/uploads/` و کش دارایی‌ها را از دست می‌دهید؛ همه از Node عبور
     می‌کند (کار می‌کند، اما کمی کندتر است).

---

## ۱۲) عیب‌یابی

| نشانه | علت محتمل | راه‌حل |
| --- | --- | --- |
| `502 Bad Gateway` | اپ بالا نیست یا پورت اشتباه است | `sudo -u www -H pm2 status` · `curl -I http://127.0.0.1:3000/fa` · `pm2 logs psm-valve` |
| `404` برای CSS/JS | `/_next/` به Node پروکسی نشده | snippet را دوباره اعمال کنید؛ `location /` باید به `127.0.0.1:3000` برود |
| `413 Request Entity Too Large` | سقف Nginx | `client_max_body_size 60m` در server block |
| `403` برای `/uploads/...` | کاربر Nginx به فایل دسترسی ندارد | `chmod -R 755 public/uploads` و فایل‌ها `644`؛ کاربر Nginx را چک کنید |
| `500` هنگام ذخیره در پنل | `data/` برای `www` نوشتنی نیست | `chown -R www:www data && chmod 700 data` |
| ورود پنل برمی‌گردد به login | کوکی `Secure` یا پروکسی هدر | `X-Forwarded-Proto` در Nginx؛ HTTPS را چک کنید |
| rate limit برای همه یکی است | `X-Real-IP`/`X-Forwarded-For` ست نشده | snippet کامل را اعمال کنید |
| بیلد `Killed` | RAM کم | سواپ ۲GB + `NODE_OPTIONS=--max-old-space-size=2048` |
| `better-sqlite3` خطای build | ابزار بیلد نیست | `apt install build-essential python3` و `npm rebuild better-sqlite3` |
| پورت ۳۰۰۰ اشغال است | دو پروسه (PM2 + Node Project) | `ss -lntp \| grep 3000` · `pm2 delete`/Node Project را متوقف کنید |
| کانفیگ Nginx بعد از تغییر پنل عوض شد | aaPanel آن را بازنویسی کرده | snippet را دوباره اعمال و `nginx -t` کنید |
| گواهی تمدید نمی‌شود | مسیر ACME یا DNS | `/.well-known/acme-challenge/` باید به `public` برسد؛ DNS را چک کنید |
| `pm2: command not found` برای www | PATH کاربر | `npm i -g pm2` به‌عنوان root؛ یا `PM2_BIN=/usr/local/bin/pm2` |

لاگ‌ها:

```bash
sudo -u www -H pm2 logs psm-valve --lines 100
tail -n 100 /www/wwwlogs/psmvalve.com.error.log
tail -n 100 /www/wwwlogs/psm-backup.log
journalctl -u pm2-www --no-pager -n 100
```

---

## ۱۳) چک‌لیست انتشار

- [ ] DNS دامنه و `www` به IP سرور اشاره می‌کند
- [ ] aaPanel نصب و پنل با SSL/IP Whitelist/2FA امن شده
- [ ] Node 22 LTS و PM2 نصب است (`node -v` ≥ 22)
- [ ] کد در `/www/wwwroot/psm-valve` است و مالک آن `www` است
- [ ] `.env.production` با `JWT_SECRET` تصادفی ≥۳۲ بایت ساخته شده
- [ ] رمز مدیر با `rotate-admin-password.mjs` تنظیم شده و رمز قدیمی نیست
- [ ] `data/` و `public/uploads/` منتقل و مجوزها درست شده‌اند
- [ ] `npm ci && npm run build` موفق است
- [ ] PM2 با یک instance روی `127.0.0.1:3000` اجرا می‌شود
- [ ] SSL پنل صادر شده و snippet اعمال و `nginx -t` سبز است
- [ ] `/fa` روی HTTPS باز می‌شود و `/admin` به login می‌رود
- [ ] آپلود فایل بزرگ‌تر از ۱MB از پنل کار می‌کند (سقف ۵۰MB)
- [ ] cron بکاپ هفتگی فعال و یک بکاپ خارج از سرور تست شده
- [ ] پورت ۳۰۰۰ از اینترنت بسته است
- [ ] SMTP فرم تماس تست شده (اگر فعال است)

---

## ۱۴) فایل‌های این پوشه

| فایل | کار |
| --- | --- |
| `README.md` | همین راهنما |
| `nginx-snippet.conf` | کانفیگ کامل Nginx سازگار با aaPanel (SSL، پروکسی، کش، سقف آپلود) |
| `update.sh` | به‌روزرسانی امن با کاربر `www`، بکاپ داده و PM2 reload |

راهنمای عمومی انتشار (PM2/Nginx/Certbot بدون پنل): [`../README.md`](../README.md) ·
[`../../DEPLOY.md`](../../DEPLOY.md)
