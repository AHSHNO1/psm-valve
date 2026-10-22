import test from "node:test";
import assert from "node:assert/strict";
import { calcLiquidCv, calcGasCv } from "../lib/sizing-advanced.js";
import {
  mixtureDensity,
  calcTwoPhaseCv,
  compareTwoPhaseModels,
  calcTwoPhaseHem,
  calcTwoPhaseHne,
  calcTwoPhaseOmega,
  calcTwoPhaseAdditive,
  calcOmega,
  omegaCriticalPressureRatio,
  omegaMassFlux,
  flashIsenthalpic,
  CV_TO_AREA_M2,
  CV_TO_AREA_MM2,
  CV_PER_KV,
  TWO_PHASE_DEFAULTS
} from "../lib/two-phase.js";

// ---------------------------------------------------------------
// ورودی‌های آزمون. چگالی‌ها از جداول بخار (IAPWS) گرفته شده‌اند تا
// خودِ موتور حق انتخاب خواص نداشته باشد:
//   آب اشباع ۱۰ bar (۱۷۹٫۹°C): ρf = 887.3، ρg = 5.15 kg/m³، Pv = 10 bar
//   آب ۲۰°C:                   ρf = 998.2، ρg = 0.00173 kg/m³، Pv = 0.0234 bar
//   بخار اشباع ۱۰ bar (x = ۱):  ρg = 5.15 kg/m³
// ---------------------------------------------------------------
const FLASHING_WATER = {
  W: 50000, x: 0, P1: 10, P2: 1.5, T: 179.9,
  rhoL: 887.3, rhoG: 5.15, Pv: 10, Pc: 221.2, FL: 0.9
};

const SUBCOOLED_WATER = {
  W: 100000, x: 0, P1: 10, P2: 8, T: 20,
  rhoL: 998.2, rhoG: 0.00173, Pv: 0.0234, Pc: 221.2, FL: 0.9
};

const SATURATED_STEAM = {
  W: 50000, x: 1, P1: 10, P2: 9, T: 179.9,
  rhoL: 887.3, rhoG: 5.15, Pv: 10, Pc: 221.2, k: 1.31, Z: 1
};

// ============================================================
// (a) رفتار حدی
// ============================================================
test("x→0 limit converges to the single-phase liquid Cv (no flash, Kd = 1)", () => {
  const hem = calcTwoPhaseHem(SUBCOOLED_WATER);
  const omega = calcTwoPhaseOmega(SUBCOOLED_WATER);
  assert.equal(hem.error, undefined, hem.error);
  assert.equal(omega.error, undefined, omega.error);

  // calcLiquidCv از همان تعریف Cv با Cd = 1 استفاده می‌کند (A = Cv/38 in²)،
  // پس هم‌حدی باید زیر ~۱٪ باشد؛ تلورانس ۲٪ جای گردکردن و قاعدهٔ ذوزنقه است.
  const liquid = calcLiquidCv({
    Q: SUBCOOLED_WATER.W / SUBCOOLED_WATER.rhoL,
    Gf: SUBCOOLED_WATER.rhoL / 999,
    P1: 10, P2: 8, Pv: 0.0234, Pc: 221.2, FL: 0.9
  });
  for (const r of [hem, omega]) {
    assert.ok(Math.abs(r.Cv - liquid.Cv) / liquid.Cv < 0.02, `${r.model} ${r.Cv} vs liquid ${liquid.Cv}`);
    assert.equal(r.choked, liquid.choked);
    assert.equal(r.choked, false);
  }
  // ω باید دقیقاً به صفر (مایع تراکم‌ناپذیر) رسیده باشد
  assert.equal(omega.notes.some((n) => n.includes("ω ≈")), true, omega.notes.join("|"));
});

test("x→1 limit approaches the single-phase gas Cv", () => {
  const omega = calcTwoPhaseOmega(SATURATED_STEAM);
  const hem = calcTwoPhaseHem(SATURATED_STEAM);
  assert.equal(omega.error, undefined, omega.error);

  // تبدیل دبی جرمی بخار به Nm³/h با همان ρ نرمال موتور جمع‌پذیر (MW/22.414)
  const qNm3h = SATURATED_STEAM.W / (18.015 / 22.414);
  const gas = calcGasCv({
    Q: qNm3h, Gg: 18.015 / 28.96, T: 179.9,
    P1: 10, P2: 9, Z: 1, k: 1.31, xT: 0.7
  });
  // IEC فرم گاز با فاکتور انبساط Y یک تقریب مرتبهٔ اول است و ω مسیر خطی در ۱/p
  // دارد؛ توافق داخل ۲۵٪ برای این حد انتظار می‌رود (آزمونِ هم‌حدی، نه دقت).
  for (const r of [omega, hem]) {
    assert.ok(Math.abs(r.Cv - gas.Cv) / gas.Cv < 0.25, `${r.model} ${r.Cv} vs gas ${gas.Cv}`);
  }
  assert.ok(omega.choked === false && gas.choked === false, "۱۰→۹ bar نباید خفه باشد");
});

