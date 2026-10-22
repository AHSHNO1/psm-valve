import {
  getAparatChannelVideos,
  getMedia,
  getMediaItem,
  addMediaItem,
  mergeAparatVideos,
  removeMediaItem,
  updateMedia,
  updateMediaItem,
  findMediaReferences,
  deleteMediaFile,
  reorderMediaItems
} from "@/lib/media";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["videos", "catalogs", "gallery"];

function isValidMediaItem(type, item) {
  if (typeof item.url !== "string" || !item.url.trim() || item.url.length > 2048) return false;
  if (item.alt !== undefined && (typeof item.alt !== "string" || item.alt.length > 300)) return false;
  if (type === "catalogs") {
    return /^\/uploads\/catalogs\/[a-zA-Z0-9._-]+\.pdf$/i.test(item.url) &&
      (item.cover === undefined ||
        (typeof item.cover === "string" && /^\/uploads\/images\/[a-zA-Z0-9._-]+$/i.test(item.cover)));
  }
  if (type === "gallery") return /^\/uploads\/images\/[a-zA-Z0-9._-]+$/i.test(item.url);
  if (type === "videos") {
    return /^\/uploads\/videos\/[a-zA-Z0-9._-]+$/i.test(item.url) ||
      /^https:\/\/[^\s]+$/i.test(item.url);
  }
  return false;
}

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  const media = getMedia();
  media.catalogs = (media.catalogs || []).filter((catalog) =>
    typeof catalog.url === "string" && catalog.url.startsWith("/uploads/catalogs/")
  );
  try {
    media.videos = mergeAparatVideos(await getAparatChannelVideos(), media.videos || [], true);
  } catch (error) {
    console.error("Unable to refresh Aparat videos in media API:", error);
  }
  return json({ media });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  const { type, item } = body || {};

  if (!VALID_TYPES.includes(type) || !item || typeof item !== "object" || Array.isArray(item)) {
    return err("نوع نامعتبر", 400);
  }
  if (!isValidMediaItem(type, item) || typeof item.title !== "string" || !item.title.trim()) {
    return err("عنوان یا فایل مدیا معتبر نیست", 400);
  }

  const newItem = addMediaItem(type, item);
  revalidatePublic(["", "media", "products"]);
  return json({ item: newItem });
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  const { type, id, item } = body || {};
  if (!VALID_TYPES.includes(type) || typeof id !== "string" || !id || !item || typeof item !== "object" || Array.isArray(item)) {
    return err("اطلاعات ویرایش نامعتبر است", 400);
  }
  if (!isValidMediaItem(type, item) || typeof item.title !== "string" || !item.title.trim()) {
    return err("عنوان یا فایل مدیا معتبر نیست", 400);
  }

  const updatedItem = updateMediaItem(type, id, item);
  if (!updatedItem) {
    return err("آیتم پیدا نشد", 404);
  }
  revalidatePublic(["", "media", "products"]);
  return json({ item: updatedItem });
}

export async function DELETE(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const force = searchParams.get("force") === "1";

  if (!VALID_TYPES.includes(type) || typeof id !== "string" || !id) {
    return err("شناسه یا نوع نامعتبر است", 400);
  }

  const item = getMediaItem(type, id);
  if (!item) return err("آیتم مدیا پیدا نشد", 404);

  // اگر فایل در بخش‌های دیگر استفاده شده باشد، بدون force حذف نمی‌شود (۴۰۹).
  const references = findMediaReferences(item.url);
  if (references.length && !force) {
    return err("این فایل در بخش‌های دیگری از سایت استفاده شده است.", 409, {
      references,
      url: item.url
    });
  }

  const removed = removeMediaItem(type, id);
  if (!removed) return err("آیتم مدیا پیدا نشد", 404);

  const fileDeleted = deleteMediaFile(item.url);
  revalidatePublic(["", "media", "products"]);
  return json({ removed, fileDeleted, references });
}

export async function PATCH(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  if (body && Array.isArray(body.order)) {
    if (!VALID_TYPES.includes(body.type) || body.type === "videos") {
      return err("نوع مرتب‌سازی نامعتبر است", 400);
    }
    if (!body.order.every((id) => typeof id === "string" && id)) {
      return err("فهرست ترتیب نامعتبر است", 400);
    }
    const ordered = reorderMediaItems(body.type, body.order);
    if (!ordered) {
      return err("ترتیب ارسال‌شده با فهرست فعلی هم‌خوان نیست", 409);
    }
    revalidatePublic(["", "media", "products"]);
    return json({ items: ordered });
  }
  if (body && typeof body === "object" && "introVideoUrl" in body &&
      typeof body.introVideoUrl !== "string") {
    return err("آدرس ویدئوی معرفی معتبر نیست", 400);
  }
  const updated = updateMedia({ introVideoUrl: body?.introVideoUrl || "" });
  revalidatePublic(["", "media"]);
  return json({ media: updated });
}
