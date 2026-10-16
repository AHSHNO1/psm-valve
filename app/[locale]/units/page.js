import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  DraftingCompass,
  Factory,
  Flame,
  Lightbulb,
  Wrench
} from "lucide-react";
import { units } from "@/lib/units";

const ICONS = {
  engineering: DraftingCompass,
  "research-development": Lightbulb,
  manufacturing: Factory,
  "hvof-coating": Flame,
  "quality-control": BadgeCheck,
  "maintenance-overhaul": Wrench
};

const COPY = {
  fa: {
    badge: "توانمندی‌های سازمانی",
    title: "دپارتمان‌های",
    titleAccent: "پتروسازه میهن",
    intro: "از طراحی و تحقیق تا تولید، پوشش‌دهی، آزمون و بازسازی؛ توانمندی‌های تخصصی ما در کنار هم برای پاسخ‌گویی به نیاز صنایع کار می‌کنند.",
    departments: "شش دپارتمان تخصصی",
    contact: "گفت‌وگو با کارشناسان",
    unit: "دپارتمان",
    capabilities: "حوزه‌های فعالیت"
  },
  en: {
    badge: "Our Capabilities",
    title: "The Departments",
    titleAccent: "Behind PSM",
    intro: "From engineering and research to manufacturing, coating, testing, and overhaul, our specialist departments work together to meet industrial needs.",
    departments: "Six specialist departments",
    contact: "Talk to our team",
    unit: "Department",
    capabilities: "What we do"
  },
  ar: {
    badge: "قدراتنا",
    title: "الأقسام",
    titleAccent: "المتخصصة في PSM",
    intro: "من الهندسة والبحث إلى التصنيع والطلاء والاختبار والصيانة، تعمل أقسامنا المتخصصة معاً لتلبية احتياجات القطاع الصناعي.",
    departments: "ستة أقسام متخصصة",
    contact: "تواصل مع فريقنا",
    unit: "القسم",
    capabilities: "مجالات العمل"
  },
  ru: {
    badge: "Наши компетенции",
    title: "Подразделения",
    titleAccent: "PSM",
    intro: "От инженерных разработок и исследований до производства, нанесения покрытий, испытаний и ремонта — наши специалисты вместе решают задачи промышленности.",
    departments: "Шесть специализированных подразделений",
    contact: "Связаться с командой",
    unit: "Подразделение",
    capabilities: "Направления работы"
  }
};

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export default async function UnitsPage({ params }) {
  const { locale } = params;
  const text = COPY[locale] || COPY.en;
  const isRtl = locale === "fa" || locale === "ar";

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "72px 0 86px",
          background: "linear-gradient(145deg, #0F1114 0%, #1F2124 58%, #30343A 100%)"
        }}
      >
        <div className="grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.16 }} />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetBlockStart: -150,
            insetInlineEnd: "-5%",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224,168,26,0.22), transparent 68%)",
            filter: "blur(28px)"
          }}
        />
        <div className="container-x" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 850, marginInline: "auto", textAlign: "center" }}>
            <span
              className="chip"
              style={{
                color: "#F5C518",
                background: "rgba(245,197,24,0.1)",
                borderColor: "rgba(245,197,24,0.32)"
              }}
            >
              {text.badge}
            </span>
            <h1 className="section-title mt-4" style={{ color: "#FFFFFF", lineHeight: 1.35 }}>
              <span>{text.title}</span>{" "}
              <span className="heading-gold">{text.titleAccent}</span>
            </h1>
            <p
              style={{
                maxWidth: 740,
                margin: "18px auto 0",
                color: "rgba(241,243,245,0.76)",
                fontSize: 15,
                lineHeight: 2
              }}
            >
              {text.intro}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                marginTop: 24,
                padding: "9px 15px",
                borderRadius: 999,
                color: "#FFFFFF",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 800
              }}
            >
              <Factory size={16} color="#F5C518" aria-hidden="true" />
              {text.departments}
            </div>
          </div>
        </div>
      </section>

      <section className="container-x" style={{ paddingTop: 42, paddingBottom: 72 }}>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {units.map(function(unit, index) {
            const Icon = ICONS[unit.slug] || Factory;
            const name = pick(unit.name, locale);
            const tasks = pick(unit.tasks, locale);

            return (
              <article
                key={unit.slug}
                className="card-glass overflow-hidden"
                style={{
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.25s ease, border-color 0.25s ease"
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "16 / 10",
                    overflow: "hidden",
                    background: "var(--bg-soft)"
                  }}
                >
                  <img
                    src={unit.image}
                    alt={name}
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, transparent 35%, rgba(15,17,20,0.76) 100%)"
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      insetInlineStart: 16,
                      insetBlockEnd: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "#FFFFFF"
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        color: "#17191C",
                        background: "linear-gradient(135deg, #F5C518, #D49A0C)"
                      }}
                    >
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", opacity: 0.86 }}>
                      {text.unit} {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "22px 22px 24px", display: "flex", flex: 1, flexDirection: "column" }}>
                  <h2
                    style={{
                      margin: "0 0 9px",
                      color: "var(--text)",
                      fontSize: 20,
                      lineHeight: 1.5,
                      fontWeight: 900
                    }}
                  >
                    {name}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-soft)",
                      fontSize: 13,
                      lineHeight: 1.9
                    }}
                  >
                    {pick(unit.desc, locale)}
                  </p>

                  <h3
                    style={{
                      margin: "20px 0 10px",
                      color: "var(--gold)",
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.02em"
                    }}
                  >
                    {text.capabilities}
                  </h3>
                  <ul
                    style={{
                      display: "grid",
                      gap: 9,
                      padding: 0,
                      margin: 0,
                      listStyle: "none"
                    }}
                  >
                    {tasks.map(function(task) {
                      return (
                        <li
                          key={task}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            color: "var(--text-soft)",
                            fontSize: 12,
                            lineHeight: 1.75
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 6,
                              height: 6,
                              marginTop: 7,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: "var(--gold)"
                            }}
                          />
                          <span>{task}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="card-glass"
          style={{
            maxWidth: 880,
            margin: "32px auto 0",
            padding: "22px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                background: "var(--glow)",
                color: "var(--gold)",
                flexShrink: 0
              }}
            >
              <Wrench size={21} aria-hidden="true" />
            </span>
            <span style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.8 }}>
              {text.intro}
            </span>
          </div>
          <Link href={"/" + locale + "/contact"} className="btn-gold">
            {text.contact}
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
