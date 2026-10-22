import { getNews } from "@/lib/news";
import { newsGallery, contentParagraphs, formatNewsDate, newsIsoDate, pickNewsText } from "@/lib/news-utils";
import { buildMetadata, localeUrl, SITE_BASE } from "@/lib/seo";
import { COMPANY } from "@/lib/company-info";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronLeft, Images, Newspaper } from "lucide-react";
import NewsGallery from "@/components/NewsGallery";
import MediaImage from "@/components/MediaImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COPY = {
  fa: {
    home: "خانه",
    news: "اخبار",
    related: "اخبار مرتبط",
    readMore: "ادامه مطلب",
    published: "تاریخ انتشار",
    emptyBody: "متن کامل این خبر در این زبان منتشر نشده است.",
    ctaTitle: "نیاز به مشاوره فنی دارید؟",
    ctaText: "کارشناسان پتروسازه میهن برای انتخاب، سایزینگ و سفارشی‌سازی شیرهای کنترلی آمادهٔ پاسخ‌گویی هستند.",
    cta: "تماس با ما",
    breadcrumb: "مسیر صفحه",
    photo: "تصویر خبر"
  },
  en: {
    home: "Home",
    news: "News",
    related: "Related news",
    readMore: "Read more",
    published: "Published",
    emptyBody: "The full text of this news is not available in this language yet.",
    ctaTitle: "Need technical advice?",
    ctaText: "PSM Valve engineers are ready to help with selection, sizing and customization of control valves.",
    cta: "Contact us",
    breadcrumb: "Breadcrumb",
    photo: "News image"
  },
  ar: {
    home: "الرئيسية",
    news: "الأخبار",
    related: "أخبار ذات صلة",
    readMore: "اقرأ المزيد",
    published: "تاريخ النشر",
    emptyBody: "النص الكامل لهذا الخبر غير متوفر بهذه اللغة بعد.",
    ctaTitle: "هل تحتاج إلى استشارة فنية؟",
    ctaText: "مهندسو بترو سازه ميهان جاهزون للمساعدة في اختيار الصمامات التحكمية وتحجيمها وتخصيصها.",
    cta: "اتصل بنا",
    breadcrumb: "مسار الصفحة",
    photo: "صورة الخبر"
  },
  ru: {
    home: "Главная",
    news: "Новости",
    related: "Похожие новости",
    readMore: "Читать далее",
    published: "Опубликовано",
    emptyBody: "Полный текст этой новости пока недоступен на этом языке.",
    ctaTitle: "Нужна техническая консультация?",
    ctaText: "Инженеры PSM Valve помогут с подбором, расчетом и изготовлением регулирующих клапанов.",
    cta: "Связаться с нами",
    breadcrumb: "Навигационная цепочка",
    photo: "Изображение новости"
  }
};

function absoluteImage(value) {
  if (!value) return SITE_BASE + "/og/og-default.jpg";
  return /^https?:\/\//i.test(value) ? value : SITE_BASE + (value.startsWith("/") ? value : "/" + value);
}

export async function generateMetadata({ params }) {
  const { locale, slug } = params;
  const item = getNews().find((entry) => entry.slug === slug);
  if (!item) return { robots: { index: false, follow: false } };

  const title = pickNewsText(item.title, locale, slug);
  const excerpt = pickNewsText(item.excerpt, locale);
  const images = newsGallery(item);
  const iso = newsIsoDate(item.date);

  return buildMetadata({
    locale,
    path: `/news/${slug}`,
    title,
    description: excerpt ? excerpt.slice(0, 160) : title,
    type: "article",
    keywords: [title, pickNewsText(item.category, locale), "PSM Valve", "اخبار پتروسازه میهن"].filter(Boolean),
    image: images[0],
    imageAlt: title,
    publishedTime: iso || undefined,
    modifiedTime: iso || undefined
  });
}

