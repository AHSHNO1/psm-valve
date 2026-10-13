من روی یک پروژه Next.js 14 کار می‌کنم به نام PSM Valve. لطفاً این context را بخوان و به من کمک کن آن را کامل کنم.

═══════════════════════════════════════════════════════════
📌 اطلاعات پروژه
═══════════════════════════════════════════════════════════

نام: PSM Valve (Petro Sazeh Mihan Co.)
نوع: وب‌سایت شرکتی صنعتی — تولیدکننده شیرهای کنترلی
صنعت: نفت، گاز، پتروشیمی، آب، نیروگاه
وب‌سایت: www.psm-valve.com
GitHub: https://github.com/AHSHNO1/psm-valve
مسیر محلی: C:\Users\ahshno1\Desktop\psm-valve

═══════════════════════════════════════════════════════════
🛠️ Stack
═══════════════════════════════════════════════════════════

- Framework: Next.js 14.2.5 (App Router)
- React 18.3.1
- Tailwind CSS 3.4.7
- Framer Motion 11.3.0
- ApexCharts + react-apexcharts (نمودار)
- Three.js + @react-three/fiber (3D)
- lucide-react (آیکون)
- jsPDF + html2canvas (PDF)
- jose + bcryptjs (احراز هویت)
- next-themes (تم تاریک/روشن)

═══════════════════════════════════════════════════════════
🌐 زبان‌ها و RTL
═══════════════════════════════════════════════════════════

- ۴ زبان: فارسی (اصلی)، انگلیسی، عربی، روسی
- fa و ar → RTL | en و ru → LTR
- همه صفحات با پوشه [locale] ساخته می‌شوند
- فونت: Vazirmatn
- هر کامپوننت آبجکت L دارد با کلیدهای fa/en/ar/ru

═══════════════════════════════════════════════════════════
🎨 تم طراحی
═══════════════════════════════════════════════════════════

رنگ‌ها:
- Gold: #E0A81A (اصلی)، #B8850A (تیره)، #F5C518 (روشن)
- Silver: #C0C0C0، #9CA3AF
- Dark: #0F1114، #1F2124، #3A3D42
- سفید: #FFFFFF
- پس‌زمینه کارت: var(--bg-card)
- Border: var(--border)

