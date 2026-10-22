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
// PER-FIELD UNIT CATEGORIES
// هر فیلد عددی فرم میتواند واحد مستقل خودش را داشته باشد (مثل Q).
// موتور سایزینگ همهٔ مقادیر را در «واحد موتور» میگیرد:
//   pressure→bar · temperature→°C · viscosity→cSt · density→نسبی
//   molarMass→g/mol · length→mm (DN) · percent→% · area→mm²
// ============================================================
export const UNIT_CATEGORIES = {
  pressure: {
    engine: "bar",
    factors: {
      bar: 1, mbar: 0.001, kPa: 0.01, MPa: 10, "kg/cm²": 0.980665,
      psi: 0.0689476, psig: 0.0689476, "inH₂O": 0.00249089, "ftH₂O": 0.298907, mmHg: 0.00133322
    },
    groups: [
      { id: "metric", units: ["bar", "mbar", "kPa", "MPa", "kg/cm²"] },
      { id: "imperial", units: ["psi", "psig", "inH₂O", "ftH₂O", "mmHg"] }
    ]
  },
  temperature: {
    engine: "°C",
    special: "temperature",
    // دما تناسب خطی نیست (آفست دارد)؛ ضریب‌ها فقط برای شناخته‌شدن واحدها وجود دارند
    factors: { "°C": 1, "°F": 1, K: 1 },
    groups: [{ id: "temperature", units: ["°C", "°F", "K"] }]
  },
  viscosity: {
    engine: "cSt",
    special: "viscosity",
    factors: { cSt: 1, "m²/s": 1e6, "ft²/s": 9.290304, cP: 1, "Pa·s": 1000 },
    // واحدهای داینامیک (cP، Pa·s) به چگالی نیاز دارند: ν[cSt] = μ[cP] ÷ ρ[g/cm³]
    dynamic: { cP: 1, "Pa·s": 1000 },
    groups: [
      { id: "kinematic", units: ["cSt", "m²/s", "ft²/s"] },
      { id: "dynamic", units: ["cP", "Pa·s"] }
    ]
  },
  density: {
    engine: "relative",
    special: "density",
    // واحد موتور «نسبت به آب» است: 1 g/cm³ = 1000 kg/m³ = نسبت ۱
    factors: { "—": 1, "g/cm³": 1, "kg/m³": 0.001, "lb/ft³": 0.016018463 },
    groups: [{ id: "density", units: ["—", "g/cm³", "kg/m³", "lb/ft³"] }]
  },
  length: {
    engine: "mm",
    factors: { mm: 1, DN: 1, cm: 10, in: 25.4, "\"": 25.4 },
    groups: [{ id: "length", units: ["DN", "mm", "cm", "in"] }]
  },
  percent: {
    engine: "%",
    factors: { "%": 1, fraction: 100 },
    groups: [{ id: "percent", units: ["%", "fraction"] }]
  }
};

// نگاشت نام فیلد فرم → دستهٔ واحد
// فقط فیلدهایی که تبدیل واحد آن‌ها معنا دارد انتخابگر می‌گیرند:
//   Gg (نسبت به هوا) و MW (g/mol = kg/kmol = lb/lbmol) بی‌بعد/هم‌عددند و واحد ندارند
// فیلدهای بی‌بعد مثل Z، k، FL و xT هم فهرست نشده‌اند.
export const FIELD_UNIT_CATEGORY = {
  P1: "pressure", P2: "pressure", Pv: "pressure", Pc: "pressure",
  T: "temperature", nu: "viscosity",
  Gf: "density", pipeDn: "length", marginPct: "percent",
  // فیلدهای حالت‌های پیشرفته (PSV / دسوپرهیتر / لت‌داون / دو‌فازی)
  setP: "pressure", waterP: "pressure", supplyP: "pressure", dvP: "pressure",
  T2: "temperature", waterT: "temperature", waterGf: "density",
  overpressurePct: "percent", inletLossPct: "percent",
  drynessPct: "percent", qualityPct: "percent"
};

// واحد پیشفرض هر دسته در هر سیستم — همان رفتار قبلی وقتی کاربر واحدی انتخاب نکرده
export const SYSTEM_DEFAULT_UNITS = {
  SI: { pressure: "bar", temperature: "°C", viscosity: "cSt", density: "—", length: "DN", percent: "%" },
  IMPERIAL: { pressure: "psi", temperature: "°F", viscosity: "cSt", density: "—", length: "in", percent: "%" }
};

export function unitGroups(category) {
  const cat = UNIT_CATEGORIES[category];
  return cat ? cat.groups : [];
}

