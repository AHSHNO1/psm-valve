# PSM Valve — وضعیت پروژه

آخرین بهروزرسانی: 2026-10-16
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

### زیرساخت i18n، SEO و ۴۰۴ (۲۰۲۶-۱۰-۱۶)
- **`middleware.js`** اضافه شد: ۱) ریشهٔ `/` → زبان مناسب (کوکی `NEXT_LOCALE` → `Accept-Language` → پیشفرض `fa`)؛ ۲) آدرسهای بدون زبان مثل `/products` → `/fa/products` (با حفظ query)؛ ۳) ذخیرهٔ زبان جاری در کوکی؛ ۴) محافظت از `/admin/*` بر اساس نقش (`admin` همهجا، `author` فقط `/admin/author`).
- **SEO:** `app/sitemap.js` بازنویسی شد (چهارزبانه، شامل محصولات، خدمات و مقالات فعال)، `app/robots.js` (disallow ادمین و api)، `app/manifest.js` و `app/icon.svg` اضافه شدند و متادیتای کامل (canonical/hreflang/OG/Twitter) از `lib/seo.js` در `app/[locale]/layout.js` استفاده میشود.
- **۴۰۴ بومی:** `app/[locale]/[...notFound]/page.js` (catch-all) + `app/[locale]/not-found.js` (پوستهٔ سرور) + `components/NotFoundView.jsx` (نمای چهارزبانه) — برای مسیرهای ناشناس زیر هر زبان، همراه با چیدمان کامل سایت و کد وضعیت ۴۰۴.
- **Error Boundary و Loading:** `app/[locale]/error.js` (پیام خطای بومی + تلاش مجدد) و `app/[locale]/sizing/loading.js` (اسکلتون صفحهٔ سایزینگ).
- **UX:** `components/SkipLink.jsx` (پرش به محتوای اصلی) و `components/ScrollProgress.jsx` (نوار پیشرفت اسکرول).
- ⚠️ **نکتهٔ مهم:** فایل `not-found.js` باید **سرور کامپوننت** بماند؛ اگر `"use client"` داشته باشد Next آن را نادیده میگیرد و ۴۰۴ پیشفرض خودش را نشان میدهد (به همین دلیل نمای بومی در `components/NotFoundView.jsx` جدا شد).
- ⚠️ **نکتهٔ مهم:** گذاشتن `loading.js` در سطح `app/[locale]` باعث «soft 404» میشود (پاسخ ۲۰۰ بهجای ۴۰۴ برای همهٔ `notFound()`ها). اسکلتون را فقط در سگمنتهایی بگذارید که `notFound()` ندارند (مثل `sizing`).
- ✅ تست: ۴۶ بررسی خودکار روی dev و prod (ریدایرکتها، چهار زبان، ۴۰۴ها، نگهبانی ادمین، robots/sitemap/manifest) — همه موفق.

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
- [x] آمادهسازی انتشار: `DEPLOY.md` + `README.md` + `deploy/*` + `ecosystem.config.js` (۲۰۲۶-۱۰-۱۶)
- [ ] اجرای Deploy روی سرور (وابسته به انتخاب هاست)
- [ ] Domain + SSL

---

## 7. وضعیت Build و نگهداری
- `npm run build`: ✅ موفق (آخرین بررسی: 2026-10-16، «Compiled successfully»، ۲۶۳ صفحهٔ استاتیک، Middleware ۳۲.۵ kB، بدون خطا/هشدار)
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

---

## 9. آمادهسازی انتشار (۲۰۲۶-۱۰-۱۶)

