// ============================================================
// Preliminary valve sizing estimates; these simplified equations are not a
// substitute for a complete IEC 60534 calculation or manufacturer validation.
// ============================================================

export const VALVE_SIZES = [
  { size: '0.5"',  dn: "DN15",  nps: '1/2"',  cv: 15,    kv: 13 },
  { size: '0.75"', dn: "DN20",  nps: '3/4"',  cv: 28,    kv: 24 },
  { size: '1"',    dn: "DN25",  nps: '1"',    cv: 45,    kv: 39 },
  { size: '1.5"',  dn: "DN40",  nps: '1-1/2"',cv: 90,    kv: 78 },
  { size: '2"',    dn: "DN50",  nps: '2"',    cv: 150,   kv: 130 },
  { size: '3"',    dn: "DN80",  nps: '3"',    cv: 320,   kv: 277 },
  { size: '4"',    dn: "DN100", nps: '4"',    cv: 550,   kv: 476 },
  { size: '6"',    dn: "DN150", nps: '6"',    cv: 1250,  kv: 1081 },
  { size: '8"',    dn: "DN200", nps: '8"',    cv: 2200,  kv: 1903 },
  { size: '10"',   dn: "DN250", nps: '10"',   cv: 3400,  kv: 2941 },
  { size: '12"',   dn: "DN300", nps: '12"',   cv: 4800,  kv: 4152 },
  { size: '14"',   dn: "DN350", nps: '14"',   cv: 6300,  kv: 5450 },
  { size: '16"',   dn: "DN400", nps: '16"',   cv: 8000,  kv: 6920 },
  { size: '20"',   dn: "DN500", nps: '20"',   cv: 12500, kv: 10813 },
  { size: '24"',   dn: "DN600", nps: '24"',   cv: 18000, kv: 15570 }
];

export const VALVE_CHARACTERISTICS = [
  { id: "linear", name: { fa: "خطی (Linear)", en: "Linear" } },
  { id: "equal", name: { fa: "درصد مساوی (Equal %)", en: "Equal Percentage" } },
  { id: "quick", name: { fa: "بازشدگی سریع (Quick Opening)", en: "Quick Opening" } }
];

export const FLUID_PRESETS = {
  water:      { Pv: 0.0317, Pc: 221.2, Gf: 1.0,  name: { fa: "آب", en: "Water" } },
  oil:        { Pv: 0.01,   Pc: 22.0,  Gf: 0.85, name: { fa: "روغن", en: "Oil" } },
  gasoline:   { Pv: 0.65,   Pc: 32.0,  Gf: 0.75, name: { fa: "بنزین", en: "Gasoline" } },
  condensate: { Pv: 0.5,    Pc: 42.0,  Gf: 0.7,  name: { fa: "کاندنس", en: "Condensate" } }
};

// ============================================================
// LIQUID SIZING
// ============================================================
export function calcLiquidCv(params) {
  const Q = params.Q;
  const Gf = params.Gf;
  const P1 = params.P1;
  const P2 = params.P2;
  const Pv = params.Pv;
  const Pc = params.Pc;
  const FL = params.FL;

  const dP = P1 - P2;
  if (dP <= 0) return { error: "P1 must be greater than P2" };

  const Ff = Pc ? (0.96 - 0.28 * Math.sqrt(Math.max(0, Pv) / Pc)) : 0.95;
  const recovery = FL || 0.9;
  const dPmax = recovery * recovery * (P1 - Ff * Pv);
  const dPeff = Math.min(dP, dPmax);
  const choked = dP > dPmax;

  const kvBase = Q * Math.sqrt(Gf / dPeff);
  const pipe = applyPiping(kvBase * 1.156, params.pipeDnMm);
  const Cv = pipe.Cv;
  const Kv = Cv / 1.156;

  const sigma = Pv > 0 ? (P1 - Pv) / dP : 999;
  const sigmaIncipient = 1.2;
  const sigmaChoked = 0.6;

  let cavitationRisk = "low";
  if (sigma < sigmaChoked) cavitationRisk = "flashing";
  else if (sigma < sigmaIncipient) cavitationRisk = "high";
  else if (sigma < 2.5) cavitationRisk = "medium";

  const sizeInfo = cvToSize(Cv);
  const pipeIdM = (parseFloat(sizeInfo.size) * 25.4) / 1000;
  const areaM2 = Math.PI * Math.pow(pipeIdM / 2, 2);
  const velocity = areaM2 > 0 ? (Q / 3600) / areaM2 : 0;

  const noise = Math.max(45, Math.round(45 + 15 * Math.log10(dP) + 10 * Math.log10(Q / 100)));

  return {
    Cv: +Cv.toFixed(2),
    Kv: +Kv.toFixed(2),
    dPeff: +dPeff.toFixed(3),
    dPmax: +dPmax.toFixed(3),
    choked: choked,
    Fp: +pipe.Fp.toFixed(3),
    sigmaK: +pipe.sigmaK.toFixed(3),
    pipingApplied: pipe.pipingApplied,
    cavitationRisk: cavitationRisk,
    capacityExceeded: sizeInfo.capacityExceeded,
    sigma: +sigma.toFixed(2),
    sigmaIncipient: sigmaIncipient,
    velocity: +velocity.toFixed(2),
    noise: noise,
    size: sizeInfo,
    fluid: "liquid"
  };
}

