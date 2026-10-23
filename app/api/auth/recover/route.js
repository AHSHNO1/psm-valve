import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { isMailConfigured, sendRecoveryEmail } from "@/lib/mailer";
import { getAdmin } from "@/lib/auth";
import { createRecoveryToken, RECOVERY_TTL_MINUTES } from "@/lib/recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// گیرندهٔ ایمیل بازیابی؛ فقط همین آدرس لینک دریافت میکند.
function recoveryRecipient() {
  return (
    process.env.ADMIN_RECOVERY_EMAIL ||
    process.env.CONTACT_TO ||
    process.env.SMTP_USER ||
    ""
  ).trim().toLowerCase();
}

// میزبان لینک از هدرهای پروکسی ساخته میشود؛ هاست نامعتبر رد میشود تا
// لینک ایمیل قابل جعل از طریق Host header نباشد.
function buildOrigin(request) {
  const proto = (request.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return "";
  return `${proto}://${host}`;
}

export async function POST(request) {
  // ۳ درخواست در ساعت برای هر IP — جلوگیری از سوءاستفاده و بار ایمیل
  const rate = consumeRateLimit(request, "panel-recover", 3, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "تعداد درخواستهای بازیابی بیش از حد مجاز است؛ بعداً دوباره امتحان کنید."
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست" }, { status: 400 });
  }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "ایمیل معتبر نیست" }, { status: 400 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "ارسال ایمیل روی این سرور پیکربندی نشده است؛ با مدیر فنی تماس بگیرید." },
      { status: 503 }
    );
  }

  const recipient = recoveryRecipient();
  const admin = getAdmin();
  if (!recipient || !admin.username || email !== recipient) {
    // پاسخ همیشه یکسان است تا وجود/نبودن ایمیل در سیستم لو نرود
    return NextResponse.json({
      ok: true,
      message: "اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی برای شما ارسال شد؛ پوشهٔ Spam را هم بررسی کنید."
    });
  }

  const origin = buildOrigin(request);
  if (!origin) {
    console.error("Recovery skipped: invalid Host header");
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }

  const token = createRecoveryToken();
  const resetUrl = `${origin}/admin/login?reset=${encodeURIComponent(token)}`;
  const result = await sendRecoveryEmail({
    username: admin.username,
    resetUrl,
    expiresMinutes: RECOVERY_TTL_MINUTES,
    to: recipient
  });

  if (!result.sent) {
    console.error("Recovery email not sent:", result.reason);
  }

  return NextResponse.json({
    ok: true,
    message: "اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی برای شما ارسال شد؛ پوشهٔ Spam را هم بررسی کنید."
  });
}
