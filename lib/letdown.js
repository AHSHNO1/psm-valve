// ============================================================
// Preliminary valve sizing estimates; these simplified checks are not a
// substitute for a complete IEC 60534 calculation or manufacturer validation.
// ============================================================
// letdown.js — سایزینگ ایستگاه لت‌داون / کاهش فشار گاز و بخار
// ------------------------------------------------------------
// معادلهٔ Cv دوباره نوشته نمی‌شود: شیر با همان calcGasCv / calcSteamCv در
// lib/sizing-advanced.js سایز می‌شود و این فایل فقط بررسی‌هایی را اضافه
// می‌کند که یک محاسبهٔ Cv تنها از قلم می‌اندازد:
//   • عدد ماخ و سرعت در دهانهٔ خروجی (فلنج) و در تریم
//   • معیار انرژی جنبشی خروجی ISA RP75.23  ke = ρ·v²/2
//   • تعداد مراحل پیشنهادی کاهش فشار از نسبت فشار
//   • دمای خروجی پس از انبساط آیزنتالپیک و مارجین تا اشباع (بخار)
//   • برآورد «راهنمای» نویز — این محاسبهٔ IEC 60534-8-3 نیست
//
// مدل فیزیکی مرحله‌ها: افت آنتالپی ایزنتروپیک هر مرحله به سرعت نفل تبدیل
// می‌شود (v = √(2·cp·T·(1 − π^((k−1)/k))) با π = Pout/Pin آن مرحله). این
// دقیقاً همان چیزی است که چندمرحله‌ای‌کردن آبی‌سازی را کم می‌کند: با n مرحله
// و نسبت یکسان، π = r^(1/n) کوچک‌تر و پس v، ke و ماخ تک‌مرحله‌ای کمتر می‌شود.
// سرعت/کیه و انرژی جنبشی در «آخرین مرحله» سنجیده می‌شوند چون ISA RP75.23
// انرژی جنبشی را در صفحهٔ خروجی شیر (فشار P2) ارزیابی می‌کند.
//
// همهٔ اعداد «برآورد مقدماتی» (indicative: true) هستند، نه یک محاسبهٔ
// اعتبارسنجی‌شدهٔ ISA-75.01.01 / IEC 60534-2-1؛ حدود ASME-rated capacity،
// نویز واقعی (IEC 60534-8-3) و آبی‌سازی/متریال تریم همگی دادهٔ سازنده‌اند.
// ============================================================

import { calcGasCv, calcSteamCv, cvToSize } from "./sizing-advanced.js";
import {
  compressibilityZ,
  hLatent,
  hSatLiquid,
  hSatVapour,
  hSuperheated,
  saturationMarginC,
  saturationTempC,
  specificHeatK,
  steamDensity,
  superheatCp,
  MOLECULAR_WEIGHT_STEAM
} from "./steam-tables.js";

const R_UNIV = 8314; // J/(kmol·K)
const NM3_PER_KMOL = 22.414; // حجم مولی در ۰ °C و ۱ atm (Nm³/kmol)

// ============================================================
// راهنماهای عددی — قواعد سرانگشتی رایج، نه حد طراحی استاندارد
// ============================================================
// ISA RP75.23 — انرژی جنبشی خروج تریم. حد رایج صنعتی «۳۰ ۰۰۰ lbf/(ft·s)» است:
//   1 lbf·ft/s = 1.3558 W  ⇒  30 000 lbf/(ft·s) = 40 674 W/ft²
//   1 ft² = 0.092903 m²    ⇒  ≈ 4.38e5 W/m²
// در ادبیات مهندسی همین حد را معمولاً گرد کرده و ۴۸۰ kW/m² (۰٫۴۸ MW/m²)
// می‌نویسند؛ اینجا همان ۴٫۸e5 W/m² به‌عنوان limit استفاده می‌شود و تبدیل
// دقیق‌تر ۴٫۳۷۸e5 برای نشان دادن عدد lbf/(ft·s) به کار می‌رود.
// این محاسبهٔ ke یک ارزیابی کامل RP75.23 (توزیع سرعت روی سطح تریم و
// مرحله‌بندی واقعی) نیست.
export const KE_LIMIT_W_M2 = 4.8e5;
export const KE_LBF_FT_S_TO_W_M2 = 4.3783e5; // ۳۰ ۰۰۰ lbf/(ft·s) بر حسب W/m²
export const KE_LIMIT_LBF_FT_S = 30000;
// راهنمای ماخ: ≤ ۰٫۳ در تریم/بدنه، ≤ ۰٫۵ در فلنج خروجی
export const BODY_MACH_GUIDE = 0.3;
export const OUTLET_MACH_GUIDE = 0.5;
// قاعدهٔ مرحله‌بندی: هر مرحله حداکثر تا نصف فشار مطلق ورودی خود (r ≤ ۰٫۵)
export const STAGE_RATIO_RULE = 0.5;
// کیفیت بخار خروجی: زیر این مقدار «بخار تر» و خطر ارودن است
export const WET_STEAM_QUALITY_LIMIT = 0.98;
// سایزهای لولهٔ رایج (DN) برای پیشنهاد قطر خروجی
const STANDARD_DN = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600];

