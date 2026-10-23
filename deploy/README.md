# انتشار PSM VALVE — راهنمای یکجا برای همهٔ مسیرها

> این پوشه همهٔ ابزارهای انتشار را دارد. برای انتخاب سریع، جدول زیر را ببین و بعد
> فقط بخش همان مسیر را بخوان.
>
> 📄 نسخهٔ متنی سادهٔ همین راهنما (بدون Markdown، مناسب موبایل/چاپ): [`INSTALL-STEPS.txt`](../INSTALL-STEPS.txt)

| مسیر | برای چه کسی | دستور اصلی | زمان تقریبی |
| --- | --- | --- | --- |
| **۱) VPS تازه (توصیهشده)** | سرور Ubuntu/Debian با دسترسی `root`/`sudo` | `sudo bash deploy/install.sh --domain psmvalve.com --email you@…` | ۱۰–۲۰ دقیقه |
| **۱b) لانچر یکخطی VPS** | اوبونتو یا **Windows Server** — بدون آمادهسازی دستی | `sudo bash deploy/start-vps-ubuntu.sh` · `.\deploy\start-vps-windows.ps1` | ۱۰–۲۵ دقیقه |
| **۲) Docker** | هر سروری که Docker دارد؛ یا نصب ساده و تکرارپذیر | `bash deploy/docker.sh` | ۵–۱۵ دقیقه (بیلد اول) |
| **۳) هاست اشتراکی cPanel/CloudLinux** | هاست با Node.js Selector | [`deploy/cpanel/README.md`](./cpanel/README.md) | ۱۵–۳۰ دقیقه |
| **۳b) Ubuntu 24.04 + aaPanel** | VPS با پنل aaPanel | [`deploy/aapanel/README.md`](./aapanel/README.md) | ۲۰–۳۰ دقیقه |
| **۴) سرور از قبل نصبشده** | انتشار نسخهٔ جدید روی نصب موجود | `bash deploy/update.sh` | ۳–۸ دقیقه |

اگر مطمئن نیستی: مسیر **۱** را بردار (تکدستوری، شامل Node/PM2/Nginx/SSL/بکاپ/فایروال).

> 🚑 بعد از انتشار، پایش روزانه و بازیابی اضطراری (health check، هشدار ایمیل،
> رزمایش restore، سناریوهای بحران): [`RUNBOOK.md`](./RUNBOOK.md)

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
2. نصب بستههای پایه + **Node.js 22 LTS** + **PM2** (+ Certbot و ابزار فایروال در صورت نیاز)
3. ساخت کاربر اجراکننده (`psm`)، پوشههای پروژه/بکاپ و **سواپ ۲GB** روی سرورهای کمرمز
4. `git clone` (نصب اول) یا `git pull` (اجرای دوباره)
5. `npm ci`
6. ساخت `.env.production` با اسرار تصادفی (`deploy/make-env.sh`) — دسترسی `600`
7. تنظیم رمز پنل بهصورت **هش bcrypt** در `data/admin.json`
8. `npm run build` (بعد از ساخت env — چون میدلور `JWT_SECRET` را در زمان بیلد درونریزی میکند)
9. اجرای دائمی با PM2 + `pm2 save` + `pm2 startup` (بالا آمدن خودکار بعد از ریاستارت سرور)
10. Nginx (reverse proxy + کش داراییها) و **SSL رایگان Let's Encrypt** + هدایت `http→https` و `domain→www.domain` + ufw و fail2ban
11. cron بکاپ هفتگی (جمعه ۳ بامداد) + بررسی سلامت + چاپ خلاصهٔ کاربر و رمز پنل

### گزینههای مهم

