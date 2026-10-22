import { revalidatePath } from "next/cache";
import { getArticles, saveArticles } from "@/lib/articles";
import { locales } from "@/lib/i18n";
import { guard, readJson, json, err, isResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ articles: getArticles() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const { articles } = body || {};
  if (!Array.isArray(articles)) {
    return err("فهرست مقاله‌ها معتبر نیست", 400);
  }
  if (articles.length > 500) {
    return err("تعداد مقاله‌ها از حد مجاز (۵۰۰) بیشتر است", 400);
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
      return err("عنوان و شناسهٔ هر مقاله را بررسی کنید", 400);
    }
    if (slugs.has(article.slug)) {
      return err("شناسهٔ مقاله تکراری است", 400);
    }
    slugs.add(article.slug);
    if (
      article.pdfUrl &&
      (typeof article.pdfUrl !== "string" ||
        !article.pdfUrl.startsWith("/") ||
        article.pdfUrl.startsWith("//") ||
        article.pdfUrl.includes(".."))
    ) {
      return err("فایل مقاله باید از همین سایت باشد", 400);
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
  return json();
}
