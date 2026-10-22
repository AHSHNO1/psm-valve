import { readJSON, writeJSON } from "./db.js";

const FILE = "valve-cv-tables.json";
const CATALOG_FILE = "valve-cv-catalog.json";
// برآورد مهندسی برای سری‌هایی که کاتالوگ اندازه‌گیری‌شده ندارند (scripts/estimate-cv.mjs)
const ESTIMATED_FILE = "valve-cv-estimated.json";

const EMPTY = { schemaVersion: 1, updatedAt: null, series: {} };
const EMPTY_CATALOG = { schemaVersion: 1, openings: [], series: {} };
const EMPTY_ESTIMATED = { schemaVersion: 1, series: {} };

/** خواندن جدول Cv کاتالوگ (فایل ممکن است هنوز وجود نداشته باشد) */
export function getCvTables() {
  const data = readJSON(FILE, EMPTY);
  if (!data || typeof data !== "object" || !data.series) return { ...EMPTY, series: {} };
  return {
    schemaVersion: 1,
    updatedAt: data.updatedAt || null,
    series: data.series
  };
}

/** اعتبارسنجی و نرمال‌سازی سایزهای یک سری */
export function validateSeriesPayload(series, sizes) {
  const errors = [];

  const seriesId = String(series || "").trim();
  if (!/^[0-9A-Za-z/.-]{1,24}$/.test(seriesId)) {
    errors.push("شناسهٔ سری معتبر نیست (فقط حرف، رقم، / و - مجاز است).");
  }
  if (!Array.isArray(sizes)) {
    return { ok: false, errors: ["فهرست سایزها باید آرایه باشد."], sizes: [] };
  }
  if (sizes.length === 0) errors.push("دست‌کم یک سایز لازم است.");
  if (sizes.length > 80) errors.push("حداکثر ۸۰ سایز برای هر سری مجاز است.");

  const seen = new Set();
  const clean = [];

  sizes.forEach((row, index) => {
    const dn = String(row?.dn || "").toUpperCase().trim();
    const cv = Number(row?.cv);

    if (!/^DN\d{2,4}$/.test(dn)) {
      errors.push(`ردیف ${index + 1}: قطر باید مثل DN50 باشد.`);
      return;
    }
    if (!Number.isFinite(cv) || cv <= 0 || cv > 100000) {
      errors.push(`ردیف ${index + 1} (${dn}): Cv باید عددی بین ۰ و ۱۰۰۰۰۰ باشد.`);
      return;
    }
    if (seen.has(dn)) {
      errors.push(`ردیف ${index + 1}: ${dn} تکراری است.`);
      return;
    }

    seen.add(dn);
    clean.push({ dn, cv: Math.round(cv * 100) / 100 });
  });

  clean.sort((a, b) => Number(a.dn.replace(/\D/g, "")) - Number(b.dn.replace(/\D/g, "")));

  return { ok: errors.length === 0, errors, sizes: clean, series: seriesId };
}

/** ذخیرهٔ سایزهای یک سری؛ فقط همان سری بازنویسی می‌شود (بدون clobber بقیه) */
export function saveSeriesCv(series, sizes) {
  const result = validateSeriesPayload(series, sizes);
  if (!result.ok) return result;

  const tables = getCvTables();
  tables.series[result.series] = {
    sizes: result.sizes,
    updatedAt: new Date().toISOString()
  };
  tables.updatedAt = new Date().toISOString();
  writeJSON(FILE, tables);

  return { ok: true, errors: [], series: result.series, sizes: result.sizes };
}

/** حذف جدول یک سری */
export function deleteSeriesCv(series) {
  const tables = getCvTables();
  if (!tables.series[series]) return { ok: false, errors: ["این سری جدولی ندارد."] };
  delete tables.series[series];
  tables.updatedAt = new Date().toISOString();
  writeJSON(FILE, tables);
  return { ok: true, errors: [] };
}

// ============================================================
// دادهٔ مرجع کاتالوگ (data/valve-cv-catalog.json)
// این فایل از کاتالوگ شرکت ساخته می‌شود (scripts/import-cv-xlsx.py)
// و در پنل ادمین ویرایش نمی‌شود؛ جدول دست‌نویس ادمین همیشه اولویت دارد.
// ============================================================

