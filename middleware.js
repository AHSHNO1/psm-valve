import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { locales, defaultLocale } from "./lib/i18n";

// ============================================================
// MIDDLEWARE — PSM Valve
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

/** نگهبانی پنل ادمین: توکن را بررسی و بر اساس نقش هدایت میکند */
async function guardAdminArea(request, pathname) {
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || new TextEncoder().encode(secret).length < 32) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const isAuthorArea =
      pathname === AUTHOR_HOME || pathname.startsWith(AUTHOR_HOME + "/");

    if (payload.role === "admin") return NextResponse.next();
    if (payload.role === "author") {
      return isAuthorArea
        ? NextResponse.next()
        : NextResponse.redirect(new URL(AUTHOR_HOME, request.url));
    }
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  } catch {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // ── ۱) پنل ادمین (بدون پیشوند زبان) ──
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdminArea(request, pathname);
  }

  // ── ۲) ریشهٔ دامنه: به نسخهٔ زباندار هدایت کن تا 404 رخ ندهد ──
  if (pathname === "/") {
    const target = resolveLocale(request);
    return withLocaleCookie(
      NextResponse.redirect(new URL("/" + target, request.url)),
      target
    );
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
  const destination = new URL(
    "/" + target + pathname + request.nextUrl.search,
    request.url
  );
  return withLocaleCookie(NextResponse.redirect(destination), target);
}

export const config = {
  // همهٔ مسیرها بهجز فایلهای داخلی Next، API و فایلهای استاتیک بررسی میشوند
  // تا آدرسهای بدون زبان (/products) و پنل ادمین هم مدیریت شوند.
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)"
  ]
};
