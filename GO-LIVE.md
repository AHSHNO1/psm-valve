# GO-LIVE — انتشار PSM Valve روی هاست و دامنه

**تاریخ:** ۲۰۲۶-۱۰-۱۸ · **نسخهٔ کد:** Next 14.2.35 · **آخرین بیلد:** موفق · **تست‌ها:** ۲۵/۲۵

---

## ۰) جواب کوتاه

**کد سایت آمادهٔ انتشار است؛ داده و چند تنظیم امنیتی نه.**

- فنی: بیلد موفق، ۱۴۶+ صفحه، تست‌ها سبز، سایزینگ/دیتاشیت/پنل ادمین کار می‌کنند.
- مسدودکننده‌ها: رمز مدیر هنوز عوض نشده، ریپوی گیت‌هاب عمومی است، دامنه یکسان نشده، بکاپ offsite ندارد.
- با یک VPS معمولی و نیم‌روز کار، سایت بالا می‌آید.

---

## ۱) چه چیزی آماده است

| مورد | وضعیت |
|---|---|
| بیلد تولید | ✅ `npm run build` |
| تست‌ها | ✅ ۲۵/۲۵ (`npm test`) |
| چهار زبان + RTL | ✅ |
| پنل ادمین (۲۵ صفحه) | ✅ با احراز هویت و نگهبانی لایه‌ای |
| دیتاشیت چاپی مستقل | ✅ با اطلاعات تماس واقعی |
| سایزینگ (ISA/IEC + FCI 70-2) | ✅ |
| SEO (sitemap/robots/OG/hreflang) | ✅ |
| هدرهای امنیتی | ✅ |
| آیکون PWA و OG | ✅ |
| اسکریپت‌های استقرار/بکاپ | ✅ `deploy/*` |
| پیش‌بررسی خودکار | ✅ `node scripts/preflight.mjs` |

## ۲) پنج کار اجباری قبل از انتشار

### ۱. چرخش رمز مدیر (۵ دقیقه)
رمز قدیمی در تاریخچهٔ گیت‌هاب عمومی افشا شده است:
```powershell
cd C:\Users\ahshn\Desktop\psm-valve
node scripts/rotate-admin-password.mjs
```
سپس `JWT_SECRET` را هم عوض کنید تا نشست‌های قدیمی باطل شوند.

### ۲. خصوصی کردن مخزن و پاک‌سازی تاریخچه (۲۰ دقیقه)
- در GitHub: Settings → Danger Zone → Change visibility → Private
- پاک‌سازی تاریخچه با `git filter-repo --path data/admin.json --invert-paths` و سپس force-push
- تا وقتی این کار انجام نشده، فرض کنید رمز قدیمی سوخته است.

### ۳. تصمیم دامنه (۵ دقیقه)
در کد دو دامنه هست:
- `https://psmvalve.com` در `lib/seo.js`، `sitemap.js`، `robots.js`
- `https://www.psm-valve.com` در `data/settings.json` و `lib/company-info.js`

**پیشنهاد: `psmvalve.com`** (بدون www، مطابق canonical فعلی). سپس سایت را در پنل ادمین → تنظیمات/شرکت به همان دامنه تغییر دهید.

### ۴. متغیرهای محیطی تولید
روی سرور فایل `.env.production` بسازید:
```bash
JWT_SECRET=$(openssl rand -base64 48)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<هش bcrypt>
ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS=
CONTACT_CHALLENGE_SECRET=$(openssl rand -base64 32)
```
هش bcrypt:
```bash
node -e "console.log(require('bcryptjs').hashSync('رمز-قوی-شما', 12))"
```

### ۵. بکاپ offsite
`deploy/backup.sh` را در cron بگذارید و **مقصد خارجی** (rclone/rsync) را فعال کنید. بدون آن، فقط یک دیسک دارید.

---

## ۳) انتخاب هاست

### ✅ درست: VPS با دیسک پایدار
سایت داده را در فایل نگه می‌دارد (`data/*.json`، SQLite، `public/uploads`). پس هاست باید دیسک قابل نوشتن و پایدار داشته باشد.

| منبع | حداقل | پیشنهادی |
|---|---|---|
| CPU | ۱ vCPU | ۲ vCPU |
| RAM | ۲ GB + ۲GB swap | ۴ GB |
| دیسک | ۴۰ GB SSD | ۶۰ GB NVMe |
| پهنای باند | ۱ TB | ۲ TB+ |
| OS | Ubuntu 22.04 | Ubuntu 24.04 |

ارائه‌دهندگان داخلی (برای مخاطب ایران): **آروان‌کلود، پارس‌پک، ایران‌سرور** — یا VPS خارجی + CDN.

### ❌ نامناسب
- **Vercel / Netlify / serverless**: فایل‌سیستم فقط‌خواندنی است؛ تغییرات پنل ادمین ذخیره نمی‌شود.
- هاست اشتراکی cPanel بدون SSH/Node.

> PM2 باید **تک‌نسخه** بماند (`instances: 1`) چون محدودسازی نرخ و نوشتن داده در همان پروسه است.

---

## ۴) دامنه و DNS

1. دامنه را از یک ثبت‌کننده (IRNIC/نماینده) بگیرید.
2. در پنل DNS:
   - `A  @   →  IP سرور`
   - `A  www →  IP سرور` (یا CNAME به دامنهٔ اصلی)
