import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getNews, saveNews } from "@/lib/content";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, news: getNews() });
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

  if (!Array.isArray(body?.news)) {
    return NextResponse.json({ ok: false, error: "فهرست خبرها معتبر نیست" }, { status: 400 });
  }

  const slugs = new Set();
  for (const item of body.news) {
    if (
      !item ||
      typeof item.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
      !item.title ||
      (typeof item.title !== "string" &&
        (typeof item.title !== "object" ||
          !Object.values(item.title).some((title) => typeof title === "string" && title.trim())))
    ) {
      return NextResponse.json({ ok: false, error: "عنوان و شناسهٔ هر خبر را بررسی کنید" }, { status: 400 });
    }
    if (slugs.has(item.slug)) {
      return NextResponse.json({ ok: false, error: "شناسهٔ خبر تکراری است" }, { status: 400 });
    }
    slugs.add(item.slug);
  }

  const normalized = body.news.map((item) => ({
    ...item,
    status: item.active === false
      ? (item.status === "pending" ? "pending" : "draft")
      : "published"
  }));
  saveNews(normalized);
  for (const locale of locales) {
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/media`);
  }
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}