گرادیان‌ها:
- Gold: linear-gradient(135deg, #E0A81A, #B8850A)
- Dark Metal: linear-gradient(160deg, #0F1114, #1F2124, #3A3D42)

استایل:
- border-radius: 9-16px
- padding کارت‌ها: 14-16px
- gap: 10-12px
- سایه: 0 1px 3px rgba(20, 22, 27, 0.04)
- کلاس‌های آماده: card-glass، btn-gold، btn-secondary، btn-outline

═══════════════════════════════════════════════════════════
📂 ساختار پروژه
═══════════════════════════════════════════════════════════

app/
├── [locale]/                 ← صفحات عمومی
│   ├── page.js               ← Home ✅
│   ├── about/                ← About ✅
│   ├── articles/             ← ⚠️ ناقص (156B stub)
│   ├── articles/[slug]/      ← ✅
│   ├── contact/              ← ✅
│   ├── faq/                  ← ✅
│   ├── media/                ← ✅
│   ├── news/                 ← ✅
│   ├── partners/             ← ✅
│   ├── process/              ← ⚠️ ناقص
│   ├── products/             ← ✅ + [slug] + datasheet
│   ├── projects/             ← ⚠️ ناقص
│   ├── services/             ← ✅
│   ├── sizing/               ← ✅ (کامل‌ترین صفحه)
│   ├── standards/            ← ✅
│   ├── units/                ← ✅
│   └── why-us/               ← ⚠️ ناقص
├── admin/                    ← پنل ادمین (22 صفحه) ✅
├── api/                      ← 18 API route ✅
├── globals.css
├── robots.js
└── sitemap.js

components/                    ← کامپوننت‌ها
lib/                          ← منطق
data/                         ← JSON data
messages/                     ← فایل‌های ترجمه
public/                       ← assets

═══════════════════════════════════════════════════════════
✅ صفحات کامل
═══════════════════════════════════════════════════════════

1. Home ([locale]/page.js)
2. About
3. Contact (با فرم + نقشه + اطلاعات)
4. FAQ
5. Media
6. News
7. Partners
8. Products (لیست + 126 محصول + datasheet)
9. Services
10. Sizing ⭐ (ابزار مهندسی حرفه‌ای)
11. Standards
12. Units
13. Admin Panel (22 صفحه)
14. API Routes (18 endpoint)

═══════════════════════════════════════════════════════════
⚠️ صفحات ناقص (فقط stub 156 بایت)
═══════════════════════════════════════════════════════════

- app/[locale]/why-us/page.js
- app/[locale]/process/page.js
- app/[locale]/projects/page.js
- app/[locale]/articles/page.js (لیست)

این ۴ صفحه باید ساخته شوند.

═══════════════════════════════════════════════════════════
⭐ صفحه Sizing — کامل‌ترین صفحه پروژه
═══════════════════════════════════════════════════════════

فایل اصلی: components/SizingTool.jsx

قابلیت‌ها:
- محاسبه Cv/Kv برای مایع، گاز، بخار طبق IEC 60534
- ۳۵ سیال صنعتی در ۷ دسته (lib/fluids-database.js)
- Fluid Picker با جستجو
- فرم + نتیجه زنده (debounced 400ms)
- Wizard حالت ساده
- Unit Toggle (SI ↔ Imperial)
- مقایسه ۳ سایز جایگزین (Modal)
- گزارش PDF با واترمارک + نمودار + ۳ سایز
- Screenshot + Excel + Copy + Share
- ذخیره سناریوها
- Undo
- Validation قرمز
- Tips + Standards
- Material Guide داینامیک
- Product Suggestions
- Reference Tabs
- SEO + JSON-LD
- Analytics events

فایل‌های مرتبط:
- components/SizingTool.jsx
- components/SizingCharts.jsx
- components/SizingCompare.jsx
- components/SizingReportModal.jsx
- components/SizingWizard.jsx
- components/FluidPicker.jsx
- components/MaterialGuide.jsx
- components/ProductSuggestions.jsx
- components/EngineeringCalculator.jsx
- lib/sizing-advanced.js
- lib/unit-system.js
- lib/fluids-database.js
- lib/pdf-generator.js
- lib/analytics.js
- data/psm-products-preview.js

═══════════════════════════════════════════════════════════
🏢 اطلاعات شرکت (lib/company-info.js)
═══════════════════════════════════════════════════════════

نام: PETRO SAZEH MIHAN CO. / شرکت پتروسازه میهن
شعار: آمده‌ایم ملی بسازیم تا بمانیم
نوع: دانش‌بنیان تولیدی نوع یک

آدرس دفتر و کارخانه:
اراک، شهرک صنعتی حاجی‌آباد، خیابان صنعت
کدپستی: 3819958199

تلفن دفتر: +98 86 3413 1533
تلفن ۲: +98 86 3413 1918
موبایل: +98 912 861 6063 | +98 918 893 9209
فکس: +98 86 3413 1533 115

ایمیل: Info@psmvalve.com | psmvalve@gmail.com
ایمیل IT: it@psmvalve.com

شبکه‌های اجتماعی:
- Instagram: @petrosazemihan
- WhatsApp: wa.me/989188939209
- Aparat: @petrosazehmihan
- بله/روبیکا/ایتا: Psm_commercial@

ساعات کاری: شنبه تا پنجشنبه ۷:۰۰ – ۱۵:۰۰ | جمعه تعطیل

═══════════════════════════════════════════════════════════
📐 قواعد کدنویسی
═══════════════════════════════════════════════════════════

1. همیشه "use client" برای کامپوننت‌های interactive
2. آبجکت L برای ترجمه در هر کامپوننت
3. dir={isFa ? "rtl" : "ltr"} برای پشتیبانی RTL
4. مودال‌ها با createPortal (نه داخل والد)
5. کامپوننت‌های سنگین با dynamic(() => import(...), { ssr: false })
6. اعداد با fontFamily: "monospace" و direction: "ltr"
7. کلاس‌های آماده: card-glass, btn-gold, btn-secondary, btn-outline
8. آیکون‌ها: SVG inline (بدون dependency)
9. state ها با useState
10. side effects با useEffect
11. useMemo برای محاسبات سنگین
12. Accessibility: aria-label, title

═══════════════════════════════════════════════════════════
🚦 رفتار تو به عنوان AI
═══════════════════════════════════════════════════════════

✅ انجام بده:
- فایل کامل بده، نه قطعه‌کد
- مسیر دقیق فایل را بنویس
- فارسی توضیح بده، کد انگلیسی
- یک کار در هر پیام
- قبل از کد، سؤال بپرس اگر چیزی واضح نیست
- ۴ زبان در نظر بگیر
- RTL/LTR پشتیبانی کن
- Responsive باش (mobile/tablet/desktop)
- کد تمیز و خوانا بنویس

❌ نکن:
- تغییرات جزئی نده — همیشه فایل کامل
- dependency جدید بدون هماهنگی اضافه نکن
- فایل config را دست نزن بدون هشدار
- در API routes منطق تکراری نگذار
- data/*.json را بدون backup جایگزین نکن
- کامنت‌های فارسی موجود را پاک نکن

═══════════════════════════════════════════════════════════
🎯 نقشه راه باقی‌مانده
═══════════════════════════════════════════════════════════

فوری:
- [ ] صفحات ناقص: Why Us، Process، Projects، Articles

کوتاه‌مدت:
- [ ] اتصال Analytics (شناسه GA4 واقعی)
- [ ] اتصال فرم Contact به ایمیل
- [ ] پر کردن data/*.json با محتوای واقعی
- [ ] ساخت تصاویر OG (public/og/)
- [ ] ذخیره لوگو در public/logo/

میان‌مدت:
- [ ] Datasheet PDF محصولات
- [ ] جستجوی سراسری
- [ ] اتصال به محصولات واقعی PSM

بلندمدت:
- [ ] Migrate از JSON به دیتابیس
- [ ] Deploy روی سرور
- [ ] Domain + SSL

═══════════════════════════════════════════════════════════
📊 وضعیت Build
═══════════════════════════════════════════════════════════

آخرین build موفق:
- ✓ Compiled successfully
- ✓ 345 صفحه ساخته شده
- ✓ بدون warning

Bundle sizes:
- Home: 13.6 kB
- Sizing: 58.2 kB
- Product detail: 1.66 kB
- Admin: 2-4 kB per page

═══════════════════════════════════════════════════════════
🚀 شروع
═══════════════════════════════════════════════════════════

الان می‌خواهم روی [نام صفحه/ویژگی] کار کنیم.
لطفاً فایل‌های مربوطه را از من بخواه، تحلیل کن، و فایل کامل بده.