import test from "node:test";
import assert from "node:assert/strict";
import {
  saturationTempC,
  saturationPressureBar,
  hSatLiquid,
  hSatVapour,
  hLatent,
  hSuperheated,
  superheatCp,
  steamDensity,
  specificHeatK,
  compressibilityZ,
  liquidWaterEnthalpy
} from "../lib/steam-tables.js";
import { calcDesuperheater } from "../lib/desuperheater.js";
import { DESUPER_PRESETS } from "../lib/sizing-presets.js";
import {
  calcLetdown,
  recommendedStagesFromRatio,
  outletStateAfterLetdown,
  KE_LIMIT_W_M2
} from "../lib/letdown.js";
import { calcSteamCv, cvToSize, steamSaturationTempC } from "../lib/sizing-advanced.js";

// ---------------------------------------------------------------
// Steam tables — hand-checked against published saturation values
// (IAPWS-IF97 / ASME steam tables). Tolerances are the accuracy the
// module claims, not fitted to the implementation.
// ---------------------------------------------------------------
test("steam table reproduces the published 10 bar saturation anchor", () => {
  assert.ok(Math.abs(saturationTempC(10) - 179.9) < 0.3, `Tsat was ${saturationTempC(10)}`);
  assert.ok(Math.abs(hSatLiquid(10) - 762.7) < 6, `hf was ${hSatLiquid(10)}`);
  assert.ok(Math.abs(hSatVapour(10) - 2777.1) < 8, `hg was ${hSatVapour(10)}`);
  assert.ok(Math.abs(hLatent(10) - 2014.4) < 8, `hfg was ${hLatent(10)}`);
});

test("steam table reproduces the published 1 bar and 20 bar anchors", () => {
  assert.ok(Math.abs(saturationTempC(1) - 99.6) < 0.3);
  assert.ok(Math.abs(hSatLiquid(1) - 417.5) < 4, `hf(1) was ${hSatLiquid(1)}`);
  assert.ok(Math.abs(hSatVapour(1) - 2675.1) < 6, `hg(1) was ${hSatVapour(1)}`);
  assert.ok(Math.abs(saturationTempC(20) - 212.4) < 0.3);
  assert.ok(Math.abs(hSatVapour(20) - 2799.2) < 6, `hg(20) was ${hSatVapour(20)}`);
  // hfg must collapse towards the critical point
  assert.ok(hLatent(1) > hLatent(20));
});

test("steam tables stay consistent with the sizing engine's saturation anchors", () => {
  for (const p of [0.2, 0.5, 1, 2, 3, 5, 8, 10, 15, 20, 30, 40]) {
    const mine = saturationTempC(p);
    const engine = steamSaturationTempC(p);
    assert.ok(Math.abs(mine - engine) < 0.35, `P=${p}: ${mine} vs ${engine}`);
  }
});

test("saturation pressure inverts the saturation temperature", () => {
  for (const p of [0.05, 0.5, 3, 10, 40]) {
    const back = saturationPressureBar(saturationTempC(p));
    assert.ok(Math.abs(back - p) / p < 0.02, `P=${p} round-tripped to ${back}`);
  }
  assert.ok(Math.abs(saturationPressureBar(100) - 1.01325) < 0.03, `100 °C → ${saturationPressureBar(100)} bar`);
});

test("superheated enthalpy and cp stay inside the stated tolerance", () => {
  // Published: h(10 bar, 300 °C) = 3051.2 kJ/kg, h(1 bar, 300 °C) = 3074.3 kJ/kg
  assert.ok(Math.abs(hSuperheated(10, 300) - 3051.2) < 25, `h(10,300) was ${hSuperheated(10, 300)}`);
  assert.ok(Math.abs(hSuperheated(1, 300) - 3074.3) < 25, `h(1,300) was ${hSuperheated(1, 300)}`);
  // at zero superheat the vapour line is returned unchanged
  assert.ok(Math.abs(hSuperheated(10, saturationTempC(10)) - hSatVapour(10)) < 1);
  assert.ok(superheatCp(10) > 2.1 && superheatCp(10) < 2.6, `cp was ${superheatCp(10)}`);
  assert.ok(superheatCp(1) > 1.8 && superheatCp(1) < 2.1);
});

