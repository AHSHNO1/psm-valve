// ============================================================
// Preliminary valve sizing estimates; these simplified property tables are not
// a substitute for a complete IEC 60534 calculation or manufacturer validation.
// ============================================================
// steam-tables.js — جدول فشردهٔ خواص آب و بخار (IAPWS-IF97)
// ------------------------------------------------------------
// داده‌ها گزیده‌ای از جدول‌های منتشرشدهٔ اشباع هستند (فشار مطلق bar،
// دمای اشباع °C، آنتالپی مایع اشباع hf و بخار اشباع hg بر حسب kJ/kg).
// لنگرهای دمای اشباع در بازهٔ ۰٫۲–۴۰ bar دقیقاً همان نقاط
// STEAM_SAT_TABLE در lib/sizing-advanced.js هستند تا دو موتور سازگار بمانند
// (آزمون متقابل در tests/thermal-valves.test.mjs).
//
// دقت قابل‌اعتماد در بازهٔ پشتیبانی‌شده (۰٫۰۲–۴۰ bar مطلق، ۲۰–۵۵۰ °C):
//   Tsat         ≈ ±۰٫۲ °C   (درون‌یابی خطی روی ln P)
//   hf           ≈ ±۵ kJ/kg
//   hg           ≈ ±۴ kJ/kg زیر ۲۰ bar و ±۸ kJ/kg در ۲۰–۴۰ bar (قلهٔ تخت hg)
//   h سوپرهیت   ≈ ±۲۵ kJ/kg تا سوپرهیت ۱۵۰ °C و ±۴۰ kJ/kg بالاتر از آن، چون
//                 قلهٔ cp در نزدیکی خط اشباع (۲٫۶–۲٫۸ در ۱۰–۲۰ bar برای ۵۰ °C
//                 نخست) در این مدل خطی حل نمی‌شود
//   چگالی بخار   ≈ ±۳٪
//   k = cp/cv    ≈ ±۵–۸٪ (برآورد گاز ایده‌آل، در نزدیکی اشباع ضعیف‌تر)
//
// در خارج از بازه هیچ برون‌یابی انجام نمی‌شود و { error: "outOfRange" }
// برگردانده می‌شود. تابع‌های عددی یا یک عدد متناهی برمی‌گردانند یا یک
// { error } — فراخوان باید با Number.isFinite(...) مقدار را بسنجد.
// این جدول جای محاسبهٔ کامل IAPWS-IF97 یا دادهٔ آزمایش‌شدهٔ سازنده را
// نمی‌گیرد: برآورد مقدماتی است، نه یک محاسبهٔ اعتبارسنجی‌شده.
// ============================================================

// نقاط اشباع: [فشار bar مطلق, دمای اشباع °C]
const SAT_T = [
  [0.02, 17.50], [0.05, 32.88], [0.1, 45.81], [0.2, 60.1], [0.5, 81.3],
  [1, 99.6], [1.5, 111.4], [2, 120.2], [3, 133.5], [4, 143.6], [5, 151.8],
  [6, 158.8], [8, 170.4], [10, 179.9], [12, 188.0], [15, 198.3], [20, 212.4],
  [30, 233.9], [40, 250.4]
];

// جدول اشباع: [فشار bar, hf, hg] بر حسب kJ/kg
const SAT_H = [
  [0.02, 73.5, 2533.7], [0.05, 137.8, 2560.8], [0.1, 191.8, 2583.9],
  [0.2, 251.4, 2609.7], [0.5, 340.5, 2645.9], [1, 417.5, 2675.1],
  [2, 504.7, 2706.2], [3, 561.4, 2724.7], [4, 604.7, 2738.1],
  [6, 670.4, 2756.2], [8, 721.1, 2768.3], [10, 762.7, 2777.1],
  [15, 844.8, 2790.0], [20, 908.5, 2799.2], [25, 962.0, 2802.0],
  [30, 1008.4, 2803.2], [40, 1087.4, 2800.8]
];

