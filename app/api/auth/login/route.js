import { NextResponse } from "next/server";
import { verifyCredentials, signToken, COOKIE_OPTIONS } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  // محدودسازی تلاشهای ورود (ضد حملهٔ حدس رمز): ۱۰ تلاش در هر ۱۵ دقیقه برای هر IP
  const rate = consumeRateLimit(request, "panel-login", 10, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "تعداد تلاشهای ورود بیش از حد مجاز است؛ چند دقیقه بعد دوباره امتحان کنید."
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
  if (!body || typeof body !== "object" || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ ok: false, error: "اطلاعات ورود معتبر نیست" }, { status: 400 });
  }
  const { username, password } = body;
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    return NextResponse.json(
      { ok: false, error: "ورود در سرور پیکربندی نشده است؛ متغیرهای امن محیطی را تنظیم کنید." },
      { status: 503 }
    );
  }
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "اطلاعات ناقص" }, { status: 400 });
  }
  try {
    const user = await verifyCredentials(username, password);
    if (!user) {
      return NextResponse.json({ ok: false, error: "نام کاربری یا رمز عبور اشتباه" }, { status: 401 });
    }
    const token = await signToken({
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error("Panel login failed:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
