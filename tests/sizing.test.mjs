import test from "node:test";
import assert from "node:assert/strict";
import {
  calcGasCv,
  calcLiquidCv,
  calcSteamCv,
  cvToSize,
  getRecommendation,
  VALVE_SIZES
} from "../lib/sizing-advanced.js";
import { formFromSI, formToSI } from "../lib/unit-system.js";

test("liquid sizing clamps pressure drop at the choked-flow limit", () => {
  const base = { Q: 100, Gf: 1, P1: 10, Pv: 0.0317, Pc: 221.2, FL: 0.9 };
  const unchoked = calcLiquidCv({ ...base, P2: 8 });
  const choked = calcLiquidCv({ ...base, P2: 0.5 });
  const deeperChoked = calcLiquidCv({ ...base, P2: 0 });

  assert.equal(unchoked.choked, false);
  assert.equal(choked.choked, true);
  assert.equal(deeperChoked.choked, true);
  assert.equal(choked.Cv, deeperChoked.Cv);
  assert.ok(choked.dPmax > 0);
});

test("gas sizing clamps pressure ratio at the choked-flow limit", () => {
  const base = { Q: 1000, Gg: 0.65, T: 20, P1: 10, Z: 0.9, k: 1.4, xT: 0.7 };
  const unchoked = calcGasCv({ ...base, P2: 3 });
  const choked = calcGasCv({ ...base, P2: 2 });

  assert.equal(unchoked.choked, false);
  assert.equal(choked.choked, true);
  assert.equal(choked.Cv, unchoked.Cv);
  assert.ok(choked.xChoked > 0);
});

test("steam flow scales Cv linearly and rejects non-positive pressure drop", () => {
  const conditions = { P1: 10, P2: 8 };
  const base = calcSteamCv({ ...conditions, W: 1000 });
  const doubled = calcSteamCv({ ...conditions, W: 2000 });

  assert.ok(Math.abs(doubled.Cv - base.Cv * 2) <= 0.02);
  assert.ok(calcSteamCv({ ...conditions, P1: 8, P2: 8, W: 1000 }).error);
});

test("size selection flags flow beyond the largest listed valve", () => {
  const largest = VALVE_SIZES[VALVE_SIZES.length - 1];
  assert.equal(cvToSize(largest.cv).capacityExceeded, false);
  assert.equal(cvToSize(largest.cv + 1).capacityExceeded, true);
  assert.ok(getRecommendation(100, false, "low", true).some((item) => item.type === "danger"));
});

test("imperial gas and liquid flow conversions round-trip with the correct units", () => {
  const gas = { Q: 100, W: 0, P1: 100, P2: 50, T: 68 };
  const gasSI = formToSI(gas, "IMPERIAL", "gas");
  assert.ok(Math.abs(gasSI.Q - 169.9) < 1e-10);
  assert.ok(Math.abs(formFromSI(gasSI, "IMPERIAL", "gas").Q - 100) < 1e-10);

  const liquidSI = formToSI({ ...gas, Q: 100 }, "IMPERIAL", "liquid");
  assert.ok(Math.abs(liquidSI.Q - 22.7125) < 1e-10);
  assert.ok(Math.abs(formFromSI(liquidSI, "IMPERIAL", "liquid").Q - 100) < 1e-10);
});

// ---------------------------------------------------------------
// Benchmark cases: independent reference values, not derived from
// the implementation. Regressions in the unit constants fail here.
// ---------------------------------------------------------------
test("liquid benchmark: water 100 m3/h at 2 bar drop needs Cv 81.74", () => {
  const r = calcLiquidCv({ Q: 100, Gf: 1, P1: 10, P2: 8, Pv: 0.0234, Pc: 220.6, FL: 0.9 });
  assert.ok(Math.abs(r.Cv - 81.74) < 0.1, `Cv was ${r.Cv}`);
  assert.equal(r.choked, false);
});

test("gas benchmark: air 100 Nm3/h at 10 bar needs Cv ~1.37", () => {
  // Reference: Fisher/IEC form Q = 1360·Cv·P1·Y·sqrt(x/(Gg·T·Z)) converted to
  // Nm3/h and bar gives Cv = Q/(416.3·P1·Y)·sqrt(Gg·T·Z/x); Y = 1 - x/(3·Fk·xT).
  const r = calcGasCv({ Q: 100, Gg: 1, T: 20, P1: 10, P2: 9, Z: 1, k: 1.4, xT: 0.7 });
  assert.ok(Math.abs(r.Cv - 1.37) < 0.07, `Cv was ${r.Cv}`);
  assert.ok(r.Y > 0.94 && r.Y < 0.96, `Y was ${r.Y}`);
  assert.equal(r.choked, false);
});

test("steam benchmark: 1000 kg/h saturated steam at 10 bar needs Cv ~17.5", () => {
  // Reference SI form of W = 2.1·Cv·sqrt(dP·(P1+P2)) [lb/h, psia]:
  // W = 13.8·Cv·Y·sqrt(dP·(P1+P2)) [kg/h, bar].
  const r = calcSteamCv({ W: 1000, P1: 10, P2: 9, T: 180 });
  assert.ok(Math.abs(r.Cv - 17.5) < 0.9, `Cv was ${r.Cv}`);
  assert.equal(r.choked, false);
});

test("steam sizing detects choked flow and stops increasing Cv", () => {
  const mild = calcSteamCv({ W: 1000, P1: 10, P2: 9 });
  const deep = calcSteamCv({ W: 1000, P1: 10, P2: 1 });
  assert.equal(mild.choked, false);
  assert.equal(deep.choked, true);
  assert.ok(Math.abs(deep.Cv - calcSteamCv({ W: 1000, P1: 10, P2: 0.5 }).Cv) < 1e-9);
});
