// ============================================================
// SEO HELPERS — PSM Valve
// ساخت متادیتای یکسان برای همهٔ صفحات + hreflang چهار زبانه
// ============================================================

import { locales, defaultLocale } from "./i18n";
import { COMPANY } from "./company-info";

export const SITE_BASE = "https://www.psmvalve.com";
export const DEFAULT_OG_IMAGE = "/og/og-default.jpg";

const OG_LOCALE = {
  fa: "fa_IR",
  en: "en_US",
  ar: "ar_SA",
  ru: "ru_RU"
};

export function absoluteUrl(value) {
  if (!value) return SITE_BASE;
  if (/^https?:\/\//i.test(value)) return value;
  return SITE_BASE + (value.startsWith("/") ? value : "/" + value);
}

const toAbsoluteUrl = absoluteUrl;

function openGraphImage(url, alt) {
  const image = { url: toAbsoluteUrl(url), alt };
  if (!url || url === DEFAULT_OG_IMAGE) {
    image.width = 1200;
    image.height = 630;
  }
  return image;
}

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
 * @param {string} [options.image]       تصویر OpenGraph/Twitter (نسبی یا مطلق)
 * @param {string} [options.imageAlt]    متن جایگزین تصویر
 * @param {string} [options.publishedTime] برای نوع article
 * @param {string} [options.modifiedTime]  برای نوع article
 * @param {boolean} [options.titleAbsolute] عنوان بدون قالب «| نام شرکت»
 * @param {boolean} [options.noIndex]    اگر true، از ایندکس خارج شود
 */
export function buildMetadata(options) {
  const locale = options.locale || defaultLocale;
  const path = options.path || "";
  const title = options.title;
  const description = options.description || "";
  const type = options.type || "website";
  const url = localeUrl(locale, path);
  const image = options.image || DEFAULT_OG_IMAGE;
  const imageAlt = options.imageAlt || title || COMPANY.brandEn;

  const openGraph = {
    type,
    locale: OG_LOCALE[locale] || locale,
    siteName: COMPANY.brandEn,
    title,
    description,
    url,
    images: [openGraphImage(image, imageAlt)]
  };

  if (type === "article") {
    if (options.publishedTime) openGraph.publishedTime = options.publishedTime;
    if (options.modifiedTime) openGraph.modifiedTime = options.modifiedTime;
  }

  const meta = {
    title: options.titleAbsolute ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path)
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [toAbsoluteUrl(image)]
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

/** خروجی امن JSON-LD برای درج در dangerouslySetInnerHTML */
export function jsonLdScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * ساخت اسکیمای BreadcrumbList.
 * @param {{name: string, url: string}[]} items
 */
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(function (item, index) {
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url
      };
    })
  };
}