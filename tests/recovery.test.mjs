/**
 * منطق توکن بازیابی رمز مدیر:
 * صدور (یکتا)، مصرف یک‌بارمصرف، انقضا و باطل شدن با درخواست جدید.
 * با PSM_DATA_DIR ایزوله میشود تا data/ زنده دست نخورد.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.PSM_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "psm-recovery-"));

const { createRecoveryToken, consumeRecoveryToken, getPendingRecovery, clearRecovery } =
  await import("../lib/recovery.js");

test("توکن صدورشده معتبر و یکتاست", () => {
  const first = createRecoveryToken();
  const second = createRecoveryToken();
  assert.ok(first.length >= 40);
  assert.notEqual(first, second);
  assert.ok(getPendingRecovery(), "پس از صدور، رکورد در انتظار باید وجود داشته باشد");
});

test("توکن درست یک بار مصرف میشود و دفعهٔ دوم رد میشود", () => {
  const token = createRecoveryToken();
  assert.equal(consumeRecoveryToken(token), true);
  assert.equal(consumeRecoveryToken(token), false, "استفادهٔ دوباره از توکن مصرفشده باید رد شود");
  assert.equal(getPendingRecovery(), null, "پس از مصرف، رکورد باید پاک شود");
});

test("توکن اشتباه رد میشود و رکورد را پاک میکند", () => {
  createRecoveryToken();
  assert.equal(consumeRecoveryToken("x".repeat(43)), false);
  assert.equal(getPendingRecovery(), null, "حدس اشتباه باید توکن در انتظار را باطل کند");
});

test("ورودی نامعتبر بدون دست زدن به رکورد رد میشود", () => {
  createRecoveryToken();
  assert.equal(consumeRecoveryToken(""), false);
  assert.equal(consumeRecoveryToken(null), false);
  assert.equal(consumeRecoveryToken("short"), false);
  assert.ok(getPendingRecovery(), "رکورد معتبر باید باقی بماند");
  clearRecovery();
  assert.equal(getPendingRecovery(), null);
});
