import { getProduct, products } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileText, Tag, Layers } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { categories } from "@/lib/categories";

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

export default async function ProductPage({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) notFound();

  const dict = await getDictionary(locale);
  const category = categories.find((c) => c.id === p.categoryId);

  const name = pick(p.name, locale);
  const short = pick(p.short, locale);
  const applications = pickArray(p.applications, locale);
  const features = pickArray(p.features, locale);
  const specs = (p.specs || []).map((s) => ({
    key: pick(s.key, locale),
    value: pick(s.value, locale)
  }));

  const labels = {
    fa: { desc: "توضیحات", apps: "کاربردهای کلیدی", feats: "ویژگی‌ها و مزایا", datasheet: "دانلود دیتاشیت", install: "راهنمای نصب" },
    en: { desc: "Description", apps: "Key Applications", feats: "Features & Benefits", datasheet: "Download Datasheet", install: "Installation Guide" },
    ar: { desc: "الوصف", apps: "التطبيقات", feats: "الميزات", datasheet: "تحميل صحيفة البيانات", install: "دليل التركيب" },
    ru: { desc: "Описание", apps: "Применения", feats: "Функции", datasheet: "Скачать техпаспорт", install: "Руководство" }
  };
  const L = labels[locale] || labels.en;

  return (
    <section className="container-x pt-10 sm:pt-16 pb-16">
      <Link
        href={`/${locale}/products`}
        className="text-sm flex items-center gap-2 mb-6 hover:underline"
        style={{ color: "var(--gold)" }}
      >
        <ArrowLeft size={14} className="rtl:rotate-180" />
        {dict.common.backToProducts}
      </Link>

      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
          <span className="chip"><Tag size={12} /> {p.series}</span>
          {category && (
            <span className="chip"><Layers size={12} /> {pick(category.name, locale)}</span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black heading-grad leading-tight">
          {name}
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-glass p-6 sm:p-8">
            <h2 className="font-black text-lg sm:text-xl mb-4" style={{ color: "var(--gold)" }}>
              {L.desc}
            </h2>
            <p className="leading-8 text-sm sm:text-base" style={{ color: "var(--text-soft)" }}>{short}</p>
          </div>

          {applications.length > 0 && (
            <div className="card-glass p-6 sm:p-8">
              <h2 className="font-black text-lg sm:text-xl mb-4" style={{ color: "var(--gold)" }}>
                {L.apps}
              </h2>
              <div className="flex flex-wrap gap-2">
                {applications.map((app, i) => (
                  <span
                    key={i}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold"
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
        </div>

        <div className="space-y-5">
          <div className="card-glass p-6 sm:p-8">
            <h3 className="font-black text-base sm:text-lg mb-5" style={{ color: "var(--gold)" }}>
              {dict.products.specs}
            </h3>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {specs.map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between px-4 py-3 text-xs sm:text-sm gap-3"
                  style={{
                    background: i % 2 === 0 ? "transparent" : "var(--bg-soft)",
                    borderBottom: i < specs.length - 1 ? "1px solid var(--border)" : "none"
                  }}
                >
                  <span className="font-medium shrink-0" style={{ color: "var(--text-soft)" }}>{s.key}</span>
                  <span className="font-bold text-right" style={{ color: "var(--text)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass p-6 sm:p-8 space-y-3">
            <Link href={`/${locale}/contact`} className="btn-gold w-full justify-center text-sm">
              {dict.common.requestQuote} <ArrowLeft size={14} />
            </Link>
            <a
              href={`/${locale}/products/${slug}/datasheet`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full justify-center text-sm"
            >
              <Download size={16} /> {L.datasheet}
            </a>
            <button className="btn-outline w-full justify-center text-sm">
              <FileText size={16} /> {L.install}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
