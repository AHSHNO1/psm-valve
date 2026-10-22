// ============================================================
// valve-cv-estimate.js — برآورد مهندسی Cv برای سری‌هایی که دادهٔ اندازه‌گیری‌شده ندارند
// ============================================================
//
// این ماژول «خالص» است: نه fs، نه دیتابیس، نه React. دادهٔ اندازه‌گیری‌شده
// (data/valve-cv-catalog.json) و فهرست محصولات را به‌صورت آرگومان می‌گیرد و
// خروجی JSON می‌دهد. نوشتن فایل با scripts/estimate-cv.mjs انجام می‌شود.
//
// منطق (هیچ عدد سازنده‌ای از خود درآورده نمی‌شود):
//
//  ۱) قانون مقیاس Cv–DN از خودِ دادهٔ اندازه‌گیری‌شده برازش می‌شود:
//        Cv ≈ Cv0 · (DN / 25.4)^n
//     روی سری‌های گلوب سنجیده‌شده (۳۱۰۰۰ و ۵۱۰۰۰). توانِ به‌دست‌آمده n≈۱٫۹۴
//     یعنی ظرفیت کمی کندتر از سطح مقطع سوراخ (n=2) رشد می‌کند — همان رفتار
//     شناخته‌شدهٔ شیرهای کنترلی با پورت کاهش‌یافته در سایزهای بزرگ.
//
//  ۲) نسبت خانواده‌ها از دادهٔ «تیپیکال منتشرشده»ٔ موجود در خود پروژه
//     (VALVE_SIZES در lib/sizing-advanced.js — همان جدول Cv عمومی که موتور
//     سایزینگ وقتی جدول کاتالوگ ندارد به آن برمی‌گردد) نسبت به قانون گلوب
//     سنجیده می‌شود: ضریب توپیِ تمام‌بور ≈ میانهٔ این نسبت (≈۲٫۸، پراکندگی کم).
//     شیر توپی کنترلی (V-notch / segmented) و پروانه‌ای سپس با ضرایب
//     «استفادهٔ منتشرشده» نسبت به توپی تمام‌بور ساخته می‌شوند.
//
//  ۳) شکل منحنی، پلکان تریم‌ها، ratio50 و rangeability همگی از میانهٔ
//     تریم‌های اندازه‌گیری‌شدهٔ همان مشخصه استخراج می‌شوند (نه فرمول کتابی)،
//     تا با Encoding موجود در کاتالوگ سازگار بمانند:
//        curve[i]  = Cv در بازشدگی ۱۰، ۲۰، …، ۱۰۰ درصد
//        ratio50   = curve[4] / curve[9]
//        rangeability = curve[9] / curve[0]
//
//  ۴) خودآزمون (back-test): با روش «یک سری را بیرون بگذار» (LOSO) خطای
//     واقعیِ پیش‌بینی یک سری ناشناخته گزارش می‌شود؛ همان عدد مبنای
//     level اطمینان (confidence) و بازهٔ خطا (errorPct) است.
//
// ۵) محصولات عملگر/متفرقه «بدنهٔ جریان» ندارند: هیچ Cvای برایشان ساخته
//     نمی‌شود و صریحاً رد می‌شوند. شیر اطمینان هم بدون بازهٔ سایز اعلامی
//     رد می‌شود (ظرفیت آن با سطح مؤثر اریفیس API 526 و Kd تعریف می‌شود،
//     نه با نردبان تریم Cv — مسیر lib/psv-sizing.js).
//
// هشدار دقت: همهٔ خروجی‌ها «برآورد اولیه» هستند و باید با دادهٔ آزمون
// سازنده تأیید شوند (هم‌راستا با engineeringDisclaimer ابزار سایزینگ).
// ============================================================

import { getSeriesProfile, VALVE_SIZES } from "./sizing-advanced.js";
import { parseSizeRange } from "./valve-catalog.js";

/** همان schemaVersion دادهٔ مرجع، تا مصرف‌کننده‌های موجود بدون تغییر بخوانند */
export const SCHEMA_VERSION = 1;
export const PROVENANCE = "estimated";
export const METHOD_ID = "measured-cv-scaling-law + published-family-ratio";

/** مبنای برازش: سری‌هایی که Cv اندازه‌گیری‌شدهٔ بدنه دارند */
export const FIT_BASIS_SERIES = ["31000", "51000"];
/** همهٔ سری‌های دارای دادهٔ کاتالوگ (برای گزارش) */
export const MEASURED_SERIES = ["31000", "38000", "51000"];

/**
 * سری ۳۸۰۰۰ در فایل کاتالوگ فقط تریم‌های ریز‌جریان (micro-flow) دارد؛
 * cvMax آن ظرفیت بدنه نیست، بنابراین نه در برازش شرکت داده می‌شود و نه
 * خطای آن در «بازهٔ اطمینان» روش وارد می‌شود.
 */
export const MICRO_FLOW_SERIES = {
  "38000":
    "سری تریم ریزجریان (micro-flow): بزرگ‌ترین تریم کاتالوگی ۲٫۳–۳٫۸ است، نه ظرفیت بدنه؛ خارج از مبنای برازش."
};

/**
 * رابطهٔ منتشرشدهٔ Cv/سطح مقطع:  Cv ≈ 29.9 · Cd · d²  (d بر حسب اینچ)
 * فقط برای تفسیر فیزیکی ضرایب خانواده به‌کار می‌رود (مقدار «کاپاسیتهٔ ایده‌آلِ
 * تمام‌بور»)، نه برای ساخت مستقیم Cv.
 */
export const CV_IDEAL_AREA_COEFFICIENT = 29.9;

/** نردبان سایز R20 همان convention فایل کاتالوگ (DN06 … DN600).
 *  برچسب‌ها همیشه دو رقمی‌اند تا قالب `/^DN\d{2,4}$/` مصرف‌کننده‌های کاتالوگ
 *  (lib/valve-cv.js و پنل ادمین) برای سایزهای ریز هم قبول کند. */
export const DN_LADDER = [
  { dn: "DN06", dnMm: 6, nps: 0.125 },
  { dn: "DN08", dnMm: 8, nps: 0.25 },
  { dn: "DN10", dnMm: 10, nps: 0.375 },
  { dn: "DN15", dnMm: 15, nps: 0.5 },
  { dn: "DN20", dnMm: 20, nps: 0.75 },
  { dn: "DN25", dnMm: 25, nps: 1 },
  { dn: "DN32", dnMm: 32, nps: 1.25 },
  { dn: "DN40", dnMm: 40, nps: 1.5 },
  { dn: "DN50", dnMm: 50, nps: 2 },
  { dn: "DN65", dnMm: 65, nps: 2.5 },
  { dn: "DN80", dnMm: 80, nps: 3 },
  { dn: "DN100", dnMm: 100, nps: 4 },
  { dn: "DN125", dnMm: 125, nps: 5 },
  { dn: "DN150", dnMm: 150, nps: 6 },
  { dn: "DN200", dnMm: 200, nps: 8 },
  { dn: "DN250", dnMm: 250, nps: 10 },
  { dn: "DN300", dnMm: 300, nps: 12 },
  { dn: "DN350", dnMm: 350, nps: 14 },
  { dn: "DN400", dnMm: 400, nps: 16 },
  { dn: "DN450", dnMm: 450, nps: 18 },
  { dn: "DN500", dnMm: 500, nps: 20 },
  { dn: "DN600", dnMm: 600, nps: 24 }
];

