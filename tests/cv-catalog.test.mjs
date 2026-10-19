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
  assert.equal(summary.series.length, 3);
  const globe = summary.series.find((item) => item.series === "51000");
  assert.equal(globe.trims, 348);
  assert.equal(globe.byCharacteristic.equal, 99);
});