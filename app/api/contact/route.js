import { NextResponse } from "next/server";
import { addMessage } from "@/lib/db";
import { verifyContactChallenge } from "@/lib/contact-challenge";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const rate = consumeRateLimit(request, "contact-submit", 5, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16000) {
    return NextResponse.json({ ok: false, error: "درخواست بیش از حد بزرگ است." }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست." }, { status: 400 });
  }

  if (typeof body?.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!name || !email || !message) {
    return NextResponse.json({ ok: false, error: "فیلدهای ضروری را تکمیل کنید." }, { status: 400 });
  }
  if (name.length > 120 || email.length > 254 || phone.length > 50 || message.length > 5000) {
    return NextResponse.json({ ok: false, error: "یکی از فیلدها بیش از حد طولانی است." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "نشانی ایمیل معتبر نیست." }, { status: 400 });
  }

  let challengeValid;
  try {
    challengeValid = verifyContactChallenge(body?.captchaToken, body?.captchaInput);
  } catch (error) {
    console.error("Unable to verify contact challenge:", error);
    return NextResponse.json({ ok: false, error: "بررسی امنیتی موقتاً در دسترس نیست." }, { status: 503 });
  }
  if (!challengeValid) {
    return NextResponse.json({ ok: false, code: "invalid_challenge" }, { status: 400 });
  }

  try {
    const saved = addMessage({ name, email, phone, message });
    // پیام همیشه در پنل ذخیره می‌شود؛ ایمیل فقط اطلاع‌رسانی است و
    // خطای SMTP نباید ارسال فرم را خراب کند.
    const mailed = await sendContactNotification(saved);
    return NextResponse.json({ ok: true, id: saved.id, mailed: mailed.sent });
  } catch (error) {
    console.error("Unable to store contact message:", error);
    return NextResponse.json({ ok: false, error: "ذخیرهٔ پیام با خطا مواجه شد." }, { status: 500 });
  }
}