/** ضرایب خانواده؛ multiplier برای گلوب = ۱ (خودِ داده) و بقیه نسبت به آن */
export const FAMILY_KEYS = ["globe", "ballFull", "ballControl", "butterfly"];

/**
 * ضرایب «استفادهٔ منتشرشده» نسبت به شیر توپی تمام‌بور.
 * بازهٔ منتشرشده در مستندات عمومی شیرها ذکر شده؛ مقدار میانی محافظه‌کارانه
 * انتخاب شده (کمتر از جدول‌های فروشنده‌ها)، چون تخمین Cvِ پایین در سایزینگ
 * خطای کم‌ظرفیتی نمی‌سازد (شیر بزرگ‌تر پیشنهاد می‌شود) در حالی که تخمین
 * بالا شیر کم‌ظرفیت پیشنهاد می‌دهد.
 */
export const PUBLISHED_FAMILY_UTILISATION = {
  ballFull: null, // مرجع: خودش ۱
  ballControl: {
    ratioToFullBall: 0.6,
    publishedRange: [0.55, 0.65],
    bandPct: 25,
    source: "V-notch/segmented control ball vs full-bore ball (published utilisation ≈ 0.55–0.65)"
  },
  butterfly: {
    ratioToFullBall: 0.45,
    publishedRange: [0.3, 0.45],
    bandPct: 25,
    source: "resilient-seat butterfly vs full-bore ball (published ≈ 30–45 %; upper bound used)"
  }
};

/** برچسب دقت — همان لحن engineeringDisclaimer ابزار سایزینگ */
export const ACCURACY_CAVEAT = {
  fa:
    "این مقادیر برآورد مهندسی از قانون مقیاس Cv–DN (برازش‌شده بر دادهٔ اندازه‌گیری‌شدهٔ سری‌های ۳۱۰۰۰ و ۵۱۰۰۰) به‌اضافهٔ نسبت منتشرشدهٔ خانواده‌ها هستند؛ جایگزین دادهٔ آزمون سازنده و محاسبهٔ کامل ISA-75.01.01 (IEC 60534-2-1) نیستند. قبل از سفارش، با واحد مهندسی پتروسازه میهن تأیید شوند.",
  en:
    "These Cv values are engineering estimates produced from a Cv–DN scaling law fitted to measured catalogue data (series 31000 and 51000) plus published valve-family ratios. They are preliminary and are not a substitute for manufacturer test data or a complete ISA-75.01.01 (IEC 60534-2-1) calculation. Confirm with the Engineering Department of Petro Sazeh Mihan Co. before ordering."
};

// ============================================================
// ۱) طبقه‌بندی محصول: بدنهٔ جریان دارد یا نه؟
// ============================================================

/**
 * قاعدهٔ طبقه‌بندی. kind:
 *   flow-body  → ظرفیت جریان دارد (Cv قابل برآورد)
 *   orifice    → شیر اطمینان؛ ظرفیت با اریفیس API 526/Kd (بدون Cv کاتالوگی)
 *   actuator   → عملگر/متفرقه؛ بدنهٔ جریان ندارد ⇒ Cv ندارد (رد می‌شود)
 *   unknown    → نشانه‌ای از بدنهٔ جریان پیدا نشد ⇒ رد می‌شود
 */
const CATEGORY_RULES = {
  "control-valves": { kind: "flow-body", family: "globe" },
  "rotary-globe-valves": { kind: "flow-body", family: "globe" },
  "high-temp-valves": { kind: "flow-body", family: "globe" },
  "piston-valves": { kind: "flow-body", family: "globe" },
  "pressure-regulating-valves": { kind: "flow-body", family: "globe" },
  "recirculation-valves": { kind: "flow-body", family: "globe" },
  "globe-valves": { kind: "flow-body", family: "globe" },
  "ball-valves": { kind: "flow-body", family: "ball" },
  "butterfly-valves": { kind: "flow-body", family: "butterfly" },
  "plug-valves": { kind: "flow-body", family: "ball" },
  "safety-valves": { kind: "orifice", family: null },
  "pneumatic-actuators": { kind: "actuator", family: null },
  "hydraulic-actuators": { kind: "actuator", family: null },
  "electronic-actuators": { kind: "actuator", family: null },
  "actuator-accessories": { kind: "actuator", family: null },
  accessories: { kind: "actuator", family: null }
};

/** نام/دستهٔ غیرشیری که باید حتی با دستهٔ ناشناخته رد شود */
const NON_VALVE_TEXT =
  /(actuator|عملگرد|عملگر|positioner|سولنوئید|solenoid|regulator\s*box|accessor|متفرقه|bracket|installation\s*kit|handwheel|filter\s*regulator)/i;
/** نام‌هایی که بدنهٔ جریان را تأیید می‌کنند */
const VALVE_TEXT = /(شیر|valve|vanne|클|regulator|let\s*down|letdown|desuperheat|piston)/i;

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.en, value.fa].filter(Boolean).join(" ");
}

/**
 * طبقه‌بندی محصول. آرگومان: شیء خام محصول (name/categoryId/series/spec…).
 * @returns {{ kind: string, family: string|null, reasons: string[] }}
 */
