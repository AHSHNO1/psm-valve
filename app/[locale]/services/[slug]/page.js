import { getAllServices, getServiceBySlug } from "@/lib/service-store";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Cog, Gauge, Wrench, Circle, Flame, Settings } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata, localeUrl, breadcrumbSchema, jsonLdScript, absoluteUrl } from "@/lib/seo";
import { COMPANY } from "@/lib/company-info";
import MediaImage from "@/components/MediaImage";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Settings };

export async function generateStaticParams() {
  const { locales } = await import("@/lib/i18n");
  return locales.flatMap((locale) =>
    getAllServices().map((s) => ({ locale, slug: s.slug }))
  );
}

function pick(obj, locale) {
  if (!obj) return "";
  return obj[locale] || obj.en || obj.fa || "";
}

function pickArray(obj, locale) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return obj[locale] || obj.en || obj.fa || [];
}

export async function generateMetadata({ params }) {
  const { locale, slug } = params;
  const s = getServiceBySlug(slug);
  if (!s) return { robots: { index: false, follow: false } };
  const name = pick(s.name, locale) || slug;
  const short = pick(s.short, locale);
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: name,
    description: short ? short.slice(0, 160) : name,
    keywords: [name, "PSM Valve", "industrial valve service"].filter(Boolean),
    image: s.image || undefined,
    imageAlt: name
  });
}

export default async function ServiceDetailPage({ params }) {
  const { locale, slug } = params;
  const s = getServiceBySlug(slug);
  if (!s) notFound();

  const dict = await getDictionary(locale);
  const Icon = ICONS[s.icon] || Cog;
  const name = pick(s.name, locale);
  const short = pick(s.short, locale);
  const features = pickArray(s.features, locale);
  const serviceUrl = localeUrl(locale, `/services/${slug}`);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: name,
    description: short || name,
    url: serviceUrl,
    image: s.image ? absoluteUrl(s.image) : undefined,
    provider: {
      "@type": "Organization",
      name: COMPANY.brandEn,
      url: "https://www.psmvalve.com"
    }
  };
  const breadcrumb = breadcrumbSchema([
    { name: dict.nav?.home || "Home", url: localeUrl(locale) },
    { name: dict.nav?.services || "Services", url: localeUrl(locale, "/services") },
    { name, url: serviceUrl }
  ]);

  const labels = {
    fa: { back: "بازگشت به خدمات", desc: "توضیحات", feats: "ویژگیها", cta: "درخواست مشاوره", imageSoon: "تصویر بهزودی" },
    en: { back: "Back to Services", desc: "Description", feats: "Highlights", cta: "Request Consultation", imageSoon: "Image coming soon" },
    ar: { back: "العودة إلى الخدمات", desc: "الوصف", feats: "أبرز النقاط", cta: "طلب استشارة", imageSoon: "الصورة قريباً" },
    ru: { back: "Назад к услугам", desc: "Описание", feats: "Особенности", cta: "Запросить консультацию", imageSoon: "Изображение скоро" }
  };
  const L = labels[locale] || labels.en;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />
    <section className="container-x pt-10 sm:pt-16 pb-16">
      <Link
        href={`/${locale}/services`}
        className="text-sm flex items-center gap-2 mb-6 hover:underline"
        style={{ color: "var(--gold)" }}
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {L.back}
      </Link>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black heading-grad leading-tight mb-8 sm:mb-10">
        {name}
      </h1>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        <div className="card-glass p-4 sm:p-6">
          <div
            className="rounded-xl overflow-hidden grid place-items-center min-h-[280px] bg-[var(--bg-soft)]"
            style={{ border: "1px solid var(--border)" }}
          >
            {s.image ? (
              <MediaImage
                src={s.image}
                alt={name}
                width={1200}
                height={900}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto max-h-[480px] object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12" style={{ color: "var(--text-soft)" }}>
                <Icon size={40} />
                <span className="text-sm">{L.imageSoon}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-glass p-6 sm:p-8">
            <h2 className="font-black text-lg sm:text-xl mb-4" style={{ color: "var(--gold)" }}>
              {L.desc}
            </h2>
            <p className="leading-8 text-sm sm:text-base" style={{ color: "var(--text-soft)" }}>
              {short}
            </p>
          </div>

          {features.length > 0 && (
            <div className="card-glass p-6 sm:p-8">
              <h2 className="font-black text-lg sm:text-xl mb-5" style={{ color: "var(--gold)" }}>
                {L.feats}
              </h2>
              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm sm:text-base" style={{ color: "var(--text)" }}>
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-glass p-6 sm:p-8">
            <Link href={`/${locale}/contact`} className="btn-gold w-full justify-center text-sm">
              {L.cta} <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
