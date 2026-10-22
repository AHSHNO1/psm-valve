// ============================================================
// SHARE LINK — ساخت و خواندن پارامترهای پیوند سایزینگ
// ماژول خالص (بدون fs/DB) تا در مرورگر هم قابل استفاده باشد
// ============================================================

import { FLOW_UNITS, FIELD_UNIT_CATEGORY, UNIT_CATEGORIES } from "./unit-system.js";

// فیلدهای عددی فرم که مستقیم در URL منتقل می‌شوند
// QMin با همان واحد Q می‌آید
export const SIZING_NUMBER_KEYS = [
  "Q", "W", "Gf", "Gg", "MW", "P1", "P2", "T", "Pv", "Pc", "Z", "k", "xT", "FL", "nu", "pipeDn",
  "QMin", "marginPct",
  // حالت‌های پیشرفته
  "setP", "overpressurePct", "inletLossPct", "Kd", "Kb", "Kc",
  "T2", "waterP", "waterT", "waterGf", "supplyP", "dvP",
  "stages", "drynessPct", "qualityPct",
  // پارامترهای مدل دو‌فازی (بی‌بعد)
  "N", "tpKd"
];

// حالت محاسبه (شیر کنترل یا یکی از سرویس‌های تخصصی)
export const SIZING_MODES = ["control", "psv", "desuper", "letdown", "twoPhase"];
// مدل دو‌فازی در پیوند می‌آید چون Cv لازم مستقیماً به آن وابسته است
// (پراکندگی مدل‌ها تا چند برابر است) — پیش‌فرض omega.
export const TWO_PHASE_MODELS = ["omega", "hem", "hne", "additive"];
// کلیدهای متنی فرم که فقط از یک فهرست سفید پذیرفته می‌شوند
const SIZING_ENUM_KEYS = { tpModel: TWO_PHASE_MODELS };
// کلیدهای بولی فرم در پیوند با 1/0 می‌آیند
export const SIZING_FLAG_KEYS = ["balanced", "atomizing"];

// واحد مستقل هر فیلد (مثل QUnit) — فقط واحدهای شناخته‌شدهٔ همان دسته پذیرفته میشوند
const FIELD_UNIT_KEYS = Object.keys(FIELD_UNIT_CATEGORY).map((field) => ({
  field,
  key: `${field}Unit`,
  units: UNIT_CATEGORIES[FIELD_UNIT_CATEGORY[field]].groups.flatMap((g) => g.units)
}));

function parseFieldUnit(allowed, raw) {
  return raw && allowed.includes(raw) ? raw : null;
}

const FLUID_TYPES = ["liquid", "gas", "steam"];
const UNIT_SYSTEMS = ["SI", "IMPERIAL"];
const SERIES_PATTERN = /^[0-9A-Za-z][0-9A-Za-z./-]{0,23}$/;