export function classifyProduct(product) {
  const categoryId = String((product && product.categoryId) || "").trim();
  const haystack = [
    textOf(product && product.name),
    textOf(product && product.short),
    textOf(product && product.series),
    categoryId
  ].join(" · ");

  const rule = CATEGORY_RULES[categoryId];
  const reasons = [];

  if (!rule) {
    if (NON_VALVE_TEXT.test(haystack)) {
      reasons.push(`دستهٔ «${categoryId || "نامعلوم"}» در جدول بدنه‌های جریان نیست و نام، عملگر/متفرقه است.`);
      return { kind: "actuator", family: null, reasons };
    }
    if (VALVE_TEXT.test(haystack)) {
      reasons.push(`دستهٔ «${categoryId || "نامعلوم"}» در جدول نیست اما نام، بدنهٔ شیر را نشان می‌دهد.`);
      return { kind: "flow-body", family: familyFromText(haystack, reasons), reasons };
    }
    reasons.push("هیچ نشانه‌ای از بدنهٔ جریان (شیر) در نام یا دستهٔ محصول یافت نشد؛ برآورد Cv انجام نمی‌شود.");
    return { kind: "unknown", family: null, reasons };
  }

  reasons.push(`دستهٔ «${categoryId}» → ${rule.kind}${rule.family ? ` / خانوادهٔ ${rule.family}` : ""}.`);

  if (rule.kind === "flow-body") {
    const profile = getSeriesProfile(product && product.series);
    if (profile && profile.type && profile.type !== rule.family) {
      // مثال: سری ۹۰۰۰۰ (ARC گردش مجدد) در sizing-advanced پروفایل «ball» دارد؛
      // بدنهٔ اصلی ARC از نوع گلوب خود-عمل است ⇒ گلوب محافظه‌کارانه‌تر است.
      reasons.push(
        `پروفایل ضرایب sizing-advanced برای سری ${product.series} نوع «${profile.type}» می‌دهد؛ طبقه‌بندی بدنه «${rule.family}» انتخاب شد (محافظه‌کارانه‌تر) و ناهمخوانی در notes ثبت می‌شود.`
      );
    }
    return { kind: "flow-body", family: rule.family, reasons };
  }

  if (rule.kind === "orifice") {
    reasons.push(
      "ظرفیت شیر اطمینان با سطح مؤثر اریفیس (API 526) و ضریب تخلیه Kd تعریف می‌شود، نه نردبان تریم Cv؛ مسیر محاسبه در lib/psv-sizing.js است."
    );
  }
  if (rule.kind === "actuator") {
    reasons.push("عملگر/متفرقه: هیچ المان جریان‌عبوری ندارد، پس Cv ندارد.");
  }
  return { kind: rule.kind, family: rule.family, reasons };
}

function familyFromText(text, reasons) {
  if (/ball|توپی/i.test(text)) return "ball";
  if (/butterfly|پروانه/i.test(text)) return "butterfly";
  if (/globe|گلوب|rotary|regulat/i.test(text)) return "globe";
  reasons.push("خانوادهٔ شیر از نام قابل تشخیص نبود؛ خانوادهٔ گلوب (محافظه‌کارانه‌ترین ضریب) در نظر گرفته می‌شود.");
  return "globe";
}

/** زیرخانوادهٔ دقیق‌تر (برای ضریب خانواده) — نوع بدنه + متن محصول */
export function familyKeyFor(classification, product) {
  const family = classification && classification.family;
  if (!family) return null;
  if (family === "butterfly") return "butterfly";
  if (family === "ball") {
    const text = `${textOf(product && product.name)} ${textOf(product && product.short)} ${textOf(
      product && product.categoryId
    )}`;
    const isControl = /(control|کنترلی|v-?port|v-?notch|segmented)/i.test(text);
    return isControl ? "ballControl" : "ballFull";
  }
  return "globe";
}

// ============================================================
// ۲) بازهٔ سایز اعلامی محصول
// ============================================================

const FA_DIGITS = /[۰-۹]/g;
function toLatinDigits(text) {
  return String(text || "").replace(FA_DIGITS, (d) => String(d.charCodeAt(0) - 1776));
}

/** "1 – 24 inch" → { min, max } (اینچ). از spec.size و در صورت نبود از features. */
export function sizeRangeFromProduct(product) {
  const fromSpec = parseSizeRange(product && product.spec && product.spec.size);
  if (fromSpec) return { ...fromSpec, source: "spec.size" };

  const features = textOf(product && product.features);
  const latin = toLatinDigits(features);
  const line = latin.match(/(?:size|اندازه|سایز)[^\d]{0,12}(\d+(?:\.\d+)?(?:\s*\d\/\d+)?(?:\s*\/\s*\d+)?)\D+(\d+(?:\.\d+)?(?:\s*\d\/\d+)?(?:\s*\/\s*\d+)?)/i);
  if (line) {
    const a = parseInchToken(line[1]);
    const b = parseInchToken(line[2]);
    if (a != null && b != null) return { min: Math.min(a, b), max: Math.max(a, b), source: "features" };
  }
  return null;
}

function parseInchToken(token) {
  const t = String(token).replace(/\s+/g, " ").trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = Number(t);
  return Number.isFinite(num) ? num : null;
}

/**
 * نردبان DN که داخل بازهٔ اینچیِ اعلامی می‌گنجد.
 * مقایسه بر حسب NPS است نه میلی‌متر، چون قرارداد استانداردِ DN↔NPS گرد است
 * (NPS 6 ≡ DN150 و NPS 1 ≡ DN25)؛ آستانه ۰٫۰۱ اینچ.
 */
export function dnLadderInRange(range) {
  if (!range) return [];
  return DN_LADDER.filter((row) => row.nps >= range.min - 0.01 && row.nps <= range.max + 0.01);
}

/** بزرگ‌ترین DN نردبان که از بازهٔ اعلامی فراتر رفته (برای note برش) */
export function dnLadderTruncatedBy(range) {
  if (!range) return { below: false, above: false };
  return {
    below: DN_LADDER[0].nps > range.min + 0.01,
    above: DN_LADDER[DN_LADDER.length - 1].nps < range.max - 0.01
  };
}

// ============================================================
// ۳) استخراج دادهٔ اندازه‌گیری‌شده و برازش قانون مقیاس
// ============================================================

/**
 * نقاط ظرفیت هر سری: cvMax در هر سایز.
 * سایزهایی که cvMax آن‌ها از سایز کوچک‌تر خود کم‌تر/برابر است «ظرفیت بریده»
 * (truncated trim set) علامت می‌خورند — مثلاً ۵۱۰۰۰ در DN100 برابر DN80 ثبت
 * شده. این‌ها اندازه‌گیری واقعی کاتالوگ هستند و در برازش می‌مانند (چون خروجی
 * این روش «بزرگ‌ترین تریم کاتالوگی» است نه ظرفیت تئوریک بدنه)، فقط در گزارش
 * به‌عنوان نکتهٔ کیفیت داده فهرست می‌شوند.
 */
export function measuredCapacityPoints(catalog) {
  const seriesIds = Object.keys((catalog && catalog.series) || {});
  return seriesIds.map((seriesId) => {
    const sizes = [...((catalog.series[seriesId] || {}).sizes || [])].sort(
      (a, b) => Number(a.dnMm) - Number(b.dnMm)
    );
    let previousCv = -1;
    const points = sizes.map((size) => {
      const cv = Number(size.cvMax);
      const point = {
        series: seriesId,
        dn: size.dn,
        dnMm: Number(size.dnMm),
        nps: typeof size.nps === "number" ? size.nps : null,
        cv,
        truncated: Number.isFinite(cv) && cv <= previousCv
      };
      if (Number.isFinite(cv)) previousCv = Math.max(previousCv, cv);
      return point;
    });
    return { series: seriesId, points };
  });
}

