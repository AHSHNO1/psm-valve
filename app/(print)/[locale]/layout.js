import "../../globals.css";

export const dynamic = "force-dynamic";

/**
 * ریشهٔ مستقل صفحات چاپی (دیتاشیت): بدون نوار سایت، فوتر و تم تاریک.
 * دیتاشیت یک برگهٔ چاپی است و همیشه سفید/مشکی می‌ماند.
 */
export default function PrintLayout({ children, params }) {
  const locale = params?.locale || "fa";
  const dir = locale === "fa" || locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{ margin: 0, background: "#F5F6F8" }}>{children}</body>
    </html>
  );
}
