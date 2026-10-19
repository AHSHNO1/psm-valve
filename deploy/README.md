# انتشار PSM VALVE — راهنمای یکجا برای همهٔ مسیرها

> این پوشه همهٔ ابزارهای انتشار را دارد. برای انتخاب سریع، جدول زیر را ببین و بعد
> فقط بخش همان مسیر را بخوان.
>
> 📄 نسخهٔ متنی سادهٔ همین راهنما (بدون Markdown، مناسب موبایل/چاپ): [`INSTALL-STEPS.txt`](../INSTALL-STEPS.txt)

| مسیر | برای چه کسی | دستور اصلی | زمان تقریبی |
| --- | --- | --- | --- |
| **۱) VPS تازه (توصیهشده)** | سرور Ubuntu/Debian با دسترسی `root`/`sudo` | `sudo bash deploy/install.sh --domain psmvalve.com --email you@…` | ۱۰–۲۰ دقیقه |
| **۲) Docker** | هر سروری که Docker دارد؛ یا نصب ساده و تکرارپذیر | `bash deploy/docker.sh` | ۵–۱۵ دقیقه (بیلد اول) |
| **۳) هاست اشتراکی cPanel/CloudLinux** | هاست با Node.js Selector | [`deploy/cpanel/README.md`](./cpanel/README.md) | ۱۵–۳۰ دقیقه |
| **۴) سرور از قبل نصبشده** | انتشار نسخهٔ جدید روی نصب موجود | `bash deploy/update.sh` | ۳–۸ دقیقه |

اگر مطمئن نیستی: مسیر **۱** را بردار (تکدستوری، شامل Node/PM2/Nginx/SSL/بکاپ/فایروال).

> 🔌 **پورت:** پیشفرض اپ `3000` است. اگر روی سرور اشغال است یا چند سایت روی یک سرور داری، با
> `--port <number>` (یا متغیر `APP_PORT`) عوضش کن؛ پورت در فایل `.app-port` ذخیره میشود و Nginx،
> PM2 و بررسیهای سلامت همگی از همان یک فایل میخوانند (جزئیات: بخش «پورت اپ» پایینتر).

---

## مسیر ۱ — نصب یکدستوری روی VPS (PM2 + Nginx + SSL)

```bash
sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com
```

اسکریپت ۱۱ گام را پشتسرهم انجام میدهد:

1. بررسی سیستمعامل و پیشنیازها (`apt-get`)
2. نصب بستههای پایه + **Node.js 20 LTS** + **PM2** (+ Certbot و ابزار فایروال در صورت نیاز)
3. ساخت کاربر اجراکننده (`psm`)، پوشههای پروژه/بکاپ و **سواپ ۲GB** روی سرورهای کمرمز
4. `git clone` (نصب اول) یا `git pull` (اجرای دوباره)
5. `npm ci`
6. ساخت `.env.production` با اسرار تصادفی (`deploy/make-env.sh`) — دسترسی `600`
7. تنظیم رمز پنل بهصورت **هش bcrypt** در `data/admin.json`
8. `npm run build` (بعد از ساخت env — چون میدلور `JWT_SECRET` را در زمان بیلد درونریزی میکند)
9. اجرای دائمی با PM2 + `pm2 save` + `pm2 startup` (بالا آمدن خودکار بعد از ریاستارت سرور)
10. Nginx (reverse proxy + کش داراییها) و **SSL رایگان Let's Encrypt** + هدایت `http→https` و `domain→www.domain` + ufw و fail2ban
11. cron بکاپ روزانه (۳ بامداد) + بررسی سلامت + چاپ خلاصهٔ کاربر و رمز پنل

### گزینههای مهم

| گزینه | کار |
| --- | --- |
| `--domain <domain>` | دامنهٔ اصلی (اجباری)؛ `www` خودکار مدیریت میشود |
| `--email <email>` | ایمیل Let's Encrypt (پیشفرض `admin@<domain>`) |
| `--admin-user <user>` | نام کاربری پنل مدیریت (پیشفرض `admin`) |
| `--admin-password <pass>` | رمز پنل؛ اگر ندهی رمز تصادفی ساخته و **یکبار** نمایش داده میشود |
| `--repo <git-url>` · `--branch <name>` | مخزن/شاخهٔ انتشار |
| `--app-dir <path>` · `--app-user <user>` | مسیر نصب (پیشفرض `/var/www/psm-valve`) و کاربر اجرا (پیشفرض `psm`) |
| `--no-ssl` | فقط HTTP (وقتی DNS/SSL آماده نیست) |
| `--no-firewall` · `--no-cron` | بدون ufw/fail2ban · بدون cron بکاپ |
| `--skip-build` | پرش از بیلد (مثلاً وقتی `.next` را از قبل آپلود کردهای) |
| `--port <number>` · `APP_PORT=<port>` | پورت اپلیکیشن؛ در فایل `.app-port` ذخیره میشود و Nginx، PM2 و بررسیهای سلامت همگی از آن میخوانند (پیشفرض `3000`) |
| `-h`, `--help` | نمایش همین راهنمای گزینهها |

