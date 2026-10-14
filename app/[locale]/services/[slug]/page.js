import { services, getService } from "@/lib/services";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Cog, Gauge, Wrench, Circle, Flame, Settings } from "lucide-react";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Settings };

export async function generateStaticParams() {
  const { locales } = await import("@/lib/i18n");
  return locales.flatMap((locale) =>
    services.map((s) => ({ locale, slug: s.slug }))
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

export default async function ServiceDetailPage({ params }) {
  const { locale, slug } = params;
  const s = getService(slug);
  if (!s) notFound();

  const Icon = ICONS[s.icon] || Cog;
  const name = pick(s.name, locale);
  const short = pick(s.short, locale);
  const features = pickArray(s.features, locale);

  const labels = {
    fa: { back: "بازگشت به خدمات", desc: "توضیحات", feats: "ویژگیها", cta: "درخواست مشاوره", imageSoon: "تصویر بهزودی" },
    en: { back: "Back to Services", desc: "Description", feats: "Highlights", cta: "Request Consultation", imageSoon: "Image coming soon" },
    ar: { back: "العودة إلى الخدمات", desc: "الوصف", feats: "أبرز النقاط", cta: "طلب استشارة", imageSoon: "الصورة قريباً" },
    ru: { back: "Назад к услугам", desc: "Описание", feats: "Особенности", cta: "Запросить консультацию", imageSoon: "Изображение скоро" }
  };
  const L = labels[locale] || labels.en;

  return (
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
            className="rounded-xl overflow-hidden grid place-items-center min-h-[280px] bg-white"
            style={{ border: "1px solid var(--border)" }}
          >
            {s.image ? (
              <img
                src={s.image}
                alt={name}
                className="w-full h-auto max-h-[480px] object-contain p-4"
                loading="lazy"
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
  );
}
