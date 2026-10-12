import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFaqs, saveFaqs } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, faqs: getFaqs() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { faqs } = await request.json();
  if (!Array.isArray(faqs)) return NextResponse.json({ ok: false }, { status: 400 });
  saveFaqs(faqs);
  return NextResponse.json({ ok: true });
}