> همهٔ گزینهها هر دو شکل `--flag value` و `--flag=value` را میپذیرند.

### پورت اپ — فایل `.app-port` (منبع یکتا)

ترتیب خواندن پورت: متغیر محیطی `APP_PORT` → فایل `<app-dir>/.app-port` → پیشفرض `3000`.
`install.sh` پورت را در `.app-port` مینویسد و Nginx (کانفیگ تولیدشده)، PM2 (`ecosystem.config.js`)،
`deploy.sh`، `update.sh` و بررسیهای سلامت همگی از همین فایل میخوانند؛ پس بعد از نصب لازم نیست
کانفیگ Nginx را دستی هماهنگ کنی.

```bash
# نصب با پورت غیرپیشفرض
sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com --port 8080
```

تغییر پورت روی نصب موجود:

```bash
# راه ۱ (توصیهشده): اجرای دوبارهٔ نصب با پورت جدید — .app-port و Nginx با هم هماهنگ میشوند
sudo bash deploy/install.sh --domain psmvalve.com --port 8080 --skip-build

# راه ۲ (دستی، اگر نمیخواهی نصب دوباره اجرا شود)
cd /var/www/psm-valve
echo 8080 | sudo tee .app-port
sudo chown psm:psm .app-port
sudo sed -E -i 's/127\.0\.0\.1:[0-9]+/127.0.0.1:8080/g' /etc/nginx/sites-available/psmvalve.conf
sudo nginx -t && sudo systemctl reload nginx
su - psm -c "cd /var/www/psm-valve && pm2 reload ecosystem.config.js --update-env && pm2 save"   # پورت از .app-port خوانده میشود
```

> `APP_PORT=8080 bash deploy/update.sh` فقط برای همان اجرا پورت را بازنویسی میکند (`.app-port` دستنخورده میماند).
> مسیر Docker پورت ثابت `3000:3000` دارد و `.app-port` را نمیخواند (نکتهٔ ۳ در «مسیر ۲»).

### اجرا از ویندوز (بدون ترمینال لینوکسی روی سیستم خودت)

```powershell
.\deploy\install-remote.ps1 -Server 1.2.3.4 -Domain psmvalve.com -Email admin@psmvalve.com
```

اسکریپت `install.sh` را با `scp` میفرستد، با `ssh` اجرا میکند و در پایان
`deploy/push-assets.ps1` را برای انتقال `data/` و `public/uploads/` صدا میزند.
(برای سروری که کاربر `sudo` دارد: `-SshUser psm -Sudo`)

> ⚠️ فایلهای `deploy/*.ps1` با UTF-8 **همراه BOM** ذخیره شدهاند (بهخاطر متن فارسی و سازگاری با
> Windows PowerShell 5.1). اگر ویرایششان میکنی، BOM را حفظ کن؛ در غیر این صورت خطای
> «The string is missing the terminator» میگیری.

### ترتیب کارهای پیشنهادی (مهم)

1. **DNS را قبل از نصب ست کن:** رکورد `A` دامنه و `www` → IP سرور.
   اگر DNS هنوز ست نشده باشد، اسکریپت با `--no-ssl` نصب را کامل میکند و در پایان دستور دقیق اجرای Certbot را چاپ میکند.
2. بعد از نصب، رمز تصادفی را از خلاصهٔ خروجی بردار (یا `/root/psm-initial-admin-password.txt`)
   و از بخش «امنیت» پنل عوضش کن.
3. دادهٔ محتوای سایت و آپلودها را منتقل کن (اگر از نسخهٔ محلی میآیی):
   ```powershell
   .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm
   ```
