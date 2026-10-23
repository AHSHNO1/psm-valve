# RUNBOOK بازیابی اضطراری و چک‌لیست گو-لایو — PSM VALVE

> این سند دو کار می‌کند: (۱) چک‌لیست اجرایی قبل از بازکردن سایت به عموم،
> (۲) دفترچهٔ راهنمای لحظهٔ بحران — وقتی سایت یا دادهٔ آن دچار مشکل شده،
> با آرامش همین سند را از بالا بخوانید. راهنمای نصب اصلی:
> [`deploy/README.md`](./README.md)

مسیرهای پیش‌فرض (مطابق `deploy/install.sh`):
- کد اپ: `/var/www/psm-valve`
- بکاپ‌ها: `/var/backups/psm-valve`
- سرویس PM2: نام `psm-valve`
- کاربر اجرا: `psm`
- پورت اپ: در فایل `/var/www/psm-valve/.app-port` (پیش‌فرض ۳۰۰۰)

---

## ۱) چک‌لیست پیش از گو-لایو

هر مورد باید **تست‌شده** باشد، نه فقط «انجام‌شده». جلوی هر مورد دستور آزمون آمده است.

| # | مورد | آزمون قبولی |
|---|------|-------------|
| ۱ | `.env.production` با دسترسی `600`؛ `JWT_SECRET` قوی؛ `SMTP_*` و `CONTACT_TO` و `ALERT_EMAIL_TO` پر | `ls -l .env.production` → `-rw-------`؛ `node scripts/test-email.mjs` ایمیل می‌فرستد |
| ۲ | HTTPS فعال + هدایت اجباری http→https | `curl -sI http://دامنه` → `301` به https؛ قفل سبز مرورگر |
| ۳ | بقا بعد از ریبوت: `pm2 save` + `pm2 startup` اجرا شده | `pm2 startup` خروجی «already configured» یا دستور systemd فعال؛ بعد از یک `sudo reboot` سایت خودش بالا می‌آید |
| ۴ | cron بکاپ هفتگی فعال | `crontab -l -u psm` شامل `backup.sh`؛ در `/var/backups/psm-valve` بکاپ این هفته هست |
| ۵ | **رزمایش بازیابی** (بخش ۳) حداقل یک‌بار کامل و موفق | فایل نوتِ زمان رزمایش؛ هدف بازگردانی کامل < ۳۰ دقیقه |
| ۶ | بازبینی واقعی پنل ادمین: ورود، ویرایش یک محتوا، ذخیره، مشاهده روی سایت عمومی، خروج | ویرایش در سایت عمومی دیده می‌شود |
| ۷ | مانیتورینگ: ثبت `https://دامنه/api/health` در مانیتور (aaPanel / UptimeRobot) | پاسخ `200` و بدنهٔ `{"status":"ok"}`؛ آستانهٔ هشدار ۵ دقیقه |
| ۸ | ایمیل هشدار خطا مسیر دارد: `ALERT_EMAIL_TO` در env؛ یک خطای آزمایشی بدهید و ایمیل برسد | ایمیل با موضوع `[PSM Valve] خطای سرور` دریافت می‌شود |
| ۹ | امنیت: `npm audit --omit=dev` بدون critical/high؛ ufw فقط `22,80,443`؛ fail2ban فعال | `sudo ufw status` |
| ۱۰ | بدانید داده‌ها کجاست: `data/*.json` + `data/psm-valve.sqlite` + `public/uploads/**` — همه روی دیسک سرور، در گیت نیستند | بکاپ شامل هر سه است |

**مانور نهایی:** یک تغییر بی‌خطر در پنل بدهید (مثلاً توضیح یک محصول)، سایت عمومی را رفرش کنید، بعد برگردانید. اگر کل این چرخه بدون خطا بود، سایت آمادهٔ گو-لایو است.

---

## ۲) پایش و معنی هشدارها

### endpoint سلامت
```
GET /api/health          → بررسی سریع (خواندنی)
GET /api/health?deep=1   → + آزمایش نوشتن روی دایرکتوری داده
```
- `200 {"status":"ok"}` → همه‌چیز سالم
- `503 {"status":"degraded"}` → نگاه کنید به `checks`:
  - `dataDir: error` → دیسک/مجوز دایرکتوری داده مشکل دارد
  - `settings: error` → فایل تنظیمات **خراب** است (فوری بخش ۴-ج)
  - `disk: error` → فضای دیسک زیر ۲۰۰MB (بخش ۴-ب)
  - `dataWritable: error` (فقط deep) → دیسک پر یا مجوز اشتباه

