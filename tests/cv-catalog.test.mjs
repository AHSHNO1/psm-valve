import assert from "node:assert/strict";
import test from "node:test";

import { getCvCatalog, getCvCatalogSummary, getSizingTablesForClient } from "../lib/valve-cv.js";
import { curveCvAt, selectCatalogValve } from "../lib/valve-catalog.js";

// تست روی دادهٔ واقعی کاتالوگ (data/valve-cv-catalog.json) اجرا می‌شود؛
// هدف، گرفتن رگرسیون پس از هر بار ورود دادهٔ جدید از اکسل است.

const ALLOWED_CHARACTERISTICS = ["linear", "equal", "modified", "quick"];

test("catalogue reference data has the expected series and sizes", () => {
  const catalog = getCvCatalog();

  assert.deepEqual(Object.keys(catalog.series).sort(), ["31000", "38000", "51000"]);
  assert.deepEqual(catalog.openings, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.equal(catalog.stats.trims, 542);
  assert.equal(catalog.stats.sizes, 23);
  assert.equal(catalog.stats.duplicateRowsRemoved, 135);

  const sizes51000 = catalog.series["51000"].sizes.map((size) => size.nps);
  assert.deepEqual(sizes51000, [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24]);

  const smallest = catalog.series["38000"].sizes[0];
  assert.equal(smallest.nps, 0.5);
  assert.equal(smallest.dn, "DN15");
});

test("every catalogue trim is well formed and internally consistent", () => {
  const catalog = getCvCatalog();
  let checked = 0;

  for (const [seriesId, entry] of Object.entries(catalog.series)) {
    for (const size of entry.sizes) {
      assert.match(size.dn, /^DN\d{2,4}$/, `${seriesId}/${size.nps} باید قالب DN داشته باشد`);
      assert.ok(Number.isInteger(size.dnMm), `${seriesId}/${size.dn} باید شمارهٔ میلی‌متری داشته باشد`);
      assert.ok(size.trims.length > 0, `${seriesId}/${size.dn} باید دست‌کم یک ترم داشته باشد`);

      const ratedList = size.trims.map((trim) => trim.cv);
      assert.equal(size.cvMax, Math.max(...ratedList), `${seriesId}/${size.dn} باید cvMax درست داشته باشد`);

      for (const trim of size.trims) {
        checked += 1;
        assert.ok(trim.cv > 0 && trim.cv <= 100000, "Cv نامی باید عددی مثبت باشد");
        assert.ok(
          ALLOWED_CHARACTERISTICS.includes(trim.characteristic),
          `مشخصهٔ ناشناخته: ${trim.characteristic}`
        );
        assert.equal(trim.curve.length, 10, "منحنی باید ۱۰ نقطه داشته باشد");
        assert.equal(trim.curve[9], trim.cv, "آخرین نقطهٔ منحنی باید برابر Cv نامی باشد");
        for (let index = 1; index < trim.curve.length; index += 1) {
          assert.ok(
            trim.curve[index] >= trim.curve[index - 1],
            `منحنی ${seriesId}/${size.dn} نزولی است`
          );
        }
        if (trim.characteristic === "equal") {
          assert.ok(trim.ratio50 <= 0.35, "مشخصهٔ درصدی باید نسبت ۵۰٪ کوچک داشته باشد");
        }
      }
    }
  }

  assert.equal(checked, 542);
});

test("catalogue repairs stay recorded and applied", () => {
  const catalog = getCvCatalog();

  assert.equal(catalog.repairs.length, 3);
  assert.deepEqual(
    catalog.repairs.map((repair) => `${repair.series}/${repair.nps}/${repair.opening}`),
    ["51000/24/90", "51000/16/80", "51000/18/60"]
  );

  const repaired = catalog.series["51000"].sizes.find((size) => size.nps === 16);
  const trim = repaired.trims.find((item) => item.cv === 1100);
  assert.ok(trim, "تریم Cv 1100 برای سایز ۱۶ اینچ باید موجود باشد");
  assert.equal(trim.curve[7], 880, "مقدار تایپی ۶۸۰ باید به ۸۸۰ اصلاح شده باشد");
});

test("client sizing tables drop linear curves and keep the shape compatible", () => {
  const tables = getSizingTablesForClient().series;

  const entry = tables["51000"];
  assert.ok(entry, "سری ۵۱۰۰۰ باید در جدول سایزینگ باشد");

  const dns = entry.sizes.map((size) => Number(size.dn.replace(/\D/g, "")));
  assert.deepEqual(dns, [...dns].sort((a, b) => a - b), "سایزها باید صعودی باشند");

  let linear = 0;
  let curved = 0;
  for (const size of entry.sizes) {
    for (const trim of size.trims) {
      if (trim.characteristic === "linear") {
        linear += 1;
        assert.equal(trim.curve, null, "منحنی تریم خطی برای کلاینت حذف می‌شود");
      } else {
        curved += 1;
        assert.equal(trim.curve.length, 10);
      }
    }
  }
  assert.ok(linear > 0 && curved > 0);
});

test("real catalogue data feeds the sizing engine", () => {
  const tables = getSizingTablesForClient().series;
  const catalog = [{ slug: "globe-51000", series: "51000", name: { en: "Globe" }, categoryId: "control-valves", sizeRange: { min: 2, max: 24 } }];

  const pick = selectCatalogValve(400, catalog, { series: tables });
  assert.ok(pick, "باید بتوان از دادهٔ کاتالوگ شیر انتخاب کرد");
  assert.equal(pick.product.series, "51000");
  assert.ok(pick.openingPercent > 0 && pick.openingPercent <= 100);
  assert.ok(pick.cv >= 400);

  // همان منحنی که موتور استفاده کرده باید مقدار نامی درست بدهد
  if (pick.curveBased) {
    const size = tables["51000"].sizes.find((item) => item.dn === pick.dn);
    const trim = size.trims.find((item) => item.cv === pick.cv);
    assert.equal(curveCvAt(trim.curve, 100), pick.cv);
  }

  const summary = getCvCatalogSummary();
  // سه سری اندازه‌گیری‌شده + سری‌های برآوردی؛ هر دو در پنل ادمین دیده می‌شوند
  const measured = summary.series.filter((entry) => entry.provenance === "measured");
  assert.equal(measured.length, 3);
  assert.equal(summary.estimatedCount, summary.series.length - measured.length);
  assert.ok(summary.series.every((entry) => entry.provenance), "هر سری باید سرچشمهٔ داده داشته باشد");
  const globe = summary.series.find((item) => item.series === "51000");
  assert.equal(globe.trims, 348);
  assert.equal(globe.byCharacteristic.equal, 99);
});

// ------------------------------------------------------------
// برآورد مهندسی: سرچشمهٔ داده باید همه‌جا قابل تشخیص بماند
// ------------------------------------------------------------

test("measured series keep their measured rows and never receive estimated ones", () => {
  const tables = getSizingTablesForClient().series;
  // سری‌هایی که کاتالوگ اندازه‌گیری‌شده دارند نباید هیچ ردیف برآوردی بگیرند
  for (const id of ["31000", "38000", "51000"]) {
    const entry = tables[id];
    assert.equal(entry.provenance, "measured", "سری " + id);
    assert.ok(entry.sizes.every((size) => size.source === "catalog"), "سری " + id + " نباید سایز برآوردی داشته باشد");
    // منحنی برآوردی هم نباید به سری اندازه‌گیری‌شده بچسبد
    assert.equal(entry.curveShape, undefined, "سری اندازه‌گیری‌شده منحنی برآوردی ندارد");
    assert.equal(entry.estimate, undefined);
  }

  const estimated = Object.values(tables).filter((entry) => entry.provenance === "estimated");
  assert.ok(estimated.length >= 1, "باید دست‌کم یک سری برآوردی در جدول سایزینگ باشد");
  for (const entry of estimated) {
    assert.ok(entry.sizes.every((size) => size.source === "estimated"));
    assert.ok(entry.sizes.every((size) => size.errorPct > 0), "هر سایز برآوردی باید خطای آزمون داشته باشد");
    assert.ok(["very-low", "low", "medium"].includes(entry.estimate.confidence));
    assert.equal(entry.curveShape.points.length, 10);
    assert.equal(entry.curveShape.points[9], 1, "شکل منحنی نرمال‌شده است");
    assert.deepEqual(entry.curveShape.points, [...entry.curveShape.points].sort((a, b) => a - b), "شکل باید صعودی باشد");
  }
});

test("estimated curves are rebuilt from the shared shape, not left linear", () => {
  const tables = getSizingTablesForClient().series;
  const id = Object.keys(tables).find((key) => tables[key].provenance === "estimated");
  const entry = tables[id];
  const size = entry.sizes.find((item) => item.trims.length > 1);
  const trim = size.trims[size.trims.length - 1];

  // جدول کلاینت منحنی تکی ندارد؛ شکل مشترک در سطح سری است
  assert.equal(trim.curve, undefined);

  const pick = selectCatalogValve(trim.cv - 1e-6, [{ slug: "x", series: id, name: { en: "X" }, categoryId: "control-valves", sizeRange: { min: 0.1, max: 100 } }], { series: { [id]: { ...entry, sizes: [size] } } });
  assert.ok(pick, "باید از سری برآوردی انتخاب انجام شود");
  assert.equal(pick.source, "estimated");
  assert.ok(pick.curveBased, "بازشدگی باید از منحنی بازسازی‌شده بیاید، نه فرض خطی");
  // بازشدگی برای Cv کمی کمتر از Cv نامی باید نزدیک ۱۰۰٪ باشد، نه ۷۰٪ (فرض خطی)
  assert.ok(pick.openingPercent >= 90, "بازشدگی " + pick.openingPercent);
});

test("measured data outranks an estimate when both cover the flow", () => {
  // دو سری با Cv یکسان در سایز یکسان: یکی اندازه‌گیری‌شده، یکی برآوردی
  const makeTables = () => ({
    series: {
      "90001": {
        provenance: "measured",
        sizes: [{ dn: "DN50", nps: 2, dnMm: 50, source: "catalog", cv: 40, trims: [{ cv: 40, characteristic: "linear", curve: null }] }]
      },
      "90002": {
        provenance: "estimated",
        curveShape: { characteristic: "equal", points: [0.0249, 0.0569, 0.088, 0.164, 0.242, 0.372, 0.556, 0.747, 0.895, 1] },
        sizes: [{ dn: "DN50", nps: 2, dnMm: 50, source: "estimated", cv: 40, confidence: "low", errorPct: 45, trims: [{ cv: 40, characteristic: "equal" }] }]
      }
    }
  });
  const catalog = [
    { slug: "m", series: "90001", name: { en: "Measured" }, categoryId: "control-valves", sizeRange: { min: 2, max: 2 } },
    { slug: "e", series: "90002", name: { en: "Estimated" }, categoryId: "control-valves", sizeRange: { min: 2, max: 2 } }
  ];

  const pick = selectCatalogValve(20, catalog, makeTables());
  assert.ok(pick);
  assert.equal(pick.product.series, "90001", "با وجود گزینهٔ اندازه‌گیری‌شده، برآورد نباید انتخاب شود");
  assert.equal(pick.source, "catalog");
  assert.equal(pick.confidence, null);

  // اگر سری اندازه‌گیری‌شده حذف شود، برآورد با همان قاعده وارد می‌شود
  const tables = makeTables();
  delete tables.series["90001"];
  const fallback = selectCatalogValve(20, [catalog[1]], tables);
  assert.ok(fallback);
  assert.equal(fallback.source, "estimated");
  assert.equal(fallback.errorPct, 45);
});

test("beyond the measured capacity the estimate fills the gap and says so", () => {
  const tables = getSizingTablesForClient().series;
  // همهٔ سری‌ها، از جمله اندازه‌گیری‌شده‌ها، در رقابت‌اند
  const products = Object.keys(tables).map((id) => ({
    slug: "p" + id,
    series: id,
    name: { en: id },
    categoryId: "control-valves",
    sizeRange: { min: 0.25, max: 60 }
  }));

  // Cv بسیار بزرگ: هیچ سری اندازه‌گیری‌شده‌ای پوشش نمی‌دهد (بزرگ‌ترین تریم کاتالوگ ~۷۰۰۰)
  const pick = selectCatalogValve(12000, products, { series: tables });
  assert.ok(pick, "برآورد باید برای Cvهای خارج از کاتالوگ پاسخ بدهد");
  assert.equal(pick.source, "estimated");
  assert.ok(pick.errorPct > 0);
  assert.ok(Number.isFinite(pick.openingPercent));
});