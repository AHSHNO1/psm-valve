import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeRateLimit } from "@/lib/rate-limit";
import { updateAdmin } from "@/lib/auth";
import { consumeRecoveryToken } from "@/lib/recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // محدودسازی حدس توکن: ۱۰ تلاش در ساعت برای هر IP
  const rate = consumeRateLimit(request, "panel-reset", 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "تعداد تلاشها بیش از حد مجاز است؛ بعداً دوباره امتحان کنید."
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
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < 12) {
    return NextResponse.json(
      { ok: false, error: "رمز عبور باید حداقل ۱۲ کاراکتر باشد." },
      { status: 400 }
    );
  }

  // consumeRecoveryToken حتی در صورت نامعتبر بودن توکن، رکورد را پاک میکند؛
  // پس خطای «نامعتبر» بعد از هر تلاش، درخواست ایمیل تازه میخواهد.
  if (!consumeRecoveryToken(token)) {
    return NextResponse.json(
      { ok: false, error: "لینک بازیابی نامعتبر یا منقضی شده است؛ درخواست جدید بدهید." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    updateAdmin({ passwordHash });
    return NextResponse.json({
      ok: true,
      message: "رمز عبور با موفقیت بازنشانی شد؛ اکنون با رمز جدید وارد شوید."
    });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