### ایمیل هشدار خطا
موضوع `[PSM Valve] خطای سرور — <دامنه>` یعنی یک خطای مدیریت‌نشدهٔ سرور (۵xx)
یا شکست ارسال SMTP رخ داده. نرخ‌گذاری خودکار دارد (هر خطای تکراری حداکثر هر
۱۰ دقیقه، سقف ۱۰ ایمیل در ساعت) — پس اگر ایمیل‌ها پشت‌سرهم می‌آیند، مشکل
مداوم است. متن ایمیل شامل مسیر، پیام و ۸ خط اول پشته است؛ با `pm2 logs`
تطبیق دهید.

### لاگ‌ها
```bash
pm2 logs psm-valve --lines 200     # لاگ اپ
tail -100 /var/www/psm-valve/logs/backup.log
journalctl -u nginx --since today
```

---

## ۳) رزمایش بازیابی (Restore Drill)

هر ۳ ماه و بعد از هر تغییر بزرگ زیرساختی. هدف: اثبات اینکه بکاپ‌ها واقعاً
بازگردانی می‌شوند، **بدون دست‌زدن به سایت زنده**.

```bash
# ۱) بکاپ تازهٔ دستی
sudo -u psm bash /var/www/psm-valve/deploy/backup.sh

# ۲) محیط آزمون ایزوله
LATEST=$(ls -1t /var/backups/psm-valve/data-*.tar.gz | head -1)
mkdir -p /tmp/drill && cd /tmp/drill
tar -xzf "$LATEST"                       # → پوشهٔ data/
cp /var/backups/psm-valve/products-*.sqlite .   # جدیدترین
tar -xzf "$(ls -1t /var/backups/psm-valve/uploads-*.tar.gz | head -1)"

# ۳) اپ را با دایرکتوری دادهٔ رزمایش بالا بیاورید (پورت موقت ۳۹۹۹)
cd /var/www/psm-valve
PSM_DATA_DIR=/tmp/drill/data PSM_DATABASE_PATH=/tmp/drill/products-*.sqlite \
  PORT=3999 node .next/standalone/server.js 2>/dev/null || \
PSM_DATA_DIR=/tmp/drill/data PORT=3999 npx next start -p 3999 &

# ۴) آزمون قبولی
curl -s "http://127.0.0.1:3999/api/health?deep=1" | grep -o '"status":"[a-z]*"'
# باید status":"ok" و dataWritable":"ok" باشد
curl -s http://127.0.0.1:3999/fa | grep -o "<title>[^<]*" | head -1

# ۵) پاکسازی
kill %1 ; rm -rf /tmp/drill
```

زمان را یادداشت کنید. اگر از ۳۰ دقیقه بیشتر شد، مشکل فرایند است — سند را اصلاح کنید.

---

## ۴) سناریوهای اضطراری

### الف) سایت کامل down
```bash
pm2 status                          # وضعیت پروسه
pm2 logs psm-valve --lines 100 --err
pm2 restart psm-valve               # اولین دارو
ss -tlnp | grep "$(cat /var/www/psm-valve/.app-port)"
```
- اگر PM2 در حلقهٔ crash است: خروجی خطای بیلد/کد را بخوانید؛
  `bash deploy/update.sh` (بیلد تمیز + reload) معمولاً حل می‌کند.
- اگر پروسه هست ولی 502 می‌دهید: مشکل nginx است → `nginx -t && systemctl reload nginx`.
- اگر دیسک پر است: بخش بعدی.

### ب) دیسک پر (health → disk error)
```bash
df -h                                # کدام پارتیشن پر است
du -sh /var/backups/psm-valve/* | sort -h   # بکاپ‌های قدیمی
find /var/backups/psm-valve -mtime +7 -delete     # خارج از سیاست نگهداری
sudo journalctl --vacuum-size=200M
npm cache clean --force              # در پوشهٔ اپ
pm2 flush                            # لاگ‌های PM2
```
پس از آزادسازی: `curl -s localhost:$(cat .app-port)/api/health?deep=1` → باید ok شود.

