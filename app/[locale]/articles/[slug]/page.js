import { getArticle } from "@/lib/articles";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";

export const dynamic = "force-dynamic";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export default async function ArticlePage({ params }) {
  const { locale, slug } = params;
  const a = getArticle(slug);
  const dict = await getDictionary(locale);
  if (!a || a.active === false) notFound();

  const labels = {
    fa: { pdf: "دریافت فایل PDF" },
    en: { pdf: "Download the PDF" },
    ar: { pdf: "تنزيل ملف PDF" },
    ru: { pdf: "Скачать PDF" }
  }[locale] || { pdf: "Download the PDF" };

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
        {pick(a.body, locale) && (
          <div className="mt-8 whitespace-pre-line text-base leading-8">
            {pick(a.body, locale)}
          </div>
        )}
        {a.pdfUrl ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={a.pdfUrl} download className="btn-secondary">
              {labels.pdf}
            </a>
          </div>
        ) : !pick(a.body, locale) && (
          <p className="text-silver-400 mt-6">
            {locale === "fa"
              ? "متن کامل این مقاله در این نسخه از سایت موجود نیست."
              : "The full text of this article is not available in this version of the site."}
          </p>
        )}
      </div>
      {a.pdfUrl && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white">
          <iframe
            src={a.pdfUrl}
            title={pick(a.title, locale)}
            className="h-[75vh] min-h-[520px] w-full"
          />
        </div>
      )}
    </article>
  );
}