// cp مؤثرِ بخار سوپرهیت بر حسب kJ/(kg·K) — میانگین روی ۰ تا ~۲۰۰ °C سوپرهیت
// که از آنتالپی‌های منتشرشدهٔ سوپرهیت به دست آمده (dh/dT). قلهٔ cp در نزدیکی
// خط اشباع در این میانگین «پخش» شده است؛ به همین دلیل خطای آنتالپی سوپرهیت
// تا ±۲۵ kJ/kg مجاز است.
const SUPERHEAT_CP = [
  [0.02, 1.89], [0.05, 1.90], [0.1, 1.91], [0.2, 1.93], [0.5, 1.96],
  [1, 1.99], [2, 2.09], [4, 2.20], [6, 2.28], [8, 2.32], [10, 2.35],
  [15, 2.42], [20, 2.50], [25, 2.58], [30, 2.65], [40, 2.75]
];

// ضریب انطباق Z در بخار اشباع — از حجم ویژهٔ اشباع (vg) منتشرشده محاسبه شده:
// Z = P·vg/(Rs·Tsat) با Rs = 461.52 J/(kg·K).
const Z_SAT = [
  [0.02, 0.999], [0.05, 0.998], [0.1, 0.996], [0.2, 0.995], [0.5, 0.990],
  [1, 0.985], [2, 0.977], [4, 0.963], [6, 0.952], [8, 0.941], [10, 0.930],
  [15, 0.909], [20, 0.887], [25, 0.872], [30, 0.856], [40, 0.825]
];

// ثابت‌های فیزیکی
const MW_KG_KMOL = 18.0153; // جرم مولی آب (kg/kmol)
const R_UNIV = 8314; // J/(kmol·K) — با MW_KG_KMOL جفت می‌شود
const R_SPECIFIC = 461.52; // J/(kg·K) = 8314/18.0153
const R_KJ_PER_KG_K = 0.46152; // همان Rs بر حسب kJ/(kg·K)

export const STEAM_TABLE_RANGE = {
  minPressureBar: 0.02,
  maxPressureBar: 40,
  minTempC: 20,
  maxTempC: 550
};

/** بازهٔ فشار مطلق که جدول پوشش می‌دهد. */
function pressureInTable(pBar) {
  const lo = SAT_T[0][0];
  const hi = SAT_T[SAT_T.length - 1][0];
  return Number.isFinite(pBar) && pBar >= lo && pBar <= hi;
}

/** درون‌یابی خطی بر حسب ln(P) روی ستون یک جدول. خارج از بازه: null */
function interpLogP(rows, pBar, col) {
  if (!pressureInTable(pBar)) return null;
  for (let i = 1; i < rows.length; i++) {
    if (pBar <= rows[i][0]) {
      const p1 = rows[i - 1][0];
      const p2 = rows[i][0];
      const w = (Math.log(pBar) - Math.log(p1)) / (Math.log(p2) - Math.log(p1));
      return rows[i - 1][col] + w * (rows[i][col] - rows[i - 1][col]);
    }
  }
  return rows[rows.length - 1][col];
}

function outOfRange() {
  return { error: "outOfRange" };
}

// ============================================================
// اشباع: دما ↔ فشار
// ============================================================

/** دمای اشباع (°C) در فشار مطلق pBar. خارج از جدول: { error: "outOfRange" } */
export function saturationTempC(pBar) {
  const t = interpLogP(SAT_T, pBar, 1);
  return t == null ? outOfRange() : +t.toFixed(2);
}

