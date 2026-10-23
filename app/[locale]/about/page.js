import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";
import { getContent, getCertificates } from "@/lib/content";
import CeoSection from "@/components/CeoSection";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "about");
  return buildMetadata({
    locale,
    path: "/about",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    titleAbsolute: true
  });
}

export default async function AboutPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const content = getContent();
  const ceo = content.ceo || {};
  const companyHistory = content.companyHistory || {};
  const aboutStats = content.aboutStats || {};
  const certificates = getCertificates();
  const L = dict.about;
  const statValue = (value) => value?.[locale] || value?.en || value?.fa || "";

  const values = [
    {
      icon: "target",
      title: dict.about.mission,
      desc: dict.about.missionDesc,
      accent: "#C9950D"
    },
    {
      icon: "eye",
      title: dict.about.vision,
      desc: dict.about.visionDesc,
      accent: "#0078D4"
    },
    {
      icon: "heart",
      title: dict.about.values,
      desc: dict.about.valuesDesc,
      accent: "#107C10"
    }
  ];

  return (
    <div>
      {/* Hero section */}
      <section style={{
        background: "linear-gradient(135deg, var(--bg) 0%, var(--bg-soft) 55%, var(--bg-card) 100%)",
        padding: "70px 0 90px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.07 }} />
        <div style={{
          position: "absolute",
          top: "-80px",
          insetInlineEnd: 0,
          width: 300,
          maxWidth: "100%",
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 197, 24, 0.20), transparent 70%)",
          filter: "blur(60px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-80px",
          insetInlineStart: 0,
          width: 260,
          maxWidth: "100%",
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 120, 212, 0.10), transparent 70%)",
          filter: "blur(60px)"
        }} />

        <div className="container-x" style={{ position: "relative", zIndex: 1 }}>
          <div className="max-w-3xl mx-auto text-center">
            <span className="chip" style={{
              background: "var(--bg-card)",
              borderColor: "rgba(245, 197, 24, 0.4)",
              color: "var(--gold)"
            }}>
              {L.badge}
            </span>
            <h1 className="section-title mt-4" style={{ color: "var(--text)" }}>
              <span className="heading-grad">{dict.about.title1}</span>{" "}
              <span className="heading-gold">{dict.about.title2}</span>
            </h1>
            <p className="mt-5 text-base leading-8" style={{ color: "var(--text-soft)" }}>
              {L.subtitle}
            </p>

            {/* Knowledge badge inline */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 22,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(245, 197, 24, 0.16)",
              border: "1px solid rgba(245, 197, 24, 0.35)"
            }}>
              <span style={{ fontSize: 14 }}>🧪</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)" }}>
                {L.knowledgeType}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="container-x" style={{ marginTop: -50, position: "relative", zIndex: 2 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={statValue(aboutStats.foundedYear)} label={L.statsFounded} color="#C9950D" />
          <StatCard value={statValue(aboutStats.departments)} label={L.statsDepartments} color="#0078D4" />
          <StatCard value={statValue(aboutStats.coating)} label={L.statsCoating} color="#107C10" />
          <StatCard value={statValue(aboutStats.classification)} label={L.statsType} color="#8764B8" />
        </div>
      </section>

      {/* Description section */}
      <section className="container-x py-16">
        <div className="max-w-4xl mx-auto">
          <div className="card-glass p-8 sm:p-10">
            <div style={{
              width: 50,
              height: 4,
              borderRadius: 2,
              background: "linear-gradient(90deg, var(--gold-bg), var(--gold-strong))",
              marginBottom: 20
            }} />
            <p className="leading-9 text-base sm:text-lg" style={{ color: "var(--text-soft)" }}>
              {dict.about.desc}
            </p>
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="container-x pb-16">
        <div className="text-center mb-10">
          <span className="chip">{L.valuesTitle}</span>
          <h2 className="section-title mt-3">
            <span className="heading-grad">{L.valuesTitle}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {values.map(function(v, i) {
            return (
              <div
                key={i}
                className="card-glass p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: v.accent + "40" }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  background: v.accent + "15",
                  color: v.accent,
                  marginBottom: 16
                }}>
                  <ValueIcon name={v.icon} />
                </div>
                <h3 style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: "var(--text)",
                  marginBottom: 10
                }}>
                  {v.title}
                </h3>
                <p style={{
                  fontSize: 13.5,
                  lineHeight: 1.9,
                  color: "var(--text-soft)"
                }}>
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Company history */}
      {companyHistory.steps && companyHistory.steps.length > 0 && (
        <section className="container-x pb-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="chip">
              {L.journey}
            </span>
            <h2 className="section-title mt-3">
              <span className="heading-grad">{companyHistory.title[locale] || companyHistory.title.en}</span>
            </h2>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
              {companyHistory.subtitle[locale] || companyHistory.subtitle.en}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {companyHistory.steps.map(function(step, index) {
              return (
                <article key={index} className="card-glass p-6 sm:p-7">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16
                  }}>
                    <span style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      background: "var(--glow)",
                      color: "var(--gold)",
                      fontSize: 11,
                      fontWeight: 900
                    }}>
                      {step.year[locale] || step.year.en}
                    </span>
                    <span style={{
                      height: 1,
                      flex: 1,
                      background: "linear-gradient(90deg, var(--gold), transparent)"
                    }} />
                  </div>
                  <h3 style={{
                    margin: "0 0 10px",
                    color: "var(--text)",
                    fontSize: 16,
                    fontWeight: 900,
                    lineHeight: 1.6
                  }}>
                    {step.title[locale] || step.title.en}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: "var(--text-soft)",
                    fontSize: 13,
                    lineHeight: 1.9
                  }}>
                    {step.desc[locale] || step.desc.en}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* CEO Section */}
      <CeoSection ceo={ceo} locale={locale} certificates={certificates} labels={L.ceo} />
    </div>
  );
}

function ValueIcon({ name }) {
  const icons = {
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>
  };
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.target}
    </svg>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      padding: 24,
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      boxShadow: "var(--shadow-md)",
      textAlign: "center",
      transition: "all 0.25s"
    }}>
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        color: color,
        lineHeight: 1,
        marginBottom: 8
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text-muted)",
        letterSpacing: "0.02em"
      }}>
        {label}
      </div>
    </div>
  );
}
