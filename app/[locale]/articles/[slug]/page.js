import { getArticle } from "@/lib/articles";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata, localeUrl, breadcrumbSchema, jsonLdScript } from "@/lib/seo";
import { localizedDateIso } from "@/lib/jalali";
import { COMPANY } from "@/lib/company-info";

export const dynamic = "force-dynamic";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export async function generateMetadata({ params }) {
  const { locale, slug } = params;
  const a = getArticle(slug);
  if (!a || a.active === false) return { robots: { index: false, follow: false } };

  const title = pick(a.title, locale) || slug;
  const excerpt = pick(a.excerpt, locale);
  const iso = localizedDateIso(a.date);

  return buildMetadata({
    locale,
    path: `/articles/${slug}`,
    title,
    description: excerpt ? excerpt.slice(0, 160) : title,
    type: "article",
    keywords: [title, pick(a.category, locale), "PSM Valve", "industrial valve"].filter(Boolean),
    publishedTime: iso || undefined,
    modifiedTime: iso || undefined
  });
}

export default async function ArticlePage({ params }) {
  const { locale, slug } = params;
  const a = getArticle(slug);
  const dict = await getDictionary(locale);
  if (!a || a.active === false) notFound();

  const title = pick(a.title, locale);
  const excerpt = pick(a.excerpt, locale);
  const iso = localizedDateIso(a.date);
  const url = localeUrl(locale, `/articles/${slug}`);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title.slice(0, 110),
    description: excerpt || title,
    datePublished: iso || undefined,
    dateModified: iso || undefined,
    inLanguage: locale,
    articleSection: pick(a.category, locale) || undefined,
    author: { "@type": "Organization", name: COMPANY.brandEn, url: "https://www.psmvalve.com" },
    publisher: {
      "@type": "Organization",
      name: COMPANY.brandEn,
      logo: { "@type": "ImageObject", url: "https://www.psmvalve.com/logo/logo-icon.png" }
    }
  };
  const breadcrumb = breadcrumbSchema([
    { name: dict.nav?.home || "Home", url: localeUrl(locale) },
    { name: dict.nav?.articles || "Articles", url: localeUrl(locale, "/articles") },
    { name: title, url }
  ]);

  const labels = {
    fa: { pdf: "دریافت فایل PDF" },
    en: { pdf: "Download the PDF" },
    ar: { pdf: "تنزيل ملف PDF" },
    ru: { pdf: "Скачать PDF" }
  }[locale] || { pdf: "Download the PDF" };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />
    <article className="container-x py-16 max-w-3xl">

      <span className="chip">{pick(a.category, locale)}</span>
      <h1 className="text-3xl md:text-5xl font-black mt-5 heading-grad leading-tight">
        {pick(a.title, locale)}
      </h1>
      <div className="flex gap-5 text-xs text-[var(--text-muted)] mt-6">
        <span>{pick(a.date, locale)}</span>
        <span>
          {a.readMinutes
            ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
            : a.readTime}
        </span>
      </div>

      <div className="mt-10 text-[var(--text-soft)] leading-9 text-lg">
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
          <p className="text-[var(--text-muted)] mt-6">
            {locale === "fa"
              ? "متن کامل این مقاله در این نسخه از سایت موجود نیست."
              : "The full text of this article is not available in this version of the site."}
          </p>
        )}
      </div>
      {a.pdfUrl && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          <iframe
            src={a.pdfUrl}
            title={pick(a.title, locale)}
            className="h-[75vh] min-h-[520px] w-full"
          />
        </div>
      )}
    </article>
    </>
  );
}