// ============================================================
// GAS SIZING
// ============================================================
export function calcGasCv(params) {
  const Q = params.Q;
  const Gg = params.Gg;
  const T = params.T;
  const P1 = params.P1;
  const P2 = params.P2;
  const Z = params.Z || 1;
  const k = params.k || 1.4;
  const xT = params.xT || 0.7;

  const dP = P1 - P2;
  if (dP <= 0) return { error: "P1 must be greater than P2" };

  const x = dP / P1;
  const Fk = k / 1.4;
  const xChoked = Fk * xT;
  const xEff = Math.min(x, xChoked);
  const choked = x > xChoked;

  const Tk = T + 273.15;
  // ضریب انبساط (IEC 60534-2-1): Y = 1 - x/(3·Fk·xT)؛ در جریان خفه به ۲/۳ می‌رسد.
  const Y = 1 - xEff / (3 * Fk * xT);

  // Cv = Q / (416.3 · P1 · Y) · sqrt(Gg·T·Z / x)
  // ضریب ۴۱۶.۳ تبدیل SI همان معادلهٔ مرجع بر حسب scfh/psia است
  // (Q در Nm³/h، P1 در bar مطلق، T در کلوین).
  const cvBase = (Q / (416.3 * P1 * Y)) * Math.sqrt((Gg * Tk * Z) / xEff);
  const pipe = applyPiping(cvBase, params.pipeDnMm);
  const Cv = pipe.Cv;
  const Kv = Cv / 1.156;

  const sizeInfo = cvToSize(Cv);
  const pipeIdM = (parseFloat(sizeInfo.size) * 25.4) / 1000;
  const areaM2 = Math.PI * Math.pow(pipeIdM / 2, 2);
  // تبدیل دبی نرمال به شرایط کار برای محاسبهٔ سرعت واقعی در ورودی شیر
  const actualFlow = Q * (1.01325 / P1) * (Tk / 273.15);
  const velocity = areaM2 > 0 ? (actualFlow / 3600) / areaM2 : 0;

  const noise = Math.max(55, Math.round(55 + 18 * Math.log10(dP) + 8 * Math.log10(Q / 100)));

  return {
    Cv: +Cv.toFixed(2),
    Kv: +Kv.toFixed(2),
    x: +x.toFixed(3),
    xChoked: +xChoked.toFixed(3),
    Y: +Y.toFixed(3),
    Fp: +pipe.Fp.toFixed(3),
    sigmaK: +pipe.sigmaK.toFixed(3),
    pipingApplied: pipe.pipingApplied,
    choked: choked,
    capacityExceeded: sizeInfo.capacityExceeded,
    velocity: +velocity.toFixed(2),
    noise: noise,
    size: sizeInfo,
    fluid: "gas"
  };
}

