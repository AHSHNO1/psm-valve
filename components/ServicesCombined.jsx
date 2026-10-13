"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings,
  ArrowLeft, Sparkles, Crosshair, ShieldCheck, Zap
} from "lucide-react";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings };

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const HIGHLIGHTED = ["hvf-coating", "lop-test"];

// Default features per service (اگر ادمین نداده باشد)
const DEFAULT_FEATURES = {
  "hvf-coating": {
    fa: [
      "ضخامت پوشش ۱۵۰-۵۰۰ میکرون",
      "سختی ۱۱۰۰-۱۴۰۰ HV",
      "افزایش عمر تا ۵ برابر",
      "چسبندگی بالا",
      "مقاومت حرارتی تا ۸۰۰°C",
      "محیط‌های خورنده"
    ],
    en: [
      "150-500μm coating thickness",
      "Hardness 1100-1400 HV",
      "Up to 5x longer life",
      "High adhesion",
      "Heat resistance up to 800°C",
      "Corrosive environments"
    ]
  },
  "lop-test": {
    fa: [
      "تست دقیق در محل نصب",
      "تجهیزات کالیبره",
      "گزارش دقیق عملکرد",
      "شناسایی کاویتاسیون",
      "بدون نیاز به دمونتاژ",
      "طبق استاندارد ISO 9001"
    ],
    en: [
      "Precise on-site testing",
      "Calibrated equipment",
      "Detailed performance report",
      "Cavitation detection",
      "No disassembly needed",
      "Per ISO 9001 standard"
    ]
  }
};

function getFeatures(service, locale) {
  // اول از data/services.json بخوان
  if (service.features) {
    if (typeof service.features === "string") return service.features.split("،").map(f => f.trim());
    if (Array.isArray(service.features)) return service.features;
    return service.features[locale] || service.features.en || [];
  }
  // اگر نه، از default استفاده کن
  const def = DEFAULT_FEATURES[service.slug];
  if (!def) return [];
  return def[locale] || def.en || [];
}

