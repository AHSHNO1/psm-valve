import test from "node:test";
import assert from "node:assert/strict";
import {
  API526_ORIFICES,
  api526Orifice,
  api520C,
  criticalPressureRatio,
  subcriticalF2,
  relievingPressure,
  reliefLoad,
  calcPsvCv
} from "../lib/psv-sizing.js";

// ============================================================
// API 526 orifice table sanity
// ============================================================
test("API 526 table lists the 14 standard letters with derived cm2", () => {
  assert.equal(API526_ORIFICES.length, 14);
  assert.deepEqual(
    API526_ORIFICES.map((r) => r.letter),
    ["D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "T"]
  );
  // I, O, S هرگز در حروف orifice استفاده نمی‌شوند
  assert.ok(!API526_ORIFICES.some((r) => ["I", "O", "S"].includes(r.letter)));
  // مؤثرترین مساحت‌های API 526 (in²) — D کوچک‌ترین، T بزرگ‌ترین بدنهٔ استاندارد
  assert.equal(API526_ORIFICES[0].areaIn2, 0.11);
  assert.equal(API526_ORIFICES[API526_ORIFICES.length - 1].areaIn2, 26.0);
  for (const row of API526_ORIFICES) {
    assert.equal(row.areaCm2, +(row.areaIn2 * 6.4516).toFixed(2));
    assert.equal(row.areaMm2, +(row.areaIn2 * 645.16).toFixed(1));
  }
  // پلهٔ مساحت باید اکیداً صعودی باشد (وگرنه انتخاب کوچک‌ترین حرف اشتباه می‌شود)
  for (let i = 1; i < API526_ORIFICES.length; i++) {
    assert.ok(API526_ORIFICES[i].areaCm2 > API526_ORIFICES[i - 1].areaCm2);
  }
});

test("api526Orifice picks the smallest fitting letter at boundaries", () => {
  // مرز D/E: D = 0.110 in² = 0.71 cm²
  assert.equal(api526Orifice(0.71).letter, "D");
  assert.equal(api526Orifice(0.72).letter, "E");
  // مساحت دقیقاً برابر سطر خودش → همان سطر (≥ نه >)
  assert.equal(api526Orifice(API526_ORIFICES[0].areaCm2).letter, "D");
  assert.equal(api526Orifice(API526_ORIFICES[0].areaCm2).insufficient, false);
  // مرز N/P: N = 4.34 in² = 28.00 cm²
  const nCm2 = +(4.34 * 6.4516).toFixed(2);
  assert.equal(api526Orifice(nCm2).letter, "N");
  assert.equal(api526Orifice(nCm2 + 0.01).letter, "P");
  // E یک مساحت میانی نمونه را نمی‌بازد: 1.26 cm² < 1.98 → F
  assert.equal(api526Orifice(1.97).letter, "F");
});

test("api526Orifice returns the largest orifice flagged insufficient", () => {
  const biggest = API526_ORIFICES[API526_ORIFICES.length - 1];
  const over = api526Orifice(biggest.areaCm2 + 1);
  assert.equal(over.letter, biggest.letter);
  assert.equal(over.insufficient, true);
  const under = api526Orifice(biggest.areaCm2);
  assert.equal(under.insufficient, false);
});

test("api526Orifice validates its input", () => {
  assert.ok(api526Orifice(0).error);
  assert.ok(api526Orifice(-5).error);
  assert.ok(api526Orifice(NaN).error);
  assert.ok(api526Orifice("abc").error);
});

test("DN hints come from the API 526 body designation of each letter", () => {
  assert.deepEqual(API526_ORIFICES[0].dn, { inlet: "DN25", outlet: "DN50", nps: '1x2"' });
  assert.equal(API526_ORIFICES[4].dn.inlet, "DN50"); // H → 2H3
  assert.equal(API526_ORIFICES[5].dn.inlet, "DN80"); // J → 3J4
  assert.equal(API526_ORIFICES[13].dn.nps, '8x10"'); // T → 8T10
  assert.equal(API526_ORIFICES[13].dn.outlet, "DN250");
  // هر ۱۴ سطر استاندارد API 526 نشانهٔ بدنه دارد
  for (const row of API526_ORIFICES) {
    assert.ok(row.designations && row.designations.length > 0, row.letter);
    assert.ok(row.dn, "missing dn for " + row.letter);
    assert.ok(row.designations[0].includes(row.letter), "designation must carry the orifice letter");
  }
});

// ============================================================
// Helper functions
// ============================================================
test("relievingPressure converts gauge to absolute with accumulation", () => {
  const p = relievingPressure({ setPressureBar: 10, overpressurePct: 10 });
  assert.equal(p.P1RelievingBar, +(10 * 1.1 + 1.01325).toFixed(4)); // 12.0133 bar absolute
  assert.equal(relievingPressure({ setPressureBar: 10 }).overpressurePct, 10);
  assert.ok(relievingPressure({ setPressureBar: 0 }).error);
  assert.ok(relievingPressure({ setPressureBar: 10, overpressurePct: 25 }).error);
});

test("reliefLoad converts liquid volumetric flow to mass flow", () => {
  assert.equal(reliefLoad({ type: "liquidThermal", qM3h: 2, densityKgM3: 850 }).W, 1700);
  assert.ok(reliefLoad({ type: "fire" }).error);
  assert.ok(reliefLoad({ type: "liquidThermal", qM3h: -1, densityKgM3: 850 }).error);
});

test("critical ratio and C coefficient match the published SI values", () => {
  // هوا k=1.4 → نسبت بحرانی ≈ 0.528
  assert.ok(Math.abs(criticalPressureRatio(1.4) - 0.5283) < 0.0002);
  // C = 0.03948·√(k·(2/(k+1))^((k+1)/(k−1))) برای k=1.4 ≈ 0.0270
  assert.equal(api520C(1.4), 0.027);
  const cHand = 0.03948 * Math.sqrt(1.4 * Math.pow(2 / 2.4, 2.4 / 0.4));
  assert.ok(Math.abs(api520C(1.4) - +cHand.toFixed(4)) < 1e-9);
  assert.ok(api520C(1).error);
});

test("subcriticalF2 is continuous at the critical pressure ratio", () => {
  // پیوستگی: در r = نسبت بحرانی، معادله ۱۷.۹/F2 باید همان مساحت جریان
  // بحرانی C را بدهد — نسبت 17.9·C/(F2·√(1−r)) ≈ 1
  const k = 1.4;
  const rc = criticalPressureRatio(k);
  const f2 = subcriticalF2({ k, r: rc });
  const ratio = (17.9 * 0.0270338) / (f2 * Math.sqrt(1 - rc));
  assert.ok(Math.abs(ratio - 1) < 0.005, "F2 branch must join the critical branch smoothly");
  assert.ok(subcriticalF2({ k: 1.4, r: 1.2 }).error);
  assert.ok(subcriticalF2({ k: 0.9, r: 0.5 }).error);
});

// ============================================================
// Vapour, critical flow — hand-worked air example
// ============================================================
test("air relief at critical flow matches an independent hand calculation", () => {
  // مثال دستی: هوا W = 1000 kg/h، M = 28.96، T = 300 K، Z = 1
  // set = 10 bar گیج، overpressure 10% ⇒ P1 = 12.01325 barabs = 1201.325 kPa
  // Kd = 0.975 پیش‌فرض، backpressure اتمسفر ⇒ r = 0.084 < 0.528 جریان بحرانی
  const res = calcPsvCv({
    fluidType: "gas", W: 1000, M: 28.96, T: 300, Z: 1, k: 1.4,
    setPressureBar: 10, overpressurePct: 10, backPressureBar: 1.01325
  });
  assert.equal(res.error, undefined);
  assert.ok(Math.abs(res.P1RelievingBar - 12.01325) < 1e-4); // گیج→مطلق با انباشت ۱۰٪
  assert.equal(res.flowRegime, "critical");
  assert.equal(res.indicative, true);

  // محاسبهٔ مستقل (بدون استفاده از ثابت‌های موتور):
  const P1kPa = (10 * 1.1 + 1.01325) * 100;
  const C = 0.03948 * Math.sqrt(1.4 * Math.pow(2 / 2.4, 6));
  const areaHand = (1000 / (C * 0.975 * P1kPa)) * Math.sqrt(300 / 28.96);
  // ≈ 101.6 mm² — موتور باید در ۱٪ همان عدد باشد
  assert.ok(Math.abs(res.areaMm2 - areaHand) / areaHand < 0.01);
  assert.ok(Math.abs(res.areaMm2 - 101.6) < 2);

  assert.equal(res.requiredOrifice.letter, "E"); // 1.016 cm² ≤ E (1.26 cm²), نه F
  assert.equal(res.requiredOrifice.insufficient, false);
  assert.equal(res.requiredOrifice.dn.inlet, "DN25");
  assert.ok(res.utilisation > 0.75 && res.utilisation < 0.85);
  assert.ok(res.capacityKgH > 1000); // ظرفیت orifice انتخابی باید ≥ بار تخلیه باشد
  assert.match(res.equation, /5\.6\.2/);

  const keys = res.warnings.map((w) => w.key);
  assert.ok(keys.includes("kdDefault"));
  assert.ok(!keys.includes("capacityMargin")); // E نزدیک به نیاز است، بیش‌سایز نیست
  for (const w of res.warnings) {
    assert.ok(["danger", "warning", "info"].includes(w.type));
    assert.equal(typeof w.key, "string");
    assert.equal(typeof w.text, "string");
    assert.equal(typeof w.params, "object");
  }
});

// ============================================================
// Critical → subcritical switch on the same duty
// ============================================================
test("raising backpressure across the critical ratio switches equation and warns", () => {
  const base = {
    fluidType: "vapor", W: 1000, M: 28.96, T: 300, Z: 1, k: 1.4,
    setPressureBar: 10, overpressurePct: 10
  };
  const crit = calcPsvCv({ ...base, backPressureBar: 4 }); // r ≈ 0.333
  assert.equal(crit.flowRegime, "critical");
  assert.equal(crit.Kb, 1);

  const sub = calcPsvCv({ ...base, backPressureBar: 8 }); // r = 8/12.01325 ≈ 0.666 > 0.528
  assert.equal(sub.flowRegime, "subcritical");
  assert.match(sub.equation, /5\.6\.4/);
  assert.ok(sub.warnings.some((w) => w.key === "subcriticalFlow"));
  assert.ok(sub.areaMm2 > crit.areaMm2); // زیربحرانی به مساحت بیشتری نیاز دارد

  // محاسبهٔ مستقل F2 و مساحت در r = 8/12.01325
  const P1 = 12.01325;
  const r = 8 / P1;
  const f2 = Math.sqrt((1.4 / 0.4) * Math.pow(r, 2 / 1.4) * ((1 - Math.pow(r, 0.4 / 1.4)) / (1 - r)));
  const areaHand = (17.9 * 1000 / (f2 * 0.975)) * Math.sqrt(300 / (28.96 * P1 * 100 * (P1 - 8) * 100));
  assert.ok(Math.abs(sub.areaMm2 - areaHand) / areaHand < 0.01);
  assert.ok(Math.abs(sub.F2 - +f2.toFixed(4)) < 1e-4);
});

test("supplied Kb is honoured in critical flow but absorbed by F2 in subcritical", () => {
  const base = {
    fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4,
    P1: 20, backPressureBar: 1.01325, Kb: 0.8
  };
  const crit = calcPsvCv(base);
  assert.equal(crit.Kb, 0.8);
  assert.ok(crit.areaMm2 > calcPsvCv({ ...base, Kb: 1 }).areaMm2); // Kb<1 مساحت را زیاد می‌کند

  const sub = calcPsvCv({ ...base, backPressureBar: 14 }); // r = 0.7 > 0.528
  assert.equal(sub.flowRegime, "subcritical");
  assert.equal(sub.Kb, 1);
  assert.ok(sub.notes.some((n) => /Kb/.test(n)));
});

// ============================================================
// Liquid case
// ============================================================
test("liquid sizing uses the 11.78 SI equation with effective Kd 0.65", () => {
  // Q = 20 m³/h (= 333.33 L/min)، G = 0.85، set 10 bar، back 6 barabs
  const res = calcPsvCv({
    fluidType: "liquid", Q: 20, G: 0.85,
    setPressureBar: 10, overpressurePct: 10, backPressureBar: 6
  });
  assert.equal(res.error, undefined);
  assert.equal(res.flowRegime, "dp-driven");
  assert.equal(res.Kd, 0.65);
  assert.equal(res.C, null);

  // محاسبهٔ مستقل: A = 11.78·Q[L/min]·√(G/ΔP[kPa])/(Kd·Kc)
  const dPkPa = (10 * 1.1 + 1.01325 - 6) * 100;
  const areaHand = (11.78 * (20 * 1000 / 60) * Math.sqrt(0.85 / dPkPa)) / 0.65;
  assert.ok(Math.abs(res.areaMm2 - areaHand) / areaHand < 0.01);
  assert.ok(Math.abs(res.areaMm2 - 227.1) < 5); // ≈ 227 mm²

  assert.equal(res.requiredOrifice.letter, "G"); // 2.27 cm² → G (3.25 cm²)
  assert.equal(res.requiredOrifice.dn.nps, '1x2"');
  assert.ok(res.capacityKgH > 20 * 850); // ظرفیت m³/h×ρ جاری باید از بار بیشتر باشد
  assert.ok(res.equivalentKv > 0);
  assert.match(res.equivalentCvBasis, /cross-check/);
  assert.ok(res.notes.some((n) => /Kd = 0.65/.test(n)));
});

// ============================================================
// Steam routed through the vapour equation, never fabricated tables
// ============================================================
test("steam falls back to the vapour equation and is flagged indicative", () => {
  const steam = calcPsvCv({ fluidType: "steam", W: 5000, P1: 20, T: 450, Z: 1 });
  assert.equal(steam.error, undefined);
  assert.equal(steam.indicative, true);
  assert.ok(steam.notes.some((n) => /rated-capacity table/.test(n)));
  assert.ok(steam.warnings.some((w) => w.key === "steamIndicative"));
  assert.match(steam.equation, /critical flow/);

  // دقیقاً همان عدد معادلهٔ بخار با M=18.015 و k=1.31 — هیچ ضریب حدسی دخالت ندارد
  const vapour = calcPsvCv({ fluidType: "gas", W: 5000, M: 18.015, k: 1.31, P1: 20, T: 450, Z: 1 });
  assert.equal(steam.areaMm2, vapour.areaMm2);
});

// ============================================================
// Backpressure / inlet-loss / overpressure warnings
// ============================================================
test("conventional valve beyond 10% backpressure of set raises backpressureHigh", () => {
  const base = { fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4, setPressureBar: 10 };
  const bad = calcPsvCv({ ...base, backPressureBar: 2.5 }); // (2.5−1.013)/10 ≈ 14.9%
  assert.ok(bad.warnings.some((w) => w.key === "backpressureHigh" && w.type === "danger"));

  const ok = calcPsvCv({ ...base, backPressureBar: 1.8 }); // ≈ 7.9%
  assert.ok(!ok.warnings.some((w) => w.key === "backpressureHigh"));

  // شیر بالانس (بلوز) همان حالت ۱۴.۹٪ را با حد بالاتر بررسی می‌کند
  const balancedValve = calcPsvCv({ ...base, backPressureBar: 2.5, balanced: true });
  assert.ok(!balancedValve.warnings.some((w) => w.key === "backpressureHigh" && w.type === "danger"));
});

test("inlet pressure loss above 3% of set triggers the one-third-rule warning", () => {
  const res = calcPsvCv({
    fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4,
    setPressureBar: 10, backPressureBar: 1.01325, inletLossPct: 5
  });
  const w = res.warnings.find((x) => x.key === "inletPressureLoss");
  assert.ok(w);
  assert.equal(w.type, "warning");
  assert.equal(w.params.inletLossPct, 5);

  const fine = calcPsvCv({
    fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4,
    setPressureBar: 10, backPressureBar: 1.01325, inletLossPct: 2
  });
  assert.ok(!fine.warnings.some((x) => x.key === "inletPressureLoss"));
});

test("overpressure above the non-fire accumulation is flagged, invalid values error", () => {
  const fire = calcPsvCv({
    fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4,
    setPressureBar: 10, overpressurePct: 21, backPressureBar: 1.01325
  });
  assert.ok(fire.warnings.some((w) => w.key === "overpressure"));
  assert.equal(fire.P1RelievingBar, +(10 * 1.21 + 1.01325).toFixed(4));
  assert.ok(calcPsvCv({
    fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4, setPressureBar: 10, overpressurePct: 30
  }).error);
});

test("an orifice demand beyond the table is flagged insufficient", () => {
  // بار بزرگ‌تر از بزرگ‌ترین بدنهٔ استاندارد API 526 (T = 167.74 cm²)
  // ≈ 200 t/h هوا در ۱۲ بار مطلق ⇒ حدود 203 cm² — بیش از T
  const res = calcPsvCv({
    fluidType: "gas", W: 200000, M: 28.96, T: 300, k: 1.4,
    setPressureBar: 10, backPressureBar: 1.01325
  });
  assert.equal(res.requiredOrifice.insufficient, true);
  assert.equal(res.requiredOrifice.letter, "T");
  assert.ok(res.areaCm2 > 167.74);
  const w = res.warnings.find((x) => x.key === "orificeInsufficient");
  assert.ok(w);
  assert.equal(w.type, "danger");
});

test("backpressure entered as 0 means atmospheric discharge, not absolute vacuum", () => {
  const base = { fluidType: "gas", W: 1000, M: 28.96, T: 300, k: 1.4, setPressureBar: 10 };
  const zero = calcPsvCv({ ...base, backPressureBar: 0 });
  const atm = calcPsvCv({ ...base, backPressureBar: 1.01325 });
  assert.equal(zero.P2Bar, atm.P2Bar);
  assert.equal(zero.areaMm2, atm.areaMm2);
  assert.ok(zero.notes.some((nn) => /atmospheric/.test(nn)));
});

test("a suspicious Kelvin value and the default Kd both surface as info warnings", () => {
  const res = calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 27, k: 1.4, P1: 20 });
  assert.ok(res.warnings.some((w) => w.key === "temperatureUnits" && w.type === "info"));
  assert.ok(res.warnings.some((w) => w.key === "kdDefault" && w.type === "info"));
});