test("vapour density matches published specific volumes", () => {
  // vg(sat, 10 bar) = 0.19436 m³/kg → 5.145 kg/m³
  assert.ok(Math.abs(steamDensity(10, saturationTempC(10)) - 5.145) / 5.145 < 0.03, `rho was ${steamDensity(10, 179.9)}`);
  // vg(sat, 1 bar) = 1.6940 m³/kg → 0.5903 kg/m³
  assert.ok(Math.abs(steamDensity(1, 99.6) - 0.5903) / 0.5903 < 0.03, `rho was ${steamDensity(1, 99.6)}`);
  // superheating at constant pressure thins the vapour
  assert.ok(steamDensity(10, 300) < steamDensity(10, 200));
  const z = compressibilityZ(10, saturationTempC(10));
  assert.ok(z > 0.9 && z < 1, `Z was ${z}`);
  assert.equal(compressibilityZ(10, 300) > z, true, "Z must rise towards 1 with superheat");
});

test("specific heat ratio k is a plausible steam value", () => {
  const k = specificHeatK(10, 300);
  assert.ok(k > 1.1 && k < 1.35, `k was ${k}`);
  assert.ok(specificHeatK(1, 150) > k, "k rises as the vapour approaches ideal-gas behaviour");
});

test("property functions refuse to extrapolate outside the table", () => {
  assert.equal(saturationTempC(60).error, "outOfRange");
  assert.equal(saturationTempC(0.01).error, "outOfRange");
  assert.equal(saturationTempC(-1).error, "outOfRange");
  assert.equal(hSatLiquid(80).error, "outOfRange");
  assert.equal(hSatVapour(null).error, "outOfRange");
  assert.equal(saturationPressureBar(300).error, "outOfRange");
  assert.equal(hSuperheated(10, 700).error, "outOfRange");
  assert.equal(hSuperheated(10, 100).error, "belowSaturation"); // wet steam, not vapour
  assert.equal(steamDensity(10, 100).error, "belowSaturation");
  assert.equal(steamDensity(500, 300).error, "outOfRange");
  assert.equal(superheatCp(1000).error, "outOfRange");
  assert.equal(liquidWaterEnthalpy(5).error, "outOfRange");
  assert.equal(typeof liquidWaterEnthalpy(30), "number");
});

// ---------------------------------------------------------------
// Desuperheater — energy-balance closure and the impossible cases
// ---------------------------------------------------------------
test("desuperheater spray water closes the outlet enthalpy balance", () => {
  const mS = 20000;
  const p = { steamFlowKgH: mS, P1Bar: 10, T1C: 350, T2TargetC: 220, waterPBar: 40, waterTC: 30 };
  const r = calcDesuperheater(p);
  assert.equal(r.error, undefined);

  const mW = r.waterFlowKgH;
  assert.ok(mW > 0 && mW < mS, `water flow was ${mW}`);
  // closure: recompute the mixture enthalpy from the returned water flow
  const h1 = hSuperheated(10, 350);
  const hW = liquidWaterEnthalpy(30);
  const hClosed = (mS * h1 + mW * hW) / (mS + mW);
  const hTarget = hSuperheated(10, 220);
  assert.ok(Math.abs(hClosed - hTarget) / hTarget < 0.01, `closure ${hClosed} vs target ${hTarget}`);
  assert.ok(Math.abs(hClosed - r.h2KJkg) < 1);

  // the denominator really is hg + cp·ΔTsh − hW
  const hg = hSatVapour(10);
  const cp = superheatCp(10);
  const tsat = saturationTempC(10);
  const denom = hg + cp * (220 - tsat) - hW;
  assert.ok(Math.abs(denom - r.denominatorKJkg) < 2, `denominator ${denom} vs ${r.denominatorKJkg}`);
  assert.ok(Math.abs(mW - (mS * (h1 - hTarget)) / denom) / mW < 0.01);

  // more superheat to remove ⇒ more water; same for a hotter inlet
  const harder = calcDesuperheater({ ...p, T1C: 450 });
  assert.ok(harder.waterFlowKgH > mW, "a hotter inlet must need more spray water");
  assert.equal(harder.dutyKW > r.dutyKW, true);
});

