import Link from "next/link";
import { Target, Calculator, Sparkles } from "lucide-react";
import SizingTool from "@/components/SizingTool";
import EngineeringCalculator from "@/components/EngineeringCalculator";
import "./sizing-hub.css";

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
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="sizing-hub-root"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-x pt-8 pb-3">
        {/* ===== Hero ===== */}
        <div className="text-center max-w-[720px] mx-auto mb-7">
          <div className="hub-badge">
            <Sparkles size={12} />
            {H.badge}
          </div>

          <h1 className="hub-title">
            <span className="heading-grad">{H.title1}</span>{H.title2}
          </h1>

          <p className="hub-sub">
            {H.sub}
          </p>
        </div>

        {/* ===== Tool Tabs ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[900px] mx-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            const href = "/" + locale + "/sizing?tool=" + t.id;
            return (
              <Link
                key={t.id}
                href={href}
                scroll={false}
                className={"hub-card" + (active ? " hub-card-active" : "")}
                style={{ "--card-accent": t.accent }}
              >
                <div className="hub-card-top">
                  <div
                    className="hub-card-icon"
                    style={{
                      background: active
                        ? "rgba(255,255,255,0.22)"
                        : t.accent + "18",
                      color: active ? "#FFFFFF" : t.accent
                    }}
                  >
                    <Icon size={22} strokeWidth={2.4} />
                  </div>
                  <div className="hub-card-badge">
                    {t.badge}
                  </div>
                </div>

                <div className="hub-card-title">
                  {t.title[locale] || t.title.en}
                </div>

                <div className="hub-card-desc">
                  {t.desc[locale] || t.desc.en}
                </div>

                <div className="hub-card-chips">
                  {(t.chips[locale] || t.chips.en).map((c, i) => (
                    <span key={i} className="hub-chip">{c}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== Tool Content ===== */}
      <div className="hub-content-wrapper">
        {tool === "sizing" && <SizingTool />}

        {tool === "calculator" && (
          <section className="container-x py-6">
            <EngineeringCalculator locale={locale} />
          </section>
        )}
      </div>
    </div>
  );
}