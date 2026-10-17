import { readJSON, writeJSON } from "./db.js";

const FILE = "valve-cv-tables.json";

const EMPTY = { schemaVersion: 1, updatedAt: null, series: {} };

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
