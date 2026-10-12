import { articles, getArticle } from "@/lib/articles";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";

export async function generateStaticParams() {
  const { locales } = await import("@/lib/i18n");
  return locales.flatMap((locale) =>
    articles.map((a) => ({ locale, slug: a.slug }))
  );
}

export default async function ArticlePage({ params }) {
  const { locale, slug } = params;
  const a = getArticle(slug);
  const dict = await getDictionary(locale);
  if (!a) notFound();

  return (
    <article className="container-x py-16 max-w-3xl">
      <span className="chip">{a.category}</span>
      <h1 className="text-3xl md:text-5xl font-black mt-5 heading-grad leading-tight">
        {a.title}
      </h1>
      <div className="flex gap-5 text-xs text-silver-500 mt-6">
        <span>{a.date}</span>
        <span>{a.readTime} {dict.articles.readTime}</span>
      </div>

      <div className="mt-10 text-silver-200 leading-9 text-lg">
        <p>{a.excerpt}</p>
        <p className="text-silver-400 mt-6">
          محتوای کامل این مقاله به‌زودی منتشر خواهد شد.
        </p>
      </div>
    </article>
  );
}