/** فشار اشباع (bar مطلق) در دمای tempC. خارج از جدول: { error: "outOfRange" } */
export function saturationPressureBar(tempC) {
  const lo = SAT_T[0][1];
  const hi = SAT_T[SAT_T.length - 1][1];
  if (!Number.isFinite(tempC) || tempC < lo || tempC > hi) return outOfRange();
  for (let i = 1; i < SAT_T.length; i++) {
    if (tempC <= SAT_T[i][1]) {
      const t1 = SAT_T[i - 1][1];
      const t2 = SAT_T[i][1];
      const w = (tempC - t1) / (t2 - t1);
      const lnP = Math.log(SAT_T[i - 1][0]) + w * (Math.log(SAT_T[i][0]) - Math.log(SAT_T[i - 1][0]));
      return +Math.exp(lnP).toFixed(5);
    }
  }
  return SAT_T[SAT_T.length - 1][0];
}

/** Tsat (°C) — نام کوتاه‌تر مطابق درخواست UI. */
export function TsatC(pBar) {
  return saturationTempC(pBar);
}

// ============================================================
// آنتالپی (kJ/kg، مبنای رایج جداول بخار: hf ≈ 4.186·T از ۰ °C)
// ============================================================

/** آنتالپی مایع اشباع hf در فشار pBar. */
export function hSatLiquid(pBar) {
  const hf = interpLogP(SAT_H, pBar, 1);
  return hf == null ? outOfRange() : +hf.toFixed(1);
}

/** آنتالپی بخار اشباع hg در فشار pBar. */
export function hSatVapour(pBar) {
  const hg = interpLogP(SAT_H, pBar, 2);
  return hg == null ? outOfRange() : +hg.toFixed(1);
}

/** گرمای نهان تبخیر hfg = hg − hf (kJ/kg). */
export function hLatent(pBar) {
  const hf = interpLogP(SAT_H, pBar, 1);
  const hg = interpLogP(SAT_H, pBar, 2);
  if (hf == null || hg == null) return outOfRange();
  return +(hg - hf).toFixed(1);
}

/**
 * آنتالپی بخار سوپرهیت: h = hg(P) + cp_مؤثر(P)·(T − Tsat(P)).
 * اگر T زودتر از خط اشباع باشد (بخار تر) -> { error: "belowSaturation" }.
 */
export function hSuperheated(pBar, tempC) {
  if (!Number.isFinite(tempC) || tempC < STEAM_TABLE_RANGE.minTempC || tempC > STEAM_TABLE_RANGE.maxTempC) {
    return outOfRange();
  }
  const tsat = saturationTempC(pBar);
  const hg = hSatVapour(pBar);
  if (typeof tsat !== "number" || typeof hg !== "number") return outOfRange();
  if (tempC < tsat - 0.2) return { error: "belowSaturation" };
  const cp = superheatCp(pBar);
  return +(hg + cp * (tempC - tsat)).toFixed(1);
}

/** cp مؤثر بخار سوپرهیت در فشار pBar (kJ/(kg·K)). */
export function superheatCp(pBar) {
  const cp = interpLogP(SUPERHEAT_CP, pBar, 1);
  return cp == null ? outOfRange() : +cp.toFixed(3);
}

/**
 * آنتالپی یک مایع آب‌مانده (آب اسپری) بر حسب T فقط (kJ/kg).
 * برای مایع زیراشباع سهم فشار ناچیز است (<۲ kJ/kg در این بازه) و صرفاً
 * h ≈ cp_w·T با cp_w = 4.186 kJ/(kg·K) گرفته می‌شود.
 */
export function liquidWaterEnthalpy(tempC) {
  if (!Number.isFinite(tempC) || tempC < STEAM_TABLE_RANGE.minTempC || tempC > STEAM_TABLE_RANGE.maxTempC) {
    return outOfRange();
  }
  return +(4.186 * tempC).toFixed(1);
}

// ============================================================
// بخار: چگالی و نسبت گرمای ویژه
// ============================================================

/**
 * ضریب انطباق بخار: Z اشباع از جدول + هم‌رو به ۱ با سوپرهیت.
 * پلهٔ بازگشت (۱ − e^(−سوپرهیت/۱۵۰)) از دو نقطهٔ منتشرشده برازش شده:
 *   ۱۰ bar/300 °C: Z واقعی ۰٫۹۷۵ (برآورد ۰٫۹۶۸)
 *   ۱۰ bar/400 °C: Z واقعی ۰٫۹۸۷ (برآورد ۰٫۹۸۲)
 */