| گزینه | کار |
| --- | --- |
| `--domain <domain>` | دامنهٔ اصلی (اجباری)؛ `www` خودکار مدیریت میشود |
| `--email <email>` | ایمیل Let's Encrypt (پیشفرض `admin@<domain>`) |
| `--admin-user <user>` | نام کاربری پنل مدیریت (پیشفرض `admin`) |
| `--admin-password <pass>` | رمز پنل؛ اگر ندهی رمز تصادفی ساخته و **یکبار** نمایش داده میشود |
| `--admin-password-file <path>` | رمز را از خط اول فایل می‌خواند و فایل را پس از استفاده پاک می‌کند (مناسب اسکریپت‌های خودکار) |
| `--repo <git-url>` · `--branch <name>` | مخزن/شاخهٔ انتشار |
| `--source <path>` | نصب از کد آماده در این مسیر (بدون گیت)؛ داده/آپلود/env سرور حفظ میشود و `admin.json` و SQLite منتقل نمیشوند |
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
   پر کن و سپس `su - psm -c 'pm2 reload ecosystem.config.js --update-env'`.

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
| `bash deploy/backup-docker.sh` | بکاپ هفتگی (snapshot SQLite داخل کانتینر + tar داده و آپلود) |
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

خلاصه: در cPanel → Setup Node.js App یک اپ با Node 22، `Application root = psm-valve` و
`Startup file = app.js` بساز، `deploy/cpanel/app.js` را در ریشهٔ پروژه کپی کن، سپس در Terminal:

```bash
npm ci && npm run build
node scripts/rotate-admin-password.mjs
```

و در پایان Restart. (اگر هاست Node.js Selector ندارد، این مسیر ممکن نیست → مسیر ۱ یا ۲.)

---

## مسیر ۳b — Ubuntu 24.04 + aaPanel

راهنمای کامل: [`deploy/aapanel/README.md`](./aapanel/README.md)

خلاصه: aaPanel را نصب و پنل را امن کن؛ Node 22 + PM2 را نصب کن؛ سایت را با ریشهٔ
`/www/wwwroot/psm-valve` بساز؛ `.env.production` را **قبل از بیلد** بساز؛ با کاربر
`www` بیلد کن و PM2 را با یک instance روی `127.0.0.1:3000` اجرا کن؛ SSL را از پنل بگیر و
[`deploy/aapanel/nginx-snippet.conf`](./aapanel/nginx-snippet.conf) را در کانفیگ سایت
بگذار. آپدیت‌ها: `sudo bash deploy/aapanel/update.sh`.

> روی سرور aaPanel، `deploy/install.sh` را اجرا نکن؛ آن اسکریپت Nginx/PM2 سیستمی می‌سازد
> و با پنل تعارض دارد (به‌صورت پیش‌فرض هم جلوی اجرا را می‌گیرد).

---

## مسیر ۴ — انتشار نسخهٔ جدید روی نصب موجود

| استقرار | دستور |
| --- | --- |
| PM2/سرور | `su - psm -c 'bash /var/www/psm-valve/deploy/update.sh'` |
| Windows Server | اجرای دوبارهٔ `.\deploy\start-vps-windows.ps1` (داده، آپلود و env حفظ میشوند) |
| Docker | `git pull && docker compose up -d --build` |
| cPanel | `git pull && npm ci && npm run build` + Restart در پنل |
| aaPanel | `sudo bash /www/wwwroot/psm-valve/deploy/aapanel/update.sh` |

پیشبررسی را میتوان محلی هم اجرا کرد: `node scripts/preflight.mjs` (همین بررسی در `update.sh` روی سرور هم انجام میشود).

---

## لانچر یکخطی — اوبونتو و Windows Server

اگر نمیخواهی گزینهها را یکییکی بچرخانی، همین دو اسکریپت کل مسیر نصب را با **یک خط فرمان**
تمام میکنند (پیشنیازها، کد، اسرار، رمز پنل، بیلد، سرویس دائمی، فایروال، بررسی سلامت، خلاصه).

### اوبونتو ۲۲.۰۴ / ۲۴.۰۴ — `start-vps-ubuntu.sh`

