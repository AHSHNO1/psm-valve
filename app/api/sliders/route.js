import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSliders, saveSliders } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, sliders: getSliders() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json();
  const list = body.sliders;
  if (!Array.isArray(list)) return NextResponse.json({ ok: false }, { status: 400 });
  saveSliders(list);
  return NextResponse.json({ ok: true });
}
