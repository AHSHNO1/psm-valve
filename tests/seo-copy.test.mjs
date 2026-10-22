import test from "node:test";
import assert from "node:assert/strict";

const { SEO_COPY, pageSeo } = await import("../lib/seo-copy.js");
const { localizedDateIso } = await import("../lib/jalali.js");

const LOCALES = ["fa", "en", "ar", "ru"];

test("every page has complete SEO copy in all four locales", () => {
  for (const [key, entry] of Object.entries(SEO_COPY)) {
    for (const locale of LOCALES) {
      const copy = entry[locale];
      assert.ok(copy, `${key} is missing ${locale}`);
      assert.ok(copy.title.trim().length > 10, `${key}/${locale} title is too short`);
      assert.ok(copy.description.trim().length >= 80, `${key}/${locale} description is too short`);
      assert.ok(Array.isArray(copy.keywords) && copy.keywords.length > 0, `${key}/${locale} has no keywords`);
    }
  }
});

test("pageSeo falls back to English for unknown locale or page", () => {
  assert.equal(pageSeo("fr", "products").title, SEO_COPY.products.en.title);
  assert.equal(pageSeo("fa", "unknown").title, "");
});

test("localizedDateIso accepts Jalali, localized and ISO dates", () => {
  assert.equal(localizedDateIso("۱۴۰۵/۰۳/۲۶"), "2026-06-16");
  assert.equal(localizedDateIso("1404/05/15"), "2025-08-06");
  assert.equal(localizedDateIso("2026-06-16"), "2026-06-16");
  assert.equal(localizedDateIso({ fa: "۱۴۰۵/۰۳/۲۶", en: "Jun 16, 2026" }), "2026-06-16");
  assert.equal(localizedDateIso({ en: "Jun 16, 2026" }), "2026-06-16");
  assert.equal(localizedDateIso(""), "");
  assert.equal(localizedDateIso("not a date"), "");
});
