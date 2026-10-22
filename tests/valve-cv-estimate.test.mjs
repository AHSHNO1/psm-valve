import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

import { getCvCatalog, validateSeriesPayload } from "../lib/valve-cv.js";
import { getProducts } from "../lib/product-store.js";
import { curveCvAt, curveOpening, selectCatalogValve } from "../lib/valve-catalog.js";
import {
  ACCURACY_CAVEAT,
  DN_LADDER,
  FIT_BASIS_SERIES,
  MEASURED_SERIES,
  METHOD_ID,
  PROVENANCE,
  SCHEMA_VERSION,
  backTest,
  buildCapacityLaw,
  buildEstimateDocument,
  buildCurve,
  buildTrims,
  classifyProduct,
  confidenceFor,
  cvForSize,
  curveMetrics,
  dnLadderInRange,
  estimateSeries,
  familyKeyFor,
  fitPowerLaw,
  idealBoreCv,
  lawCv,
  normalisedCurveShape,
  roundCv,
  sizeRangeFromProduct,
  trimLadderRatios
} from "../lib/valve-cv-estimate.js";

function close(actual, expected, tol = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} != ${expected} (tol ${tol})`);
}

const catalog = getCvCatalog();
const law = buildCapacityLaw(catalog);
const report = backTest(catalog);
const shapes = { equal: normalisedCurveShape(catalog, "equal") };
const ladder = trimLadderRatios(catalog);

// محصولات واقعی (SQLite read-only) — همان ورودی اسکریپت estimate-cv.mjs
const products = getProducts();
const document = buildEstimateDocument({ catalog, products, generatedAt: "2026-01-01T00:00:00.000Z" });

const ESTIMATED_SERIES = Object.keys(document.series).sort();
const REFUSED = Object.fromEntries(document.refused.map((item) => [String(item.series), item.status]));

// ============================================================
// ۱) خودآزمون روی دادهٔ اندازه‌گیری‌شده
// ============================================================
// آستانه‌ها از «آنچه برازش واقعاً Achieve می‌کند» انتخاب شده‌اند، نه عدد دلخواه:
// روی دادهٔ فعلی خطای LOSO در داخل بازهٔ سری مبنا میانگین ۲۱٫۰٪ و بیشینه ۲۷٫۴٪ است،
// و خطای کل LOSO میانگین ۲۱٫۲٪ (بیشینهٔ ۴۴٫۵٪ فقط در اکستراپولاسیون DN500/DN600 سری ۵۱۰۰۰
// رخ می‌دهد، جایی که قانون فقط از سری ۳۱۰۰۰ ساخته شده و تا DN600 برون‌یابی می‌کند).
// سقف‌های ۲۵٪ (میانگین) و ۳۰٪ (بیشینهٔ in-envelope) دقیقاً بالای همین مقادیر اندازه‌گیری‌شده
// قرار گرفته‌اند تا هر رگرسیونِ داده/روش بلافاصله تست را بشکند.
const IN_ENVELOPE_MEAN_MAX = 25;
const IN_ENVELOPE_ABS_MAX = 30;
const OVERALL_LOSO_MEAN_MAX = 25;

test("power law fitted to measured 31000/51000 reproduces the catalogue within its demonstrated accuracy", () => {
  assert.deepEqual(law.globe.basisSeries || FIT_BASIS_SERIES, ["31000", "51000"]);
  assert.ok(law.globe.r2 > 0.99, `R² باید بسیار نزدیک ۱ باشد (${law.globe.r2})`);
  assert.equal(law.globe.samples, 20);
  // توان ≈ ۲ یعنی ظرفیت با سطح مقطع سوراخ رشد می‌کند؛ دادهٔ واقعی کمی کندتر است
  assert.ok(law.globe.exponent > 1.8 && law.globe.exponent < 2.05, `exponent=${law.globe.exponent}`);

  // نقطهٔ لنگر: cv0 خودش Cv در DN25.4 (یک اینچ) است
  close(lawCv(law.globe, 25.4), law.globe.cv0, 1e-12);
  assert.ok(Math.abs(lawCv(law.globe, 25) - 13.8) < 0.5);
  assert.ok(Math.abs(lawCv(law.globe, 100) - 202.5) < 3, `DN100 = ${lawCv(law.globe, 100)}`);
});

test("leave-one-series-out back-test stays under the accuracy achieved by the fit", () => {
  const inEnv = report.overall.inEnvelope;
  const all = report.overall;

  assert.deepEqual(all.testedSeries, ["31000", "51000"]);
  assert.equal(inEnv.samples, 10);
  assert.ok(inEnv.meanAbsPct <= IN_ENVELOPE_MEAN_MAX, `mean ${inEnv.meanAbsPct}٪`);
  assert.ok(inEnv.maxAbsPct <= IN_ENVELOPE_ABS_MAX, `max ${inEnv.maxAbsPct}٪`);
  assert.ok(all.meanAbsPct <= OVERALL_LOSO_MEAN_MAX, `overall mean ${all.meanAbsPct}٪`);

  // هر دو سری مبنای برازش باید به‌طور جداگانه زیر سقف باشند
  for (const id of FIT_BASIS_SERIES) {
    const entry = report.perSeries[id];
    assert.equal(entry.inFitBasis, true);
    assert.equal(entry.predictiveTest, true, `${id} باید پیش‌بینی‌شده باشد`);
    assert.ok(entry.inEnvelope.meanAbsPct <= IN_ENVELOPE_MEAN_MAX, `${id} mean ${entry.inEnvelope.meanAbsPct}٪`);
    assert.ok(entry.inEnvelope.maxAbsPct <= IN_ENVELOPE_ABS_MAX, `${id} max ${entry.inEnvelope.maxAbsPct}٪`);
  }

  // آزمون صادقانه است: باقی‌ماندهٔ درون‌نمونه نباید از خطای پیش‌بینی بهترِ غیرمتعارف باشد
  assert.ok(report.pooled.meanAbsPct < report.overall.meanAbsPct);
  assert.ok(report.pooled.meanAbsPct > 5, "باقی‌ماندهٔ درون‌نمونه نباید صفر/غیرواقعی باشد");
});

test("micro-flow series 38000 is excluded from the fit basis and reported as such", () => {
  const entry = report.perSeries["38000"];
  assert.equal(entry.inFitBasis, false);
  assert.equal(entry.predictiveTest, false);
  assert.match(entry.note, /ریزجریان/);
  assert.ok(!MEASURED_SERIES.includes("38000") || entry.note, "۳۸۰۰۰ یا مبنای برازش نیست یا یادداشت دارد");
  // ظرفیت بدنهٔ ۳۸۰۰۰ در کاتالوگ نیست؛ خطای بزرگ آن باید در آمار کلی وارد نشده باشد
  assert.ok(!Object.keys(report.overall.perSeriesMean).includes("38000"));
  assert.ok(report.overall.maxAbsPct < 100, "خطای میکروفلو نباید آمار کلی را آلوده کند");
});

test("per-DN back-test points are reported with measured, predicted and signed error", () => {
  const points = report.perSeries["31000"].points;
  assert.equal(points.length, 8);
  for (const point of points) {
    assert.match(point.dn, /^DN\d{2,4}$/);
    assert.ok(Number.isFinite(point.measured) && point.measured > 0);
    assert.ok(Number.isFinite(point.predicted) && point.predicted > 0);
    const recomputed = (100 * (point.predicted - point.measured)) / point.measured;
    // predicted به ۴ رقم بامعنا گرد شده، پس اختلاف محاسبهٔ مجدد تا ~۰٫۱٪ طبیعی است
    assert.ok(Math.abs(recomputed - point.errorPct) < 0.2, `${point.dn}: ${recomputed} vs ${point.errorPct}`);
    assert.ok(["in-envelope", "extrapolated"].includes(point.zone));
  }
  // DN20 بیرون بازهٔ سری ۵۱۰۰۰ است → باید اکستراپولاسیون علامت بخورد
  assert.equal(points.find((p) => p.dn === "DN20").zone, "extrapolated");
  assert.equal(points.find((p) => p.dn === "DN100").zone, "in-envelope");
});

// ============================================================
// ۲) ضرایب خانواده و ترتیب ظرفیت
// ============================================================

test("family multipliers are ordered globe < butterfly < control ball < full-bore ball", () => {
  const f = law.families;
  assert.equal(f.globe.multiplier, 1, "گلوب مستقیماً همان دادهٔ اندازه‌گیری‌شده است");
  assert.ok(f.ballFull.multiplier > 2 && f.ballFull.multiplier < 3.2, `ballFull=${f.ballFull.multiplier}`);
  assert.ok(
    f.globe.multiplier < f.butterfly.multiplier &&
      f.butterfly.multiplier < f.ballControl.multiplier &&
      f.ballControl.multiplier < f.ballFull.multiplier,
    `ترتیب خانواده‌ها به‌هم خورده: ${JSON.stringify(Object.fromEntries(FAMILY_ORDER().map((k) => [k, f[k].multiplier])))}`
  );
  // نسبت کنترل‌به‌تمام‌بور باید همان ضریب منتشرشده باشد
  close(f.ballControl.multiplier / f.ballFull.multiplier, 0.6, 0.01);
  close(f.butterfly.multiplier / f.ballFull.multiplier, 0.45, 0.01);

  for (const key of ["globe", "ballFull", "ballControl", "butterfly"]) {
    assert.ok(f[key].bandPct >= 0 && Number.isFinite(f[key].bandPct), `${key} bandPct`);
    assert.ok(f[key].source.length > 10, `${key} باید مبنای عددی خود را توضیح دهد`);
  }
  function FAMILY_ORDER() {
    return ["globe", "butterfly", "ballControl", "ballFull"];
  }
});

test("Cv grows strictly with DN and stays inside the physical area bound for restrictive bodies", () => {
  for (const key of ["globe", "ballFull", "ballControl", "butterfly"]) {
    let previous = 0;
    for (const row of DN_LADDER) {
      const cv = cvForSize(law, key, row.dnMm);
      assert.ok(Number.isFinite(cv) && cv > previous, `${key}/${row.dn} نزولی یا نامعین است`);
      previous = cv;
    }
  }

  // شیرهای محدودکننده (گلوب/پروانه‌ای/توپی کنترلی) نباید از ظرفیت سوراخِ تیزِ
  // تمام‌بور (Cv = 29.9·d²) رد شوند؛ فقط توپیِ تمام‌بور چون پورت واقعی‌اش
  // بزرگ‌تر از سوراخِ تیز است اجازهٔ عبور از این لنگر را دارد (جدول منتشرشده
  // خودِ پروژه نیز همین را می‌دهد).
  for (const key of ["globe", "ballControl", "butterfly"]) {
    for (const row of DN_LADDER) {
      assert.ok(
        cvForSize(law, key, row.dnMm) <= idealBoreCv(row.dnMm),
        `${key}/${row.dn}: ${cvForSize(law, key, row.dnMm)} > ${idealBoreCv(row.dnMm)}`
      );
    }
  }
  for (const row of DN_LADDER) {
    const ratio = cvForSize(law, "ballFull", row.dnMm) / idealBoreCv(row.dnMm);
    assert.ok(ratio > 1 && ratio < 1.6, `ballFull/${row.dn} نسبت به سوراخ ایده‌آل = ${ratio.toFixed(3)}`);
  }
});

test("fitPowerLaw returns null instead of extrapolating from a single point", () => {
  assert.equal(fitPowerLaw([{ dnMm: 50, cv: 60 }]), null);
  assert.equal(fitPowerLaw([]), null);
  assert.equal(fitPowerLaw([{ dnMm: 50, cv: 60 }, { dnMm: 80, cv: -1 }]), null);
  const two = fitPowerLaw([
    { dnMm: 25, cv: 14 },
    { dnMm: 100, cv: 225 }
  ]);
  assert.ok(Math.abs(two.exponent - 2) < 0.02, `exponent=${two.exponent}`);
  assert.equal(two.r2, 1);
});

// ============================================================
// ۳) طبقه‌بندی و رد صریح
// ============================================================

test("actuators and accessories are refused and get no Cv", () => {
  const actuator = products.find((p) => p.categoryId === "pneumatic-actuators");
  assert.ok(actuator, "محصول عملگر در دیتابیس باید باشد");
  const classification = classifyProduct(actuator);
  assert.equal(classification.kind, "actuator");
  assert.equal(classification.family, null);
  assert.match(classification.reasons.join(" "), /بدنهٔ جریان|Cv ندارد/);

  assert.equal(estimateSeries({ seriesId: String(actuator.series), products, catalog }), null);
  assert.equal(REFUSED[String(actuator.series)], "actuator");

  // حتی با دستهٔ ناشناخته، نامِ «پوزیشنر/سولنوئید» باید رد شود
  assert.equal(
    classifyProduct({ series: "1234", categoryId: "unknown-cat", name: { en: "4-20 mA positioner", fa: "پوزیشنر" } })
      .kind,
    "actuator"
  );
});

test("safety valve series is refused as an orifice-device, not given a Cv ladder", () => {
  const psv = products.find((p) => p.categoryId === "safety-valves");
  const classification = classifyProduct(psv);
  assert.equal(classification.kind, "orifice");
  assert.match(classification.reasons.join(" "), /API 526|psv-sizing/);
  assert.equal(estimateSeries({ seriesId: String(psv.series), products, catalog }), null);
  assert.equal(REFUSED[String(psv.series)], "orifice");
});

test("an unrecognised non-valve product is refused rather than guessed", () => {
  const classification = classifyProduct({ series: "99999", categoryId: "mystery", name: { en: "Stainless bracket" } });
  assert.equal(classification.kind, "actuator");
  assert.equal(estimateSeries({ seriesId: "99999", products: [], catalog }), null);
});

test("family subtype comes from product text: full-bore vs control ball, butterfly stays butterfly", () => {
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  assert.equal(familyKeyFor(classifyProduct(bySlug["general-ball-35000"]), bySlug["general-ball-35000"]), "ballFull");
  assert.equal(familyKeyFor(classifyProduct(bySlug["ball-control-45000"]), bySlug["ball-control-45000"]), "ballControl");
  assert.equal(familyKeyFor(classifyProduct(bySlug["butterfly-control-53000"]), bySlug["butterfly-control-53000"]), "butterfly");
  assert.equal(familyKeyFor(classifyProduct(bySlug["spherical-globe-51000"]), bySlug["spherical-globe-51000"]), "globe");
});

// ============================================================
// ۴) بازهٔ سایز و نردبان DN
// ============================================================

test("declared inch ranges map onto the R20 DN ladder", () => {
  const globe = products.find((p) => p.slug === "spherical-globe-51000");
  const range = sizeRangeFromProduct(globe);
  assert.ok(range && range.min >= 2 && range.max <= 24, JSON.stringify(range));

  const rows = dnLadderInRange({ min: 2, max: 24 });
  assert.equal(rows[0].dn, "DN50");
  assert.equal(rows[rows.length - 1].dn, "DN600");
  assert.equal(rows.length, 14);

  // NPS 1 اینچ ≡ DN25 (قرارداد استاندارد)، نه DN20
  assert.equal(dnLadderInRange({ min: 1, max: 1 }).length, 1);
  assert.equal(dnLadderInRange({ min: 1, max: 1 })[0].dn, "DN25");
  assert.equal(dnLadderInRange(null).length, 0);
});

// ============================================================
// ۵) شکل منحنی و پلکان تریم
// ============================================================

test("equal-percentage curve shape is monotonic, normalised and taken from measured trims", () => {
  const shape = shapes.equal;
  assert.ok(shape && shape.samples > 100, "شکل منحنی باید از تریم‌های اندازه‌گیری‌شده بیاید");
  assert.equal(shape.shape.length, 10);
  assert.equal(shape.shape[9], 1);
  for (let i = 1; i < 10; i++) assert.ok(shape.shape[i] >= shape.shape[i - 1], "شکل نزولی است");
  assert.ok(shape.shape[0] > 0, "حد پایین بردی باید بیشتر از صفر باشد");
  // مشخصهٔ درصدی: Cv در ۵۰٪ باید چندی کمتر از نصف ظرفیت باشد
  assert.ok(shape.shape[4] <= 0.35, `ratio50 شکل = ${shape.shape[4]}`);
});

test("built curves keep the catalogue invariants (curve[9] = rated Cv, ascending, ratio50, rangeability)", () => {
  const trims = buildTrims(120, shapes.equal.shape, ladder);
  assert.ok(trims.length >= 2, "تریم کامل + حداقل یک تریم کاهش‌یافته");
  assert.deepEqual(trims.map((t) => t.cv), [...trims.map((t) => t.cv)].sort((a, b) => a - b));

  for (const trim of trims) {
    assert.equal(trim.characteristic, "equal");
    assert.equal(trim.curve.length, 10);
    assert.equal(trim.curve[9], trim.cv, "آخرین نقطه باید دقیقاً Cv نامی باشد");
    for (let i = 1; i < 10; i++) assert.ok(trim.curve[i] >= trim.curve[i - 1], "منحنی نزولی است");
    const metrics = curveMetrics(trim.curve);
    close(trim.ratio50, metrics.ratio50, 1e-9);
    close(trim.rangeability, metrics.rangeability, 1e-9);
    assert.ok(trim.ratio50 <= 0.35, "مشخصهٔ درصدی باید نسبت ۵۰٪ کوچک داشته باشد");
    assert.ok(trim.rangeability >= 20 && trim.rangeability <= 100, `rangeability=${trim.rangeability}`);
    close(trim.rangeability, trim.curve[9] / trim.curve[0], trim.rangeability * 0.02);
    // گردکردن Cv: همان قرارداد کاتالوگ
    close(trim.cv, roundCv(trim.cv), 1e-9);
  }

  // درون‌یابی منحنی باید Cv نامی و بازشدگی را بازتولید کند
  const full = trims[trims.length - 1];
  close(curveCvAt(full.curve, 100), full.cv, 1e-9);
  close(curveOpening(full.curve, full.cv), 100, 0.5);
  assert.ok(curveCvAt(full.curve, 50) < full.cv * 0.4);
  assert.ok(curveCvAt(full.curve, 10) > 0);
});

test("trim ladder ratios come from measured catalogue and the low-Cv option is refused below Cv 0.2", () => {
  assert.ok(ladder.samples > 300, `${ladder.samples}`);
  assert.ok(ladder.low < ladder.reduced && ladder.reduced < 1);
  assert.ok(ladder.reduced > 0.2 && ladder.reduced < 0.6, `reduced=${ladder.reduced}`);

  const tiny = buildTrims(0.5, shapes.equal.shape, ladder);
  assert.equal(tiny.length, 1, "زیر Cv ۰٫۲ فقط تریم کامل ساخته می‌شود");
  assert.equal(tiny[0].note, "trim-full");
  assert.equal(buildCurve(0, shapes.equal.shape), null);
  assert.equal(buildCurve(10, null), null);
});

// ============================================================
// ۶) اطمینان و برچسب منبع
// ============================================================

test("confidence band grows outside the measured range and never claims a verified level", () => {
  const overlap = confidenceFor({ report, law, familyKey: "globe", dnMm: 100 });
  const singleSeries = confidenceFor({ report, law, familyKey: "globe", dnMm: 500 });
  const extrapolated = confidenceFor({ report, law, familyKey: "globe", dnMm: 700 });
  const rotary = confidenceFor({ report, law, familyKey: "butterfly", dnMm: 100 });

  assert.equal(overlap.zone, "inside-two-series-overlap");
  assert.equal(singleSeries.zone, "inside-measured-range-single-series");
  assert.equal(extrapolated.zone, "extrapolated-outside-measured-range");
  assert.equal(overlap.lawBandPct, report.overall.inEnvelope.meanAbsPct);
  assert.ok(singleSeries.bandPct > overlap.bandPct, `${singleSeries.bandPct} ≤ ${overlap.bandPct}`);
  assert.ok(extrapolated.bandPct >= singleSeries.bandPct);
  assert.ok(rotary.bandPct > overlap.bandPct, "ضریب خانواده باید خطا را افزایش دهد");
  assert.equal(rotary.familyBandPct, law.families.butterfly.bandPct);
  close(rotary.bandPct, Math.hypot(overlap.lawBandPct, law.families.butterfly.bandPct), 0.06);

  // سطح اطمینان هیچ‌گاه «تأییدشده» نیست و مقدارش زیر ۰٫۹ می‌ماند
  for (const item of [overlap, singleSeries, extrapolated, rotary]) {
    assert.ok(["medium", "low", "very-low", "unknown"].includes(item.level), item.level);
    assert.ok(item.value > 0 && item.value < 0.9, `value=${item.value} نباید «تأییدشده» باشد`);
  }
  assert.ok(overlap.bandPct <= report.overall.maxAbsPct + 0.1, "داخل همپوشانی نباید از بدترین خطای LOSO رد شود");

  // بدون خودآزمون → unknown، نه حدس
  const empty = confidenceFor({ report: { overall: {} }, law, familyKey: "globe", dnMm: 50 });
  assert.equal(empty.level, "unknown");
  assert.equal(empty.bandPct, null);
});

// ============================================================
// ۷) سند برآورد: پوشش، برچسب منبع، عدم بازنویسی دادهٔ اندازه‌گیری‌شده
// ============================================================

test("every flow-body series without measured data is estimated and measured series are left untouched", () => {
  for (const id of MEASURED_SERIES) {
    assert.equal(REFUSED[id], "measured", `سری اندازه‌گیری‌شدهٔ ${id} نباید برآورد شود`);
    assert.ok(!document.series[id]);
  }

  const expected = ["10000", "35000", "45000", "46000", "53000", "62000", "65000", "66000", "70000", "90000"];
  assert.deepEqual(ESTIMATED_SERIES, expected);
  assert.equal(document.meta.stats.estimatedSeries, expected.length);
  assert.equal(document.meta.stats.refusedSeries, 2);
  assert.equal(document.provenance, PROVENANCE);
  assert.equal(document.schemaVersion, SCHEMA_VERSION);

  for (const [id, entry] of Object.entries(document.series)) {
    assert.equal(entry.provenance, "estimated", id);
    assert.equal(entry.method, METHOD_ID, id);
    assert.ok(entry.notes.some((note) => note.includes(ACCURACY_CAVEAT.fa.slice(0, 24))), `${id} بدون هشدار دقت`);
    assert.ok(entry.basis.family, `${id} خانواده ندارد`);
    assert.ok(entry.basis.law.cv0 > 0 && entry.basis.law.exponent > 0);
    assert.ok(Array.isArray(entry.basis.classificationReasons) && entry.basis.classificationReasons.length > 0);
    assert.ok(entry.errorPct > 0 && entry.confidence !== "verified");
    assert.equal(entry.basis.profile === undefined, false, `${id} باید پروفایل getSeriesProfile را داشته باشد`);
  }
});

test("estimated Cv is monotonic in DN and family ordering survives into the document", () => {
  for (const [id, entry] of Object.entries(document.series)) {
    const dns = entry.sizes.map((s) => s.dnMm);
    assert.deepEqual(dns, [...dns].sort((a, b) => a - b), `${id} سایزها صعودی نیستند`);
    assert.equal(new Set(dns).size, dns.length, `${id} DN تکراری`);
    let previous = 0;
    for (const size of entry.sizes) {
      assert.ok(size.cvMax > previous, `${id}/${size.dn} نزولی است`);
      assert.ok(size.trims.length >= 1, `${id}/${size.dn} تریم ندارد`);
      assert.equal(size.provenance, "estimated");
      previous = size.cvMax;
      assert.equal(size.cvMax, Math.max(...size.trims.map((t) => t.cv)), `${id}/${size.dn} cvMax ناسازگار`);
    }
  }

  const dn = 100;
  const at = (id) => document.series[id].sizes.find((s) => s.dnMm === dn).cvMax;
  assert.ok(at("62000") < at("53000"), "گلوب باید کم‌ظرفیت‌تر از پروانه‌ای باشد");
  assert.ok(at("53000") < at("45000"), "پروانه‌ای باید کم‌ظرفیت‌تر از توپی کنترلی باشد");
  assert.ok(at("45000") < at("35000"), "توپی کنترلی باید کم‌ظرفیت‌تر از توپی تمام‌بور باشد");
});

test("the produced JSON is readable by the existing catalogue consumers", () => {
  const tables = document.series;
  const globe = tables["62000"];
  const product = products.find((p) => p.slug === "rotary-globe-62000");

  assert.ok(globe.sizes.every((size) => size.dn && typeof size.dnMm === "number" && Array.isArray(size.trims)));
  const pick = selectCatalogValve(120, [{ slug: product.slug, series: "62000", categoryId: "rotary-globe-valves", sizeRange: { min: 1, max: 16 } }], tables);
  assert.ok(pick, "موتور انتخاب شیر باید بتواند از جدول برآوردی شیر پیشنهاد کند");
  assert.equal(pick.product.series, "62000");
  assert.ok(pick.cv >= 120);
  assert.ok(pick.openingPercent > 0 && pick.openingPercent <= 100);
  // همان تریمی که موتور انتخاب کرده باید منحنیِ هم‌شکل با کاتالوگ داشته باشد
  const chosenSize = tables["62000"].sizes.find((size) => size.dn === pick.dn);
  const chosenTrim = chosenSize.trims.find((trim) => trim.cv === pick.cv);
  assert.ok(chosenTrim, `تریم انتخاب‌شده در جدول برآوردی پیدا نشد: ${pick.dn}/${pick.cv}`);
  close(curveCvAt(chosenTrim.curve, 100), pick.cv, 1e-9);
  assert.equal(chosenTrim.curve.length, 10);

  // همان ردیف‌ها از مسیر اعتبارسنجی ادمین هم باید بپذیرند (شکل dn/cv)
  for (const [id, entry] of Object.entries(tables)) {
    const result = validateSeriesPayload(id, entry.sizes.map((size) => ({ dn: size.dn, cv: size.cvMax })));
    assert.equal(result.ok, true, `${id}: ${result.errors.join(" ")}`);
    assert.deepEqual(
      result.sizes.map((s) => s.dn),
      entry.sizes.map((s) => s.dn),
      `${id} ترتیب DN در مصرف‌کننده حفظ نشد`
    );
  }
});

test("written data file matches the library output and carries full provenance meta", () => {
  const file = path.join(process.cwd(), "data", "valve-cv-estimated.json");
  assert.ok(fs.existsSync(file), "اسکریپت باید data/valve-cv-estimated.json را نوشته باشد");
  const onDisk = JSON.parse(fs.readFileSync(file, "utf8"));

  assert.equal(onDisk.provenance, "estimated");
  assert.deepEqual(Object.keys(onDisk.series).sort(), ESTIMATED_SERIES);
  assert.deepEqual(onDisk.refused.map((item) => `${item.series}:${item.status}`).sort(),
    document.refused.map((item) => `${item.series}:${item.status}`).sort());

  const meta = onDisk.meta;
  assert.ok(meta.generatedAt && meta.source.includes("NOT manufacturer test data"), meta.source);
  assert.deepEqual(meta.measuredBasis, ["31000", "51000"]);
  assert.deepEqual(meta.excludedFromBasis.map((item) => item.series), ["38000"]);
  assert.ok(meta.law.globe.exponent > 1.8 && meta.law.families.ballFull.multiplier > 1);
  assert.equal(meta.law.genericTable.name.startsWith("VALVE_SIZES"), true);
  assert.ok(meta.backTest.overall.inEnvelope.meanAbsPct <= IN_ENVELOPE_MEAN_MAX);
  assert.ok(Object.keys(meta.backTest.perSeries).includes("51000"));
  assert.ok(meta.backTest.points["31000"].length === 8);
  assert.ok(meta.confidenceScheme.includes("LOSO") || meta.confidenceScheme.includes("خودآزمون"));
  assert.equal(meta.accuracyCaveat.en, ACCURACY_CAVEAT.en);
  assert.deepEqual(meta.openings, catalog.openings);
  // دادهٔ اندازه‌گیری‌شده هرگز بازنویسی نشده است
  assert.deepEqual(Object.keys(getCvCatalog().series).sort(), ["31000", "38000", "51000"]);
});

test("size ranges without a standard DN inside them produce no estimate", () => {
  const orphan = {
    slug: "odd",
    series: "77777",
    categoryId: "control-valves",
    name: { en: "Globe control valve 0.09 inch" },
    spec: { size: { en: "0.09 inch" } }
  };
  const entry = estimateSeries({ seriesId: "77777", products: [orphan], catalog });
  assert.equal(entry, null);

  // بدون بازهٔ سایز اعلامی → نردبان کامل R20 با یادداشت صریح
  const noRange = { slug: "nr", series: "77778", categoryId: "control-valves", name: { en: "Globe valve" } };
  const full = estimateSeries({ seriesId: "77778", products: [noRange], catalog });
  assert.equal(full.sizes.length, DN_LADDER.length);
  assert.ok(full.notes.some((note) => note.includes("بازهٔ سایز")));
});
