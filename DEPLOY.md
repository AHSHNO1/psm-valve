# راهنمای راهاندازی، انتشار و نگهداری — PSM VALVE

> آخرین بهروزرسانی: ۲۰۲۶-۱۰-۲۳ · نسخهٔ اپ: `package.json` → Next.js 16.4.2 (بیلد Turbopack، فایل `proxy.js` بهجای `middleware.js`)
> این فایل مرجع کامل «از صفر تا آنلاین» است. برای شروع سریع توسعه، `README.md` را ببین.
> **خلاصهٔ انتشار و چک‌لیست:** [`GO-LIVE.md`](GO-LIVE.md) · پیش‌بررسی: `node scripts/preflight.mjs`
> 🚀 **مسیر خودکار (توصیهشده):** `sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com`
> همین یک دستور، همهٔ گامهای بخش ۳ و ۴ را انجام میدهد: نصب Node 22 / PM2 / Nginx / Certbot، ساخت کاربر اجرا
> و سواپ، دریافت کد، `npm ci`، ساخت `.env.production` با اسرار تصادفی، تنظیم رمز پنل (هش bcrypt)، بیلد،
> اجرای PM2 با startup، کانفیگ Nginx و SSL، cron بکاپ روزانه، فایروال و بررسی سلامت.
> **یک خط فرمان، بدون گزینه:** اوبونتو → `sudo bash deploy/start-vps-ubuntu.sh` ·
> Windows Server → `powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1` (بخش «ویندوز سرور» در ادامه).
> گزینههای دیگر: Docker → `bash deploy/docker.sh` · cPanel/CloudLinux → [`deploy/cpanel/README.md`](deploy/cpanel/README.md) · **Ubuntu 24.04 + aaPanel** → [`deploy/aapanel/README.md`](deploy/aapanel/README.md)
> مقایسهٔ همهٔ مسیرها و چکلیست: [`deploy/README.md`](deploy/README.md)

---

## ۰) در یک نگاه — چه چیزی لازم است؟

| موضوع | مقدار / نیاز |
| --- | --- |
| نوع اپلیکیشن | Next.js 16 App Router — نیازمند **پروسهٔ Node** (`next start`) و دیسک پایدار. روی هاست اشتراکی فقط-PHP اجرا نمیشود؛ روی cPanel با **Node.js Selector** ممکن است (راهنما: [`deploy/cpanel/README.md`](./deploy/cpanel/README.md)). |
| پورت پیشفرض | `3000` — با `--port <number>` (یا `APP_PORT=<port>`) تغییر میکند و در فایل `.app-port` کنار پروژه ذخیره میشود؛ Nginx، PM2 و بررسیهای سلامت همه از همان یک فایل میخوانند (`PORT` در `.env` فقط بازنویسی موقت است). جزئیات: [`deploy/README.md`](deploy/README.md) → «پورت اپ». |
| نسخهٔ Node | **۲۲ LTS** (حداقل ۲۲؛ Node 20 در آوریل ۲۰۲۶ EOL شد) |
| ذخیرهسازی داده | **فایلسیستم پایدار**: `data/*.json`, پایگاه‌دادهٔ `data/psm-valve.sqlite` و `public/uploads/**` |
| نقشهٔ داده | ۱) `data/` دادهٔ زندهٔ JSON و SQLite · ۲) `public/uploads/**` فایلهای آپلودشده از پنل · ۳) `lib/products.js` فقط دادهٔ اولیهٔ seed محصولات |
| ناسازگار با | Vercel، Netlify، Render Static، Cloudflare Pages، هر PaaS با دیسک موقت (فایل نوشتهشده با هر دیپلوی/ریاستارت پاک میشود) |
| سازگار با | VPS لینوکسی (توصیهشده)، **Windows Server** (با `deploy/start-vps-windows.ps1`)، کانتینر با Volume پایدار، سرور اختصاصی، PaaS با دیسک پایدار (مثل Liara با دیسک، یا Dokploy/Coolify روی VPS) |
| دامنهٔ canonical | `https://www.psmvalve.com` — در `lib/seo.js`, `app/sitemap.js`, `app/robots.js`, `app/[locale]/layout.js` **هاردکد** شده است |
| ✅ دامنهٔ یکسانشده | همهجا `https://www.psmvalve.com`: `lib/seo.js`, `app/sitemap.js`, `app/robots.js`, `app/[locale]/layout.js` و `data/settings.json` → `website`. ریدایرکت ۳۰۱ از بدون-`www` به `www` در کانفیگ Nginx انجام میشود. |

---

