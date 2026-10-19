/**
 * نگهبان جهت‌دهی (bidi) فوتر — شماره‌ها و ایمیل‌ها در حالت فارسی نباید به‌هم بریزند.
 * علت: روی عناصر inline، صرفِ «direction: ltr» بدون ایزوله کردن (dir="ltr" یا
 * unicode-bidi) بی‌اثر است و «+» ابتدای شماره به سمت دیگرِ متن پرت می‌شود.
 * اجرا: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOOTER = "components/Footer.jsx";
const read = () => fs.readFileSync(path.join(ROOT, FOOTER), "utf8");

test("فوتر از direction درون‌خطی بی‌اثر استفاده نمی‌کند", () => {
  const src = read();
  assert.ok(
    !src.includes('style={{ direction: "ltr" }}'),
    "روی عناصر inline باید dir=\"ltr\" و کلاس fc-num به‌کار برود، نه style={{ direction: \"ltr\" }}"
  );
});

test("لینک‌های تلفن فوتر هم dir=ltr دارند و هم کلاس fc-num", () => {
  const src = read();
  const tags = src.match(/<a\b[^>]*>/gs) || [];
  const telLinks = tags.filter((tag) => tag.includes('"tel:"'));
  assert.ok(telLinks.length >= 2, `انتظار می‌رفت حداقل ۲ لینک تلفن در فوتر باشد (${telLinks.length})`);

  for (const tag of telLinks) {
    assert.match(tag, /\bdir="ltr"/, `لینک تلفن بدون جهت‌دهی LTR: ${tag.trim()}`);
    assert.match(tag, /fc-num/, `لینک تلفن بدون کلاس ایزوله‌کننده: ${tag.trim()}`);
  }
});

test("همهٔ لینک‌های تماس و ایمیل فوتر جهت LTR دارند", () => {
  const src = read();
  const tags = src.match(/<a\b[^>]*>/gs) || [];
  const contactLinks = tags.filter((tag) => tag.includes('"tel:"') || tag.includes('"mailto:"'));
  assert.ok(contactLinks.length >= 3, `انتظار می‌رفت حداقل ۳ لینک تماس/ایمیل باشد (${contactLinks.length})`);

  for (const tag of contactLinks) {
    assert.match(tag, /\bdir="ltr"/, `لینک تماس/ایمیل بدون جهت‌دهی LTR: ${tag.trim()}`);
  }
});

test("کلاس fc-num جداسازی دوجهته و شکست‌ناپذیری را تعریف می‌کند", () => {
  const block = read().match(/\.fc-num\s*\{([^}]*)\}/);
  assert.ok(block, "بلوک .fc-num در Footer.jsx پیدا نشد");

  const css = block[1];
  assert.match(css, /direction:\s*ltr/, "fc-num باید direction: ltr داشته باشد");
  assert.match(css, /unicode-bidi:\s*isolate/, "fc-num باید unicode-bidi: isolate داشته باشد");
  assert.match(css, /display:\s*inline-block/, "fc-num باید display: inline-block داشته باشد");
  assert.match(css, /white-space:\s*nowrap/, "fc-num باید white-space: nowrap داشته باشد");
});