// ============================================================
// SEO HELPERS — PSM Valve
// ساخت متادیتای یکسان برای همهٔ صفحات + hreflang چهار زبانه
// ============================================================

import { locales, defaultLocale } from "./i18n";
import { COMPANY } from "./company-info";

export const SITE_BASE = "https://psmvalve.com";

/**
 * آدرس کامل یک مسیر برای یک زبان مشخص.
 * @param {string} locale
 * @param {string} path مثل "/about" یا "/products/46000"
 */
export function localeUrl(locale, path = "") {
  const clean = path && path !== "/" ? (path.startsWith("/") ? path : "/" + path) : "";
  return SITE_BASE + "/" + locale + clean;
}

/**
 * نقشهٔ alternates.hreflang برای همهٔ زبانها + x-default
 */
export function languageAlternates(path = "") {
  const map = {};
  locales.forEach(function (l) {
    map[l] = localeUrl(l, path);
  });
  map["x-default"] = localeUrl(defaultLocale, path);
  return map;
}

/**
 * ساخت آبجکت metadata استاندارد صفحه.
 *
 * @param {object} options
 * @param {string} options.locale        زبان جاری
 * @param {string} [options.path]        مسیر بدون زبان، مثال "/about"
 * @param {string} [options.title]       عنوان صفحه
 * @param {string} [options.description] توضیحات صفحه
 * @param {string} [options.type]        نوع OpenGraph (پیشفرض website)
 * @param {string[]} [options.keywords]  کلمات کلیدی
 * @param {boolean} [options.noIndex]    اگر true، از ایندکس خارج شود
 */
export function buildMetadata(options) {
  const locale = options.locale || defaultLocale;
  const path = options.path || "";
  const title = options.title;
  const description = options.description || "";
  const type = options.type || "website";
  const url = localeUrl(locale, path);

  const meta = {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path)
    },
    openGraph: {
      type,
      locale,
      siteName: COMPANY.brandEn,
      title,
      description,
      url
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };

  if (options.keywords && options.keywords.length) {
    meta.keywords = options.keywords;
  }

  if (options.noIndex) {
    meta.robots = { index: false, follow: false };
  }

  return meta;
}