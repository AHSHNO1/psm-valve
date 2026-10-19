import test from "node:test";
import assert from "node:assert/strict";
import {
  SYSTEMS, formToSI, formFromSI,
  pressureToBar, barToPressure, tempToC, cToTemp,
  flowToEngine, engineToFlow, flowUnitGroups, flowUnitKind, defaultFlowUnit,
  ggFromMW, mwFromGg, gasNormalDensity, liquidDensity, fluidDensity,
  velocityFromSI, velocityToSI, dnToInch, inchToDn, engineFlowUnit
} from "../lib/unit-system.js";

function close(actual, expected, tol = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} != ${expected} (tol ${tol})`);
}

test("pressure units convert to bar and back", () => {
  close(pressureToBar(100, "psi"), 6.89476, 1e-6);
  close(barToPressure(6.89476, "psi"), 100, 1e-4);
  close(pressureToBar(10, "bar"), 10);
  close(pressureToBar(1000, "kPa"), 10);
  assert.equal(pressureToBar(null, "bar"), null);
});

test("temperature units convert to celsius and back", () => {
  close(tempToC(68, "°F"), 20, 1e-9);
  close(cToTemp(20, "°F"), 68, 1e-9);
  close(tempToC(300, "K"), 26.85, 1e-9);
  assert.equal(tempToC(null, "°C"), null);
});

test("volumetric flow units land on the engine unit", () => {
  // 1 gpm = 0.227125 m3/h — مرجع: گالن آمریکایی
  close(flowToEngine(100, "gpm", "liquid", { Gf: 1 }).value, 22.7125, 1e-9);
  // 1 SCFM = 1.699 Nm3/h
  close(flowToEngine(100, "SCFM", "gas", { Gg: 1 }).value, 169.9, 1e-9);
  close(flowToEngine(60, "L/min", "liquid", { Gf: 1 }).value, 3.6, 1e-9);
  close(engineToFlow(3.6, "L/min", "liquid", { Gf: 1 }).value, 60, 1e-9);
  close(engineToFlow(22.7125, "gpm", "liquid", { Gf: 1 }).value, 100, 1e-6);
});

test("mass flow converts through fluid density (MW for gas, Gf for liquid)", () => {
  // Dry air in normal conditions: reference density 1.2922 kg/Nm3
  const air = flowToEngine(100, "kg/h", "gas", { MW: 28.96 });
  assert.equal(air.unit, "Nm³/h");
  close(air.value, 100 / 1.2922, 0.02);
  // MW و Gg همارز هستند: Gg=1 ↔ MW=28.96
  close(flowToEngine(100, "kg/h", "gas", { Gg: 1 }).value, air.value, 1e-9);
  // آب: 1000 kg/h با Gf=1 برابر 1 m3/h است
  close(flowToEngine(1000, "kg/h", "liquid", { Gf: 1 }).value, 1, 1e-9);
  // بازگشت جرمی: 100 kg/h هوا = 220.46 lb/h
  close(engineToFlow(air.value, "lb/h", "gas", { MW: 28.96 }).value, 220.46, 0.02);
  // بدون MW/Gg تبدیل جرمی↔حجمی گاز ممکن نیست
  assert.equal(flowToEngine(100, "kg/h", "gas").error, "densityRequired");
  assert.equal(engineToFlow(100, "kg/h", "gas").error, "densityRequired");
});

test("steam accepts mass units only", () => {
  assert.equal(engineFlowUnit("steam"), "kg/h");
  close(flowToEngine(500, "kg/h", "steam").value, 500, 1e-9);
  close(flowToEngine(1, "t/h", "steam").value, 1000, 1e-9);
  close(engineToFlow(1000, "lb/h", "steam").value, 1000 / 0.453592, 1e-9);
  assert.ok(flowToEngine(100, "gpm", "steam").error);
  assert.ok(engineToFlow(100, "gpm", "steam").error);
});

test("density helpers keep MW and Gg consistent", () => {
  close(ggFromMW(28.96), 1, 1e-12);
  close(mwFromGg(0.65), 18.824, 1e-9);
  close(gasNormalDensity({ Gg: 1 }), gasNormalDensity({ MW: 28.96 }), 1e-12);
  close(liquidDensity(1.025), 1025, 1e-9);
  assert.equal(fluidDensity("liquid", { Gf: 0 }), null);
  assert.equal(gasNormalDensity({}), null);
});

test("flow unit groups match the selected fluid", () => {
  assert.equal(defaultFlowUnit("SI", "liquid"), "m³/h");
  assert.equal(defaultFlowUnit("IMPERIAL", "liquid"), "gpm");
  assert.equal(defaultFlowUnit("IMPERIAL", "gas"), "SCFM");
  assert.equal(defaultFlowUnit("IMPERIAL", "steam"), "lb/h");
  assert.equal(SYSTEMS.IMPERIAL.flowMass, "lb/h");
  assert.equal(SYSTEMS.SI.flowMass, "kg/h");
  assert.equal(engineFlowUnit("gas"), "Nm³/h");

  const liquidGroups = flowUnitGroups("liquid");
  assert.ok(liquidGroups.some((g) => g.id === "mass"));
  assert.ok(liquidGroups.some((g) => g.units.includes("gpm")));
  assert.equal(flowUnitKind("gpm"), "volumetric");
  assert.equal(flowUnitKind("lb/h"), "mass");

  const steamGroups = flowUnitGroups("steam");
  assert.equal(steamGroups.length, 1);
  assert.equal(steamGroups[0].id, "mass");
  assert.ok(!steamGroups[0].units.includes("gpm"));
});

test("form conversions respect explicit flow units and stay null-safe", () => {
  // 60 L/min در حالت SI هم باید به 3.6 m3/h تبدیل شود (واحد صریح کاربر)
  const si = formToSI({ Q: 60, QUnit: "L/min", Gf: 1, P1: 5, P2: 3 }, "SI", "liquid");
  close(si.Q, 3.6, 1e-9);
  const back = formFromSI(si, "SI", "liquid");
  close(back.Q, 60, 1e-6);

  // مقادیر خالی نباید به صفر تبدیل شوند
  const empty = formToSI({ Q: null, P1: null, T: null }, "SI", "liquid");
  assert.equal(empty.Q, null);
  assert.equal(empty.P1, null);
  assert.equal(empty.T, null);
});

test("imperial form conversion covers mass flow, pressure, temperature and pipe size", () => {
  // دبی حجمی گاز در حالت اینچی بر پایهٔ SCFM نمایش داده میشود (1 SCFM = 1.699 Nm3/h)
  const imperial = formFromSI({ Q: 100, MW: 28.96, Gg: 1, P1: 10, P2: 7, T: 20, Z: 1, k: 1.4, xT: 0.7, pipeDn: 101.6 }, "IMPERIAL", "gas");
  // بدون انتخاب صریح، واحد پیشفرض سیستم اعمال میشود ولی در فرم قفل نمیشود
  assert.equal(imperial.QUnit, undefined);
  close(imperial.Q, 100 / 1.699, 1e-9);
  close(imperial.P1, 145.0377, 1e-4);
  close(imperial.T, 68, 1e-9);
  close(imperial.pipeDn, 4, 1e-9);

  // انتخاب صریح کاربر حفظ میشود
  const explicit = formFromSI({ Q: 100, QUnit: "SCFM", MW: 28.96, Gg: 1 }, "IMPERIAL", "gas");
  assert.equal(explicit.QUnit, "SCFM");
  close(explicit.Q, 100 / 1.699, 1e-9);

  // دبی جرمی: 220.46 lb/h هوا با MW=28.96 → 77.4 Nm3/h (100 kg/h ÷ 1.2921 kg/Nm3)
  const massInput = Object.assign({}, imperial, { Q: 220.46, QUnit: "lb/h" });
  const si = formToSI(massInput, "IMPERIAL", "gas");
  close(si.Q, 77.4, 0.05);
  close(si.pipeDn, 101.6, 1e-9);
});

test("velocity and pipe size helpers convert both ways", () => {
  close(velocityFromSI(1, "ft/s"), 3.28084, 1e-6);
  close(velocityToSI(3.28084, "ft/s"), 1, 1e-6);
  close(velocityFromSI(3, "m/s"), 3, 1e-12);
  close(dnToInch(25.4), 1, 1e-12);
  close(inchToDn(4), 101.6, 1e-12);
  assert.equal(dnToInch(null), null);
  assert.equal(SYSTEMS.IMPERIAL.pressure, "psi");
});