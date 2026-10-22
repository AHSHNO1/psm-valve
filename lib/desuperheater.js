// ============================================================
// Preliminary valve sizing estimates; this simplified enthalpy balance is not
// a substitute for a complete IEC 60534 calculation or manufacturer validation.
// ============================================================
// desuperheater.js — سایزینگ ایستگاه دی‌سوپرهیت (تزریق آب)
// ------------------------------------------------------------
// موازنهٔ آنتالپی در یک ایستگاه تزریق آب به بخار سوپرهیت (مخلوط‌شدن
// آدیاباتیک در فشار خروجی ≈ P1):
//
//   mS·h1 + mW·hW = (mS + mW)·h2
//   ⇒  mW = mS·(h1 − h2) / (h2 − hW)
//
// که در آن:
//   h1 = hSuperheated(P1, T1)               بخار ورودی سوپرهیت
//   h2 = hg(P1) + cp·(T2 − Tsat(P1))        بخار خروجی (آبِ تزریق‌شده تبخیر شده)
//   hW = 4.186·Twater                        آب اسپری (زیراشباع، سهم فشار ناچیز)
//
// مخرج کسر همان hg(P1) + cp·(T2target − Tsat) − hW(injected) است: آب
// تزریق‌شده در دمای T2 از بخار خارج می‌شود، پس گرمای نهان تبخیر + سوپرهیت
// آن باید از آنتالپی آب مایع کم شود. اگر آب پیش‌گرم (نزدیک Tsat) باشد مخرج
// کوچک و مصرف آب بالا می‌رود.
//
// خطا: آنتالپی‌های جدول بخار ±۲۵ kJ/kg ⇒ مصرف آب معمولاً ±۵–۱۰٪.
// این یک برآورد مقدماتی است، نه یک محاسبهٔ اعتبارسنجی‌شدهٔ ISA-75.01.01 /
// IEC 60534-2-1 و نه جایگزین تأیید سازندهٔ شیر دی‌سوپرهیت (طول نفوذ قطره،
// دبی اسپری و متریال بدنه همگی دادهٔ کارخانه‌ای می‌خواهند).
// ============================================================

import { calcLiquidCv, calcSteamCv, cvToSize } from "./sizing-advanced.js";
import {
  hSuperheated,
  liquidWaterEnthalpy,
  saturationPressureBar,
  saturationTempC,
  superheatCp
} from "./steam-tables.js";

// ============================================================
// راهنماهای عددی — همگی «قاعدهٔ سرانگشتی» هستند نه حد طراحی
// ============================================================
// اتمایز: فشار شکار باید دست‌کم ۱٫۵–۲ bar یا ۲۰٪ فشار بخار باشد، هرکدام
// بزرگ‌تر بود؛ مقدار پیش‌فرض ۲ bar از طراحی‌های رایج تک‌نقطه‌ای گرفته شده و
// با پارامتر dvPBar قابل تغییر است.
export const ATOMIZING_DP_DEFAULT_BAR = 2.0;
export const ATOMIZING_DP_FRACTION = 0.2;
// فاصله تا خط اشباع: زیر این مقدار خطر تقطیر/شوک حرارتی جدی است (°C)
export const NEAR_SATURATION_WARN_C = 15;
export const NEAR_SATURATION_REJECT_C = 5;
// حذف سوپرهیت بیش از این مقدار در یک مرحله → شوک حرارتی بدنه/نشیمن (°C)
export const THERMAL_SHOCK_DT_C = 100;
// نسبت آب/بخار عملی برای یک نقطهٔ تزریق (٪ دبی جرمی)
export const PRACTICAL_SPRAY_RATIO = 0.1;
// آب: گرانش ویژه و فشار بحرانی (همان FLUID_PRESETS.water در sizing-advanced)
const WATER_GF_DEFAULT = 1.0;
const WATER_PC_BAR = 221.2;
const WATER_PV_FALLBACK_BAR = 0.0317;
// FL محافظه‌کارانه برای شیر کوچک تزریق (گلوب) — سایزهای کوچک FL پایین‌تری دارند
const WATER_VALVE_FL_DEFAULT = 0.9;

