// ============================================================
// ERROR ALERT — هشدار خطاهای سرور به ایمیل مدیر
// نرخ‌محدودشده: هر خطای تکراری در بازهٔ ۱۰ دقیقه فقط یک بار،
// حداکثر ۱۰ ایمیل در ساعت (جلوگیری از طوفان ایمیل در خرابی گسترده).
// notifyAdminError هرگز پرتاب نمی‌کند و نباید مسیر اصلی درخواست را
// کند کند — callers آن را fire-and-forget صدا می‌زنند.
// ============================================================

import { sendAdminAlertEmail } from "./mailer.js";

const HOURLY_CAP = 10;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const DEDUPE_MS = 10 * 60 * 1000;

let sentTimestamps = [];
const lastAttemptByScope = new Map();

function dedupeKey(scope, message) {
  return `${scope}::${String(message || "").slice(0, 120)}`;
}

/** تصمیم نرخ‌گذاری؛ جدا از ارسال، برای تست‌پذیری. */
export function shouldSendAlert(scope, message, now = Date.now()) {
  sentTimestamps = sentTimestamps.filter((t) => now - t < HOURLY_WINDOW_MS);
  const last = lastAttemptByScope.get(dedupeKey(scope, message));
  if (last && now - last < DEDUPE_MS) return false;
  if (sentTimestamps.length >= HOURLY_CAP) return false;
  return true;
}

export function recordAlertAttempt(scope, message, now = Date.now()) {
  sentTimestamps.push(now);
  lastAttemptByScope.set(dedupeKey(scope, message), now);
}

export function resetAlertStateForTests() {
  sentTimestamps = [];
  lastAttemptByScope.clear();
}

/**
 * ثبت و ارسال هشدار یک خطای سرور. پرتاب نمی‌کند.
 * scope: برچسب کوتاه مثل "route:/api/contact" یا "mailer:contact-notification"
 */
export async function notifyAdminError(scope, error, context = {}) {
  try {
    const message = error?.message || String(error || "unknown");
    if (!shouldSendAlert(scope, message)) {
      return { sent: false, reason: "rate-limited" };
    }
    recordAlertAttempt(scope, message);

    const stack =
      typeof error?.stack === "string"
        ? error.stack.split("\n").slice(0, 8).join("\n")
        : "";
    const lines = [
      "یک خطای سرور در سایت PSM Valve ثبت شد.",
      "",
      `دامنه: ${scope}`,
      `زمان: ${new Date().toISOString()}`,
      `پیام: ${message}`,
      context.route ? `مسیر: ${context.route}` : "",
      context.detail || "",
      stack ? `\nآثار پشته (۸ خط اول):\n${stack}` : ""
    ].filter(Boolean);

    const result = await sendAdminAlertEmail({
      subject: `[PSM Valve] خطای سرور — ${scope}`,
      text: lines.join("\n")
    });
    return result;
  } catch (alertError) {
    // شکست خودِ هشدار نباید هیچ مسیری را خراب کند.
    console.error("error-alert failed:", alertError?.message || alertError);
    return { sent: false, reason: "alert-failed" };
  }
}
