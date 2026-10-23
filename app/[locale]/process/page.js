import { getContent } from "@/lib/content";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const process = getContent().process || {};
  const seo = pageSeo(locale, "process");
  const customDescription = pick(process.subtitle, locale);
  return buildMetadata({
    locale,
    path: "/process",
    title: pick(process.title, locale) || seo.title,
    description: customDescription.length >= 80 ? customDescription : seo.description,
    keywords: seo.keywords
  });
}

export default async function ProcessPage({ params }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const content = getContent();
  const process = content.process || {};
  const steps = process.steps || [];

  const title = pick(process.title, locale) || dictionary.processPage.title;
  const subtitle = pick(process.subtitle, locale) || "";
  const labels = dictionary.processPage;

  return (
    <section className="container-x py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-14">
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

      {steps.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{labels.empty}</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto relative">
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            top: 40,
            bottom: 40,
            insetInlineStart: 32,
            width: 2,
            background: "linear-gradient(to bottom, transparent, var(--gold), transparent)",
            opacity: 0.3
          }} />

          {steps.map(function(step, i) {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  marginBottom: 24,
                  position: "relative",
                  animationDelay: (i * 80) + "ms"
                }}
              >
                <div style={{
                  width: 66,
                  height: 66,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF",
                  fontSize: 24,
                  fontWeight: 900,
                  flexShrink: 0,
                  boxShadow: "0 8px 24px rgba(201, 149, 13, 0.35)",
                  position: "relative",
                  zIndex: 1,
                  border: "4px solid var(--bg)"
                }}>
                  {step.num || (i + 1)}
                </div>

                <div className="card-glass" style={{ flex: 1, padding: 20 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "var(--text)",
                    marginBottom: 8
                  }}>
                    {pick(step.title, locale)}
                  </h3>
                  <p style={{
                    fontSize: 14,
                    lineHeight: 1.9,
                    color: "var(--text-soft)"
                  }}>
                    {pick(step.desc, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