/** خواندن دادهٔ مرجع کاتالوگ */
export function getCvCatalog() {
  const data = readJSON(CATALOG_FILE, EMPTY_CATALOG);
  if (!data || typeof data !== "object" || !data.series) {
    return { ...EMPTY_CATALOG, series: {} };
  }
  return {
    schemaVersion: data.schemaVersion || 1,
    openings: Array.isArray(data.openings) && data.openings.length ? data.openings : [],
    source: data.source || null,
    stats: data.stats || null,
    repairs: Array.isArray(data.repairs) ? data.repairs : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    series: data.series
  };
}

// ============================================================
// برآورد مهندسی (data/valve-cv-estimated.json)
// ساخته‌شده با scripts/estimate-cv.mjs از قانون Cv ~ DN^k روی سری‌های
// اندازه‌گیری‌شده. دادهٔ کارخانه نیست و همیشه بعد از کاتالوگ و
// بازنویسی ادمین می‌آید؛ کاتالوگ هر سایزی را دارد آن DN برآورد نمی‌شود.
// ============================================================

/**
 * خواندن برآورد مهندسی؛ اگر فایل هنوز ساخته نشده باشد فهرست خالی برمی‌گردد
 * تا ابزار سایزینگ فقط با دادهٔ اندازه‌گیری‌شده کار کند.
 */
export function getCvEstimated() {
  const data = readJSON(ESTIMATED_FILE, EMPTY_ESTIMATED);
  if (!data || typeof data !== "object" || !data.series) {
    return { ...EMPTY_ESTIMATED, meta: null, refused: [] };
  }
  return {
    schemaVersion: data.schemaVersion || 1,
    provenance: data.provenance || "estimated",
    meta: data.meta || null,
    refused: Array.isArray(data.refused) ? data.refused : [],
    series: data.series
  };
}

/**
 * برچسب اعتماد یک سری/سایز برآوردی.
 * band = بازهٔ ±خطای برگشتیِ آزمون (LOSO) دور Cv نامی؛ برای بنچ «برآورد».
 */
function estimateTrust(entry) {
  const errorPct = typeof entry.errorPct === "number" ? entry.errorPct : null;
  return {
    source: "estimated",
    confidence: entry.confidence || null,
    confidenceValue: typeof entry.confidenceValue === "number" ? entry.confidenceValue : null,
    confidenceZone: entry.confidenceZone || null,
    errorPct,
    band: errorPct == null
      ? null
      : [Math.max(0, Math.round(100 - errorPct)), Math.round(100 + errorPct)],
    method: entry.method || null
  };
}

/**
 * شکل منحنیِ نرمال‌شدهٔ یک سری برآوردی (۱۰ نقطه، آخرین = ۱).
 * تریم‌های برآوردی همه همان شکل دارند و فقط در Cv نامی‌شان مقیاس می‌خورند،
 * پس یک‌بار در سطح سری فرستاده می‌شود به‌جای ۳۹۶ منحنی تکراری.
 */
function estimateCurveShape(block) {
  const basis = block.basis || {};
  const shape = basis.curveShape || {};
  const points = Array.isArray(shape.shape) ? shape.shape : null;
  if (!points || points.length !== 10) return null;
  if (!points.every(function (n) { return Number.isFinite(n) && n >= 0 && n <= 1; })) return null;
  return {
    characteristic: shape.characteristic || "equal",
    points: points.map(function (n) { return Number(n); })
  };
}