test("omega reduces to the incompressible Bernoulli limit as omega → 0", () => {
  const vs = 1 / 887.3;
  const G = omegaMassFlux({ P1: 10, vs, omega: 0, eta: 0.8 });
  const exact = Math.sqrt(2 * (10 - 8) * 1e5 * 887.3);
  assert.ok(Math.abs(G - exact) / exact < 1e-9, `G was ${G}, expected ${exact}`);
});

// ============================================================
// (b) آب در حال فلشینگ: ترتیب مدل‌ها
// ============================================================
test("flashing water: the two equilibrium models agree, and non-equilibrium needs more Cv", () => {
  const hem = calcTwoPhaseHem(FLASHING_WATER);
  const omega = calcTwoPhaseOmega(FLASHING_WATER);
  const hne = calcTwoPhaseHne(FLASHING_WATER);
  assert.equal(hem.error, undefined, hem.error);
  assert.equal(omega.error, undefined, omega.error);

  // نکتهٔ صادقانه: HEM و ω هر دو «تعادل کامل در گلوگاه» فرض می‌کنند، پس برای
  // ورودی اشباع فقط چند دهم درصد با هم فرق دارند (ادغام مسیر واقعی در برابر
  // برازش دو‌نقطه‌ایِ خطی در ۱/p). چیزی که در ادبیات فنی «خوش‌بینی HEM» نامیده
  // می‌شود، مقایسه با واقعیتِ فلشینگ (تأخیر تولید بخار) است و آن را HNE/ω↔HEM
  // نشان نمی‌دهد؛ بنابراین عمداً hem.Cv < omega.Cv را ادعا نمی‌کنیم — این
  // جهت برای ورودی اشباع قابل دفاع نیست و آزمونِ شکننده بهتر از عدد ساختگی است.
  const ratio = hem.Cv / omega.Cv;
  assert.ok(ratio > 0.97 && ratio < 1.05, `hem/omega Cv ratio was ${ratio} (${hem.Cv} vs ${omega.Cv})`);
  // توافق دو مدل تعادلی خودش یک اعتبارسنجی متقابل است:
  assert.ok(Math.abs(ratio - 1) < 0.02, `equilibrium cross-check spread ${(ratio - 1) * 100}%`);
  // موقعیت گلوگاه هم باید نزدیک باشد (ηc=0.88 در برابر فشار گلوگاه HEM):
  assert.ok(Math.abs(hem.criticalPressureRatio - omega.criticalPressureRatio) < 0.02,
    `throat ${hem.criticalPressureRatio} vs etaC ${omega.criticalPressureRatio}`);
  // خوش‌بینی واقعی: HNE با N > ۱ همیشه به Cv بیشتر نیاز دارد
  assert.ok(hne.Cv > hem.Cv, `hne ${hne.Cv} should exceed hem ${hem.Cv}`);
  assert.ok(Math.abs(hne.Cv - hem.Cv * TWO_PHASE_DEFAULTS.N) / hem.Cv < 0.02,
    `hne ${hne.Cv} vs hem*N ${hem.Cv * TWO_PHASE_DEFAULTS.N}`);
  // کیفیت خروجی از فلاش آنتالپیک: جدول IAPWS برای ۱۰→۱٫۵ bar x ≈ 0.131
  assert.ok(Math.abs(omega.outletQuality - 0.131) < 0.01, `outlet quality ${omega.outletQuality}`);
  assert.ok(omega.choked && hem.choked, "فلشینگ عمیق باید در هر دو مدل خفه باشد");

  // ورودی کمی زیرسرد (۱۷۰°C، Pv = 7.92 bar < P1 = 10): فلاش داخل شیر رخ می‌دهد.
  // اینجا سرِ مایعِ پیش‌اشت β = (P1−Ps)/Ps در ω لحاظ می‌شود؛ بدون آن ω شار را
  // کم‌برآورد می‌کرد و Cv را بی‌دلیل ~۳٫۵ برابر می‌داد. باز هم دو مدل تعادلی
  // داخل چند درصد می‌مانند و HNE بزرگ‌ترین Cv را می‌خواهد.
  const sub = { ...FLASHING_WATER, T: 170, Pv: 7.921 };
  const sHem = calcTwoPhaseHem(sub);
  const sOmega = calcTwoPhaseOmega(sub);
  const sHne = calcTwoPhaseHne(sub);
  assert.equal(sHem.error, undefined, sHem.error);
  assert.equal(sOmega.error, undefined, sOmega.error);
  const sRatio = sHem.Cv / sOmega.Cv;
  assert.ok(sRatio > 0.97 && sRatio < 1.05, `subcooled hem/omega ratio was ${sRatio} (${sHem.Cv} vs ${sOmega.Cv})`);
  assert.ok(sHne.Cv > sHem.Cv && sHem.Cv > 0, `subcooled ordering: ${sHne.Cv} > ${sHem.Cv}`);
});

