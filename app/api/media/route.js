import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMedia, writeJSON } from "@/lib/media";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, media: getMedia() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json();
  const { type, item } = body;

  const validTypes = ["videos", "catalogs", "gallery"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ ok: false, error: "نوع نامعتبر" }, { status: 400 });
  }

  const media = getMedia();
  const list = media[type] || [];
  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...item
  };
  list.unshift(newItem);
  media[type] = list;
  writeJSON("media.json", media);
  return NextResponse.json({ ok: true, item: newItem });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  const media = getMedia();
  if (media[type]) {
    media[type] = media[type].filter((m) => m.id !== id);
    writeJSON("media.json", media);
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { introVideoUrl } = await request.json();
  const media = getMedia();
  media.introVideoUrl = introVideoUrl || "";
  writeJSON("media.json", media);
  return NextResponse.json({ ok: true });
}
