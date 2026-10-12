import { getPartners } from "@/lib/content";
import { Building2 } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default async function PartnersPage({ params }) {
  const { locale } = params;
  const allPartners = getPartners();
  const partners = allPartners.filter(function(p) { return p.active !== false; });

  const t = {
    fa: { badge: "همراهان ما", title1: "شرکای", title2: "تجاری", empty: "به‌زودی لیست همراهان نمایش داده می‌شود" },
    en: { badge: "Our Partners", title1: "Business", title2: "Partners", empty: "Partner list coming soon" },
    ar: { badge: "شركاؤنا", title1: "الشركاء", title2: "التجاريون", empty: "قائمة الشركاء قريباً" },
    ru: { badge: "Наши партнеры", title1: "Деловые", title2: "партнеры", empty: "Список партнеров скоро" }
  }[locale] || { badge: "Partners", title1: "Business", title2: "Partners", empty: "Coming soon" };

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{t.badge}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-12">
        <span className="heading-grad">{t.title1}</span>{" "}
        <span className="heading-gold">{t.title2}</span>
      </h1>

      {partners.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {partners.map(function(p) {
            const inner = p.logo ? (
              <img src={p.logo} alt={pick(p.name, locale)} className="max-w-full max-h-20 object-contain" />
            ) : (
              <div className="text-center">
                <Building2 size={40} style={{ color: "var(--gold)", margin: "0 auto 12px" }} />
                <div className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>
                  {pick(p.name, locale)}
                </div>
              </div>
            );

            return p.url && p.url !== "#" ? (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                className="card-glass p-6 aspect-square grid place-items-center hover:border-gold-500/50 transition">
                {inner}
              </a>
            ) : (
              <div key={p.id} className="card-glass p-6 aspect-square grid place-items-center">
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
