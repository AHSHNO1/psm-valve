import { getPartners } from "@/lib/content";
import PartnersDirectory from "@/components/PartnersDirectory";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "partners");
  return buildMetadata({
    locale,
    path: "/partners",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  });
}

export default async function PartnersPage({ params }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const allPartners = getPartners();
  const partners = allPartners.filter(function(p) { return p.active !== false; });
  const t = dictionary.partnersPage;

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
            {t.empty}
          </p>
        </div>
      ) : (
        <PartnersDirectory partners={partners} locale={locale} />
      )}
    </section>
  );
}
