"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Calculator, FileText, Phone, ArrowLeft } from "lucide-react";
import { useDictionary } from "./Providers";

export default function QuickAccessBar() {
  const { locale } = useDictionary();
  const isFa = locale === "fa";

  const L = {
    fa: {
      products: "محصولات",
      productsSub: "۱۲۶ سری صنعتی",
      sizing: "سایزینگ آنلاین",
      sizingSub: "محاسبه Cv/Kv",
      catalog: "کاتالوگ",
      catalogSub: "دانلود PDF",
      contact: "تماس",
      contactSub: "مشاوره فنی"
    },
    en: {
      products: "Products",
      productsSub: "126 series",
      sizing: "Online Sizing",
      sizingSub: "Cv/Kv calculator",
      catalog: "Catalog",
      catalogSub: "Download PDF",
      contact: "Contact",
      contactSub: "Technical support"
    },
    ar: {
      products: "المنتجات",
      productsSub: "١٢٦ سلسلة",
      sizing: "حجم الصمام",
      sizingSub: "حساب Cv/Kv",
      catalog: "الكتالوج",
      catalogSub: "تحميل PDF",
      contact: "اتصل",
      contactSub: "دعم فني"
    },
    ru: {
      products: "Продукты",
      productsSub: "126 серий",
      sizing: "Онлайн-подбор",
      sizingSub: "Расчет Cv/Kv",
      catalog: "Каталог",
      catalogSub: "Скачать PDF",
      contact: "Контакты",
      contactSub: "Тех. поддержка"
    }
  }[locale] || {};

  const items = [
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
    <section className="qa-section">
      <div className="container-x">
        <div className="qa-grid">
          {items.map(function (item, i) {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={item.href}
                  className={"qa-card" + (item.featured ? " qa-featured" : "")}
                  style={{ "--qa-color": item.color }}
                >
                  <div className="qa-icon">
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <div className="qa-content">
                    <div className="qa-title">
                      {item.title}
                      <ArrowLeft size={13} className="qa-arrow" />
                    </div>
                    <div className="qa-sub">{item.sub}</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .qa-section {
          padding: 20px 0 8px;
        }
        .qa-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 768px) {
          .qa-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .qa-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .qa-card::before {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--qa-color);
          opacity: 0.7;
        }
        .qa-card:hover {
          transform: translateY(-3px);
          border-color: var(--qa-color);
          box-shadow: 0 12px 28px rgba(20, 22, 27, 0.10);
        }
        .dark .qa-card:hover {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
        }

        .qa-featured {
          background: linear-gradient(135deg, rgba(224, 168, 26, 0.08), rgba(184, 133, 10, 0.02));
          border-color: rgba(224, 168, 26, 0.4);
        }

        .qa-icon {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: color-mix(in srgb, var(--qa-color) 15%, transparent);
          color: var(--qa-color);
          transition: all 0.25s;
        }
        .qa-card:hover .qa-icon {
          background: var(--qa-color);
          color: #FFFFFF;
          transform: scale(1.05);
        }

        .qa-content {
          flex: 1;
          min-width: 0;
        }
        .qa-title {
          font-size: 13.5px;
          font-weight: 900;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1.3;
          margin-bottom: 3px;
        }
        .qa-arrow {
          opacity: 0;
          transition: all 0.25s;
          transform: translateX(-4px);
        }
        .qa-card:hover .qa-arrow {
          opacity: 1;
          transform: translateX(0);
          color: var(--qa-color);
        }
        .qa-sub {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          line-height: 1.3;
        }

        @media (max-width: 480px) {
          .qa-card {
            padding: 14px 12px;
            gap: 10px;
          }
          .qa-icon {
            width: 42px;
            height: 42px;
            border-radius: 11px;
          }
          .qa-title {
            font-size: 12.5px;
          }
          .qa-sub {
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}