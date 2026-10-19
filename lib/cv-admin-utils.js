// ============================================================
// ابزار مشترک صفحهٔ «جدول Cv سایزینگ» پنل ادمین
// این ماژول خالص است (بدون وابستگی سروری) تا هم در کلاینت پنل
// و هم در تست‌های node (tests/cv-admin-utils.test.mjs) استفاده شود.
// ============================================================

/** قالب قطر: DN + دو تا چهار رقم (همان قاعدهٔ lib/valve-cv.js) */
export const DN_RE = /^DN\d{2,4}$/;

/** شناسهٔ سری: حرف/رقم و / و . و - (همان قاعدهٔ سرور) */
export const SERIES_RE = /^[0-9A-Za-z/.-]{1,24}$/;

/** برچسب وضعیت دادهٔ هر سری */
export const STATUS_LABEL = {
  both: "کاتالوگ + دست‌نویس",
  catalog: "کاتالوگ (با منحنی)",
  admin: "جدول دست‌نویس",
  none: "بدون داده",
  invalid: "سری نامعتبر"
};

/** رنگ‌های وضعیت (پنل ادمین روشن است؛ رنگ ثابت استفاده می‌شود) */
export const STATUS_TONE = {
  both: { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" },
  catalog: { bg: "#EFF6FF", fg: "#1D4ED8", border: "#BFDBFE" },
  admin: { bg: "#FFF7ED", fg: "#9A3412", border: "#FED7AA" },
  none: { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA" },
  invalid: { bg: "#F3F4F6", fg: "#6B7280", border: "#E5E7EB" }
};

/** DN80 → DN80 · « dn80 » → DN80 */
export function normalizeDn(value) {
  return String(value == null ? "" : value).toUpperCase().replace(/\s+/g, "");
}

/** ردیف جدول دست‌نویس → شکل قابل ویرایش در فرم */
export function normalizeRow(row) {
  const cv = row && row.cv;
  return {
    dn: normalizeDn(row && row.dn),
    cv: cv === "" || cv == null ? "" : String(cv)
  };
}

/** متن بازهٔ سایز یک محصول (برای نمایش در کارت سری) */
export function sizeText(spec) {
  if (!spec) return "";
  if (typeof spec === "string") return spec;
  return spec.en || spec.fa || "";
}

/**
 * اعتبارسنجی ردیف‌های ویرایشگر.
 * قواعد عیناً همان قواعد سرور است تا خطای ۴۰۰ غیرمنتظره نگیریم.
 *
 * @returns {{ ok: boolean, messages: string[], rowErrors: Object<number,string> }}
 */
export function validateRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const rowErrors = {};
  const messages = [];

  if (list.length === 0) {
    messages.push("دست‌کم یک سایز لازم است.");
    return { ok: false, messages: messages, rowErrors: rowErrors };
  }

  const seen = new Set();
  list.forEach(function (row, index) {
    const dn = normalizeDn(row && row.dn);
    const cv = Number(row && row.cv);
    let message = "";

    if (!DN_RE.test(dn)) {
      message = "قطر باید مثل DN50 باشد.";
    } else if (!Number.isFinite(cv) || cv <= 0) {
      message = "Cv باید عددی مثبت باشد.";
    } else if (cv > 100000) {
      message = "Cv باید کمتر از ۱۰۰۰۰۰ باشد.";
    } else if (seen.has(dn)) {
      message = dn + " تکراری است.";
    }

    if (message) {
      rowErrors[index] = message;
      messages.push(message);
    } else {
      seen.add(dn);
    }
  });

  return { ok: messages.length === 0, messages: messages, rowErrors: rowErrors };
}
function isPlainNumber(value) {
  return /^[0-9]+(\.[0-9]+)?$/.test(String(value == null ? "" : value).trim());
}

/** شمارهٔ سری است؟ (اگر فقط عدد باشد حداقل ۴ رقم تا با Cv اشتباه نشود) */
function isSeriesLike(value) {
  const token = String(value == null ? "" : value).trim();
  if (!SERIES_RE.test(token)) return false;
  if (/^[0-9]+$/.test(token)) return token.length >= 4;
  return true;
}

/**
 * خواندن متن چسبانده‌شده (از اکسل یا دستی).
 *
 * قالب‌های پشتیبانی‌شده:
 *   DN50, 45
 *   DN50 45
 *   51000, DN50, 45
 *   45, DN50            (Cv اول — با سری پیش‌فرض یا شمارهٔ سری در خط)
 * جداکننده: `,` `;` `:` `=` tab و فاصله · خط خالی و خط شروع‌شده با `#` نادیده گرفته می‌شود.
 * اگر یک DN در چند خط بیاید، آخرین مقدار جای قبلی را می‌گیرد.
 *
 * @returns {{ groups: Object<string, Array<{dn:string, cv:string}>>, errors: Array<Object>, rows: number, seriesCount: number }}
 */
export function parseCvLines(text, fallbackSeries) {
  const groups = {};
  const errors = [];
  const fallback = String(fallbackSeries == null ? "" : fallbackSeries).trim();
  let rows = 0;

  String(text == null ? "" : text).split(/\r?\n/).forEach(function (raw, index) {
    const line = String(raw).replace(/^\uFEFF/, "").trim();
    if (!line || line.charAt(0) === "#") return;

    const fail = function (reason) {
      errors.push({ line: index + 1, text: line, reason: reason });
    };

    const tokens = line.split(/[\s,;:=\t]+/).filter(Boolean);
    const dnIndex = tokens.findIndex(function (token) { return DN_RE.test(normalizeDn(token)); });

    if (dnIndex === -1) {
      fail("قطر (DN) در این خط پیدا نشد؛ نمونه: DN50, 45");
      return;
    }

    let series = fallback;
    let cv = tokens[dnIndex + 1];

    if (dnIndex === 1) {
      const head = tokens[0];
      if (isSeriesLike(head)) series = head;
      else if (isPlainNumber(head) && tokens.length === 2) cv = head; // ترتیب برعکس: Cv, DN
      else {
        fail("«" + head + "» نه شمارهٔ سری است و نه قطر. نمونه: 51000, DN50, 45");
        return;
      }
    } else if (dnIndex > 1) {
      fail("مقدار اضافه پیش از قطر: " + tokens.slice(0, dnIndex).join(" "));
      return;
    }

    if (tokens.length > dnIndex + 2) {
      fail("مقدار اضافه پس از Cv: " + tokens.slice(dnIndex + 2).join(" "));
      return;
    }
    if (!series) {
      fail("شمارهٔ سری مشخص نیست؛ سری پیش‌فرض را پر کنید یا شمارهٔ سری را در خط بنویسید.");
      return;
    }
    if (!SERIES_RE.test(series)) {
      fail("شمارهٔ سری «" + series + "» معتبر نیست.");
      return;
    }
    if (cv == null || cv === "") {
      fail("Cv در این خط پیدا نشد.");
      return;
    }
    if (!isPlainNumber(cv)) {
      fail("Cv «" + cv + "» عدد نیست.");
      return;
    }

    const value = Number(cv);
    if (!(value > 0) || value > 100000) {
      fail("Cv باید عددی مثبت و کمتر از ۱۰۰۰۰۰ باشد.");
      return;
    }

    const dn = normalizeDn(tokens[dnIndex]);
    const group = groups[series] || (groups[series] = []);
    const existing = group.findIndex(function (row) { return row.dn === dn; });
    const row = { dn: dn, cv: String(value) };
    if (existing === -1) group.push(row);
    else group[existing] = row;
    rows += 1;
  });

  return {
    groups: groups,
    errors: errors,
    rows: rows,
    seriesCount: Object.keys(groups).length
  };
}

/** سایزهای کاتالوگ یک سری → ردیف‌های قابل ریختن در جدول دست‌نویس (Cv بیشینه) */
export function catalogRowsFor(entry) {
  const sizes = entry && Array.isArray(entry.sizes) ? entry.sizes : [];
  return sizes.map(function (size) {
    return { dn: size.dn, cv: String(size.cvMax) };
  });
}
/** مرتب‌سازی: اول سری‌های مؤثر در سایزینگ، بعد سری‌های بدون داده، بعد بقیه */
const STATUS_ORDER = { none: 0, invalid: 1, admin: 2, both: 3, catalog: 4 };

/**
 * گروه‌بندی محصولات بر اساس شمارهٔ سری + وضعیت دادهٔ هر سری.
 * محصولات هم‌سری (مثل پنج محصول سری 70000) در یک کارت جمع می‌شوند.
 *
 * @param {Array} products خروجی page.js: { slug, series, name, categoryId, sizeText, inSizing }
 * @param {Object} tables جدول دست‌نویس ادمین: { [series]: { sizes, updatedAt } }
 * @param {Object} catalogBySeries خلاصهٔ کاتالوگ: { [series]: { sizes, trims, cvMax, ... } }
 */
export function groupSeries(products, tables, catalogBySeries) {
  const admin = tables && typeof tables === "object" ? tables : {};
  const catalog = catalogBySeries && typeof catalogBySeries === "object" ? catalogBySeries : {};
  const map = new Map();

  (products || []).forEach(function (product) {
    const id = String((product && product.series) || "").trim();
    if (!id) return;

    let entry = map.get(id);
    if (!entry) {
      entry = {
        series: id,
        valid: SERIES_RE.test(id),
        inSizing: false,
        products: [],
        sizeRanges: [],
        categories: []
      };
      map.set(id, entry);
    }

    const text = sizeText(product && (product.sizeText || product.size));
    if (text && entry.sizeRanges.indexOf(text) === -1) entry.sizeRanges.push(text);
    if (product && product.categoryId && entry.categories.indexOf(product.categoryId) === -1) {
      entry.categories.push(product.categoryId);
    }
    if (product && product.inSizing) entry.inSizing = true;

    entry.products.push({
      slug: (product && product.slug) || "",
      name: (product && product.name) || null,
      inSizing: Boolean(product && product.inSizing)
    });
  });

  return Array.from(map.values()).map(function (entry) {
    const catalogEntry = catalog[entry.series] || null;
    const table = admin[entry.series];
    const adminSizes = table && Array.isArray(table.sizes) ? table.sizes : [];

    let status = "none";
    if (catalogEntry && adminSizes.length > 0) status = "both";
    else if (catalogEntry) status = "catalog";
    else if (adminSizes.length > 0) status = "admin";
    if (!entry.valid) status = "invalid";

    return Object.assign({}, entry, {
      catalog: catalogEntry,
      adminSizes: adminSizes,
      adminCount: adminSizes.length,
      updatedAt: (table && table.updatedAt) || null,
      status: status
    });
  }).sort(function (a, b) {
    if (a.inSizing !== b.inSizing) return a.inSizing ? -1 : 1;
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return a.series.localeCompare(b.series, "en", { numeric: true });
  });
}

/** پوشش دادهٔ Cv روی سری‌های مؤثر در سایزینگ */
export function coverageSummary(list) {
  const all = Array.isArray(list) ? list : [];
  const sizing = all.filter(function (item) { return item.inSizing; });
  const withoutData = sizing.filter(function (item) {
    return !item.catalog && item.adminCount === 0;
  });

  return {
    total: sizing.length,
    withCatalog: sizing.filter(function (item) { return Boolean(item.catalog); }).length,
    withAdmin: sizing.filter(function (item) { return item.adminCount > 0; }).length,
    withoutData: withoutData.length,
    missing: withoutData.map(function (item) { return item.series; }),
    percent: sizing.length ? Math.round(((sizing.length - withoutData.length) / sizing.length) * 100) : 0,
    other: all.length - sizing.length
  };
}

/** بدنهٔ خروجی JSON برای پشتیبان‌گیری یا انتقال بین محیط‌ها */
export function exportTables(tables) {
  const source = tables && typeof tables === "object" ? tables : {};
  const series = {};
  Object.keys(source).forEach(function (id) {
    const entry = source[id] || {};
    const sizes = Array.isArray(entry.sizes) ? entry.sizes : [];
    series[id] = { sizes: sizes, updatedAt: entry.updatedAt || null };
  });
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), series: series };
}