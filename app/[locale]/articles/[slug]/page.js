import { articles, getArticle } from "@/lib/articles";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

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

  const labels = {
    fa: { source: "مشاهدهٔ مقاله در سایت اصلی", pdf: "دریافت فایل PDF" },
    en: { source: "Read the original article", pdf: "Download the PDF" },
    ar: { source: "قراءة المقال الأصلي", pdf: "تنزيل ملف PDF" },
    ru: { source: "Открыть оригинальную статью", pdf: "Скачать PDF" }
  }[locale] || { source: "Read the original article", pdf: "Download the PDF" };

  return (
    <article className="container-x py-16 max-w-3xl">
      <span className="chip">{pick(a.category, locale)}</span>
      <h1 className="text-3xl md:text-5xl font-black mt-5 heading-grad leading-tight">
        {pick(a.title, locale)}
      </h1>
      <div className="flex gap-5 text-xs text-silver-500 mt-6">
        <span>{pick(a.date, locale)}</span>
        <span>
          {a.readMinutes
            ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
            : a.readTime}
        </span>
      </div>

      <div className="mt-10 text-silver-200 leading-9 text-lg">
        <p>{pick(a.excerpt, locale)}</p>
        {a.sourceUrl || a.pdfUrl ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {a.sourceUrl && (
              <a
                href={a.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-glass inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold hover:border-gold-500/50 transition"
                style={{ color: "var(--text)" }}
              >
                {labels.source}
              </a>
            )}
            {a.pdfUrl && (
              <a
                href={a.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-glass inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold hover:border-gold-500/50 transition"
                style={{ color: "var(--gold)" }}
              >
                {labels.pdf}
              </a>
            )}
          </div>
        ) : (
          <p className="text-silver-400 mt-6">
            {locale === "fa"
              ? "متن کامل این مقاله در این نسخه از سایت موجود نیست."
              : "The full text of this article is not available in this version of the site."}
          </p>
        )}
      </div>
    </article>
  );
}