export function compressibilityZ(pBar, tempC) {
  const zSat = interpLogP(Z_SAT, pBar, 1);
  const tsat = interpLogP(SAT_T, pBar, 1);
  if (zSat == null || tsat == null || !Number.isFinite(tempC)) return outOfRange();
  const superheat = Math.max(0, tempC - tsat);
  const f = 1 - Math.exp(-superheat / 150); // ۰ در اشباع، به ۱ میل می‌کند
  return +(zSat + (1 - zSat) * f).toFixed(4);
}

/** چگالی بخار (kg/m³) با ρ = P·M/(Z·R·T)؛ R = 8314 J/(kmol·K)، M = 18.0153. */
export function steamDensity(pBar, tempC) {
  if (!Number.isFinite(tempC)) return outOfRange();
  if (tempC < STEAM_TABLE_RANGE.minTempC || tempC > STEAM_TABLE_RANGE.maxTempC) return outOfRange();
  const tsat = saturationTempC(pBar);
  if (typeof tsat !== "number") return outOfRange();
  if (tempC < tsat - 0.2) return { error: "belowSaturation" }; // مایع/بخار تر، نه بخار
  const z = compressibilityZ(pBar, tempC);
  if (typeof z !== "number") return outOfRange();
  const rho = (pBar * 1e5 * MW_KG_KMOL) / (z * R_UNIV * (tempC + 273.15));
  return rho > 0 ? +rho.toPrecision(5) : outOfRange();
}

/**
 * نسبت گرماهای ویژه k = cp/cv برای بخار (بدون بُعد).
 * گاز ایده‌آل: cv = cp − Rs ⇒ k = cp/(cp − Rs). در نزدیکی خط اشباع رفتار
 * واقعی از این مقدار فاصله می‌گیرد (±۵–۸٪)؛ برای ورودی k معادلهٔ گاز/بخار
 * IEC کافی است، نه برای تعیین دقیق ناحیهٔ خفه.
 */
export function specificHeatK(pBar, tempC) {
  const tsat = saturationTempC(pBar);
  if (typeof tsat !== "number") return outOfRange();
  if (!Number.isFinite(tempC)) return outOfRange();
  const cp = superheatCp(pBar);
  if (typeof cp !== "number") return outOfRange();
  // در فشارهای خیلی بالا مخرج به صفر نزدیک می‌شود؛ k را به ۱٫۰۲ کف‌دار می‌کنیم
  const k = cp / Math.max(R_KJ_PER_KG_K * 1.02, cp - R_KJ_PER_KG_K);
  return +Math.max(1.02, k).toFixed(3);
}

/** جرم مولی بخار (kg/kmol) — برای عدد ماخ. */
export const MOLECULAR_WEIGHT_STEAM = MW_KG_KMOL;

/** سرعت صوت بخار (m/s): a = √(k·Rs·T) با T بر حسب کلوین. */
export function steamSoundSpeed(pBar, tempC) {
  const k = specificHeatK(pBar, tempC);
  if (typeof k !== "number" || !Number.isFinite(tempC)) return outOfRange();
  return +Math.sqrt(k * R_SPECIFIC * (tempC + 273.15)).toFixed(1);
}

/**
 * رطوبت (کیفیت) مجاز بخار از روی «مارجین تا اشباع» — راهنمای ساده برای هشدار
 * فرسایش/شوک حرارتی؛ جایگزین اندازه‌گیری کیفیت بخار با کنتور نیست.
 */
export function saturationMarginC(pBar, tempC) {
  const tsat = saturationTempC(pBar);
  if (typeof tsat !== "number" || !Number.isFinite(tempC)) return outOfRange();
  return +(tempC - tsat).toFixed(1);
}