/** کمینهٔ مربعات در فضای لگاریتمی: Cv = cv0 · (DN/25.4)^exponent */
export function fitPowerLaw(points) {
  const clean = (points || []).filter(
    (p) => p && Number.isFinite(p.dnMm) && p.dnMm > 0 && Number.isFinite(p.cv) && p.cv > 0
  );
  if (clean.length < 2) return null;

  const xs = clean.map((p) => Math.log(p.dnMm / 25.4));
  const ys = clean.map((p) => Math.log(p.cv));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
  }
  if (!(sxx > 0)) return null;
  const exponent = sxy / sxx;
  const cv0 = Math.exp(my - exponent * mx);

  let ssr = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    ssr += Math.pow(ys[i] - (my + exponent * (xs[i] - mx)), 2);
    sst += Math.pow(ys[i] - my, 2);
  }
  return {
    cv0: roundSignificant(cv0, 4),
    exponent: roundSignificant(exponent, 4),
    r2: sst > 0 ? roundSignificant(1 - ssr / sst, 4) : null,
    samples: n,
    dnMmMin: Math.min(...clean.map((p) => p.dnMm)),
    dnMmMax: Math.max(...clean.map((p) => p.dnMm))
  };
}

export function lawCv(law, dnMm) {
  if (!law || !Number.isFinite(dnMm) || dnMm <= 0) return null;
  return law.cv0 * Math.pow(dnMm / 25.4, law.exponent);
}

/** ظرفیت ایده‌آل تمام‌بور (برای تفسیر فیزیکی ضریب خانواده) */
export function idealBoreCv(dnMm) {
  const inches = dnMm / 25.4;
  return CV_IDEAL_AREA_COEFFICIENT * inches * inches;
}

/**
 * قانون ظرفیت + ضرایب خانواده.
 * ضریب توپیِ تمام‌بور از نسبت «جدول تیپیکال منتشرشدهٔ پروژه» (VALVE_SIZES)
 * به «قانون گلوب برازش‌شده روی دادهٔ واقعی» در همان DNها می‌آید؛ میانهٔ این
 * نسبت‌ها ضریب خانواده و پراکندگی‌اش بازهٔ خطای آن است.
 */
export function buildCapacityLaw(catalog) {
  const bySeries = measuredCapacityPoints(catalog);
  // همهٔ cvMaxهای اندازه‌گیری‌شده (برچسب truncated فقط برای گزارش کیفیت داده است)
  const fitPoints = bySeries
    .filter((entry) => FIT_BASIS_SERIES.includes(entry.series))
    .flatMap((entry) => entry.points)
    .filter((point) => Number.isFinite(point.cv) && point.cv > 0);

  const globe = fitPowerLaw(fitPoints);
  if (!globe) return null;

  const generic = fitPowerLaw(
    VALVE_SIZES.map((row) => ({ dnMm: Number(String(row.dn).replace(/\D/g, "")), cv: Number(row.cv) }))
  );

  const measuredDns = [...new Set(bySeries.flatMap((entry) => entry.points.map((p) => p.dnMm)))].sort(
    (a, b) => a - b
  );
  const overlap = FIT_BASIS_SERIES.map((id) => {
    const entry = bySeries.find((item) => item.series === id);
    const dns = (entry ? entry.points : []).map((p) => p.dnMm);
    return { series: id, min: Math.min(...dns), max: Math.max(...dns) };
  });
  const innerMin = Math.max(...overlap.map((o) => o.min));
  const innerMax = Math.min(...overlap.map((o) => o.max));

  // نسبت جدول منتشرشده به قانون گلوب، فقط در DNهایی که هر دو پوشش دارند
  const ratioSamples = [];
  if (generic) {
    for (const dnMm of measuredDns) {
      const g = lawCv(generic, dnMm);
      const gl = lawCv(globe, dnMm);
      if (g && gl) ratioSamples.push({ dnMm, ratio: g / gl, source: "VALVE_SIZES / measured globe law" });
    }
  }
  const ballRatio = median(ratioSamples.map((r) => r.ratio));
  const ballBand =
    ballRatio > 0
      ? Math.max(...ratioSamples.map((r) => Math.abs((r.ratio - ballRatio) / ballRatio))) * 100
      : null;

  const families = {
    globe: {
      multiplier: 1,
      bandPct: 0,
      source: `مستقیم از دادهٔ اندازه‌گیری‌شدهٔ سری‌های ${FIT_BASIS_SERIES.join(" و ")} (بدون ضریب)`,
      publishedRange: null
    },
    ballFull: {
      multiplier: ballRatio != null ? roundSignificant(ballRatio, 3) : null,
      bandPct: ballBand != null ? Math.max(15, roundSignificant(ballBand, 2)) : 25,
      source:
        `میانهٔ نسبت جدول تیپیکال منتشرشدهٔ پروژه (VALVE_SIZES در lib/sizing-advanced.js) به قانون گلوب ` +
        `بر اساس ${ratioSamples.length} سایز اندازه‌گیری‌شده؛ پراکندگی ${
          ballBand != null ? roundSignificant(ballBand, 2) : "—"
        }٪ که برای اختلاف کلاس فشار/بور به حداقل ۱۵٪ افزایش یافت.`,
      publishedRange: null
    }
  };
  for (const key of ["ballControl", "butterfly"]) {
    const use = PUBLISHED_FAMILY_UTILISATION[key];
    families[key] = {
      multiplier: families.ballFull.multiplier != null
        ? roundSignificant(families.ballFull.multiplier * use.ratioToFullBall, 3)
        : null,
      bandPct: use.bandPct + (families.ballFull.bandPct || 0) / 2,
      source: use.source + (families.ballFull.multiplier != null
        ? ` × ضریب توپی تمام‌بور ${families.ballFull.multiplier}`
        : ""),
      publishedRange: use.publishedRange
    };
  }

  return {
    globe,
    genericTable: generic
      ? { cv0: generic.cv0, exponent: generic.exponent, samples: generic.samples, name: "VALVE_SIZES (جدول Cv عمومی موتور)" }
      : null,
    families,
    ratioSamples,
    envelope: {
      measuredMinDnMm: measuredDns.length ? measuredDns[0] : null,
      measuredMaxDnMm: measuredDns.length ? measuredDns[measuredDns.length - 1] : null,
      overlapMinDnMm: innerMin,
      overlapMaxDnMm: innerMax,
      perSeries: overlap
    },
    fitSamples: fitPoints.length,
    truncatedPoints: bySeries.flatMap((entry) => entry.points).filter((p) => p.truncated)
  };
}

/** Cv تخمینی یک DN در یک خانواده */
export function cvForSize(law, familyKey, dnMm) {
  const family = law && law.families && law.families[familyKey];
  if (!family || family.multiplier == null) return null;
  const base = lawCv(law.globe, dnMm);
  if (base == null) return null;
  return base * family.multiplier;
}

// ============================================================
// ۴) شکل منحنی و پلکان تریم — از میانهٔ تریم‌های اندازه‌گیری‌شده
// ============================================================

/**
 * میانگین/میانهٔ منحنی نرمال‌شده (curve/cv) برای یک مشخصه.
 * خروجی آرایهٔ ۱۰ تایی صعودی با آخرین عضو = ۱.
 */