```bash
# از داخل پوشهٔ پروژه (sudo را خودش میگیرد)
sudo bash deploy/start-vps-ubuntu.sh --domain psmvalve.com --email admin@psmvalve.com

# بدون دامنه: IP عمومی سرور را تشخیص میدهد و با --no-ssl نصب میکند
sudo bash deploy/start-vps-ubuntu.sh

# کد هنوز push نشده؟ از همان پوشهٔ محلی نصب کن (دادهٔ سرور حفظ میشود)
sudo bash deploy/start-vps-ubuntu.sh --source /srv/psm-valve --domain 5.1.2.3

# مستقیم از GitHub، بدون کلون کردن مخزن
curl -fsSL https://raw.githubusercontent.com/AHSHNO1/psm-valve/main/deploy/start-vps-ubuntu.sh \
  | sudo bash -s -- --domain psmvalve.com --email admin@psmvalve.com
```

این لانچر `deploy/install.sh` را پیدا (یا دانلود) میکند و گزینههایش را به همان میسپارد؛ پس همهٔ
گزینههای جدول بالا (`--port`، `--app-dir`، `--admin-password-file`، `--no-cron` و…) اینجا هم کار میکنند.
گزینهٔ مخصوص خودش: `--repo <git-url>` برای وقتی که `install.sh` کنار اسکریپت نیست.

### Windows Server 2012 R2 به بعد — `start-vps-windows.ps1`

```powershell
# با دامنه (Caddy گواهی Let's Encrypt میگیرد)
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain psmvalve.com -Email admin@psmvalve.com

# بدون دامنه: IP عمومی تشخیص داده میشود و سایت روی HTTP بالا میآید
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1

# نصب از کد آماده یا ZIP (نیازی به Git روی سرور نیست)
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -SourceDir C:\psm-valve -Domain 5.1.2.3
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -ZipPath C:\psm-valve.zip
```

| گزینه | کار |
| --- | --- |
| `-Domain <domain\|ip>` | دامنه یا IP؛ اگر ندهی IP عمومی سرور را تشخیص میدهد |
| `-Email <email>` | ایمیل گواهی Let's Encrypt (فقط با دامنه) |
| `-AppDir <path>` · `-Port <number>` | مسیر نصب (پیشفرض `C:\PSMValve`) و پورت داخلی اپ |
| `-AdminUser` · `-AdminPassword` · `-AdminPasswordFile` | کاربر/رمز پنل؛ بدون رمز، رمز تصادفی در `C:\ProgramData\PSMValve\initial-admin-password.txt` |
| `-SourceDir` · `-ZipPath` · `-Repo` · `-Branch` | منبع کد؛ اولویت با SourceDir، بعد ZipPath، بعد پوشهٔ پروژه، بعد گیت‌هاب |
| `-NodeMajor <number>` | نسخهٔ اصلی Node.js (پیشفرض `22`؛ MSI رسمی از nodejs.org) |
| `-NoHttps` · `-NoFirewall` · `-SkipBuild` · `-ForceEnv` | فقط HTTP · دست‌نزدن به فایروال · پرش از بیلد · بازنویسی اسرار env |
| `-Help` | فهرست گزینهها |

