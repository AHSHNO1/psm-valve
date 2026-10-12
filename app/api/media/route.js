import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMedia, addMediaItem, removeMediaItem, updateMedia } from "@/lib/media";

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

  const newItem = addMediaItem(type, item);
  return NextResponse.json({ ok: true, item: newItem });
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