export function normalisedCurveShape(catalog, characteristic) {
  const rows = [];
  const series = (catalog && catalog.series) || {};
  for (const seriesId of Object.keys(series)) {
    for (const size of series[seriesId].sizes || []) {
      for (const trim of size.trims || []) {
        if (trim.characteristic !== characteristic) continue;
        const cv = Number(trim.cv);
        if (!(cv > 0) || !Array.isArray(trim.curve) || trim.curve.length !== 10) continue;
        if (MICRO_FLOW_SERIES[seriesId]) continue; // تریم‌های ریزجریان شکل را به سمت خطی می‌کشند
        rows.push(trim.curve.map((v) => Number(v) / cv));
      }
    }
  }
  if (rows.length === 0) return null;
  const shape = [];
  for (let i = 0; i < 10; i++) {
    shape.push(quantile(rows.map((r) => r[i]), 0.5));
  }
  // صعودی و نرمال‌شده: ۰٪ → ۰ و ۱۰۰٪ → ۱
  for (let i = 1; i < shape.length; i++) shape[i] = Math.max(shape[i], shape[i - 1]);
  shape[shape.length - 1] = 1;
  return {
    characteristic,
    shape: shape.map((v) => roundSignificant(v, 3)),
    samples: rows.length,
    derivedFrom: "میانهٔ منحنی‌های تریم‌های اندازه‌گیری‌شده (بدون سری ریزجریان)"
  };
}

/** نسبت‌های پلکان تریم: میانه و چرک‌کافت ۲۵٪ِ Cv/CvMax در سایزهای اندازه‌گیری‌شده */
export function trimLadderRatios(catalog) {
  const ratios = [];
  const series = (catalog && catalog.series) || {};
  for (const seriesId of Object.keys(series)) {
    if (MICRO_FLOW_SERIES[seriesId]) continue;
    for (const size of series[seriesId].sizes || []) {
      const cvMax = Number(size.cvMax);
      if (!(cvMax > 0)) continue;
      for (const trim of size.trims || []) {
        const cv = Number(trim.cv);
        if (cv > 0 && cv < cvMax) ratios.push(cv / cvMax);
      }
    }
  }
  if (ratios.length === 0) return { reduced: null, low: null, samples: 0 };
  return {
    reduced: roundSignificant(quantile(ratios, 0.5), 3),
    low: roundSignificant(quantile(ratios, 0.25), 3),
    samples: ratios.length,
    derivedFrom: "میانه/چرک‌کافت ۲۵٪ نسبت Cv تریم به cvMax در کاتالوگ اندازه‌گیری‌شده"
  };
}

/**
 * منحنی ۱۰ نقطه‌ای از شکل نرمال‌شده. آخرین نقطه دقیقاً برابر Cv نامی
 * (همان invariant تست‌های کاتالوگ) و ratio50/rangeability از خودِ منحنی
 * نهایی محاسبه می‌شوند.
 */
export function buildCurve(cv, shape) {
  if (!(cv > 0) || !Array.isArray(shape) || shape.length !== 10) return null;
  const curve = shape.slice(0, 9).map((s) => roundSignificant(cv * s, 3));
  curve.push(cv);
  for (let i = 1; i < curve.length; i++) curve[i] = Math.max(curve[i], curve[i - 1]);
  curve[9] = cv;
  return curve;
}

export function curveMetrics(curve) {
  const rated = curve[9];
  if (!(rated > 0)) return { ratio50: null, rangeability: null };
  return {
    ratio50: roundSignificant(curve[4] / rated, 4),
    rangeability: curve[0] > 0 ? roundSignificant(rated / curve[0], 2) : null
  };
}

/**
 * پلکان تریم یک سایز: تریم تمام‌ظرفیت (equal%) + تریم کاهش‌یافته در صورت معقول بودن.
 * «معقول» = Cv کاهش‌یافته هنوز ≥ ۰٫۲ باشد؛ زیر آن مقادیر ریزجریان به قانون
 * ظرفیت بدنه ربطی ندارند و نباید از این روش ساخته شوند (سری ۳۸۰۰۰ را ببینید).
 */
export function buildTrims(cvFull, shape, ladder) {
  if (!(cvFull > 0) || !shape) return [];
  const list = [];
  const push = (cv, note) => {
    const curve = buildCurve(roundCv(cv), shape);
    if (!curve) return;
    list.push({
      cv: curve[9],
      characteristic: "equal",
      ratio50: curveMetrics(curve).ratio50,
      rangeability: curveMetrics(curve).rangeability,
      curve,
      ...(note ? { note } : {})
    });
  };
  push(cvFull, "trim-full");
  const reduced = ladder && ladder.reduced;
  const low = ladder && ladder.low;
  if (reduced && cvFull * reduced >= 0.2) push(cvFull * reduced, `trim-reduced:${roundSignificant(reduced, 3)}`);
  if (low && cvFull * low >= 0.2 && Math.abs(low - reduced) > 0.02) push(cvFull * low, `trim-low:${roundSignificant(low, 3)}`);
  return list.sort((a, b) => a.cv - b.cv);
}

// ============================================================
// ۵) خودآزمون (back-test)
// ============================================================

/**
 * خودآزمون روش روی همان دادهٔ اندازه‌گیری‌شده:
 *  - loso: هر سری مبنای برازش کنار گذاشته می‌شود و با قانونِ سری دیگر
 *    پیش‌بینی می‌شود → خطای واقعی «پیش‌بینی یک سری ناشناخته».
 *    آمار به دو ناحیه تقسیم می‌شود: داخل بازهٔ سایزهای سریِ مبنای برازش
 *    (in-envelope) و بیرون آن (extrapolated) — اکستراپولاسیون خطا را بالا
 *    می‌برد و باید در اطمینان همان ناحیه دیده شود.
 *  - pooled: باقی‌ماندهٔ قانونِ هر-دو-سری → خطای درون‌نمونه (خوش‌بینانه).
 * همهٔ cvMaxهای کاتالوگ در برازش شرکت داده می‌شوند (اندازه‌گیری واقعی است،
 * حتی اگر «ظرفیت بریده» به نظر برسد)؛ نقاط مشکوک فقط علامت می‌خورند و
 * جداگانه گزارش می‌شوند. سری ریزجریان (۳۸۰۰۰) خارج از مبنای برازش است و
 * خطای آن فقط برای تأیید همین کنارگذاشتن گزارش می‌شود.
 */
