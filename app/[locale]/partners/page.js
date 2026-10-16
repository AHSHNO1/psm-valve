import { getPartners } from "@/lib/content";
import PartnersDirectory from "@/components/PartnersDirectory";

export default async function PartnersPage({ params }) {
  const { locale } = params;
  const allPartners = getPartners();
  const partners = allPartners.filter(function(p) { return p.active !== false; });

  const t = {
    fa: {
      badge: "مشتریان و همراهان صنعتی",
      title1: "همراهان",
      title2: "پترو سازه میهن",
      subtitle: "مجموعه‌ای از شرکت‌های فعال در صنایع نفت، گاز، پتروشیمی، انرژی و فولاد که نام و نشان آن‌ها در وب‌سایت شرکت منتشر شده است."
    },
    en: {
      badge: "Industrial customers & partners",
      title1: "Partners of",
      title2: "Petro Sazeh Mihan",
      subtitle: "Organizations in oil, gas, petrochemical, energy and steel industries listed on the company website."
    },
    ar: {
      badge: "العملاء والشركاء الصناعيون",
      title1: "شركاء",
      title2: "بترو سازه ميهان",
      subtitle: "مجموعة من الشركات العاملة في قطاعات النفط والغاز والبتروكيماويات والطاقة والصلب، والمنشورة أسماؤها على موقع الشركة."
    },
    ru: {
      badge: "Промышленные заказчики и партнеры",
      title1: "Партнеры",
      title2: "Petro Sazeh Mihan",
      subtitle: "Компании нефтегазовой, нефтехимической, энергетической и металлургической отраслей, указанные на сайте компании."
    }
  }[locale] || {
    badge: "Partners",
    title1: "Business",
    title2: "Partners",
    subtitle: "Organizations listed on the company website."
  };

  return (
    <section className="container-x py-10 sm:py-16">
      <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="chip">{t.badge}</span>
        <h1 className="section-title mt-3">
          <span className="heading-grad">{t.title1}</span>{" "}
          <span className="heading-gold">{t.title2}</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-8" style={{ color: "var(--text-soft)" }}>
          {t.subtitle}
        </p>
      </header>

      {partners.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>
            {locale === "fa" ? "فهرست همراهان هنوز منتشر نشده است." : "The partner directory is not available yet."}
          </p>
        </div>
      ) : (
        <PartnersDirectory partners={partners} locale={locale} />
      )}
    </section>
  );
}
