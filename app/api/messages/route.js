import { getMessages, writeJSON } from "@/lib/db";
import { guard, readJson, json, err, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  const messages = getMessages();
  if (new URL(request.url).searchParams.get("summary") === "1") {
    return json({
      messages: messages.slice(0, 8),
      unreadCount: messages.filter((message) => !message.read).length
    });
  }
  return json({ messages });
}

export async function PATCH(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  const { id, read, replied } = body || {};
  if (typeof id !== "string" || !id ||
      (read === undefined && replied === undefined) ||
      (read !== undefined && typeof read !== "boolean") ||
      (replied !== undefined && typeof replied !== "boolean")) {
    return err("اطلاعات تغییر پیام معتبر نیست.", 400);
  }

  const list = getMessages();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return err("پیام پیدا نشد.", 404);

  if (typeof read === "boolean") list[idx].read = read;
  if (typeof replied === "boolean") list[idx].replied = replied;
  try {
    writeJSON("messages.json", list);
  } catch (error) {
    console.error("Unable to update contact message:", error);
    return err("ذخیره تغییرات پیام ناموفق بود.", 500);
  }
  return json();
}

export async function DELETE(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return err("شناسه پیام الزامی است.", 400);

  const current = getMessages();
  const list = current.filter((m) => m.id !== id);
  if (list.length === current.length) {
    return err("پیام پیدا نشد.", 404);
  }
  try {
    writeJSON("messages.json", list);
  } catch (error) {
    console.error("Unable to delete contact message:", error);
    return err("حذف پیام ناموفق بود.", 500);
  }
  return json();
}
