import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMessages, writeJSON } from "@/lib/db";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, messages: getMessages() });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, read, replied } = await request.json();
  const list = getMessages();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  if (typeof read === "boolean") list[idx].read = read;
  if (typeof replied === "boolean") list[idx].replied = replied;
  writeJSON("messages.json", list);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const list = getMessages().filter((m) => m.id !== id);
  writeJSON("messages.json", list);
  return NextResponse.json({ ok: true });
}
