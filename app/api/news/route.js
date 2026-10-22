import { getNews, saveNews } from "@/lib/content";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCALES = ["fa", "en", "ar", "ru"];
const MAX_GALLERY = 24;
const MAX_ITEMS = 500;

function hasTitle(title) {
  if (typeof title === "string") return title.trim().length > 0;
  if (title && typeof title === "object" && !Array.isArray(title)) {
    return Object.values(title).some((v) => typeof v === "string" && v.trim().length > 0);
  }
  return false;
}

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeLocalized(value, max) {
  const out = {};
  for (const locale of LOCALES) {
    out[locale] = cleanText(
      typeof value === "string" ? value : value && typeof value === "object" ? value[locale] : "",
      max
    );
  }
  return out;
}

function safeImage(value) {
  const url = cleanText(value, 600);
  if (!url) return "";
  if (!/^(?:\/[^/\s"'<>][^\s"'<>]*|https?:\/\/[^\s"'<>]+)$/i.test(url)) return null;
  return url;
}

function normalizeGallery(value) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_GALLERY) return null;
  const images = [];
  for (const entry of value) {
    const url = safeImage(entry);
    if (url === null) return null;
    if (url && !images.includes(url)) images.push(url);
  }
  return images;
}

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ news: getNews() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  if (!Array.isArray(body?.news)) {
    return err("فهرست خبرها معتبر نیست", 400);
  }
  if (body.news.length > MAX_ITEMS) {
    return err("تعداد خبرها از حد مجاز (۵۰۰) بیشتر است", 400);
  }

  const slugs = new Set();
  const normalized = [];

  for (const item of body.news) {
    if (!item || typeof item.slug !== "string" || !SLUG_RE.test(item.slug) || !hasTitle(item.title)) {
      return err("عنوان و شناسهٔ هر خبر را بررسی کنید", 400);
    }
    if (slugs.has(item.slug)) {
      return err("شناسهٔ خبر تکراری است", 400);
    }
    slugs.add(item.slug);

    const image = safeImage(item.image || "");
    if (image === null) {
      return err(`آدرس تصویر کاور خبر «${item.slug}» معتبر نیست`, 400);
    }
    const gallery = normalizeGallery(item.gallery);
    if (gallery === null) {
      return err(`گالری خبر «${item.slug}» باید حداکثر ${MAX_GALLERY} تصویر با آدرس معتبر باشد`, 400);
    }

    normalized.push({
      ...item,
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 100) : `news-${item.slug}`,
      slug: item.slug,
      title: normalizeLocalized(item.title, 300),
      excerpt: normalizeLocalized(item.excerpt, 1500),
      content: normalizeLocalized(item.content, 20000),
      category: normalizeLocalized(item.category, 200),
      image,
      gallery,
      date: cleanText(item.date, 60),
      active: item.active !== false,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : 99,
      status: item.active === false
        ? (item.status === "pending" ? "pending" : "draft")
        : "published"
    });
  }

  saveNews(normalized);
  revalidatePublic(["news", "media", ...normalized.map((item) => `news/${item.slug}`)]);
  return json();
}
