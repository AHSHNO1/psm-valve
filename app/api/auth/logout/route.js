import { NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_OPTIONS.name, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
