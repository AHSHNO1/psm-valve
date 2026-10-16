"use client";

// ============================================================
// NOT FOUND (404) — نمای مشترک صفحات عمومی
// زبان کاربر از مسیر استخراج میشود تا پیامها بومی باشند.
// نکته: این کامپوننت «کلاینت» است چون usePathname نیاز دارد؛
// فایل app/[locale]/not-found.js فقط یک پوستهٔ سرور است و همین
// کامپوننت را رندر میکند (not-found.js نمیتواند use client باشد).
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Calculator, Phone } from "lucide-react";

const LABELS = {
  fa: {
    code: "۴۰۴ — صفحه یافت نشد",
    title: "این صفحه در سایت وجود ندارد",
    desc: "ممکن است آدرس تغییر کرده یا حذف شده باشد. از لینکهای زیر برای ادامه استفاده کنید.",
    home: "صفحه اصلی",
    products: "محصولات",
    sizing: "نرمافزار سایزینگ",
    contact: "تماس با ما"
  },
  en: {
    code: "404 — Page not found",
    title: "This page does not exist",
    desc: "The address may have changed or been removed. Use the links below to continue.",
    home: "Home",
    products: "Products",
    sizing: "Sizing tool",
    contact: "Contact us"
  },
  ar: {
    code: "٤٠٤ — الصفحة غير موجودة",
    title: "هذه الصفحة غير موجودة",
    desc: "ربما تغيّر العنوان أو تم حذفه. استخدم الروابط التالية للمتابعة.",
    home: "الصفحة الرئيسية",
    products: "المنتجات",
    sizing: "أداة تحديد المقاس",
    contact: "اتصل بنا"
  },
  ru: {
    code: "404 — Страница не найдена",
    title: "Такой страницы не существует",
    desc: "Возможно, адрес изменился или был удалён. Воспользуйтесь ссылками ниже.",
    home: "Главная",
    products: "Продукция",
    sizing: "Подбор размера",
    contact: "Связаться с нами"
  }
};

export default function NotFoundView() {
  const pathname = usePathname() || "";
  const seg = pathname.split("/").filter(Boolean)[0];
  const locale = LABELS[seg] ? seg : "fa";
  const L = LABELS[locale];

  const links = [
    { href: "/" + locale, label: L.home, icon: Home },
    { href: "/" + locale + "/products", label: L.products, icon: Package },
    { href: "/" + locale + "/sizing", label: L.sizing, icon: Calculator },
    { href: "/" + locale + "/contact", label: L.contact, icon: Phone }
  ];

  return (
    <section className="container-x py-16 sm:py-24" dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
      <div className="card-glass p-8 sm:p-12 text-center" style={{ maxWidth: 680, margin: "0 auto" }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 8,
            background: "linear-gradient(135deg, #E0A81A, #B8850A)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent"
          }}
        >
          404
        </div>

        <span className="chip" style={{ marginBottom: 12 }}>{L.code}</span>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "12px 0 10px", lineHeight: 1.5 }}>
          {L.title}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-soft)", marginBottom: 28 }}>
          {L.desc}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12
          }}
        >
          {links.map(function (item) {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="btn-outline"
                style={{ textDecoration: "none" }}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}