/** مقدار عددی از خروجی جدول بخار؛ { error } را به null تبدیل می‌کند. */
function value(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

// خطا هم متن انگلیسی (برای API/تست) و هم کلید ترجمه دارد تا UI پیام را
// در چهار زبان نمایش دهد، بدون اینکه منطق موتور به locale وابسته شود.
function fail(key, text, errorParams) {
  return { error: text, errorKey: key, errorParams: errorParams || {} };
}

function num(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

/**
 * محاسبهٔ ایستگاه دی‌سوپرهیت با تزریق آب.
 * @param {object} p
 * @param {number} p.steamFlowKgH      دبی بخار (kg/h)
 * @param {number} p.P1Bar             فشار ایستگاه (bar مطلق)
 * @param {number} p.T1C              دمای بخار ورودی (°C، سوپرهیت)
 * @param {number} p.T2TargetC         دمای هدف پس از دی‌سوپرهیت (°C)
 * @param {number} p.waterPBar         فشار آب تزریق (bar مطلق)
 * @param {number} [p.waterTC=25]      دمای آب اسپری (°C)
 * @param {number} [p.dvPBar]         افت فشار لازم شکار (bar) — پیش‌فرض راهنما
 * @param {boolean} [p.atomizing=true] اگر false، شیر اتمایزر در نظر گرفته نمی‌شود
 * @param {number} [p.waterGf]        گرانش ویژهٔ آب
 * @param {number} [p.waterFL]        FL شیر آب
 * @param {number} [p.steamSupplyPBar] فشار بالادست که شیر بخار آن را به P1 تنبیه می‌کند
 */
export function calcDesuperheater(params = {}) {
  const mSteam = num(params.steamFlowKgH);
  const P1 = num(params.P1Bar);
  const T1 = num(params.T1C);
  const T2 = num(params.T2TargetC);
  const waterP = num(params.waterPBar);
  const waterT = num(params.waterTC) ?? 25; // پیش‌فرض آب شهر/کاندنس خنک
  const atomizing = params.atomizing !== false;

  if (!(mSteam > 0)) return fail("steamFlow", "Steam flow must be greater than zero");
  if (!(P1 > 0)) return fail("stationPressure", "Steam pressure P1Bar must be greater than zero");
  if (!Number.isFinite(T1) || !Number.isFinite(T2)) {
    return fail("temperaturesRequired", "Inlet and target temperatures are required");
  }

  const warnings = [];
  const notes = [];
  // هر هشدار یک کلید + پارامتر دارد تا در UI ترجمه شود؛ text انگلیسی fallback است.
  const add = (type, key, warnParams, text) => warnings.push({ type, key, params: warnParams || {}, text });

  const tsat = value(saturationTempC(P1));
  if (tsat == null) {
    return fail("tablePressure", `P1 = ${P1} bar is outside the steam property table (0.02–40 bar abs)`, { P1 });
  }

  const h1 = value(hSuperheated(P1, T1));
  if (h1 == null) {
    return fail("inletNotSuperheated", `Inlet steam at ${T1} °C / ${P1} bar is not superheated vapour (or outside the table)`, { T1, P1 });
  }
  if (T2 >= T1) return fail("targetAboveInlet", "Target temperature must be lower than the inlet temperature", { T1, T2 });
  if (T2 < tsat) {
    return fail("targetBelowSaturation", "Target temperature is below saturation at P1 — injected water cannot evaporate (rain/wet steam)", { T2, tsat: +tsat.toFixed(1), P1 });
  }

  const h2 = value(hSuperheated(P1, T2));
  const hW = value(liquidWaterEnthalpy(waterT));
  if (h2 == null) {
    return fail("targetOutOfTable", `Target temperature ${T2} °C is outside the steam property table`, { T2 });
  }
  if (hW == null) {
    return fail("waterTemperature", `Water temperature ${waterT} °C is outside the property table (20–550 °C)`, { waterT });
  }

  const denom = h2 - hW; // hg(P1) + cp·(T2 − Tsat) − hW
  if (denom <= 0) {
    return fail("waterEnthalpy", "Injected water enthalpy exceeds the outlet steam enthalpy — check water temperature", { waterT, T2 });
  }

  const mWater = (mSteam * (h1 - h2)) / denom;
  const sprayRatio = mWater / mSteam;
  const heatRemovedKJ = mSteam * (h1 - h2); // kJ/h
  const dutyKw = heatRemovedKJ / 3600; // kW (adiabatic station: the "duty" is the enthalpy taken up)

  const marginC = T2 - tsat;
  const superheatInC = T1 - tsat;
  const superheatRemovedC = T1 - T2; // آنچه در یک مرحله از بخار گرفته می‌شود

  // ---- هشدار نزدیک‌شدن به اشباع: همان‌جا که شیرهای دی‌سوپرهیت از شوک
  // حرارتی و ارودن می‌سوزند (قطرهٔ ناپختۀ ۳۰ °C روی بدنهٔ ۲۵۰ °C)
  if (marginC < NEAR_SATURATION_REJECT_C) {
    add("danger", "nearSaturation", { marginC: +marginC.toFixed(1), tsat: +tsat.toFixed(1) },
      `Outlet is only ${marginC.toFixed(1)} °C above saturation (${tsat.toFixed(1)} °C) — droplets will not fully evaporate; raise the target or inject at a lower pressure`);
  } else if (marginC <= NEAR_SATURATION_WARN_C) {
    add("warning", "nearSaturation", { marginC: +marginC.toFixed(1), tsat: +tsat.toFixed(1) },
      `Outlet approach to saturation is ${marginC.toFixed(1)} °C — keep above ${NEAR_SATURATION_WARN_C} °C to avoid thermal shock and erosion of the body and trim`);
  }

  if (superheatRemovedC > THERMAL_SHOCK_DT_C) {
    add("warning", "thermalShock", { dT: +superheatRemovedC.toFixed(1), limit: THERMAL_SHOCK_DT_C },
      `${superheatRemovedC.toFixed(0)} °C of superheat removed in one stage — consider two injection points or a longer mixing section; body/trim fatigue from thermal shock is the usual failure mode`);
  }

  if (sprayRatio > PRACTICAL_SPRAY_RATIO) {
    add("warning", "sprayRatio", { ratio: +(sprayRatio * 100).toFixed(1), limit: PRACTICAL_SPRAY_RATIO * 100 },
      `Spray water is ${(sprayRatio * 100).toFixed(1)} % of the steam flow — beyond the ~${PRACTICAL_SPRAY_RATIO * 100} % practical limit for a single injection point; use a multi-hole lance and vendor confirmation`);
  }

  // ---- قاعدهٔ اتمایز: ΔP شکار ≥ ۱٫۵–۲ bar یا ۲۰٪ فشار بخار (هرکدام بزرگ‌تر)
  const dvGiven = num(params.dvPBar);
  const fractionDp = ATOMIZING_DP_FRACTION * P1;
  const dvGuide = Math.max(dvGiven ?? ATOMIZING_DP_DEFAULT_BAR, fractionDp);
  const dvIsFromFraction = fractionDp > (dvGiven ?? ATOMIZING_DP_DEFAULT_BAR);
  const dpBasis = dvIsFromFraction
    ? ATOMIZING_DP_FRACTION * 100 + " % of the steam pressure governs"
    : (dvGiven != null ? dvGiven + " bar (given)" : ATOMIZING_DP_DEFAULT_BAR + " bar default") + " governs";

  // ---- شیر تزریق آب روی ΔP سمت آب سایز می‌شود (بدنهٔ مستقل از شیر بخار)
  let waterCv = null;
  let waterKv = null;
  let waterValve = null;
  let waterDPAvailable = null;
  let waterDPEffective = null;

  if (waterP == null) {
    add("warning", "waterSupplyDP", null,
      "Water supply pressure not given — the injection valve is not sized; provide waterPBar (and optionally waterTC)");
  } else {
    waterDPAvailable = waterP - P1; // فشار ایستگاه = فشار مخالف شکار
    const valveDp = waterDPAvailable - dvGuide;
    waterDPEffective = valveDp;

    if (waterDPAvailable <= 0) {
      add("danger", "waterSupplyDP", { waterPBar: +waterP.toFixed(2), P1Bar: +P1.toFixed(2) },
        `Water supply ${waterP.toFixed(2)} bar is below the station pressure ${P1.toFixed(2)} bar — injection is impossible; a booster pump or an elevated water source is required`);
    } else if (valveDp <= 0) {
      add("danger", "atomizingDP", { needBar: +dvGuide.toFixed(2), availableBar: +waterDPAvailable.toFixed(2) },
        `Available spray ΔP ${waterDPAvailable.toFixed(2)} bar is below the ${dvGuide.toFixed(2)} bar atomising requirement — droplets will not atomise and the station will rain out; raise waterPBar or inject at a lower steam pressure`);
    } else if (valveDp < 0.5 * dvGuide) {
      add("warning", "atomizingDP", { needBar: +dvGuide.toFixed(2), availableBar: +waterDPAvailable.toFixed(2) },
        `Only ${valveDp.toFixed(2)} bar is left across the injection valve after the ${dvGuide.toFixed(2)} bar nozzle ΔP — low authority for flow control`);
    }

    if (valveDp > 0) {
      const Gf = num(params.waterGf) ?? WATER_GF_DEFAULT;
      const FL = num(params.waterFL) ?? WATER_VALVE_FL_DEFAULT;
      const Pv = value(saturationPressureBar(waterT)) ?? WATER_PV_FALLBACK_BAR;
      const qWaterM3h = mWater / 1000 / Gf; // kg/h → m³/h (چگالی آب ≈ Gf·1000)
      const res = calcLiquidCv({
        Q: qWaterM3h,
        Gf,
        P1: waterP,
        P2: P1 + dvGuide,
        Pv,
        Pc: WATER_PC_BAR,
        FL
      });
      if (res.error) {
        add("warning", "waterSupplyDP", { error: res.error }, `Injection valve sizing failed: ${res.error}`);
      } else {
        waterCv = res.Cv;
        waterKv = res.Kv;
        waterValve = {
          Cv: waterCv,
          Kv: waterKv,
          size: res.size,
          dPeff: res.dPeff,
          choked: res.choked,
          cavitationRisk: res.cavitationRisk,
          velocity: res.velocity
        };
        if (res.choked) {
          add("info", "waterSupplyDP", { dPmax: res.dPmax },
            `Injection valve is at its choked (cavitating) ΔP limit ${res.dPmax} bar — the spray ΔP assumption controls, not the valve`);
        }
      }
    }
  }

  // ---- شیر بخار: فقط وقتی فشار بالادست داده شود، یک بدنهٔ مستقل محاسبه می‌شود
  let steamValve = null;
  const supplyP = num(params.steamSupplyPBar);
  if (supplyP != null && supplyP > P1) {
    const res = calcSteamCv({ W: mSteam, P1: supplyP, P2: P1, T: T1 });
    if (!res.error) {
      steamValve = {
        Cv: res.Cv,
        Kv: res.Kv,
        size: res.size,
        x: res.x,
        xChoked: res.xChoked,
        choked: res.choked,
        steamBasis: res.steamBasis
      };
    }
  }

  // کوچک‌ترین بدنهٔ آب: همان cvToSize روی Cv تزریق. برای Cv کم‌تر از ۱ بدنهٔ
  // فهرست‌شدهٔ DN15 کفِ عملی است و trim تزریق micro-flow دادهٔ سازنده می‌خواهد.
  const smallestWaterSize = waterCv != null ? cvToSize(waterCv) : null;
  if (waterCv != null && waterCv < 1) {
    notes.push(`Injection Cv ${waterCv} is below 1 — a micro-flow injection trim is required; the body shown is the smallest listed size and its full Cv far exceeds the demand.`);
  }

  const cpOut = value(superheatCp(P1));
  const gfWater = num(params.waterGf) ?? WATER_GF_DEFAULT;

  return {
    waterFlowKgH: +mWater.toFixed(1),
    waterFlowLMin: +(mWater / (60 * gfWater)).toFixed(2),
    waterToSteamRatio: +sprayRatio.toFixed(4),
    waterEnthalpyKJkg: +hW.toFixed(1),
    h1KJkg: +h1.toFixed(1),
    h2KJkg: +h2.toFixed(1),
    denominatorKJkg: +denom.toFixed(1),
    cpSuperheatKJkgK: cpOut != null ? +cpOut.toFixed(3) : null,
    dutyKW: +dutyKw.toFixed(2),
    saturationTempC: +tsat.toFixed(1),
    superheatInC: +superheatInC.toFixed(1),
    superheatOutC: +marginC.toFixed(1),
    superheatRemovedC: +superheatRemovedC.toFixed(1),
    saturationMarginC: +marginC.toFixed(1),
    atomizingDPBar: +dvGuide.toFixed(2),
    atomizingDPFromSteamFraction: dvIsFromFraction,
    waterDPAvailableBar: waterDPAvailable != null ? +waterDPAvailable.toFixed(2) : null,
    waterValveDPBar: waterDPEffective != null ? +waterDPEffective.toFixed(2) : null,
    waterCv,
    waterKv,
    waterValve,
    waterValveSize: smallestWaterSize ? smallestWaterSize.dn : null,
    waterValveSizeDetail: smallestWaterSize,
    steamCv: steamValve ? steamValve.Cv : null,
    steamValve,
    warnings,
    notes: [
      "Adiabatic mixing balance: the injected water leaves as vapour at the outlet state, so the spray demand is mW = mS·(h1 − h2)/(hg(P1) + cp·(T2 − Tsat) − hW).",
      "Steam-table enthalpies carry ±25 kJ/kg, so the water demand is typically ±5–10 %. Treat the result as a preliminary estimate, not a validated ISA-75.01.01 / IEC 60534-2-1 calculation.",
      "Droplet penetration/evaporation length, lance hole count and body material limits are vendor data and are deliberately not estimated here.",
      atomizing
        ? "Atomising nozzle ΔP of " + dvGuide.toFixed(2) + " bar (" + dpBasis + ") was deducted on the water side; it is a guideline, not a hard rule."
        : "Non-atomising injection selected: the nozzle ΔP guideline is reported (" + dpBasis + ") and only deducted where water ΔP allowed."
    ].concat(notes),
    indicative: true,
    fluid: "desuperheater"
  };
}
