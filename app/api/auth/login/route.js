import { NextResponse } from "next/server";
import { verifyCredentials, signToken, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "اطلاعات ناقص" }, { status: 400 });
    }
    if (!verifyCredentials(username, password)) {
      return NextResponse.json({ ok: false, error: "نام کاربری یا رمز عبور اشتباه" }, { status: 401 });
    }
    const token = await signToken({ username });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
