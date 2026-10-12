import Link from "next/link";
import { Target, Calculator, Sparkles } from "lucide-react";
import SizingTool from "@/components/SizingTool";
import EngineeringCalculator from "@/components/EngineeringCalculator";

const SITE_URL = "https://www.psm-valve.com";

const META = {
  fa: {
    title: "نرم‌افزار سایزینگ شیر کنترلی | محاسبه آنلاین Cv + ماشین‌حساب مهندسی",
    description: "ابزار آنلاین و رایگان سایزینگ شیر کنترلی طبق استاندارد IEC 60534 — محاسبه دقیق Cv/Kv برای مایع، گاز و بخار، انتخاب سایز، نمودار مشخصه، PDF گزارش + ماشین‌حساب مهندسی کامل.",
    keywords: ["سایزینگ شیر کنترلی", "محاسبه Cv", "شیر کنترلی", "IEC 60534", "Cv Kv", "نرم‌افزار سایزینگ", "PSM Valve", "شیر صنعتی"]
  },
  en: {
    title: "Control Valve Sizing Calculator | Cv/Kv Online Tool + Engineering Calculator",
    description: "Free online control valve sizing tool per IEC 60534 — accurate Cv/Kv calculation for liquid, gas and steam, size selection, valve characteristic charts, PDF report + full engineering calculator.",
    keywords: ["control valve sizing", "Cv calculator", "Kv calculator", "IEC 60534", "valve sizing software", "PSM Valve", "industrial valve"]
  },
  ar: {
    title: "حاسبة تحديد حجم الصمام | أداة حساب Cv/Kv عبر الإنترنت",
    description: "أداة مجانية لتحديد حجم صمام التحكم وفقًا لـ IEC 60534 — حساب Cv/Kv للسوائل والغازات والبخار، اختيار الحجم، مخططات الخصائص، تقرير PDF + حاسبة هندسية.",
    keywords: ["تحديد حجم الصمام", "حساب Cv", "صمام التحكم", "IEC 60534", "PSM Valve"]
  },
  ru: {
    title: "Калькулятор подбора клапана | Онлайн-расчет Cv/Kv",
    description: "Бесплатный онлайн-инструмент подбора регулирующего клапана по IEC 60534 — точный расчет Cv/Kv для жидкости, газа и пара, подбор размера, графики, PDF-отчет + инженерный калькулятор.",
    keywords: ["подбор клапана", "расчет Cv", "регулирующий клапан", "IEC 60534", "PSM Valve"]
  }
};