/** واحد جاری یک فیلد: انتخاب صریح کاربر وگرنه پیشفرض سیستم */
export function fieldUnit(form, field, system = "SI") {
  const category = FIELD_UNIT_CATEGORY[field];
  if (!category) return null;
  const chosen = form && form[`${field}Unit`];
  if (chosen && UNIT_CATEGORIES[category].factors[chosen] != null) return chosen;
  const sys = SYSTEM_DEFAULT_UNITS[system] || SYSTEM_DEFAULT_UNITS.SI;
  return sys[category];
}

/** کلیدهای واحدی که فرم میتواند حمل کند (برای URL و localStorage) */
export function fieldUnitKeys() {
  return Object.keys(FIELD_UNIT_CATEGORY).map((f) => `${f}Unit`).concat(["QUnit", "WUnit"]);
}

/** آیا این واحد داینامیک است و به چگالی نیاز دارد؟ */
function isDynamicViscosity(unit) {
  return UNIT_CATEGORIES.viscosity.dynamic[unit] != null;
}

/**
 * مقدار فیلد → واحد موتور. ctx.Gf برای تبدیل ویسکوزیتهٔ داینامیک لازم است.
 * خروجی: { value, error } — خطاها کلیداند تا رابط کاربری محلی‌سازی کند.
 */
export function unitToSI(category, value, unit, ctx = {}) {
  const cat = UNIT_CATEGORIES[category];
  if (!cat || value == null || value === "") return { value: value == null ? null : Number(value), error: null };
  const v = Number(value);
  if (!Number.isFinite(v)) return { value: null, error: "invalid" };
  if (cat.special === "temperature") return { value: tempToC(v, unit || cat.engine), error: null };
  const factor = cat.factors[unit];
  if (factor == null) return { value: null, error: "unknownUnit" };
  if (category === "viscosity" && isDynamicViscosity(unit)) {
    const rhoGcm3 = Number(ctx.Gf) > 0 ? Number(ctx.Gf) : null;
    if (rhoGcm3 == null) return { value: null, error: "densityRequired" };
    return { value: (v * factor) / rhoGcm3, error: null };
  }
  return { value: v * factor, error: null };
}

/** واحد موتور → واحد انتخابی فیلد */
export function unitFromSI(category, value, unit, ctx = {}) {
  const cat = UNIT_CATEGORIES[category];
  if (!cat || value == null || value === "") return { value: value == null ? null : Number(value), error: null };
  const v = Number(value);
  if (!Number.isFinite(v)) return { value: null, error: "invalid" };
  if (cat.special === "temperature") return { value: cToTemp(v, unit || cat.engine), error: null };
  const factor = cat.factors[unit];
  if (factor == null) return { value: null, error: "unknownUnit" };
  if (category === "viscosity" && isDynamicViscosity(unit)) {
    const rhoGcm3 = Number(ctx.Gf) > 0 ? Number(ctx.Gf) : null;
    if (rhoGcm3 == null) return { value: null, error: "densityRequired" };
    return { value: (v * rhoGcm3) / factor, error: null };
  }
  return { value: v / factor, error: null };
}

/** تبدیل مستقیم یک مقدار بین دو واحدِ همان دسته (برای وقتی کاربر واحد فیلد را عوض میکند) */
export function convertFieldUnit(category, value, fromUnit, toUnit, ctx = {}) {
  if (value == null || value === "" || fromUnit === toUnit) return { value: value == null ? null : Number(value) };
  const toEngine = unitToSI(category, value, fromUnit, ctx);
  if (toEngine.error) return toEngine;
  return unitFromSI(category, toEngine.value, toUnit, ctx);
}

// ============================================================
// Pressure
// ============================================================
// ضریب تبدیل هر واحد فشار به bar — همان جدول UNIT_CATEGORIES.pressure (تک‌نسخه)
export const PRESSURE_UNITS = UNIT_CATEGORIES.pressure.factors;

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
// ترتیب تبدیل مهم است: چگالی اول، چون تبدیل دبی (جرمی↔حجمی)
// و ویسکوزیتهٔ داینامیک به مقدارِ واحد-موتوریِ آن نیاز دارند.
// Gg و MW بی‌بعدند و فقط در ctx کپی میشوند.
const DENSITY_FIRST = "Gf";

function fieldUnitState(form, system) {
  const state = {};
  for (const field of Object.keys(FIELD_UNIT_CATEGORY)) {
    state[field] = fieldUnit(form, field, system);
  }
  return state;
}

