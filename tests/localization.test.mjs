import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { products } from "../lib/products.js";
import { categories } from "../lib/categories.js";

const LOCALES = ["fa", "en", "ar", "ru"];
const PLACEHOLDER_PRODUCTS = new Set(["pressure-regulator-70000-f"]);

function missingLocales(value) {
  return LOCALES.filter((locale) => !value?.[locale]);
}

test("product seed copy is complete in all four locales", () => {
  const gaps = [];
  for (const product of products) {
    if (PLACEHOLDER_PRODUCTS.has(product.slug)) continue;
    for (const field of ["name", "short"]) {
      const missing = missingLocales(product[field]);
      if (missing.length) gaps.push(`${product.slug}.${field}: ${missing.join(", ")}`);
    }
  }
  assert.deepEqual(gaps, []);
});

test("category names and descriptions are complete in all four locales", () => {
  const gaps = [];
  for (const category of categories) {
    for (const field of ["name", "desc"]) {
      const missing = missingLocales(category[field]);
      if (missing.length) gaps.push(`${category.id}.${field}: ${missing.join(", ")}`);
    }
  }
  assert.deepEqual(gaps, []);
});

test("active certificates have title and issuer in all four locales", () => {
  const certificates = JSON.parse(fs.readFileSync("data/certificates.json", "utf8"));
  const gaps = [];
  for (const certificate of certificates) {
    if (certificate.active === false) continue;
    for (const field of ["title", "issuer"]) {
      const missing = missingLocales(certificate[field]);
      if (missing.length) gaps.push(`${certificate.id}.${field}: ${missing.join(", ")}`);
    }
  }
  assert.deepEqual(gaps, []);
});