**چطور سرویس را نگه میدارد:** دو Scheduled Task با حساب `SYSTEM` ساخته میشود — `PSM-VALVE`
(اپ Next.js، ریاستارت خودکار در هر خطا، شروع در بوت) و `PSM-VALVE-Proxy` (Caddy). روزمره:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\ProgramData\PSMValve\manage.ps1" -Action status
powershell -ExecutionPolicy Bypass -File "C:\ProgramData\PSMValve\manage.ps1" -Action restart
powershell -ExecutionPolicy Bypass -File "C:\ProgramData\PSMValve\manage.ps1" -Action logs
```

**نکتههای مهم ویندوز**
- فایل `ps1` باید **UTF-8 با BOM** بماند؛ بی‌آن PowerShell ۵.۱ متن فارسی را خراب میخواند.
  `.env.production` برعکس، باید **بدون BOM** باشد (لانچر خودش همین کار را میکند).
- اگر **IIS** پورت ۸۰ را گرفته باشد، لانچر پروکسی را خاموش میکند و سایت مستقیم روی
  پورت `3000` سرو میشود؛ برای آدرس تمیز IIS را ببند و دوباره اجرا کن.
- HTTPS فقط با دامنه صادر میشود. روی IP، لاگین هم کار میکند (کوکی `Secure` بر اساس
  `x-forwarded-proto` تنظیم میشود) ولی گواهی نمیگیری.
- اگر `npm ci` در بیلد `better-sqlite3` شکست، Visual Studio Build Tools ۲۰۲۲
  (Desktop development with C++) را نصب کن و لانچر را دوباره اجرا کن.
- اسرار، رمز اولیه و دیتای Caddy در `C:\ProgramData\PSMValve` با ACL محدود به
  `SYSTEM` و `Administrators` نگه داشته میشوند.
- اجرای دوباره بیخطر است: `data\`، `public\uploads\` و `.env.production` حفظ میشوند.

جزئیات بیشتر و عیبیابی: بخش ۱۳ در [`INSTALL-STEPS.txt`](../INSTALL-STEPS.txt)

---

## فایلهای این پوشه

| فایل | کار |
| --- | --- |
| `install.sh` | **نصب یکدستوری کل سرور** (Node/PM2/Nginx/SSL/بکاپ/cron/فایروال) |
| `install-remote.ps1` | اجرای `install.sh` روی سرور از ویندوز + انتقال داده |
| `start-vps-ubuntu.sh` | لانچر یکخطی اوبونتو: sudo، IP خودکار، دانلود/یافتن `install.sh` و سپردن گزینهها |
| `start-vps-windows.ps1` | لانچر یکخطی Windows Server: Node، اسرار، بیلد، Caddy، Scheduled Task، فایروال، `manage.ps1` |
| `docker.sh` | نصب/اجرا با Docker (بیلد، بالا آوردن، بررسی سلامت، رمز پنل) |
| `docker-entrypoint.sh` | نقطهٔ ورود کانتینر: بازگردانی seed در اجرای اول + بیلد در زمان اجرا |
| `backup-docker.sh` | بکاپ در استقرار Docker |
| `make-env.sh` | ساخت `.env.production` با اسرار تصادفی (بیخطر برای اجرای دوباره) |
| `update.sh` | انتشار نسخهٔ جدید (preflight → deploy → تست → healthcheck) |
| `deploy.sh` | موتور انتشار روی سرور (بکاپ دادهٔ زنده → reset به origin → بیلد → reload) |
| `backup.sh` | بکاپ هفتگی داده/آپلود + snapshot SQLite + پیکربندی |
| `backup-products-db.cjs` | snapshot تراکنشی SQLite (استفاده در `backup.sh` و کانتینر) |
| `bootstrap-server.sh` | نصب پیشنیازهای سرور (نسخهٔ سبکتر `install.sh`) |
| `nginx-psmvalve.conf` | کانفیگ Nginx (SSL، کش داراییها، ریدایرکت به www) |
| `push-assets.ps1` | انتقال `data/` و `public/uploads/` از ویندوز به سرور |
| `cpanel/` | مسیر هاست اشتراکی: `app.js` + `.htaccess` + README |
| `aapanel/` | مسیر Ubuntu 24.04 + aaPanel: README، کانفیگ Nginx و `update.sh` امن |
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
| وضعیت (ویندوز) | `powershell -File "C:\ProgramData\PSMValve\manage.ps1" -Action status` |
| بررسی سلامت | `curl -I "http://127.0.0.1:$(cat /var/www/psm-valve/.app-port)/fa"` (هر پورتی) · `curl -I https://www.<domain>/admin` (باید ۳۰۷ شود) |
| تغییر پورت | بخش «پورت اپ» در بالا (`.app-port` + Nginx + `pm2 reload ecosystem.config.js --update-env`) |
| بکاپ دستی | `su - psm -c 'bash deploy/backup.sh'` |
| تمدید SSL | خودکار (Certbot)؛ بازرسی: `certbot renew --dry-run` |
| بازگردانی از بکاپ | `tar -xzf /var/backups/psm-valve/data-<stamp>.tar.gz` و سپس `pm2 reload ecosystem.config.js --update-env` |
| بازگردانی نسخهٔ کد | `git log --oneline` → `git reset --hard <commit>` → `npm ci && npm run build` → `su - psm -c "cd /var/www/psm-valve && pm2 reload ecosystem.config.js --update-env"` |