// ============================================================
// PSV / PRV preliminary sizing — API RP 520 Part I + API 526 orifice selection
//
// هشدار مهم / IMPORTANT: این محاسبات «پیش‌طراحی» (preliminary) هستند و جایگزین
// محاسبهٔ گواهی‌شده نیستند. ظرفیت نهایی هر شیر اطمینان باید از جدول ظرفیت
// نامی ASME (stamped capacity) و ضرایب Kd، Kb، Kc تأییدشده توسط سازنده و از
// کاتالوگ آزمایش‌شده گرفته شود.
// All results are flagged `indicative: true` and must NOT be presented as
// validated API calculations.
// ============================================================

// فشار اتمسفر برای تبدیل گیج → مطلق (bar)
const ATM_BAR = 1.01325;
// تبدیل بار به کیلوپاسکال — معادلات API 520 فرم SI فشار را kPa می‌خواهند
const BAR_TO_KPA = 100;
// تبدیل اینچ مربع → میلی‌متر مربع (25.4² = 645.16)
const IN2_TO_MM2 = 645.16;

// ============================================================
// حروف استاندارد Orifice (API RP 520 / API 526) — ترتیب رسمی حروف:
// D E F G H J K L M N P Q R T؛ حروف I، O و S هرگز استفاده نمی‌شوند.
// مساحت‌های زیر «مساحت مؤثر» (effective orifice area) همان API 526 هستند و
// واحدشان in² است؛ cm² و mm² در همین فایل از همان عدد مشتق می‌شوند.
// API 526 بدنهٔ استاندارد تا حرف T (26.0 in² ≈ 167.7 cm²) تعریف می‌کند؛
// حروف U…Z در API 526 وجود ندارند (بیش از T یا چندشیری است یا بدنهٔ سفارشی
// سازنده)، پس اینجا اختراع نشده‌اند و `insufficient: true` برمی‌گردد.
// نشانه‌های سايز بدنه (inlet×orifice×outlet) همان سری رسمی API 526 است.
// ============================================================
export const API526_ORIFICES = [
  { letter: "D", areaIn2: 0.110, designations: ["1D2"] },
  { letter: "E", areaIn2: 0.196, designations: ["1E2"] },
  { letter: "F", areaIn2: 0.307, designations: ["1F2"] },
  { letter: "G", areaIn2: 0.503, designations: ["1G2", "2G3"] },
  { letter: "H", areaIn2: 0.785, designations: ["2H3"] },
  { letter: "J", areaIn2: 1.287, designations: ["3J4", "4J6"] },
  { letter: "K", areaIn2: 1.838, designations: ["3K4", "4K6"] },
  { letter: "L", areaIn2: 2.853, designations: ["4L6", "6L8"] },
  { letter: "M", areaIn2: 3.60,  designations: ["4M6", "6M8"] },
  { letter: "N", areaIn2: 4.34,  designations: ["4N6", "6N8"] },
  { letter: "P", areaIn2: 6.38,  designations: ["6P8", "8P10"] },
  { letter: "Q", areaIn2: 11.05, designations: ["6Q8"] },
  { letter: "R", areaIn2: 16.0,  designations: ["8R10"] },
  { letter: "T", areaIn2: 26.0,  designations: ["8T10"] }
].map(function (r) {
  // dn فقط از اولین نشانهٔ قطعی گرفته می‌شود: 1"=DN25، 2"=DN50، 3"=DN80، 4"=DN100، 6"=DN150، 8"=DN200، 10"=DN250
  const DN_BY_INCH = { 1: "DN25", 2: "DN50", 3: "DN80", 4: "DN100", 6: "DN150", 8: "DN200", 10: "DN250" };
  let dn = null;
  if (r.designations && r.designations.length > 0) {
    const m = r.designations[0].match(/^(\d+)[A-Z]?(\d+)$/);
    if (m) {
      const inlet = DN_BY_INCH[Number(m[1])];
      const outlet = DN_BY_INCH[Number(m[2])];
      if (inlet && outlet) dn = { inlet: inlet, outlet: outlet, nps: m[1] + "x" + m[2] + '"' };
    }
  }
  return Object.assign({}, r, {
    areaCm2: +(r.areaIn2 * 6.4516).toFixed(2),
    areaMm2: +(r.areaIn2 * IN2_TO_MM2).toFixed(1),
    dn: dn
  });
});