export function formToSI(form, fromSystem = "SI", fluid = "liquid") {
  const sys = SYSTEMS[fromSystem] || SYSTEMS.SI;
  const units = fieldUnitState(form, fromSystem);
  const si = Object.assign({}, form);
  const ctx = { Gg: form.Gg, MW: form.MW };

  // 1) چگالی نسبی → واحد موتور
  if (form[DENSITY_FIRST] != null && form[DENSITY_FIRST] !== "") {
    const conv = unitToSI(FIELD_UNIT_CATEGORY[DENSITY_FIRST], form[DENSITY_FIRST], units[DENSITY_FIRST], ctx);
    si[DENSITY_FIRST] = conv.error ? null : conv.value;
    ctx[DENSITY_FIRST] = conv.error ? null : conv.value;
    if (form[`${DENSITY_FIRST}Unit`]) si[`${DENSITY_FIRST}Unit`] = units[DENSITY_FIRST];
  }

  // 2) بقیهٔ فیلدها (ویسکوزیتهٔ داینامیک به ctx.Gf نیاز دارد)
  for (const field of Object.keys(FIELD_UNIT_CATEGORY)) {
    if (field === DENSITY_FIRST) continue;
    if (form[field] == null || form[field] === "") continue;
    const conv = unitToSI(FIELD_UNIT_CATEGORY[field], form[field], units[field], ctx);
    si[field] = conv.error ? null : conv.value;
    if (form[`${field}Unit`]) si[`${field}Unit`] = units[field];
  }

  // دبی: هر واحدی (حجمی یا جرمی) → واحد موتور
  if (fluid !== "steam" && form.Q != null && form.Q !== "") {
    const qUnit = form.QUnit || defaultFlowUnit(fromSystem, fluid);
    const conv = flowToEngine(form.Q, qUnit, fluid, ctx);
    si.Q = conv.error ? null : conv.value;
    // فقط انتخاب صریح کاربر حفظ میشود؛ واحد پیشفرض با تغییر سیستم بهروز میشود
    if (form.QUnit) si.QUnit = qUnit;
  }
  // دبی مینیمم (سایزینگ دو-نقطه‌ای) با همان واحد Q
  if (fluid !== "steam" && form.QMin != null && form.QMin !== "") {
    const qUnit = form.QUnit || defaultFlowUnit(fromSystem, fluid);
    const conv = flowToEngine(form.QMin, qUnit, fluid, ctx);
    si.QMin = conv.error ? null : conv.value;
  }
  if (form.W != null && form.W !== "") {
    const wUnit = form.WUnit || sys.flowMass || sys.flowSteam;
    const conv = flowToEngine(form.W, wUnit, "steam", ctx);
    si.W = conv.error ? null : conv.value;
    if (form.WUnit) si.WUnit = wUnit;
  }
  return si;
}

export function formFromSI(formSI, toSystem = "SI", fluid = "liquid") {
  const sys = SYSTEMS[toSystem] || SYSTEMS.SI;
  const units = fieldUnitState(formSI, toSystem);
  const out = Object.assign({}, formSI);
  const ctx = { Gg: formSI.Gg, MW: formSI.MW };

  // 1) چگالی نسبی → واحد نمایشی (ctx همان مقدار موتوری می‌ماند)
  if (formSI[DENSITY_FIRST] != null && formSI[DENSITY_FIRST] !== "") {
    const conv = unitFromSI(FIELD_UNIT_CATEGORY[DENSITY_FIRST], formSI[DENSITY_FIRST], units[DENSITY_FIRST], ctx);
    out[DENSITY_FIRST] = conv.error ? null : conv.value;
    ctx[DENSITY_FIRST] = formSI[DENSITY_FIRST];
    if (formSI[`${DENSITY_FIRST}Unit`]) out[`${DENSITY_FIRST}Unit`] = units[DENSITY_FIRST];
  }

  for (const field of Object.keys(FIELD_UNIT_CATEGORY)) {
    if (field === DENSITY_FIRST) continue;
    if (formSI[field] == null || formSI[field] === "") continue;
    const conv = unitFromSI(FIELD_UNIT_CATEGORY[field], formSI[field], units[field], ctx);
    out[field] = conv.error ? null : conv.value;
    if (formSI[`${field}Unit`]) out[`${field}Unit`] = units[field];
  }

  if (fluid !== "steam" && formSI.Q != null && formSI.Q !== "") {
    const qUnit = formSI.QUnit || defaultFlowUnit(toSystem, fluid);
    const conv = engineToFlow(formSI.Q, qUnit, fluid, ctx);
    out.Q = conv.error ? null : conv.value;
    if (formSI.QUnit) out.QUnit = qUnit;
  }
  if (fluid !== "steam" && formSI.QMin != null && formSI.QMin !== "") {
    const qUnit = formSI.QUnit || defaultFlowUnit(toSystem, fluid);
    const conv = engineToFlow(formSI.QMin, qUnit, fluid, ctx);
    out.QMin = conv.error ? null : conv.value;
  }
  if (formSI.W != null && formSI.W !== "") {
    const wUnit = formSI.WUnit || sys.flowMass || sys.flowSteam;
    const conv = engineToFlow(formSI.W, wUnit, "steam", ctx);
    out.W = conv.error ? null : conv.value;
    if (formSI.WUnit) out.WUnit = wUnit;
  }
  return out;
}