/** خلاصهٔ کاتالوگ برای نمایش در پنل ادمین (بدون منحنی‌های سنگین) */
export function getCvCatalogSummary() {
  const catalog = getCvCatalog();
  const series = Object.keys(catalog.series).map(function (id) {
    const sizes = catalog.series[id].sizes || [];
    const trims = sizes.flatMap(function (size) { return size.trims || []; });
    const byCharacteristic = {};
    trims.forEach(function (trim) {
      const key = trim.characteristic || "unknown";
      byCharacteristic[key] = (byCharacteristic[key] || 0) + 1;
    });
    return {
      series: id,
      sizes: sizes.map(function (size) {
        return {
          dn: size.dn,
          nps: size.nps,
          cvMax: size.cvMax,
          trims: (size.trims || []).length
        };
      }),
      trims: trims.length,
      byCharacteristic,
      cvMin: trims.length ? Math.min.apply(null, trims.map(function (t) { return t.cv; })) : null,
      cvMax: trims.length ? Math.max.apply(null, trims.map(function (t) { return t.cv; })) : null
    };
  });
  const repairCount = catalog.repairs.length;
  const estimated = getCvEstimated();
  // سری‌های برآوردی هم در پنل ادمین دیده می‌شوند: ادمین باید بداند کدام
  // سایزها اندازه‌گیری‌شده‌اند و کدام را می‌توان با دادهٔ واقعی بازنویسی کرد.
  const estimatedSeries = Object.keys(estimated.series).map(function (id) {
    const block = estimated.series[id] || {};
    const sizes = block.sizes || [];
    const trims = sizes.flatMap(function (size) { return size.trims || []; });
    const trust = estimateTrust(block);
    return {
      series: id,
      provenance: "estimated",
      confidence: trust.confidence,
      errorPct: trust.errorPct,
      band: trust.band,
      method: trust.method,
      sizes: sizes.map(function (size) {
        return {
          dn: size.dn,
          nps: size.nps,
          cvMax: size.cvMax,
          trims: (size.trims || []).length
        };
      }),
      trims: trims.length,
      cvMin: trims.length ? Math.min.apply(null, trims.map(function (t) { return t.cv; })) : null,
      cvMax: trims.length ? Math.max.apply(null, trims.map(function (t) { return t.cv; })) : null
    };
  });
  series.forEach(function (entry) { entry.provenance = "measured"; });
  return {
    source: catalog.source,
    stats: catalog.stats,
    repairs: catalog.repairs,
    warnings: catalog.warnings,
    repairedValues: repairCount,
    series: series.concat(estimatedSeries),
    estimatedMeta: estimated.meta,
    estimatedCount: estimatedSeries.length,
    refused: estimated.refused
  };
}

/** شمارهٔ میلی‌متری یک قالب DN مثل DN80 → 80 */
function dnMillimetres(dn) {
  const digits = String(dn || "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/**
 * جدول‌های نهایی سایزینگ = دادهٔ مرجع کاتالوگ + برآورد مهندسی + بازنویسی ادمین.
 *
 * قواعد:
 *  ۱) بازنویسی ادمین فقط همان DN را جایگزین می‌کند (بقیهٔ تریم‌های کاتالوگ حفظ می‌شوند).
 *  ۲) برآورد فقط DNهایی را پر می‌کند که کاتالوگ اندازه‌گیری‌شده ندارد؛
 *     دادهٔ اندازه‌گیری‌شده و دست‌نویس ادمین همیشه بر برآورد می‌برند.
 *  ۳) در حالت slim منحنی تریم‌های خطی حذف می‌شود (کلاینت آن را از Cv نامی می‌سازد).
 */