export function backTest(catalog, options = {}) {
  const basis = options.basis || FIT_BASIS_SERIES;
  const bySeries = measuredCapacityPoints(catalog);
  const perSeries = {};

  for (const entry of bySeries) {
    const isBasis = basis.includes(entry.series);
    const others = basis.filter((id) => id !== entry.series);
    const otherPoints = bySeries
      .filter((item) => others.includes(item.series))
      .flatMap((item) => item.points)
      .filter((p) => Number.isFinite(p.cv) && p.cv > 0);

    const law = fitPowerLaw(otherPoints);
    const inRange = (dnMm) => law && dnMm >= law.dnMmMin && dnMm <= law.dnMmMax;

    const points = entry.points
      .filter((p) => Number.isFinite(p.cv) && p.cv > 0)
      .map((p) => {
        const predicted = law ? lawCv(law, p.dnMm) : null;
        return {
          dn: p.dn,
          dnMm: p.dnMm,
          measured: p.cv,
          predicted: predicted == null ? null : roundSignificant(predicted, 4),
          errorPct: predicted == null ? null : round1((100 * (predicted - p.cv)) / p.cv),
          zone: inRange(p.dnMm) ? "in-envelope" : "extrapolated",
          truncatedInCatalogue: Boolean(p.truncated)
        };
      });

    const statsOf = (rows) => {
      const errs = rows.map((p) => Math.abs(p.errorPct)).filter(Number.isFinite);
      return {
        samples: errs.length,
        meanAbsPct: errs.length ? round1(errs.reduce((a, b) => a + b, 0) / errs.length) : null,
        medianAbsPct: errs.length ? round1(median(errs)) : null,
        maxAbsPct: errs.length ? round1(Math.max(...errs)) : null
      };
    };

    const inBasis = isBasis && others.length > 0;
    perSeries[entry.series] = {
      inFitBasis: isBasis,
      predictiveTest: inBasis,
      lawOf: others.length ? others.join("+") : null,
      lawSamples: otherPoints.length,
      points,
      all: statsOf(points),
      inEnvelope: statsOf(points.filter((p) => p.zone === "in-envelope")),
      extrapolated: statsOf(points.filter((p) => p.zone === "extrapolated")),
      truncatedPointsReported: points
        .filter((p) => p.truncatedInCatalogue)
        .map((p) => `${p.dn} (errorPct ${p.errorPct})`),
      note:
        MICRO_FLOW_SERIES[entry.series] ||
        (isBasis ? null : "سری اندازه‌گیری‌شدهٔ خارج از مبنای برازش.")
    };
  }

  // باقی‌ماندهٔ درون‌نمونهٔ قانونِ هر-دو-سری
  const pooledLaw = buildCapacityLaw(catalog);
  let pooled = null;
  if (pooledLaw) {
    const rows = bySeries
      .filter((entry) => basis.includes(entry.series))
      .flatMap((entry) => entry.points)
      .filter((p) => Number.isFinite(p.cv) && p.cv > 0)
      .map((p) => ({ errorPct: round1((100 * (lawCv(pooledLaw.globe, p.dnMm) - p.cv)) / p.cv) }));
    const errs = rows.map((r) => Math.abs(r.errorPct)).filter(Number.isFinite);
    pooled = {
      samples: errs.length,
      meanAbsPct: errs.length ? round1(errs.reduce((a, b) => a + b, 0) / errs.length) : null,
      medianAbsPct: errs.length ? round1(median(errs)) : null,
      maxAbsPct: errs.length ? round1(Math.max(...errs)) : null,
      law: pooledLaw.globe
    };
  }

  const basisReports = Object.entries(perSeries).filter(([, r]) => r.predictiveTest);
  /** آمار روی نقاط LOSO همهٔ سری‌های مبنای برازش، با فیلتر ناحیه */
  const pooledStats = (zone) => {
    const errs = basisReports
      .flatMap(([, r]) => r.points)
      .filter((p) => Number.isFinite(p.errorPct) && (zone == null || p.zone === zone))
      .map((p) => Math.abs(p.errorPct));
    return {
      samples: errs.length,
      meanAbsPct: errs.length ? round1(errs.reduce((a, b) => a + b, 0) / errs.length) : null,
      medianAbsPct: errs.length ? round1(median(errs)) : null,
      maxAbsPct: errs.length ? round1(Math.max(...errs)) : null
    };
  };

  return {
    method:
      "leave-one-series-out روی سری‌های مبنای برازش (۳۱۰۰۰ / ۵۱۰۰۰) + باقی‌ماندهٔ درون‌نمونهٔ قانون ترکیبی؛ آمار جدا برای داخل و خارج بازهٔ سری مبنا",
    perSeries,
    overall: {
      testedSeries: basisReports.map(([id]) => id),
      ...pooledStats(null),
      inEnvelope: pooledStats("in-envelope"),
      extrapolated: pooledStats("extrapolated"),
      perSeriesMean: Object.fromEntries(basisReports.map(([id, r]) => [id, r.all.meanAbsPct])),
      perSeriesMax: Object.fromEntries(basisReports.map(([id, r]) => [id, r.all.maxAbsPct]))
    },
    pooled,
    accuracyCaveat: ACCURACY_CAVEAT
  };
}

/**
 * بازهٔ خطا و سطح اطمینان یک سایز تخمینی.
 * مبنای عددی: خروجی backTest (نه حدس).
 *  - داخل همپوشانی دو سری مبنای برازش (DN50–DN200): میانگین خطای LOSO در ناحیهٔ in-envelope
 *  - داخل بازهٔ اندازه‌گیری‌شده ولی پوشش یک‌سری: بیشینهٔ خطای LOSO (با جریمهٔ اکستراپولاسیون)
 *  - بیرون بازهٔ اندازه‌گیری‌شده: ×۱٫۴ (اکستراپولاسیون محض)
 * خطای خانواده (ضریب توپی/پروانه‌ای) به‌صورت مجموع مربعات اضافه می‌شود.
 */
export function confidenceFor({ report, law, familyKey, dnMm }) {
  const loso = report && report.overall;
  if (!loso || !law || !Number.isFinite(loso.meanAbsPct) || !Number.isFinite(loso.maxAbsPct)) {
    return { bandPct: null, level: "unknown", value: null, why: "دادهٔ اندازه‌گیری‌شدهٔ کافی برای خودآزمون نبود." };
  }
  const env = law.envelope || {};
  const inEnvelopeMean = loso.inEnvelope && loso.inEnvelope.meanAbsPct;
  let lawBand;
  let zone;
  if (env.overlapMinDnMm != null && dnMm >= env.overlapMinDnMm && dnMm <= env.overlapMaxDnMm) {
    lawBand = Number.isFinite(inEnvelopeMean) ? inEnvelopeMean : loso.meanAbsPct;
    zone = "inside-two-series-overlap";
  } else if (dnMm >= (env.measuredMinDnMm || 0) && dnMm <= (env.measuredMaxDnMm || 1e9)) {
    lawBand = loso.maxAbsPct;
    zone = "inside-measured-range-single-series";
  } else {
    lawBand = loso.maxAbsPct * 1.4;
    zone = "extrapolated-outside-measured-range";
  }
  const familyBand = (law.families[familyKey] || {}).bandPct || 0;
  const bandPct = round1(Math.hypot(lawBand, familyBand));
  const level = bandPct <= 35 ? "medium" : bandPct <= 50 ? "low" : "very-low";
  const value = Math.max(0.05, Math.min(0.85, roundSignificant(0.9 - bandPct / 100, 2)));
  return {
    bandPct,
    level,
    value,
    zone,
    lawBandPct: round1(lawBand),
    familyBandPct: familyBand
  };
}

