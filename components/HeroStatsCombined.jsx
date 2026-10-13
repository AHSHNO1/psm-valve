"use client";
import Link from "next/link";
import HeroSlider from "./HeroSlider";
import { motion } from "framer-motion";
import { Package, Calculator, FileText, Phone, ArrowLeft } from "lucide-react";
import { useDictionary } from "./Providers";

export default function HeroStatsCombined({ sliders, locale, fallbackDict }) {
  const { t } = useDictionary();
  const isFa = locale === "fa";

  const L = {
    fa: {
      products: "محصولات",
      productsSub: "۱۲۶ سری صنعتی",
      sizing: "سایزینگ آنلاین",
      sizingSub: "محاسبه Cv/Kv طبق IEC",
      catalog: "کاتالوگ PDF",
      catalogSub: "دانلود کاتالوگ‌ها",
      contact: "مشاوره فنی",
      contactSub: "پاسخ در کمتر از ۱ ساعت"
    },
    en: {
      products: "Products",
      productsSub: "126 industrial series",
      sizing: "Online Sizing",
      sizingSub: "Cv/Kv per IEC 60534",
      catalog: "PDF Catalog",
      catalogSub: "Download catalogs",
      contact: "Technical Support",
      contactSub: "Reply under 1 hour"
    },
    ar: {
      products: "المنتجات",
      productsSub: "١٢٦ سلسلة صناعية",
      sizing: "تحديد الحجم",
      sizingSub: "حساب Cv/Kv وفق IEC",
      catalog: "الكتالوج PDF",
      catalogSub: "تحميل الكتالوجات",
      contact: "دعم فني",
      contactSub: "رد في أقل من ساعة"
    },
    ru: {
      products: "Продукты",
      productsSub: "126 промышленных серий",
      sizing: "Онлайн-подбор",
      sizingSub: "Расчет Cv/Kv по IEC 60534",
      catalog: "Каталог PDF",
      catalogSub: "Скачать каталоги",
      contact: "Техподдержка",
      contactSub: "Ответ за 1 час"
    }
  }[locale] || {};

  const actions = [
    {
      id: "products",
      href: "/" + locale + "/products",
      icon: Package,
      title: L.products,
      sub: L.productsSub,
      color: "#0078D4"
    },
    {
      id: "sizing",
      href: "/" + locale + "/sizing",
      icon: Calculator,
      title: L.sizing,
      sub: L.sizingSub,
      color: "#E0A81A",
      featured: true
    },
    {
      id: "catalog",
      href: "/" + locale + "/media?tab=catalogs",
      icon: FileText,
      title: L.catalog,
      sub: L.catalogSub,
      color: "#10B981"
    },
    {
      id: "contact",
      href: "/" + locale + "/contact",
      icon: Phone,
      title: L.contact,
      sub: L.contactSub,
      color: "#DB2777"
    }
  ];

  return (
    <div>
      <HeroSlider sliders={sliders} locale={locale} fallbackDict={fallbackDict} />

      {/* Smart Action Bar */}
      <div className="smart-bar-section">
        <div className="container-x">
          <div className="smart-bar-grid">
            {actions.map(function (a, i) {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                >
                  <Link
                    href={a.href}
                    className={"smart-card" + (a.featured ? " smart-card-featured" : "")}
                    style={{ "--sc": a.color }}
                  >
                    <div className="smart-icon">
                      <Icon size={20} strokeWidth={2.4} />
                    </div>
                    <div className="smart-content">
                      <div className="smart-title">
                        {a.title}
                        <ArrowLeft size={12} className="smart-arrow" />
                      </div>
                      <div className="smart-sub">{a.sub}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .smart-bar-section {
          padding: 18px 0 6px;
          background: transparent;
        }

        .smart-bar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 768px) {
          .smart-bar-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
        }

        .smart-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          min-height: 64px;
        }
        .smart-card::before {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--sc);
          opacity: 0.85;
        }
        .smart-card:hover {
          transform: translateY(-3px);
          border-color: var(--sc);
          box-shadow: 0 10px 24px rgba(20, 22, 27, 0.10);
        }
        .dark .smart-card:hover {
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
        }

        .smart-card-featured {
          background: linear-gradient(
            135deg,
            rgba(224, 168, 26, 0.10),
            rgba(184, 133, 10, 0.02)
          );
          border-color: rgba(224, 168, 26, 0.45);
        }
        .dark .smart-card-featured {
          background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.08),
            rgba(184, 133, 10, 0.02)
          );
        }

        .smart-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: color-mix(in srgb, var(--sc) 15%, transparent);
          color: var(--sc);
          transition: all 0.25s;
        }
        .smart-card:hover .smart-icon {
          background: var(--sc);
          color: #FFFFFF;
          transform: scale(1.06);
        }

        .smart-content {
          flex: 1;
          min-width: 0;
        }
        .smart-title {
          font-size: 13px;
          font-weight: 900;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1.25;
          margin-bottom: 3px;
        }
        .smart-arrow {
          opacity: 0;
          transition: all 0.25s;
          transform: translateX(-4px);
          flex-shrink: 0;
        }
        .smart-card:hover .smart-arrow {
          opacity: 1;
          transform: translateX(0);
          color: var(--sc);
        }
        .smart-sub {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .smart-card {
            padding: 11px 12px;
            gap: 9px;
            min-height: 58px;
          }
          .smart-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }
          .smart-title {
            font-size: 12px;
          }
          .smart-sub {
            font-size: 9.5px;
          }
        }
      `}</style>
    </div>
  );
}