// ============================================================
// STEAM SIZING
// ============================================================
export function calcSteamCv(params) {
  const W = params.W;
  const P1 = params.P1;
  const P2 = params.P2;
  const k = params.k || 1.3; // بخار اشباع ≈ ۱.۳
  const xT = params.xT || 0.7;

  const dP = P1 - P2;
  if (dP <= 0) return { error: "P1 must be greater than P2" };

  const x = dP / P1;
  const Fk = k / 1.4;
  const xChoked = Fk * xT;
  const dPeff = Math.min(dP, xChoked * P1);
  const choked = dP > xChoked * P1;
  const Y = 1 - dPeff / P1 / (3 * Fk * xT);
  // در جریان خفه، دبی به P2 وابسته نیست؛ فشار خروجی مؤثر جایگزین می‌شود.
  const P2eff = choked ? P1 - dPeff : P2;

  // W = 13.8 · Cv · Y · sqrt(ΔP·(P1+P2))  [kg/h, bar مطلق]
  // ۱۳.۸ همان ضریب ۲.۱ در فرم اینچی (lb/h، psia) است که به SI تبدیل شده.
  const cvBase = W / (13.8 * Y * Math.sqrt(dPeff * (P1 + P2eff)));
  const pipe = applyPiping(cvBase, params.pipeDnMm);
  const Cv = pipe.Cv;
  const Kv = Cv / 1.156;

  const sizeInfo = cvToSize(Cv);
  const noise = Math.max(65, Math.round(65 + 15 * Math.log10(dPeff)));

  return {
    Cv: +Cv.toFixed(2),
    Kv: +Kv.toFixed(2),
    x: +x.toFixed(3),
    xChoked: +xChoked.toFixed(3),
    dPeff: +dPeff.toFixed(3),
    Y: +Y.toFixed(3),
    Fp: +pipe.Fp.toFixed(3),
    sigmaK: +pipe.sigmaK.toFixed(3),
    pipingApplied: pipe.pipingApplied,
    choked: choked,
    capacityExceeded: sizeInfo.capacityExceeded,
    noise: noise,
    size: sizeInfo,
    velocity: 0,
    fluid: "steam"
  };
}

// ============================================================
// SIZE SELECTION
// ============================================================
export function cvToSize(requiredCv) {
  const found = VALVE_SIZES.find(function(r) { return r.cv >= requiredCv; });
  if (found) return { ...found, capacityExceeded: false };
  return { ...VALVE_SIZES[VALVE_SIZES.length - 1], capacityExceeded: true };
}

