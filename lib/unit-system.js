// ============================================================
// UNIT SYSTEM — SI ↔ Imperial
// ============================================================

// جرم مولکولی هوا و حجم مولی در شرایط نرمال برای تبدیل جرمی ↔ حجمی گاز
export const MW_AIR = 28.96;                   // kg/kmol
export const NORMAL_MOLAR_VOLUME_M3 = 22.414;  // m3/kmol در 0°C و 1.01325 bar

export const SYSTEMS = {
  SI: {
    id: "SI",
    label: { fa: "متریک (SI)", en: "Metric (SI)", ar: "متري (SI)", ru: "Метрическая (SI)" },
    pressure: "bar",
    pressureLabel: "bar",
    flowLiquid: "m³/h",
    flowGas: "Nm³/h",
    flowSteam: "kg/h",
    flowMass: "kg/h",
    temp: "°C",
    tempLabel: "°C",
    velocity: "m/s",
    noise: "dB",
    dP: "bar",
    pipe: "mm",
    pipeLabel: "DN (mm)"
  },
  IMPERIAL: {
    id: "IMPERIAL",
    label: { fa: "اینچی (Imperial)", en: "Imperial", ar: "إمبراطوري", ru: "Имперская" },
    pressure: "psi",
    pressureLabel: "psi",
    flowLiquid: "gpm",
    flowGas: "SCFM",
    flowSteam: "lb/h",
    flowMass: "lb/h",
    temp: "°F",
    tempLabel: "°F",
    velocity: "ft/s",
    noise: "dB",
    dP: "psi",
    pipe: "in",
    pipeLabel: "in (NPS)"
  }
};

// ============================================================
// Pressure
// ============================================================
// ضریب تبدیل هر واحد فشار به bar
export const PRESSURE_UNITS = {
  bar: 1,
  kPa: 0.01,
  MPa: 10,
  psi: 0.0689476,
  "kg/cm2": 0.980665
};

export function pressureToBar(v, fromUnit = "bar") {
  if (v == null || v === "") return null;
  const f = PRESSURE_UNITS[fromUnit];
  return (Number(v) || 0) * (f == null ? 1 : f);
}
export function barToPressure(v, toUnit = "bar") {
  if (v == null || v === "") return null;
  const f = PRESSURE_UNITS[toUnit];
  return (Number(v) || 0) / (f == null ? 1 : f);
}

// ============================================================
// Flow — volumetric + mass
// ============================================================
// factor حجمی: m³/h به ازای یک واحد · factor جرمی: kg/h به ازای یک واحد
export const FLOW_UNITS = {
  "m³/h":  { kind: "volumetric", factor: 1 },
  "Nm³/h": { kind: "volumetric", factor: 1 },
  "L/min": { kind: "volumetric", factor: 0.06 },
  "L/s":   { kind: "volumetric", factor: 3.6 },
  "gpm":   { kind: "volumetric", factor: 0.227125 },
  "cfm":   { kind: "volumetric", factor: 1.699 },
  "SCFM":  { kind: "volumetric", factor: 1.699 },
  "kg/h":  { kind: "mass", factor: 1 },
  "kg/s":  { kind: "mass", factor: 3600 },
  "t/h":   { kind: "mass", factor: 1000 },
  "lb/h":  { kind: "mass", factor: 0.453592 },
  "lb/min": { kind: "mass", factor: 27.21552 }
};

const METRIC_VOLUMETRIC = ["m³/h", "L/min", "L/s"];
const IMPERIAL_VOLUMETRIC = ["gpm", "cfm", "SCFM"];
const MASS_UNITS = ["kg/h", "kg/s", "t/h", "lb/h", "lb/min"];

// واحد دبی که موتور سایزینگ انتظار دارد
export function engineFlowUnit(fluid) {
  if (fluid === "steam") return "kg/h";
  return fluid === "gas" ? "Nm³/h" : "m³/h";
}

// واحد پیشفرض نمایشی هر سیستم/سیال
export function defaultFlowUnit(system = "SI", fluid = "liquid") {
  const sys = SYSTEMS[system] || SYSTEMS.SI;
  if (fluid === "steam") return sys.flowSteam;
  return fluid === "gas" ? sys.flowGas : sys.flowLiquid;
}

// گروههای واحد برای انتخابگر فرم
export function flowUnitGroups(fluid) {
  if (fluid === "steam") return [{ id: "mass", units: MASS_UNITS.slice() }];
  const volumetric = fluid === "gas"
    ? ["Nm³/h", "m³/h", "L/min", "L/s"]
    : METRIC_VOLUMETRIC.slice();
  return [
    { id: "volumetricMetric", units: volumetric },
    { id: "volumetricImperial", units: IMPERIAL_VOLUMETRIC.slice() },
    { id: "mass", units: MASS_UNITS.slice() }
  ];
}

export function flowUnitKind(unit) {
  return FLOW_UNITS[unit] ? FLOW_UNITS[unit].kind : null;
}