// ============================================================
// Input validation — errors, never throws
// ============================================================
test("calcPsvCv returns { error } instead of throwing on bad input", () => {
  assert.ok(calcPsvCv({}).error);
  assert.ok(calcPsvCv({ fluidType: "supercritical" }).error);
  assert.ok(calcPsvCv({ fluidType: "gas", W: 0, M: 28.96, T: 300, k: 1.4, P1: 10 }).error);
  assert.ok(calcPsvCv({ fluidType: "liquid", Q: 0, setPressureBar: 5 }).error);
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, T: 300, k: 1.4, P1: 10 }).error); // بدون M
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1, P1: 10 }).error); // k≤1
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: -5, k: 1.4, P1: 10 }).error); // T منفی
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1.4, P1: 5, backPressureBar: 6 }).error); // P2≥P1
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1.4, P1: 10, Kd: 1.5 }).error);
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1.4, P1: 10, Kc: 0 }).error);
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1.4, P1: 10, Kb: -1 }).error);
  assert.ok(calcPsvCv({ fluidType: "gas", W: 100, M: 28.96, T: 300, k: 1.4 }).error); // بدون P1 و set
});

test("required result fields are always present for a valid vapour case", () => {
  const res = calcPsvCv({ fluidType: "gas", W: 500, M: 44, T: 320, Z: 0.9, k: 1.2, P1: 15, backPressureBar: 1.01325 });
  for (const key of ["areaMm2", "areaIn2", "requiredOrifice", "P1RelievingBar", "criticalRatio",
    "flowRegime", "Kd", "Kb", "Kc", "C", "capacityKgH", "utilisation", "equation", "indicative", "warnings"]) {
    assert.ok(key in res, "missing field: " + key);
  }
  // P1 بدون set داده شده → مطلق است و هشدار backpressure تقریبی فعال می‌شود
  assert.equal(res.P1RelievingBar, 15);
  assert.ok(res.indicative);
});