// ============================================================
// ۶) برآورد یک سری / کل کاتالوگ
// ============================================================

/**
 * برآورد یک سری.
 * @returns {object|null} ورودی ساختاریافتهٔ هم‌شکل با دادهٔ مرجع کاتالوگ،
 *          یا null وقتی محصول بدنهٔ جریان ندارد (رد صریح با دلایل).
 */
export function estimateSeries({ seriesId, products, catalog, law, shapes, ladder, report }) {
  const list = (products || []).filter((p) => String(p.series) === String(seriesId));
  if (list.length === 0) return null;
  law = law || buildCapacityLaw(catalog);
  if (!law) return null;
  report = report || backTest(catalog);
  shapes = shapes || { equal: normalisedCurveShape(catalog, "equal") };
  ladder = ladder || trimLadderRatios(catalog);

  const classifications = list.map((product) => ({ product, classification: classifyProduct(product) }));
  const flowBodies = classifications.filter((item) => item.classification.kind === "flow-body");
  if (flowBodies.length === 0) return null;

  const notes = [];
  const reasons = [];
  classifications.forEach(({ classification }) => reasons.push(...classification.reasons));

  // خانواده: اگر محصولات هم‌سری خانواده‌های مختلف دارند، محافظه‌کارانه‌ترین (کمینهٔ ضریب)
  const keys = [...new Set(flowBodies.map((item) => familyKeyFor(item.classification, item.product)))].filter(
    Boolean
  );
  if (keys.length === 0) return null;
  keys.sort((a, b) => (law.families[a].multiplier || 0) - (law.families[b].multiplier || 0));
  const familyKey = keys[0];
  if (keys.length > 1) {
    notes.push(
      `محصولات هم‌سری خانواده‌های مختلفی داشتند (${keys.join("، ")})؛ کم‌ظرفیت‌ترین ضریب خانواده انتخاب شد تا برآورد Cv بالاتر از واقعیت نباشد.`
    );
  }

  // بازهٔ سایز: اجتماع بازه‌های اعلامی همهٔ محصولات هم‌سری
  const ranges = flowBodies
    .map((item) => sizeRangeFromProduct(item.product))
    .filter(Boolean);
  let sizeRange = null;
  if (ranges.length) {
    sizeRange = {
      min: Math.min(...ranges.map((r) => r.min)),
      max: Math.max(...ranges.map((r) => r.max)),
      source: [...new Set(ranges.map((r) => r.source))].join("+")
    };
  }
  const ladderRows = sizeRange ? dnLadderInRange(sizeRange) : [];
  if (sizeRange && ladderRows.length === 0) {
    notes.push("هیچ سایز R20 استاندارد داخل بازهٔ سایز اعلامی نیفتاد؛ برآوردی تولید نشد.");
    return null;
  }
  if (!sizeRange) {
    notes.push("بازهٔ سایز در دادهٔ محصول اعلام نشده؛ نردبان استاندارد R20 کامل (DN06–DN600) استفاده شد و اطمینان یک پله کاهش یافت.");
  }
  if (sizeRange && sizeRange.max * 25.4 > (law.envelope.measuredMaxDnMm || 600)) {
    notes.push(
      `بازهٔ سایز اعلامی تا ${(sizeRange.max * 25.4).toFixed(0)} mm می‌رود؛ نردبان استاندارد تا DN600 برآورد می‌شود و فراتر از آن قابل اتکا نیست.`
    );
  }
  const perProductRanges = flowBodies.map((item) => ({
    slug: item.product.slug,
    range: sizeRangeFromProduct(item.product)
  }));
  if (perProductRanges.length > 1 && new Set(perProductRanges.map((r) => JSON.stringify(r.range))).size > 1) {
    notes.push(
      `این شمارهٔ سری ${perProductRanges.length} محصول با بازهٔ سایز متفاوت دارد؛ برآورد روی اجتماع بازه‌ها ساخته شده ` +
        "و برای هر نوع/زیرسری باید جداگانه تأیید شود (دادهٔ منتشرشدهٔ تفکیکی در دست نیست)."
    );
  }

  const sizes = (sizeRange ? ladderRows : DN_LADDER).map((row) => {
    const cvFull = cvForSize(law, familyKey, row.dnMm);
    const trims = cvFull ? buildTrims(cvFull, shapes.equal ? shapes.equal.shape : null, ladder) : [];
    const confidence = confidenceFor({ report, law, familyKey, dnMm: row.dnMm });
    return {
      nps: row.nps,
      dn: row.dn,
      dnMm: row.dnMm,
      cvMax: trims.length ? trims[trims.length - 1].cv : null,
      trims,
      provenance: PROVENANCE,
      confidence: confidence.level,
      confidenceValue: confidence.value,
      confidenceZone: confidence.zone,
      errorPct: confidence.bandPct
    };
  });

  // اطمینان سطح سری = بدترین حالت (بیشینهٔ بازهٔ خطا بین سایزها)
  const worstBand = Math.max(0, ...sizes.map((s) => (Number.isFinite(s.errorPct) ? s.errorPct : 0)));
  const seriesLevel = worstBand <= 0 ? "unknown" : worstBand <= 35 ? "medium" : worstBand <= 50 ? "low" : "very-low";

  return {
    sizes,
    series: String(seriesId),
    provenance: PROVENANCE,
    method: METHOD_ID,
    confidence: seriesLevel,
    errorPct: worstBand > 0 ? worstBand : null,
    basis: {
      family: familyKey,
      familyMultiplier: law.families[familyKey].multiplier,
      familyBandPct: law.families[familyKey].bandPct,
      familySource: law.families[familyKey].source,
      profile: getSeriesProfile(seriesId) || null,
      law: { cv0: law.globe.cv0, exponent: law.globe.exponent, basisSeries: FIT_BASIS_SERIES },
      curveShape: shapes.equal || null,
      trimLadder: ladder || null,
      sizeRange,
      productSizeRanges: perProductRanges,
      products: flowBodies.map((item) => item.product.slug),
      classificationReasons: reasons,
      backTest: {
        meanAbsPct: report.overall.meanAbsPct,
        maxAbsPct: report.overall.maxAbsPct,
        inEnvelopeMeanAbsPct: report.overall.inEnvelope.meanAbsPct,
        method: report.method
      }
    },
    notes: [...notes, ACCURACY_CAVEAT.fa]
  };
}

/**
 * کل سند برآورد. سری‌های دارای دادهٔ اندازه‌گیری‌شده حذف می‌شوند (دادهٔ واقعی
 * هرگز با برآورد بازنویسی نمی‌شود)؛ محصولات غیربدنه‌جریانی در refused می‌آیند.
 */
