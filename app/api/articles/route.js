import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getArticles, saveArticles } from "@/lib/articles";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, articles: getArticles() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست" }, { status: 400 });
  }

  const { articles } = body || {};
  if (!Array.isArray(articles)) {
    return NextResponse.json({ ok: false, error: "فهرست مقاله‌ها معتبر نیست" }, { status: 400 });
  }

  const slugs = new Set();
  for (const article of articles) {
    if (
      !article ||
      typeof article.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) ||
      !article.title ||
      (typeof article.title !== "string" &&
        (typeof article.title !== "object" ||
          !Object.values(article.title).some((title) => typeof title === "string" && title.trim())))
    ) {
      return NextResponse.json({ ok: false, error: "عنوان و شناسهٔ هر مقاله را بررسی کنید" }, { status: 400 });
    }
    if (slugs.has(article.slug)) {
      return NextResponse.json({ ok: false, error: "شناسهٔ مقاله تکراری است" }, { status: 400 });
    }
    slugs.add(article.slug);
    if (
      article.pdfUrl &&
      (typeof article.pdfUrl !== "string" ||
        !article.pdfUrl.startsWith("/") ||
        article.pdfUrl.startsWith("//") ||
        article.pdfUrl.includes(".."))
    ) {
      return NextResponse.json({ ok: false, error: "فایل مقاله باید از همین سایت باشد" }, { status: 400 });
    }
  }

  const previousArticles = getArticles();
  const normalizedArticles = articles.map((article) => ({
    ...article,
    status: article.active === false
      ? (article.status === "pending" ? "pending" : "draft")
      : "published"
  }));
  saveArticles(normalizedArticles);
  const routeSlugs = new Set([
    ...previousArticles.map((article) => article.slug),
    ...normalizedArticles.map((article) => article.slug)
  ]);
  for (const locale of locales) {
    revalidatePath(`/${locale}/articles`);
    revalidatePath(`/${locale}/media`);
    for (const slug of routeSlugs) revalidatePath(`/${locale}/articles/${slug}`);
  }
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}
