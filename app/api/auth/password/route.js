import bcrypt from "bcryptjs";
import { updateAdmin, verifyAdminPassword } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { guard, readJson, json, err, isResponse } from "@/lib/api-helpers";

export async function PATCH(request) {
  const session = await guard(request, { role: "admin" });
  if (isResponse(session)) return session;

  // محدودسازی تغییر رمز (ضد حدس رمز فعلی): ۵ تلاش در هر ۱۵ دقیقه برای هر IP
  const rate = consumeRateLimit(request, "password-change", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return err("تعداد تلاش بیش از حد مجاز است؛ کمی بعد دوباره امتحان کنید.", 429, {
      code: "rate_limited"
    }, { headers: { "Retry-After": String(rate.retryAfter) } });
  }

  const body = await readJson(request);
  if (isResponse(body)) return body;
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (typeof currentPassword !== "string" || currentPassword.length > 200) {
    return err("رمز فعلی معتبر نیست", 400);
  }

  let currentPasswordIsValid;
  try {
    currentPasswordIsValid = await verifyAdminPassword(currentPassword);
  } catch (error) {
    console.error("Failed to verify administrator password:", error);
    return err("بررسی رمز انجام نشد؛ دوباره تلاش کنید", 500);
  }
  if (!currentPasswordIsValid) {
    return err("رمز فعلی اشتباه است", 400);
  }
  if (typeof newPassword !== "string" || newPassword.length < 12 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return err("رمز جدید باید حداقل ۱۲ کاراکتر و حداکثر ۷۲ بایت باشد", 400);
  }

  let newPasswordMatchesCurrent;
  try {
    newPasswordMatchesCurrent = await verifyAdminPassword(newPassword);
  } catch (error) {
    console.error("Failed to compare administrator passwords:", error);
    return err("بررسی رمز انجام نشد؛ دوباره تلاش کنید", 500);
  }
  if (newPasswordMatchesCurrent) {
    return err("رمز جدید باید با رمز فعلی متفاوت باشد", 400);
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    updateAdmin({ passwordHash });
    return json();
  } catch (error) {
    console.error("Failed to update administrator password:", error);
    return err("تغییر رمز ذخیره نشد؛ دوباره تلاش کنید", 500);
  }
}
