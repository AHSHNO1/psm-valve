# PSM Valve — وضعیت پروژه

آخرین بهروزرسانی: 2026-10-14
مسیر محلی: `C:\Users\ahshno1\Desktop\psm-valve`
ریپازیتوری: https://github.com/AHSHNO1/psm-valve (شاخه `main`)
آخرین commit مرجع: `fecb8df` — Fix: serve warehouse HDR locally to avoid CDN load failure; update footer

---

## 1. خلاصه

وبسایت شرکتی **PETRO SAZEH MIHAN CO. (پتروسازه میهن)** — تولیدکننده شیرهای کنترلی صنعتی.
فعلاً در **مرحلهٔ تکمیل صفحات و آمادهسازی برای انتشار** است: اغلب صفحات عمومی و پنل ادمین ساخته شدهاند و کارهای باقیمانده بیشتر به اتصال سرویسهای خارجی و پر کردن محتوای واقعی مربوط میشوند.

---

## 2. Stack

| بخش | ابزار | نسخه |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| UI | React / React DOM | 18.3.1 |
| استایل | Tailwind CSS | 3.4.7 |
| انیمیشن | Framer Motion | 11.3.0 |
| نمودار | ApexCharts + react-apexcharts | 8.1.0 / 2.1.1 |
| سهبعدی | Three.js + @react-three/fiber + @react-three/drei | 0.166.1 / 8.16.8 / 9.108.3 (نصبشده: drei 9.122.0) |
| PDF | jsPDF + html2canvas | 4.2.1 / 1.4.1 |
| احراز هویت | jose + bcryptjs | 6.2.12 / 3.0.3 |
| تم | next-themes | 0.3.0 |
| آیکون | lucide-react | 1.54.0 |
| اسموث اسکرول | @studio-freight/lenis | 1.0.42 |

ذخیرهسازی: فعلاً **فایلهای JSON** در پوشه `data/` (بدون دیتابیس).

---

## 3. زبانها و RTL
- چهار زبان: **fa** (اصلی)، **en**، **ar**، **ru**
- `fa` و `ar` راستبهچپ (RTL)، `en` و `ru` چپبهراست (LTR)
- همه صفحات عمومی زیر `app/[locale]/` هستند
- فونت: Vazirmatn
- ترجمهها: `messages/` و آبجکت `L` در هر کامپوننت با کلیدهای `fa/en/ar/ru`

---

## 4. وضعیت صفحات

### ✅ کامل
| صفحه | مسیر |
|---|---|
| Home | `app/[locale]/page.js` |
| About | `app/[locale]/about/` |
| Contact | `app/[locale]/contact/` |
| FAQ | `app/[locale]/faq/` |
| Media | `app/[locale]/media/` |
| News | `app/[locale]/news/` |
| Partners | `app/[locale]/partners/` |
| Products (لیست + جزئیات + Datasheet) | `app/[locale]/products/` |
| Services | `app/[locale]/services/` |
| Sizing (ابزار مهندسی) | `app/[locale]/sizing/` |
| Standards | `app/[locale]/standards/` |
| Units | `app/[locale]/units/` |
| Why Us | `app/[locale]/why-us/page.js` |
| Process | `app/[locale]/process/page.js` |
| Projects | `app/[locale]/projects/page.js` |
| Articles (لیست و جزئیات) | `app/[locale]/articles/` |

> نکته: در نسخهٔ قبلی مستندات، چهار صفحهٔ Why Us، Process، Projects و Articles «ناقص» علامت خورده بودند. این مستند بهروز شد؛ همهٔ آنها الان کامل هستند.

### 🔧 پنل ادمین
- `app/admin/` شامل **۲۰ صفحه** (برندینگ، گواهینامهها، محتوا، FAQ، راهنما، ورود، رسانه، پیامها، اخبار، شرکای تجاری، محصولات، پروژهها، امنیت، خدمات، تنظیمات، اسلایدر، توصیهها)
- ورود با احراز هویت jose/bcryptjs

### 🔌 API
- `app/api/` شامل **۱۸ route**: auth (login/logout/password)، branding، certificates، contact، content، faq، media، messages، partners، products (و `[slug]`)، projects، settings، sliders، testimonials، upload

### 🧩 کامپوننتها
- `components/` شامل حدود **۶۷ فایل JSX**

---

## 5. تغییرات اخیر (تاریخچه)
| Commit | توضیح |
|---|---|
| `fecb8df` | فایل HDR محلی برای Environment سهبعدی + بهروزرسانی Footer |
| `cdde171` | بازطراحی بخش Services با انیمیشن و حذف LatestNews |
| `f059f7e` | پاکسازی backupها و اصلاح gitignore |
| `d61c8a7` | اعمال حالت تاریک به کامپوننتهای Sizing |

### مشکلات رفعشده
- **خطای `Could not load empty_warehouse_01_1k.hdr`:** کامپوننت `<Environment preset="warehouse" />` در سه فایل `ExplodedValve.jsx`، `ExplodedBallValve.jsx` و `ExplodedHvofRobot.jsx` فایل HDR را از CDN خارجی (`raw.githack.com`) میگرفت. حالا فایل در `public/hdri/empty_warehouse_01_1k.hdr` قرار دارد و کامپوننتها با `files="/hdri/empty_warehouse_01_1k.hdr"` آن را لود میکنند.

---

## 6. کارهای باقیمانده (اولویتبندی)

### کوتاهمدت
- [ ] اتصال Analytics به شناسهٔ واقعی GA4
- [ ] اتصال فرم Contact به ایمیل (`app/api/contact`)
- [ ] پر کردن `data/*.json` با محتوای واقعی (فعلاً بعضی فایلها خالی یا نمونه هستند)
- [ ] ساخت تصاویر OG در `public/og/`
- [ ] ذخیرهٔ لوگو در `public/logo/`

### میانمدت
- [ ] Datasheet PDF واقعی محصولات
- [ ] جستجوی سراسری
- [ ] اتصال محصولات به کاتالوگ واقعی PSM

### بلندمدت
- [ ] مهاجرت از JSON به دیتابیس
- [ ] Deploy روی سرور
- [ ] Domain + SSL

---

## 7. وضعیت Build و نگهداری
- `npm run build`: ✅ موفق (آخرین بررسی: 2026-10-14، بدون خطا، «Compiled successfully»)
- پوشهٔ `.next` (کش بیلد) در `.gitignore` است و با هر بیلد دوباره ساخته میشود.
- برای آزادسازی فضا میتوان `.next\cache` را حذف کرد (حدود ۲۲۰ MB). این پوشه با بیلد بعدی دوباره ساخته میشود.
- `node_modules` در `.gitignore` است؛ با `npm install` بازسازی میشود.

### فایلهای ریشه که باید بررسی شوند
- `fix-sizing.js`، `v10-pro-features.js`، `verify-all-components.js`: اسکریپتهای قدیمی که در کد استفاده نمیشوند. قبل از حذف باید تأیید شوند.
- `data/settings.backup.json`: فایل پشتیبان. طبق قوانین پروژه بدون بکاپ نباید جایگزین شود.

---

## 8. دستورات مفید
```powershell
npm install          # نصب وابستگیها
npm run dev          # اجرای محلی (http://localhost:3000)
npm run build        # بیلد تولید
npm run start        # اجرای نسخهٔ بیلدشده
git status -sb       # وضعیت گیت
```