3. TTL را روی ۳۰۰ ثانیه بگذارید تا زمان انتقال دردسر نداشته باشید.
4. رکوردهای `MX` را اگر ایمیل سازمانی دارید دست نزنید.
5. پس از اتصال، SSL با Let's Encrypt:
```bash
sudo certbot --nginx -d psmvalve.com -d www.psmvalve.com
```

---

## ۵) استقرار گام‌به‌گام

> راهنمای کامل با جزئیات: [DEPLOY.md](DEPLOY.md) · کانفیگ آماده: `deploy/nginx-psmvalve.conf`

### گام ۱ — سرور
```bash
ssh root@SERVER_IP
adduser psm && usermod -aG sudo psm
apt update && apt upgrade -y
apt install -y curl git nginx ufw
```

### گام ۲ — Node 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # باید v20.x باشد
npm i -g pm2
```

### گام ۳ — کد
```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/AHSHNO1/psm-valve.git psm-valve
cd psm-valve
git checkout main
```

### گام ۴ — محیط
`.env.production` را طبق بخش ۲-۴ بسازید (`chmod 600`).

### گام ۵ — نصب و بیلد
```bash
npm ci
npm run build
node scripts/preflight.mjs   # باید همه سبز شود
```

### گام ۶ — اجرا با PM2
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # خروجی دستور را اجرا کنید
```

### گام ۷ — Nginx
```bash
cp deploy/nginx-psmvalve.conf /etc/nginx/sites-available/psmvalve.conf
ln -s /etc/nginx/sites-available/psmvalve.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```
(دامنه را در فایل کانفیگ با دامنهٔ نهایی جایگزین کنید.)

### گام ۸ — SSL
```bash
certbot --nginx -d psmvalve.com -d www.psmvalve.com
```

---

## ۶) انتقال داده از ویندوز به سرور

از کامپیوتر خودتان:
```powershell
cd C:\Users\ahshn\Desktop\psm-valve
.\deploy\push-assets.ps1 -Server SERVER_IP -User psm
```
این اسکریپت:
- `data/` (شامل SQLite، تنظیمات، ترجمه‌ها، جدول Cv) و `public/uploads/` را می‌برد
- **فایل‌های خصوصی** (`admin.json`، `users.json`، `messages.json`) را به‌طور پیش‌فرض رد می‌کند
- قبل از نوشتن، از دادهٔ سرور بکاپ می‌گیرد

بعد از انتقال:
```bash
pm2 reload psm-valve --update-env
```

---

## ۷) تست بعد از انتشار

```bash
curl -I https://psmvalve.com/            # 307 به /fa یا /en
curl -I https://psmvalve.com/fa          # 200
curl -I https://psmvalve.com/fa/sizing   # 200
curl -I https://psmvalve.com/admin       # 307 به /admin/login
curl -I https://psmvalve.com/api/cv-tables  # 401 بدون ورود
curl -s https://psmvalve.com/robots.txt
curl -s https://psmvalve.com/sitemap.xml | head
```

بعد در مرورگر:
- ورود به `/admin/login` با رمز جدید
- ثبت یک محصول تستی و حذف آن
- اجرای سایزینگ و دانلود PDF
- باز کردن دیتاشیت یک محصول و تست چاپ
- تست موبایل (منوی همبرگری، فرم تماس)

---

## ۸) بکاپ و نگهداری

```bash
# cron روزانه ۳ بامداد
0 3 * * * /var/www/psm-valve/deploy/backup.sh >> /var/log/psm-backup.log 2>&1
```

- بکاپ شامل `data/`، `public/uploads/` و دیتابیس SQLite (آنلاین) است.
- **ماهانه یک بار restore را تست کنید** — بکاپی که تست نشده، بکاپ نیست.
- به‌روزرسانی سایت: `sudo -u psm bash deploy/deploy.sh`

---

## ۹) بعد از انتشار (نه مسدودکننده، اما مهم)

| مورد | وضعیت فعلی | کار لازم |
|---|---|---|
| جدول Cv محصولات | خالی | ورود از `/admin/cv-tables` |
| Google Analytics | اتصال ندارد | شناسهٔ GA4 در تنظیمات |
| ایمیل فرم تماس | فقط در پنل ذخیره می‌شود | SMTP یا سرویس ایمیل |
| برخی مشخصات محصول | خالی (دمای کاری، ترم، استاندارد) | تکمیل از کاتالوگ |
| زیرمجموعه‌های پوزیشنر/هوک‌آپ | بدون محصول | افزودن محصول |
| تصاویر سنگین | چند فایل ۱۰–۲۰ MB | فشرده‌سازی |
| CDN فونت | از jsDelivr | میزبانی محلی (اختیاری) |

---

## ۱۰) زمان‌بندی تقریبی

| مرحله | زمان |
|---|---|
| خرید VPS و دامنه | ۱–۲ روز (تأیید پرداخت) |
| راه‌اندازی سرور + SSL | ۲–۳ ساعت |
| انتقال داده و تست | ۱–۲ ساعت |
| تکمیل محتوا (Cv، مشخصات) | ۱–۳ روز |
| **جمع** | **۳ تا ۵ روز کاری** |

---

## ۱۱) دستورهای سریع

```bash
node scripts/preflight.mjs        # پیش‌بررسی انتشار
npm run build && npm test         # بیلد و تست
pm2 status && pm2 logs psm-valve  # وضعیت و لاگ
nginx -t                          # تست کانفیگ
bash deploy/backup.sh             # بکاپ دستی
```
