import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTranslations, saveTranslations, validateTranslations } from "@/lib/translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, translations: getTranslations() });
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

  if (!validateTranslations(body?.translations)) {
    return NextResponse.json({ ok: false, error: "ساختار ترجمه‌ها معتبر نیست یا شامل فیلدهای ناشناخته است" }, { status: 400 });
  }

  try {
    const translations = saveTranslations(body.translations);
    return NextResponse.json({ ok: true, translations });
  } catch (error) {
    console.error("Failed to save site translations:", error);
    return NextResponse.json({ ok: false, error: "ذخیرهٔ ترجمه‌ها ناموفق بود" }, { status: 500 });
  }
}