### ج) دادهٔ خراب (settings: error / پنل خطای ۵۰۰ می‌دهد)
اطمینان اول: نسخهٔ خراب را نگه دارید — پاک نکنید.
```bash
pm2 stop psm-valve
mv data/settings.json data/settings.json.corrupt-$(date +%Y%m%d-%H%M)
LATEST=$(ls -1t /var/backups/psm-valve/data-*.tar.gz | head -1)
mkdir /tmp/restore && tar -xzf "$LATEST" -C /tmp/restore
cp /tmp/restore/data/settings.json data/settings.json
chown psm:psm data/settings.json && chmod 600 data/settings.json
rm -rf /tmp/restore
pm2 start psm-valve
curl -s localhost:$(cat .app-port)/api/health | grep status
```
برای `psm-valve.sqlite` (کاتالوگ محصولات) همین الگو با فایل
`products-<stamp>.sqlite` انجام می‌شود. برای محتوای خاص یکی از فایل‌های
`data/*.json` هم همین‌طور.

### د) قفل‌شدن دسترسی ادمین
1. **مسیر اول — ایمیل:** صفحهٔ ورود پنل → «فراموشی رمز/نام کاربری»؛ لینک
   یک‌بارمصرف به `ADMIN_RECOVERY_EMAIL` می‌رود (نیازمند SMTP سالم).
2. **مسیر دوم — سرور:** با SSH:
   ```bash
   cd /var/www/psm-valve && sudo -u psm node scripts/rotate-admin-password.mjs
   ```
   (تعاملی و امن؛ رمز جدید را bcrypt می‌کند.)
3. **باطل‌کردن فوری همهٔ نشست‌ها:** `JWT_SECRET` را در `.env.production`
   عوض کنید و `pm2 reload ecosystem.config.js --update-env` بزنید.

### هـ) مشکوک به نفوذ
1. `pm2 stop psm-valve` — سایت را همان نگه دارید تا بررسی تمام شود.
2. بکاپ فورنزیک: `tar -czf /root/evidence-$(date +%F).tar.gz data logs .pm2/logs`
3. تغییر رمزهای ادمین + `JWT_SECRET` + رمز SMTP و بررسی
   `~/.ssh/authorized_keys`، `crontab -l`، آخرین لاگین‌ها (`last`).
4. بازگردانی `data/` از آخرین بکاپ **قبلی** از روز مشکوک.
5. رویداد را مستند کنید (زمان، مسیر، خسارت)؛ در صورت تأیید نفوذ، گزارش دهید.

### و) مهاجرت به سرور جدید
1. سرور جدید را با `sudo bash deploy/install.sh --domain … --email …` نصب کنید
   (خودش env و رمز و SSL می‌سازد).
2. سایت را موقتاً متوقف نگه دارید: `pm2 stop psm-valve`.
3. از سرور قدیمی انتقال دهید: `data/`، `public/uploads/`،
   و `.env.production` (یا فقط مقدار `JWT_SECRET` را در env جدید کپی کنید تا
   نشست‌های کاربران باطل نشوند).
4. `chown -R psm:psm data public/uploads` و `pm2 start psm-valve` و
   `curl .../api/health?deep=1`.
5. TTL دامنه را قبلاً کم کرده باشید؛ DNS را عوض کنید و ۲۴ ساعت هر دو سرور
   بکاپ بگیرند.

---

## ۵) مرجع سریع

| کار | دستور |
|-----|-------|
| وضعیت/ری‌استارت اپ | `pm2 status` · `pm2 restart psm-valve` |
| لاگ زنده | `pm2 logs psm-valve` |
| سلامت | `curl -s localhost:$(cat /var/www/psm-valve/.app-port)/api/health?deep=1` |
| بکاپ دستی | `sudo -u psm bash deploy/backup.sh` |
| چرخش رمز ادمین | `sudo -u psm node scripts/rotate-admin-password.mjs` |
| تست SMTP | `node scripts/test-email.mjs` |
| انتشار نسخهٔ جدید | `bash deploy/update.sh` |
| وضعیت فایروال | `sudo ufw status` |

قاعدهٔ طلایی: **اول از موقعیت فعلی بکاپ بگیرید، بعد هر تغییری بدهید.**
حتی در بحران — `tar -czf /tmp/pre-rescue-$(date +%s).tar.gz data` فقط چند ثانیه است.