// ============================================================
// Density helpers (mass ↔ volumetric)
// ============================================================
export function ggFromMW(mw) {
  return mw == null || mw === "" ? null : Number(mw) / MW_AIR;
}
export function mwFromGg(gg) {
  return gg == null || gg === "" ? null : Number(gg) * MW_AIR;
}

// چگالی گاز در شرایط نرمال (kg/Nm³) از MW و در نبود آن از Gg
export function gasNormalDensity(ctx = {}) {
  const mw = ctx.MW != null && Number(ctx.MW) > 0
    ? Number(ctx.MW)
    : (ctx.Gg != null && Number(ctx.Gg) > 0 ? mwFromGg(ctx.Gg) : null);
  return mw == null ? null : mw / NORMAL_MOLAR_VOLUME_M3;
}

// چگالی مایع (kg/m³) از چگالی نسبی
export function liquidDensity(Gf) {
  return Gf != null && Number(Gf) > 0 ? Number(Gf) * 1000 : null;
}

export function fluidDensity(fluid, ctx = {}) {
  if (fluid === "gas") return gasNormalDensity(ctx);
  if (fluid === "liquid") return liquidDensity(ctx.Gf);
  return null;
}

// ============================================================
// Any flow unit → engine unit (and back)
// ============================================================
// خطاها کلید هستند تا رابط کاربری محلیسازی کند:
// unknownUnit | invalid | densityRequired
export function flowToEngine(value, unit, fluid = "liquid", ctx = {}) {
  const target = engineFlowUnit(fluid);
  if (value == null || value === "") return { value: null, unit: target };
  const v = Number(value);
  if (!Number.isFinite(v)) return { value: null, unit: target, error: "invalid" };

  const from = FLOW_UNITS[unit];
  if (!from) return { value: null, unit: target, error: "unknownUnit" };
  const to = FLOW_UNITS[target];

  // بخار فقط جرمی است
  if (fluid === "steam" && from.kind !== "mass") {
    return { value: null, unit: target, error: "steamMassOnly" };
  }
  // همنوع (حجمی↔حجمی یا جرمی↔جرمی): فقط ضریب واحد
  if (from.kind === to.kind) return { value: (v * from.factor) / to.factor, unit: target };

  const density = fluidDensity(fluid, ctx);
  if (density == null) return { value: null, unit: target, error: "densityRequired" };

  // جرمی → حجمی
  return { value: (v * from.factor) / density / to.factor, unit: target };
}

// واحد موتور → واحد نمایشی (معکوس flowToEngine)
export function engineToFlow(value, unit, fluid = "liquid", ctx = {}) {
  const engine = engineFlowUnit(fluid);
  const targetUnit = unit || engine;
  if (value == null || value === "") return { value: null, unit: targetUnit };
  const v = Number(value);
  if (!Number.isFinite(v)) return { value: null, unit: targetUnit, error: "invalid" };

  const target = FLOW_UNITS[targetUnit];
  if (!target) return { value: null, unit: targetUnit, error: "unknownUnit" };
  const engineDef = FLOW_UNITS[engine];

  // بخار فقط جرمی است
  if (fluid === "steam" && target.kind !== "mass") {
    return { value: null, unit: targetUnit, error: "steamMassOnly" };
  }
  if (target.kind === engineDef.kind) {
    return { value: (v * engineDef.factor) / target.factor, unit: targetUnit };
  }

  const density = fluidDensity(fluid, ctx);
  if (density == null) return { value: null, unit: targetUnit, error: "densityRequired" };

  const kgh = engineDef.kind === "mass"
    ? v * engineDef.factor                 // بخار: موتور خودش جرمی است
    : v * engineDef.factor * density;      // حجم موتور × چگالی = جرم
  if (target.kind === "mass") return { value: kgh / target.factor, unit: targetUnit };
  return { value: kgh / density / target.factor, unit: targetUnit };
}

// سازگاری با نسخهٔ قبلی (فقط واحدهای حجمی)
export function flowToM3h(v, fromUnit = "m³/h") {
  const def = FLOW_UNITS[fromUnit];
  if (!def || def.kind !== "volumetric") return Number(v) || 0;
  return (Number(v) || 0) * def.factor;
}
export function m3hToFlow(v, toUnit = "m³/h") {
  const def = FLOW_UNITS[toUnit];
  if (!def || def.kind !== "volumetric") return Number(v) || 0;
  return (Number(v) || 0) / def.factor;
}

export function steamToKgh(v, fromUnit = "kg/h") {
  const def = FLOW_UNITS[fromUnit];
  if (!def || def.kind !== "mass") return Number(v) || 0;
  return (Number(v) || 0) * def.factor;
}
export function kghToSteam(v, toUnit = "kg/h") {
  const def = FLOW_UNITS[toUnit];
  if (!def || def.kind !== "mass") return Number(v) || 0;
  return (Number(v) || 0) / def.factor;
}

