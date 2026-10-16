import { NextResponse } from "next/server";
import { createContactChallenge } from "@/lib/contact-challenge";
import { consumeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const rate = consumeRateLimit(request, "contact-challenge", 30, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  try {
    return NextResponse.json({ ok: true, challenge: createContactChallenge() });
  } catch (error) {
    console.error("Unable to create contact challenge:", error);
    return NextResponse.json(
      { ok: false, error: "بررسی امنیتی موقتاً در دسترس نیست." },
      { status: 503 }
    );
  }
}
