"use client";

// ============================================================
// SKIP LINK — لینک پرش به محتوای اصلی برای کاربران کیبورد
// تا زمانی که فوکوس نگیرد پنهان است (کلاس .skip-to-content)
// ============================================================

import { useDictionary } from "./Providers";

export default function SkipLink() {
  const { locale } = useDictionary();
  const label = {
    fa: "پرش به محتوای اصلی",
    en: "Skip to main content",
    ar: "تخطَّ إلى المحتوى الرئيسي",
    ru: "Перейти к основному содержанию"
  }[locale] || "Skip to main content";

  return (
    <a href="#main-content" className="skip-to-content">
      {label}
    </a>
  );
}