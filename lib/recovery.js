import { createHash, randomBytes } from "crypto";
import { rmSync } from "fs";
import path from "path";
import { readJSON, writeJSON, getDataDir } from "./db.js";

// ============================================================
// RECOVERY — بازیابی دسترسی مدیر
// یک توکن یک‌بارمصرف ۱۵ دقیقه‌ای برای لینک بازنشانی رمز.
// فقط هش توکن ذخیره میشود؛ درخواست جدید توکن قبلی را باطل میکند.
// ============================================================

const RECOVERY_FILE = "recovery.json";
const TOKEN_TTL_MS = 15 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(String(token), "utf8").digest("hex");
}

export function getPendingRecovery() {
  const record = readJSON(RECOVERY_FILE, null);
  if (!record || typeof record !== "object") return null;
  if (typeof record.tokenHash !== "string" || typeof record.expiresAt !== "number") {
    return null;
  }
  if (record.expiresAt <= Date.now()) return null;
  return record;
}

/**
 * توکن جدید صادر میکند و توکن قبلی را باطل میکند.
 * مقدار خام توکن فقط یک بار برگردانده میشود (برای قرارگیری در لینک ایمیل).
 */
export function createRecoveryToken() {
  const token = randomBytes(32).toString("base64url");
  writeJSON(RECOVERY_FILE, {
    tokenHash: hashToken(token),
    expiresAt: Date.now() + TOKEN_TTL_MS,
    requestedAt: Date.now()
  });
  return token;
}

/**
 * اگر توکن معتبر و منقضی‌نشده باشد مصرف میشود (یک‌بارمصرف) و true برمیگرداند.
 */
export function consumeRecoveryToken(token) {
  if (typeof token !== "string" || token.length < 20) return false;
  const record = readJSON(RECOVERY_FILE, null);
  if (!record || typeof record.tokenHash !== "string") return false;
  const matches = record.tokenHash === hashToken(token);
  const fresh = typeof record.expiresAt === "number" && record.expiresAt > Date.now();
  clearRecovery();
  return matches && fresh;
}

export function clearRecovery() {
  try {
    rmSync(path.join(getDataDir(), RECOVERY_FILE), { force: true });
  } catch {
    // فایل نبودن یا قفل بودن نباید جریان بازیابی را بشکند
  }
}

export const RECOVERY_TTL_MINUTES = Math.round(TOKEN_TTL_MS / 60000);
