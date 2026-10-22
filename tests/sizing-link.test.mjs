import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSizingParams,
  buildSizingParams,
  pickSeriesValve,
  SIZING_NUMBER_KEYS
} from "../lib/sizing-link.js";

// ============================================================
// Share-link round-trip — the URL is the only input source,
// so parsing must be strict about invalid/untrusted values.
// ============================================================

test("build and parse round-trip the sizing form through the URL", () => {
  const query = buildSizingParams({
    fluid: "liquid",
    unitSystem: "IMPERIAL",
    form: { Q: 120.5, P1: 100, P2: 60, Gf: 0.87, Pv: 0.02, nu: 30, QUnit: "gpm" },
    series: "31000",
    dn: 50
  });
  const parsed = parseSizingParams("?" + query);
  assert.equal(parsed.hasParams, true);
  assert.equal(parsed.fluid, "liquid");
  assert.equal(parsed.unitSystem, "IMPERIAL");
  assert.equal(parsed.series, "31000");
  assert.equal(parsed.dn, 50);
  assert.ok(Math.abs(parsed.form.Q - 120.5) < 1e-6);
  assert.ok(Math.abs(parsed.form.P1 - 100) < 1e-6);
  assert.equal(parsed.form.nu, 30);
  assert.equal(parsed.form.QUnit, "gpm");
});

test("gas and steam links carry their own keys", () => {
  const gas = parseSizingParams(buildSizingParams({
    fluid: "gas", unitSystem: "SI",
    form: { Q: 1000, P1: 20, P2: 10, Gg: 0.65, MW: 18.82, T: 25, Z: 0.9, k: 1.3, xT: 0.7 }
  }));
  assert.equal(gas.fluid, "gas");
  assert.equal(gas.form.MW, 18.82);
  assert.equal(gas.form.k, 1.3);

  const steam = parseSizingParams(buildSizingParams({
    fluid: "steam", unitSystem: "SI",
    form: { W: 500, WUnit: "kg/h", P1: 12, P2: 6, T: 190 }
  }));
  assert.equal(steam.fluid, "steam");
  assert.equal(steam.form.W, 500);
  assert.equal(steam.form.WUnit, "kg/h");
});

test("a plain tool link is not mistaken for a shared calculation", () => {
  const parsed = parseSizingParams("?tool=sizing&page=2");
  assert.equal(parsed.hasParams, false);
  assert.equal(parsed.series, null);
  assert.deepEqual(parsed.form, {});
});

test("invalid values are dropped, defaults are kept", () => {
  const parsed = parseSizingParams("fluid=plasma&units=METRIC&Q=abc&P1=%20%20&series=%%bad%%&dn=99999&QUnit=furlongs%2Fmin");
  assert.equal(parsed.hasParams, false);
  assert.equal(parsed.fluid, "liquid");
  assert.equal(parsed.unitSystem, "SI");
  assert.equal(parsed.series, null);
  assert.equal(parsed.dn, null);
  assert.deepEqual(parsed.form, {});
});

test("buildSizingParams ignores unknown fluid types and out-of-range DN", () => {
  const query = buildSizingParams({ fluid: "plasma", unitSystem: "SI", form: { Q: 10 }, dn: 3 });
  assert.ok(!query.includes("fluid="));
  assert.ok(!query.includes("dn="));
  assert.ok(query.includes("Q=10"));
  // every declared numeric key survives a round-trip
  const all = buildSizingParams({ form: Object.fromEntries(SIZING_NUMBER_KEYS.map((k) => [k, 2])) });
  const back = parseSizingParams(all).form;
  for (const key of SIZING_NUMBER_KEYS) assert.equal(back[key], 2, key);
});

// ============================================================
// pickSeriesValve — catalogue trim selection for series= links
// ============================================================
const TABLES = {
  "31000": {
    sizes: [
      { dn: "DN40", nps: '1-1/2"', dnMm: 40, cv: 90, trims: [{ cv: 60, characteristic: "equal" }, { cv: 90, characteristic: "linear" }] },
      { dn: "DN50", nps: '2"', dnMm: 50, cv: 150, trims: [{ cv: 150, characteristic: "equal" }] }
    ]
  }
};

test("pickSeriesValve takes the smallest trim that covers the required Cv", () => {
  const pick = pickSeriesValve(TABLES, "31000", 80, 40);
  assert.equal(pick.dn, "DN40");
  assert.equal(pick.cv, 90);
  assert.equal(pick.characteristic, "linear");
  assert.equal(pick.insufficient, false);
  assert.equal(pick.dnMatched, true);
  assert.equal(pick.openingPercent, 89);
});

test("pickSeriesValve falls back across DN and flags insufficient coverage", () => {
  const dnFallback = pickSeriesValve(TABLES, "31000", 100, 40);
  assert.equal(dnFallback.dn, "DN50");
  assert.equal(dnFallback.dnMatched, false);

  const tooBig = pickSeriesValve(TABLES, "31000", 300);
  assert.equal(tooBig.insufficient, true);
  assert.equal(tooBig.cv, 150); // largest available trim
  assert.equal(tooBig.openingPercent, 100);

  assert.equal(pickSeriesValve(TABLES, "99999", 80), null);
  assert.equal(pickSeriesValve(undefined, "31000", 80), null);
  assert.equal(pickSeriesValve(TABLES, "31000", 0), null);
});

test("two-point sizing fields survive the share link", () => {
  for (const key of ["QMin", "marginPct"]) {
    assert.ok(SIZING_NUMBER_KEYS.includes(key), `${key} must be carried in the URL`);
  }
  const query = buildSizingParams({
    fluid: "liquid",
    unitSystem: "SI",
    form: { Q: 300, P1: 12, P2: 6, QMin: 40, marginPct: 20, QUnit: "m³/h" }
  });
  const parsed = parseSizingParams("?" + query);
  assert.equal(parsed.form.QMin, 40);
  assert.equal(parsed.form.marginPct, 20);
  assert.equal(parsed.form.QUnit, "m³/h", "QMin is read in the same unit as Q");
});

test('per-field units travel with their values in the share link', () => {
  const query = buildSizingParams({
    fluid: 'liquid',
    unitSystem: 'SI',
    form: { P1: 100, P1Unit: 'psi', P2: 6, T: 212, TUnit: '°F', nu: 20, nuUnit: 'cP', Gf: 850, GfUnit: 'kg/m³', pipeDn: 4, pipeDnUnit: 'in' }
  });
  const parsed = parseSizingParams('?' + query);
  assert.equal(parsed.form.P1Unit, 'psi', 'a percent-style encoded unit must survive');
  assert.equal(parsed.form.TUnit, '°F');
  assert.equal(parsed.form.nuUnit, 'cP');
  assert.equal(parsed.form.GfUnit, 'kg/m³');
  assert.equal(parsed.form.pipeDnUnit, 'in');
  assert.equal(parsed.form.Gf, 850);
});

test('invalid or unsupported field units are dropped, not trusted', () => {
  const parsed = parseSizingParams('P1=100&P1Unit=bogus&T=20&TUnit=bar&Gf=1&GfUnit=°F');
  assert.equal(parsed.form.P1, 100);
  assert.equal(parsed.form.P1Unit, undefined);
  assert.equal(parsed.form.TUnit, undefined, 'a pressure unit is not valid for temperature');
  assert.equal(parsed.form.GfUnit, undefined);
});
