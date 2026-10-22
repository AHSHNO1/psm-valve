import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BULK_LIMIT,
  isLocalizedText,
  isValidSlug,
  isValidId,
  isFileUrl,
  validateFaqs,
  validateServices,
  validatePartners,
  validateTestimonials,
  validateSliders,
  validateCertificates,
  validateBulkList,
  whitelistKeys
} from "../lib/validators.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function readData(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", name), "utf8"));
}

test("isLocalizedText accepts a string or a locale object with content", () => {
  assert.equal(isLocalizedText("hi"), true);
  assert.equal(isLocalizedText({ fa: "سلام" }), true);
  assert.equal(isLocalizedText({ fa: "  ", en: "" }), false);
  assert.equal(isLocalizedText(""), false);
  assert.equal(isLocalizedText(null), false);
  assert.equal(isLocalizedText(["x"]), false);
});

test("slug / id / file checks", () => {
  assert.equal(isValidSlug("a-b-1"), true);
  assert.equal(isValidSlug("Bad Slug"), false);
  assert.equal(isValidId("faq-01"), true);
  assert.equal(isValidId("../etc/passwd"), false);
  assert.equal(isFileUrl("/uploads/images/a.png"), true);
  assert.equal(isFileUrl("https://x.test/a.png"), true);
  assert.equal(isFileUrl("/uploads/../../secret"), false);
  assert.equal(isFileUrl("//evil.test/a"), false);
});

test("validateBulkList rejects non-array and enforces the length cap", () => {
  assert.equal(validateBulkList("nope", { schema: {} }).ok, false);
  const huge = Array.from({ length: BULK_LIMIT + 1 }, (_, i) => ({ id: `i${i}` }));
  const res = validateBulkList(huge, { schema: { id: { required: true, check: isValidId } } });
  assert.equal(res.ok, false);
  assert.match(res.error, /حد مجاز/);
});

test("validateBulkList requires fields, validates them, and whitelists keys", () => {
  const res = validateBulkList(
    [{ name: "ok", extra: "drop me" }],
    { schema: { name: { required: true, check: isLocalizedText } } }
  );
  assert.equal(res.ok, true);
  assert.deepEqual(res.items[0], { name: "ok" });
  assert.equal(Object.prototype.hasOwnProperty.call(res.items[0], "extra"), false);

  const missing = validateBulkList([{}], { schema: { name: { required: true, check: isLocalizedText } } });
  assert.equal(missing.ok, false);
  assert.match(missing.error, /الزامی/);
});

test("whitelistKeys rejects unknown keys and lists them", () => {
  const res = whitelistKeys({ a: 1, b: 2, evil: 3 }, ["a", "b"]);
  assert.equal(res.ok, false);
  assert.deepEqual(res.unknown, ["evil"]);

  const ok = whitelistKeys({ a: 1 }, ["a", "b"]);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.data, { a: 1 });
});

test("every bulk validator accepts the current data files unchanged", () => {
  const cases = [
    ["faq.json", validateFaqs],
    ["services.json", validateServices],
    ["partners.json", validatePartners],
    ["testimonials.json", validateTestimonials],
    ["sliders.json", validateSliders],
    ["certificates.json", validateCertificates]
  ];
  for (const [file, fn] of cases) {
    const list = readData(file);
    const res = fn(list);
    assert.equal(res.ok, true, `${file} should validate: ${res.error}`);
    assert.equal(res.items.length, list.length);
  }
});

test("validateFaqs rejects a missing required question and a bad id", () => {
  assert.equal(validateFaqs([{ id: "x", answer: { fa: "a" } }]).ok, false);
  assert.equal(validateFaqs([{ id: "../bad", question: { fa: "q" }, answer: { fa: "a" } }]).ok, false);
});

test("validateSliders requires an image", () => {
  const missing = validateSliders([{ id: "s1", title: { fa: "t" } }]);
  assert.equal(missing.ok, false);
  const withImg = validateSliders([{ id: "s1", title: { fa: "t" }, image: "/uploads/images/a.jpg" }]);
  assert.equal(withImg.ok, true);
});
