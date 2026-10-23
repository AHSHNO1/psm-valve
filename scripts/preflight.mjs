#!/usr/bin/env node
/**
 * پیش‌بررسی انتشار (Preflight) — قبل از deploy روی سرور اجرا شود.
 *
 *   node scripts/preflight.mjs
 *
 * متغیرها را از .env.production (اگر باشد) و سپس process.env می‌خواند.
 * خروجی: جدول PASS / WARN / FAIL و کد خروج ۱ در صورت وجود FAIL.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const results = [];

function pass(name, detail = "") { results.push({ level: "PASS", name, detail }); }
function warn(name, detail = "") { results.push({ level: "WARN", name, detail }); }
function fail(name, detail = "") { results.push({ level: "FAIL", name, detail }); }

function readEnv(file) {
  const full = path.join(ROOT, file);
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

const fileEnv = readEnv(".env.production");
const env = { ...fileEnv, ...process.env };

// 1) Node — Node 20 در آوریل ۲۰۲۶ به پایان پشتیبانی رسید.
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) pass("Node.js", `v${process.versions.node}`);
else if (major === 20) warn("Node.js", `v${process.versions.node} — Node 20 EOL شده؛ Node 22 LTS نصب کنید`);
else fail("Node.js", `v${process.versions.node} — نسخهٔ ۲۲ LTS یا بالاتر لازم است`);

// 2) Build
const buildServer = path.join(ROOT, ".next", "server", "app");
const buildStatic = path.join(ROOT, ".next", "static");
if (fs.existsSync(buildServer) && fs.existsSync(buildStatic)) {
  pass("بیلد تولید", ".next/server/app و .next/static موجودند");
} else {
  fail("بیلد تولید", "اجرا کنید: npm run build");
}

// 3) JWT secret
const secret = env.JWT_SECRET || "";
if (Buffer.byteLength(secret, "utf8") >= 32) pass("JWT_SECRET", `${Buffer.byteLength(secret, "utf8")} بایت`);
else fail("JWT_SECRET", "خالی یا کوتاه‌تر از ۳۲ بایت — با openssl rand -base64 48 بسازید");

// 4) Admin credential
const adminFile = path.join(ROOT, "data", "admin.json");
let adminHash = "";
if (fs.existsSync(adminFile)) {
  try { adminHash = JSON.parse(fs.readFileSync(adminFile, "utf8")).passwordHash || ""; } catch {}
}
const envHash = env.ADMIN_PASSWORD_HASH || "";
const envPassword = env.ADMIN_PASSWORD || "";

if (adminHash.startsWith("$2")) pass("رمز مدیر", "هش bcrypt در data/admin.json");
else if (envHash.startsWith("$2")) pass("رمز مدیر", "هش bcrypt در متغیر محیطی");
else if (envPassword.length >= 12) warn("رمز مدیر", "رمز متنی در محیط — هش bcrypt امن‌تر است");
else fail("رمز مدیر", "نه هش bcrypt و نه رمز ≥۱۲ کاراکتری تنظیم شده است");

// 5) Insecure dev credentials
if (String(env.ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS).toLowerCase() === "true") {
  fail("admin/admin در تولید", "ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS باید خالی یا false باشد");
} else {
  pass("admin/admin در تولید", "غیرفعال است");
}

// 5b) Permissions of secrets and runtime data (POSIX only; Windows uses ACLs)
if (process.platform !== "win32") {
  const sensitive = [
    ["data/admin.json", "هش رمز مدیر"],
    ["data/users.json", "کاربران پنل"],
    ["data/messages.json", "پیام‌های تماس"],
    [".env.production", "متغیرهای محیطی"]
  ];
  for (const [file, label] of sensitive) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const mode = fs.statSync(full).mode & 0o777;
    if ((mode & 0o077) === 0) pass(`دسترسی ${label}`, `${file} → ${mode.toString(8)}`);
    else warn(`دسترسی ${label}`, `${file} → ${mode.toString(8)}؛ chmod 600 لازم است`);
  }
}

// 6) Data
const dataFiles = [
  ["data/psm-valve.sqlite", "دیتابیس محصولات"],
  ["data/settings.json", "تنظیمات سایت"],
  ["data/valve-cv-tables.json", "جدول Cv (اختیاری)"]
];
for (const [file, label] of dataFiles) {
  const exists = fs.existsSync(path.join(ROOT, file));
  if (exists) pass(label, file);
  else if (file.includes("valve-cv")) warn(label, "وجود ندارد — سایزینگ از جدول عمومی استفاده می‌کند");
  else warn(label, `${file} یافت نشد`);
}

// 7) Public assets
const assets = [
  ["public/og/og-default.jpg", "تصویر OG"],
  ["public/logo/logo-main.png", "لوگو"],
  ["public/icons/icon-192.png", "آیکون PWA 192"],
  ["public/icons/icon-512.png", "آیکون PWA 512"]
];
for (const [file, label] of assets) {
  if (fs.existsSync(path.join(ROOT, file))) pass(label, file);
  else warn(label, `${file} یافت نشد`);
}

// 8) Uploads dir writable by the service user
const uploads = path.join(ROOT, "public", "uploads");
if (fs.existsSync(uploads)) {
  try {
    fs.accessSync(uploads, fs.constants.W_OK);
    pass("پوشهٔ آپلود", "public/uploads قابل نوشتن است");
  } catch {
    fail("پوشهٔ آپلود", "public/uploads برای کاربر سرویس قابل نوشتن نیست (chown/chmod)");
  }
} else {
  warn("پوشهٔ آپلود", "ساخته می‌شود، اما مطمئن شوید کاربر سرویس اجازهٔ نوشتن دارد");
}

// 9) Env file presence in production
if (fs.existsSync(path.join(ROOT, ".env.production"))) pass(".env.production", "موجود است");
else warn(".env.production", "روی سرور با متغیرهای محیطی یا این فایل تنظیم کنید");

const icon = { PASS: "✔", WARN: "▲", FAIL: "✖" };
console.log("\nPSM Valve — Preflight\n" + "=".repeat(52));
for (const r of results) {
  console.log(`${icon[r.level]} ${r.name.padEnd(26)} ${r.detail}`);
}
const failures = results.filter((r) => r.level === "FAIL").length;
const warnings = results.filter((r) => r.level === "WARN").length;
console.log("=".repeat(52));
console.log(`${results.length - failures - warnings} PASS · ${warnings} WARN · ${failures} FAIL\n`);

if (failures > 0) process.exit(1);