export function buildEstimateDocument({ catalog, products, generatedAt }) {
  const law = buildCapacityLaw(catalog);
  const report = backTest(catalog);
  const shapes = { equal: normalisedCurveShape(catalog, "equal") };
  const ladder = trimLadderRatios(catalog);

  const series = {};
  const refused = [];
  if (!law || !shapes.equal) {
    return {
      schemaVersion: SCHEMA_VERSION,
      provenance: PROVENANCE,
      meta: {
        generatedAt: generatedAt || new Date().toISOString(),
        source: "estimated from measured series + valve-type scaling",
        measuredBasis: [],
        backTest: report,
        law: null,
        accuracyCaveat: ACCURACY_CAVEAT
      },
      series,
      refused: [
        {
          series: null,
          reasons: ["دادهٔ مرجع کاتالوگ در دسترس نیست؛ بدون دادهٔ اندازه‌گیری‌شده هیچ برآوردی ساخته نمی‌شود."]
        }
      ]
    };
  }

  const measuredIds = new Set(Object.keys((catalog && catalog.series) || {}));
  const seriesIds = [...new Set((products || []).map((p) => String(p.series)).filter(Boolean))];

  for (const seriesId of seriesIds) {
    if (measuredIds.has(seriesId)) {
      refused.push({
        series: seriesId,
        status: "measured",
        reasons: ["این سری دادهٔ اندازه‌گیری‌شدهٔ کاتالوگ دارد؛ برآورد روی آن ساخته نمی‌شود."]
      });
      continue;
    }
    const estimated = estimateSeries({ seriesId, products, catalog, law, shapes, ladder, report });
    if (estimated) {
      series[seriesId] = {
        sizes: estimated.sizes,
        provenance: estimated.provenance,
        method: estimated.method,
        confidence: estimated.confidence,
        errorPct: estimated.errorPct,
        basis: estimated.basis,
        notes: estimated.notes
      };
    } else {
      const list = (products || []).filter((p) => String(p.series) === seriesId);
      const classifications = list.map((p) => classifyProduct(p));
      const kind = classifications.length ? mostSeriousKind(classifications) : "unknown";
      refused.push({
        series: seriesId,
        status: kind,
        products: list.map((p) => p.slug),
        reasons: classifications.flatMap((c) => c.reasons)
      });
    }
  }

  const stats = {
    estimatedSeries: Object.keys(series).length,
    refusedSeries: refused.filter((r) => r.status !== "measured").length,
    measuredSeriesSkipped: refused.filter((r) => r.status === "measured").length,
    sizes: Object.values(series).reduce((sum, entry) => sum + entry.sizes.length, 0),
    trims: Object.values(series).reduce(
      (sum, entry) => sum + entry.sizes.reduce((s, size) => s + size.trims.length, 0),
      0
    )
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    meta: {
      generatedAt: generatedAt || new Date().toISOString(),
      source:
        "estimated from measured series (data/valve-cv-catalog.json, VALVE_CV.xlsx) + valve-type scaling; NOT manufacturer test data",
      measuredBasis: FIT_BASIS_SERIES,
      measuredSeriesPresent: [...measuredIds],
      excludedFromBasis: Object.entries(MICRO_FLOW_SERIES).map(([id, reason]) => ({ series: id, reason })),
      law: {
        globe: law.globe,
        genericTable: law.genericTable,
        families: law.families,
        fitSamples: law.fitSamples,
        idealBoreCoefficient: CV_IDEAL_AREA_COEFFICIENT,
        truncatedMeasuredPoints: law.truncatedPoints.map((p) => `${p.series}/${p.dn}`),
        envelope: law.envelope
      },
      curveShape: shapes.equal,
      trimLadder: ladder,
      backTest: {
        method: report.method,
        overall: report.overall,
        pooled: report.pooled,
        perSeries: Object.fromEntries(
          Object.entries(report.perSeries).map(([id, r]) => [
            id,
            {
              inFitBasis: r.inFitBasis,
              predictiveTest: r.predictiveTest,
              lawOf: r.lawOf,
              all: r.all,
              inEnvelope: r.inEnvelope,
              extrapolated: r.extrapolated,
              truncatedPointsReported: r.truncatedPointsReported,
              note: r.note
            }
          ])
        ),
        points: Object.fromEntries(
          Object.entries(report.perSeries).map(([id, r]) => [id, r.points])
        )
      },
      confidenceScheme:
        "bandPct = خطای خودآزمون LOSO در ناحیهٔ DN (میانگین نقاط داخل بازهٔ سری مبنا برای همپوشانی DN50–DN200، " +
        "بیشینهٔ خطای LOSO برای بازهٔ تک‌سری، ×۱٫۴ برای اکستراپولاسیون) ⊕ بازهٔ ضریب خانواده (جمع مربعات)؛ " +
        "level: ≤۳۵٪ medium، ≤۵۰٪ low، بیشتر very-low. هیچ سطحی «تأییدشده» نیست: همه برآوردند.",
      stats,
      accuracyCaveat: ACCURACY_CAVEAT,
      openings: (catalog && catalog.openings) || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      unit: (catalog && catalog.unit) || "inch (NPS)",
      cvDefinition:
        (catalog && catalog.cvDefinition) ||
        "Cv بر پایهٔ آب (gpm، ۶۰°F، افت ۱ psi) در ۱۰۰٪ بازشدگی — مقدار برآوردی، نه اندازه‌گیری‌شده"
    },
    series,
    refused
  };
}

function mostSeriousKind(classifications) {
  const order = ["actuator", "orifice", "unknown", "flow-body"];
  const kinds = classifications.map((c) => c.kind);
  return order.find((kind) => kinds.includes(kind)) || "unknown";
}

// ============================================================
// کمک‌تابع‌ها
// ============================================================

function sortedNumbers(values) {
  return values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
}

function median(values) {
  return quantile(values, 0.5);
}

function quantile(values, q) {
  const list = sortedNumbers(values);
  if (list.length === 0) return null;
  const pos = Math.min(list.length - 1, Math.max(0, q * (list.length - 1)));
  const low = Math.floor(pos);
  const high = Math.ceil(pos);
  return list[low] + (list[high] - list[low]) * (pos - low);
}

/** گرد کردن به n رقم بامعنا — همان دقت دادهٔ کاتالوگ */
export function roundSignificant(value, digits = 3) {
  if (!Number.isFinite(value) || value === 0) return value;
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, digits - 1 - magnitude);
  return Math.round(value * factor) / factor;
}

/** گرد کردن به یک رقم اعشار (برای درصدها) */
function round1(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

/** Cv نامی: تا ۱۰ دو رقم اعشار، تا ۱۰۰۰ یک رقم، بالاتر مضرب ۵ (قرارداد کاتالوگ) */
export function roundCv(value) {
  if (!Number.isFinite(value)) return value;
  if (value < 10) return Math.round(value * 100) / 100;
  if (value < 1000) return Math.round(value * 10) / 10;
  return Math.round(value / 5) * 5;
}