## ۱) مشخصات سرور پیشنهادی

### جدول سختافزار

| ردیف | CPU | RAM | دیسک | مناسب برای |
| --- | --- | --- | --- | --- |
| حداقل قابل قبول | ۱ vCPU | ۲ GB + ۲ GB swap | ۴۰ GB SSD | راهاندازی و ترافیک کم (بیلد با swap انجام میشود) |
| **پیشنهادی (انتخاب کن)** | **۲ vCPU** | **۴ GB** | **۶۰ GB NVMe** | ترافیک متوسط سایت شرکتی B2B ✅ |
| ترافیک بالا/رشد | ۴ vCPU | ۸ GB | ۱۰۰ GB NVMe | نمایشگاه/کمپین، آپلود ویدیوی زیاد |

### چرا این اعداد؟

مصرف واقعی این پروژه روی سرور (اندازهگیریشده روی نسخهٔ بیلدشدهٔ فعلی):

| بخش | حجم |
| --- | --- |
| `node_modules/` | ~۵۰۰ MB |
| `.next/` (خروجی بیلد) | ~۴۶۰ MB |
| `public/` (تصاویر، HDRI، PDF) | ~۷۰ MB |
| `data/` + `public/uploads/` | امروز ~۲۸ MB، ولی با آپلودهای پنل **رشد میکند** |
| اوج مصرف RAM در `npm run build` | ۱ تا ۱.۵ GB (روی ۲GB حتماً swap بگذار) |
| مصرف RAM در حال اجرا (`next start`) | ~۲۵۰–۴۰۰ MB |

**پهنای باند:** سایت فایل سنگین دارد (PDF ۲۱MB و دو کاتالوگ ۱۱MB). اگر ترافیک ماهانه مهم است، حداقل **۱ TB/ماه** یا ترافیک نامحدود انتخاب کن، و پشت CDN بگذار.

**سیستمعامل:** Ubuntu 24.04 LTS (یا 22.04 LTS).

### نمونهٔ ارائهدهندهها

| نوع | نمونهها | نکته |
| --- | --- | --- |
| VPS ایرانی (پینگ بهتر برای کاربر ایرانی) | ابر آروان (ابرک/VPS)، پارسپک، افرانت، ایرانسرور، نتافراز | پرداخت ریالی، پشتیبانی فارسی، مناسب نهایی شدن پروژه |
| VPS خارجی (ارزانتر) | Hetzner (CX22: 2vCPU/4GB/40GB)، Contabo، DigitalOcean | اگر مخاطب اصلی داخل ایران است، پینگ و احتمال اختلال را در نظر بگیر |
| CDN روی هر دو گزینه | آروان کلاد یا Cloudflare (رایگان) | کش داراییها + SSL + ضد DDoS |

> قیمتها و موجود بودن پلنها متغیر است؛ **قبل از خرید، مشخصات جدول بالا را با پلن مقایسه کن** (مهمترینها: ۴GB RAM، ۶۰GB NVMe، Ubuntu، دسترسی root/SSH).

### نکات خرید که حتماً بپرس

