// ============================================================
// VALVE CATALOG — اتصال سایزینگ به محصولات واقعی PSM
// نام، سری و بازهٔ سایز از کاتالوگ واقعی خوانده می‌شود؛ Cv کاتالوگی
// هر سری هنوز در دیتابیس ثبت نشده و در جای خود علامت‌گذاری می‌شود.
// ============================================================

/** ترتیب اولویت خانواده‌ها برای پیشنهاد شیر کنترلی */
const CATEGORY_RANK = {
  "control-valves": 0,
  "rotary-globe-valves": 1,
  "high-temp-valves": 2,
  "piston-valves": 3,
  "ball-valves": 4,
  "butterfly-valves": 5
};

function toInch(token) {
  const t = String(token)
    .replace(/inch(es)?/gi, "")
    .replace(/["″]/g, "")
    .replace(/[()]/g, "")
    .trim();

  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = t.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const decimal = t.match(/^(\d+(?:\.\d+)?)$/);
  if (decimal) return Number(decimal[1]);

  return null;
}

/**
 * بازهٔ سایز را از متن کاتالوگ می‌خواند.
 * نمونه‌ها: "2 – 24 inch" · "1/2 – 1 1/2 inch" · "1 to 16 inch" · "1/4 inch (port)"
 */
export function parseSizeRange(spec) {
  const text = (spec && (spec.en || spec.fa)) || "";
  if (!text) return null;

  const cleaned = text
    .replace(/inch(es)?/gi, "")
    .replace(/["″]/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();

  const parts = cleaned
    .split(/\s*(?:–|—|-|\bto\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  const first = toInch(parts[0]);
  const last = toInch(parts[parts.length - 1]);
  if (first == null && last == null) return null;

  const min = first == null ? last : first;
  const max = last == null ? first : last;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

/** ساخت کاتالوگ سبک برای کلاینت (بدون متن‌های سنگین) */
export function buildSizingCatalog(products) {
  return (products || [])
    .map((product) => ({
      slug: product.slug,
      series: product.series,
      name: product.name,
      categoryId: product.categoryId,
      sizeRange: parseSizeRange(product.spec && product.spec.size)
    }))
    .filter((product) => product.sizeRange);
}

function rankOf(product) {
  const rank = CATEGORY_RANK[product.categoryId];
  return rank == null ? 90 : rank;
}

/**
 * محصولات واقعی که سایز محاسبه‌شده را پوشش می‌دهند.
 * @param {Array} catalog خروجی buildSizingCatalog
 * @param {number} sizeIn سایز شیر بر حسب اینچ
 */
export function suggestValves(catalog, sizeIn, options = {}) {
  const limit = options.limit || 3;
  if (!Array.isArray(catalog) || !Number.isFinite(sizeIn)) return [];

  return catalog
    .filter((product) => {
      const range = product.sizeRange;
      return range && sizeIn >= range.min - 0.01 && sizeIn <= range.max + 0.01;
    })
    .sort((a, b) => rankOf(a) - rankOf(b) || String(a.series).localeCompare(String(b.series)))
    .slice(0, limit);
}

/**
 * انتخاب شیر از جدول Cv کاتالوگ.
 * ابتدا خانواده‌های کنترلی (rank ≤ 2) بررسی می‌شوند؛ در هر خانواده
 * نزدیک‌ترین Cv بزرگ‌تر یا مساوی Cv موردنیاز انتخاب می‌شود.
 *
 * @param {number} cvRequired Cv محاسبه‌شده (با احتساب Fp)
 * @param {Array} catalog خروجی buildSizingCatalog
 * @param {object} tables خروجی getCvTables().series
 */
export function selectCatalogValve(cvRequired, catalog, tables, options = {}) {
  if (!Number.isFinite(cvRequired) || cvRequired <= 0) return null;
  if (!Array.isArray(catalog) || !tables) return null;

  // حاشیهٔ طراحی: شیر در حداکثر دبی نباید نزدیک ۱۰۰٪ باز باشد.
  // پیش‌فرض: حداکثر بازشدگی ۸۰٪ ⇒ Cv موردنیاز تقسیم بر ۰.۸ می‌شود.
  const maxOpening = Number(options.maxOpening) > 0 && Number(options.maxOpening) <= 1
    ? Number(options.maxOpening)
    : 0.8;
  const target = cvRequired / maxOpening;

  function collect(threshold) {
    const list = [];
    for (const product of catalog) {
      const table = tables[product.series];
      const sizes = table && Array.isArray(table.sizes) ? table.sizes : null;
      if (!sizes) continue;

      for (const row of sizes) {
        const cv = Number(row && row.cv);
        if (Number.isFinite(cv) && cv >= threshold) {
          list.push({ product, row, cv });
        }
      }
    }
    return list;
  }

  let candidates = collect(target);
  if (candidates.length === 0) candidates = collect(cvRequired);
  if (candidates.length === 0) return null;

  const preferred = candidates.filter((item) => rankOf(item.product) <= 2);
  const pool = preferred.length > 0 ? preferred : candidates;

  pool.sort(
    (a, b) =>
      a.cv - b.cv ||
      rankOf(a.product) - rankOf(b.product) ||
      String(a.product.series).localeCompare(String(b.product.series))
  );

  const best = pool[0];
  return {
    product: best.product,
    dn: best.row.dn,
    cv: best.cv,
    openingPercent: Math.min(100, Math.round((cvRequired / best.cv) * 100)),
    source: "catalog"
  };
}

/** شمارش سری‌هایی که جدول Cv دارند (برای نشان دادن وضعیت داده) */
export function countCvSeries(tables) {
  if (!tables) return 0;
  return Object.keys(tables).filter((key) => Array.isArray(tables[key]?.sizes) && tables[key].sizes.length > 0).length;
}
