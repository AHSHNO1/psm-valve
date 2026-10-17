import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSiteChrome, saveSiteChrome, validateSiteChrome } from "@/lib/site-chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, settings: getSiteChrome() });
}

export async function PUT(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست" }, { status: 400 });
  }

  if (!validateSiteChrome(body?.settings)) {
    return NextResponse.json({ ok: false, error: "تنظیمات چیدمان معتبر نیست" }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, settings: saveSiteChrome(body.settings) });
  } catch (error) {
    console.error("Failed to save header and footer settings:", error);
    return NextResponse.json({ ok: false, error: "ذخیرهٔ چیدمان هدر و فوتر ناموفق بود" }, { status: 500 });
  }
}