4. ایمیل فرم تماس (اختیاری): `SMTP_*` و `CONTACT_TO` را در `/var/www/psm-valve/.env.production`
   پر کن و سپس `su - psm -c 'pm2 reload psm-valve --update-env'`.

### بهروزرسانی بعدی (با یک دستور)

```bash
su - psm -c 'bash /var/www/psm-valve/deploy/update.sh'
```

`update.sh` = پیشبررسی → بکاپ دادهٔ زنده → دریافت کد → `npm ci` → بیلد → `pm2 reload` → `npm test` → بررسی سلامت مسیرهای کلیدی.

---

## مسیر ۲ — Docker (تکدستوری، مستقل از سیستمعامل سرور)

```bash
bash deploy/docker.sh                       # ساخت .env.production + بالا آوردن سرویس + تنظیم رمز پنل
bash deploy/docker.sh --admin-password 'رمز-قوی'   # با رمز دلخواه
```

| دستور | کار |
| --- | --- |
| `bash deploy/docker.sh` | نصب/بهروزرسانی کامل (بیلد ایمیج + اجرا + رمز پنل) |
| `docker compose logs -f app` | مشاهدهٔ لاگ زنده |
| `docker compose restart app` | ریاستارت سرویس |
| `bash deploy/backup-docker.sh` | بکاپ روزانه (snapshot SQLite داخل کانتینر + tar داده و آپلود) |
| `PSM_FORCE_BUILD=1 docker compose up -d` | اجبار به بیلد مجدد Next داخل کانتینر |
| `docker compose down` | توقف (داده در volume/پوشه باقی میماند) |

### دو نکتهٔ کلیدی این مسیر

1. **بیلد در زمان اجرا انجام میشود، نه داخل ایمیج.**
   میدلور روی Edge مقدار `JWT_SECRET` را در زمان بیلد درونریزی میکند؛ اگر داخل ایمیج بیلد شود،
   راز داخل لایههای ایمیج جا میماند. پس بیلد در اولین اجرای کانتینر (با env زمان اجرا) انجام و
   خروجی در volume `psm-next` نگه داشته میشود. اگر کد را عوض کردی، خودش بیلد مجدد میکند
   (یا با `PSM_FORCE_BUILD=1` اجبار کن).
   ⚠️ به همین دلیل اگر `JWT_SECRET` را عوض کردی، یکبار بیلد مجدد لازم است.
2. **تعداد replica همیشه ۱ بماند** و در سرور واقعی پورت را به لوکالهاست ببند و پشت Nginx بگذار:
   ```yaml
   ports: ["127.0.0.1:3000:3000"]
   ```
   (ufw جلوی باز شدن پورت توسط Docker را نمیگیرد.)
3. **پورت در این مسیر ثابت ۳۰۰۰ است** (فایل `.app-port` مربوط به مسیر PM2/Nginx است و در Docker خوانده نمیشود)؛ برای تغییر پورت، مقدار `ports` را در `docker-compose.yml` عوض کن.

مسیر داده روی هاست: `./data` (JSON + SQLite) · `./public/uploads` (داراییها) · volume `psm-next` (خروجی بیلد).

---

## مسیر ۳ — هاست اشتراکی cPanel / CloudLinux (Node.js Selector)

راهنمای کامل: [`deploy/cpanel/README.md`](./cpanel/README.md)

خلاصه: در cPanel → Setup Node.js App یک اپ با Node 20، `Application root = psm-valve` و
`Startup file = app.js` بساز، `deploy/cpanel/app.js` را در ریشهٔ پروژه کپی کن، سپس در Terminal:

```bash
npm ci && npm run build
node scripts/rotate-admin-password.mjs
```

و در پایان Restart. (اگر هاست Node.js Selector ندارد، این مسیر ممکن نیست → مسیر ۱ یا ۲.)

---

## مسیر ۴ — انتشار نسخهٔ جدید روی نصب موجود

| استقرار | دستور |
| --- | --- |
| PM2/سرور | `su - psm -c 'bash /var/www/psm-valve/deploy/update.sh'` |
| Docker | `git pull && docker compose up -d --build` |
| cPanel | `git pull && npm ci && npm run build` + Restart در پنل |

پیشبررسی را میتوان محلی هم اجرا کرد: `node scripts/preflight.mjs` (همین بررسی در `update.sh` روی سرور هم انجام میشود).

---

## فایلهای این پوشه