test("desuperheater rejects the impossible cases", () => {
  const base = { steamFlowKgH: 20000, P1Bar: 10, T1C: 350, waterPBar: 40, waterTC: 30 };
  // target below saturation at P1 → rain / wet steam
  assert.match(calcDesuperheater({ ...base, T2TargetC: 150 }).error, /below saturation/i);
  // target above inlet temperature
  assert.match(calcDesuperheater({ ...base, T2TargetC: 400 }).error, /lower than the inlet/i);
  // zero / negative steam flow
  assert.match(calcDesuperheater({ ...base, steamFlowKgH: 0, T2TargetC: 220 }).error, /greater than zero/i);
  assert.match(calcDesuperheater({ ...base, steamFlowKgH: -100, T2TargetC: 220 }).error, /greater than zero/i);
  // inlet itself not superheated
  assert.match(calcDesuperheater({ ...base, T1C: 120, T2TargetC: 110 }).error, /not superheated/i);
  // pressure outside the property table
  assert.match(calcDesuperheater({ ...base, P1Bar: 120, T2TargetC: 220 }).error, /outside the steam property table/i);
  // no steam flow at all
  assert.ok(calcDesuperheater({ P1Bar: 10, T1C: 350, T2TargetC: 220 }).error);
});

test("desuperheater errors carry translation keys and params for the UI", () => {
  const base = { steamFlowKgH: 20000, P1Bar: 10, T1C: 350, waterPBar: 40, waterTC: 30 };
  const belowSat = calcDesuperheater({ ...base, T2TargetC: 150 });
  assert.equal(belowSat.errorKey, "targetBelowSaturation");
  assert.ok(belowSat.errorParams.tsat > 179 && belowSat.errorParams.tsat < 181);
  assert.equal(belowSat.errorParams.T2, 150);

  assert.equal(calcDesuperheater({ ...base, T2TargetC: 400 }).errorKey, "targetAboveInlet");
  assert.equal(calcDesuperheater({ ...base, steamFlowKgH: 0, T2TargetC: 220 }).errorKey, "steamFlow");
  assert.equal(calcDesuperheater({ ...base, T1C: 120, T2TargetC: 110 }).errorKey, "inletNotSuperheated");
  assert.equal(calcDesuperheater({ ...base, P1Bar: 120, T2TargetC: 220 }).errorKey, "tablePressure");
});

test("desuperheater presets fill every required field and calculate cleanly", () => {
  assert.ok(DESUPER_PRESETS.length >= 2);
  for (const preset of DESUPER_PRESETS) {
    for (const key of ["W", "P1", "T", "T2", "waterP", "waterT"]) {
      assert.ok(preset.values[key] > 0, `${preset.id} must define ${key}`);
    }
    const r = calcDesuperheater({
      steamFlowKgH: preset.values.W,
      P1Bar: preset.values.P1,
      T1C: preset.values.T,
      T2TargetC: preset.values.T2,
      waterPBar: preset.values.waterP,
      waterTC: preset.values.waterT,
      waterGf: preset.values.waterGf,
      steamSupplyPBar: preset.values.supplyP
    });
    assert.equal(r.error, undefined, `${preset.id}: ${r.error}`);
    assert.ok(r.waterFlowKgH > 0, `${preset.id} water flow`);
    assert.ok(r.waterCv > 0, `${preset.id} injection Cv`);
    assert.ok(r.saturationMarginC > 5, `${preset.id} must start clear of saturation`);
  }
});

test("desuperheater warns as the outlet nears saturation and flags one-stage shock", () => {
  const base = { steamFlowKgH: 20000, P1Bar: 10, T1C: 350, waterPBar: 40, waterTC: 30 };
  const comfortable = calcDesuperheater({ ...base, T2TargetC: 240 });
  const keys = comfortable.warnings.map((w) => w.key);
  assert.equal(comfortable.superheatRemovedC, 110);
  assert.ok(keys.includes("thermalShock"), "110 °C removed in one stage must be flagged");
  assert.equal(keys.includes("nearSaturation"), false, `${comfortable.saturationMarginC} °C margin is comfortable`);
  assert.ok(comfortable.saturationMarginC > 15);

  const gentle = calcDesuperheater({ ...base, T1C: 220, T2TargetC: 193 });
  assert.equal(gentle.warnings.some((w) => w.key === "thermalShock"), false, "27 °C removal is one easy stage");
  assert.ok(gentle.warnings.some((w) => w.key === "nearSaturation" && w.type === "warning"));

  const tight = calcDesuperheater({ ...base, T2TargetC: saturationTempC(10) + 8 });
  const near = tight.warnings.find((w) => w.key === "nearSaturation");
  assert.equal(near.type, "warning");
  assert.ok(near.params.marginC > 5 && near.params.marginC < 15, `margin ${near.params.marginC}`);

  // inside the reject band, the rain-out danger appears
  const tooTight = calcDesuperheater({ ...base, T2TargetC: saturationTempC(10) - 5 });
  assert.ok(tooTight.error, "below saturation must be an error, not a warning");

  // warning shape contract
  for (const w of comfortable.warnings) {
    assert.equal(typeof w.key, "string");
    assert.equal(typeof w.type, "string");
    assert.equal(typeof w.text, "string");
    assert.ok(w.text.length > 20, "English fallback text");
    assert.equal(typeof w.params, "object");
  }
  assert.equal(comfortable.indicative, true);
  assert.ok(comfortable.notes.join(" ").includes("ISA-75.01.01"));
});