test("the additive baseline under-sizes flashing water by a wide margin", () => {
  const add = calcTwoPhaseAdditive(FLASHING_WATER);
  const omega = calcTwoPhaseOmega(FLASHING_WATER);
  assert.equal(add.error, undefined, add.error);
  assert.ok(omega.Cv / add.Cv > 2, `additive ${add.Cv} vs omega ${omega.Cv}`);
});

// ============================================================
// (c) شاخهٔ خفه در برابر غیرخفه
// ============================================================
test("choked vs non-choked branch switches at the critical pressure ratio", () => {
  const nonChoked = calcTwoPhaseOmega({ ...FLASHING_WATER, P2: 9.9 });
  const choked = calcTwoPhaseOmega({ ...FLASHING_WATER, P2: 1.5 });
  assert.equal(nonChoked.error, undefined, nonChoked.error);
  assert.equal(nonChoked.choked, false);
  assert.equal(choked.choked, true);
  assert.ok(Number.isFinite(choked.criticalPressureRatio) && choked.criticalPressureRatio > 0 && choked.criticalPressureRatio < 1,
    `etaC was ${choked.criticalPressureRatio}`);

  // Cv باید در هر دو حالت وجود داشته باشد و در خفگی دیگر با P2 کم نشود
  assert.ok(nonChoked.Cv > 0 && choked.Cv > 0);
  const deeper = calcTwoPhaseOmega({ ...FLASHING_WATER, P2: 0.2 });
  assert.equal(deeper.choked, true);
  assert.ok(Math.abs(deeper.Cv - choked.Cv) / choked.Cv < 0.02,
    `Cv must plateau once choked: ${choked.Cv} vs ${deeper.Cv}`);

  // آزمونِ خفگی/غیرخفگی در HEM هم باید همین رفتار را بدهد
  const hemChoked = calcTwoPhaseHem({ ...FLASHING_WATER, P2: 1.5 });
  const hemDeeper = calcTwoPhaseHem({ ...FLASHING_WATER, P2: 0.2 });
  assert.equal(hemChoked.choked, true);
  assert.ok(Math.abs(hemDeeper.Cv - hemChoked.Cv) / hemChoked.Cv < 0.05,
    `HEM Cv should saturate when choked: ${hemChoked.Cv} vs ${hemDeeper.Cv}`);
});

