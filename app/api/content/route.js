import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContent, updateContent } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, content: getContent() });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json();
  const updated = updateContent(body);
  return NextResponse.json({ ok: true, content: updated });
}