1. **دسترسی root یا sudo کامل** و SSH دارید؟ (بدون آن نمیتوان Nginx/PM2/SSL نصب کرد)
2. امکان **اجرای پروسهٔ دائمی Node** (PM2/systemd) وجود دارد؟
3. اسنپشات/بکاپ خودکار ماهانه در پنل هست؟ (برای بکاپ دوم استفاده میکنیم)
4. پورتهای ورودی ۸۰ و ۴۴۳ باز است؟
5. امکان نصب **SSL رایگان** (Let's Encrypt / SSL آروان) هست؟
6. محدودیت پهنای باند ماهانه چقدر است؟

---

## ۲) پیشنیازهای نرمافزاری روی سرور

| نرمافزار | نسخه | نقش |
| --- | --- | --- |
| Node.js | 20 LTS (یا 22 LTS) | اجرای اپ و بیلد |
| npm | همراه Node | نصب وابستگیها (`npm ci`) |
| PM2 | آخرین نسخه | اجرای دائمی + ریاستارت خودکار |
| Nginx | آخرین نسخه | ریورسپروکسی، SSL، کش داراییها |
| Certbot | آخرین نسخه | گواهی SSL رایگان |
| git | هر نسخه | دریافت کد از GitHub |
| ufw + fail2ban | — | فایروال و محافظت SSH |

اسکریپت آمادهٔ راهاندازی سرور تازه: [`deploy/bootstrap-server.sh`](./deploy/bootstrap-server.sh)

## ۲-و) ویندوز سرور — راهاندازی با یک خط فرمان

بقیهٔ این راهنما برای لینوکس است (PM2 + Nginx + Certbot). اگر سرورت **Windows Server** است،
همان کارها را `deploy/start-vps-windows.ps1` انجام میدهد — بدون Git، بدون PM2 و بدون Nginx:

```powershell
# از داخل پوشهٔ پروژه، با PowerShell باز شده به‌صورت Run as Administrator
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain psmvalve.com -Email admin@psmvalve.com

# دامنه نداری؟ IP عمومی سرور خودش تشخیص داده میشود و سایت روی HTTP بالا میآید
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1

# کد را از پوشهٔ آماده یا ZIP بده (روی سرور Git نصب نیست)
powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -SourceDir C:\psm-valve -Domain 5.1.2.3
```

| کار در لینوکس | معادل در ویندوز |
| --- | --- |
| Node 22 + PM2 + `pm2 startup` | MSI رسمی nodejs.org + دو **Scheduled Task** با حساب SYSTEM (`PSM-VALVE`، `PSM-VALVE-Proxy`) که در بوت بالا می‌آیند و خودکار ریاستارت می‌شوند |
| Nginx reverse proxy + Certbot | **Caddy** (پروکسی + گواهی Let's Encrypt خودکار)؛ اگر پورت ۸۰ دست IIS باشد، اپ مستقیم روی پورت ۳۰۰۰ سرو می‌شود |
| `ufw` + `fail2ban` | قواعد فایروال ویندوز در گروه `PSM VALVE` (۸۰/۴۴۳ یا پورت اپ) |
| cron بکاپ | بکاپ خودکار ندارد؛ از `manage.ps1` و کپی `data\` + `public\uploads\` استفاده کن |
| `.env.production` با اسرار | همان فایل، UTF-8 **بدون BOM**؛ اسرار و رمز اولیه در `C:\ProgramData\PSMValve` با ACL محدود به SYSTEM/Administrators |
| `pm2 logs` | `powershell -File "C:\ProgramData\PSMValve\manage.ps1" -Action logs` |

نکتههای اختصاصی ویندوز:
- فایل‌های `ps1` را **UTF-8 با BOM** نگه دار؛ PowerShell ۵.۱ بدون BOM متن فارسی را خراب می‌خواند.
  برعکس آن، `.env.production` باید **بدون BOM** باشد.
- `npm ci` برای `better-sqlite3` به بیلد ابزار نیاز دارد؛ اگر شکست، Visual Studio Build Tools ۲۰۲۲
  (Desktop development with C++) را نصب و لانچر را دوباره اجرا کن.
- گواهی HTTPS فقط با دامنه صادر میشود؛ روی IP، لاگین پنل با HTTP هم کار میکند.
- اجرای دوبارهٔ لانچر بیخطر است: `data\`، `public\uploads\` و `.env.production` حفظ میشوند.
- جزئیات گزینهها و عیبیابی: بخش ۱۳ در [`INSTALL-STEPS.txt`](./INSTALL-STEPS.txt) و
  بخش «لانچر یکخطی» در [`deploy/README.md`](./deploy/README.md).

اگر سرور اوبونتو داری ولی نمی‌خواهی گزینه‌ها را یادداشت کنی، `deploy/start-vps-ubuntu.sh` همان
`install.sh` را با تشخیص خودکار IP و دریافت `sudo` اجرا میکند (از داخل پوشهٔ پروژه یا با `curl | sudo bash`).

## ۲-ز) Ubuntu 24.04 + aaPanel — راهنمای اختصاصی

اگر سرور را با پنل **aaPanel** مدیریت می‌کنی، `install.sh` را اجرا نکن (با Nginx/PM2 پنل تعارض دارد).
راهنمای گام‌به‌گام، کانفیگ Nginx سازگار با پنل و اسکریپت آپدیت امن:

👉 [`deploy/aapanel/README.md`](./deploy/aapanel/README.md)

خلاصه: Node 22 + PM2، ریشهٔ `/www/wwwroot/psm-valve`، کاربر `www`، پورت لوکال `3000`،
SSL از پنل و اعمال [`deploy/aapanel/nginx-snippet.conf`](./deploy/aapanel/nginx-snippet.conf).
آپدیت: `sudo bash deploy/aapanel/update.sh`.

## ۳) راهاندازی سرور — گامبهگام

> ⏩ **میخواهی این بخش خودکار انجام شود؟** `sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com`
> (گامهای زیر همان کارهایی است که `install.sh` انجام میدهد؛ برای درک/بازرسی دستی این بخش را بخوان.)

> همهٔ دستورها روی Ubuntu و با کاربر `psm` (نه root) اجرا میشوند، مگر جایی که `sudo` آمده.

### گام ۱ — اتصال و بهروزرسانی

```bash
ssh psm@SERVER_IP
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw fail2ban build-essential unzip
```

### گام ۲ — نصب Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v      # باید v22.x و 10.x بدهد
```

### گام ۳ — نصب PM2

```bash
sudo npm install -g pm2
pm2 -v
```

### گام ۴ — دریافت کد از GitHub

```bash
sudo mkdir -p /var/www/psm-valve
sudo chown -R $USER:$USER /var/www/psm-valve
git clone https://github.com/AHSHNO1/psm-valve.git /var/www/psm-valve
cd /var/www/psm-valve
```

> اگر مخزن **خصوصی** است، روی سرور یک **Deploy Key** بساز (`ssh-keygen -t ed25519 -C "psm-server"`) و کلید عمومی را در GitHub → Settings → Deploy keys اضافه کن، سپس:
> `git remote set-url origin git@github.com:AHSHNO1/psm-valve.git`

### گام ۵ — تنظیم متغیرهای محیطی (مهمترین گام امنیتی)

فایل `.env.production` را در ریشهٔ پروژه بساز:

```bash
cat > /var/www/psm-valve/.env.production <<'EOF'
NODE_ENV=production

# ۱) کلید امضای JWT — حداقل ۳۲ بایت. با این دستور بساز:
#    openssl rand -base64 48
JWT_SECRET=PUT_A_RANDOM_48_CHAR_SECRET_HERE

# ۲) حساب مدیر اصلی
ADMIN_USERNAME=psmadmin

# ۳) یکی از دو روش رمز (روش هش توصیه میشود):
#    روش الف) رمز متنی، حداقل ۱۲ کاراکتر
ADMIN_PASSWORD=
#    روش ب) هش bcrypt (اولویت دارد) — بساز با:
#    node -e "console.log(require('bcryptjs').hashSync('رمز-قوی-شما', 12))"
ADMIN_PASSWORD_HASH=

# ۴) در تولید باید خالی/false باشد (اجازهٔ admin/admin فقط در dev)
ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS=false

# ۵) مسیر اختیاری پایگاه‌دادهٔ SQLite محصولات (پیشفرض: data/psm-valve.sqlite)
PSM_DATABASE_PATH=/var/www/psm-valve/data/psm-valve.sqlite

# ۶) اختیاری: کلید جدا برای چالش ضداسپم فرم تماس (پیشفرض: JWT_SECRET)
CONTACT_CHALLENGE_SECRET=
EOF

chmod 600 /var/www/psm-valve/.env.production
```

قواعد قطعی:

- `JWT_SECRET` کمتر از ۳۲ بایت → ورود پنل خطای «در سرور پیکربندی نشده» میدهد و توکن ساخته نمیشود.
- `ADMIN_PASSWORD` کمتر از ۱۲ کاراکتر → ورود **رد** میشود (مگر با `ADMIN_PASSWORD_HASH`).
- `.env.production` هیچوقت در گیت کامیت نمیشود (در `.gitignore` است). فقط `.env.example` در مخزن است.
- برای ساخت هش bcrypt:
  ```bash
  cd /var/www/psm-valve
  node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'رمز-قوی-شما'
  ```

> 🔐 اگر رمز مدیر قبلاً در مخزن گیت بوده (فایل `data/admin.json` قبلاً کامیت شده بود)، **همان رمز را دیگر استفاده نکن**؛ رمز جدید بساز.

### گام ۶ — نصب وابستگیها و بیلد

```bash
cd /var/www/psm-valve
npm ci                 # نصب دقیق بر اساس package-lock.json
npm run build          # خروجی: ✓ Compiled successfully + 134 static pages
mkdir -p logs
```

اگر RAM کم بود و بیلد با `Killed` قطع شد:

```bash
# راهحل ۱: سواپ ۲ گیگابایتی
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# راهحل ۲: افزایش حافظهٔ Node
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### گام ۷ — انتقال داراییها و دادههای آپلودشده (از کامپیوتر خودت)

`public/uploads/**` و بخشی از `data/*.json` **در گیت نیستند** (به درستی؛ چون محتوای کاربرند). اگر سرور تازه است، این دو مسیر را از دستگاه خودت منتقل کن، وگرنه تصاویر اسلایدر و کاتالوگها ۴۰۴ میشوند:

```powershell
# در ویندوز، داخل ریشهٔ پروژه:
.\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm
```

این اسکریپت `data/` (شامل `admin.json`، `users.json`، `messages.json`، محتوای سایت) و `public/uploads/` را با `scp` میفرستد.

اگر روی لینوکس/مک هستی:

```bash
rsync -avz --progress data/            psm@SERVER_IP:/var/www/psm-valve/data/
rsync -avz --progress public/uploads/  psm@SERVER_IP:/var/www/psm-valve/public/uploads/
```

### گام ۸ — اجرای دائمی با PM2

```bash
cd /var/www/psm-valve
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save                                   # ذخیرهٔ لیست پروسهها
pm2 startup systemd -u $USER --hp $HOME    # خروجی دستور را کپی و با sudo اجرا کن
pm2 logs psm-valve --lines 50              # بررسی لاگ
curl -I http://127.0.0.1:$(cat /var/www/psm-valve/.app-port)/fa           # باید 200 بدهد
```

> ⚠️ در `ecosystem.config.js` مقدار `instances` را **۱** نگه دار؛ چون محدودسازی نرخ ورود/فرم در حافظهٔ پروسه است و دادهها روی فایلسیستم نوشته میشوند.

### گام ۹ — بهروزرسانیهای بعدی (Deploy مجدد)

> ⏩ سادهترین راه: `su - psm -c 'bash /var/www/psm-valve/deploy/update.sh'`
> (پیشبررسی → بکاپ دادهٔ زنده → دریافت کد → `npm ci` → بیلد → `pm2 reload` → `npm test` → بررسی سلامت)

```bash
/var/www/psm-valve/deploy/deploy.sh
```

این اسکریپت: بکاپ دادهٔ زنده → `git reset --hard origin/main` → برگرداندن دادهٔ زنده → `npm ci` → `npm run build` → `pm2 reload`.

بعد از هر انتشار، چک کن: `git log -1 --oneline`، `pm2 status`، `curl -I https://www.psmvalve.com/fa`.

## ۴) Nginx — ریورسپروکسی، SSL و کارایی

> ⏩ `deploy/install.sh` این بخش (بههمراه SSL و فایروال) را خودکار انجام میدهد؛ اگر خودکار نصب کردی، این بخش فقط برای بازبینی است.

فایل آماده: [`deploy/nginx-psmvalve.conf`](./deploy/nginx-psmvalve.conf)

```bash
sudo cp /var/www/psm-valve/deploy/nginx-psmvalve.conf /etc/nginx/sites-available/psmvalve.conf
sudo ln -s /etc/nginx/sites-available/psmvalve.conf /etc/nginx/sites-enabled/psmvalve.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

آنچه کانفیگ انجام میدهد:

| مورد | توضیح |
| --- | --- |
| پروکسی به `127.0.0.1:<port>` (پورت از `.app-port`) | با هدرهای `X-Real-IP` و `X-Forwarded-For` → لازمهٔ کار درست محدودسازی نرخ ورود |
| سرو مستقیم `/uploads/`، `/images/`، `/documents/`، `/hdri/` | فایل سنگین از Node عبور نمیکند (سرعت و RAM بهتر) |
| پروکسی `robots.txt`، `sitemap.xml`، `manifest.webmanifest`، `icon.svg` | اینها **داینامیک** هستند (`app/robots.js`، `app/sitemap.js`، `app/manifest.js`، `app/icon.svg`) و باید از Node بیایند |
| `client_max_body_size 60m` | API آپلود حداکثر ۵۰MB میپذیرد |
| gzip + هدرهای امنیتی | `HSTS`، `X-Content-Type-Options`، `Referrer-Policy` |
| ریدایرکت `www` → بدون `www` | یک دامنهٔ canonical برای SEO |

### SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.psmvalve.com -d psmvalve.com --redirect -m info@psmvalve.com --agree-tos
sudo systemctl status certbot.timer    # تمدید خودکار
```

> اگر DNS روی آروان/کلادفلر است، میتوانی SSL را از پنل آنها هم فعال کنی (Full/Strict). در آن حالت بلوک TLS در Nginx را با گواهی خودشان تنظیم کن یا از Origin Certificate استفاده کن.

### فایروال و محافظت SSH

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo systemctl enable --now fail2ban
sudo ufw status verbose
```

---

## ۵) بکاپگیری — بدون این، دادهٔ سایت در خطر است

دادهٔ سایت (محتوای پنل، پیامهای تماس، کاربران author، فایلهای آپلودشده) **فقط روی همین سرور** است. اسکریپت آماده: [`deploy/backup.sh`](./deploy/backup.sh)

```bash
sudo mkdir -p /var/backups/psm-valve
sudo chown -R $USER:$USER /var/backups/psm-valve
chmod +x /var/www/psm-valve/deploy/backup.sh
/var/www/psm-valve/deploy/backup.sh          # تست دستی
```

زمانبندی روزانه (۳ بامداد) با cron:

```bash
crontab -e
# این خط را اضافه کن:
0 3 * * * /var/www/psm-valve/deploy/backup.sh >> /var/www/psm-valve/logs/backup.log 2>&1
```

اسکریپت از این مسیرها بکاپ میگیرد و فقط ۱۴ نسخهٔ آخر را نگه میدارد:

- `data/` (کل دادهٔ سایت)
- `public/uploads/` (تمام فایلهای آپلودشده)
- `ecosystem.config.js` و `.env.production` (نسخهٔ رمزگذاری/فشرده، جدا و محدود)

SQLite محصولات در `data/psm-valve.sqlite` است. اسکریپت بکاپ با `deploy/backup-products-db.cjs` از دیتابیس snapshot تراکنشی می‌گیرد و آن را جداگانه از JSONها نگه می‌دارد. اگر `PSM_DATABASE_PATH` سفارشی داری، همان متغیر را هنگام اجرای اسکریپت‌های deploy/backup در محیط shell هم export کن. در اولین اجرا، پایگاه‌داده از `lib/products.js` seed می‌شود؛ پس از آن، تغییرات پنل فقط در SQLite ثبت می‌شوند.

**بکاپ خارج از سرور (توصیهٔ جدی):** یکی از این دو را فعال کن:

```bash
# الف) sync به سرور دیگر یا NAS
rsync -avz /var/backups/psm-valve/ backupuser@BACKUP_HOST:/backups/psm-valve/

# ب) آپلود به فضای ابری (نمونه با rclone)
rclone copy /var/backups/psm-valve remote:psm-valve-backups
```

> بازیابی (Restore): ابتدا سرویس را متوقف کن؛ آرشیو JSON را در `/var/www/psm-valve/` باز کن و فایل `products-*.sqlite` را به مسیر `PSM_DATABASE_PATH` (پیشفرض `data/psm-valve.sqlite`) کپی کن. سپس سرویس را راه‌اندازی و سلامت صفحات را بررسی کن.

---

## ۶) چکلیست امنیتی قبل از انتشار

| # | مورد | وضعیت مورد انتظار |
| --- | --- | --- |
| ۱ | `JWT_SECRET` | تصادفی، ۳۲+ بایت، فقط روی سرور |
| ۲ | رمز مدیر | ۱۲+ کاراکتر، هش bcrypt، **رمز جدید** (رمز قدیمی در تاریخ گیت بوده) |
| ۳ | `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS` | `false` یا حذفشده در تولید |
| ۴ | `.env.production` | دسترسی `600`، هرگز در گیت |
| ۵ | فایلهای خصوصی | `data/admin.json`، `data/users.json`، `data/messages.json` در گیت نیستند (ignore شدهاند) |
| ۶ | HTTPS | اجباری + ریدایرکت `http`→`https` + HSTS |
| ۷ | فایروال | فقط ۲۲ (SSH)، ۸۰، ۴۴۳ باز |
| ۸ | SSH | ورود با کلید، `PermitRootLogin no`، `PasswordAuthentication no` |
| ۹ | fail2ban | فعال روی SSH |
| ۱۰ | لایهٔ دوم پنل | basic auth روی `/admin` در Nginx (در کانفیگ نمونه توضیح داده شده) |
| ۱۱ | محدودسازی نرخ | `/api/auth/login`: ۱۰ بار/۱۵ دقیقه · `/api/contact`: طبق `lib/rate-limit.js` |
| ۱۲ | کوکی نشست | `httpOnly` + `sameSite=lax` + `secure` در تولید (در `lib/auth.js` تنظیم شده) |
| ۱۳ | آپلود | محدود به نوعهای مجاز + حداکثر ۵۰MB + نام فایل تصادفی (`app/api/upload/route.js`) |
| ۱۴ | `robots.txt` | `/admin` و `/api/` مسدودند |
| ۱۵ | هدرهای امنیتی | از Nginx |
| ۱۶ | بکاپ | روزانه + نسخهٔ خارج از سرور + تست بازیابی |

## ۷) انتشار کد روی GitHub

مخزن: `https://github.com/AHSHNO1/psm-valve` (شاخهٔ `main`)

### چه چیزی نباید کامیت شود (تضمینشده با `.gitignore`)

| مسیر | دلیل |
| --- | --- |
| `.env`, `.env.local`, `.env.production` | اسرار (JWT، رمز مدیر) |
| `data/admin.json` | نام کاربری و **هش رمز مدیر** |
| `data/users.json` | کاربران author با هش رمز |
| `data/messages.json` | پیامهای واقعی مشتریان (اطلاعات شخصی) |
| `data/*.sqlite*` | پایگاه‌دادهٔ زندهٔ محصولات و فایلهای journal آن |
| `data/*.backup-*.json` | بکاپهای محلی |
| `public/uploads/*` | داراییهای آپلودشده در زمان اجرا (در سرور منتقل میشوند) |
| `node_modules/`, `.next/`, `logs/`, `*.log` | قابل بازسازی/موقت |
| `*.backup-*.js`, `*.orig` | فایلهای موقت |

فایلهای **باید** کامیت شوند: `data/branding.json`, `data/settings.json`, `data/content.json`, `data/services.json`, `data/faq.json`, `data/partners.json`, `data/projects.json`, `data/news.json`, `data/certificates.json`, `data/media.json`, `data/sliders.json`, `data/testimonials.json` — چون محتوای اصلی سایتاند و «seed» سرور جدید محسوب میشوند.

### دستورهای انتشار

```powershell
# ۱) چک کن چه چیزی staged/untracked است (هیچ فایل secret نباید بیاید)
git status --short

# ۲) اسکن سریع برای اسرار قبل از کامیت
git diff --cached | Select-String -Pattern "JWT_SECRET=[A-Za-z0-9+/]{10,}|ADMIN_PASSWORD=[^\s]"

# ۳) بیلد نهایی
npm run build

# ۴) کامیت و پوش
git add -A
git commit -m "Feat: site-wide i18n, admin roles, SEO/manifest, deploy guide"
git push origin main
```

### تنظیمات پیشنهادی مخزن در GitHub

1. **Visibility**: اگر مخزن عمومی است، فقط محتوای سایت (که عمومی هم منتشر میشود) داخلش است — ولی همچنان رمزها را از سرور بده، نه از مخزن.
2. **Branch protection** روی `main`: نیاز به PR برای تغییرات، جلوگیری از force-push.
3. **Secret scanning** (Settings → Security) فعال باشد.
4. **Deploy key** روی سرور برای clone خصوصی (فقط read).
5. اگر قبلاً فایل `data/admin.json` کامیت شده، هش رمز در **تاریخ گیت** میماند → رمز را عوض کن (سادهترین و مطمئنترین راه). اگر میخواهی تاریخ هم پاک شود، نیاز به بازنویسی تاریخ (`git filter-repo`) و force-push است.

---

## ۸) وظایف پس از انتشار (چند ساعت کار)

1. **تصویر OG**: ✅ فایل `public/og/og-default.jpg` موجود است و `app/[locale]/layout.js` به همین مسیر اشاره میکند؛ فقط اگر برند/شعار عوض شد تصویر ۱۲۰۰×۶۳۰ را بهروز کن.
2. **لوگو**: ✅ `public/logo/logo-main.png` · `logo-icon.png` موجود و در `data/branding.json` ثبت شدهاند؛ در پنل (تنظیمات ← برندینگ) فقط رنگها و لینکهای شبکههای اجتماعی خالی را تکمیل کن.
3. **دامنه**: ✅ `https://www.psmvalve.com` در کد و `data/settings.json` یکسان شده است؛ باقیمانده فقط ثبت دامنه در Search Console و بازبینی فیلد سایت در پنل (تنظیمات ← شرکت) است.
4. **Google Search Console**: دامنه را ثبت کن و `https://www.psmvalve.com/sitemap.xml` را ثبت کن.
5. **Analytics**: اتصال GA4 (فعلاً `lib/analytics.js` رویدادها را فقط log میکند).
6. **ایمیل فرم تماس**: ✅ ارسال با `lib/mailer.js` (nodemailer) پیاده شده است؛ فقط `SMTP_*` و `CONTACT_TO` را در `.env.production` بگذار، سپس `su - psm -c "cd /var/www/psm-valve && pm2 reload ecosystem.config.js --update-env"` و با `node scripts/test-email.mjs` تست کن. اگر تنظیم نشود، پیامها در `data/messages.json` و پنل ذخیره میشوند و اعلان ایمیلی نمیرود.
7. **محتوای نهایی**: PDF دیتاشیت محصولات، تأیید فنی مشخصات (`lib/products.js` هشدار «تأییدنشده» دارد)، متنهای چهار زبان.
8. **مانیتورینگ**: یک سرویس uptime (مثل UptimeRobot) روی `https://www.psmvalve.com/fa` + هشدار دیسک پر.
9. **تست بازیابی بکاپ**: یکبار روی سرور تست، بکاپ را برگردان و مطمئن شو سایت بالا میآید.

---

## ۹) عیبیابی

| نشانه | دلیل و راهحل |
| --- | --- |
| «ورود در سرور پیکربندی نشده است» | `JWT_SECRET` یا رمز مدیر تنظیم نشده. `.env.production` را کامل کن و `pm2 reload ecosystem.config.js --update-env`. |
| ورود با رمز درست رد میشود | `ADMIN_PASSWORD` کمتر از ۱۲ کاراکتر است یا `ADMIN_PASSWORD_HASH` اشتباه تولید شده. دوباره هش بساز. |
| `502 Bad Gateway` | پروسهٔ Node بالا نیست: `pm2 status` → `pm2 logs psm-valve`. اگر پورت اشغال است، `ss -tlnp \| grep "$(cat /var/www/psm-valve/.app-port)"`. |
| ۴۰۴ برای تصاویر اسلایدر/کاتالوگ | `public/uploads/` روی سرور منتقل نشده → گام ۷ را اجرا کن. |
| تصویر اول اسلایدر خالی است | ورودی اسلایدر به دامنهٔ وردپرس قدیمی اشاره میکند (`data/sliders.json`) — تصویر را دانلود و آپلود کن. |
| بیلد با `Killed` قطع میشود | کمبود RAM → سواپ یا `NODE_OPTIONS=--max-old-space-size=2048`. |
| خطای `EACCES` روی `data/` | مالکیت پوشه را به کاربر اجراکنندهٔ PM2 بده: `sudo chown -R psm:psm /var/www/psm-valve`. |
| ۴۰۴های عجیب یا پاسخ ۲۰۰ برای مسیر ناموجود | `loading.js` را در سطح `app/[locale]` نگذار (soft 404). `not-found.js` باید سرور کامپوننت باشد. |
| تغییرات پنل ذخیره نمیشود | پروسهٔ Node روی دیسک read-only اجرا میشود (مثلاً دیپلوی روی PaaS بدون دیسک پایدار). باید VPS/دیسک پایدار. |
| تغییرات `data/*.json` بعد از deploy از بین میرود | `deploy/deploy.sh` را استفاده کن (اول بکاپ میگیرد و بعد از `git reset` دادهٔ زنده را برمیگرداند). |

---

## ۱۰) نگهداری دورهای

| دوره | کار |
| --- | --- |
| هر انتشار | `deploy/deploy.sh` + چک `pm2 status` و `curl -I https://www.psmvalve.com/fa` |
| هفتگی | بررسی `logs/`, `pm2 logs`, فضای دیسک (`df -h`)، سایز `public/uploads` |
| ماهانه | `sudo apt update && sudo apt upgrade`، بررسی نسخهٔ Node و پکیجها (`npm audit`)، تست بازیابی بکاپ |
| هر ۳ ماه | بازبینی رمز مدیر و `JWT_SECRET` (چرخش کلید = خروج خودکار همهٔ نشستها) |
| قبل از کمپین/نمایشگاه | بررسی CDN و پهنای باند، تست سرعت دانلود PDFهای سنگین، مانیتورینگ فعال |

---

## ۱۱) نقشهٔ فایلهای کلیدی

| فایل | نقش |
| --- | --- |
| `proxy.js` | ریدایرکت زبان (`/products` → `/fa/products`) + محافظت نقشیمحور `/admin/*` (نام جدید `middleware` در Next 16) |
| `lib/auth.js` | JWT، کوکی نشست، اعتبارسنجی مدیر/نویسنده |
| `lib/rate-limit.js` | محدودسازی در حافظه (`login`, `contact`) — نیازمند تکنسخه بودن پروسه |
| `lib/db.js` | خواندن/نوشتن `data/*.json` |
| `lib/seo.js` | canonical، hreflang چهارزبانه، متادیتا |
| `app/robots.js` / `app/sitemap.js` | SEO داینامیک (`/admin` و `/api/` مسدود) |
| `app/[locale]/not-found.js` + `components/NotFoundView.jsx` | ۴۰۴ اختصاصی چهارزبانه (باید سرور کامپوننت بماند) |
| `ecosystem.config.js` | اجرای PM2 |
| `deploy/*` | اسکریپتهای سرور، Nginx، بکاپ و انتقال دارایی |