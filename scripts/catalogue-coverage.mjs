#!/usr/bin/env node
/**
 * catalogue-coverage.mjs — پوشش جدول Cv کاتالوگ و بازبینی پیشنهادهای سایزینگ.
 *
 *   node scripts/catalogue-coverage.mjs            # خلاصهٔ پوشش + چند نقطهٔ نمونه
 *   node scripts/catalogue-coverage.mjs 300 1200    # افزودن Cvهای دلخواه
 *
 * برای هر Cv، همان مسیری اجرا می‌شود که صفحهٔ سایزینگ استفاده می‌کند:
 *   getProducts → buildSizingCatalog → selectCatalogValve(cv, catalog, tables)
 */
import { getProducts } from "../lib/product-store.js";
import { getSizingTablesForClient, getCvCatalogSummary } from "../lib/valve-cv.js";
import { buildSizingCatalog, selectCatalogValve, countCvSeries } from "../lib/valve-catalog.js";

const SWEEP = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 9000];
const extra = process.argv.slice(2).map(Number).filter((value) => Number.isFinite(value) && value > 0);
const points = [...new Set([...SWEEP, ...extra])].sort((a, b) => a - b);

const products = getProducts();
const tables = getSizingTablesForClient().series;
const catalog = buildSizingCatalog(products, tables);
const summary = getCvCatalogSummary();
// پوشش واقعی و پوشورد برآوردی دو چیزند؛ گزارش نباید آنها را یکی نشان دهد
const provenanceOf = (seriesId) => tables[String(seriesId)]?.provenance || "none";
const measuredCount = Object.values(tables).filter((entry) => entry.provenance === "measured").length;
const estimatedCount = Object.values(tables).filter((entry) => entry.provenance === "estimated").length;

console.log("PSM Valve — پوشش جدول Cv کاتالوگ\n" + "=".repeat(80));
console.log(`محصولات: ${products.length} · سری‌های دارای بازهٔ سایز: ${catalog.length} · سری‌های دارای جدول Cv: ${countCvSeries(tables)} (${measuredCount} اندازه‌گیری‌شده + ${estimatedCount} برآورد)`);
if (summary.stats) {
  console.log(`کاتالوگ: ${summary.stats.series} سری · ${summary.stats.sizes} سایز · ${summary.stats.trims} ترم · اصلاح‌شده: ${summary.repairedValues}`);
}
console.log("\nپوشش به تفکیک سری محصول:");
console.log("سری".padEnd(22) + "بازهٔ سایز".padEnd(14) + "جدول Cv");
console.log("-".repeat(80));
for (const product of catalog) {
  const sizes = tables[product.series]?.sizes?.length || 0;
  const range = product.sizeRange ? `${product.sizeRange.min}–${product.sizeRange.max} inch` : "—";
  const kind = provenanceOf(product.series);
  const origin = sizes > 0 ? (kind === "estimated" ? " · برآورد" : kind === "mixed" ? " · مخلوط" : "") : "";
  const label = sizes > 0 ? `✅ ${sizes} سایز${origin}` : "— (جدول عمومی)";
  console.log(`${String(product.series).slice(0, 20).padEnd(22)}${range.padEnd(14)}${label}`);
}

console.log("\nپیشنهاد سایزینگ برای نقطه‌های نمونه:");
console.log("Cv نیاز".padStart(9) + "  " + "سری".padEnd(8) + "DN".padEnd(12) + "ترم Cv".padStart(9) + "  " + "مشخصه".padEnd(10) + "بازشدگی");
console.log("-".repeat(80));
let misses = 0;
for (const cv of points) {
  const pick = selectCatalogValve(cv, catalog, tables);
  if (!pick) {
    misses += 1;
    console.log(String(cv).padStart(9) + "  (هیچ شیر کاتالوگی پوشش نمی‌دهد)");
    continue;
  }
  const nps = pick.nps ? ` (${pick.nps}")` : "";
  console.log(
    String(cv).padStart(9) + "  " +
    String(pick.product.series).padEnd(8) +
    (pick.dn + nps).padEnd(12) +
    String(pick.cv).padStart(9) + "  " +
    String(pick.characteristic || "—").padEnd(10) +
    `${pick.openingPercent}%${pick.withinMargin ? "" : "  ⚠ بالای ۸۰٪"}${pick.curveBased ? "" : "  (فرض خطی)"}${pick.source === "estimated" ? `  [برآورد ±${pick.errorPct}%]` : ""}`
  );
}
console.log(`\n${points.length - misses} از ${points.length} نقطه پوشش داده شد.`);