test("desuperheater sizes the water valve separately and enforces the atomising ΔP", () => {
  const base = { steamFlowKgH: 20000, P1Bar: 10, T1C: 350, T2TargetC: 260, waterTC: 30 };

  const good = calcDesuperheater({ ...base, waterPBar: 40 });
  assert.ok(good.waterCv > 0, `water Cv was ${good.waterCv}`);
  assert.ok(good.waterValveDPBar > 0, "the valve must keep ΔP after the nozzle drop");
  assert.equal(good.atomizingDPBar, Math.max(2, 0.2 * 10)); // 2 bar default governs here
  assert.equal(good.waterValveSize, cvToSize(good.waterCv).dn);
  assert.equal(good.waterValveSizeDetail.capacityExceeded, false);
  assert.equal(good.steamCv, null, "no steam valve is invented without a supply pressure");
  // small water Cv → the smallest listed body, as a placeholder for a micro-flow trim
  assert.ok(cvToSize(good.waterCv).cv >= good.waterCv);

  // at 40 bar the 20 % rule governs the nozzle ΔP (8 bar), leaving less for the valve
  const hp = calcDesuperheater({ ...base, P1Bar: 40, T1C: 500, T2TargetC: 400, waterPBar: 60 });
  assert.equal(hp.atomizingDPFromSteamFraction, true);
  assert.equal(hp.atomizingDPBar, 8);
  assert.ok(hp.waterValveDPBar < 20);

  // water supply only just above the steam pressure → no atomising ΔP left
  const starved = calcDesuperheater({ ...base, waterPBar: 11.5 });
  assert.equal(starved.waterCv, null);
  assert.ok(starved.warnings.some((w) => w.key === "atomizingDP" && w.type === "danger"),
    `${JSON.stringify(starved.warnings.map((w) => w.key))}`);

  // water below the station pressure cannot inject at all
  const impossible = calcDesuperheater({ ...base, waterPBar: 8 });
  assert.ok(impossible.warnings.some((w) => w.key === "waterSupplyDP" && w.type === "danger"));
  assert.equal(impossible.waterCv, null);

  // missing water pressure: report the demand, do not invent a valve
  const noWater = calcDesuperheater({ ...base });
  assert.ok(noWater.waterFlowKgH > 0);
  assert.equal(noWater.waterCv, null);
  assert.ok(noWater.warnings.some((w) => w.key === "waterSupplyDP"));
});

test("desuperheater reports the steam holding valve as its own body", () => {
  const r = calcDesuperheater({
    steamFlowKgH: 20000, P1Bar: 10, T1C: 350, T2TargetC: 260,
    waterPBar: 40, waterTC: 30, steamSupplyPBar: 16
  });
  assert.ok(r.steamCv > 0, `steam Cv was ${r.steamCv}`);
  assert.ok(r.steamValve.size.dn, "the steam valve keeps its own size");
  assert.notEqual(r.steamValve.size.dn, undefined);
  // the two bodies must not be conflated
  assert.ok(r.waterCv < r.steamCv / 10, `water ${r.waterCv} vs steam ${r.steamCv}`);
  // and the steam valve is the plain sizing-engine result, not a re-derivation
  const ref = calcSteamCv({ W: 20000, P1: 16, P2: 10, T: 350 });
  assert.equal(r.steamCv, ref.Cv);
});

