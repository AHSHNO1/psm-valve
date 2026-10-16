import { getDictionary } from "@/lib/getDictionary";
import { getNews } from "@/lib/news";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const news = getNews();

  const t = {
    fa: { badge: "اخبار شرکت", title1: "آخرین", title2: "اخبار و رویدادها", empty: "به‌زودی اخبار منتشر می‌شود", readMore: "ادامه مطلب" },
    en: { badge: "Company News", title1: "Latest", title2: "News & Events", empty: "News coming soon", readMore: "Read More" },
    ar: { badge: "أخبار الشركة", title1: "آخر", title2: "الأخبار والأحداث", empty: "الأخبار قريباً", readMore: "اقرأ المزيد" },
    ru: { badge: "Новости", title1: "Последние", title2: "новости", empty: "Новости скоро", readMore: "Читать далее" }
  }[locale] || { badge: "News", title1: "Latest", title2: "News", empty: "Coming soon", readMore: "Read More" };

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{t.badge}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-12">
        <span className="heading-grad">{t.title1}</span>{" "}
        <span className="heading-gold">{t.title2}</span>
      </h1>

      {news.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{t.empty}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((n) => (
            <div key={n.slug} className="card-glass p-6 flex flex-col">
              <div className="text-xs font-bold mb-3" style={{ color: "var(--gold)" }}>
                {n.category[locale] || n.category.fa}
              </div>
              <h3 className="font-bold text-base leading-7 mb-3" style={{ color: "var(--text)" }}>
                {n.title[locale] || n.title.fa}
              </h3>
              <p className="text-sm leading-6 flex-1" style={{ color: "var(--text-soft)" }}>
                {n.excerpt[locale] || n.excerpt.fa}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {n.date}
                </span>
                <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                  {t.readMore} <ArrowLeft size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