const LAST_ORIFICE = API526_ORIFICES[API526_ORIFICES.length - 1];

/**
 * انتخاب کوچک‌ترین orifice استاندارد API 526 که مساحت مؤثرش ≥ مساحت لازم است.
 * ورودی بر حسب cm². اگر بزرگ‌ترین orifice استاندارد (T = 167.74 cm²) هم کافی
 * نبود، همان سطر با `insufficient: true` برمی‌گردد تا UI هشدار چندشیری/بدنهٔ
 * سفارشی را نشان دهد — فراتر از T در API 526 حرفی وجود ندارد که اختراع شود.
 */
export function api526Orifice(areaCm2) {
  if (!Number.isFinite(areaCm2) || areaCm2 <= 0) return { error: "Orifice selection needs a positive required area in cm2" };
  for (const row of API526_ORIFICES) {
    if (row.areaCm2 >= areaCm2) {
      return { letter: row.letter, areaIn2: row.areaIn2, areaCm2: row.areaCm2, areaMm2: row.areaMm2, designations: row.designations, dn: row.dn, insufficient: false };
    }
  }
  return { letter: LAST_ORIFICE.letter, areaIn2: LAST_ORIFICE.areaIn2, areaCm2: LAST_ORIFICE.areaCm2, areaMm2: LAST_ORIFICE.areaMm2, designations: LAST_ORIFICE.designations, dn: LAST_ORIFICE.dn, insufficient: true };
}

/**
 * نسبت فشار بحرانی (critical/choked pressure ratio) برای گاز ایده‌آل — پیوست API 520:
 *   Pcrit/P1 = (2/(k+1))^(k/(k-1))
 * مقدار نوعی هوا (k=1.4) ≈ 0.528 است.
 */
export function criticalPressureRatio(k) {
  if (!Number.isFinite(k) || k <= 1) return null;
  return Math.pow(2 / (k + 1), k / (k - 1));
}

// محاسبهٔ خام C با دقت کامل (نمایش در خروجی گرد می‌شود)
function cRaw(k) {
  return 0.03948 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
}

/**
 * ضریب ظرفیت بخار C — فرم SI همانطور که در API 520 Part I آمده:
 *   C = 0.03948 · sqrt( k · (2/(k+1))^((k+1)/(k-1)) )
 * این ثابت 0.03948 دقیقاً متعلق به دستگاه SI است: W [kg/h]، P1 [kPa مطلق]،
 * T [K]، M [kg/kmol] و A [mm²]. در فرم USC مقدار C حدود ۵۲۰ (lb/h، in²،
 * psia، °R) است که اینجا استفاده نمی‌شود — واحد هر ثابت در همین سند قفل شده است.
 */
export function api520C(k) {
  if (!Number.isFinite(k) || k <= 1) return { error: "Isentropic exponent k must be greater than 1" };
  return +cRaw(k).toFixed(4);
}

// محاسبهٔ خام F2 با دقت کامل
function f2Raw(k, r) {
  return Math.sqrt((k / (k - 1)) * Math.pow(r, 2 / k) * ((1 - Math.pow(r, (k - 1) / k)) / (1 - r)));
}

/**
 * ضریب F2 جریان زیربحرانی بخار — معادلهٔ SI بخش ۵.۶.۴ (فرم نیاز به مساحت).
 * در فرم USC پیوست، ضریب ظرفیت f2 تعریف می‌شود (W = A·Kd·Kc·f2·√(M·P1·(P1−P2)/T))
 * و F2 = 1/f2 است. عدد ۱۷.۹ ثابت تبدیل همان دستگاه SI (kg/h، kPa، K → mm²) است.
 *   F2 = sqrt( (k/(k−1)) · r^(2/k) · (1 − r^((k−1)/k)) / (1 − r) ),  r = P2/P1
 */
export function subcriticalF2({ k, r } = {}) {
  if (!Number.isFinite(k) || k <= 1) return { error: "Isentropic exponent k must be greater than 1" };
  if (!Number.isFinite(r) || r <= 0 || r >= 1) return { error: "Backpressure ratio r = P2/P1 must be between 0 and 1" };
  const f2 = f2Raw(k, r);
  if (!Number.isFinite(f2) || f2 <= 0) return { error: "F2 evaluation failed for the given k and pressure ratio" };
  return +f2.toFixed(4);
}