function mergeSizingTables(slim) {
  const catalog = getCvCatalog().series || {};
  const estimated = getCvEstimated().series || {};
  const admin = getCvTables().series || {};
  const series = {};

  Object.keys(catalog).forEach(function (id) {
    const sizes = (catalog[id].sizes || []).map(function (size) {
      return {
        dn: size.dn,
        nps: typeof size.nps === "number" ? size.nps : null,
        dnMm: typeof size.dnMm === "number" ? size.dnMm : dnMillimetres(size.dn),
        source: "catalog",
        cv: Number(size.cvMax) || null,
        trims: (size.trims || []).map(function (trim) {
          if (slim) {
            return {
              cv: trim.cv,
              characteristic: trim.characteristic || null,
              curve: trim.characteristic === "linear" ? null : trim.curve || null
            };
          }
          return {
            cv: trim.cv,
            characteristic: trim.characteristic || null,
            ratio50: typeof trim.ratio50 === "number" ? trim.ratio50 : null,
            rangeability: typeof trim.rangeability === "number" ? trim.rangeability : null,
            curve: trim.curve || null
          };
        })
      };
    });
    series[id] = { sizes };
  });

  Object.keys(estimated).forEach(function (id) {
    const block = estimated[id] || {};
    const entry = series[id] || (series[id] = { sizes: [] });
    const trust = estimateTrust(block);
    (block.sizes || []).forEach(function (size) {
      const dn = String(size.dn || "").toUpperCase();
      const cv = Number(size.cvMax);
      if (!dn || !Number.isFinite(cv) || cv <= 0) return;
      // سایزی که کاتالوگ اندازه‌گیری‌شده دارد هرگز برآوردی نمی‌شود
      if (entry.sizes.some(function (row) { return row.dn === dn; })) return;
      const sizeTrust = estimateTrust({
        confidence: size.confidence || block.confidence,
        confidenceValue: size.confidenceValue,
        confidenceZone: size.confidenceZone,
        errorPct: typeof size.errorPct === "number" ? size.errorPct : block.errorPct,
        method: block.method
      });
      entry.sizes.push({
        dn,
        nps: typeof size.nps === "number" ? size.nps : null,
        dnMm: typeof size.dnMm === "number" ? size.dnMm : dnMillimetres(dn),
        source: "estimated",
        cv,
        // در حالت slim سطح اعتماد فقط یک‌بار در سری می‌آید؛ اینجا فقط
        // خطای همان سایز لازم است تا بنچ «برآورد ±errorPct٪» صادق بماند
        ...(slim
          ? { confidence: sizeTrust.confidence, errorPct: sizeTrust.errorPct }
          : {
            confidence: sizeTrust.confidence,
            confidenceValue: sizeTrust.confidenceValue,
            confidenceZone: sizeTrust.confidenceZone,
            errorPct: sizeTrust.errorPct
          }),
        trims: (size.trims || []).map(function (trim) {
          return slim
            ? { cv: Number(trim.cv), characteristic: trim.characteristic || null }
            : {
              cv: Number(trim.cv),
              characteristic: trim.characteristic || null,
              ratio50: typeof trim.ratio50 === "number" ? trim.ratio50 : null,
              rangeability: typeof trim.rangeability === "number" ? trim.rangeability : null
            };
        }).filter(function (trim) { return Number.isFinite(trim.cv) && trim.cv > 0; })
      });
    });
    // سرچشمهٔ منحنی برآورد: شکل نرمال‌شده یک‌بار در سطح سری، کلاینت آن را در
    // Cv نامی هر تریم ضرب می‌کند (همان buildCurve در scripts/estimate-cv.mjs).
    const shape = estimateCurveShape(block);
    if (shape && entry.sizes.some(function (row) { return row.source === "estimated"; })) {
      entry.curveShape = shape;
    }
    // مبنا و خط آزمونِ برگشتی برای بنچ «برآورد» در رابط کاربری
    if (entry.sizes.some(function (row) { return row.source === "estimated"; })) {
      entry.estimate = trust;
    }
  });

  Object.keys(admin).forEach(function (id) {
    const entry = series[id] || (series[id] = { sizes: [] });
    (admin[id].sizes || []).forEach(function (row) {
      const dn = String((row && row.dn) || "").toUpperCase();
      const cv = Number(row && row.cv);
      if (!dn || !Number.isFinite(cv) || cv <= 0) return;
      const override = {
        dn,
        nps: null,
        dnMm: dnMillimetres(dn),
        source: "admin",
        cv,
        trims: []
      };
      const index = entry.sizes.findIndex(function (size) { return size.dn === dn; });
      if (index === -1) entry.sizes.push(override);
      else entry.sizes[index] = override;
    });
    entry.sizes.sort(function (a, b) {
      const left = a.dnMm == null ? Number.MAX_SAFE_INTEGER : a.dnMm;
      const right = b.dnMm == null ? Number.MAX_SAFE_INTEGER : b.dnMm;
      return left - right || String(a.dn).localeCompare(String(b.dn));
    });
  });

  // سرچشمهٔ دادهٔ هر سری، پس از اعمال همهٔ لایه‌ها (ادمین بر برآورد می‌گذارد)
  Object.keys(series).forEach(function (id) {
    const entry = series[id];
    const counts = { catalog: 0, estimated: 0, admin: 0 };
    entry.sizes.forEach(function (size) {
      counts[size.source] = (counts[size.source] || 0) + 1;
    });
    entry.provenance = counts.estimated === 0
      ? (counts.catalog > 0 ? "measured" : "manual")
      : (counts.catalog + counts.admin === 0 ? "estimated" : "mixed");
    // اگر ادمین همهٔ سایزهای برآوردی را بازنویسی کرد، بنچ برآورد برداشته می‌شود
    if (counts.estimated === 0) delete entry.estimate;
  });

  return { schemaVersion: 1, series };
}

/** جدول نهایی کامل (سرور: پنل ادمین، API) */
export function getSizingTables() {
  return mergeSizingTables(false);
}

/** جدول نهایی سبک برای کلاینت ابزار سایزینگ */
export function getSizingTablesForClient() {
  return mergeSizingTables(true);
}
