# PSM VALVE — وبسایت شرکت پترو سازه میهن

وبسایت شرکتی **پترو سازه میهن (PETRO SAZEH MIHAN CO.)** — طراح و تولیدکنندهٔ شیرهای کنترلی صنعتی.
سایت چندزبانه (فارسی، انگلیسی، عربی، روسی) با پنل مدیریت کامل.

## استک فنی

| لایه | فناوری |
| --- | --- |
| فریمورک | Next.js 14.2.35 (App Router) + React 18 |
| استایل | Tailwind CSS 3.4 + CSS سراسری (تم Metro) |
| انیمیشن/سهبعدی | Framer Motion، Three.js + @react-three/fiber/drei |
| نمودار | ApexCharts / react-apexcharts |
| احراز هویت | `jose` (JWT در کوکی httpOnly) + `bcryptjs` |
| ذخیرهسازی | JSON در `data/*.json`، محصولات در SQLite (`data/psm-valve.sqlite`) و داراییها در `public/uploads/**` |
| i18n | دیکشنریهای `messages/{fa,en,ar,ru}.json` + مدیریت مسیر در `middleware.js` |

> ⚠️ این پروژه به **دیسک پایدار (persistent disk)** نیاز دارد. SQLite محصولات و فایلهای JSON/آپلودها باید روی volume پایدار باشند؛ روی Vercel/Netlify/serverless با دیسک موقت قابل استفاده نیست. راهنما: [`DEPLOY.md`](./DEPLOY.md)

## شروع سریع (توسعه)

```powershell
npm ci                # نصب وابستگیها
Copy-Item .env.example .env.local   # سپس مقادیر را پر کن
npm run dev           # http://localhost:3000
```

بیلد و اجرای نسخهٔ تولید:

```powershell
npm run build
npm run start         # http://localhost:3000
```

## متغیرهای محیطی

| متغیر | اجباری | توضیح |
| --- | --- | --- |
| `JWT_SECRET` | ✅ | حداقل ۳۲ بایت. با `openssl rand -base64 48` بساز. |
| `ADMIN_USERNAME` | ✅ | نام کاربری مدیر |
| `ADMIN_PASSWORD` | ✅* | رمز متنی، حداقل ۱۲ کاراکتر |
| `ADMIN_PASSWORD_HASH` | ✅* | هش bcrypt رمز (اولویت بر `ADMIN_PASSWORD`) |
| `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS` | ❌ | فقط توسعه: `true` اجازهٔ `admin/admin` میدهد. در تولید هرگز. |
| `CONTACT_CHALLENGE_SECRET` | ❌ | اختیاری برای چالش ضداسپم فرم تماس (پیشفرض: `JWT_SECRET`) |
| `PSM_DATABASE_PATH` | ❌ | مسیر فایل SQLite محصولات؛ پیشفرض `data/psm-valve.sqlite` و باید روی دیسک پایدار باشد. |

\* یکی از دو گزینهٔ رمز کافی است. بدون تنظیم `JWT_SECRET` یا رمز، ورود پنل با پیام «در سرور پیکربندی نشده» رد میشود.

## ساختار پروژه

```
app/[locale]/…        صفحات عمومی (fa/en/ar/ru) + 404/error اختصاصی
app/admin/…           پنل مدیریت (admin، author، articles، users، media، slider، …)
app/api/…             روتهای API (auth، contact، upload، products، media، articles، …)
components/…          کامپوننتهای عمومی و components/admin برای پنل
lib/…                 منطق سرور: auth، db، rate-limit، seo، products، users، media، content
data/*.json           دادهٔ زندهٔ سایت (محتوا، تنظیمات، پیامها) — روی سرور تغییر میکند
data/psm-valve.sqlite پایگاه‌دادهٔ محصولات — به صورت خودکار از lib/products.js seed میشود
messages/*.json       دیکشنری ترجمهها
public/uploads/**     داراییهای آپلودشده از پنل (در گیت ردیابی نمیشود)
middleware.js         ریدایرکت زبان + محافظت نقشمحور از /admin
deploy/               اسکریپتها و کانفیگ انتشار
```

