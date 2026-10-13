"use client";
import { motion } from "framer-motion";
import { Factory, ShieldCheck, Truck, Headset, Sparkles } from "lucide-react";
import { useDictionary } from "./Providers";

export default function WhyPSM() {
  const { locale } = useDictionary();
  const isFa = locale === "fa";

  const L = {
    fa: {
      badge: "چرا پتروسازه میهن",
      title1: "چهار دلیل",
      title2: "اعتماد صنعت",
      sub: "از تولید تا پشتیبانی، در تمام مراحل همراه شما هستیم",
      items: [
        {
          icon: Factory,
          color: "#0078D4",
          title: "تولید داخلی",
          stat: "۱۰۰٪",
          desc: "طراحی و ساخت کامل در کارخانه اراک، بدون وابستگی به خارج"
        },
        {
          icon: ShieldCheck,
          color: "#10B981",
          title: "استاندارد جهانی",
          stat: "IEC 60534",
          desc: "کنترل کیفیت دقیق طبق استاندارد بین‌المللی در تمام مراحل"
        },
        {
          icon: Truck,
          color: "#F59E0B",
          title: "تحویل سریع",
          stat: "۴۸ ساعت",
          desc: "موجودی انبار محصولات پرکاربرد برای ارسال فوری"
        },
        {
          icon: Headset,
          color: "#DB2777",
          title: "پشتیبانی فنی",
          stat: "۲۴ / ۷",
          desc: "تیم مهندسی آماده مشاوره فنی، نصب و راه‌اندازی"
        }
      ]
    },
    en: {
      badge: "Why PSM Valve",
      title1: "Four Reasons",
      title2: "Industry Trusts Us",
      sub: "From production to support, we stand by you at every step",
      items: [
        {
          icon: Factory,
          color: "#0078D4",
          title: "Local Production",
          stat: "100%",
          desc: "Full design and manufacturing in Arak factory, no foreign dependency"
        },
        {
          icon: ShieldCheck,
          color: "#10B981",
          title: "Global Standard",
          stat: "IEC 60534",
          desc: "Precise quality control per international standards at every stage"
        },
        {
          icon: Truck,
          color: "#F59E0B",
          title: "Fast Delivery",
          stat: "48 hours",
          desc: "Stock of popular products for immediate shipment"
        },
        {
          icon: Headset,
          color: "#DB2777",
          title: "Technical Support",
          stat: "24 / 7",
          desc: "Engineering team ready for consultation, installation and setup"
        }
      ]
    },
    ar: {
      badge: "لماذا بترو سازه ميهن",
      title1: "أربعة أسباب",
      title2: "لثقة الصناعة",
      sub: "من الإنتاج إلى الدعم، نحن معك في كل خطوة",
      items: [
        {
          icon: Factory,
          color: "#0078D4",
          title: "إنتاج محلي",
          stat: "١٠٠٪",
          desc: "تصميم وتصنيع كامل في مصنع أراك، بدون اعتماد خارجي"
        },
        {
          icon: ShieldCheck,
          color: "#10B981",
          title: "معيار عالمي",
          stat: "IEC 60534",
          desc: "مراقبة جودة دقيقة وفقًا للمعايير الدولية في كل مرحلة"
        },
        {
          icon: Truck,
          color: "#F59E0B",
          title: "تسليم سريع",
          stat: "٤٨ ساعة",
          desc: "مخزون من المنتجات الشائعة للشحن الفوري"
        },
        {
          icon: Headset,
          color: "#DB2777",
          title: "دعم فني",
          stat: "٢٤ / ٧",
          desc: "فريق هندسي جاهز للاستشارة والتركيب"
        }
      ]
    },
    ru: {
      badge: "Почему PSM Valve",
      title1: "Четыре причины",
      title2: "доверия отрасли",
      sub: "От производства до поддержки — мы рядом на каждом этапе",
      items: [
        {
          icon: Factory,
          color: "#0078D4",
          title: "Локальное производство",
          stat: "100%",
          desc: "Полный цикл проектирования и производства на заводе в Араке"
        },
        {
          icon: ShieldCheck,
          color: "#10B981",
          title: "Мировой стандарт",
          stat: "IEC 60534",
          desc: "Точный контроль качества по международным стандартам"
        },
        {
          icon: Truck,
          color: "#F59E0B",
          title: "Быстрая доставка",
          stat: "48 часов",
          desc: "Склад популярных товаров для немедленной отправки"
        },
        {
          icon: Headset,
          color: "#DB2777",
          title: "Техподдержка",
          stat: "24 / 7",
          desc: "Инженерная команда для консультаций и настройки"
        }
      ]
    }
  }[locale] || {};

  return (
    <section className="whypsm-section">
      <div className="container-x">
        {/* Header */}
        <div className="whypsm-head">
          <span className="chip">
            <Sparkles size={12} />
            {L.badge}
          </span>
          <h2 className="section-title whypsm-title">
            <span className="heading-grad">{L.title1}</span>{" "}
            <span className="heading-gold">{L.title2}</span>
          </h2>
          <p className="whypsm-sub">{L.sub}</p>
        </div>

        {/* Grid */}
        <div className="whypsm-grid">
          {L.items.map(function (item, i) {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="whypsm-card"
                style={{ "--wp-color": item.color }}
              >
                {/* Top: Icon + Stat */}
                <div className="whypsm-top">
                  <div className="whypsm-icon">
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <div className="whypsm-stat">{item.stat}</div>
                </div>

                {/* Title */}
                <div className="whypsm-card-title">{item.title}</div>

                {/* Description */}
                <div className="whypsm-desc">{item.desc}</div>

                {/* Bottom accent line */}
                <div className="whypsm-line" />
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .whypsm-section {
          padding: 60px 0;
          position: relative;
        }
        @media (min-width: 768px) {
          .whypsm-section {
            padding: 80px 0;
          }
        }

        .whypsm-head {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 40px;
        }
        .whypsm-title {
          margin-top: 14px;
          margin-bottom: 12px;
        }
        .whypsm-sub {
          font-size: 13.5px;
          color: var(--text-muted);
          font-weight: 600;
          line-height: 1.7;
        }

        .whypsm-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 480px) {
          .whypsm-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .whypsm-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
          }
        }

        .whypsm-card {
          padding: 22px 20px;
          border-radius: 18px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .whypsm-card:hover {
          transform: translateY(-4px);
          border-color: var(--wp-color);
          box-shadow: 0 14px 32px rgba(20, 22, 27, 0.10);
        }
        .dark .whypsm-card:hover {
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
        }

        .whypsm-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .whypsm-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--wp-color) 15%, transparent);
          color: var(--wp-color);
          transition: all 0.3s;
        }
        .whypsm-card:hover .whypsm-icon {
          background: var(--wp-color);
          color: #FFFFFF;
          transform: rotate(-5deg) scale(1.05);
        }

        .whypsm-stat {
          font-size: 15px;
          font-weight: 900;
          color: var(--wp-color);
          font-family: monospace;
          direction: ltr;
          padding: 4px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--wp-color) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--wp-color) 30%, transparent);
          letter-spacing: -0.02em;
        }

        .whypsm-card-title {
          font-size: 15px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.35;
          margin-bottom: 8px;
        }

        .whypsm-desc {
          font-size: 12.5px;
          line-height: 1.75;
          color: var(--text-soft);
          font-weight: 600;
        }

        .whypsm-line {
          position: absolute;
          bottom: 0;
          inset-inline-start: 0;
          height: 3px;
          width: 0;
          background: var(--wp-color);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .whypsm-card:hover .whypsm-line {
          width: 100%;
        }
      `}</style>
    </section>
  );
}