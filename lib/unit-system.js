// ============================================================
// UNIT SYSTEM — SI ↔ Imperial
// ============================================================

export const SYSTEMS = {
  SI: {
    id: "SI",
    label: { fa: "متریک (SI)", en: "Metric (SI)", ar: "متري (SI)", ru: "Метрическая (SI)" },
    pressure: "bar",
    pressureLabel: "bar",
    flowLiquid: "m³/h",
    flowGas: "Nm³/h",
    flowSteam: "kg/h",
    temp: "°C",
    tempLabel: "°C",
    velocity: "m/s",
    noise: "dB",
    dP: "bar"
  },
  IMPERIAL: {
    id: "IMPERIAL",
    label: { fa: "اینچی (Imperial)", en: "Imperial", ar: "إمبراطوري", ru: "Имперская" },
    pressure: "psi",
    pressureLabel: "psi",
    flowLiquid: "gpm",
    flowGas: "SCFM",
    flowSteam: "lb/h",
    temp: "°F",
    tempLabel: "°F",
    velocity: "ft/s",
    noise: "dB",
    dP: "psi"
  }
};

// ============================================================
// Conversions: value in [unit] -> SI base
// ============================================================
export function pressureToBar(v, fromUnit) {
  if (fromUnit === "psi") return v * 0.0689476;
  return v; // bar
}
export function barToPressure(v, toUnit) {
  if (toUnit === "psi") return v / 0.0689476;
  return v;
}

export function flowToM3h(v, fromUnit) {
  if (fromUnit === "gpm") return v * 0.227125;
  if (fromUnit === "L/min") return v * 0.06;
  if (fromUnit === "SCFM" || fromUnit === "cfm") return v * 1.699;
  return v; // m³/h or Nm³/h
}
export function m3hToFlow(v, toUnit) {
  if (toUnit === "gpm") return v / 0.227125;
  if (toUnit === "L/min") return v / 0.06;
  if (toUnit === "SCFM" || toUnit === "cfm") return v / 1.699;
  return v;
}

export function steamToKgh(v, fromUnit) {
  if (fromUnit === "lb/h") return v * 0.453592;
  return v; // kg/h
}
export function kghToSteam(v, toUnit) {
  if (toUnit === "lb/h") return v / 0.453592;
  return v;
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
export function formToSI(form, fromSystem, fluid = "liquid") {
  if (fromSystem === "SI") return { ...form };
  const flowUnit = fluid === "gas"
    ? SYSTEMS.IMPERIAL.flowGas
    : SYSTEMS.IMPERIAL.flowLiquid;
  return {
    ...form,
    Q: flowToM3h(form.Q || 0, flowUnit),
    W: steamToKgh(form.W || 0, SYSTEMS.IMPERIAL.flowSteam),
    P1: pressureToBar(form.P1 || 0, SYSTEMS.IMPERIAL.pressure),
    P2: pressureToBar(form.P2 || 0, SYSTEMS.IMPERIAL.pressure),
    Pv: pressureToBar(form.Pv || 0, SYSTEMS.IMPERIAL.pressure),
    Pc: pressureToBar(form.Pc || 0, SYSTEMS.IMPERIAL.pressure),
    T: tempToC(form.T || 0, SYSTEMS.IMPERIAL.temp)
  };
}

export function formFromSI(formSI, toSystem, fluid = "liquid") {
  if (toSystem === "SI") return { ...formSI };
  const flowUnit = fluid === "gas"
    ? SYSTEMS.IMPERIAL.flowGas
    : SYSTEMS.IMPERIAL.flowLiquid;
  return {
    ...formSI,
    Q: m3hToFlow(formSI.Q || 0, flowUnit),
    W: kghToSteam(formSI.W || 0, SYSTEMS.IMPERIAL.flowSteam),
    P1: barToPressure(formSI.P1 || 0, SYSTEMS.IMPERIAL.pressure),
    P2: barToPressure(formSI.P2 || 0, SYSTEMS.IMPERIAL.pressure),
    Pv: barToPressure(formSI.Pv || 0, SYSTEMS.IMPERIAL.pressure),
    Pc: barToPressure(formSI.Pc || 0, SYSTEMS.IMPERIAL.pressure),
    T: cToTemp(formSI.T || 0, SYSTEMS.IMPERIAL.temp)
  };
}