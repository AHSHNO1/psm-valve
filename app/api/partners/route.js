import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPartners, savePartners } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, partners: getPartners() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { partners } = await request.json();
  if (!Array.isArray(partners)) return NextResponse.json({ ok: false }, { status: 400 });
  savePartners(partners);
  return NextResponse.json({ ok: true });
}
