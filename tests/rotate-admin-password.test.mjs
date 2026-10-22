/**
 * گزینهٔ --username باید نام کاربری پنل را در data/admin.json بنویسد
 * (نصب خودکار با --admin-user به همین مسیر وابسته است).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "rotate-admin-password.mjs");

test("--username نام کاربری را در admin.json ذخیره می‌کند", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "psm-rotate-"));
  const passwordFile = path.join(dir, "password.txt");
  fs.writeFileSync(passwordFile, "A-strong-password-123", "utf8");
  try {
    execFileSync(process.execPath, [SCRIPT, "--password-file", passwordFile, "--username", "ops.admin"], {
      cwd: dir,
      stdio: "pipe",
      env: { ...process.env, ADMIN_USERNAME: "from-env" }
    });
    const admin = JSON.parse(fs.readFileSync(path.join(dir, "data", "admin.json"), "utf8"));
    assert.equal(admin.username, "ops.admin");
    assert.match(admin.passwordHash, /^\$2[aby]\$/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