/** DN از رشتهٔ سایز مثل «DN50» → 50 (میلی‌متر) */
export function dnToMm(dn) {
  const value = parseInt(String(dn).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(value) ? value : 0;
}

/**
 * ضریب هندسهٔ اتصالات (Fp) — ISA-75.01.01 / IEC 60534-2-1
 *   Fp = [1 + (ΣK/N2)·(Cv/d²)²]^(-1/2)
 * با N2 = 890، Cv ضریب آمریکایی و d قطر نشیمن بر حسب اینچ.
 *
 * فرض‌ها (محافظه‌کارانه و باید در UI ذکر شود):
 *   • کاهنده/مبدل هم‌محور و ناگهانی در ورود و خروج
 *   • قطر نشیمن ≈ DN شیر
 *   • ΣK = K1 (انقباض) + K2 (انبساط)؛ ضرایب برنولی دو طرف برابر و حذف می‌شوند
 */
export function calcPipingFactor(cv, valveDnMm, pipeDnMm) {
  if (!pipeDnMm || pipeDnMm <= 0 || !valveDnMm || valveDnMm <= 0) {
    return { Fp: 1, sigmaK: 0, beta: 1, applies: false };
  }
  if (pipeDnMm <= valveDnMm) {
    return { Fp: 1, sigmaK: 0, beta: 1, applies: false };
  }

  const beta = valveDnMm / pipeDnMm;
  const oneMinusBeta2 = 1 - beta * beta;
  const k1 = 0.5 * oneMinusBeta2 * oneMinusBeta2; // انقباض ناگهانی
  const k2 = oneMinusBeta2 * oneMinusBeta2;       // انبساط ناگهانی
  const sigmaK = k1 + k2;

  const dInch = valveDnMm / 25.4;
  const term = (sigmaK / 890) * Math.pow(cv / (dInch * dInch), 2);
  const fp = 1 / Math.sqrt(1 + term);

  return { Fp: fp, sigmaK, beta, applies: true };
}

/** اعمال Fp روی Cv پایه؛ Fp به سایز انتخاب‌شده وابسته است، پس یک پاس تکرار می‌شود. */
function applyPiping(cvBase, pipeDnMm) {
  if (!pipeDnMm || pipeDnMm <= 0) {
    return { Cv: cvBase, Fp: 1, sigmaK: 0, pipeDnMm: 0, pipingApplied: false };
  }

  const first = cvToSize(cvBase);
  let valveDnMm = dnToMm(first.dn);
  let piping = calcPipingFactor(cvBase, valveDnMm, pipeDnMm);
  let cv = cvBase / piping.Fp;

  const second = cvToSize(cv);
  if (second.dn !== first.dn) {
    valveDnMm = dnToMm(second.dn);
    piping = calcPipingFactor(cv, valveDnMm, pipeDnMm);
    cv = cvBase / piping.Fp;
  }

  return {
    Cv: cv,
    Fp: piping.Fp,
    sigmaK: piping.sigmaK,
    pipeDnMm: pipeDnMm,
    pipingApplied: piping.applies
  };
}

export function calcOpeningPercent(cvRequired, cvMax) {
  if (cvMax <= 0) return 0;
  const linear = Math.min(100, (cvRequired / cvMax) * 100);
  return Math.round(linear);
}

export function getRecommendation(openingPercent, choked, cavitationRisk, capacityExceeded = false) {
  const warnings = [];

  if (capacityExceeded) {
    warnings.push({ type: "danger", text: "Required Cv exceeds the largest listed valve capacity — consult a valve engineer" });
  }
  if (openingPercent < 20) {
    warnings.push({ type: "info", text: "Opening is low — consider a smaller valve size for better control" });
  }
  if (openingPercent > 85) {
    warnings.push({ type: "warning", text: "Opening is high — consider a larger valve size" });
  }
  if (choked) {
    warnings.push({ type: "warning", text: "Choked flow detected — consider larger valve or reduce Delta-P" });
  }
  if (cavitationRisk === "high") {
    warnings.push({ type: "warning", text: "High cavitation risk — consider anti-cavitation trim" });
  }
  if (cavitationRisk === "flashing") {
    warnings.push({ type: "danger", text: "Flashing detected — special trim and hardened materials required" });
  }

  return warnings;
}

// ============================================================
// UNIT CONVERTERS
// ============================================================
export const UNIT_CONVERTERS = {
  length: {
    base: "m",
    units: {
      m: 1, km: 1000, cm: 0.01, mm: 0.001,
      in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344
    }
  },
  pressure: {
    base: "bar",
    units: {
      bar: 1, psi: 0.0689476, kPa: 0.01, MPa: 10, Pa: 0.00001,
      atm: 1.01325, mmHg: 0.00133322, kgcm2: 0.980665
    }
  },
  temperature: {
    special: true
  },
  flow: {
    base: "m3h",
    units: {
      m3h: 1, lmin: 0.06, ls: 3.6, gpm: 0.227125,
      cfm: 1.699, nm3h: 1, kgs: 3600
    }
  },
  mass: {
    base: "kg",
    units: { kg: 1, g: 0.001, t: 1000, lb: 0.453592, oz: 0.0283495 }
  },
  area: {
    base: "m2",
    units: {
      m2: 1, cm2: 0.0001, mm2: 0.000001,
      in2: 0.00064516, ft2: 0.092903
    }
  },
  volume: {
    base: "m3",
    units: {
      m3: 1, l: 0.001, ml: 0.000001,
      gal: 0.00378541, ft3: 0.0283168
    }
  },
  velocity: {
    base: "ms",
    units: {
      ms: 1, kmh: 0.277778, ftps: 0.3048, mph: 0.44704, knots: 0.514444
    }
  }
};

export function convertUnit(category, value, from, to) {
  if (category === "temperature") {
    return convertTemperature(value, from, to);
  }
  const cfg = UNIT_CONVERTERS[category];
  if (!cfg) return value;
  const baseValue = value * cfg.units[from];
  return baseValue / cfg.units[to];
}

export function convertTemperature(value, from, to) {
  let celsius;
  if (from === "C") celsius = value;
  else if (from === "F") celsius = (value - 32) * 5 / 9;
  else if (from === "K") celsius = value - 273.15;

  if (to === "C") return celsius;
  if (to === "F") return celsius * 9 / 5 + 32;
  if (to === "K") return celsius + 273.15;
  return celsius;
}

// ============================================================
// PIPE CALCULATIONS
// ============================================================
export function calcPipeFlow(params) {
  const diameter_mm = params.diameter_mm;
  const velocity_ms = params.velocity_ms;
  const d_m = diameter_mm / 1000;
  const area_m2 = Math.PI * Math.pow(d_m / 2, 2);
  const Q_m3s = velocity_ms * area_m2;
  const Q_m3h = Q_m3s * 3600;
  return {
    area_m2: +area_m2.toFixed(6),
    area_mm2: +(area_m2 * 1e6).toFixed(2),
    flow_m3h: +Q_m3h.toFixed(3),
    flow_lmin: +(Q_m3h * 1000 / 60).toFixed(2),
    flow_gpm: +(Q_m3h * 4.40287).toFixed(3)
  };
}

export function calcPipeDiameter(params) {
  const flow_m3h = params.flow_m3h;
  const velocity_ms = params.velocity_ms;
  const Q_m3s = flow_m3h / 3600;
  if (velocity_ms <= 0) return { error: "Velocity must be > 0" };
  const area_m2 = Q_m3s / velocity_ms;
  const d_m = 2 * Math.sqrt(area_m2 / Math.PI);
  return {
    diameter_mm: +(d_m * 1000).toFixed(2),
    diameter_in: +(d_m * 1000 / 25.4).toFixed(3),
    area_m2: +area_m2.toFixed(6)
  };
}

export function calcReynolds(params) {
  const density = params.density;
  const velocity = params.velocity;
  const diameter_mm = params.diameter_mm;
  const viscosity = params.viscosity;
  const d_m = diameter_mm / 1000;
  if (!viscosity || viscosity <= 0) return { Re: 0, regime: "—" };
  const Re = (density * velocity * d_m) / viscosity;
  let regime = "Laminar";
  if (Re > 4000) regime = "Turbulent";
  else if (Re > 2300) regime = "Transitional";
  return { Re: Math.round(Re), regime: regime };
}

// ============================================================
// SAFE EXPRESSION EVALUATOR
// ============================================================
export function safeEval(expr) {
  if (!expr || !expr.trim()) return null;

  var cleaned = expr;

  // Symbol replacements
  cleaned = cleaned.split("×").join("*");
  cleaned = cleaned.split("÷").join("/");
  cleaned = cleaned.split("−").join("-");
  cleaned = cleaned.split("π").join("(3.141592653589793)");
  cleaned = cleaned.split("√").join("Math.sqrt");

  // Function token replacements
  cleaned = cleaned.split("sin(").join("Math.sin(");
  cleaned = cleaned.split("cos(").join("Math.cos(");
  cleaned = cleaned.split("tan(").join("Math.tan(");
  cleaned = cleaned.split("log(").join("Math.log10(");
  cleaned = cleaned.split("ln(").join("Math.log(");
  cleaned = cleaned.split("abs(").join("Math.abs(");

  // Convert simple x^y to Math.pow(x,y)
  var safety = 0;
  while (cleaned.indexOf("^") !== -1 && safety < 20) {
    safety++;
    var idx = cleaned.indexOf("^");
    var leftStart = idx - 1;
    var rightEnd = idx + 1;

    while (leftStart >= 0 && /[0-9.]/.test(cleaned.charAt(leftStart))) {
      leftStart--;
    }
    leftStart++;

    while (rightEnd < cleaned.length && /[0-9.]/.test(cleaned.charAt(rightEnd))) {
      rightEnd++;
    }

    if (leftStart === idx || rightEnd === idx + 1) {
      return null;
    }

    var left = cleaned.substring(leftStart, idx);
    var right = cleaned.substring(idx + 1, rightEnd);
    var replacement = "Math.pow(" + left + "," + right + ")";
    cleaned = cleaned.substring(0, leftStart) + replacement + cleaned.substring(rightEnd);
  }

  // Whitelist check — only digits, operators, parens, dots, commas, spaces
  // and known Math function tokens
  var stripped = cleaned.split("Math.").join("");

  // Remaining must match ONLY safe characters
  if (!/^[0-9+\-*/().,%\s a-zA-Z]*$/.test(stripped)) {
    return null;
  }

  // Identify function names
  var identifiers = stripped.match(/[a-zA-Z]+/g) || [];
  var allowedNames = ["sqrt", "sin", "cos", "tan", "log10", "log", "abs", "pow", "PI", "E"];
  for (var i = 0; i < identifiers.length; i++) {
    if (allowedNames.indexOf(identifiers[i]) === -1) {
      return null;
    }
  }

  try {
    var fn = new Function("return (" + cleaned + ")");
    var result = fn();
    if (typeof result !== "number" || !isFinite(result)) return null;
    return result;
  } catch (e) {
    return null;
  }
}


// ============================================================
// EXTRA UNIT CATEGORIES
// ============================================================
export const EXTRA_UNITS = {
  energy: {
    base: "J",
    units: {
      J: 1, kJ: 1000, cal: 4.184, kcal: 4184,
      Wh: 3600, kWh: 3600000, BTU: 1055.06, eV: 1.60218e-19
    }
  },
  power: {
    base: "W",
    units: {
      W: 1, kW: 1000, MW: 1000000, hp: 745.7,
      PS: 735.5, BTU_h: 0.293071, cal_s: 4.184
    }
  },
  density: {
    base: "kgm3",
    units: {
      kgm3: 1, gcm3: 1000, kgl: 1000, lbft3: 16.0185,
      lbgal: 119.826, API: -1
    }
  },
  force: {
    base: "N",
    units: {
      N: 1, kN: 1000, kgf: 9.80665, lbf: 4.44822,
      dyn: 0.00001, tonf: 9806.65
    }
  },
  viscosity: {
    base: "Pas",
    units: {
      Pas: 1, mPas: 0.001, cP: 0.001, poise: 0.1,
      cSt: -1, St: -1
    }
  }
};

// Merge into main UNIT_CONVERTERS
Object.keys(EXTRA_UNITS).forEach(function(k) {
  UNIT_CONVERTERS[k] = EXTRA_UNITS[k];
});

// ============================================================
// PIPE ROUGHNESS (mm)
// ============================================================
export const PIPE_ROUGHNESS = {
  steel: { label: { fa: "فولاد تجاری", en: "Commercial Steel" }, value: 0.045 },
  stainless: { label: { fa: "استیل", en: "Stainless Steel" }, value: 0.015 },
  castIron: { label: { fa: "چدن", en: "Cast Iron" }, value: 0.26 },
  galvanized: { label: { fa: "گالوانیزه", en: "Galvanized" }, value: 0.15 },
  pvc: { label: { fa: "PVC", en: "PVC" }, value: 0.0015 },
  copper: { label: { fa: "مس", en: "Copper" }, value: 0.0015 },
  concrete: { label: { fa: "بتن", en: "Concrete" }, value: 0.3 },
  hdpe: { label: { fa: "HDPE", en: "HDPE" }, value: 0.007 }
};

// ============================================================
// FRICTION LOSS — Darcy-Weisbach + Swamee-Jain
// ============================================================
export function calcFrictionLoss(params) {
  const flow_m3h = params.flow_m3h;
  const diameter_mm = params.diameter_mm;
  const length_m = params.length_m;
  const roughness_mm = params.roughness_mm;
  const density = params.density || 1000;
  const viscosity = params.viscosity || 0.001;

  if (diameter_mm <= 0) return { error: "Diameter must be > 0" };
  if (length_m <= 0) return { error: "Length must be > 0" };

  const d_m = diameter_mm / 1000;
  const area_m2 = Math.PI * Math.pow(d_m / 2, 2);
  const Q_m3s = flow_m3h / 3600;
  const velocity = Q_m3s / area_m2;

  // Reynolds number
  const Re = (density * velocity * d_m) / viscosity;

  // Friction factor (Swamee-Jain approximation of Colebrook)
  let f;
  if (Re < 2300) {
    // Laminar
    f = 64 / Re;
  } else {
    const eps = roughness_mm / 1000;
    const term = eps / (3.7 * d_m) + 5.74 / Math.pow(Re, 0.9);
    f = 0.25 / Math.pow(Math.log10(term), 2);
  }

  // Head loss (Darcy-Weisbach): hf = f * (L/D) * (v²/2g)
  const g = 9.81;
  const hf = f * (length_m / d_m) * (Math.pow(velocity, 2) / (2 * g));
  // Pressure drop: ΔP = f * (L/D) * (ρ·v²/2)
  const dP_Pa = f * (length_m / d_m) * (density * Math.pow(velocity, 2) / 2);
  const dP_bar = dP_Pa / 100000;

  return {
    velocity: +velocity.toFixed(3),
    Re: Math.round(Re),
    frictionFactor: +f.toFixed(5),
    headLoss_m: +hf.toFixed(3),
    pressureDrop_Pa: Math.round(dP_Pa),
    pressureDrop_bar: +dP_bar.toFixed(4),
    pressureDrop_kPa: +(dP_Pa / 1000).toFixed(2)
  };
}

// ============================================================
// VELOCITY from Q + D
// ============================================================
export function calcVelocity(params) {
  const flow_m3h = params.flow_m3h;
  const diameter_mm = params.diameter_mm;
  if (diameter_mm <= 0) return { error: "Diameter must be > 0" };
  const d_m = diameter_mm / 1000;
  const area_m2 = Math.PI * Math.pow(d_m / 2, 2);
  const Q_m3s = flow_m3h / 3600;
  const velocity = Q_m3s / area_m2;
  return {
    velocity_ms: +velocity.toFixed(3),
    velocity_fts: +(velocity * 3.28084).toFixed(2),
    area_m2: +area_m2.toFixed(6)
  };
}
