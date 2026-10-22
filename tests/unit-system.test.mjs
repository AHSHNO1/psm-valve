import test from "node:test";
import assert from "node:assert/strict";
import {
  SYSTEMS, formToSI, formFromSI,
  pressureToBar, barToPressure, tempToC, cToTemp,
  flowToEngine, engineToFlow, flowUnitGroups, flowUnitKind, defaultFlowUnit,
  ggFromMW, mwFromGg, gasNormalDensity, liquidDensity, fluidDensity,
  velocityFromSI, velocityToSI, dnToInch, inchToDn, engineFlowUnit,
  UNIT_CATEGORIES, FIELD_UNIT_CATEGORY, SYSTEM_DEFAULT_UNITS,
  unitGroups, fieldUnit, fieldUnitKeys, unitToSI, unitFromSI, convertFieldUnit
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
test("formToSI converts QMin with the same unit as Q", () => {
  const si = formToSI({ Q: 300, QMin: 60, QUnit: "L/min", Gf: 1, P1: 5, P2: 3 }, "SI", "liquid");
  assert.equal(si.Q, 18); // 300 L/min = 18 m³/h
  assert.ok(Math.abs(si.QMin - 3.6) < 1e-9); // 60 L/min = 3.6 m³/h
});

// ============================================================
// واحد مستقل برای هر فیلد (مثل فیلد Q)
// ============================================================
test("every convertible field has a unit category, default and picker groups", () => {
  for (const field of Object.keys(FIELD_UNIT_CATEGORY)) {
    const category = FIELD_UNIT_CATEGORY[field];
    assert.ok(UNIT_CATEGORIES[category], `${field} maps to a known category`);
    assert.ok(unitGroups(category).length > 0, `${category} has picker groups`);
    for (const group of unitGroups(category)) {
      for (const unit of group.units) {
        assert.ok(UNIT_CATEGORIES[category].factors[unit] != null, `${category}/${unit} needs a factor`);
      }
    }
    const defaultUnit = SYSTEM_DEFAULT_UNITS.SI[category];
    assert.equal(fieldUnit({}, field, "SI"), defaultUnit);
    assert.equal(fieldUnit({ [`${field}Unit`]: "kg/cm²" }, field, "SI"),
      category === "pressure" ? "kg/cm²" : defaultUnit);
  }
  assert.equal(fieldUnit({}, "Z", "SI"), null); // بی‌بعد: واحد ندارد
  assert.ok(fieldUnitKeys().includes("P1Unit") && fieldUnitKeys().includes("QUnit"));
});

test("pressure, temperature and percent fields convert per-field", () => {
  close(unitToSI("pressure", 100, "psi").value, 6.89476, 1e-6);
  close(unitToSI("pressure", 10, "kg/cm²").value, 9.80665, 1e-6);
  close(unitFromSI("pressure", 6.89476, "psi").value, 100, 1e-4);
  close(unitToSI("temperature", 212, "°F").value, 100, 1e-9);
  close(unitToSI("temperature", 373.15, "K").value, 100, 1e-9);
  close(unitToSI("percent", 0.2, "fraction").value, 20, 1e-12);
  close(convertFieldUnit("pressure", 100, "psi", "bar").value, 6.89476, 1e-6);
  assert.equal(unitToSI("pressure", 5, "°C").error, "unknownUnit");
});

test("dynamic viscosity needs density, kinematic does not", () => {
  // ν[cSt] = μ[cP] ÷ ρ[g/cm³] → 20 cP با چگالی 0.8 برابر 25 cSt
  close(unitToSI("viscosity", 20, "cP", { Gf: 0.8 }).value, 25, 1e-12);
  close(unitFromSI("viscosity", 25, "cP", { Gf: 0.8 }).value, 20, 1e-12);
  assert.equal(unitToSI("viscosity", 20, "cP").error, "densityRequired");
  close(unitToSI("viscosity", 30, "cSt").value, 30, 1e-12);
  close(unitToSI("viscosity", 1, "m²/s").value, 1e6, 1e-6);
});

test("relative density normalizes to the engine unit; ratios have no unit picker", () => {
  close(unitToSI("density", 850, "kg/m³").value, 0.85, 1e-12);
  close(unitToSI("density", 53.06, "lb/ft³").value, 0.85, 1e-4);
  close(unitFromSI("density", 0.85, "kg/m³").value, 850, 1e-9);
  // Gg (نسبت به هوا) و MW (g/mol = kg/kmol = lb/lbmol) تبدیل واحد معنا ندارند
  assert.equal(FIELD_UNIT_CATEGORY.Gg, undefined);
  assert.equal(FIELD_UNIT_CATEGORY.MW, undefined);
});

test("formToSI honors per-field units and the density context order", () => {
  const si = formToSI({
    Gf: 850, GfUnit: "kg/m³",     // → 0.85 نسبی
    nu: 20, nuUnit: "cP",          // → 20 / 0.85 = 23.53 cSt
    P1: 100, P1Unit: "psi",        // → 6.89476 bar
    P2: 50, P2Unit: "psi",
    T: 212, TUnit: "°F",           // → 100 °C
    pipeDn: 4, pipeDnUnit: "in",   // → 101.6 mm
    marginPct: 0.2, marginPctUnit: "fraction", // → 20 %
    Q: 100, QUnit: "kg/h"          // جرمی → حجمی با چگالی مایع 850 kg/m³
  }, "SI", "liquid");
  close(si.Gf, 0.85, 1e-12);
  close(si.nu, 20 / 0.85, 1e-9);
  close(si.P1, 6.89476, 1e-6);
  close(si.P2, 3.44738, 1e-6);
  close(si.T, 100, 1e-9);
  close(si.pipeDn, 101.6, 1e-9);
  close(si.marginPct, 20, 1e-12);
  close(si.Q, 100 / 850, 1e-9);
  // انتخاب صریح کاربر برای بازیابی در فرم حفظ میشود
  assert.equal(si.GfUnit, "kg/m³");
  assert.equal(si.P1Unit, "psi");
});

test("per-field units survive a full form round-trip", () => {
  const form = {
    Gf: 850, GfUnit: "kg/m³", nu: 20, nuUnit: "cP",
    P1: 100, P1Unit: "psi", P2: 50, Pv: 0.5,
    T: 212, TUnit: "°F", pipeDn: 4, pipeDnUnit: "in",
    marginPct: 0.2, marginPctUnit: "fraction",
    Q: 100, QMin: 20, QUnit: "kg/h"
  };
  const back = formFromSI(formToSI(form, "SI", "liquid"), "SI", "liquid");
  close(back.Gf, 850, 1e-6);
  close(back.nu, 20, 1e-6);
  close(back.P1, 100, 1e-6);
  close(back.P2, 50, 1e-4);
  close(back.Pv, 0.5, 1e-9); // بدون واحد صریح: پیشفرض سیستم
  close(back.T, 212, 1e-6);
  close(back.pipeDn, 4, 1e-9);
  close(back.marginPct, 0.2, 1e-12);
  close(back.Q, 100, 1e-6);
  close(back.QMin, 20, 1e-6);
  assert.equal(back.GfUnit, "kg/m³");
  assert.equal(back.nuUnit, "cP");
});

test("unitless MW still drives the mass-to-volume gas conversion", () => {
  // MW بی‌بعد است؛ با این حال تبدیل kg/h → Nm³/h باید درست بماند
  const si = formToSI({ MW: 28.96, Q: 100, QUnit: "kg/h" }, "IMPERIAL", "gas");
  close(si.Q, 100 / 1.2922, 0.02);
  close(si.MW, 28.96, 1e-12);
  assert.equal(si.MWUnit, undefined);
});