// ---------------------------------------------------------------
// Letdown station — staging, Mach, ISA RP75.23 kinetic energy
// ---------------------------------------------------------------
test("letdown delegates the Cv equation to the shared engine", () => {
  const single = calcLetdown({ fluid: "steam", W: 20000, P1: 10, P2: 5, T1: 300, stages: 1 });
  const ref = calcSteamCv({ W: 20000, P1: 10, P2: 5, T: 300, k: single.k });
  assert.equal(single.Cv, ref.Cv, "letdown must not re-implement the Cv equation");
  assert.equal(single.Kv, +(single.Cv / 1.156).toFixed(2));
  assert.equal(single.indicative, true);
  assert.equal(single.stagesRecommended, recommendedStagesFromRatio(10, 5));

  const gas = calcLetdown({ fluid: "gas", W: 5000, P1: 60, P2: 6, T1: 25, MW: 28.96, k: 1.4, Z: 1, stages: 1 });
  assert.ok(gas.Cv > 0 && gas.Q > 0, "gas flow is derived from MW when only W is given");
  assert.ok(Math.abs(gas.MW - 28.96) < 0.01);
});

test("the stage rule of thumb follows ceil(log r / log 0.5)", () => {
  assert.equal(recommendedStagesFromRatio(60, 6), 4); // r = 0.1 → 3.32 → 4
  assert.equal(recommendedStagesFromRatio(10, 5), 1); // r = 0.5 → exactly 1
  assert.equal(recommendedStagesFromRatio(10, 4), 2); // r = 0.4 → 1.32 → 2
  assert.equal(recommendedStagesFromRatio(10, 2), 3); // r = 0.2 → 2.32 → 3
  assert.equal(recommendedStagesFromRatio(40, 1), 6); // r = 0.025 → 5.32 → 6
  assert.equal(recommendedStagesFromRatio(5, 6), null);
});

test("more letdown stages lower the trim Mach and the outlet kinetic energy", () => {
  const base = { fluid: "gas", W: 5000, P1: 60, P2: 6, T1: 25, MW: 28.96, k: 1.4, Z: 1, pipeDn: 100 };
  const one = calcLetdown({ ...base, stages: 1 });
  const two = calcLetdown({ ...base, stages: 2 });
  const four = calcLetdown({ ...base, stages: 4 });

  // each stage expands by r^(1/n) ⇒ smaller isentropic enthalpy drop ⇒ slower jet
  assert.ok(one.trimExitMach > two.trimExitMach, `${one.trimExitMach} vs ${two.trimExitMach}`);
  assert.ok(two.trimExitMach > four.trimExitMach, `${two.trimExitMach} vs ${four.trimExitMach}`);
  assert.ok(one.kineticEnergy > two.kineticEnergy, `${one.kineticEnergy} vs ${two.kineticEnergy}`);
  assert.ok(two.kineticEnergy > four.kineticEnergy);
  assert.ok(one.kineticEnergy > KE_LIMIT_W_M2, "a single stage at r=0.1 must breach the RP75.23 limit");
  assert.ok(four.kineticEnergy < one.kineticEnergy / 3);
  assert.equal(one.warnings.some((w) => w.key === "kineticEnergy" && w.type === "danger"), true);
  assert.equal(four.warnings.some((w) => w.key === "kineticEnergy" && w.type === "danger"), false);

  // staging does not change the pipe flow, only how fast the trim runs
  assert.equal(four.outletVelocity, one.outletVelocity);
  assert.equal(four.outletMach, one.outletMach);
  // and more stages cost more flow area (each stage sees less ΔP)
  assert.ok(four.Cv > one.Cv, `${four.Cv} vs ${one.Cv}`);
  assert.equal(four.stagesList.length, 4);
  assert.equal(four.stagesList[3].P2, 6);
});

