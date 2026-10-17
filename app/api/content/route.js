import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContent, updateContent } from "@/lib/content";

export const runtime = "nodejs";

export async function GET(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, content: getContent() });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "ساختار محتوای ارسالی معتبر نیست" }, { status: 400 });
  }
  try {
    const updated = updateContent(body);
    return NextResponse.json({ ok: true, content: updated });
  } catch (error) {
    console.error("Failed to save site content:", error);
    return NextResponse.json({ ok: false, error: "ذخیرهٔ محتوای سایت ناموفق بود" }, { status: 500 });
  }
}
