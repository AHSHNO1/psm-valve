#!/usr/bin/env node
/**
 * تست تنظیمات ایمیل.
 *
 *   node scripts/test-email.mjs
 *
 * متغیرها را از .env.production و سپس .env.local می‌خواند.
 * یک ایمیل تست به CONTACT_TO (پیش‌فرض psmvalve@gmail.com) می‌فرستد.
 */
import fs from "node:fs";
import path from "node:path";

function readEnv(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return {};
  const env = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx === -1 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

const fileEnv = { ...readEnv(".env.local"), ...readEnv(".env.production") };
for (const [key, value] of Object.entries(fileEnv)) {
  if (!process.env[key]) process.env[key] = value;
}

const { isMailConfigured, sendContactNotification } = await import("../lib/mailer.js");

if (!isMailConfigured()) {
  console.error("✖ SMTP تنظیم نشده است. SMTP_HOST / SMTP_USER / SMTP_PASS / CONTACT_TO را تنظیم کنید.");
  process.exit(1);
}

console.log("→ ارسال ایمیل تست ...");
const result = await sendContactNotification({
  name: "تست سیستم",
  email: "test@example.com",
  phone: "—",
  message: "این یک پیام تست برای بررسی تنظیمات SMTP است.",
  createdAt: new Date().toISOString()
});

if (result.sent) {
  console.log("✔ ایمیل تست ارسال شد. صندوق CONTACT_TO را بررسی کنید.");
} else {
  console.error("✖ ارسال نشد:", result.reason);
  process.exit(1);
}
