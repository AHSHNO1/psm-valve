import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { getArticles, saveArticles } from "@/lib/articles";
import { getNews, saveNews } from "@/lib/content";
import { locales } from "@/lib/i18n";

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
  const session = await getSession(request, { allowAuthor: true });
  if (!session || session.role !== "author") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const authorId = session.sub;
  return NextResponse.json({
    ok: true,
    articles: getArticles().filter((item) => item.authorId === authorId),
    news: getNews().filter((item) => item.authorId === authorId)
  });
}

export async function POST(request) {
  const session = await getSession(request, { allowAuthor: true });
  if (!session || session.role !== "author") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است" }, { status: 400 });
  }
  const type = body?.type;
  const item = body?.item;
  const isArticle = type === "article";
  if ((!isArticle && type !== "news") || !item || typeof item !== "object") {
    return NextResponse.json({ ok: false, error: "نوع محتوا معتبر نیست" }, { status: 400 });
  }
  if (
    typeof item.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
    !validLocalized(item.title, TITLE_LIMIT, true) ||
    !validLocalized(item.excerpt, EXCERPT_LIMIT, true) ||
    (item.category !== undefined && !validLocalized(item.category, 100, false))
  ) {
    return NextResponse.json({ ok: false, error: "عنوان، خلاصه یا نامک معتبر نیست" }, { status: 400 });
  }
  const longText = isArticle ? item.body : item.content;
  if (!validLocalized(longText, BODY_LIMIT, false)) {
    return NextResponse.json({ ok: false, error: "متن محتوا معتبر یا بیش از حد طولانی است" }, { status: 400 });
  }

  const list = isArticle ? getArticles() : getNews();
  const existing = item.id ? list.find((entry) =>
    entry.id === item.id &&
    entry.authorId === session.sub &&
    entry.status === "pending"
  ) : null;
  if (item.id && !existing) {
    return NextResponse.json({ ok: false, error: "پیش‌نویس یافت نشد یا دیگر قابل ویرایش نیست" }, { status: 404 });
  }
  if (list.some((entry) => entry.slug === item.slug && entry.id !== existing?.id)) {
    return NextResponse.json({ ok: false, error: "این نامک قبلاً استفاده شده است" }, { status: 409 });
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
  return NextResponse.json({ ok: true, item: saved }, { status: existing ? 200 : 201 });
}