test("letdown kinetic energy really is ρ·v²/2 with the documented limit", () => {
  const r = calcLetdown({ fluid: "gas", W: 5000, P1: 60, P2: 6, T1: 25, MW: 28.96, k: 1.4, Z: 1, stages: 3, pipeDn: 100 });
  const manual = (r.trimExitDensity * r.trimExitVelocity * r.trimExitVelocity) / 2;
  assert.ok(Math.abs(manual - r.kineticEnergy) / r.kineticEnergy < 0.02, `${manual} vs ${r.kineticEnergy}`);
  assert.equal(KE_LIMIT_W_M2, 4.8e5);
  assert.ok(Math.abs(r.kineticEnergyKwM2 - r.kineticEnergy / 1000) < 1);
  assert.equal(r.kineticEnergyRatio, +(r.kineticEnergy / KE_LIMIT_W_M2).toFixed(2));
  // the imperial form of the same limit is ~30 000 lbf/(ft·s)
  assert.ok(r.kineticEnergyLbfFtS > 20000 && r.kineticEnergyLbfFtS < 60000, `was ${r.kineticEnergyLbfFtS}`);
});

test("steam letdown is isenthalpic: superheated outlet, or wet steam when it lands there", () => {
  // Dry saturated steam let down from 10 to 2 bar leaves SUPERHEATED (the classic
  // letdown effect) because hg(10 bar) > hg(2 bar).
  const superheating = calcLetdown({ fluid: "steam", W: 20000, P1: 10, P2: 2, T1: 179.9, stages: 2, pipeDn: 200 });
  assert.equal(superheating.superheatedOutlet, true);
  assert.equal(superheating.drynessFraction, 1);
  assert.ok(superheating.outletTempC > saturationTempC(2) + 10, `T2 was ${superheating.outletTempC}`);
  // hand check against the table: h1 ≈ hg(10) and T2 = Tsat(2) + (h1 − hg(2))/cp(2)
  const expect = saturationTempC(2) + (hSatVapour(10) - hSatVapour(2)) / superheatCp(2);
  assert.ok(Math.abs(expect - superheating.outletTempC) < 6, `${expect} vs ${superheating.outletTempC}`);
  assert.ok(superheating.saturationMarginC > 10);

  // Deep letdown of WET steam stays wet → erosion warning
  const wet = calcLetdown({ fluid: "steam", W: 20000, P1: 20, P2: 1, T1: 212.4, dryness: 0.9, stages: 2, pipeDn: 200 });
  assert.equal(wet.drynessFraction < 1, true, `dryness was ${wet.drynessFraction}`);
  assert.ok(wet.warnings.some((w) => w.key === "wetSteam" && w.type === "danger"),
    JSON.stringify(wet.warnings.map((w) => w.key)));
  assert.ok(Math.abs(wet.outletTempC - saturationTempC(1)) < 0.5);

  // the same balance straight from the exported state helper
  const st = outletStateAfterLetdown({ fluid: "steam", p1Bar: 20, p2Bar: 1, tempInC: 212.4, hInKJkg: 2670, k: 1.3 });
  const x = (2670 - hSatLiquid(1)) / hLatent(1);
  assert.ok(Math.abs(st.dryness - x) < 0.005, `${st.dryness} vs ${x}`);
  assert.equal(st.wetSteam, true);
});

test("letdown refuses what it cannot compute and flags the outlet line", () => {
  assert.ok(calcLetdown({ fluid: "oil", W: 100, P1: 10, P2: 5, T1: 40 }).error);
  assert.ok(calcLetdown({ fluid: "steam", W: 0, P1: 10, P2: 5, T1: 300 }).error);
  assert.ok(calcLetdown({ fluid: "steam", W: 100, P1: 5, P2: 10, T1: 300 }).error);
  assert.ok(calcLetdown({ fluid: "gas", W: 100, P1: 10, P2: 5, T1: 30 }).error); // no MW/Gg
  assert.equal(calcLetdown({ fluid: "steam", W: 100, P1: 500, P2: 5, T1: 300 }).error.match(/outside the steam property table/).length, 1);

  // a small outlet line is the real letdown hazard: Mach at the flange
  const tight = calcLetdown({ fluid: "steam", W: 40000, P1: 10, P2: 1.5, T1: 250, stages: 1, pipeDn: 80 });
  assert.ok(tight.outletMach > 0.5, `outlet Mach was ${tight.outletMach}`);
  assert.ok(tight.warnings.some((w) => w.key === "outletMach" && w.type === "danger"));
  assert.ok(tight.recommendedOutletDn > tight.outletDnMm, `${tight.recommendedOutletDn} vs ${tight.outletDnMm}`);
  assert.ok(tight.notes.join(" ").includes("IEC 60534-8-3"), "noise must be labelled as not IEC 60534-8-3");
  assert.equal(tight.noiseIndicative, true);
});
