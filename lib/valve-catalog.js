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

/**
 * بازهٔ سایز از NPS سایزهای جدول Cv — فقط برای سری‌هایی که متن سایز کاتالوگ
 * خوانا نیست (مثل سری‌های توپی با spec.size خالی). DN به اینچ تبدیل تقریبی می‌شود.
 */
function tableSizeRange(entry) {
  const sizes = entry && Array.isArray(entry.sizes) ? entry.sizes : null;
  if (!sizes || sizes.length === 0) return null;
  const values = sizes
    .map((size) => {
      if (Number.isFinite(size.nps)) return Number(size.nps);
      const dn = Number(String(size.dn || "").replace(/\D/g, ""));
      return dn > 0 ? dn / 25.4 : null;
    })
    .filter((n) => n != null && Number.isFinite(n) && n > 0);
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** ساخت کاتالوگ سبک برای کلاینت (بدون متن‌های سنگین) */
export function buildSizingCatalog(products, tables) {
  const series = tables && tables.series && typeof tables.series === "object" ? tables.series : tables;
  return (products || [])
    .map((product) => ({
      slug: product.slug,
      series: product.series,
      name: product.name,
      categoryId: product.categoryId,
      sizeRange:
        parseSizeRange(product.spec && product.spec.size) ||
        tableSizeRange(series && series[product.series])
    }))
    .filter((product) => product.sizeRange);
}

function rankOf(product) {
  const rank = CATEGORY_RANK[product.categoryId];
  return rank == null ? 90 : rank;
}

/** ترتیب ترجیح مشخصهٔ ذاتی: منحنی درصدی برای کنترل فرایند مناسب‌ترین است */
const CHARACTERISTIC_RANK = { equal: 0, modified: 1, linear: 2, quick: 3 };

function characteristicRank(characteristic) {
  const rank = CHARACTERISTIC_RANK[characteristic];
  return rank == null ? 4 : rank;
}

function dnValue(dn) {
  const digits = String(dn || "").replace(/\D/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

/**
 * درون‌یابی Cv روی منحنی ۱۰ نقطه‌ای (درصدهای ۱۰ تا ۱۰۰ بازشدگی).
 *
 * @param {number[]} curve آرایهٔ Cv در ۱۰، ۲۰، … ۱۰۰ درصد
 * @param {number} openingPercent
 * @returns {number|null}
 */
export function curveCvAt(curve, openingPercent) {
  if (!Array.isArray(curve) || curve.length !== 10) return null;
  const values = curve.map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;

  const opening = Math.min(100, Math.max(0, Number(openingPercent)));
  if (!Number.isFinite(opening)) return null;
  if (opening <= 10) return values[0] * (opening / 10);
  if (opening >= 100) return values[9];

  const position = opening / 10 - 1; // 0 … 9
  const low = Math.floor(position);
  const fraction = position - low;
  return values[low] + (values[low + 1] - values[low]) * fraction;
}

/**
 * معکوس منحنی: درصد بازشدگی متناظر با یک Cv موردنیاز.
 * خارج از محدودهٔ منحنی به‌صورت خطی اکستراپوله می‌شود تا اگر شیر کوچک
 * باشد، درصد گزارش‌شده از ۱۰۰٪ عبور کند و کاربر متوجه شود.
 *
 * @param {number[]} curve
 * @param {number} cvRequired
 * @returns {number|null}
 */
export function curveOpening(curve, cvRequired) {
  if (!Array.isArray(curve) || curve.length !== 10) return null;
  const values = curve.map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;
  const needed = Number(cvRequired);
  if (!Number.isFinite(needed) || needed <= 0) return null;

  if (needed <= values[0]) {
    return values[0] > 0 ? 10 * (needed / values[0]) : 0;
  }
  if (needed >= values[9]) {
    return values[9] > 0 ? 100 * (needed / values[9]) : 100;
  }

  for (let index = 0; index < 9; index += 1) {
    const low = values[index];
    const high = values[index + 1];
    if (low <= needed && needed <= high) {
      // ناحیهٔ تخت منحنی (مقادیر برابر): بازشدگی بالاتر گزارش می‌شود
      if (high - low < 1e-9) return (index + 2) * 10;
      const fraction = (needed - low) / (high - low);
      return (index + 1) * 10 + fraction * 10;
    }
  }
  return null;
}

/**
 * شکل منحنی مشترک یک سری برآوردی (۱۰ نقطهٔ نرمال‌شده تا ۱).
 * در دادهٔ اندازه‌گیری‌شده چنین فیلدی وجود ندارد و null برمی‌گردد.
 */
function estimateShape(table) {
  const points = table && table.curveShape ? table.curveShape.points : null;
  if (!Array.isArray(points) || points.length !== 10) return null;
  return points.every((n) => Number.isFinite(n) && n >= 0 && n <= 1)
    ? points.map(Number)
    : null;
}

/** شکل نرمال‌شده × Cv نامی = منحنی ۱۰ نقطه‌ای یک تریم برآوردی */
function scaleShape(shape, cv) {
  if (!shape) return null;
  return shape.map((fraction) => +(fraction * cv).toPrecision(3));
}

/**
 * منحنی یک تریم: منحنی اندازه‌گیری‌شدهٔ خودش، وگرنه برای ردیف‌های برآوردی
 * شکل مشترک سری در Cv نامی مقیاس می‌خورد. بقیه (جدول دست‌نویس ادمین) null
 * می‌مانند تا فرض خطیِ همیشگی اعمال شود.
 */
export function estimatedTrimCurve(table, size, trim) {
  if (Array.isArray(trim && trim.curve) && trim.curve.length === 10) return trim.curve.map(Number);
  const cv = Number(trim && trim.cv);
  if (!size || size.source !== "estimated" || !Number.isFinite(cv) || cv <= 0) return null;
  return scaleShape(estimateShape(table), cv);
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
 * فهرست کاندیداهای (محصول × DN × ترم) از جدول‌های سایزینگ.
 * هر سایز می‌تواند چند ترم داشته باشد (نردبان Cv کاتالوگ)؛ اگر ترمی ثبت
 * نشده باشد همان Cv سایز به‌صورت خطی در نظر گرفته می‌شود (جدول قدیمی ادمین).
 */
function collectTrimCandidates(catalog, tables) {
  const list = [];
  for (const product of catalog) {
    const table = tables[product.series];
    const sizes = table && Array.isArray(table.sizes) ? table.sizes : null;
    if (!sizes) continue;

    for (const size of sizes) {
      const trims =
        Array.isArray(size.trims) && size.trims.length > 0
          ? size.trims
          : [{ cv: size.cv, characteristic: null, curve: null }];

      for (const trim of trims) {
        const cv = Number(trim && trim.cv);
        if (!Number.isFinite(cv) || cv <= 0) continue;
        const curve = estimatedTrimCurve(table, size, trim);
        list.push({
          product,
          dn: size.dn,
          nps: typeof size.nps === "number" ? size.nps : null,
          cv,
          characteristic: (trim && trim.characteristic) || null,
          curve,
          source: size.source || "catalog",
          // سطح اعتماد برآورد تا در نتیجهٔ سایزینگ قابل اعلام باشد
          confidence: size.confidence || null,
          errorPct: typeof size.errorPct === "number" ? size.errorPct : null
        });
      }
    }
  }
  return list;
}

/**
 * انتخاب بهترین کاندیدا.
 * ترتیب اولویت: کوچک‌ترین Cv نامی (تنگ‌ترین تناسب و بهترین کنترل‌پذیری)،
 * سپس مشخصهٔ ترجیحی (درصدی → اصلاح‌شده → خطی → بازشدگی سریع)،
 * سپس خانوادهٔ کنترلی، سپس سایز کوچک‌تر و در نهایت شمارهٔ سری.
 */
function pickBest(list) {
  if (list.length === 0) return null;
  const preferred = list.filter((item) => rankOf(item.product) <= 2);
  const pool = preferred.length > 0 ? preferred : list;

  pool.sort(
    (a, b) =>
      a.cv - b.cv ||
      characteristicRank(a.characteristic) - characteristicRank(b.characteristic) ||
      rankOf(a.product) - rankOf(b.product) ||
      dnValue(a.dn) - dnValue(b.dn) ||
      String(a.product.series).localeCompare(String(b.product.series))
  );
  return pool[0];
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
  const series = tables.series && typeof tables.series === "object" ? tables.series : tables;
  if (Object.keys(series).length === 0) return null;

  const limit = maxOpening * 100;
  const candidates = collectTrimCandidates(catalog, series);
  if (candidates.length === 0) return null;

  // ظرفیت هر کاندیدا در سقف بازشدگی مجاز (با منحنی، دقیق‌تر از فرض خطی)
  const capacityAtLimit = (item) => {
    if (item.curve) {
      const atLimit = curveCvAt(item.curve, limit);
      return Number.isFinite(atLimit) ? atLimit : item.cv * maxOpening;
    }
    return item.cv * maxOpening;
  };

  const withinMargin = candidates.filter((item) => capacityAtLimit(item) >= cvRequired);
  const anyFit = candidates.filter((item) => item.cv >= cvRequired);

  // دادهٔ اندازه‌گیری‌شده/ادمین بر برآورد مقدم است: تا وقتی یک گزینهٔ غیربرآوردی
  // همان شرط را برآورده می‌کند، سایز برآوردی انتخاب نمی‌شود. اگر هیچ گزینهٔ
  // اندازه‌گیری‌شده‌ای نبود، برآورد با همان قاعدهٔ «کوچک‌ترین Cv کافی» می‌آید.
  const pickPreferred = (list) => {
    if (list.length === 0) return null;
    const preferred = list.filter((item) => item.source !== "estimated");
    return pickBest(preferred.length > 0 ? preferred : list);
  };
  const best = pickPreferred(withinMargin) || pickPreferred(anyFit);
  if (!best) return null;

  const rawOpening = best.curve
    ? curveOpening(best.curve, cvRequired)
    : (cvRequired / best.cv) * 100;
  const openingPercent = Math.min(
    100,
    Math.round(Number.isFinite(rawOpening) ? rawOpening : (cvRequired / best.cv) * 100)
  );

  // مبنا: منحنی کاتالوگ / مشخصهٔ خطی کاتالوگ / فرض خطی برای جدول دست‌نویس ادمین
  const fromCatalogue = best.source === "catalog";
  // منحنی برآوردی از شکل میانهٔ کاتالوگ ساخته شده، پس curveBased می‌ماند،
  // ولی سرچشمهٔ داده باید honest بماند: estimated با سایز measured یکی نیست.
  const fromEstimate = best.source === "estimated";

  return {
    product: best.product,
    dn: best.dn,
    nps: best.nps,
    cv: best.cv,
    characteristic: best.characteristic,
    curveBased: Boolean(best.curve) || (fromCatalogue && best.characteristic === "linear"),
    openingPercent,
    withinMargin: openingPercent <= limit,
    source: best.source || "catalog",
    confidence: fromEstimate ? best.confidence || null : null,
    errorPct: fromEstimate ? best.errorPct ?? null : null
  };
}

/** شمارش سری‌هایی که جدول Cv دارند (برای نشان دادن وضعیت داده) */
export function countCvSeries(tables) {
  if (!tables) return 0;
  return Object.keys(tables).filter((key) => Array.isArray(tables[key]?.sizes) && tables[key].sizes.length > 0).length;
}
