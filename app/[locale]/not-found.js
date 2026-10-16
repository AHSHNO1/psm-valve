import NotFoundView from "@/components/NotFoundView";

// ============================================================
// NOT FOUND (404) — پوستهٔ سرور
// ⚠️ این فایل باید «سرور کامپوننت» بماند (بدون "use client")؛
// در Next.js 14 اگر not-found.js کلاینت باشد، Next آن را نادیده
// میگیرد و ۴۰۴ پیشفرض خودش را نشان میدهد.
// نمای بومیسازی شده در components/NotFoundView.jsx است.
// ============================================================

export default function LocaleNotFound() {
  return <NotFoundView />;
}