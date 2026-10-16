import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServices, saveServices } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, services: getServices() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { services } = await request.json();
  if (!Array.isArray(services)) return NextResponse.json({ ok: false }, { status: 400 });
  saveServices(services);
  return NextResponse.json({ ok: true });
}
