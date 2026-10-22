#!/usr/bin/env node
/**
 * estimate-cv.mjs — برآورد Cv برای سری‌هایی که دادهٔ اندازه‌گیری‌شده ندارند.
 *
 *   node scripts/estimate-cv.mjs              # ساخت data/valve-cv-estimated.json
 *   node scripts/estimate-cv.mjs --dry-run    # فقط گزارش روی استاندارد خروج، بدون نوشتن فایل
 *
 * دادهٔ مرجع (data/valve-cv-catalog.json) هرگز تغییر نمی‌کند؛ خروجی در فایل
 * جدا و با provenance: "estimated" نوشته می‌شود. منطق محاسبه کامل در
 * lib/valve-cv-estimate.js (ماژول خالص، بدون fs/DB) است و این اسکریپت فقط
 * I/O و گزارشگری است.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProducts } from "../lib/product-store.js";
import { getCvCatalog } from "../lib/valve-cv.js";
import {
  buildEstimateDocument,
  buildCapacityLaw,
  backTest,
  DN_LADDER,
  MEASURED_SERIES,
  FIT_BASIS_SERIES,
  ACCURACY_CAVEAT
} from "../lib/valve-cv-estimate.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEASURED_FILE = path.join(ROOT, "data", "valve-cv-catalog.json");
const OUTPUT_FILE = path.join(ROOT, "data", "valve-cv-estimated.json");
const dryRun = process.argv.includes("--dry-run");

// ---- دادهٔ اندازه‌گیری‌شده (فقط‌خواندنی) --------------------------------
if (!fs.existsSync(MEASURED_FILE)) {
  console.error(`فایل دادهٔ مرجع پیدا نشد: ${MEASURED_FILE}`);
  process.exit(1);
}
const catalog = getCvCatalog();
if (Object.keys(catalog.series).length === 0) {
  console.error("دادهٔ مرجع کاتالوگ خالی است؛ بدون دادهٔ اندازه‌گیری‌شده برآوردی ساخته نمی‌شود.");
  process.exit(1);
}
console.log(`مبنای اندازه‌گیری‌شده: ${Object.keys(catalog.series).join("، ")} · ${catalog.stats?.trims ?? "?"} تریم`);

// ---- محصولات ----------------------------------------------------------
const products = getProducts();
console.log(`محصولات: ${products.length} · نردبان هدف: ${DN_LADDER[0].dn}…${DN_LADDER[DN_LADDER.length - 1].dn}`);

// ---- خودآزمون ---------------------------------------------------------
const law = buildCapacityLaw(catalog);
const report = backTest(catalog);
console.log("\nخودآزمون (leave-one-series-out):");
for (const [id, r] of Object.entries(report.perSeries)) {
  console.log(
    `  سری ${id.padEnd(7)} ${r.predictiveTest ? "پیش‌بینی‌شده" : "خارج از مبنای برازش"} ` +
      `میانگین ${String(r.all.meanAbsPct).padStart(6)}٪  میانه ${String(r.all.medianAbsPct).padStart(6)}٪  ` +
      `بیشینه ${String(r.all.maxAbsPct).padStart(6)}٪  (n=${r.all.samples})` +
      (r.note ? `  ← ${r.note}` : "")
  );
}
console.log(
  `  همهٔ سری‌های مبنای برازش: میانگین ${report.overall.meanAbsPct}٪ · بیشینه ${report.overall.maxAbsPct}٪ · ` +
    ` داخل بازهٔ سری مبنا ${report.overall.inEnvelope.meanAbsPct}٪ / ${report.overall.inEnvelope.maxAbsPct}٪ · ` +
    `اکستراپولاسیون ${report.overall.extrapolated.meanAbsPct}٪ / ${report.overall.extrapolated.maxAbsPct}٪`
);
console.log(
  `  باقی‌ماندهٔ درون‌نمونهٔ قانون ترکیبی: میانگین ${report.pooled.meanAbsPct}٪ · بیشینه ${report.pooled.maxAbsPct}٪ (n=${report.pooled.samples})`
);
console.log(
  `  قانون گلوب: Cv = ${law.globe.cv0} · (DN/25.4)^${law.globe.exponent}  (R²=${law.globe.r2}, n=${law.globe.samples})`
);
console.log(
  `  ضرایب خانواده: ${Object.entries(law.families)
    .map(([k, f]) => `${k}=${f.multiplier ?? "-"}±${f.bandPct ?? 0}%`)
    .join("  ")}`
);

// ---- سند برآورد -------------------------------------------------------
const document = buildEstimateDocument({ catalog, products, generatedAt: new Date().toISOString() });

console.log("\nبرآورد به تفکیک سری:");
for (const [id, entry] of Object.entries(document.series)) {
  const dns = entry.sizes.map((size) => size.dn);
  const band = entry.errorPct;
  console.log(
    `  ${id.padEnd(8)} ${String(entry.basis.family).padEnd(12)} ` +
      `${String(entry.sizes.length).padStart(2)} سایز (${dns[0]}…${dns[dns.length - 1]}) · ` +
      `Cv ${entry.sizes[0]?.cvMax}→${entry.sizes[entry.sizes.length - 1]?.cvMax} · ` +
      `${entry.confidence} ±${band}%`
  );
}

console.log("\nرد/توضیح:");
for (const item of document.refused) {
  console.log(`  ${String(item.series).padEnd(18)} ${item.status}`);
  (item.reasons || []).forEach((reason) => console.log(`      · ${reason}`));
}

console.log(`\nخلاصه: ${document.meta.stats.estimatedSeries} سری برآوردی · ` +
  `${document.meta.stats.sizes} سایز · ${document.meta.stats.trims} تریم · ` +
  `${document.meta.stats.refusedSeries} سری رد‌شده · ` +
  `${document.meta.stats.measuredSeriesSkipped} سری اندازه‌گیری‌شده (دست‌نخورده)`);
console.log(`\n${ACCURACY_CAVEAT.fa}`);

if (dryRun) {
  console.log("\n(--dry-run) فایلی نوشته نشد.");
  process.exit(0);
}

// ---- نوشتن اتمیک (فایل جدید؛ دادهٔ اندازه‌گیری‌شده دست نمی‌خورد) -------
const tmp = `${OUTPUT_FILE}.tmp`;
fs.writeFileSync(tmp, `${JSON.stringify(document, null, 2)}\n`, "utf8");
// خواندن مجدد برای اطمینان از JSON معتبر
const parsed = JSON.parse(fs.readFileSync(tmp, "utf8"));
if (!parsed.series || Object.keys(parsed.series).length !== document.meta.stats.estimatedSeries) {
  console.error("بازخوانی فایل خروجی ناموفق بود؛ فایل قبلی دست‌نخورده ماند.");
  fs.unlinkSync(tmp);
  process.exit(1);
}
fs.renameSync(tmp, OUTPUT_FILE);
console.log(`\nنوشته شد: ${path.relative(ROOT, OUTPUT_FILE)} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} kB)`);
console.log(`دادهٔ مرجع اندازه‌گیری‌شده تغییر نکرد: ${path.relative(ROOT, MEASURED_FILE)} ` +
  `(سری‌های ${MEASURED_SERIES.join("/")} → مبنای برازش ${FIT_BASIS_SERIES.join("/")})`);
