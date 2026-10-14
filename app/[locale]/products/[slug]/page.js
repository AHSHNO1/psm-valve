import { getProduct, products } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, ImageOff } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { categories } from "@/lib/categories";
import { SPEC_FIELDS, SPEC_PENDING } from "@/lib/spec-fields";

export async function generateStaticParams() {
  const { locales } = await import("@/lib/i18n");
  return locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug }))
  );
}

function pick(obj, locale) {
  if (!obj) return "";
  return obj[locale] || obj.en || obj.fa || "";
}

function pickArray(obj, locale) {
  if (!obj) return [];
  return obj[locale] || obj.en || obj.fa || [];
}

const LABELS = {
  fa: { specs: "جدول مشخصات فنی", apps: "کاربردهای کلیدی", feats: "ویژگیها و مزایا", datasheet: "دانلود دیتاشیت", back: "بازگشت به محصولات", series: "سری", noImage: "تصویر بهزودی", cta: "درخواست مشاوره و قیمت", ctaSub: "کارشناسان ما برای انتخاب و سایزینگ آماده پاسخگویی هستند." },
  en: { specs: "Technical Specifications", apps: "Key Applications", feats: "Features & Benefits", datasheet: "Download Datasheet", back: "Back to products", series: "Series", noImage: "Image coming soon", cta: "Request a quote", ctaSub: "Our engineers are ready to help you select and size the right valve." },
  ar: { specs: "المواصفات الفنية", apps: "التطبيقات الرئيسية", feats: "الميزات والفوائد", datasheet: "تحميل صحيفة البيانات", back: "العودة إلى المنتجات", series: "الفئة", noImage: "الصورة قريباً", cta: "طلب استشارة وعرض سعر", ctaSub: "مهندسونا جاهزون لمساعدتك في اختيار الصمام المناسب." },
  ru: { specs: "Технические характеристики", apps: "Основные применения", feats: "Функции и преимущества", datasheet: "Скачать техпаспорт", back: "Назад к продукции", series: "Серия", noImage: "Изображение скоро", cta: "Запросить предложение", ctaSub: "Наши инженеры помогут подобрать и рассчитать нужный клапан." }
};

export default async function ProductPage({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) notFound();

  const dict = await getDictionary(locale);
  const category = categories.find((c) => c.id === p.categoryId);
  const L = LABELS[locale] || LABELS.en;
  const pending = SPEC_PENDING[locale] || SPEC_PENDING.en;

  const name = pick(p.name, locale);
  const short = pick(p.short, locale);
  const applications = pickArray(p.applications, locale);
  const features = pickArray(p.features, locale);
  const spec = p.spec || {};
  const specRows = SPEC_FIELDS.map((f) => ({
    id: f.id,
    label: pick(f.label, locale),
    value: pick(spec[f.id], locale)
  }));
  const filledCount = specRows.filter((r) => r.value).length;
  const rtl = locale === "fa" || locale === "ar";

  return (
    <section className="container-x pt-8 sm:pt-12">
      <Link
        href={`/${locale}/products`}
        className="inline-flex items-center gap-2 text-sm font-bold mb-6 hover:underline"
        style={{ color: "var(--gold)" }}
      >
        <ArrowLeft size={16} className={rtl ? "" : "rotate-180"} /> {L.back}
      </Link>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <div
            className="rounded-3xl overflow-hidden bg-white grid place-items-center min-h-[320px] sm:min-h-[460px]"
            style={{ border: "1px solid var(--border)" }}
          >
            {p.image ? (
              <img src={p.image} alt={name} className="w-full h-auto max-h-[560px] object-contain p-6" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-16" style={{ color: "var(--text-soft)" }}>
                <ImageOff size={40} />
                <span className="text-sm">{L.noImage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1 rounded-lg text-xs font-black"
              style={{ background: "rgba(201, 149, 13, 0.15)", color: "#B8850A" }}
            >
              {L.series} {p.series}
            </span>
            {category && (
              <span
                className="px-3 py-1 rounded-lg text-xs font-bold"
                style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--text-soft)" }}
              >
                {pick(category.name, locale)}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: "var(--text)" }}>
            {name}
          </h1>

          {short && (
            <p className="text-base sm:text-lg leading-8" style={{ color: "var(--text-soft)" }}>
              {short}
            </p>
          )}

          <div className="card-glass p-6 space-y-3">
            <div className="font-black text-base" style={{ color: "var(--text)" }}>{L.cta}</div>
            <p className="text-sm leading-7" style={{ color: "var(--text-soft)" }}>{L.ctaSub}</p>
            <Link href={`/${locale}/contact`} className="btn-gold w-full justify-center text-sm">
              {dict.common.requestQuote} <ArrowLeft size={14} className={rtl ? "" : "rotate-180"} />
            </Link>
            <a
              href={`/${locale}/products/${slug}/datasheet`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full justify-center text-sm"
            >
              <Download size={16} /> {L.datasheet}
            </a>
          </div>
        </div>
      </div>


      <div className="mt-12 sm:mt-16 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 card-glass p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="font-black text-lg sm:text-xl" style={{ color: "var(--gold)" }}>{L.specs}</h2>
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {filledCount} / {SPEC_FIELDS.length}
            </span>
          </div>
          <dl>
            {specRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-5 gap-4 py-3.5 text-sm sm:text-base"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <dt className="col-span-2 font-medium" style={{ color: "var(--text-soft)" }}>{row.label}</dt>
                <dd className="col-span-3 font-bold" style={{ color: row.value ? "var(--text)" : "var(--text-muted)" }}>
                  {row.value || pending}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {applications.length > 0 && (
            <div className="card-glass p-6 sm:p-8">
              <h2 className="font-black text-lg mb-5" style={{ color: "var(--gold)" }}>{L.apps}</h2>
              <div className="flex flex-wrap gap-2">
                {applications.map((app, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {features.length > 0 && (
            <div className="card-glass p-6 sm:p-8">
              <h2 className="font-black text-lg mb-5" style={{ color: "var(--gold)" }}>{L.feats}</h2>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base" style={{ color: "var(--text)" }}>
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