export default function ServicesCombined({ services, locale }) {
  const all = (services || []).filter(function (s) { return s.active !== false; });
  const highlighted = all.filter(function (s) { return HIGHLIGHTED.indexOf(s.slug) !== -1; });
  const others = all.filter(function (s) { return HIGHLIGHTED.indexOf(s.slug) === -1; }).slice(0, 4);

  const labels = {
    fa: {
      badge: "خدمات تخصصی",
      title1: "خدمات",
      title2: "ما",
      all: "همه خدمات",
      special: "خدمات ویژه",
      others: "سایر خدمات",
      learnMore: "جزئیات بیشتر",
      imageComing: "تصویر به‌زودی"
    },
    en: {
      badge: "Specialized Services",
      title1: "Our",
      title2: "Services",
      all: "All Services",
      special: "Featured",
      others: "Other Services",
      learnMore: "Learn More",
      imageComing: "Image coming soon"
    },
    ar: {
      badge: "خدماتنا",
      title1: "خدمات",
      title2: "متخصصة",
      all: "جميع الخدمات",
      special: "مميزة",
      others: "خدمات أخرى",
      learnMore: "المزيد",
      imageComing: "صورة قريباً"
    },
    ru: {
      badge: "Наши услуги",
      title1: "Наши",
      title2: "услуги",
      all: "Все услуги",
      special: "Особые",
      others: "Другие услуги",
      learnMore: "Подробнее",
      imageComing: "Скоро"
    }
  }[locale] || {};

  return (
    <section className="svc-section">
      <div className="container-x">
        {/* Header */}
        <div className="svc-header">
          <div>
            <span className="chip">
              <Sparkles size={12} />
              {labels.badge}
            </span>
            <h2 className="section-title svc-title">
              <span className="heading-grad">{labels.title1}</span>{" "}
              <span className="heading-gold">{labels.title2}</span>
            </h2>
          </div>
          <Link href={"/" + locale + "/services"} className="btn-outline text-sm svc-all-btn">
            {labels.all} <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Featured Services */}
        {highlighted.length > 0 && (
          <div className="svc-featured-grid">
            {highlighted.map(function (s, i) {
              return (
                <FeaturedServiceCard
                  key={s.slug}
                  service={s}
                  locale={locale}
                  labels={labels}
                  index={i}
                />
              );
            })}
          </div>
        )}

        {/* Other Services */}
        {others.length > 0 && (
          <div className="svc-others-grid">
            {others.map(function (s, i) {
              const Icon = ICONS[s.icon] || Cog;
              return (
                <motion.div
                  key={s.slug}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={"/" + locale + "/services/" + s.slug} className="svc-other-card">
                    <div className="svc-other-icon">
                      <Icon size={20} />
                    </div>
                    <h4 className="svc-other-title">{pick(s.name, locale)}</h4>
                    <p className="svc-other-desc">{pick(s.short, locale)}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .svc-section {
          padding: 60px 0;
        }
        @media (min-width: 768px) {
          .svc-section {
            padding: 80px 0;
          }
        }

        /* ============ HEADER ============ */
        .svc-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 32px;
        }
        .svc-title {
          margin-top: 12px;
        }
        @media (max-width: 640px) {
          .svc-all-btn {
            display: none;
          }
        }

        /* ============ FEATURED GRID ============ */
        .svc-featured-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (min-width: 1024px) {
          .svc-featured-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }

        /* ============ FEATURED CARD ============ */
        .svc-fcard {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-sm);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .svc-fcard:hover {
          transform: translateY(-6px);
          border-color: var(--svc-color);
          box-shadow: 0 20px 50px rgba(20, 22, 27, 0.12);
        }
        .dark .svc-fcard:hover {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
        }

        /* ---- Image Section ---- */
        .svc-fimage-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--svc-color) 22%, transparent),
            color-mix(in srgb, var(--svc-color2) 15%, transparent)
          );
        }

        .svc-fimage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .svc-fcard:hover .svc-fimage {
          transform: scale(1.08);
        }

        /* Placeholder (وقتی عکس نیست) */
        .svc-fplaceholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--svc-color);
          position: relative;
        }
        .svc-fplaceholder::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.5;
        }
        .svc-fplaceholder-icon {
          width: 88px;
          height: 88px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1.5px solid color-mix(in srgb, var(--svc-color) 50%, transparent);
          color: var(--svc-color);
          position: relative;
          transition: all 0.4s;
          animation: svcFloat 4s ease-in-out infinite;
        }
        .svc-fcard:hover .svc-fplaceholder-icon {
          transform: scale(1.1) rotate(-5deg);
          background: rgba(255, 255, 255, 0.25);
        }
        .svc-fplaceholder-text {
          font-size: 11px;
          font-weight: 800;
          color: var(--svc-color);
          opacity: 0.7;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          position: relative;
        }

        @keyframes svcFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* ---- Shine Effect ---- */
        .svc-fshine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255, 255, 255, 0.35) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .svc-fcard:hover .svc-fshine {
          transform: translateX(100%);
        }

        /* ---- Badge (Featured) ---- */
        .svc-fbadge {
          position: absolute;
          top: 14px;
          inset-inline-end: 14px;
          padding: 6px 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--svc-color), var(--svc-color2));
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 6px 16px color-mix(in srgb, var(--svc-color) 50%, transparent);
          z-index: 2;
          letter-spacing: 0.03em;
        }

        /* ---- Body ---- */
        .svc-fbody {
          padding: 22px 22px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .svc-ftitle {
          font-size: 20px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.35;
          margin-bottom: 10px;
        }

        .svc-fdesc {
          font-size: 13px;
          line-height: 1.85;
          color: var(--text-soft);
          margin-bottom: 18px;
          font-weight: 600;
        }

        /* ---- Features Grid ---- */
        .svc-ffeatures {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px 16px;
          margin-bottom: 22px;
        }
        @media (max-width: 400px) {
          .svc-ffeatures {
            grid-template-columns: 1fr;
          }
        }

        .svc-ffeature {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--text-soft);
          font-weight: 700;
          line-height: 1.5;
          padding: 6px 0;
        }
        .svc-ffeature-icon {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--svc-color) 15%, transparent);
          color: var(--svc-color);
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ---- CTA Button ---- */
        .svc-fcta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--svc-color), var(--svc-color2));
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 900;
          text-decoration: none;
          transition: all 0.25s;
          box-shadow: 0 6px 18px color-mix(in srgb, var(--svc-color) 40%, transparent);
          align-self: flex-start;
        }
        .svc-fcta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px color-mix(in srgb, var(--svc-color) 55%, transparent);
        }

        /* ---- Bottom accent line ---- */
        .svc-fline {
          position: absolute;
          bottom: 0;
          inset-inline-start: 0;
          height: 4px;
          width: 0;
          background: linear-gradient(90deg, var(--svc-color), var(--svc-color2));
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .svc-fcard:hover .svc-fline {
          width: 100%;
        }

        /* ============ OTHER SERVICES ============ */
        .svc-others-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 20px;
        }
        @media (min-width: 1024px) {
          .svc-others-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .svc-other-card {
          display: block;
          padding: 18px 16px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          text-decoration: none;
          transition: all 0.25s;
          height: 100%;
          box-shadow: var(--shadow-sm);
        }
        .svc-other-card:hover {
          transform: translateY(-3px);
          border-color: var(--gold);
          box-shadow: 0 12px 28px rgba(20, 22, 27, 0.10);
        }
        .dark .svc-other-card:hover {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
        }

        .svc-other-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--gold) 15%, transparent);
          color: var(--gold);
          margin-bottom: 12px;
          transition: all 0.25s;
        }
        .svc-other-card:hover .svc-other-icon {
          background: var(--gold);
          color: #FFFFFF;
          transform: scale(1.08) rotate(-5deg);
        }

        .svc-other-title {
          font-size: 13.5px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.35;
          margin-bottom: 6px;
        }

        .svc-other-desc {
          font-size: 11.5px;
          line-height: 1.65;
          color: var(--text-muted);
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   FEATURED CARD COMPONENT
   ============================================================ */
function FeaturedServiceCard({ service, locale, labels, index }) {
  const Icon = ICONS[service.icon] || Flame;
  const isHvof = service.slug === "hvf-coating";

  // Color scheme per service
  const c1 = isHvof ? "#F7630C" : "#0078D4";
  const c2 = isHvof ? "#CA5010" : "#005A9E";

  const features = getFeatures(service, locale);
  const title = pick(service.name, locale);
  const desc = pick(service.short || service.desc, locale);
  const image = service.image || service.thumbnail;
  const href = "/" + locale + "/services/" + service.slug;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      className="svc-fcard"
      style={{
        "--svc-color": c1,
        "--svc-color2": c2
      }}
    >
      {/* Image / Placeholder */}
      <div className="svc-fimage-wrap">
        {image ? (
          <>
            <img
              src={image}
              alt={title}
              className="svc-fimage"
              loading="lazy"
            />
            <div className="svc-fshine" />
          </>
        ) : (
          <div className="svc-fplaceholder">
            <div className="svc-fplaceholder-icon">
              <Icon size={38} />
            </div>
            <div className="svc-fplaceholder-text">
              {labels.imageComing}
            </div>
            <div className="svc-fshine" />
          </div>
        )}

        {/* Featured Badge */}
        <div className="svc-fbadge">
          <Sparkles size={11} />
          {labels.special}
        </div>
      </div>

      {/* Body */}
      <div className="svc-fbody">
        <h3 className="svc-ftitle">{title}</h3>
        <p className="svc-fdesc">{desc}</p>

        {/* Features */}
        {features.length > 0 && (
          <div className="svc-ffeatures">
            {features.slice(0, 6).map(function (f, idx) {
              const FeatureIcon = isHvof ? Flame : Crosshair;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.12 + idx * 0.04 }}
                  className="svc-ffeature"
                >
                  <span className="svc-ffeature-icon">
                    <FeatureIcon size={11} strokeWidth={2.6} />
                  </span>
                  <span>{f}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <Link href={href} className="svc-fcta">
          {labels.learnMore}
          <ArrowLeft size={14} />
        </Link>
      </div>

      {/* Bottom accent line */}
      <div className="svc-fline" />
    </motion.div>
  );
}