export default async function NewsDetailPage({ params }) {
  const { locale, slug } = params;
  const items = getNews();
  const item = items.find((entry) => entry.slug === slug);
  if (!item) notFound();

  const t = COPY[locale] || COPY.en;
  const title = pickNewsText(item.title, locale, slug);
  const excerpt = pickNewsText(item.excerpt, locale);
  const category = pickNewsText(item.category, locale);
  const paragraphs = contentParagraphs(pickNewsText(item.content, locale));
  const images = newsGallery(item);
  const iso = newsIsoDate(item.date);
  const url = localeUrl(locale, `/news/${slug}`);
  const related = items
    .filter((entry) => entry.slug !== slug)
    .slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title.slice(0, 110),
    description: excerpt || title,
    image: images.length ? images.map(absoluteImage) : [absoluteImage()],
    datePublished: iso || undefined,
    dateModified: iso || undefined,
    inLanguage: locale,
    articleSection: category || undefined,
    author: { "@type": "Organization", name: COMPANY.name[locale] || COMPANY.brandEn, url: SITE_BASE },
    publisher: {
      "@type": "Organization",
      name: COMPANY.brandEn,
      logo: { "@type": "ImageObject", url: SITE_BASE + "/logo/logo-icon.png" }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: t.news, item: localeUrl(locale, "/news") },
      { "@type": "ListItem", position: 3, name: title, item: url }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />

      <article className="container-x py-10 sm:py-14">
        <nav aria-label={t.breadcrumb} className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          <Link href={`/${locale}`} className="hover:underline">{t.home}</Link>
          <ChevronLeft size={12} className={locale === "fa" || locale === "ar" ? "" : "rotate-180"} aria-hidden="true" />
          <Link href={`/${locale}/news`} className="hover:underline">{t.news}</Link>
          <ChevronLeft size={12} className={locale === "fa" || locale === "ar" ? "" : "rotate-180"} aria-hidden="true" />
          <span aria-current="page" style={{ color: "var(--text-soft)" }}>{title}</span>
        </nav>

        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            {category && <span className="chip">{category}</span>}
            <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} /> {iso ? `${t.published}: ${formatNewsDate(item.date, locale)}` : formatNewsDate(item.date, locale)}
            </span>
            {images.length > 1 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                <Images size={13} /> {images.length}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl heading-grad">{title}</h1>

          {excerpt && (
            <p className="mt-5 text-base leading-8 sm:text-lg" style={{ color: "var(--text-soft)" }}>
              {excerpt}
            </p>
          )}

          {images.length > 0 ? (
            <NewsGallery images={images} title={title} locale={locale} />
          ) : (
            <div className="my-8 grid aspect-[16/7] place-items-center rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
              <Newspaper size={44} aria-label={t.photo} />
            </div>
          )}

          <div className="mx-auto mt-8 max-w-3xl">
            {paragraphs.length > 0 ? (
              <div className="space-y-5 text-base leading-9" style={{ color: "var(--text-soft)" }}>
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                {t.emptyBody}
              </p>
            )}

            <Link href={`/${locale}/news`} className="mt-8 inline-flex items-center gap-2 text-sm font-bold hover:underline" style={{ color: "var(--gold)" }}>
              <ArrowLeft size={15} className={locale === "fa" || locale === "ar" ? "" : "rotate-180"} />
              {t.news}
            </Link>

            <div className="card-glass mt-10 p-6 sm:p-8">
              <h2 className="text-lg font-black" style={{ color: "var(--text)" }}>{t.ctaTitle}</h2>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-soft)" }}>{t.ctaText}</p>
              <Link href={`/${locale}/contact`} className="btn-gold mt-5 inline-flex items-center gap-2 text-sm">
                {t.cta}
                <ArrowLeft size={14} className={locale === "fa" || locale === "ar" ? "" : "rotate-180"} />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container-x pb-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-5 text-xl font-black" style={{ color: "var(--text)" }}>{t.related}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => {
                const relatedImages = newsGallery(entry);
                const relatedTitle = pickNewsText(entry.title, locale, entry.slug);
                return (
                  <Link
                    key={entry.slug}
                    href={`/${locale}/news/${entry.slug}`}
                    className="card-glass group flex flex-col overflow-hidden transition hover:border-[var(--gold)]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                      {relatedImages.length > 0 ? (
                        <MediaImage
                          src={relatedImages[0]}
                          alt={relatedTitle}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center" style={{ color: "var(--text-muted)" }}>
                          <Newspaper size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-sm font-bold leading-7" style={{ color: "var(--text)" }}>{relatedTitle}</h3>
                      <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatNewsDate(entry.date, locale)}
                        </span>
                        <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                          {t.readMore}
                          <ArrowLeft size={12} className={locale === "fa" || locale === "ar" ? "" : "rotate-180"} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
