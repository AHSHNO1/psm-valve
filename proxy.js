import { NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";
import { locales, defaultLocale } from "./lib/i18n";

// ============================================================
// PROXY (نام جدید middleware در Next 16) — PSM Valve
// مسئولیتها:
//   ۱) هدایت ریشهٔ دامنه (/) به نسخهٔ زباندار مناسب
//   ۲) هدایت آدرسهای بدون زبان (/products) به نسخهٔ زباندار
//   ۳) ذخیرهٔ زبان انتخابشده در کوکی NEXT_LOCALE
//   ۴) محافظت از پنل ادمین بر اساس نقش (admin / author)
// ============================================================

const LOCALE_COOKIE = "NEXT_LOCALE";
const ADMIN_COOKIE = "admin_token";
const LOGIN_PATH = "/admin/login";
const AUTHOR_HOME = "/admin/author";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax"
};

/** اولین زبان معتبر را از هدر Accept-Language مرورگر انتخاب میکند */
function pickLocaleFromHeader(acceptLanguage) {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(",")
    .map(function (part) {
      const bits = part.trim().split(";q=");
      const q = bits[1] ? parseFloat(bits[1]) : 1;
      return { tag: (bits[0] || "").trim().toLowerCase(), q: isNaN(q) ? 0 : q };
    })
    .filter(function (item) { return item.tag; })
    .sort(function (a, b) { return b.q - a.q; });

  for (const item of ranked) {
    const base = item.tag.split("-")[0];
    if (locales.includes(base)) return base;
  }
  return null;
}

/** زبان مقصد: کوکی → هدر مرورگر → زبان پیشفرض */
function resolveLocale(request) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;
  return pickLocaleFromHeader(request.headers.get("accept-language")) || defaultLocale;
}

/** پیشوند زبان مسیر را برمیگرداند، اگر معتبر نباشد null */
function getPathLocale(pathname) {
  const segment = pathname.split("/")[1] || "";
  return locales.includes(segment) ? segment : null;
}

/** ساخت پاسخ با ثبت زبان جاری در کوکی */
function withLocaleCookie(response, locale) {
  response.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
  return response;
}

/**
 * مبدأ عمومی درخواست را از هدرهای پروکسی می‌سازد.
 * Next پشت reverse proxy ممکن است request.url را localhost بسازد؛ هدایت مطلق به
 * localhost کاربر را بیرون می‌اندازد. Nginx این هدرها را ست می‌کند.
 */
function publicOrigin(request) {
  const headers = request.headers;
  const host = (headers.get("x-forwarded-host") || headers.get("host") || "")
    .split(",")[0]
    .trim();
  const proto = (headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (!host || /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return null;
  if (!/^(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(:\d+)?$/i.test(host)) return null;
  const scheme =
    proto === "https" || proto === "http"
      ? proto
      : request.nextUrl.protocol.replace(":", "") || "http";
  return `${scheme}://${host}`;
}

function redirectTo(request, pathname) {
  return NextResponse.redirect(new URL(pathname, publicOrigin(request) || request.url));
}

/** پاسخ عبور، همراه با ثبت مسیر جاری برای بررسی دوباره در لایهٔ سرور */
function passWithPath(request, pathname) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-psm-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/** نگهبانی پنل ادمین: توکن را بررسی و بر اساس نقش هدایت میکند */
async function guardAdminArea(request, pathname) {
  if (pathname === LOGIN_PATH) return passWithPath(request, pathname);

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || new TextEncoder().encode(secret).length < 32) {
    return redirectTo(request, LOGIN_PATH);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const isAuthorArea =
      pathname === AUTHOR_HOME || pathname.startsWith(AUTHOR_HOME + "/");

    if (payload.role === "admin") return passWithPath(request, pathname);
    if (payload.role === "author") {
      return isAuthorArea
        ? passWithPath(request, pathname)
        : redirectTo(request, AUTHOR_HOME);
    }
    return redirectTo(request, LOGIN_PATH);
  } catch {
    return redirectTo(request, LOGIN_PATH);
  }
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // ── ۱) پنل ادمین (بدون پیشوند زبان) ──
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdminArea(request, pathname);
  }

  // ── ۲) ریشهٔ دامنه: به نسخهٔ زباندار هدایت کن تا 404 رخ ندهد ──
  if (pathname === "/") {
    const target = resolveLocale(request);
    return withLocaleCookie(redirectTo(request, "/" + target), target);
  }

  const pathLocale = getPathLocale(pathname);

  // ── ۳) مسیر دارای زبان معتبر: فقط کوکی زبان را تازه کن ──
  if (pathLocale) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== pathLocale) {
      withLocaleCookie(response, pathLocale);
    }
    return response;
  }

  // ── ۴) مسیر بدون زبان (مثل /products): زبان را اضافه کن ──
  const target = resolveLocale(request);
  return withLocaleCookie(
    redirectTo(request, "/" + target + pathname + request.nextUrl.search),
    target
  );
}

export const config = {
  // همهٔ مسیرها بهجز فایلهای داخلی Next، API و فایلهای استاتیک بررسی میشوند
  // تا آدرسهای بدون زبان (/products) و پنل ادمین هم مدیریت شوند.
  matcher: [
    "/((?!_next/static|_next/image|_next/hmr|api|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)"
  ]
};
