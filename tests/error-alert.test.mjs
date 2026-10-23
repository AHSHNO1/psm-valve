import test from "node:test";
import assert from "node:assert/strict";

const { shouldSendAlert, recordAlertAttempt, resetAlertStateForTests } = await import(
  "../lib/error-alert.js"
);

test("اولین هشدار یک scope ارسال می‌شود", () => {
  resetAlertStateForTests();
  assert.equal(shouldSendAlert("server:route", "boom", 1000), true);
});

test("خطای تکراری همان scope در بازهٔ ۱۰ دقیقه تکرار نمی‌شود", () => {
  resetAlertStateForTests();
  recordAlertAttempt("server:route", "boom", 1000);
  // ۹ دقیقه بعد → تکراری
  assert.equal(shouldSendAlert("server:route", "boom", 1000 + 9 * 60 * 1000), false);
  // ۱۱ دقیقه بعد → دوباره مجاز
  assert.equal(shouldSendAlert("server:route", "boom", 1000 + 11 * 60 * 1000), true);
});

test("پیام متفاوت در همان scope تکراری حساب نمی‌شود", () => {
  resetAlertStateForTests();
  recordAlertAttempt("server:route", "boom A", 1000);
  assert.equal(shouldSendAlert("server:route", "boom B", 2000), true);
});

test("سقف ساعتی ۱۰ هشدار را رعایت می‌کند", () => {
  resetAlertStateForTests();
  for (let i = 0; i < 10; i++) {
    recordAlertAttempt(`scope-${i}`, `msg-${i}`, 1000 + i);
  }
  // ۱۱اُمین پیام متفاوت در همان ساعت → بلاک
  assert.equal(shouldSendAlert("scope-new", "fresh", 5000), false);
  // بعد از پاک‌شدن پنجرهٔ ساعتی → دوباره مجاز
  assert.equal(shouldSendAlert("scope-new", "fresh", 1000 + 61 * 60 * 1000), true);
});