function parseNumber(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

/**
 * خواندن پارامترهای سایزینگ از query string (با یا بدون "?" در ابتدا).
 * خروجی: { hasParams, fluid, unitSystem, form, series, dn }
 * فقط مقادیر معتبر پذیرفته می‌شوند؛ نامعتبرها نادیده گرفته می‌شوند.
 */
export function parseSizingParams(search) {
  const result = { hasParams: false, fluid: "liquid", unitSystem: "SI", mode: "control", form: {}, series: null, dn: null };
  if (!search) return result;
  const params = new URLSearchParams(String(search).replace(/^[?#&]+/, ""));
  const form = {};

  const mode = params.get("mode");
  if (SIZING_MODES.includes(mode)) {
    result.mode = mode;
    result.hasParams = true;
  }
  for (const key of SIZING_FLAG_KEYS) {
    const raw = params.get(key);
    if (raw === "1" || raw === "0") {
      form[key] = raw === "1";
      result.hasParams = true;
    }
  }

  const fluid = params.get("fluid");
  if (FLUID_TYPES.includes(fluid)) {
    result.fluid = fluid;
    result.hasParams = true;
  }
  const unitSystem = params.get("units");
  if (UNIT_SYSTEMS.includes(unitSystem)) {
    result.unitSystem = unitSystem;
    result.hasParams = true;
  }
  const qUnit = params.get("QUnit");
  if (qUnit && FLOW_UNITS[qUnit]) {
    form.QUnit = qUnit;
    result.hasParams = true;
  }
  const wUnit = params.get("WUnit");
  if (wUnit && FLOW_UNITS[wUnit]) {
    form.WUnit = wUnit;
    result.hasParams = true;
  }

  for (const entry of FIELD_UNIT_KEYS) {
    const unit = parseFieldUnit(entry.units, params.get(entry.key));
    if (unit) {
      form[entry.key] = unit;
      result.hasParams = true;
    }
  }

  for (const key of SIZING_NUMBER_KEYS) {
    const v = parseNumber(params.get(key));
    if (v != null) {
      form[key] = v;
      result.hasParams = true;
    }
  }

  for (const key of Object.keys(SIZING_ENUM_KEYS)) {
    const raw = params.get(key);
    if (raw && SIZING_ENUM_KEYS[key].includes(raw)) {
      form[key] = raw;
      result.hasParams = true;
    }
  }

  const series = params.get("series");
  if (series && SERIES_PATTERN.test(series)) {
    result.series = series;
    result.hasParams = true;
  }
  const dn = parseNumber(params.get("dn"));
  if (dn != null && dn >= 6 && dn <= 2000) {
    result.dn = Math.round(dn);
    result.hasParams = true;
  }

  result.form = form;
  return result;
}

/**
 * ساخت query string از وضعیت فرم (بدون "?" در ابتدا).
 * فقط مقادیر عددی/متنی موجود نوشته می‌شوند تا لینک کوتاه بماند.
 */
export function buildSizingParams({ fluid, unitSystem, mode = "control", form = {}, series = null, dn = null } = {}) {
  const params = new URLSearchParams();
  if (SIZING_MODES.includes(mode) && mode !== "control") params.set("mode", mode);
  for (const key of SIZING_FLAG_KEYS) {
    if (form[key] === true) params.set(key, "1");
    else if (form[key] === false) params.set(key, "0");
  }
  if (FLUID_TYPES.includes(fluid)) params.set("fluid", fluid);
  if (UNIT_SYSTEMS.includes(unitSystem)) params.set("units", unitSystem);
  if (form.QUnit && FLOW_UNITS[form.QUnit]) params.set("QUnit", form.QUnit);
  if (form.WUnit && FLOW_UNITS[form.WUnit]) params.set("WUnit", form.WUnit);
  for (const entry of FIELD_UNIT_KEYS) {
    const unit = parseFieldUnit(entry.units, form[entry.key]);
    if (unit) params.set(entry.key, unit);
  }

  for (const key of SIZING_NUMBER_KEYS) {
    const v = parseNumber(form[key]);
    if (v != null) params.set(key, String(+v.toPrecision(10)));
  }
  for (const key of Object.keys(SIZING_ENUM_KEYS)) {
    // مقدار پیش‌فرض در پیوند نوشته نمی‌شود تا لینک کوتاه بماند
    if (SIZING_ENUM_KEYS[key].includes(form[key]) && form[key] !== SIZING_ENUM_KEYS[key][0]) {
      params.set(key, form[key]);
    }
  }
  if (series && SERIES_PATTERN.test(series)) params.set("series", series);
  const dnNum = parseNumber(dn);
  if (dnNum != null && dnNum >= 6 && dnNum <= 2000) params.set("dn", String(Math.round(dnNum)));
  return params.toString();
}

/**
 * انتخاب شیر یک سری خاص از جدول Cv برای Cv محاسبه‌شده.
 * کوچک‌ترین trim با Cv ≥ مقدار لازم؛ اگر نبود بزرگ‌ترین trim با پرچم insufficient.
 * ترجیح DN (اختیاری)؛ اگر آن DN در سری نبود نزدیک‌تر DN بزرگتر از نیاز انتخاب می‌شود.
 */
export function pickSeriesValve(tables, seriesId, requiredCv, dnMm = null) {
  const series = tables && tables[seriesId];
  if (!series || !Array.isArray(series.sizes) || series.sizes.length === 0) return null;
  if (!Number.isFinite(requiredCv) || requiredCv <= 0) return null;

  const candidates = [];
  for (const size of series.sizes) {
    const trims = Array.isArray(size.trims) && size.trims.length ? size.trims : [{ cv: size.cv }];
    for (const trim of trims) {
      const cv = Number(trim.cv != null ? trim.cv : size.cv);
      if (!Number.isFinite(cv) || cv <= 0) continue;
      candidates.push({
        dn: size.dn,
        nps: size.nps,
        dnMm: size.dnMm != null ? size.dnMm : Number(String(size.dn).replace(/[^0-9]/g, "")) || 0,
        cv: cv,
        characteristic: trim.characteristic || null,
        // سرچشمهٔ داده (اندازه‌گیری‌شده / برآورد / دست‌نویس ادمین) تا بنچِ نتیجه گمراه‌کننده نباشد
        source: size.source || "catalog",
        confidence: size.confidence || null,
        errorPct: typeof size.errorPct === "number" ? size.errorPct : null,
        openingPercent: Math.min(100, Math.round((requiredCv / cv) * 100))
      });
    }
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.cv - b.cv || a.dnMm - b.dnMm);
  let picked = candidates.find((c) => c.cv >= requiredCv) || candidates[candidates.length - 1];
  const insufficient = picked.cv < requiredCv;

  // ترجیح DN درخواستی کاربر (در صورت وجود در همان سری و پوشش Cv کافی)
  let dnMatched = true;
  if (Number.isFinite(dnMm) && dnMm > 0) {
    const dnCandidates = candidates.filter((c) => c.dnMm === dnMm && c.cv >= requiredCv);
    if (dnCandidates.length > 0) {
      picked = dnCandidates[0];
    } else {
      dnMatched = false;
    }
  }

  return { ...picked, insufficient, dnMatched };
}