// ============================================================
// Velocity & pipe size
// ============================================================
export function velocityFromSI(v, toUnit = "m/s") {
  if (v == null) return null;
  return toUnit === "ft/s" ? Number(v) * 3.28084 : Number(v);
}
export function velocityToSI(v, fromUnit = "m/s") {
  if (v == null) return null;
  return fromUnit === "ft/s" ? Number(v) / 3.28084 : Number(v);
}
export function dnToInch(mm) {
  return mm == null ? null : Number(mm) / 25.4;
}
export function inchToDn(inch) {
  return inch == null ? null : Number(inch) * 25.4;
}

export function tempToC(v, fromUnit) {
  if (fromUnit === "°F") return (v - 32) * 5 / 9;
  if (fromUnit === "K") return v - 273.15;
  return v;
}
export function cToTemp(v, toUnit) {
  if (toUnit === "°F") return v * 9 / 5 + 32;
  if (toUnit === "K") return v + 273.15;
  return v;
}

// ============================================================
// Batch: convert entire form to SI or from SI
// ============================================================
export function formToSI(form, fromSystem = "SI", fluid = "liquid") {
  const sys = SYSTEMS[fromSystem] || SYSTEMS.SI;
  const si = Object.assign({}, form);
  const ctx = { Gf: form.Gf, MW: form.MW, Gg: form.Gg };

  // دبی: هر واحدی (حجمی یا جرمی) → واحد موتور
  if (fluid !== "steam" && form.Q != null && form.Q !== "") {
    const qUnit = form.QUnit || defaultFlowUnit(fromSystem, fluid);
    const conv = flowToEngine(form.Q, qUnit, fluid, ctx);
    si.Q = conv.error ? null : conv.value;
    // فقط انتخاب صریح کاربر حفظ میشود؛ واحد پیشفرض با تغییر سیستم بهروز میشود
    if (form.QUnit) si.QUnit = qUnit;
  }
  if (form.W != null && form.W !== "") {
    const wUnit = form.WUnit || sys.flowMass || sys.flowSteam;
    const conv = flowToEngine(form.W, wUnit, "steam", ctx);
    si.W = conv.error ? null : conv.value;
    if (form.WUnit) si.WUnit = wUnit;
  }

  if (form.P1 != null && form.P1 !== "") si.P1 = pressureToBar(form.P1, sys.pressure);
  if (form.P2 != null && form.P2 !== "") si.P2 = pressureToBar(form.P2, sys.pressure);
  if (form.Pv != null && form.Pv !== "") si.Pv = pressureToBar(form.Pv, sys.pressure);
  if (form.Pc != null && form.Pc !== "") si.Pc = pressureToBar(form.Pc, sys.pressure);
  if (form.T != null && form.T !== "") si.T = tempToC(form.T, sys.temp);

  // قطر لوله در فرم به واحد همان سیستم است؛ موتور میلیمتر میخواهد
  if (form.pipeDn != null && form.pipeDn !== "") {
    si.pipeDn = sys.pipe === "in" ? inchToDn(form.pipeDn) : Number(form.pipeDn);
  }
  return si;
}

export function formFromSI(formSI, toSystem = "SI", fluid = "liquid") {
  const sys = SYSTEMS[toSystem] || SYSTEMS.SI;
  const out = Object.assign({}, formSI);
  const ctx = { Gf: formSI.Gf, MW: formSI.MW, Gg: formSI.Gg };

  if (fluid !== "steam" && formSI.Q != null && formSI.Q !== "") {
    const qUnit = formSI.QUnit || defaultFlowUnit(toSystem, fluid);
    const conv = engineToFlow(formSI.Q, qUnit, fluid, ctx);
    out.Q = conv.error ? null : conv.value;
    if (formSI.QUnit) out.QUnit = qUnit;
  }
  if (formSI.W != null && formSI.W !== "") {
    const wUnit = formSI.WUnit || sys.flowMass || sys.flowSteam;
    const conv = engineToFlow(formSI.W, wUnit, "steam", ctx);
    out.W = conv.error ? null : conv.value;
    if (formSI.WUnit) out.WUnit = wUnit;
  }

  if (formSI.P1 != null && formSI.P1 !== "") out.P1 = barToPressure(formSI.P1, sys.pressure);
  if (formSI.P2 != null && formSI.P2 !== "") out.P2 = barToPressure(formSI.P2, sys.pressure);
  if (formSI.Pv != null && formSI.Pv !== "") out.Pv = barToPressure(formSI.Pv, sys.pressure);
  if (formSI.Pc != null && formSI.Pc !== "") out.Pc = barToPressure(formSI.Pc, sys.pressure);
  if (formSI.T != null && formSI.T !== "") out.T = cToTemp(formSI.T, sys.temp);

  if (formSI.pipeDn != null && formSI.pipeDn !== "") {
    out.pipeDn = sys.pipe === "in" ? dnToInch(formSI.pipeDn) : Number(formSI.pipeDn);
  }
  return out;
}