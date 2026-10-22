import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";

export async function POST(request) {
  const res = NextResponse.json({ ok: true });
  const cookieOptions = getCookieOptions(request);
  res.cookies.set(cookieOptions.name, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
