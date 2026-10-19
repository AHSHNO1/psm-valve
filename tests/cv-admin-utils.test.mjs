import assert from "node:assert/strict";
import test from "node:test";

import {
  DN_RE,
  SERIES_RE,
  catalogRowsFor,
  coverageSummary,
  exportTables,
  groupSeries,
  normalizeDn,
  normalizeRow,
  parseCvLines,
  sizeText,
  validateRows
} from "../lib/cv-admin-utils.js";

// تست‌های منطق صفحهٔ «جدول Cv سایزینگ» پنل ادمین:
// پارس متن اکسل، اعتبارسنجی ردیف‌ها، گروه‌بندی سری‌ها و پوشش داده.

test("DN and series patterns match the server rules", () => {
  assert.ok(DN_RE.test("DN50"));
  assert.ok(DN_RE.test("DN1000"));
  assert.equal(DN_RE.test("DN5"), false);
  assert.equal(DN_RE.test("50"), false);
  assert.ok(SERIES_RE.test("51000"));
  assert.ok(SERIES_RE.test("97/98"));
  assert.equal(SERIES_RE.test("51000 x"), false);
});

test("normalizeDn and normalizeRow clean pasted values", () => {
  assert.equal(normalizeDn(" dn80 "), "DN80");
  assert.deepEqual(normalizeRow({ dn: "dn50", cv: 45 }), { dn: "DN50", cv: "45" });
  assert.deepEqual(normalizeRow({ dn: null, cv: "" }), { dn: "", cv: "" });
  assert.deepEqual(normalizeRow({ dn: "DN50", cv: 0 }), { dn: "DN50", cv: "0" });
  assert.equal(sizeText({ en: "2 – 24 inch" }), "2 – 24 inch");
  assert.equal(sizeText(""), "");
});

test("validateRows reports every problem and accepts a clean table", () => {
  const empty = validateRows([]);
  assert.equal(empty.ok, false);
  assert.deepEqual(empty.messages, ["دست‌کم یک سایز لازم است."]);

  const bad = validateRows([
    { dn: "50", cv: "45" },
    { dn: "DN80", cv: "abc" },
    { dn: "DN100", cv: "-5" },
    { dn: "DN50", cv: "45" },
    { dn: "DN50", cv: "70" }
  ]);
  assert.equal(bad.ok, false);
  assert.equal(bad.messages.length, 4);
  assert.match(bad.rowErrors[0], /DN50/);
  assert.match(bad.rowErrors[1], /عددی مثبت/);
  assert.match(bad.rowErrors[2], /عددی مثبت/);
  assert.equal(bad.rowErrors[3], undefined);
  assert.match(bad.rowErrors[4], /تکراری/);

  const good = validateRows([{ dn: "DN50", cv: "45" }, { dn: "DN80", cv: "90" }]);
  assert.equal(good.ok, true);
  assert.deepEqual(good.rowErrors, {});
});

test("parseCvLines reads the single series format with any separator", () => {
  const parsed = parseCvLines("DN50, 45\nDN80 90\n\n# توضیح\ndn100;150", "51000");

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows, 3);
  assert.equal(parsed.seriesCount, 1);
  assert.deepEqual(parsed.groups["51000"], [
    { dn: "DN50", cv: "45" },
    { dn: "DN80", cv: "90" },
    { dn: "DN100", cv: "150" }
  ]);
});

test("parseCvLines groups a full excel sheet by series and keeps the last duplicate", () => {
  const parsed = parseCvLines(
    ["51000, DN50, 45", "51000, DN50, 52", "46000\tDN80\t120", "46000, 100, 200"].join("\n")
  );

  assert.equal(parsed.seriesCount, 2);
  assert.deepEqual(parsed.groups["51000"], [{ dn: "DN50", cv: "52" }]);
  assert.deepEqual(parsed.groups["46000"], [{ dn: "DN80", cv: "120" }]);
  assert.equal(parsed.errors.length, 1);
  assert.equal(parsed.errors[0].line, 4);
  assert.match(parsed.errors[0].reason, /DN/);
});

test("parseCvLines accepts Cv-first lines and reports unclear input", () => {
  const swapped = parseCvLines("45, DN50", "70000");
  assert.deepEqual(swapped.groups["70000"], [{ dn: "DN50", cv: "45" }]);

  const noSeries = parseCvLines("DN50, 45");
  assert.equal(noSeries.seriesCount, 0);
  assert.match(noSeries.errors[0].reason, /سری/);

  const missingCv = parseCvLines("51000, DN80");
  assert.match(missingCv.errors[0].reason, /Cv/);

  const junk = parseCvLines("سلام دنیا");
  assert.match(junk.errors[0].reason, /DN/);

  const badSeries = parseCvLines("DN50, 45", "51000#");
  assert.match(badSeries.errors[0].reason, /معتبر نیست/);

  const extra = parseCvLines("51000, DN50, 45, 70");
  assert.match(extra.errors[0].reason, /مقدار اضافه/);

  const zero = parseCvLines("51000, DN50, 0");
  assert.match(zero.errors[0].reason, /مثبت/);
});

