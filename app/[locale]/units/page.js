import { getDictionary } from "@/lib/getDictionary";
import { units } from "@/lib/units";
import { DraftingCompass, Factory, BadgeCheck, Lightbulb, Headphones, Building2 } from "lucide-react";

const ICONS = { DraftingCompass, Factory, BadgeCheck, Lightbulb, Headphones };

export default async function UnitsPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);

  const t = {
    fa: { badge: "ساختار سازمانی", title1: "واحدهای", title2: "سازمانی" },
    en: { badge: "Organization", title1: "Our", title2: "Units" },
    ar: { badge: "الهيكل التنظيمي", title1: "وحداتنا", title2: "التنظيمية" },
    ru: { badge: "Организация", title1: "Наши", title2: "отделы" }
  }[locale] || { badge: "Organization", title1: "Our", title2: "Units" };

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{t.badge}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-12">
        <span className="heading-grad">{t.title1}</span>{" "}
        <span className="heading-gold">{t.title2}</span>
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {units.map((u) => {
          const Icon = ICONS[u.icon] || Building2;
          return (
            <div key={u.slug} className="card-glass p-6 sm:p-8">
              <div
                className="w-14 h-14 rounded-xl grid place-items-center mb-5"
                style={{ background: "var(--glow)", color: "var(--gold)" }}
              >
                <Icon size={26} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>
                {u.name[locale] || u.name.fa}
              </h3>
              <p className="text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                {u.desc[locale] || u.desc.fa}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
