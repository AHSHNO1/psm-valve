import test from "node:test";
import assert from "node:assert/strict";
import {
  calcGasCv,
  calcLiquidCv,
  calcSteamCv,
  calcPipingFactor,
  calcValveReynolds,
  calcFrFromRev,
  bodyVelocity,
  machNumber,
  velocityExceedsGuide,
  VELOCITY_GUIDE,
  steamSaturationTempC,
  cvToSize,
  dnToMm,
  getRecommendation,
  getSeriesProfile,
  IEC_N_KV,
  IEC_N_CV,
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

test("gas benchmark: engine matches the published US equation unit-for-unit", () => {
  // مرجع مستقل: Fisher/ISA form  q(scfh) = 1360·Cv·P1(psia)·Y·sqrt(x/(Gg·T(°R)·Z))
  // تمام واحدها داخل تست تبدیل می‌شوند تا ضریب حجمی موتور (Nm³/h در ۰ درجه)
  // با معادلهٔ مرجع (scf در ۶۰ درجه فارنهایت) مقایسه شود.
  const Q = 1000, Gg = 1, Tc = 20, P1 = 10, P2 = 9, Z = 1, k = 1.4, xT = 0.7;
  const PSI = 14.503774, R_PER_K = 1.8;
  // 1 Nm³ (۰ درجه) = 37.3266 scf (۶۰ درجه فارنهایت، ۱ اتمسفر)
  const SCF_PER_NM3 = 35.314667 * ((273.15 + 15.5556) / 273.15);

  const x = (P1 - P2) / P1;
  const Y = 1 - x / (3 * (k / 1.4) * xT);
  const qScfh = Q * SCF_PER_NM3;
  const cvRef = qScfh / (1360 * P1 * PSI * Y * Math.sqrt(x / (Gg * (Tc + 273.15) * R_PER_K * Z)));

  const r = calcGasCv({ Q, Gg, T: Tc, P1, P2, Z, k, xT });
  assert.ok(Math.abs(r.Cv / cvRef - 1) < 0.005, `Cv ${r.Cv} vs reference ${cvRef.toFixed(3)}`);
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

test("piping geometry factor (Fp) matches the ISA form", () => {
  // 2" valve in a 4" line with abrupt reducers: ΣK = 0.84375, Cv/d² = 25.81
  const fp = calcPipingFactor(100, 50, 100);
  assert.equal(fp.applies, true);
  assert.ok(fp.Fp > 0.77 && fp.Fp < 0.80, `Fp was ${fp.Fp}`);
  assert.ok(Math.abs(fp.sigmaK - 0.84375) < 1e-9);

  // No reducer or reducer backwards: no correction.
  assert.equal(calcPipingFactor(100, 100, 100).Fp, 1);
  assert.equal(calcPipingFactor(100, 100, 50).Fp, 1);
  assert.equal(dnToMm("DN50"), 50);
  assert.equal(dnToMm("DN600"), 600);
});

test("piping factor raises the required Cv when a reducer is present", () => {
  const base = { Q: 100, Gf: 1, P1: 10, P2: 8, Pv: 0.0234, Pc: 220.6, FL: 0.9 };
  const plain = calcLiquidCv(base);
  const piped = calcLiquidCv({ ...base, pipeDnMm: 100 });
  assert.ok(piped.Cv > plain.Cv);
  assert.ok(piped.Fp < 1);
  assert.equal(plain.Fp, 1);
  assert.equal(plain.pipingApplied, false);
  assert.equal(piped.pipingApplied, true);
});

// ---------------------------------------------------------------
// Flashing vs cavitation (thermodynamic rule: flashing ⇔ P2 < Pv)
// ---------------------------------------------------------------
test("flashing is detected by P2 < Pv, not by the sigma heuristic", () => {
  const base = { Q: 100, Gf: 1, P1: 10, Pv: 0.0234, Pc: 220.6, FL: 0.9 };
  const flashing = calcLiquidCv({ ...base, P2: 0.02 });
  assert.equal(flashing.flashing, true);
  assert.equal(flashing.cavitationRisk, "flashing"); // legacy value kept for consumers
  assert.ok(flashing.sigma < 1.01, `sigma was ${flashing.sigma}`);

  // choked (sigma below the choked limit) but well above Pv — cavitation, not flashing
  const cavitating = calcLiquidCv({ ...base, P2: 0.5 });
  assert.equal(cavitating.flashing, false);
  assert.equal(cavitating.choked, true);
  assert.equal(cavitating.cavitationLevel, "high");
  assert.equal(cavitating.cavitationRisk, "high");
  assert.ok(cavitating.sigma > 1 && cavitating.sigma < cavitating.sigmaChoked);

  // normal water service: low risk, no flashing
  const calm = calcLiquidCv({ ...base, P2: 8 });
  assert.equal(calm.flashing, false);
  assert.equal(calm.cavitationLevel, "low");

  // σ = 1 ⇔ P2 = Pv equivalence
  const boundary = calcLiquidCv({ ...base, P2: 0.0234 });
  assert.equal(boundary.flashing, false);
  assert.ok(Math.abs(boundary.sigma - 1) < 0.01, `sigma at boundary was ${boundary.sigma}`);
});

// ---------------------------------------------------------------
// IEC 60534-2-1 Clause 10 — valve Reynolds number and FR
// Worked example: Q=100 m³/h, Kv=70.71, FL=0.9, d=DN40, water ν=1 cSt.
// Rev = N4·Q/(ν·√(Kv·FL)) · (FL²Kv²/(N2·d⁴)+1)^¼ with N4=7.07e-2, N2=1.6e-3
// ---------------------------------------------------------------
test("valve Reynolds number matches the IEC Table 1 worked example", () => {
  const rev = calcValveReynolds({ Q: 100, kv: 70.71, FL: 0.9, dnMm: 40, nuCSt: 1 });
  assert.ok(Math.abs(rev - 1.052e6) / 1.052e6 < 0.01, `Rev was ${rev}`);

  // Kv↔Cv constant consistency: N4 ratio = 1/√1.156 (Cv = 1.156·Kv)
  assert.ok(Math.abs(IEC_N_CV.N4 / IEC_N_KV.N4 - Math.sqrt(1.156)) < 1e-3);
  assert.equal(calcValveReynolds({ Q: 100, kv: 70.71, FL: 0.9, dnMm: 40, nuCSt: 0 }), null);
});

test("FR is 1 above Rev=10000 and follows the Figure 6 fit below", () => {
  assert.equal(calcFrFromRev(1e6), 1);
  assert.equal(calcFrFromRev(10000), 1);
  assert.ok(Math.abs(calcFrFromRev(1000) - 0.55) < 0.02);
  assert.ok(Math.abs(calcFrFromRev(100) - 0.30) < 0.02);
  assert.equal(calcFrFromRev(10), 0.2); // clamped at the laminar floor
  assert.equal(calcFrFromRev(null), null);
});

test("liquid sizing applies the viscosity correction for viscous fluids", () => {
  const base = { Q: 100, Gf: 1, P1: 10, P2: 8, Pv: 0.0234, Pc: 220.6, FL: 0.9 };
  const water = calcLiquidCv({ ...base, nu: 1 });
  assert.ok(Math.abs(water.Cv - 81.74) < 0.1, `water Cv was ${water.Cv}`);
  assert.equal(water.FR, 1);
  assert.equal(water.viscosityCorrected, false);
  assert.equal(water.flowRegime, "turbulent");
  assert.ok(water.Rev > 1e6, `water Rev was ${water.Rev}`);

  const oil = calcLiquidCv({ ...base, nu: 30 });
  assert.ok(Math.abs(oil.Cv - 81.74) < 0.1, `oil Cv was ${oil.Cv}`);
  assert.equal(oil.FR, 1); // Rev ≈ 35 000 — still fully turbulent

  const viscous = calcLiquidCv({ ...base, nu: 1000 });
  assert.ok(Math.abs(viscous.Rev - 1052) < 60, `Rev was ${viscous.Rev}`);
  assert.ok(Math.abs(viscous.FR - 0.557) < 0.02, `FR was ${viscous.FR}`);
  assert.ok(Math.abs(viscous.Cv - 146.8) < 1.5, `corrected Cv was ${viscous.Cv}`);
  assert.equal(viscous.viscosityCorrected, true);
  assert.equal(viscous.flowRegime, "transition");
  assert.equal(viscous.size.dn, "DN50"); // re-picked after the FR correction

  // without ν the engine behaves as before (backward compatible)
  const legacy = calcLiquidCv(base);
  assert.equal(legacy.Rev, null);
  assert.equal(legacy.FR, null);
});

// ---------------------------------------------------------------
// Superheated steam: density correction Cv = Cv_sat · √(T/Tsat)
// ---------------------------------------------------------------
test("steam saturation table reproduces IAPWS anchor points", () => {
  assert.ok(Math.abs(steamSaturationTempC(10) - 179.9) < 0.1);
  assert.ok(Math.abs(steamSaturationTempC(12) - 188.0) < 0.1);
  assert.ok(Math.abs(steamSaturationTempC(1) - 99.6) < 0.1);
  assert.equal(steamSaturationTempC(0), null);
});

test("superheated steam raises Cv while saturated-basis results are unchanged", () => {
  const sat = calcSteamCv({ W: 1000, P1: 10, P2: 9, T: 180 });
  assert.equal(sat.steamBasis, "saturated"); // within the 2 °C table tolerance
  assert.ok(Math.abs(sat.Cv - 17.5) < 0.9, `Cv was ${sat.Cv}`);

  const superheated = calcSteamCv({ W: 1000, P1: 10, P2: 9, T: 280 });
  assert.equal(superheated.steamBasis, "superheated");
  assert.ok(Math.abs(superheated.saturationTempC - 179.9) < 0.2);
  assert.ok(Math.abs(superheated.superheatC - 100.1) < 0.3);
  // √((280+273.15)/(179.9+273.15)) ≈ 1.105
  assert.ok(Math.abs(superheated.steamCorrection - 1.105) < 0.005, `correction ${superheated.steamCorrection}`);
  assert.ok(superheated.Cv > sat.Cv, "superheated Cv must exceed the saturated-basis Cv");
  assert.ok(Math.abs(superheated.Cv - 19.36) < 0.5, `superheated Cv was ${superheated.Cv}`);

  // no temperature given: unchanged legacy saturated behaviour
  assert.equal(calcSteamCv({ W: 1000, P1: 10, P2: 9 }).steamBasis, "saturated");
});

test("recommendations surface flashing and laminar-flow caveats", () => {
  const flash = getRecommendation(60, true, "flashing", false, { flashing: true });
  assert.ok(flash.some((w) => w.type === "danger" && w.text.includes("P2 < Pv")));

  const laminar = getRecommendation(50, false, "low", false, { Rev: 1052, FR: 0.557 });
  assert.ok(laminar.some((w) => w.text.includes("Laminar/transition") && w.text.includes("verify with vendor")));

  const turbulent = getRecommendation(50, false, "low", false, { Rev: 1.05e6, FR: 1 });
  assert.equal(turbulent.filter((w) => w.text.includes("Laminar")).length, 0);

  const medium = getRecommendation(50, false, "medium", false);
  assert.ok(medium.some((w) => w.type === "info" && w.text.includes("incipient")));
});

test("series coefficient profiles map PSM series to typical FL/xT", () => {
  assert.equal(getSeriesProfile("51000").fl, 0.9);
  assert.equal(getSeriesProfile("46000").type, "ball");
  assert.equal(getSeriesProfile(53000).type, "butterfly");
  assert.equal(getSeriesProfile("99999"), null);
  assert.equal(getSeriesProfile(null), null);
});

test("liquid results expose FF and steam results estimate body velocity", () => {
  const liquid = calcLiquidCv({ Q: 120, Gf: 1, P1: 10, P2: 4, Pv: 0.0317, Pc: 221.2, FL: 0.9 });
  assert.ok(Number.isFinite(liquid.FF) && liquid.FF > 0.9 && liquid.FF < 0.97, `FF was ${liquid.FF}`);

  const steam = calcSteamCv({ W: 2000, P1: 10, P2: 9 });
  assert.ok(steam.velocity > 0, "steam velocity should be estimated, not zero");
});

test("velocity guideline is shared and Mach-based for compressibles", () => {
  const fast = getRecommendation(50, false, "low", false, { fluidType: "liquid", velocity: 12.5 });
  assert.ok(fast.some((w) => w.key === "velocity" && w.text.includes("12.5 m/s")), "liquid above 10 m/s should warn");
  assert.equal(fast.find((w) => w.key === "velocity").params.limit, 10);

  const ok = getRecommendation(50, false, "low", false, { fluidType: "liquid", velocity: 7.4 });
  assert.equal(ok.filter((w) => w.key === "velocity").length, 0, "7.4 m/s is inside the liquid guideline");

  // گاز با سرعت پایین اما ماخ بالا باید با معیار ماخ سنجیده شود، نه m/s
  const machy = getRecommendation(50, false, "low", false, { fluidType: "gas", velocity: 120, mach: 0.41 });
  assert.ok(machy.some((w) => w.key === "mach" && w.text.includes("0.41")));

  const tiny = getRecommendation(7, false, "low", false);
  assert.ok(tiny.some((w) => w.key === "rangeability"));
  assert.equal(tiny.filter((w) => w.key === "openingLow").length, 0, "بازشدگی زیر ۱۰٪ نباید دوبار هشدار دهد");

  const minFlow = getRecommendation(50, false, "low", false, { openingMin: 9 });
  assert.ok(minFlow.some((w) => w.key === "minFlow" && w.params.opening === 9));
});

test("body velocity and Mach stay consistent with the finally selected size", () => {
  // DN50 (3"): 300 m³/h آب ≈ 18 m/s؛ DN80 (4") نصف آن
  const v3 = bodyVelocity(300, { size: '3"' });
  const v4 = bodyVelocity(300, { size: '4"' });
  assert.ok(Math.abs(v3 - 18.29) < 0.2, `v3 was ${v3}`);
  assert.ok(v4 < v3 && Math.abs(v4 - 10.29) < 0.2, `v4 was ${v4}`);
  assert.equal(bodyVelocity(0, { size: '3"' }), null);
  assert.equal(bodyVelocity(300, null), null);

  // سرعت صوت هوا در ۲۰ درجه ≈ 343 m/s (k=1.4)
  const ma = machNumber(100, 1.4, 293.15, 28.96);
  assert.ok(ma > 0.28 && ma < 0.30, `Mach was ${ma}`);
  assert.equal(machNumber(100, 1.4, 0, 28.96), null);

  // موتور باید دبی حجیمیِ شرایط جاری را برای بازمحاسبهٔ سرعت پس از حاشیه برگرداند
  const liquid = calcLiquidCv({ Q: 300, Gf: 1, P1: 12, P2: 6, Pv: 0.0317, Pc: 221.2, FL: 0.9 });
  assert.equal(liquid.qActualM3h, 300);
  const margined = cvToSize(liquid.Cv * 1.2);
  const vAfterMargin = bodyVelocity(liquid.qActualM3h, margined);
  assert.ok(vAfterMargin <= liquid.velocity, `حاشیه نباید سرعت را بالا ببرد: ${vAfterMargin} vs ${liquid.velocity}`);

  const gas = calcGasCv({ Q: 3000, Gg: 0.65, T: 20, P1: 10, P2: 6 });
  // Q بر حسب Nm³/h است؛ در ۱۰ bar گاز فشرده میشود، پس دبی حجیمی در شرایط جاری بسیار کمتر است
  assert.ok(gas.qActualM3h > 300 && gas.qActualM3h < 3000, `gas actual flow was ${gas.qActualM3h}`);
  assert.ok(gas.mach > 0 && gas.mach < 1, `gas Mach was ${gas.mach}`);
  assert.equal(velocityExceedsGuide({ fluidType: "gas", velocity: gas.velocity, mach: gas.mach }), gas.mach > VELOCITY_GUIDE.gas.maxMach);
});

test("warnings carry translation keys with parameters", () => {
  const ws = getRecommendation(92, true, "high", true, { fluidType: "liquid", velocity: 14, sigma: 1.4, Rev: 500, FR: 0.6 });
  const keys = ws.map((w) => w.key);
  for (const expected of ["capacity", "openingHigh", "choked", "cavHigh", "velocity", "laminar"]) {
    assert.ok(keys.includes(expected), `missing warning key: ${expected} (${keys.join(",")})`);
  }
  assert.ok(ws.every((w) => typeof w.text === "string" && w.text.length > 10));
});
