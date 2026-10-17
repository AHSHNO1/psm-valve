import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompanyInfo, saveCompanyInfo, validateCompanyInfo } from "@/lib/company-info";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, company: getCompanyInfo() });
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

  if (!validateCompanyInfo(body?.company)) {
    return NextResponse.json({ ok: false, error: "اطلاعات شرکت معتبر نیست" }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, company: saveCompanyInfo(body.company) });
  } catch (error) {
    console.error("Failed to save company information:", error);
    return NextResponse.json({ ok: false, error: "ذخیره اطلاعات شرکت ناموفق بود" }, { status: 500 });
  }
}