| فایل | کار |
| --- | --- |
| `install.sh` | **نصب یکدستوری کل سرور** (Node/PM2/Nginx/SSL/بکاپ/cron/فایروال) |
| `install-remote.ps1` | اجرای `install.sh` روی سرور از ویندوز + انتقال داده |
| `docker.sh` | نصب/اجرا با Docker (بیلد، بالا آوردن، بررسی سلامت، رمز پنل) |
| `docker-entrypoint.sh` | نقطهٔ ورود کانتینر: بازگردانی seed در اجرای اول + بیلد در زمان اجرا |
| `backup-docker.sh` | بکاپ در استقرار Docker |
| `make-env.sh` | ساخت `.env.production` با اسرار تصادفی (بیخطر برای اجرای دوباره) |
| `update.sh` | انتشار نسخهٔ جدید (preflight → deploy → تست → healthcheck) |
| `deploy.sh` | موتور انتشار روی سرور (بکاپ دادهٔ زنده → reset به origin → بیلد → reload) |
| `backup.sh` | بکاپ روزانهٔ داده/آپلود + snapshot SQLite + پیکربندی |
| `backup-products-db.cjs` | snapshot تراکنشی SQLite (استفاده در `backup.sh` و کانتینر) |
| `bootstrap-server.sh` | نصب پیشنیازهای سرور (نسخهٔ سبکتر `install.sh`) |
| `nginx-psmvalve.conf` | کانفیگ Nginx (SSL، کش داراییها، ریدایرکت به www) |
| `push-assets.ps1` | انتقال `data/` و `public/uploads/` از ویندوز به سرور |
| `cpanel/` | مسیر هاست اشتراکی: `app.js` + `.htaccess` + README |
| `../Dockerfile` · `../docker-compose.yml` · `../.dockerignore` | مسیر Docker |
| `../ecosystem.config.js` | اجرای PM2 — پورت از فایل `.app-port` (منبع یکتا) خوانده میشود |

> `.app-port` در **ریشهٔ پروژه روی سرور** (نه در این پوشه) نگه داشته میشود: `install.sh` میسازد،
> `backup.sh` از آن بکاپ میگیرد و نسخههای قدیمی را پاک میکند، و `.dockerignore` آن را از بیلد Docker
> کنار میگذارد (چون مسیر Docker پورت ثابت `3000` دارد).

---

## چکلیست قبل از انتشار

- [ ] `node scripts/preflight.mjs` بدون FAIL
- [ ] `npm test` سبز
- [ ] رمز مدیر چرخیده و رمز قدیمی افشاشده استفاده نمیشود (`scripts/rotate-admin-password.mjs`)
- [ ] `JWT_SECRET` تصادفی ≥۳۲ بایت (و اگر تازه عوض شده: بیلد مجدد)
- [ ] `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS` خالی/`false`
- [ ] DNS دامنه و `www` → IP سرور
- [ ] `data/` و `public/uploads/` منتقل شدهاند (`push-assets.ps1`)
- [ ] cron بکاپ فعال + یک بکاپ **خارج از سرور** (rsync/rclone)
- [ ] `SITE`/دامنه در `data/settings.json` با دامنهٔ نهایی یکسان است
- [ ] `SMTP_*` برای فرم تماس (اگر ایمیل میخواهی)

## بعد از انتشار — نگهداری

| کار | دستور |
| --- | --- |
| وضعیت سرویس | `su - psm -c 'pm2 status'` · `su - psm -c 'pm2 logs psm-valve'` |
| بررسی سلامت | `curl -I "http://127.0.0.1:$(cat /var/www/psm-valve/.app-port)/fa"` (هر پورتی) · `curl -I https://www.<domain>/admin` (باید ۳۰۷ شود) |
| تغییر پورت | بخش «پورت اپ» در بالا (`.app-port` + Nginx + `pm2 reload --update-env`) |
| بکاپ دستی | `su - psm -c 'bash deploy/backup.sh'` |
| تمدید SSL | خودکار (Certbot)؛ بازرسی: `certbot renew --dry-run` |
| بازگردانی از بکاپ | `tar -xzf /var/backups/psm-valve/data-<stamp>.tar.gz` و سپس `pm2 reload psm-valve` |
| بازگردانی نسخهٔ کد | `git log --oneline` → `git reset --hard <commit>` → `npm ci && npm run build` → `su - psm -c "cd /var/www/psm-valve && pm2 reload ecosystem.config.js --update-env"` |