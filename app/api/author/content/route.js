import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getArticles, saveArticles } from "@/lib/articles";
import { getNews, saveNews } from "@/lib/content";
import { locales } from "@/lib/i18n";
import { guard, readJson, json, err, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TITLE_LIMIT = 180;
const EXCERPT_LIMIT = 2000;
const BODY_LIMIT = 100000;

function validLocalized(value, maxLength, required) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.values(value);
  if (!entries.every((text) => typeof text === "string" && text.length <= maxLength)) return false;
  return !required || entries.some((text) => text.trim().length > 0);
}

function revalidateContent() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/articles`);
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/media`);
  }
  revalidatePath("/sitemap.xml");
}

export async function GET(request) {
  const session = await guard(request, { role: "author" });
  if (isResponse(session)) return session;
  const authorId = session.sub;
  return json({
    articles: getArticles().filter((item) => item.authorId === authorId),
    news: getNews().filter((item) => item.authorId === authorId)
  });
}

export async function POST(request) {
  const session = await guard(request, { role: "author" });
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  const type = body?.type;
  const item = body?.item;
  const isArticle = type === "article";
  if ((!isArticle && type !== "news") || !item || typeof item !== "object") {
    return err("نوع محتوا معتبر نیست", 400);
  }
  if (
    typeof item.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
    !validLocalized(item.title, TITLE_LIMIT, true) ||
    !validLocalized(item.excerpt, EXCERPT_LIMIT, true) ||
    (item.category !== undefined && !validLocalized(item.category, 100, false))
  ) {
    return err("عنوان، خلاصه یا نامک معتبر نیست", 400);
  }
  const longText = isArticle ? item.body : item.content;
  if (!validLocalized(longText, BODY_LIMIT, false)) {
    return err("متن محتوا معتبر یا بیش از حد طولانی است", 400);
  }

  const list = isArticle ? getArticles() : getNews();
  const existing = item.id ? list.find((entry) =>
    entry.id === item.id &&
    entry.authorId === session.sub &&
    entry.status === "pending"
  ) : null;
  if (item.id && !existing) {
    return err("پیش‌نویس یافت نشد یا دیگر قابل ویرایش نیست", 404);
  }
  if (list.some((entry) => entry.slug === item.slug && entry.id !== existing?.id)) {
    return err("این نامک قبلاً استفاده شده است", 409);
  }

  const timestamp = new Date().toISOString();
  const saved = {
    ...(existing || {}),
    id: existing?.id || `author-${randomUUID()}`,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    category: item.category || {},
    date: existing?.date || new Date().toLocaleDateString("fa-IR"),
    ...(isArticle ? { body: longText, readMinutes: 1 } : { content: longText, image: "" }),
    active: false,
    status: "pending",
    authorId: session.sub,
    authorName: session.name || session.username,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  };
  const next = existing
    ? list.map((entry) => entry.id === existing.id ? saved : entry)
    : [saved, ...list];

  if (isArticle) saveArticles(next);
  else saveNews(next);
  revalidateContent();
  return json({ item: saved }, { status: existing ? 200 : 201 });
}
