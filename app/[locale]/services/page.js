import { getDictionary } from "@/lib/getDictionary";
import { services } from "@/lib/services";
import Link from "next/link";
import { Cog, Gauge, Wrench, Circle, Flame, Truck, ArrowLeft } from "lucide-react";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Truck };

export default async function ServicesPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);

  const t = {
    fa: { badge: "خدمات ما", title1: "خدمات", title2: "تخصصی", learnMore: "جزئیات" },
    en: { badge: "Our Services", title1: "Specialized", title2: "Services", learnMore: "Details" },
    ar: { badge: "خدماتنا", title1: "خدمات", title2: "متخصصة", learnMore: "التفاصيل" },
    ru: { badge: "Наши услуги", title1: "Специализированные", title2: "услуги", learnMore: "Подробнее" }
  }[locale] || { badge: "Services", title1: "Specialized", title2: "Services", learnMore: "Details" };

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{t.badge}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-12">
        <span className="heading-grad">{t.title1}</span>{" "}
        <span className="heading-gold">{t.title2}</span>
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => {
          const Icon = ICONS[s.icon] || Cog;
          return (
            <div key={s.slug} className="card-glass p-6 sm:p-8 group hover:border-gold-500/50 transition">
              <div
                className="w-14 h-14 rounded-xl grid place-items-center mb-5"
                style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
              >
                <Icon size={26} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>
                {s.name[locale] || s.name.fa}
              </h3>
              <p className="text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                {s.short[locale] || s.short.fa}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
