"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, ArrowLeft, Calendar, Clock } from "lucide-react";
import MediaImage from "./MediaImage";
import { useDictionary } from "./Providers";

function pick(obj, locale, fallback) {
  if (!obj) return fallback || "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.fa || obj.en || fallback || "";
}

function formatDate(dateStr, locale) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options = { year: "numeric", month: "long", day: "numeric" };
    return d.toLocaleDateString(
      locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-SA" : locale === "ru" ? "ru-RU" : "en-GB",
      options
    );
  } catch (e) {
    return dateStr;
  }
}

export default function LatestNews({ news, locale }) {
  const { t } = useDictionary();
  const isFa = locale === "fa";

  const items = (news || [])
    .filter(function (n) { return n.active !== false; })
    .sort(function (a, b) {
      const da = new Date(a.date || a.createdAt || 0);
      const db = new Date(b.date || b.createdAt || 0);
      return db - da;
    })
    .slice(0, 3);

  if (items.length === 0) return null;

  const L = {
    fa: {
      badge: "آخرین اخبار",
      title1: "اخبار",
      title2: "و رویدادها",
      sub: "جدیدترین رویدادها و دستاوردهای پتروسازه میهن",
      all: "همه اخبار",
      readMore: "خواندن"
    },
    en: {
      badge: "Latest Updates",
      title1: "News",
      title2: "& Events",
      sub: "Recent events and achievements of Petro Sazeh Mihan",
      all: "All News",
      readMore: "Read"
    },
    ar: {
      badge: "آخر الأخبار",
      title1: "الأخبار",
      title2: "والأحداث",
      sub: "أحدث الأحداث والإنجازات",
      all: "جميع الأخبار",
      readMore: "قراءة"
    },
    ru: {
      badge: "Последние новости",
      title1: "Новости",
      title2: "и события",
      sub: "Последние события и достижения",
      all: "Все новости",
      readMore: "Читать"
    }
  }[locale] || {};

  return (
    <section className="lnews-section">
      <div className="container-x">
        {/* Header */}
        <div className="lnews-header">
          <div>
            <span className="chip">
              <Newspaper size={12} />
              {L.badge}
            </span>
            <h2 className="section-title lnews-title">
              <span className="heading-grad">{L.title1}</span>{" "}
              <span className="heading-gold">{L.title2}</span>
            </h2>
            <p className="lnews-sub">{L.sub}</p>
          </div>
          <Link href={"/" + locale + "/news"} className="btn-outline text-sm lnews-all">
            {L.all} <ArrowLeft size={15} />
          </Link>
        </div>

        {/* Grid */}
        <div className="lnews-grid">
          {items.map(function (n, i) {
            const slug = n.slug || n.id;
            const href = "/" + locale + "/news/" + slug;
            const title = pick(n.title, locale, "");
            const excerpt = pick(n.excerpt || n.short || n.desc, locale, "");
            const date = formatDate(n.date || n.createdAt, locale);

            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={href} className="lnews-card">
                  {/* Image */}
                  <div className="lnews-image">
                    {n.image ? (
                      <MediaImage src={n.image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="lnews-image-placeholder">
                        <Newspaper size={32} />
                      </div>
                    )}
                    {date && (
                      <div className="lnews-date">
                        <Calendar size={10} />
                        {date}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="lnews-body">
                    <h3 className="lnews-card-title">{title}</h3>
                    {excerpt && (
                      <p className="lnews-excerpt">{excerpt}</p>
                    )}
                    <div className="lnews-footer">
                      <span className="lnews-readmore">
                        {L.readMore} <ArrowLeft size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .lnews-section {
          padding: 60px 0;
        }
        @media (min-width: 768px) {
          .lnews-section {
            padding: 80px 0;
          }
        }

        .lnews-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 32px;
        }
        .lnews-title {
          margin-top: 12px;
          margin-bottom: 8px;
        }
        .lnews-sub {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .lnews-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .lnews-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }

        .lnews-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          box-shadow: var(--shadow-sm);
        }
        .lnews-card:hover {
          transform: translateY(-4px);
          border-color: var(--gold);
          box-shadow: 0 14px 32px rgba(20, 22, 27, 0.10);
        }
        .dark .lnews-card:hover {
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.5);
        }

        .lnews-image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-soft), var(--bg-card));
        }
        .lnews-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lnews-card:hover .lnews-image img {
          transform: scale(1.06);
        }

        .lnews-image-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: var(--text-muted);
          opacity: 0.4;
        }

        .lnews-date {
          position: absolute;
          bottom: 10px;
          inset-inline-start: 10px;
          padding: 5px 10px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          color: #FFFFFF;
          font-size: 10.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
          direction: ltr;
        }
        .dark .lnews-date {
          background: rgba(0, 0, 0, 0.85);
        }

        .lnews-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .lnews-card-title {
          font-size: 15px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.4;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lnews-excerpt {
          font-size: 12px;
          line-height: 1.75;
          color: var(--text-soft);
          font-weight: 600;
          margin-bottom: 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .lnews-footer {
          padding-top: 12px;
          border-top: 1px dashed var(--border);
          margin-top: auto;
        }
        .lnews-readmore {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
        }

        @media (max-width: 640px) {
          .lnews-all {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}