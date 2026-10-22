import { getNews } from "@/lib/news";
import { newsGallery, formatNewsDate } from "@/lib/news-utils";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowLeft, Calendar, Images, Newspaper } from "lucide-react";
import MediaImage from "@/components/MediaImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COPY = {
  fa: {
    badge: "اخبار شرکت",
    title1: "آخرین",
    title2: "اخبار و رویدادها",
    sub: "رویدادها، دستاوردها و اطلاعیه‌های پتروسازه میهن",
    empty: "به‌زودی اخبار منتشر می‌شود",
    readMore: "ادامه مطلب",
    imagesLabel: "تصویر",
    metaTitle: "اخبار و رویدادها",
    metaDesc: "آخرین اخبار، رویدادها و دستاوردهای پتروسازه میهن در طراحی و تولید شیرهای کنترلی صنعتی."
  },
  en: {
    badge: "Company News",
    title1: "Latest",
    title2: "News & Events",
    sub: "Events, achievements and announcements from Petro Sazeh Mihan",
    empty: "News coming soon",
    readMore: "Read More",
    imagesLabel: "images",
    metaTitle: "News & Events",
    metaDesc: "Latest news, events and achievements from Petro Sazeh Mihan in industrial control valve design and manufacturing."
  },
  ar: {
    badge: "أخبار الشركة",
    title1: "آخر",
    title2: "الأخبار والأحداث",
    sub: "الأحداث والإنجازات والإعلانات من بترو سازه ميهان",
    empty: "الأخبار قريباً",
    readMore: "اقرأ المزيد",
    imagesLabel: "صور",
    metaTitle: "الأخبار والأحداث",
    metaDesc: "آخر الأخبار والأحداث والإنجازات من بترو سازه ميهان في تصميم وتصنيع صمامات التحكم الصناعية."
  },
  ru: {
    badge: "Новости",
    title1: "Последние",
    title2: "новости",
    sub: "События, достижения и объявления Petro Sazeh Mihan",
    empty: "Новости скоро",
    readMore: "Читать далее",
    imagesLabel: "фото",
    metaTitle: "Новости и события",
    metaDesc: "Последние новости, события и достижения Petro Sazeh Mihan в проектировании и производстве промышленных регулирующих клапанов."
  }
};

export async function generateMetadata({ params }) {
  const { locale } = params;
  const t = COPY[locale] || COPY.en;
  return buildMetadata({
    locale,
    path: "/news",
    title: t.metaTitle,
    description: t.metaDesc,
    type: "website",
    keywords: ["PSM Valve news", "اخبار پتروسازه میهن", "control valve news"]
  });
}

export default async function NewsPage({ params }) {
  const { locale } = params;
  const news = getNews();
  const t = COPY[locale] || COPY.en;

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip"><Newspaper size={12} /> {t.badge}</span>
      <h1 className="section-title mt-3 mb-2">
        <span className="heading-grad">{t.title1}</span>{" "}
        <span className="heading-gold">{t.title2}</span>
      </h1>
      <p className="mb-8 text-sm sm:mb-12" style={{ color: "var(--text-muted)" }}>{t.sub}</p>

      {news.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{t.empty}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((n) => {
            const images = newsGallery(n);
            const title = n.title?.[locale] || n.title?.fa || n.title?.en || "";
            return (
              <Link key={n.slug} href={`/${locale}/news/${n.slug}`} className="card-glass group flex flex-col overflow-hidden transition hover:border-[var(--gold)]">
                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                  {images.length > 0 ? (
                    <MediaImage src={images[0]} alt={title} fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center" style={{ color: "var(--text-muted)" }}>
                      <Newspaper size={34} />
                    </div>
                  )}
                  {images.length > 1 && (
                    <span className="absolute bottom-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-white"
                      style={{ insetInlineStart: 12, background: "rgba(0,0,0,0.65)" }}>
                      <Images size={11} /> {new Intl.NumberFormat(locale).format(images.length)} {t.imagesLabel}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 text-xs font-bold" style={{ color: "var(--gold)" }}>
                    {n.category?.[locale] || n.category?.fa}
                  </div>
                  <h2 className="mb-3 text-base font-bold leading-7" style={{ color: "var(--text)" }}>
                    {title}
                  </h2>
                  <p className="flex-1 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                    {n.excerpt?.[locale] || n.excerpt?.fa}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatNewsDate(n.date, locale)}
                    </span>
                    <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                      {t.readMore} <ArrowLeft size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
