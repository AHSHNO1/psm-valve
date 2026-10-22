import assert from "node:assert/strict";
import test from "node:test";

import {
  PIPE_SCHEDULE,
  findPipeByNps,
  pipeInsideDiameter,
  pipeFlowArea,
  nearestPipeSize
} from "../lib/pipe-schedule.js";

test("pipe schedule covers standard NPS sizes with monotonic OD", () => {
  assert.ok(PIPE_SCHEDULE.length >= 20);
  const ods = PIPE_SCHEDULE.map((row) => row.od);
  for (let i = 1; i < ods.length; i++) {
    assert.ok(ods[i] > ods[i - 1], "OD must increase with NPS");
  }
  const dns = PIPE_SCHEDULE.map((row) => row.dn);
  for (let i = 1; i < dns.length; i++) {
    assert.ok(dns[i] > dns[i - 1], "DN must increase with NPS");
  }
});

test("inside diameter and flow area match B36.10 dimensions", () => {
  const twoInch = findPipeByNps('2"');
  assert.ok(twoInch);
  assert.equal(pipeInsideDiameter(twoInch, "40"), 52.48);
  assert.equal(pipeInsideDiameter(twoInch, "80"), 49.22);
  assert.equal(pipeFlowArea(twoInch, "40"), 0.002163);

  const large = findPipeByNps('24"');
  assert.equal(pipeInsideDiameter(large, "40"), 575.04);
  assert.equal(pipeInsideDiameter(large, "80"), 548.08);

  for (const row of PIPE_SCHEDULE) {
    assert.ok(pipeInsideDiameter(row, "40") > 0);
    assert.ok(pipeInsideDiameter(row, "80") > 0);
    assert.ok(pipeInsideDiameter(row, "80") < pipeInsideDiameter(row, "40"));
  }
});

test("nearestPipeSize finds the closest schedule ID", () => {
  assert.equal(nearestPipeSize(52.5).nps, '2"');
  assert.equal(nearestPipeSize(52.5).schedule, "40");
  assert.equal(nearestPipeSize(49).schedule, "80");
  assert.equal(nearestPipeSize(0), null);
  assert.equal(nearestPipeSize(NaN), null);
});
