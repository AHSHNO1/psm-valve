import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMessages, writeJSON } from "@/lib/db";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const messages = getMessages();
  if (new URL(request.url).searchParams.get("summary") === "1") {
    return NextResponse.json({
      ok: true,
      messages: messages.slice(0, 8),
      unreadCount: messages.filter((message) => !message.read).length
    });
  }
  return NextResponse.json({ ok: true, messages });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }
  const { id, read, replied } = body || {};
  if (typeof id !== "string" || !id ||
      (read === undefined && replied === undefined) ||
      (read !== undefined && typeof read !== "boolean") ||
      (replied !== undefined && typeof replied !== "boolean")) {
    return NextResponse.json({ ok: false, error: "اطلاعات تغییر پیام معتبر نیست." }, { status: 400 });
  }

  const list = getMessages();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "پیام پیدا نشد." }, { status: 404 });

  if (typeof read === "boolean") list[idx].read = read;
  if (typeof replied === "boolean") list[idx].replied = replied;
  try {
    writeJSON("messages.json", list);
  } catch (error) {
    console.error("Unable to update contact message:", error);
    return NextResponse.json({ ok: false, error: "ذخیره تغییرات پیام ناموفق بود." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "شناسه پیام الزامی است." }, { status: 400 });

  const current = getMessages();
  const list = current.filter((m) => m.id !== id);
  if (list.length === current.length) {
    return NextResponse.json({ ok: false, error: "پیام پیدا نشد." }, { status: 404 });
  }
  try {
    writeJSON("messages.json", list);
  } catch (error) {
    console.error("Unable to delete contact message:", error);
    return NextResponse.json({ ok: false, error: "حذف پیام ناموفق بود." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
