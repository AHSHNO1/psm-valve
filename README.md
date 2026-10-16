# PSM VALVE — وبسایت شرکت پترو سازه میهن

وبسایت شرکتی **پترو سازه میهن (PETRO SAZEH MIHAN CO.)** — طراح و تولیدکنندهٔ شیرهای کنترلی صنعتی.
سایت چندزبانه (فارسی، انگلیسی، عربی، روسی) با پنل مدیریت کامل.

## استک فنی

| لایه | فناوری |
| --- | --- |
| فریمورک | Next.js 14.2.5 (App Router) + React 18 |
| استایل | Tailwind CSS 3.4 + CSS سراسری (تم Metro) |
| انیمیشن/سهبعدی | Framer Motion، Three.js + @react-three/fiber/drei |
| نمودار | ApexCharts / react-apexcharts |
| احراز هویت | `jose` (JWT در کوکی httpOnly) + `bcryptjs` |
| ذخیرهسازی | فایلسیستم: `data/*.json` برای داده و `public/uploads/**` برای داراییها |
| i18n | دیکشنریهای `messages/{fa,en,ar,ru}.json` + مدیریت مسیر در `middleware.js` |

> ⚠️ این پروژه به **دیسک پایدار (persistent disk)** نیاز دارد. روی Vercel/Netlify/serverless قابل استفاده نیست. راهنما: [`DEPLOY.md`](./DEPLOY.md)

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

\* یکی از دو گزینهٔ رمز کافی است. بدون تنظیم `JWT_SECRET` یا رمز، ورود پنل با پیام «در سرور پیکربندی نشده» رد میشود.

## ساختار پروژه

```
app/[locale]/…        صفحات عمومی (fa/en/ar/ru) + 404/error اختصاصی
app/admin/…           پنل مدیریت (admin، author، articles، users، media، slider، …)
app/api/…             روتهای API (auth، contact، upload، products، media، articles، …)
components/…          کامپوننتهای عمومی و components/admin برای پنل
lib/…                 منطق سرور: auth، db، rate-limit، seo، products، users، media، content
data/*.json           دادهٔ زندهٔ سایت (محتوا، تنظیمات، پیامها) — روی سرور تغییر میکند
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

## انتشار

راهنمای کامل گامبهگام (مشخصات سرور، نصب، Nginx، SSL، بکاپ، امنیت):
👉 [`DEPLOY.md`](./DEPLOY.md)