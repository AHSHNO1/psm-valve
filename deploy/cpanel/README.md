# انتشار روی هاست اشتراکی cPanel / CloudLinux (Node.js Selector)

این مسیر برای هاستهایی است که در cPanel بخش **Setup Node.js App** (Node.js Selector / CloudLinux) دارند.

> ⚠️ **پیشنیاز قطعی:** هاست باید اجرای پروسهٔ Node را پشتیبانی کند.
> اگر هاست شما فقط PHP دارد (هاست اشتراکی معمولی)، این پروژه روی آن اجرا **نمیشود**؛
> چون به پروسهٔ دائمی Node و دیسک قابل نوشتن نیاز دارد. در آن صورت از
> [`DEPLOY.md`](../../DEPLOY.md) (VPS) یا `bash deploy/docker.sh` استفاده کنید.

## ۱) آمادهسازی در cPanel

۱. **Setup Node.js App → Create Application**
   | فیلد | مقدار |
   | --- | --- |
   | Node.js version | **22** (حداقل ۲۲ لازم است) |
   | Application mode | Production |
   | Application root | `psm-valve` (پوشهٔ همین مخزن) |
   | Application URL | دامنه یا سابدامنهٔ سایت |
   | Application startup file | `app.js` |

۲. کد پروژه را در همان `Application root` قرار دهید (File Manager یا Git™ Version Control یا Terminal):

```bash
cd ~/psm-valve
git clone https://github.com/AHSHNO1/psm-valve.git .
```

۳. فایل `deploy/cpanel/app.js` همین مخزن را به ریشهٔ اپلیکیشن کپی کنید:

```bash
cp deploy/cpanel/app.js .
```

> نیازی به کپی `.htaccess` نیست مگر cPanel آن را نساخته باشد؛ در آن صورت
> `deploy/cpanel/.htaccess` را با مقادیر واقعی (`USERNAME` و مسیر `nodevenv`) کپی کنید.

## ۲) نصب و بیلد (Terminal cPanel)

```bash
source /home/USERNAME/nodevenv/psm-valve/22/bin/activate
cd ~/psm-valve
npm ci
npm run build
```

مسیر واقعی `nodevenv` در پنل cPanel نمایش داده میشود (مثال بالا برای نسخهٔ 22 است).

## ۳) متغیرهای محیطی

در پنل cPanel → **Setup Node.js App → Environment variables** اینها را اضافه کنید
(همان مقادیر `deploy/make-env.sh`؛ میتوانید فایل ساختهشدهٔ `.env.production` را در ریشهٔ اپ بگذارید):

| متغیر | مقدار |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | یک رشتهٔ تصادفی ≥۳۲ بایت (`openssl rand -base64 48`) |
| `ADMIN_USERNAME` | `admin` |
| `CONTACT_CHALLENGE_SECRET` | رشتهٔ تصادفی ≥۳۲ بایت |
| `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS` | خالی |
| `SMTP_*`, `CONTACT_TO` | (اختیاری) اعلان ایمیلی فرم تماس |

سپس رمز مدیر را تنظیم کنید (هش bcrypt در `data/admin.json`):

```bash
cd ~/psm-valve && node scripts/rotate-admin-password.mjs
```

## ۴) راهاندازی و تست

- در پنل cPanel دکمهٔ **Restart** را بزنید.
- `https://دامنه/fa` باید باز شود و `https://دامنه/admin` به `/admin/login` برود.
- اگر سایت بالا نیامد: پنل cPanel → `stderr.log` / `~/psm-valve/logs`.

## ۵) نکات مهم این مسیر

| موضوع | توضیح |
| --- | --- |
| دادهٔ پایدار | `data/` و `public/uploads/` باید داخل خود `Application root` باشند (نوشتنی). بکاپ: `bash deploy/backup.sh` |
| دیتابیس SQLite | `better-sqlite3` باینری بومی است؛ اگر نصبش خطا داد، از هاست بخواهید `make/gcc` را در Build Tools فعال کند (Node 22 LTS). |
| حافظهٔ بیلد | `next build` به ~۱.۵GB حافظه نیاز دارد. اگر بیلد با `Killed` قطع شد، بیلد را روی سیستم خودتان/CI انجام دهید و پوشهٔ `.next` را آپلود کنید. |
| فایلهای حساس | `.env.production` و `data/` هرگز نباید از وب خوانده شوند (`.htaccess` این را میبندد؛ بهتر است docroot دامنه روی `public_html` بماند و اپ در root جدا باشد). |
| تغییر `JWT_SECRET` | بعد از تغییر، باید `npm run build` دوباره اجرا شود (میدلور مقدار را در زمان بیلد درونریزی میکند). |
| بهروزرسانی | `git pull && npm ci && npm run build` و بعد Restart در پنل. |

## ۶) چرا ممکن است روی بعضی هاستها کار نکند؟

- هاست فقط Apache + PHP است (بدون Node.js Selector).
- محدودیت حافظهٔ کمتر از ۱GB و بدون امکان بیلد خارجی.
- محدودیت روی تعداد پروسهها یا مسدود بودن `fs` نوشتن در `data/`.

در این موارد مسیر درست: `deploy/install.sh` روی VPS یا `deploy/docker.sh` روی هر هاستی که Docker دارد.