test("catalogRowsFor turns catalogue sizes into editable rows", () => {
  const rows = catalogRowsFor({ sizes: [{ dn: "DN50", cvMax: 45 }, { dn: "DN80", cvMax: 90.5 }] });
  assert.deepEqual(rows, [
    { dn: "DN50", cv: "45" },
    { dn: "DN80", cv: "90.5" }
  ]);
  assert.deepEqual(catalogRowsFor(null), []);
});

test("groupSeries merges same-series products and derives the status", () => {
  const products = [
    { slug: "a", series: "70000", name: { fa: "الف" }, categoryId: "pressure-regulating-valves", sizeText: "1/4 inch", inSizing: true },
    { slug: "b", series: "70000", name: { fa: "ب" }, categoryId: "pressure-regulating-valves", sizeText: "1/4 – 1 inch", inSizing: true },
    { slug: "c", series: "51000", name: { fa: "ج" }, categoryId: "control-valves", sizeText: "2 – 24 inch", inSizing: true },
    { slug: "d", series: "97 / 98 – 62 / 63", name: { fa: "اکچویتور" }, categoryId: "pneumatic-actuators", sizeText: "", inSizing: false }
  ];
  const tables = { "51000": { sizes: [{ dn: "DN50", cv: 45 }], updatedAt: "2026-01-01T00:00:00.000Z" } };
  const catalog = { "51000": { series: "51000", sizes: [{ dn: "DN50", cvMax: 45 }], trims: 4 } };

  const list = groupSeries(products, tables, catalog);
  const bySeries = {};
  list.forEach((item) => { bySeries[item.series] = item; });

  assert.equal(list.length, 3);
  assert.equal(bySeries["70000"].products.length, 2);
  assert.deepEqual(bySeries["70000"].sizeRanges, ["1/4 inch", "1/4 – 1 inch"]);
  assert.equal(bySeries["70000"].status, "none");
  assert.equal(bySeries["51000"].status, "both");
  assert.equal(bySeries["51000"].adminCount, 1);
  assert.equal(bySeries["51000"].updatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(bySeries["97 / 98 – 62 / 63"].status, "invalid");
  assert.equal(bySeries["97 / 98 – 62 / 63"].inSizing, false);

  // سری‌های مؤثر در سایزینگ اول می‌آیند و در بین آن‌ها «بدون داده» جلوتر است
  assert.equal(list[0].series, "70000");
  assert.equal(list[2].series, "97 / 98 – 62 / 63");
});

test("coverageSummary counts real data coverage for the sizing series", () => {
  const list = groupSeries(
    [
      { slug: "a", series: "10000", categoryId: "piston-valves", sizeText: "1/2 – 8 inch", inSizing: true },
      { slug: "b", series: "31000", categoryId: "control-valves", sizeText: "3/4 – 8 inch", inSizing: true },
      { slug: "c", series: "46000", categoryId: "ball-valves", sizeText: "1 – 24 inch", inSizing: true },
      { slug: "d", series: "A1", categoryId: "pneumatic-actuators", sizeText: "", inSizing: false }
    ],
    { "46000": { sizes: [{ dn: "DN50", cv: 120 }], updatedAt: null } },
    { "31000": { series: "31000", sizes: [{ dn: "DN20", cvMax: 10 }], trims: 2 } }
  );

  const summary = coverageSummary(list);
  assert.equal(summary.total, 3);
  assert.equal(summary.withCatalog, 1);
  assert.equal(summary.withAdmin, 1);
  assert.equal(summary.withoutData, 1);
  assert.deepEqual(summary.missing, ["10000"]);
  assert.equal(summary.percent, 67);
  assert.equal(summary.other, 1);
});

test("exportTables keeps the schema compatible with the data file", () => {
  const payload = exportTables({ "51000": { sizes: [{ dn: "DN50", cv: 45 }], updatedAt: "2026-01-01T00:00:00.000Z" } });
  assert.equal(payload.schemaVersion, 1);
  assert.ok(typeof payload.exportedAt === "string");
  assert.deepEqual(payload.series["51000"].sizes, [{ dn: "DN50", cv: 45 }]);
  assert.deepEqual(Object.keys(exportTables(null).series), []);
});