export async function generateMetadata({ params }) {
  const locale = params?.locale || "fa";
  const m = META[locale] || META.en;
  const url = `${SITE_URL}/${locale}/sizing`;

  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: {
      canonical: url,
      languages: {
        "fa-IR": `${SITE_URL}/fa/sizing`,
        "en-US": `${SITE_URL}/en/sizing`,
        "ar-SA": `${SITE_URL}/ar/sizing`,
        "ru-RU": `${SITE_URL}/ru/sizing`
      }
    },
    openGraph: {
      type: "website",
      url: url,
      title: m.title,
      description: m.description,
      siteName: "PSM Valve",
      locale: locale === "fa" ? "fa_IR" : locale === "ar" ? "ar_SA" : locale === "ru" ? "ru_RU" : "en_US",
      images: [
        {
          url: `${SITE_URL}/og/sizing-${locale}.jpg`,
          width: 1200,
          height: 630,
          alt: m.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      images: [`${SITE_URL}/og/sizing-${locale}.jpg`]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    }
  };
}

const TABS = [
  {
    id: "sizing", icon: Target, accent: "#E0A81A", badge: "IEC 60534",
    title: { fa: "سایزینگ شیر کنترلی", en: "Valve Sizing", ar: "تحديد حجم الصمام", ru: "Подбор клапана" },
    desc: {
      fa: "محاسبه Cv/Kv، انتخاب سایز، نمودار مشخصه و راهنمای متریال",
      en: "Cv/Kv calculation, size selection, characteristic charts & material guide",
      ar: "حساب Cv/Kv واختيار الحجم والرسوم البيانية",
      ru: "Расчет Cv/Kv, подбор размера, графики"
    },
    chips: {
      fa: ["مایع", "گاز", "بخار", "نمودار Conval", "متریال"],
      en: ["Liquid", "Gas", "Steam", "Conval Charts", "Material"],
      ar: ["سائل", "غاز", "بخار", "رسوم", "المواد"],
      ru: ["Жидкость", "Газ", "Пар", "Графики", "Материалы"]
    }
  },
  {
    id: "calculator", icon: Calculator, accent: "#0078D4", badge: "13",
    title: { fa: "ماشین‌حساب مهندسی", en: "Engineering Calculator", ar: "الآلة الحاسبة", ru: "Инженерный калькулятор" },
    desc: {
      fa: "تبدیل واحد، محاسبات لوله (Reynolds، افت فشار)، ماشین‌حساب علمی",
      en: "Unit converter, pipe calcs (Reynolds, friction), scientific calculator",
      ar: "محول الوحدات وحسابات الأنابيب والحاسبة العلمية",
      ru: "Конвертер, расчеты труб, научный калькулятор"
    },
    chips: {
      fa: ["تبدیل واحد", "محاسبات لوله", "علمی", "تاریخچه"],
      en: ["Unit Converter", "Pipe Calc", "Scientific", "History"],
      ar: ["محول", "أنابيب", "علمية", "السجل"],
      ru: ["Конвертер", "Трубы", "Научный", "История"]
    }
  }
];

const HUB = {
  fa: {
    badge: "ابزارهای تخصصی مهندسی",
    title1: "مرکز ابزارهای مهندسی",
    title2: " PSM",
    sub: "دو ابزار حرفه‌ای برای انتخاب و محاسبه شیرهای کنترلی صنعتی — طبق استانداردهای IEC و ANSI"
  },
  en: {
    badge: "Professional Engineering Tools",
    title1: "PSM Engineering",
    title2: " Tools Hub",
    sub: "Two professional tools for industrial control valve selection & calculation"
  },
  ar: {
    badge: "أدوات هندسية احترافية",
    title1: "مركز أدوات",
    title2: " PSM",
    sub: "أداتان احترافيتان لاختيار وحساب صمامات التحكم الصناعية"
  },
  ru: {
    badge: "Профессиональные инструменты",
    title1: "PSM",
    title2: " Инженерный центр",
    sub: "Два профессиональных инструмента для подбора и расчета клапанов"
  }
};

export default function SizingPage({ params, searchParams }) {
  const locale = params?.locale || "fa";
  const tool = searchParams?.tool === "calculator" ? "calculator" : "sizing";
  const isRTL = locale === "fa" || locale === "ar";
  const H = HUB[locale] || HUB.en;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: locale === "fa" ? "نرم‌افزار سایزینگ شیر کنترلی PSM" : "PSM Control Valve Sizing Tool",
    url: `${SITE_URL}/${locale}/sizing`,
    applicationCategory: "EngineeringApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: { "@type": "Organization", name: "PSM Valve", url: SITE_URL },
    description: (META[locale] || META.en).description
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-x pt-8 pb-3">
        <div className="text-center max-w-[720px] mx-auto mb-7">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3.5 text-[11px] font-black"
            style={{
              background: "linear-gradient(135deg, rgba(224,168,26,0.15), rgba(184,133,10,0.05))",
              border: "1px solid rgba(224,168,26,0.35)",
              color: "#B8850A"
            }}
          >
            <Sparkles size={12} />
            {H.badge}
          </div>

          <h1 className="font-black mb-3 leading-tight" style={{ fontSize: "clamp(22px, 4vw, 34px)", color: "var(--text)" }}>
            <span className="heading-grad">{H.title1}</span>{H.title2}
          </h1>

          <p className="font-semibold leading-relaxed max-w-[560px] mx-auto" style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {H.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[900px] mx-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            const href = "/" + locale + "/sizing?tool=" + t.id;
            return (
              <Link key={t.id} href={href}
                className="p-5 rounded-2xl flex flex-col gap-3 no-underline cursor-pointer transition-all duration-300"
                style={{
                  background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "#FFFFFF",
                  border: "1.5px solid " + (active ? "transparent" : "var(--border)"),
                  boxShadow: active ? "0 16px 40px rgba(201, 149, 13, 0.35)" : "none"
                }}>
                <div className="flex items-center justify-between">
                  <div className="grid place-items-center rounded-xl"
                    style={{
                      width: 46, height: 46,
                      background: active ? "rgba(255,255,255,0.22)" : t.accent + "15",
                      color: active ? "#FFFFFF" : t.accent
                    }}>
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-black"
                    style={{
                      fontFamily: "monospace",
                      background: active ? "rgba(255,255,255,0.2)" : "var(--bg-soft)",
                      color: active ? "#FFFFFF" : "var(--text-muted)"
                    }}>
                    {t.badge}
                  </div>
                </div>

                <div className="text-base font-black leading-snug" style={{ color: active ? "#FFFFFF" : "var(--text)" }}>
                  {t.title[locale] || t.title.en}
                </div>

                <div className="text-xs font-semibold leading-relaxed"
                  style={{ color: active ? "rgba(255,255,255,0.88)" : "var(--text-muted)", minHeight: 38 }}>
                  {t.desc[locale] || t.desc.en}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(t.chips[locale] || t.chips.en).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-[9.5px] font-extrabold"
                      style={{
                        background: active ? "rgba(255,255,255,0.18)" : "var(--bg-soft)",
                        color: active ? "#FFFFFF" : "var(--text-soft)",
                        border: "1px solid " + (active ? "rgba(255,255,255,0.22)" : "var(--border)")
                      }}>
                      {c}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {tool === "sizing" && <SizingTool />}

      {tool === "calculator" && (
        <section className="container-x py-6">
          <EngineeringCalculator locale={locale} />
        </section>
      )}
    </div>
  );
}