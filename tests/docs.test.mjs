/**
 * نگهبان مستندات — راهنماها نباید بی‌صدا واگرا شوند یا به فایل‌های حذف‌شده ارجاع بدهند.
 * اجرا: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNBOOK = "INSTALL-STEPS.txt";

const DOCS = [
  "README.md",
  "DEPLOY.md",
  "GO-LIVE.md",
  RUNBOOK,
  "deploy/README.md",
  "deploy/INSTALL-STEPS.txt",
  "deploy/cpanel/README.md",
  "docs/CV-TABLES.md",
];

// سندهایی که عمداً بازنشسته شدند؛ ارجاع به آن‌ها یعنی مستندات عقب مانده‌اند.
const RETIRED = [
  "AI-SKILL.md",
  "AI-PROJECT-SKILL.md",
  "PROJECT-CONTEXT.md",
  "PROJECT-STATUS.md",
  "AUDIT.md",
  "SIZING.md",
  "public/logo/README.txt",
  "public/og/README.txt",
];

// مسیرهایی که به‌درستی در مخزن نیستند (اسرار یا فایل‌های تولیدی).
const MISSING_OK = new Set(["data/admin.json", ".env.production", ".env.local"]);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("راهنمای متنی، سند اصلی در ریشهٔ پروژه است و همهٔ بخش‌ها را دارد", () => {
  const file = path.join(ROOT, RUNBOOK);
  assert.ok(fs.existsSync(file), `${RUNBOOK} باید در ریشهٔ پروژه باشد`);

  const buf = fs.readFileSync(file);
  assert.notEqual(buf[0], 0xef, "فایل نباید BOM داشته باشد");
  const text = buf.toString("utf8");
  const lines = text.split(/\r?\n/);
  assert.ok(lines.length >= 250, `راهنما کوتاه‌تر از انتظار است (${lines.length} خط)`);

  // ۱۳ بخش شماره‌دار + پیوست
  for (const n of ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۱۰", "۱۱", "۱۲"]) {
    assert.match(text, new RegExp(`^${n}\\)`, "m"), `بخش «${n})» در ${RUNBOOK} پیدا نشد`);
  }
  assert.ok(text.includes("پیوست"), `پیوست فهرست اسکریپت‌ها در ${RUNBOOK} نیست`);

  // دستورها و مسیرهای حیاتی
  const needles = [
    "pm2 reload ecosystem.config.js --update-env",
    ".app-port",
    "deploy/install.sh",
    "deploy/install-remote.ps1",
    "deploy/update.sh",
    "deploy/deploy.sh",
    "deploy/bootstrap-server.sh",
    "deploy/make-env.sh",
    "deploy/backup.sh",
    "deploy/backup-products-db.cjs",
    "deploy/backup-docker.sh",
    "deploy/docker.sh",
    "deploy/docker-entrypoint.sh",
    "deploy/cpanel/README.md",
    "node scripts/preflight.mjs",
    "node scripts/rotate-admin-password.mjs",
    "node scripts/test-email.mjs",
  ];
  // مسیرهای ویندوزی با \ نوشته می‌شوند؛ برای مقایسه یکدست می‌کنیم.
  const flat = text.replace(/\\/g, "/");
  for (const needle of needles) {
    assert.ok(flat.includes(needle), `«${needle}» در ${RUNBOOK} نیست`);
  }
});

test("deploy/INSTALL-STEPS.txt فقط اشاره‌گر به نسخهٔ ریشه است", () => {
  const text = read("deploy/INSTALL-STEPS.txt");
  const lines = text.split(/\r?\n/);
  assert.ok(lines.length <= 25, `اشاره‌گر باید کوتاه بماند (${lines.length} خط)`);
  assert.ok(
    text.includes("../INSTALL-STEPS.txt"),
    "اشاره‌گر باید به ../INSTALL-STEPS.txt اشاره کند",
  );
  assert.ok(
    !/pm2\s+(reload|start|restart|save)/.test(text),
    "اشاره‌گر نباید دستورهای PM2 را تکرار کند (خطر واگرایی)",
  );
  assert.ok(
    !text.includes("KEEP_DAYS"),
    "متن کامل راهنما نباید در دو فایل کپی شود",
  );
});

test("مستندات به سندهای بازنشسته ارجاع نمی‌دهند", () => {
  const hits = [];
  for (const rel of DOCS) {
    const text = read(rel);
    for (const dead of RETIRED) if (text.includes(dead)) hits.push(`${rel} → ${dead}`);
  }
  assert.deepEqual(hits, [], `ارجاع به فایل‌های بازنشسته:\n${hits.join("\n")}`);
});

test("لینک‌های نسبی مستندات به فایل موجود اشاره می‌کنند", () => {
  const broken = [];
  for (const rel of DOCS) {
    const dir = path.dirname(path.join(ROOT, rel));
    for (const match of read(rel).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
      const clean = target.split("#")[0];
      if (!clean) continue;
      if (!fs.existsSync(path.resolve(dir, clean))) broken.push(`${rel} → ${target}`);
    }
  }
  assert.deepEqual(broken, [], `لینک‌های شکسته:\n${broken.join("\n")}`);
});

test("مسیر فایل‌های یادشده در مستندات وجود دارد", () => {
  const prefixes = ["deploy/", "scripts/", "lib/", "tests/", "components/", "docs/", "messages/"];
  const broken = new Set();
  for (const rel of DOCS) {
    for (const match of read(rel).matchAll(/`([^`\s]+)`/g)) {
      const raw = match[1].replace(/^\.\//, "");
      if (!prefixes.some((p) => raw.startsWith(p))) continue;
      if (!path.extname(raw) || /[<*>,{}]/.test(raw)) continue;
      if (MISSING_OK.has(raw)) continue;
      if (!fs.existsSync(path.join(ROOT, raw))) broken.add(`${rel} → ${raw}`);
    }
  }
  const list = [...broken];
  assert.deepEqual(list, [], `مسیرهای ناموجود:\n${list.join("\n")}`);
});

test("دستورهای PM2 در مستندات فایل ecosystem را نام می‌برند", () => {
  const offenders = [];
  for (const rel of DOCS) {
    read(rel).split(/\r?\n/).forEach((line, index) => {
      if (/pm2\s+reload\s+psm-valve/.test(line) && !line.includes("ecosystem")) {
        offenders.push(`${rel}:${index + 1}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `باید «pm2 reload ecosystem.config.js --update-env» باشد:\n${offenders.join("\n")}`);
});