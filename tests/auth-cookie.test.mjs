/**
 * کوکی نشست مدیر باید با پروتکل واقعی درخواست هماهنگ باشد:
 * روی HTTPS امن، و روی نصب موقت HTTP بدون Secure تا ورود پنل ممکن بماند.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { getCookieOptions } from "../lib/auth.js";

test("کوکی مدیر پشت پروکسی HTTPS امن است", () => {
  const options = getCookieOptions({
    headers: new Headers({ "x-forwarded-proto": "https" }),
    nextUrl: { protocol: "http:" }
  });
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.name, "admin_token");
});

test("کوکی مدیر روی HTTP مستقیم Secure نیست", () => {
  const options = getCookieOptions({
    headers: new Headers(),
    nextUrl: { protocol: "http:" }
  });
  assert.equal(options.secure, false);
});

test("مقدار اول X-Forwarded-Proto تعیین‌کننده است", () => {
  const options = getCookieOptions({
    headers: new Headers({ "x-forwarded-proto": "http, https" }),
    nextUrl: { protocol: "https:" }
  });
  assert.equal(options.secure, false);
});