test("the omega critical equation reproduces the ideal-gas limit (omega = 1/k)", () => {
  // k = 1.3 ⇒ ω = 1/k = 0.7692؛ حد ایزنتروپ گاز ηc = (2/(k+1))^(k/(k-1)) = 0.5458
  const etaC = omegaCriticalPressureRatio(1 / 1.3);
  assert.ok(Math.abs(etaC - 0.5458) < 0.04, `etaC was ${etaC}`);
  // شار خفه در برابر فرم بستهٔ گاز ایده‌آل: Gc = sqrt(k·ρ0·P0·(2/(k+1))^((k+1)/(k-1)))
  const k = 1.3, rho0 = 5.15, P0 = 10e5;
  const Gexact = Math.sqrt(k * rho0 * P0 * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
  const Gomega = omegaMassFlux({ P1: 10, vs: 1 / rho0, omega: 1 / k, eta: etaC });
  // مسیر ω «خطی در ۱/p» است نه ایزنتروپ گاز، پس شار را کمی کم‌برآورد می‌کند
  // (اندازه‌گیری‌شده: ۰٫۸٪ در k=۱٫۱ تا ۴٫۱٪ در k=۱٫۶۷). جهت خطا محافظه‌کارانه است
  // ⇒ Cv بیشتر؛ تلورانس ۵٪ همان انحرافِ ساختاری خودِ تقریب ω است، نه باگ.
  assert.ok(Gomega < Gexact, `omega should stay conservative: ${Gomega} vs ${Gexact}`);
  assert.ok(Math.abs(Gomega - Gexact) / Gexact < 0.05, `omega G ${Gomega} vs exact ${Gexact}`);
  // همان انحراف در k بزرگ‌تر (هوا/گازهای دو‌اتمی) هم در همین حد بماند:
  const kAir = 1.4;
  const etaAir = omegaCriticalPressureRatio(1 / kAir);
  const GexactAir = Math.sqrt(kAir * rho0 * P0 * Math.pow(2 / (kAir + 1), (kAir + 1) / (kAir - 1)));
  const GomegaAir = omegaMassFlux({ P1: 10, vs: 1 / rho0, omega: 1 / kAir, eta: etaAir });
  assert.ok(Math.abs(GomegaAir - GexactAir) / GexactAir < 0.05, `air omega G ${GomegaAir} vs ${GexactAir}`);
  assert.equal(omegaCriticalPressureRatio(0), 0, "مایع تراکم‌ناپذیر خفگی ترمودینامیکی ندارد");
  // مایع زیرسردِ زیاد: ریشهٔ معادله بیرون از بازه ⇒ خفگی فوراً در نقطهٔ فلاش
  assert.equal(omegaCriticalPressureRatio(1, 1), 0.999999, "β بزرگ ⇒ ηc ≈ ۱");
  // حد β: با ω = ۰ باید برنولی مایع روی کل افت (P1→P2) برگردد؛ توجه: در تابع
  // شار، P1 همان لنگهٔ اشباع Ps است و β سرِ نسبیِ (P1−Ps)/Ps نسبت به همان لنگه.
  const Ps = 7.921;
  const gBeta = omegaMassFlux({ P1: Ps, vs: 1 / 900, omega: 0, eta: 1.5 / Ps, beta: (10 - Ps) / Ps });
  const gLiquid = Math.sqrt(2 * (10 - 1.5) * 1e5 * 900);
  assert.ok(Math.abs(gBeta - gLiquid) / gLiquid < 1e-9, `${gBeta} vs ${gLiquid}`);
});

// ============================================================
// (d) اعتبارسنجی ورودی
// ============================================================
test("input validation returns errors instead of throwing", () => {
  const cases = [
    [{ ...FLASHING_WATER, W: 0 }, "W"],
    [{ ...FLASHING_WATER, P1: 1.5, P2: 10 }, "P1 must be greater than P2"],
    [{ ...FLASHING_WATER, x: 1.4 }, "between 0 and 1"],
    [{ ...FLASHING_WATER, rhoL: -5 }, "rhoL"],
    [{ ...FLASHING_WATER, x: 0.3, rhoG: 0 }, "rhoG"],
    [{ ...FLASHING_WATER, x: 0.3, rhoG: 1200 }, "lower than rhoL"],
    [{ ...FLASHING_WATER, x: undefined }, "x (vapour mass fraction) is required"]
  ];
  for (const model of ["omega", "hem", "hne", "additive"]) {
    for (const [params, fragment] of cases) {
      const r = calcTwoPhaseCv({ ...params, model });
      assert.ok(r.error, `${model} accepted an invalid input set`);
      assert.ok(r.error.includes(fragment), `${model}: "${r.error}" should mention "${fragment}"`);
    }
  }
  const unknown = calcTwoPhaseCv({ ...FLASHING_WATER, model: "dirsa" });
  assert.ok(unknown.error && unknown.error.includes("Unknown two-phase model"), unknown.error);
});

test("compareTwoPhaseModels returns one row per model with ratios and a spread warning", () => {
  const cmp = compareTwoPhaseModels(FLASHING_WATER);
  assert.equal(cmp.error, undefined);
  const names = cmp.rows.map((r) => r.model);
  assert.deepEqual(names, ["omega", "hem", "hne", "additive"]);
  const omegaRow = cmp.rows.find((r) => r.model === "omega");
  assert.equal(omegaRow.ratioVsOmega, 1);
  for (const r of cmp.rows) {
    assert.ok(Number.isFinite(r.Cv) && r.Cv > 0, `${r.model} had no Cv`);
    assert.ok(Number.isFinite(r.ratioVsOmega) && r.ratioVsOmega > 0);
  }
  const hemRow = cmp.rows.find((r) => r.model === "hem");
  const hneRow = cmp.rows.find((r) => r.model === "hne");
  const addRow = cmp.rows.find((r) => r.model === "additive");
  // دو مدل تعادلی هم‌راستا، مدل غیرتعادلی محافظه‌کارانه‌تر و مدل جمع ساده
  // به‌طرز خطرناکی کوچک‌تر. جهت hem↔omega عمداً ادعا نمی‌شود (توضیح در آزمون
  // «flashing water»): فراتر از توافق ~۱٪ چیزی نیست که بشود به آن استناد کرد.
  assert.ok(Math.abs(hemRow.ratioVsOmega - 1) < 0.02, `hem ratio ${hemRow.ratioVsOmega}`);
  assert.ok(hneRow.ratioVsOmega > 1.2, `hne ratio ${hneRow.ratioVsOmega}`);
  assert.ok(addRow.ratioVsOmega < 1, "مدل جمع ساده باید Cv کم‌تر از ω بدهد");

  // پراکندگی این مورد بیش از ۲× است ⇒ هشدار modelSpread الزامی است
  const spread = cmp.warnings.filter((w) => w.key === "modelSpread");
  assert.equal(spread.length, 1, `warnings: ${cmp.warnings.map((w) => w.key).join(",")}`);
  assert.equal(spread[0].type, "warning");
  assert.ok(spread[0].params.ratio >= 2);
  assert.ok(cmp.minCv > 0 && cmp.maxCv > cmp.minCv);
});

test("the omega path is independent of the pressure-step count (integration is not used)", () => {
  // HEM با گام‌های مختلف باید به همان ادغام همگرا بماند (پایداری عددی)
  const coarse = calcTwoPhaseHem({ ...FLASHING_WATER, steps: 12 });
  const fine = calcTwoPhaseHem({ ...FLASHING_WATER, steps: 80 });
  assert.ok(Math.abs(coarse.Cv - fine.Cv) / fine.Cv < 0.05, `${coarse.Cv} vs ${fine.Cv}`);
});

// ============================================================
// خواص فیزیکی و هشدارهای دیگر
// ============================================================
test("mixtureDensity is the homogeneous no-slip rule", () => {
  const r = mixtureDensity({ x: 0.129, rhoL: 887.3, rhoG: 5.15 });
  // 1/(0.129/5.15 + 0.871/887.3) = 1/(0.025049 + 0.000982) = 38.42 kg/m³
  assert.ok(Math.abs(r - 38.42) < 0.05, `was ${r}`);
  assert.equal(mixtureDensity({ x: 0, rhoL: 900, rhoG: 5 }), 900);
  assert.equal(mixtureDensity({ x: 1, rhoL: 900, rhoG: 5 }), 5);
  assert.equal(mixtureDensity({ x: 1.2, rhoL: 900, rhoG: 5 }), null);
  assert.equal(mixtureDensity({ x: 0.5, rhoL: -1, rhoG: 5 }), null);
  assert.equal(mixtureDensity({ x: 0.5, rhoL: 900, rhoG: 0 }), null);
});

test("the Cv to area constant matches the classic A = Cv/38 rule", () => {
  const aPerCvIn2 = CV_TO_AREA_M2 / 6.4516e-4; // اینچ مربع بر Cv
  assert.ok(Math.abs(1 / aPerCvIn2 - 38) < 0.1, `Cv per in² was ${1 / aPerCvIn2}`);
  assert.ok(Math.abs(CV_TO_AREA_MM2 - 16.99) < 0.05, `mm² per Cv was ${CV_TO_AREA_MM2}`);
});

test("isenthalpic flash benchmark against the IAPWS letdown 10 to 1.5 bar", () => {
  const out = flashIsenthalpic({ P2: 1.5, T1_K: 179.9 + 273.15, x1: 0, rhoL: 887.3, rhoG: 5.15, Pv: 10, Pc: 221.2, T: 179.9 });
  // h1 = 762.6 kJ/kg؛ در ۱٫۵ bar: h_f = 469.9، h_fg = 2226 ⇒ x = 0.1315
  assert.ok(Math.abs(out.x - 0.1315) < 0.005, `x was ${out.x}`);
  assert.ok(Math.abs(out.TsatP2C - 111.4) < 0.2, `Tsat(P2) was ${out.TsatP2C}`);
  assert.equal(out.rhoM > 20 && out.rhoM < 60, true, `rhoM was ${out.rhoM}`);
});

test("omega and the two-point definition are internally consistent", () => {
  // تعریف: ω = 9·(v9/vs − 1)؛ و مسیر خطی در ۱/p در p9 = 0.9·P1 دقیقاً
  // v9/vs = 1 + ω/9 را می‌دهد ⇒ برگشت ω از حجم ویژه باید خودِ ورودی باشد
  const vs = 1 / 887.3;
  const v9 = vs * 2;
  const omega = calcOmega({ P1: 10, vs, v9 });
  assert.ok(Math.abs(omega - 9) < 1e-6, `omega was ${omega}`);
  assert.equal(calcOmega({ P1: 10, vs, v9: vs }), 0, "بازدهٔ بدون انبساط ⇒ ω = 0");
  assert.equal(calcOmega({ P1: 10, vs, v9: vs * 0.98 }), 0, "انبساط منفاز ⇒ ω = 0");
  assert.equal(calcOmega({ P1: 0, vs, v9 }), null);
  // ضریب از نقطهٔ نمونه‌گیری مشتق می‌شود: r = 0.95 ⇒ 1/(1/r − 1) = ۱۹ ⇒ ω = ۱۹
  assert.ok(Math.abs(calcOmega({ P1: 10, vs, v9, p9Ratio: 0.95 }) - 19) < 1e-6,
    "0.95 sample point must give the factor 19, not a hard-coded 9");
});

test("near-saturation, high quality and drop-size warnings fire", () => {
  const near = calcTwoPhaseOmega(FLASHING_WATER);
  assert.ok(near.warnings.some((w) => w.key === "nearSaturation" && w.type === "danger"),
    near.warnings.map((w) => w.key).join(","));

  const wet = calcTwoPhaseOmega({ ...FLASHING_WATER, x: 0.8 });
  assert.ok(wet.warnings.some((w) => w.key === "highVapourFraction"), wet.warnings.map((w) => w.key).join(","));

  // سرعت مخلوط خروجی: با دبی بالا از راهنمای ۷۰ m/s عبور می‌کند
  const fast = calcTwoPhaseOmega({ ...FLASHING_WATER, W: 800000 });
  assert.ok(fast.outletVelocityMps > 70, `velocity was ${fast.outletVelocityMps}`);
  assert.ok(fast.warnings.some((w) => w.key === "dropSize" && w.params.limit === 70),
    fast.warnings.map((w) => w.key).join(","));

  // هشدارها باید همیشه ساختار کلید/پارامتر/متن انگلیسی را داشته باشند
  for (const r of [near, wet, fast]) {
    for (const w of r.warnings) {
      assert.ok(["danger", "warning", "info"].includes(w.type), w.type);
      assert.equal(typeof w.key, "string");
      assert.equal(typeof w.params, "object");
      assert.ok(w.text.length > 20 && /^[A-Za-z]/.test(w.text), `English fallback expected: ${w.text}`);
    }
  }
});

test("hemOptimistic and crude-model warnings are labelled per model", () => {
  const hem = calcTwoPhaseHem(FLASHING_WATER);
  const hne = calcTwoPhaseHne(FLASHING_WATER);
  const add = calcTwoPhaseAdditive(FLASHING_WATER);
  assert.ok(hem.warnings.some((w) => w.key === "hemOptimistic"));
  assert.ok(hne.warnings.some((w) => w.key === "hemOptimistic" && w.params.hneCv > w.params.hemCv));
  assert.ok(add.warnings.some((w) => w.key === "additiveCrude" && w.type === "danger"));
  assert.equal(add.notes.some((n) => n.includes("crude")), true);
});

// ============================================================
// قراردادها: حالت پیش‌فرض، ساختار خروجی و سلب مسئولیت
// ============================================================
test("omega is the default model and every model returns the same shape", () => {
  const byModel = ["hem", "hne", "omega", "additive"].map((m) => calcTwoPhaseCv({ ...FLASHING_WATER, model: m }));
  for (const r of byModel) assert.equal(r.error, undefined);
  assert.equal(byModel[2].model, "omega");
  assert.equal(calcTwoPhaseCv(FLASHING_WATER).model, "omega", "پیش‌فرض باید ω باشد");

  const required = [
    "Cv", "Kv", "areaMm2", "massFlux", "choked", "criticalPressureRatio",
    "outletQuality", "outletVelocityMps", "size", "model", "notes", "indicative", "warnings"
  ];
  for (const r of byModel) {
    for (const key of required) {
      assert.ok(Object.prototype.hasOwnProperty.call(r, key), `missing ${key} for ${r.model}`);
    }
    assert.equal(r.indicative, true);
    assert.ok(Array.isArray(r.notes) && r.notes.length >= 3);
    assert.ok(r.notes.some((n) => n.includes("IEC 60534")), "disclaimer required");
    assert.ok(r.notes.some((n) => n.includes("no-slip")), "no-slip assumption required");
    assert.ok(r.notes.some((n) => n.includes("منبع خواص")), "property source must be stated");
    assert.ok(r.notes.some((n) => n.includes("زمان اقامت")), "residence time assumption");
    assert.equal(typeof r.size.size, "string");
    // هر دو با toFixed(2) گرد می‌شوند، پس برابری دقیق ممکن نیست؛ فاصله باید
    // در حد گردکردن (≤ ۰٫۰۱ واحد) بماند: Cv = ۱٫۱۵۶·Kv (CV_PER_KV)
    assert.ok(Math.abs(r.Cv - r.Kv * CV_PER_KV) < 0.02, `Kv/Cv convention for ${r.model}: ${r.Cv} vs ${r.Kv}`);
    assert.ok(r.areaMm2 > 0 && r.massFlux > 0);
    assert.ok(Number.isFinite(r.outletQuality) && r.outletQuality >= 0 && r.outletQuality <= 1);
    assert.ok(r.outletQuality >= FLASHING_WATER.x, "کیفیت خروجی نباید از ورودی کم‌تر باشد");
  }
});

test("HNE exposes N and a larger N always needs more Cv", () => {
  const mild = calcTwoPhaseHne({ ...FLASHING_WATER, N: 1.0 });
  const strong = calcTwoPhaseHne({ ...FLASHING_WATER, N: 2.0 });
  const hem = calcTwoPhaseHem(FLASHING_WATER);
  assert.equal(mild.error, undefined, mild.error);
  // N = 1 باید دقیقاً HEM باشد (عدم‌تعادل صفر)
  assert.equal(mild.Cv, hem.Cv);
  assert.ok(strong.Cv / mild.Cv > 1.9, `${mild.Cv} → ${strong.Cv}`);
  assert.ok(strong.notes.some((n) => n.includes("N = 2")), strong.notes.join("|"));
});

test("results carry a real size selection and flag oversized demands", () => {
  const small = calcTwoPhaseOmega({ ...FLASHING_WATER, W: 1000 });
  assert.ok(small.Cv > 0, small.Cv);
  assert.equal(small.capacityExceeded, false);
  const huge = calcTwoPhaseOmega({ ...FLASHING_WATER, W: 8000000 });
  assert.equal(huge.capacityExceeded, true, `Cv ${huge.Cv} should exceed the largest listed trim`);
});

test("a two-phase inlet flashes at the valve even when Pv was entered for another temperature", () => {
  // این همان تلهٔ UI است: فرم Pv پیش‌فرض آب ۲۰ °C را دارد و کاربر x = ۲۰٪ را در
  // ۱۰ bar وارد می‌کند. اگر Pv مسیر فلاش را تعیین کند، ω ≈ ۰ و Cv تک‌فازی می‌شود.
  const stale = calcTwoPhaseOmega({ ...FLASHING_WATER, x: 0.2, Pv: 0.0317 });
  const consistent = calcTwoPhaseOmega({ ...FLASHING_WATER, x: 0.2, Pv: 10 });
  assert.equal(stale.error, undefined, stale.error);
  assert.equal(stale.saturationPressureBar, 10, "Ps باید همان P1 ورودیِ اشباع باشد");
  assert.equal(stale.Cv, consistent.Cv, "Pv بی‌اعتبار نباید Cv را جابه‌جا کند");
  assert.ok(stale.warnings.some((w) => w.key === "inletTwoPhase"), "override must be disclosed");
  assert.ok(stale.omega > 0, `ω باید از فلاش ساخته شود: ${stale.omega}`);
});

test("omega exposes its model parameters so the UI can show them", () => {
  const r = calcTwoPhaseOmega(FLASHING_WATER);
  assert.ok(Number.isFinite(r.omega) && r.omega > 0, `omega: ${r.omega}`);
  assert.equal(r.saturationPressureBar, 10);
  const hem = calcTwoPhaseHem(FLASHING_WATER);
  assert.equal(hem.omega, null, "HEM پارامتر ω ندارد");
});

test("an outlet state outside the property range is disclosed, never faked as no-flash", () => {
  // تلهٔ واقعی: MW = ۲۸٫۹۶ (هوای مانده از حالت گاز) منبع خواص را از جدول بخار
  // به Clausius–Clapeyron می‌برد و Tsat(۱٫۵ bar) بیرون از دامنهٔ آن می‌افتد.
  // پیش از این، موتور همان x ورودی را به‌عنوان «کیفیت خروجی» برمی‌گرداند.
  const off = calcTwoPhaseOmega({ ...FLASHING_WATER, MW: 28.96 });
  assert.equal(off.error, undefined, off.error);
  assert.equal(off.propertySource, "clausius-clapeyron");
  assert.equal(off.outletStateKnown, false);
  assert.equal(off.outletQuality, null, "کیفیت خروجی جعل نمی‌شود");
  assert.equal(off.outletTempC, null);
  assert.equal(off.outletVelocityMps, null);
  assert.equal(off.outletDensity, null);
  assert.ok(off.Cv > 0, "Cv مسیر گلوگاه نباید با این case گم شود");
  assert.ok(off.warnings.some((w) => w.key === "propertiesOutOfRange" && w.type === "danger"),
    off.warnings.map((w) => w.key).join(","));
  assert.ok(off.notes.some((n) => n.includes("حالت خروجی محاسبه نشد")), off.notes.join("|"));

  // در دامنهٔ جدول آب همان حالت کامل محاسبه می‌شود (رجوع به IAPWS: x2 = ۰٫۱۳۱۵)
  const water = calcTwoPhaseOmega(FLASHING_WATER);
  assert.equal(water.outletStateKnown, true);
  assert.equal(water.propertySource, "iapws-if97");
  assert.ok(water.outletQuality > 0.12 && water.outletQuality < 0.14, `x2 = ${water.outletQuality}`);
  assert.ok(!water.warnings.some((w) => w.key === "propertiesOutOfRange"));
});

test("flashIsenthalpic returns a null quality instead of the inlet value when out of range", () => {
  const out = flashIsenthalpic({ P1: 10, P2: 1.5, T1_K: 179.9 + 273.15, x1: 0.3, rhoL: 887.3, rhoG: 5.15, Pv: 10, MW: 28.96 });
  assert.equal(out.x, null);
  assert.equal(out.propertiesUnavailable, true);
  assert.equal(out.rhoM, null);
});

test("notesEn is print-safe: the PDF datasheet has no Persian font, only WinAnsi", () => {
  // قرارداد دیتاشیت: pdf-generator متن یادداشت‌ها را بی‌تغریف به jsPDF می‌دهد.
  // فونت‌های standard فقط WinAnsi را می‌شناسند؛ پس حروف فارسی/یونانی مجاز نیست و
  // تنها — و … (که در WinAnsi وجود دارند) از ASCII بیرون می‌روند.
  const PRINT_SAFE = /^[\x20-\x7E—…\n]*$/;
  for (const solve of [calcTwoPhaseOmega, calcTwoPhaseHem, calcTwoPhaseHne, calcTwoPhaseAdditive]) {
    const r = solve({ ...FLASHING_WATER, x: 0.2 });
    assert.equal(r.error, undefined, r.error);
    assert.ok(Array.isArray(r.notesEn) && r.notesEn.length >= 5, `notesEn: ${r.notesEn && r.notesEn.length}`);
    for (const note of r.notesEn) {
      assert.match(note, PRINT_SAFE, note);
      assert.ok(note.trim().length > 0);
    }
    // موتور باید منبع خواص و Kd واقعی را بگوید، نه حدس نمایشی
    assert.ok(r.notesEn.some((n) => /IAPWS|Clausius/.test(n)), r.notesEn.join("|"));
    assert.ok(r.notesEn.some((n) => /Kd/.test(n)), r.notesEn.join("|"));
  }
});

test("the result reports the Kd it actually used so the report cannot print a guess", () => {
  // دو‌فازی: گزارش و PDF باید Kdِ موتور را نشان دهند ( نه عدد نمایشی).
  const byDefault = calcTwoPhaseOmega(FLASHING_WATER);
  assert.equal(byDefault.Kd, TWO_PHASE_DEFAULTS.Kd);
  const trimmed = calcTwoPhaseOmega({ ...FLASHING_WATER, Kd: 0.85 });
  assert.equal(trimmed.Kd, 0.85);
  assert.ok(trimmed.Cv > byDefault.Cv, "Kd کمتر باید Cv لازم را بالا ببرد");
  assert.ok(byDefault.notesEn.some((n) => n.includes("Kd = " + byDefault.Kd)), byDefault.notesEn.join("|"));
});
