import { NextResponse } from "next/server.js";
import { revalidatePath } from "next/cache.js";
import { getSession } from "./auth.js";
import { locales } from "./i18n.js";

// ============================================================
// API HELPERS — ابزار مشترک مسیرهای API
// هدف: حذف کپی‌شدهٔ «getSession → 401» و یکدست‌سازی بدنهٔ پاسخ‌ها.
// همهٔ پاسخ‌های خطا شکل ثابت { ok:false, error } دارند.
// ============================================================

/** پاسخ موفق: { ok:true, ...data } */
export function json(data = {}, init) {
  return NextResponse.json({ ok: true, ...data }, init);
}

/** پاسخ خطا: { ok:false, error } + فیلدهای اختیاری اضافه (مثل code) و init (هدرها) */
export function err(message, status = 400, extra = undefined, init = undefined) {
  return NextResponse.json({ ok: false, error: message, ...(extra || {}) }, { status, ...(init || {}) });
}

/** تشخیص پاسخ Next از دادهٔ پارس‌شده (برای گاردهای inline در routeها) */
export function isResponse(value) {
  return value instanceof Response;
}

/**
 * بدنهٔ JSON را ایمن می‌خواند. در صورت JSON نامعتبر، یک پاسخ 400 برمی‌گرداند
 * تا در route کافی باشد: const body = await readJson(request); if (isResponse(body)) return body;
 */
export async function readJson(request, message = "درخواست JSON معتبر نیست.") {
  try {
    return await request.json();
  } catch {
    return err(message, 400);
  }
}

/**
 * احراز هویت + بررسی نقش در یک خط.
 * در حالت موفق: شیء session را برمی‌گرداند.
 * در حالت شکست: یک پاسخ Next (401 بدون session، 403 نقش نادرست) برمی‌گرداند.
 * نمونهٔ مصرف: const session = await guard(request); if (isResponse(session)) return session;
 */
export async function guard(request, options = {}) {
  const { role } = options;
  const sessionOptions = role === "author" ? { allowAuthor: true } : {};
  const session = await getSession(request, sessionOptions);
  if (!session) return err("نیاز به احراز هویت است.", 401);
  if (role && session.role !== role) return err("سطح دسترسی کافی ندارید.", 403);
  return session;
}

/**
 * یکدست‌سازی revalidate برای مسیرهای زباندار عمومی.
 * paths: فهرست مسیرهای بدون پیشوند زبان (مثل "faq" یا "products/xyz").
 * layout: اگر true، کل زیردرخت هر زبان (هدر/فوتر و همهٔ صفحات) نامعتبر می‌شود.
 * sitemap: به‌طور پیش‌فرض /sitemap.xml را هم تازه می‌کند (بدون پیشوند، مثل news).
 */
export function revalidatePublic(paths = [], { layout = false, sitemap = true } = {}) {
  for (const locale of locales) {
    if (layout) revalidatePath(`/${locale}`, "layout");
    for (const raw of paths) {
      const path = String(raw).replace(/^\/+/, "").replace(/\/+$/, "");
      revalidatePath(path ? `/${locale}/${path}` : `/${locale}`);
    }
  }
  if (sitemap) revalidatePath("/sitemap.xml");
}