### خلاصهٔ تغییرات این مرحله
| فایل | تغییر |
|---|---|
| `app/api/auth/login/route.js` | **محدودسازی نرخ ورود**: ۱۰ تلاش / ۱۵ دقیقه برای هر IP (کلید `panel-login` در `lib/rate-limit.js`)؛ پاسخ `429` با هدر `Retry-After: 900`. در prod تست شد: ۱۰×`401` سپس `429`. |
| `.env.example` | افزودن `ADMIN_PASSWORD_HASH` (با دستور ساخت bcrypt)، الزام ۱۲ کاراکتر برای `ADMIN_PASSWORD`، هشدار روی `ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS`. |
| `.gitignore` | افزودن `data/*.backup-*.json`، `*.log`، `logs/`، `.pm2/`، `*.backup.js`، `*.backup-*.js`، `*.orig`. |
| `ecosystem.config.js` | **جدید** — PM2 با `instances: 1`، `next start -p 3000`، لاگ در `logs/`، `max_memory_restart: 1200M`. |
| `README.md` | **جدید** — معرفی، استک، راهاندازی سریع، متغیرهای محیطی، ساختار، نکات ادمین. |
| `DEPLOY.md` | **جدید** — راهنمای کامل فارسی: مشخصات سرور، نصب گامبهگام، Nginx/SSL، بکاپ، چکلیست امنیتی، عیبیابی، نگهداری. |
| `deploy/*` | **جدید** — `nginx-psmvalve.conf`، `bootstrap-server.sh`، `deploy.sh`، `backup.sh`، `push-assets.ps1`. |
| `public/og/README.txt`، `public/logo/README.txt` | **جدید** — راهنمای تصویر OG و لوگو (فایلها هنوز نیستند). |
| `AI-PROJECT-SKILL.md` | افزودن بخش «عملیات، انتشار و امنیت». |

### محدودیت معماری (تعیینکنندهٔ انتخاب هاست)
سایت داده را در **فایل** ذخیره میکند: `data/*.json`، `public/uploads/**` و `lib/products.js` (پنل محصولات آن را بازنویسی میکند).
→ هاست باید **دیسک پایدار (persistent)** داشته باشد. **Vercel / Netlify / serverless کار نمیکند** (فایلها فقط-خواندنیاند و تغییرات پنل ذخیره نمیشود).

### مشخصات سرور پیشنهادی
| منبع | حداقل | پیشنهادی |
|---|---|---|
| CPU | ۱ vCPU | ۲ vCPU |
| RAM | ۲ GB (+سواپ ۲GB) | ۴ GB |
| دیسک | ۴۰ GB SSD | ۶۰ GB NVMe |
| OS | Ubuntu 22.04 | Ubuntu 24.04 LTS |
| پهنای باند | ۱ TB ماهانه | ۲ TB+ (برای PDF/ویدیو/HDRI) |

فایل HDR محیط سهبعدی ~۵ MB و کاتالوگهای PDF چند MB هستند؛ برای مخاطب ایران، سرور داخلی (Arvan/ParsPack/IranServer) یا سرور با CDN توصیه میشود.
`instances` در PM2 باید **۱** بماند (rate-limit در حافظه + نوشتن روی فایلسیستم).

### بازبینی سلامت در prod (بیلد `next start`)
`/`→`307 /en` · `/admin`→`307 /admin/login` · `/en/nope`→`404`+`noindex` · `/fa/products`→`200` · `robots.txt`/`sitemap.xml`→`200` — همه موفق.

### باقیماندهٔ قبل از انتشار
- [ ] انتخاب و خرید هاست (VPS با دیسک پایدار)
- [ ] انتقال `data/` و `public/uploads/` با `deploy/push-assets.ps1`
- [ ] ساخت `public/og/og-default.jpg` (الان در layout ارجاع شده ولی فایل نیست → پیشنمایش شبکههای اجتماعی بدون عکس)
- [ ] یکسانسازی دامنه: `https://psmvalve.com` (کد) با `https://www.psm-valve.com` (در `data/settings.json`)
- [ ] تعویض رمز مدیر (هش قدیمی در تاریخ گیت باقی است)
- [ ] تصویر اسلایدر اول هنوز به دامنهٔ وردپرس قدیمی اشاره میکند (`data/sliders.json`)
- [ ] انتقال فونت Vazirmatn از CDN به سرور خودمان (لود از `cdn.jsdelivr.net` در ایران ممکن است فیلتر/کند باشد)
