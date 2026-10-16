"use client";

// ============================================================
// ERROR BOUNDARY — صفحات عمومی
// در صورت بروز خطا در یک صفحه، بهجای کرش کل سایت
// یک پیام دوستانه با دکمهٔ تلاش مجدد نشان داده میشود.
// ============================================================

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LABELS = {
  fa: {
    code: "خطای غیرمنتظره",
    title: "مشکلی در نمایش این صفحه پیش آمد",
    desc: "لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت با تیم فنی ما تماس بگیرید.",
    retry: "تلاش مجدد",
    home: "بازگشت به خانه",
    contact: "تماس با پشتیبانی"
  },
  en: {
    code: "Unexpected error",
    title: "Something went wrong while loading this page",
    desc: "Please try again. If the problem persists, contact our technical team.",
    retry: "Try again",
    home: "Back to home",
    contact: "Contact support"
  },
  ar: {
    code: "خطأ غير متوقع",
    title: "حدثت مشكلة أثناء عرض هذه الصفحة",
    desc: "يرجى المحاولة مرة أخرى. إذا استمرت المشكلة تواصل مع فريقنا الفني.",
    retry: "حاول مرة أخرى",
    home: "العودة إلى الرئيسية",
    contact: "اتصل بالدعم"
  },
  ru: {
    code: "Непредвиденная ошибка",
    title: "При загрузке страницы произошла ошибка",
    desc: "Пожалуйста, попробуйте снова. Если проблема сохраняется, свяжитесь с нами.",
    retry: "Повторить",
    home: "На главную",
    contact: "Связаться с поддержкой"
  }
};

function useStateFromPath() {
  const pathname = usePathname() || "";
  const seg = pathname.split("/").filter(Boolean)[0];
  return LABELS[seg] ? seg : "fa";
}

export default function LocaleError({ error, reset }) {
  const locale = useStateFromPath();
  const L = LABELS[locale] || LABELS.en;

  useEffect(function () {
    // ثبت خطا برای پایش (در تولید قابل اتصال به سرویس لاگ است)
    console.error("[PSM] Page error:", error);
  }, [error]);

  return (
    <section className="container-x py-16 sm:py-24">
      <div className="card-glass p-8 sm:p-12 text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            fontSize: 34,
            background: "linear-gradient(135deg, rgba(224, 168, 26, 0.18), rgba(184, 133, 10, 0.06))",
            border: "1px solid rgba(201, 149, 13, 0.3)"
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <span className="chip" style={{ marginBottom: 12 }}>{L.code}</span>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "12px 0 10px", lineHeight: 1.5 }}>
          {L.title}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-soft)", marginBottom: 26 }}>
          {L.desc}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={function () { reset(); }} className="btn-gold">
            {L.retry}
          </button>
          <Link href={"/" + locale} className="btn-outline">{L.home}</Link>
          <Link href={"/" + locale + "/contact"} className="btn-outline">{L.contact}</Link>
        </div>

        {error && error.digest && (
          <p style={{ marginTop: 24, fontSize: 11, color: "var(--text-muted)", direction: "ltr", fontFamily: "monospace" }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
    </section>
  );
}