import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAparatChannelVideos, getMedia, addMediaItem, mergeAparatVideos, removeMediaItem, updateMedia, updateMediaItem } from "@/lib/media";

function isValidMediaItem(type, item) {
  if (typeof item.url !== "string" || !item.url.trim() || item.url.length > 2048) return false;
  if (type === "catalogs") return /^\/uploads\/catalogs\/[a-zA-Z0-9._-]+\.pdf$/i.test(item.url);
  if (type === "gallery") return /^\/uploads\/images\/[a-zA-Z0-9._-]+$/i.test(item.url);
  if (type === "videos") {
    return /^\/uploads\/videos\/[a-zA-Z0-9._-]+$/i.test(item.url) ||
      /^https:\/\/[^\s]+$/i.test(item.url);
  }
  return false;
}

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const media = getMedia();
  media.catalogs = (media.catalogs || []).filter((catalog) =>
    typeof catalog.url === "string" && catalog.url.startsWith("/uploads/catalogs/")
  );
  try {
    media.videos = mergeAparatVideos(await getAparatChannelVideos(), media.videos || [], true);
  } catch (error) {
    console.error("Unable to refresh Aparat videos in media API:", error);
  }
  return NextResponse.json({ ok: true, media });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر" }, { status: 400 });
  }
  const { type, item } = body || {};

  const validTypes = ["videos", "catalogs", "gallery"];
  if (!validTypes.includes(type) || !item || typeof item !== "object" || Array.isArray(item)) {
    return NextResponse.json({ ok: false, error: "نوع نامعتبر" }, { status: 400 });
  }
  if (!isValidMediaItem(type, item) || typeof item.title !== "string" || !item.title.trim()) {
    return NextResponse.json({ ok: false, error: "عنوان یا فایل مدیا معتبر نیست" }, { status: 400 });
  }

  const newItem = addMediaItem(type, item);
  return NextResponse.json({ ok: true, item: newItem });
}

export async function PUT(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر" }, { status: 400 });
  }
  const { type, id, item } = body || {};
  const validTypes = ["videos", "catalogs", "gallery"];
  if (!validTypes.includes(type) || typeof id !== "string" || !id || !item || typeof item !== "object" || Array.isArray(item)) {
    return NextResponse.json({ ok: false, error: "اطلاعات ویرایش نامعتبر است" }, { status: 400 });
  }
  if (!isValidMediaItem(type, item) || typeof item.title !== "string" || !item.title.trim()) {
    return NextResponse.json({ ok: false, error: "عنوان یا فایل مدیا معتبر نیست" }, { status: 400 });
  }

  const updatedItem = updateMediaItem(type, id, item);
  if (!updatedItem) {
    return NextResponse.json({ ok: false, error: "آیتم پیدا نشد" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item: updatedItem });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  const validTypes = ["videos", "catalogs", "gallery"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ ok: false, error: "نوع نامعتبر" }, { status: 400 });
  }

  const updated = removeMediaItem(type, id);
  return NextResponse.json({ ok: true, media: updated });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { introVideoUrl } = await request.json();
  const updated = updateMedia({ introVideoUrl: introVideoUrl || "" });
  return NextResponse.json({ ok: true, media: updated });
}