// ============================================================
// کمکی: فشار تغییر از فشار تنظیم (گیج) — API 520 بند ۵.۳
// P1 (مطلق) = Pset (گیج) × (1 + overpressure%/100) + 1.01325
// کنوانسیون انباشت فشار (accumulation): ۱۰٪ برای شرایط غیرآتش (تک‌شیر)،
// ۱۶٪ برای چندنصب، ۲۱٪ برای شرایط آتش. مقادیر خارج از این‌ها مجاز نیستند.
// ============================================================
export function relievingPressure({ setPressureBar, overpressurePct } = {}) {
  if (!Number.isFinite(setPressureBar) || setPressureBar <= 0) return { error: "setPressureBar must be a positive gauge pressure in bar" };
  const op = Number.isFinite(overpressurePct) ? overpressurePct : 10;
  if (op < 0 || op > 21) return { error: "Overpressure must be between 0 and 21 percent (10% non-fire, 21% fire per ASME/API)" };
  return {
    P1RelievingBar: +(setPressureBar * (1 + op / 100) + ATM_BAR).toFixed(4),
    overpressurePct: op
  };
}

// ============================================================
// کمکی: بار تخلیهٔ انبساط حرارتی (thermal relief) از دبی حجمی مایع.
// محض تبدیل واحد است (W = Q·ρ) — سناریوهای حرارتی خودِ API 521 جداول
// زمان/شارژ جداگانه می‌خواهند که اینجا محاسبه نمی‌شود.
// ============================================================
export function reliefLoad(params = {}) {
  if (params.type !== "liquidThermal") return { error: "Only type 'liquidThermal' is supported by this helper" };
  const q = Number(params.qM3h);
  const rho = Number(params.densityKgM3);
  if (!(q > 0) || !(rho > 0)) return { error: "liquidThermal relief load needs positive qM3h and densityKgM3" };
  return { W: +(q * rho).toFixed(1), basis: "W = Q × rho (volumetric liquid flow converted to mass flow)" };
}

/**
 * ظرفیت یک orifice انتخاب‌شده با وارون‌کردن همان معادله — فقط با
 * Kd/Kb/F2 همان فرض‌های اولیه. ظرفیت نامی واقعی باید از پلاک ASME
 * (stamped capacity rating) خوانده شود، نه از این عدد.
 */
function orificeCapacity(fit, state) {
  if (!fit) return null;
  const aMm2 = fit.areaIn2 * IN2_TO_MM2;
  if (state.kind === "liquid") {
    // وارون معادلهٔ مایع: Q[L/min] = A·Kd·Kc·√(ΔP/G)/11.78 → kg/h = Q·60·G (ρ≈1000G)
    const dPkPa = state.dPBar * BAR_TO_KPA;
    const qLmin = (aMm2 * state.Kd * state.Kc * Math.sqrt(dPkPa / state.G)) / 11.78;
    return +(qLmin * 60 * state.G).toFixed(0);
  }
  if (state.regime === "critical") {
    return +((state.C * aMm2 * state.Kd * state.P1kPa * state.Kb * state.Kc) /
      Math.sqrt((state.T * state.Z) / state.M)).toFixed(0);
  }
  // subcritical: W = A·Kd·Kc·F2/17.9 · √(M·P1·(P1−P2)/(T·Z))، فشارها kPa
  return +((state.F2 * aMm2 * state.Kd * state.Kc / 17.9) *
    Math.sqrt((state.M * state.P1kPa * state.dPBar * BAR_TO_KPA) / (state.T * state.Z))).toFixed(0);
}

