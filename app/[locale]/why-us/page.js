import { getContent } from "@/lib/content";
import { getDictionary } from "@/lib/getDictionary";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const ICONS = {
  award: "🏆",
  sparkles: "✨",
  cog: "⚙️",
  users: "👥",
  settings: "🔧",
  building: "🏢"
};

export default async function WhyUsPage({ params }) {
  const { locale } = params;
  const dictionary = await getDictionary(locale);
  const content = getContent();
  const whyUs = content.whyUs || {};
  const features = whyUs.features || [];

  const title = pick(whyUs.title, locale) || dictionary.whyUsPage.title;
  const subtitle = pick(whyUs.subtitle, locale) || "";
  const labels = dictionary.whyUsPage;

  return (
    <section className="container-x py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="chip">{labels.badge}</span>
        <h1 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {features.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{labels.empty}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(function(f, i) {
            const emoji = ICONS[f.icon] || "⭐";
            return (
              <div
                key={i}
                className="card-glass p-6 hover:border-gold-500/40 transition-all hover:-translate-y-1"
                style={{ animationDelay: (i * 50) + "ms" }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, rgba(224, 168, 26, 0.15), rgba(184, 133, 10, 0.05))",
                  fontSize: 26,
                  marginBottom: 16,
                  border: "1px solid rgba(201, 149, 13, 0.25)"
                }}>
                  {emoji}
                </div>

                <h3 style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "var(--text)",
                  marginBottom: 8,
                  lineHeight: 1.4
                }}>
                  {pick(f.title, locale)}
                </h3>

                <p style={{
                  fontSize: 13,
                  lineHeight: 1.9,
                  color: "var(--text-soft)"
                }}>
                  {pick(f.desc, locale)}
                </p>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