## پنل مدیریت

- آدرس: `/admin` (بدون توکن → هدایت به `/admin/login`)
- نقشها: `admin` (دسترسی کامل) و `author` (فقط `/admin/author`)
- ورود: `POST /api/auth/login` — کوکی `admin_token` با عمر ۷ روز
- محدودسازی تلاش ورود: ۱۰ تلاش در ۱۵ دقیقه برای هر IP (پاسخ `429`)
- از بخش «متن‌های سایت» می‌توان همهٔ رشته‌های متنی `data/content.json` را در چهار زبان ویرایش کرد؛ بخش «ترجمه‌های سایت» نیز واژه‌نامه‌های رابط را به‌صورت جست‌وجوپذیر مدیریت می‌کند.
- تغییر رمز از بخش «امنیت» انجام می‌شود. ترجمه‌های ذخیره‌شده در `data/translations.json` قرار می‌گیرند؛ برای ماندگاری محتوا، پوشهٔ `data` باید روی فضای پایدار باشد و در بکاپ‌ها قرار گیرد.

## ابزارهای داده و کیفیت (مهندسی)

| دستور | کار |
| --- | --- |
| `npm test` | تستهای رگرسیون (`node --test`) — شامل کیفیت دادهٔ جدول Cv کاتالوگ |
| `npm run cv:inspect` | بازبینی `VALVE_CV.xlsx` پیش از ورود (`--summary --validate --analyse`) |
| `npm run cv:import` | ورود اکسل کاتالوگ به `data/valve-cv-catalog.json` (اتمیک + بکاپ + ثبت اصلاحها) |
| `npm run cv:coverage` | پوشش جدول Cv روی محصولات واقعی + نمونهٔ پیشنهاد سایزینگ |
| `npm run benchmark:sizing` | بنچمارک موتور سایزینگ |
| `npm run audit:responsive` | بازبینی سرریز افقی/ریسپانسیو با CDP (Chrome روی پورت ۹۲۲۲) |

اسکریپتهای پایتون فقط از کتابخانهٔ استاندارد استفاده میکنند؛ نصب بستهٔ اضافی لازم نیست.
راهنمای کامل جدول Cv و دادهٔ مرجع: [`docs/CV-TABLES.md`](./docs/CV-TABLES.md)
سیستم واحدها (متریک/اینچی)، دبی حجمی/جرمی و جرم مولکولی: [`lib/unit-system.js`](./lib/unit-system.js) + تست [`tests/unit-system.test.mjs`](./tests/unit-system.test.mjs)
بخش «فرصت همکاری» صفحهٔ تماس (متن از دیکشنری `messages/*.json` → `contact.career` و بازنویسی از پنل «تنظیمات»): [`components/ContactClient.jsx`](./components/ContactClient.jsx)

## انتشار

مسیرهای آماده (انتخاب یکی): راهنمای یکجا 👉 [`deploy/README.md`](./deploy/README.md)

| مسیر | دستور اصلی |
| --- | --- |
| **VPS تازه (توصیهشده)** — نصب Node/PM2/Nginx/SSL/بکاپ/فایروال با یک دستور | `sudo bash deploy/install.sh --domain psmvalve.com --email admin@psmvalve.com` |
| همان کار، از ویندوز | `.\deploy\install-remote.ps1 -Server <IP> -Domain psmvalve.com` |
| **Docker** | `bash deploy/docker.sh` |
| **cPanel/CloudLinux** (Node.js Selector) | [`deploy/cpanel/README.md`](./deploy/cpanel/README.md) |
| انتشار نسخهٔ جدید روی نصب موجود | `bash deploy/update.sh` |

پیشبررسی قبل از انتشار: `node scripts/preflight.mjs`

راهنمای کامل دستی گامبهگام (مشخصات سرور، Nginx، SSL، بکاپ، امنیت):
👉 [`DEPLOY.md`](./DEPLOY.md)