// ============================================================
// PSV SIZING — API RP 520 Part I، فرم SI
// امضای عمومی: فشارها bar (گیج؛ با absolute=false مطلق گرفته می‌شود)،
// دبی جرمی kg/h، دبی حجمی مایع m³/h، دما K، مساحت خروجی mm².
// ============================================================
export function calcPsvCv(params = {}) {
  const warnings = [];
  const notes = [];
  const add = (type, key, p, text) => warnings.push({ type, key, params: p || {}, text });

  const fluidRaw = params.fluidType != null ? String(params.fluidType).trim().toLowerCase() : null;
  const fluid = fluidRaw || (Number.isFinite(Number(params.W)) && Number(params.W) > 0 ? "gas" : null);
  if (!["gas", "vapor", "liquid", "steam"].includes(fluid)) {
    return { error: "fluidType must be one of: gas, vapor, liquid, steam (or give a positive mass flow W)" };
  }

  // --- دبی و مشخصات سیال ---
  const W = Number(params.W);
  const Qm3h = Number(params.Q);
  let M = Number(params.M);
  const kIn = params.k != null ? Number(params.k) : null;
  let k = kIn;
  const G = params.G != null ? Number(params.G) : 1.0; // چگالی نسبی مایع (به آب)

  if (fluid === "liquid") {
    if (!(Qm3h > 0)) return { error: "Liquid sizing requires a positive relief flow Q in m3/h" };
  } else {
    if (!(W > 0)) return { error: "Vapour/steam sizing requires a positive relief rate W in kg/h" };
    if (!Number.isFinite(M) || M <= 0) {
      if (fluid === "steam") { M = 18.015; }
      else return { error: "Molar mass M (kg/kmol) must be positive for vapour/gas sizing" };
    }
    if (!Number.isFinite(k) || k <= 1) {
      if (fluid === "steam") { k = 1.31; }
      else return { error: "Isentropic exponent k must be greater than 1 (typical air k = 1.4)" };
    }
  }

  // --- فشارها ---
  const hasSet = Number.isFinite(Number(params.setPressureBar)) && Number(params.setPressureBar) > 0;
  const setBarG = hasSet ? Number(params.setPressureBar) : null;
  const opPct = params.overpressurePct != null ? Number(params.overpressurePct) : (hasSet ? 10 : null);
  if (opPct != null && !(opPct >= 0 && opPct <= 21)) {
    return { error: "overpressurePct must be between 0 and 21 (10% non-fire, 16% multi-valve, 21% fire accumulation)" };
  }
  let P1Bar;
  let P2Bar;
  const P1WasSet = hasSet;
  if (hasSet) {
    // تبدیل گیج→مطلق: P1 = Pset·(1+overpressure/100) + 1.01325  (بند ۵.۳ API 520)
    P1Bar = setBarG * (1 + opPct / 100) + ATM_BAR;
  } else {
    P1Bar = Number(params.P1);
    if (!(P1Bar > 0)) return { error: "Provide either setPressureBar (gauge) or a positive absolute relieving pressure P1" };
    if (params.absolute === false) {
      P1Bar += ATM_BAR;
      notes.push("P1 was supplied as gauge and converted to absolute (+1.01325 bar).");
    }
  }
  P2Bar = Number(params.backPressureBar);
  if (!Number.isFinite(P2Bar)) P2Bar = params.absolute === false ? 0 : ATM_BAR; // بی‌علامت = تخلیه به اتمسفر
  else if (params.absolute === false) P2Bar += ATM_BAR;
  else if (P2Bar === 0) {
    // 0 در فیلد فشار پشتی یعنی «تخلیه به اتمسفر» (صفر گیج)، نه خلأ مطلق
    P2Bar = ATM_BAR;
    notes.push("Backpressure was entered as 0 — read as atmospheric discharge (1.01325 bar absolute).");
  }
  const P1RelievingBar = P1Bar;
  if (P2Bar >= P1Bar) return { error: "Backpressure P2 must be lower than the relieving pressure P1" };

  // --- ضرایب تصحیح ---
  const balanced = Boolean(params.balanced);
  const Kd = params.Kd != null ? Number(params.Kd) : (fluid === "liquid" ? 0.65 : 0.975);
  const Kc = params.Kc != null ? Number(params.Kc) : 1.0;
  let Kb = params.Kb != null ? Number(params.Kb) : 1.0;
  if (!(Kd > 0 && Kd <= 1)) return { error: "Kd must be in (0, 1] — use the manufacturer's certified discharge coefficient" };
  if (!(Kc > 0 && Kc <= 1)) return { error: "Kc must be in (0, 1] (0.9 with an upstream rupture disk, otherwise 1.0)" };
  if (!(Kb > 0 && Kb <= 1)) return { error: "Kb must be in (0, 1] — take it from the manufacturer backpressure curve" };
  if (fluid === "liquid" && params.Kd == null) {
    notes.push("Liquid Kd = 0.65 is the effective preliminary value of API 520 Part I; certified valves publish their own tested Kd.");
  }
  if (params.Kd == null) add("info", "kdDefault", { Kd: +Kd.toFixed(3), fluidType: fluid },
    "Preliminary Kd = " + Kd.toFixed(3) + " assumed — the ASME-certified reduced coefficient must come from the manufacturer.");

  // دمای تخلیه
  const T = fluid === "liquid" ? null : Number(params.T);
  if (fluid !== "liquid") {
    if (!Number.isFinite(T) || T <= 0) return { error: "Relieving temperature T must be positive and in Kelvin" };
    if (T < 60) add("info", "temperatureUnits", { T: T },
      "T = " + T + " looks like °C — this engine expects Kelvin for the API 520 equations.");
  }
  const Z = params.Z != null ? Number(params.Z) : 1.0;
  if (fluid !== "liquid" && !(Z > 0)) return { error: "Compressibility factor Z must be positive" };

  // --- مساحت لازم ---
  const P1kPa = P1Bar * BAR_TO_KPA;
  const dPBar = P1Bar - P2Bar;
  let areaMm2;
  let C = null;
  let F2 = null;
  let r = null;
  let criticalRatio = null;
  let regime = null;
  let equation;

  if (fluid === "liquid") {
    // A = 11.78·Q·√(G/ΔP)/(Kd·Kc·Kv·Kw) — فرم SI بخش ۵.۶.۳ (Q بر حسب L/min،
    // ΔP بر حسب kPa → A بر حسب mm²). دبی عمومی m³/h است و اینجا تبدیل می‌شود.
    // ضریب ویسکوزیته Kv و بازوی اهرمی Kw (شیرهای اهرمی) اعمال نشده — برآورد اولیه.
    regime = "dp-driven";
    const Qlmin = Qm3h * 1000 / 60;
    areaMm2 = (11.78 * Qlmin * Math.sqrt(G / (dPBar * BAR_TO_KPA))) / (Kd * Kc);
    equation = "API RP 520 Part I §5.6.3 — liquid, SI form (11.78, Kd 0.65 effective)";
  } else {
    criticalRatio = criticalPressureRatio(k);
    r = P2Bar / P1Bar;
    if (r <= criticalRatio) {
      // جریان بحرانی (choked): A = W/(C·Kd·P1·Kb·Kc)·√(T·Z/M) — فرم SI بخش ۵.۶.۲،
      // با P1 در kPa که داخل همین تابع از bar تبدیل می‌شود؛ خروجی A به mm².
      C = cRaw(k);
      regime = "critical";
      areaMm2 = (W / (C * Kd * P1kPa * Kb * Kc)) * Math.sqrt((T * Z) / M);
      equation = "API RP 520 Part I §5.6.2 — vapour/gas, critical flow, SI form (C = 0.03948 basis)";
    } else {
      // زیربحرانی: A = 17.9·W/(F2·Kd·Kc)·√(T·Z/(M·P1·(P1−P2)))، فشارها kPa → A mm².
      // Kb در این شاخه اعمال نمی‌شود چون اثر backpressure در خود F2 نهاده شده است.
      regime = "subcritical";
      if (!Number.isFinite(r) || r <= 0) return { error: "Backpressure ratio P2/P1 must be positive for the subcritical F2 equation" };
      F2 = f2Raw(k, r);
      if (!Number.isFinite(F2) || F2 <= 0) return { error: "F2 evaluation failed for the given k and pressure ratio" };
      if (params.Kb != null && Number(params.Kb) !== 1) {
        notes.push("A caller-supplied Kb was ignored in the subcritical branch — the API 520 F2 method already absorbs the backpressure effect.");
      }
      Kb = 1.0;
      areaMm2 = (17.9 * W / (F2 * Kd * Kc)) * Math.sqrt((T * Z) / (M * P1kPa * (dPBar * BAR_TO_KPA)));
      equation = "API RP 520 Part I §5.6.4 — vapour/gas, subcritical flow, SI form with F2 (17.9 basis)";
      add("warning", "subcriticalFlow", { r: +r.toFixed(3), criticalRatio: +criticalRatio.toFixed(3) },
        "Backpressure ratio " + r.toFixed(3) + " exceeds the critical ratio " + criticalRatio.toFixed(3) +
        " — flow is subcritical; capacity drops and the F2 equation was used.");
    }
    if (fluid === "steam") {
      // جدول ظرفیت نامی بخار (ضریب ۷۱۱ lb/h در فرم USC و تصحیح‌های دما/فشار)
      // عمداً پیاده‌سازی نشده — شکل دقیق و ضرایب آن را حدس نمی‌زنیم. بخار با
      // معادلهٔ بخار ایده‌آل (M=18.015، k≈1.31) محاسبه می‌شود و نتیجه راهنماست.
      notes.push("Steam routed through the ideal-vapour equation (M = 18.015 kg/kmol, k = 1.31). " +
        "ASME-certified steam capacity must be taken from the API 526 / ASME Section I rated-capacity table with the manufacturer's KS/KB coefficients; " +
        "this engine deliberately does not guess the steam capacity-table constants.");
      add("info", "steamIndicative", null,
        "Steam result is indicative only — use the ASME/API 526 rated-capacity table and certified vendor Kd for the final selection.");
    }
  }

  if (!Number.isFinite(areaMm2) || areaMm2 <= 0) return { error: "Computed relief area is not positive — check the input pressures and fluid properties" };
  if (fluid === "liquid" && (params.Kv != null || params.Kw != null)) {
    add("info", "liquidCoefficients", null, "Kv (viscosity) and Kw (leverage) corrections are not implemented — for viscous liquid relief obtain vendor curves.");
  }

  // --- انتخاب orifice و ظرفیت آن ---
  const fit = api526Orifice(areaMm2 / 100); // ورودی تابع بر حسب cm² است
  if (fit.error) return { error: fit.error };
  const selectedAreaMm2 = fit.areaIn2 * IN2_TO_MM2;
  const utilisation = areaMm2 / selectedAreaMm2;

  const state = {
    kind: fluid === "liquid" ? "liquid" : "vapour",
    regime: regime,
    G: G, M: M, T: T, Z: Z,
    P1kPa: P1kPa, dPBar: dPBar,
    Kd: Kd, Kb: Kb, Kc: Kc, C: C, F2: F2
  };
  const capacityKgH = orificeCapacity(fit, state);

  // --- معادل Cv/Kv — فقط برای مقایسهٔ متقاطع با sizing شیر کنترل ---
  // این رابطهٔ مایع (Kv = A[cm²]·√(G/ΔP)) با ΔP پایهٔ ۰.۱ بار (کنوانسیون
  // شیر اطمینان) است. Cv شیر اطمینان به این شکل تعریف نمی‌شود و عدد صرفاً
  // cross-check است؛ فرمول‌های اینچیِ ضریب‌دار (مثل 36000·A·Kd) اعتبار ندارند.
  const eqKv = +(fit.areaCm2 * Math.sqrt(G / 0.1)).toFixed(1);
  const eqCv = +(eqKv * 1.156).toFixed(1);

  // --- هشدارها (اشیاء قابل ترجمه در UI) ---
  if (hasSet) {
    if (opPct > 16) add("warning", "overpressure", { overpressurePct: opPct },
      "Overpressure " + opPct + "% is only permissible for fire cases (10% non-fire, 16% multi-valve, 21% fire).");
    else if (opPct > 10) add("info", "overpressure", { overpressurePct: opPct },
      "Overpressure " + opPct + "% exceeds the 10% non-fire accumulation — confirm a fire or multi-valve case.");

    // backpressure ماورای اتمسفر، نسبت به فشار تنظیم (گیج)
    const bpRatio = P2Bar > ATM_BAR ? (P2Bar - ATM_BAR) / setBarG : 0;
    if (!balanced && bpRatio > 0.10) {
      add("danger", "backpressureHigh", { ratio: +bpRatio.toFixed(3), type: "conventional" },
        "Built-up/superimposed backpressure is " + (bpRatio * 100).toFixed(1) + "% of set pressure — above the 10% limit for a conventional spring valve; use a balanced bellows or pilot-operated valve.");
    }
    if (balanced) {
      if (bpRatio > 0.5) {
        add("danger", "backpressureHigh", { ratio: +bpRatio.toFixed(3), type: "balanced" },
          "Backpressure " + (bpRatio * 100).toFixed(1) + "% of set exceeds the ~50% working range of bellows valves — use a pilot-operated valve.");
      } else if (bpRatio > 0.3) {
        add("warning", "backpressureHigh", { ratio: +bpRatio.toFixed(3), type: "balanced" },
          "Bellows capacity correction applies beyond ~30% backpressure — take Kb from the manufacturer curve; Kb = " + Kb.toFixed(3) + " used here.");
      }
    }
    if (P2Bar <= ATM_BAR + 1e-9 && fluid !== "liquid" && !balanced) {
      notes.push("Outlet assumed to relieve to atmosphere; built-up backpressure must still be checked on the tailpipe.");
    }
  } else if (fluid !== "liquid") {
    // بدون فشار تنظیم، set را با فرض overpressure=10% تقریب می‌زنیم تا هشدار
    // backpressure بی‌مصرف نماند — عدد تقریبی است و در params علامت می‌خورد.
    const approxSet = Math.max(P1Bar / 1.1 - ATM_BAR, 0.001);
    const bpRatio = P2Bar > ATM_BAR ? (P2Bar - ATM_BAR) / approxSet : 0;
    if (!balanced && bpRatio > 0.10) {
      add("warning", "backpressureHigh", { ratio: +bpRatio.toFixed(3), type: "conventional", approximated: true },
        "Backpressure is ~" + (bpRatio * 100).toFixed(1) + "% of the estimated set pressure (10% overpressure assumed) — above the 10% conventional-valve limit; supply setPressureBar for a precise check.");
    }
  }

  const inletLossPct = Number(params.inletLossPct);
  if (Number.isFinite(inletLossPct) && inletLossPct > 3) {
    add("warning", "inletPressureLoss", { inletLossPct: inletLossPct },
      "Inlet non-recoverable pressure loss " + inletLossPct + "% exceeds 3% of set — the API 520 one-third rule (inlet loss ≤ 3% of set) is violated; enlarge the inlet line.");
  }

  if (utilisation < 0.5) {
    add("info", "capacityMargin", { utilisation: +(utilisation * 100).toFixed(1), letter: fit.letter },
      "Selected " + fit.letter + " orifice runs at " + (utilisation * 100).toFixed(1) + "% utilisation — much larger than required; oversizing affects chatter/stability and causes churn — verify set-pressure stability with the vendor.");
  }
  if (fit.insufficient) {
    add("danger", "orificeInsufficient", { requiredCm2: +(areaMm2 / 100).toFixed(2), maxCm2: LAST_ORIFICE.areaCm2 },
      "Required area " + (areaMm2 / 100).toFixed(2) + " cm2 exceeds the largest orifice listed (" + LAST_ORIFICE.letter + " = " + LAST_ORIFICE.areaCm2 + " cm2) — multiple valves or a custom body is required.");
  }
  if (!P1WasSet && fluid !== "liquid") {
    notes.push("Relieving pressure P1 was supplied directly; the built-up backpressure warning needs setPressureBar to be evaluated precisely.");
  }

  const round = (v, n) => Number.isFinite(v) ? +v.toFixed(n) : null;
  return {
    fluidType: fluid,
    areaMm2: round(areaMm2, 1),
    areaCm2: round(areaMm2 / 100, 2),
    areaIn2: round(areaMm2 / IN2_TO_MM2, 3),
    requiredOrifice: fit,
    selectedAreaMm2: round(selectedAreaMm2, 1),
    utilisation: round(utilisation, 3),
    capacityKgH: capacityKgH,
    P1RelievingBar: round(P1RelievingBar, 4),
    P2Bar: round(P2Bar, 4),
    criticalRatio: round(criticalRatio, 4),
    backpressureRatio: round(r, 4),
    flowRegime: regime,
    Kd: round(Kd, 3),
    Kb: round(Kb, 3),
    Kc: round(Kc, 3),
    C: C != null ? round(C, 4) : null,
    F2: F2 != null ? round(F2, 4) : null,
    equivalentCv: eqCv,
    equivalentKv: eqKv,
    equivalentCvBasis: "liquid equation at ΔP = 0.1 bar — cross-check against control-valve Cv only, not a rated relief coefficient",
    equation: equation,
    indicative: true,
    notes: notes,
    warnings: warnings
  };
}
