import { notFound } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false }
};

// ============================================================
// CATCH-ALL 404
// هر آدرسی که زیر یک زبان معتبر (fa/en/ar/ru) وجود نداشته باشد
// به این مسیر میرسد و بلافاصله notFound() صدا زده میشود تا
// صفحهٔ ۴۰۴ سفارشی (app/[locale]/not-found.js) با چیدمان کامل
// سایت (Navbar/Footer) نمایش داده شود.
// ============================================================

export default function CatchAllNotFound() {
  notFound();
}