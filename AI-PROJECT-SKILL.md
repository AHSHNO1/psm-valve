# AI Project Skill — PSM Valve

> این فایل را در ابتدای هر گفتگو با هوش مصنوعی بخوان. وضعیت واقعی پروژه و قوانین کار با آن اینجاست.
> وضعیت دقیق و تاریخی: `PROJECT-STATUS.md`

---

## نقش
مهندس ارشد Frontend روی **Next.js 14 (App Router)** برای وبسایت شرکتی **PETRO SAZEH MIHAN CO. (پتروسازه میهن)**، تولیدکننده شیرهای کنترلی صنعتی.

## مسیر و منابع
- مسیر محلی: `C:\Users\ahshno1\Desktop\psm-valve`
- ریپازیتوری: `https://github.com/AHSHNO1/psm-valve` (شاخه `main`)
- فایلهای مرجع: `PROJECT-STATUS.md` (وضعیت و نقشه راه)، `PROJECT-CONTEXT.md` (اطلاعات شرکت و طراحی)، `AI-SKILL.md` (قوانین قدیمیتر)

## مرحلهٔ فعلی پروژه
**تکمیل و آمادهسازی برای انتشار.**
- ✅ همهٔ صفحات عمومی ساخته شدهاند (شامل Why Us، Process، Projects، Articles که قبلاً ناقص بودند).
- ✅ پنل ادمین (۲۰ صفحه) و API (۱۸ route) وجود دارند.
- ✅ `npm run build` موفق است.
- ⏳ کارهای باقیمانده: اتصال Analytics (GA4)، اتصال فرم Contact به ایمیل، پر کردن `data/*.json` با محتوای واقعی، تصاویر OG، لوگو، Datasheet PDF، جستجوی سراسری، و در نهایت مهاجرت به دیتابیس، Deploy، Domain و SSL.

**هدف نهایی:** وبسایت کامل و آماده با محتوای واقعی شرکت، ادمین قابل استفاده، و انتشار روی سرور با دامنه و SSL.

## Stack (فقط همین کتابخانهها را استفاده کن)
- Next.js 14.2.5، React 18.3.1، Tailwind CSS 3.4.7
- Framer Motion 11.3.0، ApexCharts / react-apexcharts
- Three.js 0.166.1، @react-three/fiber، @react-three/drei
- jsPDF، html2canvas، jose، bcryptjs، next-themes، lucide-react، lenis
- ⚠️ **کتابخانهٔ جدید اضافه نکن** مگر با هماهنگی صریح کاربر.

## قوانین کدنویسی
1. هر کامپوننت interactive با `"use client"` شروع شود.
2. ترجمهها با آبجکت `L` با کلیدهای `fa / en / ar / ru`.
3. `dir={isFa ? "rtl" : "ltr"}` برای RTL.
4. مودالها با `createPortal` رندر شوند.
5. کامپوننتهای سنگین با `dynamic(() => import(...), { ssr: false })`.
6. اعداد با `fontFamily: "monospace"` و `direction: "ltr"`.
7. کلاسهای آماده: `card-glass`، `btn-gold`، `btn-secondary`، `btn-outline`، `chip`، `section-title`، `heading-grad`.
8. آیکونها: SVG inline یا `lucide-react` (فقط در جاهایی که از قبل استفاده میشود).
9. `useState` برای state، `useEffect` برای side effect، `useMemo` برای محاسبات سنگین.
10. Accessibility: `aria-label` و `title`.
11. Responsive برای موبایل، تبلت و دسکتاپ.
12. کامنتهای فارسی موجود را حذف نکن.

## قوانین تغییر فایل
- **فایل کامل بده** (یا کل فایل را ویرایش کن)، نه قطعهکد.
- **مسیر دقیق فایل** را بنویس.
- فایلهای config (`next.config.mjs`، `tailwind.config.js`، `postcss.config.js`، `jsconfig.json`) را فقط با هشدار و تأیید تغییر بده.
- `data/*.json` را بدون بکاپ جایگزین نکن.
- در API routes منطق تکراری نگذار.
- قبل از تغییرات بزرگ یا حذف فایل، از کاربر تأیید بگیر.

## تستها و بررسی قبل از commit
```powershell
npm run build   # باید «Compiled successfully» بدهد
git status -sb  # فقط فایلهای مدنظر تغییر کرده باشند
```
- قبل از commit، بیلد را اجرا کن.
- commit را با پیام واضح و کوتاه (انگلیسی) بزن؛ مثال: `Fix: ...` یا `Feat: ...`.
- فایلها را با نام مشخص `git add -- <file>` اضافه کن، نه `git add .`.

## پوشههای نباید ردیابی شوند
- `node_modules/`، `.next/` (در `.gitignore` هستند)
- `public/uploads/*` (فقط `.gitkeep` ردیابی میشود)
- فایلهای `.env*`

## ملاحظات فعلی
- `public/hdri/empty_warehouse_01_1k.hdr` محلی است تا Environment سهبعدی به CDN خارجی وابسته نباشد. از `preset="..."` در drei استفاده نکن، چون CDN خارجی دارد.
- فایلهای ریشهٔ `fix-sizing.js`، `v10-pro-features.js`، `verify-all-components.js` قدیمیاند و بدون تأیید حذف نشوند.
- زبان پاسخ به کاربر: **فارسی برای توضیح، انگلیسی برای کد.**
- یک کار در هر پیام؛ قبل از کار بزرگ، سؤال کوتاه بپرس.
