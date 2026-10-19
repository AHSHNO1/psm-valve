import test from "node:test";
import assert from "node:assert/strict";
import { parseSizeRange, buildSizingCatalog, suggestValves, selectCatalogValve, countCvSeries, curveCvAt, curveOpening } from "../lib/valve-catalog.js";

test("parseSizeRange reads catalogue ranges in inches", () => {
  assert.deepEqual(parseSizeRange({ en: "2 – 24 inch" }), { min: 2, max: 24 });
  assert.deepEqual(parseSizeRange({ en: "1/2 – 1 1/2 inch" }), { min: 0.5, max: 1.5 });
  assert.deepEqual(parseSizeRange({ en: "3/4 – 8 inch" }), { min: 0.75, max: 8 });
  assert.deepEqual(parseSizeRange({ en: "1 to 16 inch" }), { min: 1, max: 16 });
  assert.deepEqual(parseSizeRange({ en: "1/4 inch (port)" }), { min: 0.25, max: 0.25 });
  assert.equal(parseSizeRange({ en: "" }), null);
});

test("catalogue includes only products with a readable size range", () => {
  const catalog = buildSizingCatalog([
    { slug: "a", series: "51000", name: { fa: "الف" }, categoryId: "control-valves", spec: { size: { en: "2 – 24 inch" } } },
    { slug: "b", series: "90000", name: { fa: "ب" }, categoryId: "control-valves", spec: { size: { en: "" } } }
  ]);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].slug, "a");
});

test("suggestValves returns real products covering the size, control valves first", () => {
  const catalog = buildSizingCatalog([
    { slug: "ball", series: "46000", name: { en: "Ball" }, categoryId: "ball-valves", spec: { size: { en: "1 – 24 inch" } } },
    { slug: "globe", series: "51000", name: { en: "Globe" }, categoryId: "control-valves", spec: { size: { en: "2 – 24 inch" } } },
    { slug: "small", series: "38000", name: { en: "Small glove" }, categoryId: "control-valves", spec: { size: { en: "1/2 – 1 1/2 inch" } } }
  ]);

  const at50mm = suggestValves(catalog, 2, { limit: 3 });
  assert.deepEqual(at50mm.map((p) => p.series), ["51000", "46000"]);

  const at25mm = suggestValves(catalog, 1, { limit: 3 });
  assert.deepEqual(at25mm.map((p) => p.series), ["38000", "46000"]);

  assert.deepEqual(suggestValves(catalog, 30), []);
});

test("selectCatalogValve prefers control valves and the closest Cv above demand", () => {
  const catalog = buildSizingCatalog([
    { slug: "ball", series: "46000", name: { en: "Ball" }, categoryId: "ball-valves", spec: { size: { en: "1 – 24 inch" } } },
    { slug: "globe", series: "51000", name: { en: "Globe" }, categoryId: "control-valves", spec: { size: { en: "2 – 24 inch" } } }
  ]);

  const tables = {
    "46000": { sizes: [{ dn: "DN40", cv: 40 }, { dn: "DN50", cv: 70 }] },
    "51000": { sizes: [{ dn: "DN50", cv: 45 }, { dn: "DN80", cv: 90 }] }
  };

  // The ball valve has a tighter fit (40) but the globe control valve wins.
  const pick = selectCatalogValve(35, catalog, tables);
  assert.equal(pick.product.series, "51000");
  assert.equal(pick.dn, "DN50");
  assert.equal(pick.cv, 45);
  assert.equal(pick.source, "catalog");

  const next = selectCatalogValve(60, catalog, tables);
  assert.equal(next.product.series, "51000");
  assert.equal(next.dn, "DN80");

  assert.equal(selectCatalogValve(5000, catalog, tables), null);
  assert.equal(selectCatalogValve(35, catalog, {}), null);
  assert.equal(countCvSeries(tables), 2);
});

test("selectCatalogValve keeps the design opening near 80%", () => {
  const catalog = buildSizingCatalog([
    { slug: "globe", series: "51000", name: { en: "Globe" }, categoryId: "control-valves", spec: { size: { en: "2 – 24 inch" } } }
  ]);
  const tables = { "51000": { sizes: [{ dn: "DN80", cv: 90 }, { dn: "DN100", cv: 150 }] } };

  // 81.74 / 0.8 = 102.2, so the DN100 (Cv 150) is the right pick, not DN80 (91% opening).
  const pick = selectCatalogValve(81.74, catalog, tables);
  assert.equal(pick.dn, "DN100");
  assert.equal(pick.openingPercent, 54);

  // Falls back to the tightest fit when nothing reaches the margin.
  const tight = selectCatalogValve(89, catalog, { "51000": { sizes: [{ dn: "DN80", cv: 90 }] } });
  assert.equal(tight.dn, "DN80");
  assert.ok(tight.openingPercent > 80);
});
// منحنی واقعی سری ۵۱۰۰۰ برای سایز ۸ اینچ (Cv نامی ۳۶۰، مشخصهٔ درصدی)
const GLOBE_51000_8INN_EQUAL = [9, 21, 39, 60, 87, 135, 200, 269, 326, 360];
const GLOBE_51000_8INN_LINEAR = [36, 72, 108, 144, 180, 216, 252, 288, 324, 360];

