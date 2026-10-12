import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBranding, saveBranding } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, branding: getBranding() });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json();
  const updated = saveBranding(body);
  return NextResponse.json({ ok: true, branding: updated });
}
