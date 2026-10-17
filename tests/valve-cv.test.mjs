import test from "node:test";
import assert from "node:assert/strict";
import { validateSeriesPayload } from "../lib/valve-cv.js";

test("valid series payload is normalised and sorted by DN", () => {
  const result = validateSeriesPayload("51000", [
    { dn: "dn80", cv: "90" },
    { dn: "DN50", cv: 45.126 }
  ]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.sizes, [
    { dn: "DN50", cv: 45.13 },
    { dn: "DN80", cv: 90 }
  ]);
});

test("invalid DN, duplicate sizes and non-positive Cv are rejected", () => {
  const badDn = validateSeriesPayload("51000", [{ dn: "2 inch", cv: 10 }]);
  assert.equal(badDn.ok, false);
  assert.match(badDn.errors.join(" "), /DN50/);

  const duplicate = validateSeriesPayload("51000", [
    { dn: "DN50", cv: 10 },
    { dn: "DN50", cv: 20 }
  ]);
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.errors.join(" "), /تکراری/);

  const zero = validateSeriesPayload("51000", [{ dn: "DN50", cv: 0 }]);
  assert.equal(zero.ok, false);
});

test("empty size list and malformed series are rejected", () => {
  assert.equal(validateSeriesPayload("51000", []).ok, false);
  assert.equal(validateSeriesPayload("bad series!", [{ dn: "DN50", cv: 10 }]).ok, false);
  assert.equal(validateSeriesPayload("51000", "nope").ok, false);
});