function globeCatalog() {
  return buildSizingCatalog([
    { slug: "globe", series: "51000", name: { en: "Globe" }, categoryId: "control-valves", spec: { size: { en: "2 – 24 inch" } } }
  ]);
}

test("curveCvAt interpolates the ten catalogue points", () => {
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 0), 0);
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 10), 9);
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 50), 87);
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 80), 269);
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 100), 360);
  assert.equal(curveCvAt(GLOBE_51000_8INN_EQUAL, 15), 15);
  assert.equal(curveCvAt([1, 2], 50), null);
});

test("curveOpening inverts the curve and extrapolates beyond the ends", () => {
  assert.equal(curveOpening(GLOBE_51000_8INN_EQUAL, 9), 10);
  assert.equal(curveOpening(GLOBE_51000_8INN_EQUAL, 87), 50);
  assert.equal(curveOpening(GLOBE_51000_8INN_EQUAL, 360), 100);
  assert.equal(curveOpening(GLOBE_51000_8INN_EQUAL, 720), 200);
  assert.equal(curveOpening(GLOBE_51000_8INN_EQUAL, 0), null);
  assert.equal(curveOpening(null, 10), null);
});

test("catalogue selection reports the true opening from the curve, not the linear ratio", () => {
  const tables = {
    "51000": {
      sizes: [{
        dn: "DN200",
        nps: 8,
        cv: 360,
        source: "catalog",
        trims: [{ cv: 360, characteristic: "equal", curve: GLOBE_51000_8INN_EQUAL }]
      }]
    }
  };

  // ۱۸۰ ÷ ۳۶۰ = ۵۰٪ با فرض خطی، ولی منحنی درصدی واقعی ۶۷٪ می‌دهد.
  const pick = selectCatalogValve(180, globeCatalog(), tables);
  assert.equal(pick.dn, "DN200");
  assert.equal(pick.curveBased, true);
  assert.equal(pick.characteristic, "equal");
  assert.equal(pick.openingPercent, 67);
  assert.equal(pick.withinMargin, true);
  assert.equal(pick.source, "catalog");

  const linear = selectCatalogValve(180, globeCatalog(), {
    "51000": { sizes: [{ dn: "DN200", cv: 360, trims: [{ cv: 360, characteristic: "linear", curve: GLOBE_51000_8INN_LINEAR }] }] }
  });
  assert.equal(linear.openingPercent, 50);
});

test("design margin uses the curve capacity at 80% opening", () => {
  const tables = {
    "51000": {
      sizes: [{
        dn: "DN200",
        cv: 360,
        trims: [
          { cv: 360, characteristic: "equal", curve: GLOBE_51000_8INN_EQUAL },
          { cv: 500, characteristic: "linear", curve: null }
        ]
      }]
    }
  };

  // ۳۵۰ > ظرفیت منحنی در ۸۰٪ (=۲۶۹) پس تریم خطی ۵۰۰ انتخاب می‌شود.
  const pick = selectCatalogValve(350, globeCatalog(), tables);
  assert.equal(pick.cv, 500);
  assert.equal(pick.withinMargin, true);

  // اگر هیچ تریمی از این حاشیه رد نشود، تنگ‌ترین تناسب با هشدار بازشدگی برمی‌گردد.
  const tight = selectCatalogValve(340, globeCatalog(), {
    "51000": { sizes: [{ dn: "DN200", cv: 360, trims: [{ cv: 360, characteristic: "equal", curve: GLOBE_51000_8INN_EQUAL }] }] }
  });
  assert.equal(tight.openingPercent, 94);
  assert.equal(tight.withinMargin, false);
});

test("equal percentage wins a tie against linear at the same rated Cv", () => {
  const tables = {
    "51000": {
      sizes: [{
        dn: "DN200",
        cv: 360,
        trims: [
          { cv: 360, characteristic: "linear", curve: GLOBE_51000_8INN_LINEAR },
          { cv: 360, characteristic: "equal", curve: GLOBE_51000_8INN_EQUAL }
        ]
      }]
    }
  };

  const pick = selectCatalogValve(180, globeCatalog(), tables);
  assert.equal(pick.characteristic, "equal");

  // اما کوچک‌ترین Cv نامی همیشه مقدم است (تنگ‌ترین تناسب).
  const smallerLinear = selectCatalogValve(180, globeCatalog(), {
    "51000": {
      sizes: [{
        dn: "DN200",
        cv: 370,
        trims: [
          { cv: 370, characteristic: "linear", curve: null },
          { cv: 400, characteristic: "equal", curve: null }
        ]
      }]
    }
  });
  assert.equal(smallerLinear.cv, 370);
  assert.equal(smallerLinear.characteristic, "linear");
});

test("legacy admin tables still work and accept both table shapes", () => {
  const legacy = { "51000": { sizes: [{ dn: "DN50", cv: 45 }, { dn: "DN80", cv: 90 }] } };

  assert.equal(selectCatalogValve(35, globeCatalog(), legacy).dn, "DN50");
  assert.equal(selectCatalogValve(35, globeCatalog(), { series: legacy }).dn, "DN50");
  assert.equal(selectCatalogValve(35, globeCatalog(), { series: {} }), null);
});