function value(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function num(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

/** قطر سوراخ (mm) یک ردیف سایز شیر یا رشتهٔ «DN80». */
function dnOrSizeToMm(dn) {
  if (typeof dn === "number") return dn > 0 ? dn : 0;
  const m = String(dn || "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** نسبت پیشنهادی مراحل از فشارها (قاعدهٔ سرانگشتی r ≤ ۰٫۵ در هر مرحله). */
export function recommendedStagesFromRatio(p1, p2) {
  if (!(p1 > 0) || !(p2 > 0) || p2 >= p1) return null;
  const r = p2 / p1;
  return Math.max(1, Math.ceil(Math.log(r) / Math.log(STAGE_RATIO_RULE)));
}

// ============================================================
// دمای حالت خروجی پس از لت‌داون
// ============================================================
/**
 * حالت خروجی بعد از انبساط (تقریب رایج شیر: آیزنتالپیک — h ثابت).
 * بخار: با h2 = h1، کیفیت/سوپرهیت از جدول بخار می‌آید.
 * گاز: گاز ایده‌آل آیزنتالپیک ⇒ T ثابت؛ دمای ایزنتروپیک هم کنار آن گزارش
 * می‌شود چون مدل سرعت تریم (افت آنتالپی هر مرحله) به همان نیاز دارد.
 */
export function outletStateAfterLetdown({ fluid, p1Bar, p2Bar, tempInC, hInKJkg, k }) {
  if (fluid === "gas") {
    if (!Number.isFinite(p1Bar) || !(p2Bar > 0) || !Number.isFinite(tempInC)) return { error: "outOfRange" };
    const kk = k > 1 ? k : 1.4;
    const tInK = tempInC + 273.15;
    return {
      tempC: +(tInK - 273.15).toFixed(1), // آیزنتالپیک گاز ایده‌آل: دما ثابت
      isentropicTempC: +(tInK * Math.pow(p2Bar / p1Bar, (kk - 1) / kk) - 273.15).toFixed(1),
      dryness: 1
    };
  }
  const tsat2 = value(saturationTempC(p2Bar));
  if (tsat2 == null || !Number.isFinite(hInKJkg)) return { error: "outOfRange" };
  const hf2 = value(hSatLiquid(p2Bar));
  const hg2 = value(hSatVapour(p2Bar));
  const latent2 = value(hLatent(p2Bar));
  if (hf2 == null || hg2 == null || latent2 == null) return { error: "outOfRange" };

  if (hInKJkg >= hg2) {
    const cp = value(superheatCp(p2Bar)) ?? 2.0;
    return {
      tempC: +(tsat2 + (hInKJkg - hg2) / cp).toFixed(1),
      dryness: 1,
      superheated: true,
      h2KJkg: +hInKJkg.toFixed(1)
    };
  }
  // آیزنتالپیک ولی زیر خط اشباع ⇒ بخار تر (قطره می‌زند، ارودن)
  const h2 = hInKJkg;
  const x2 = Math.min(1, Math.max(0, (h2 - hf2) / latent2));
  return {
    tempC: +tsat2.toFixed(1),
    dryness: +x2.toFixed(3),
    superheated: false,
    wetSteam: true,
    h2KJkg: +h2.toFixed(1)
  };
}

/**
 * چگالی بخار در یک حالت با فشار/دما. اگر حالت از خط اشباع پایین‌تر رود
 * (حالت استاتیک ایزنتروپیک درون تریم) جدول بخار خروجی { error } می‌دهد؛
 * در آن حالت از گاز ایده‌آل با Zِ اشباع استفاده می‌شود و همین فرض در notes
 * ذکر می‌شود.
 */
function vapourDensity(pBar, tempC) {
  const direct = value(steamDensity(pBar, tempC));
  if (direct != null) return direct;
  const z = value(compressibilityZ(pBar, tempC)) ?? 1;
  const rho = (pBar * 1e5 * MOLECULAR_WEIGHT_STEAM) / (z * R_UNIV * (tempC + 273.15));
  return rho > 0 ? +rho.toPrecision(5) : null;
}

/** سرعت صوت (m/s) از k و جرم مولی. */
function soundSpeed(k, tempK, molarMassKgKmol) {
  if (!(k > 1) || !(tempK > 0) || !(molarMassKgKmol > 0)) return null;
  return +Math.sqrt((k * R_UNIV * tempK) / molarMassKgKmol).toFixed(1);
}

// ============================================================
// محاسبهٔ اصلی
// ============================================================
/**
 * @param {object} p
 * @param {"gas"|"steam"} p.fluid
 * @param {number} [p.W]  دبی جرمی (kg/h)
 * @param {number} [p.Q]  دبی نرمال گاز (Nm³/h)
 * @param {number} p.P1   فشار مطلق ورودی (bar)
 * @param {number} p.P2   فشار مطلق خروجی (bar)
 * @param {number} p.T1   دمای ورودی (°C)
 * @param {number} [p.MW] جرم مولی گاز (kg/kmol)
 * @param {number} [p.Gg] gravedad ویژهٔ گاز نسبت به هوا
 * @param {number} [p.k]  نسبت گرمای ویژه
 * @param {number} [p.Z]  ضریب انطباق گاز
 * @param {number} [p.stages] تعداد مراحل (پیش‌فرض: قاعدهٔ r ≤ ۰٫۵)
 * @param {number|string} [p.pipeDn] قطر لوله (DN)
 * @param {number} [p.dryness] کیفیت بخار ورودی (۱ = خشک)
 */
export function calcLetdown(params = {}) {
  const fluid = params.fluid === "steam" ? "steam" : params.fluid === "gas" ? "gas" : null;
  if (!fluid) return { error: 'fluid must be "gas" or "steam"' };

  const P1 = num(params.P1);
  const P2 = num(params.P2);
  const T1 = num(params.T1);
  if (!(P1 > 0) || !(P2 > 0)) return { error: "P1 and P2 (absolute bar) are required and must be > 0" };
  if (P2 >= P1) return { error: "P1 must be greater than P2" };
  if (!Number.isFinite(T1)) return { error: "T1 (inlet temperature in °C) is required" };

  const MW = num(params.MW) ?? (fluid === "steam" ? MOLECULAR_WEIGHT_STEAM : null);
  const Gg = num(params.Gg) ?? (MW != null && fluid === "gas" ? MW / 28.96 : null);
  if (fluid === "gas" && MW == null && Gg == null) {
    return { error: "Gas letdown needs MW (kg/kmol) or Gg (specific gravity vs air)" };
  }
  const mwFromGg = MW != null ? MW : Gg * 28.96;

  // دبی: هر دو شکل پذیرفته می‌شود (W = kg/h، Q = Nm³/h)
  let W = num(params.W);
  let Q = num(params.Q);
  if (W == null && Q != null) W = (Q * mwFromGg) / NM3_PER_KMOL;
  if (Q == null && W != null) Q = (W * NM3_PER_KMOL) / mwFromGg;
  if (!(W > 0) || !(Q > 0)) return { error: "Flow is required: W (kg/h) or Q (Nm³/h)" };

  const warnings = [];
  const notes = [];
  const add = (type, key, warnParams, text) => warnings.push({ type, key, params: warnParams || {}, text });

  const r = P2 / P1;
  const stagesRecommended = recommendedStagesFromRatio(P1, P2);
  const stagesGiven = num(params.stages);
  const stages = Math.max(1, Math.min(8, Math.round(stagesGiven ?? stagesRecommended ?? 1)));
  if (stagesGiven != null && stages !== stagesRecommended) {
    notes.push(`Stages were fixed by the caller (${stages}); the r ≤ ${STAGE_RATIO_RULE} rule of thumb suggests ${stagesRecommended}.`);
  }

  // k و cp از ورودی یا جدول بخار/گاز ایده‌آل
  let k = num(params.k);
  if (k == null) {
    if (fluid === "steam") {
      const margin = value(saturationMarginC(P1, T1));
      k = value(specificHeatK(P1, T1)) ?? (margin != null && margin > 2 ? 1.27 : 1.3);
    } else {
      k = 1.4;
    }
  }
  // cp = k/(k−1)·Rs (گاز کالریکای کامل) —Rs = 8314/MW  ⇒ واحد J/(kg·K)
  const rs = R_UNIV / mwFromGg;
  const cp = (k / (k - 1)) * rs;

  // ---- مسیر مرحله‌به‌مرحله: آیزنتالپیک بین مراحل (تقریب رایج شیر)
  const stagesList = [];
  let maxCv = 0;
  let governingIndex = 0;
  let delegate = null;
  let tStageIn = T1;
  let hIn = null;
  let drynessIn = num(params.dryness);
  if (fluid === "steam") {
    const tsat1 = value(saturationTempC(P1));
    const hf1 = value(hSatLiquid(P1));
    const lat1 = value(hLatent(P1));
    if (tsat1 == null || hf1 == null || lat1 == null) {
      return { error: `P1 = ${P1} bar is outside the steam property table (0.02–40 bar abs)` };
    }
    const superH = value(hSuperheated(P1, T1));
    if (drynessIn != null && drynessIn < 1) {
      // بخار تر: آنتالپی از کیفیت و جدول اشباع (دما = Tsat)
      hIn = hf1 + drynessIn * lat1;
      tStageIn = tsat1;
    } else if (superH != null) {
      hIn = superH;
      drynessIn = 1;
    } else {
      // T1 زیر خط اشباع بدون کیفیت داده‌شده: به‌صورت بخار خشک اشباع تفسیر می‌شود
      hIn = hf1 + lat1;
      tStageIn = tsat1;
      drynessIn = 1;
      add("info", "wetInlet", { T1, tsat: +tsat1.toFixed(1) },
        `Inlet temperature ${T1} °C is at/below saturation at ${P1} bar — treated as dry saturated vapour; pass dryness if the steam is wet`);
    }
  }

  for (let i = 0; i < stages; i++) {
    const pIn = P1 * Math.pow(r, i / stages);
    const pOut = P1 * Math.pow(r, (i + 1) / stages);
    let res;
    if (fluid === "steam") {
      res = calcSteamCv({ W, P1: pIn, P2: pOut, T: tStageIn, k, xT: num(params.xT) });
    } else {
      res = calcGasCv({ Q, Gg: Gg ?? mwFromGg / 28.96, T: tStageIn, P1: pIn, P2: pOut, Z: num(params.Z) ?? 1, k, xT: num(params.xT) });
    }
    if (res.error) return { error: res.error };
    if (res.Cv > maxCv) {
      maxCv = res.Cv;
      governingIndex = i;
      delegate = res;
    }

    // سرعت نفلِ ایده‌آلِ این مرحله از افت آنتالپی ایزنتروپیک آن
    const pi = pOut / pIn;
    const tInK = tStageIn + 273.15;
    const dHideal = cp * tInK * (1 - Math.pow(pi, (k - 1) / k)) / 1000; // kJ/kg
    const vTrim = Math.sqrt(Math.max(0, 2 * dHideal * 1000)); // m/s
    const tStaticK = tInK * Math.pow(pi, (k - 1) / k);
    stagesList.push({
      stage: i + 1,
      P1: +pIn.toFixed(3),
      P2: +pOut.toFixed(3),
      ratio: +pi.toFixed(3),
      inletTempC: +tStageIn.toFixed(1),
      Cv: res.Cv,
      Kv: res.Kv,
      size: res.size.dn,
      choked: res.choked,
      noise: res.noise,
      trimIdealVelocity: +vTrim.toFixed(1),
      trimIdealMach: +(vTrim / (soundSpeed(k, tStaticK, mwFromGg) || 1)).toFixed(3),
      isentropicTempC: +(tStaticK - 273.15).toFixed(1)
    });

    // ورودی مرحلهٔ بعد: آیزنتالپیک از pIn به pOut
    if (i < stages - 1) {
      if (fluid === "gas") {
        tStageIn = T1; // گاز ایده‌آل: h فقط تابع T است
      } else {
        const st = outletStateAfterLetdown({ fluid: "steam", p1Bar: pIn, p2Bar: pOut, tempInC: tStageIn, hInKJkg: hIn, k });
        if (st.error) break;
        tStageIn = st.tempC;
      }
    }
  }
  if (!delegate) return { error: "Stage calculation failed" };
  const Cv = maxCv;
  const Kv = Cv / 1.156;
  const size = cvToSize(Cv);

  // ---- حالت خروجی در فلنج (آیزنتالپیک از P1 به P2)
  const outletState = fluid === "steam"
    ? outletStateAfterLetdown({ fluid: "steam", p1Bar: P1, p2Bar: P2, tempInC: T1, hInKJkg: hIn, k })
    : outletStateAfterLetdown({ fluid: "gas", p1Bar: P1, p2Bar: P2, tempInC: T1, k });
  const outletTempC = value(outletState.tempC);
  const drynessOut = value(outletState.dryness) ?? 1;
  const satMargin = outletTempC != null ? +(outletTempC - (value(saturationTempC(P2)) ?? outletTempC)).toFixed(1) : null;

  // ---- سرعت/ماخ در صفحهٔ خروجی (فلنج): پیوستگی با چگالی واقعیِ خروجی
  const pipeDn = dnOrSizeToMm(params.pipeDn); // accepts 80 or "DN80"
  const outletDnMm = pipeDn > 0 ? pipeDn : dnOrSizeToMm(size.dn);
  const idM = outletDnMm / 1000;
  const areaM2 = Math.PI * (idM / 2) * (idM / 2);
  let rhoOut = null;
  let qActualM3h = null;
  if (outletTempC != null) {
    if (fluid === "steam") {
      rhoOut = vapourDensity(P2, outletTempC);
      if (rhoOut != null && drynessOut < 1) {
        // تخمین چگالی بخار تر: ρ_mix ≈ x·ρ_vap (حجم مایع ناچیز است)
        rhoOut = +(rhoOut * drynessOut).toPrecision(4);
      }
    } else {
      const z = num(params.Z) ?? 1;
      rhoOut = +((P2 * 1e5 * mwFromGg) / (z * R_UNIV * (outletTempC + 273.15))).toPrecision(5);
    }
    qActualM3h = rhoOut != null && rhoOut > 0 ? W / rhoOut : null;
  }
  const outletVelocity = qActualM3h != null && areaM2 > 0 ? +(qActualM3h / 3600 / areaM2).toFixed(2) : null;
  const aOut = outletTempC != null ? soundSpeed(k, outletTempC + 273.15, mwFromGg) : null;
  const outletMach = outletVelocity != null && aOut ? +(outletVelocity / aOut).toFixed(3) : null;

  // ---- ISA RP75.23: انرژی جنبشی در آخرین مرحله (صفحهٔ خروجی تریم)
  const lastStage = stagesList[stagesList.length - 1];
  const trimVelocity = lastStage.trimIdealVelocity;
  const trimStaticTempC = lastStage.isentropicTempC;
  let rhoTrim = null;
  if (fluid === "steam") {
    rhoTrim = vapourDensity(P2, trimStaticTempC);
  } else {
    const z = num(params.Z) ?? 1;
    rhoTrim = +((P2 * 1e5 * mwFromGg) / (z * R_UNIV * (trimStaticTempC + 273.15))).toPrecision(5);
  }
  const kineticEnergy = rhoTrim != null && trimVelocity != null ? +(rhoTrim * trimVelocity * trimVelocity / 2).toFixed(0) : null;
  const keRatio = kineticEnergy != null ? +(kineticEnergy / KE_LIMIT_W_M2).toFixed(2) : null;
  const trimMach = lastStage.trimIdealMach;

  // ---- قطر پیشنهادی لولهٔ خروجی (بر پایهٔ ماخ ≤ ۰٫۵ در فلنج)
  let recommendedOutletDn = null;
  if (qActualM3h != null && aOut != null) {
    const vLimit = OUTLET_MACH_GUIDE * aOut;
    const dReqM = Math.sqrt((4 * (qActualM3h / 3600 / vLimit)) / Math.PI);
    const dReqMm = dReqM * 1000;
    recommendedOutletDn = STANDARD_DN.find((dn) => dn >= dReqMm) ?? null;
    if (recommendedOutletDn == null && dReqMm > 0) {
      notes.push(`Outlet line needs ~${dReqMm.toFixed(0)} mm bore for Mach ≤ ${OUTLET_MACH_GUIDE} — beyond the listed DN range; an expander/diffuser outlet is mandatory.`);
    } else if (recommendedOutletDn != null) {
      notes.push(`Outlet line: ${dReqMm.toFixed(0)} mm bore is needed for Mach ≤ ${OUTLET_MACH_GUIDE} at P2 (recommended DN${recommendedOutletDn}); the valve body itself is sized on Cv, not on this.`);
    }
  }

  // ---- برآورد «راهنمای» نویز — همان شکل log10 موتور اصلی، نه IEC 60534-8-3
  const dP = P1 - P2;
  const dPeff = value(delegate.dPeff) ?? dP;
  const noise = fluid === "steam"
    ? Math.max(65, Math.round(65 + 15 * Math.log10(Math.max(dPeff, 0.1))))
    : Math.max(55, Math.round(55 + 18 * Math.log10(Math.max(dP, 0.1)) + 8 * Math.log10(Math.max(Q / 100, 0.01))));

  // ============================================================
  // هشدارها
  // ============================================================
  if (delegate.capacityExceeded) {
    add("danger", "capacity", { Cv }, "Required Cv exceeds the largest listed valve capacity — consult a valve engineer");
  }
  if (trimMach != null && trimMach > BODY_MACH_GUIDE) {
    add("warning", "mach", { mach: trimMach, limit: BODY_MACH_GUIDE, stages },
      `Trim-exit Mach ${trimMach} exceeds the ${BODY_MACH_GUIDE} guideline — use more reduction stages or a multi-stage/multi-hole trim (currently ${stages} stage(s))`);
  }
  if (outletMach != null && outletMach > OUTLET_MACH_GUIDE) {
    add("danger", "outletMach", { mach: outletMach, limit: OUTLET_MACH_GUIDE, velocity: outletVelocity, dn: outletDnMm },
      `Outlet flange Mach ${outletMach} (${outletVelocity} m/s in DN${outletDnMm}) exceeds ${OUTLET_MACH_GUIDE} — the outlet line is too small; use DN${recommendedOutletDn ?? "larger"} or an outlet diffuser`);
  } else if (outletMach != null && outletMach > BODY_MACH_GUIDE) {
    add("info", "outletMach", { mach: outletMach, velocity: outletVelocity },
      `Outlet flange Mach ${outletMach} is between the ${BODY_MACH_GUIDE} and ${OUTLET_MACH_GUIDE} guidelines — acceptable for a letdown station with a properly expanded outlet`);
  }
  if (keRatio != null && keRatio > 1) {
    add("danger", "kineticEnergy", { keWm2: kineticEnergy, limitWm2: KE_LIMIT_W_M2, ratio: keRatio, stages },
      `Outlet kinetic energy ${(kineticEnergy / 1000).toFixed(0)} kW/m² is ${keRatio}× the ${KE_LIMIT_W_M2 / 1000} kW/m² (≈${KE_LIMIT_LBF_FT_S} lbf/(ft·s)) RP75.23 limit — add pressure-reduction stages (rule of thumb suggests ${stagesRecommended}) and a larger outlet`);
  } else if (keRatio != null && keRatio > 0.7) {
    add("warning", "kineticEnergy", { keWm2: kineticEnergy, ratio: keRatio },
      `Outlet kinetic energy ${(kineticEnergy / 1000).toFixed(0)} kW/m² is close to the RP75.23 limit (${keRatio}×) — verify the trim outlet area with the vendor`);
  }
  if (stages === 1 && stagesRecommended > 1) {
    add("info", "stages", { stages: stagesRecommended, ratio: +r.toFixed(3), rule: STAGE_RATIO_RULE },
      `Pressure ratio P2/P1 = ${r.toFixed(3)} — the r ≤ ${STAGE_RATIO_RULE} rule of thumb suggests ${stagesRecommended} reduction stage(s); a single stage will run supersonic in the trim`);
  }
  if (delegate.choked) {
    add("warning", "choked", { x: delegate.x, xChoked: delegate.xChoked },
      "Governing stage is choked — the flow is limited by the trim, not by P2; staged trim or a larger valve is needed");
  }
  if (fluid === "steam") {
    if (outletState.error) {
      add("warning", "outOfRange", { P2 }, `Outlet state at ${P2} bar is outside the steam property table — outlet temperature and wetness are not reported`);
    } else if (outletState.wetSteam || drynessOut < WET_STEAM_QUALITY_LIMIT) {
      add("danger", "wetSteam", { dryness: drynessOut, outletTempC, limit: WET_STEAM_QUALITY_LIMIT },
        `Isenthalpic letdown lands below saturation: outlet dryness ${drynessOut} (wet steam) — droplet erosion of trim and seat; raise inlet superheat, add a desuperheater after the valve, or use an erosion-resistant multi-stage trim`);
    } else if (satMargin != null && satMargin <= 15) {
      add("warning", "nearSaturation", { marginC: satMargin, outletTempC },
        `Outlet is only ${satMargin} °C above saturation at ${P2} bar — small heat loss or table error makes the steam wet; plan for a desuperheater or drain points`);
    }
    if (outletTempC != null && outletTempC > T1 + 2) {
      add("info", "superheatGain", { dT: +(outletTempC - T1).toFixed(1) },
        "Deep letdown of superheated steam can raise the outlet temperature (isenthalpic path crosses above the inlet state) — check downstream pipe class");
    }
  }
  if (noise >= 85) {
    add("warning", "noise", { noise },
      `Indicative noise ${noise} dB — a real IEC 60534-8-3 calculation plus vendor attenuation data is required before specifying trim or silencers`);
  }

  notes.push(
    "Cv comes from the shared calcGasCv / calcSteamCv engine; the letdown-specific checks here (Mach, ISA RP75.23 kinetic energy, staging, outlet state) are added on top.",
    "Between-stage and flange states are taken as isenthalpic (the usual valve approximation); the trim-exit velocity uses the isentropic enthalpy drop of each stage, which is an upper bound — a real trim recovers most of that kinetic energy as heat and its velocity coefficient (≈0.7–0.9) is vendor data.",
    "Gas outlet temperature is held at the inlet value (ideal-gas isenthalpic). Near saturation or at high pressure this is wrong: use a real-gas h(P,T) or vendor data.",
    "Kinetic energy is a single-point estimate at the last-stage outlet, not a full ISA RP75.23 assessment of the trim outlet area and velocity profile.",
    "Noise is a log10 guideline reusing the engine's indicative formula. It is NOT IEC 60534-8-3 and must not be used for permit or silencer design.",
    "Capacity here follows the ISA-75.01.01/IEC 60534-2-1 equations. ASME-rated (certified) capacity, service temperature limits and material allowables are vendor/ASME data and are not estimated.",
    "This is a preliminary estimate, not a validated ISA-75.01.01 / IEC 60534-2-1 calculation."
  );

  return {
    fluid,
    Cv: +Cv.toFixed(2),
    Kv: +Kv.toFixed(2),
    size,
    governingStage: governingIndex + 1,
    stages,
    stagesRecommended,
    stagesList,
    pressureRatio: +r.toFixed(3),
    dP: +dP.toFixed(2),
    outletTempC,
    outletIsentropicTempC: value(outletState.isentropicTempC),
    saturationMarginC: satMargin,
    drynessFraction: drynessOut,
    drynessInlet: drynessIn,
    superheatedOutlet: outletState.superheated === true,
    outletVelocity,
    outletMach,
    outletSoundSpeed: aOut,
    outletDensity: value(rhoOut),
    qActualM3h: qActualM3h != null ? +qActualM3h.toFixed(1) : null,
    outletDnMm,
    recommendedOutletDn,
    trimExitVelocity: trimVelocity,
    trimExitMach: trimMach,
    trimExitDensity: value(rhoTrim),
    trimIsentropicTempC: trimStaticTempC,
    kineticEnergy,
    kineticEnergyKwM2: kineticEnergy != null ? +(kineticEnergy / 1000).toFixed(0) : null,
    kineticEnergyLimitWm2: KE_LIMIT_W_M2,
    kineticEnergyRatio: keRatio,
    kineticEnergyLbfFtS: kineticEnergy != null ? +(kineticEnergy / KE_LBF_FT_S_TO_W_M2 * KE_LIMIT_LBF_FT_S).toFixed(0) : null,
    noise,
    noiseIndicative: true,
    k: +k.toFixed(3),
    MW: +mwFromGg.toFixed(2),
    cp: +cp.toFixed(0),
    W: +W.toFixed(1),
    Q: +Q.toFixed(1),
    warnings,
    notes,
    indicative: true,
    delegate
  };
}
