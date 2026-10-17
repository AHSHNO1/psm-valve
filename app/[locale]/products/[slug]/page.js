import { getProduct } from "@/lib/product-store";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { categories, getCategoryLabel } from "@/lib/categories";
import { SPEC_FIELDS } from "@/lib/spec-fields";
import ProductGallery from "@/components/ProductGallery";
import ProductTechnicalSpecifications from "@/components/ProductTechnicalSpecifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const pending = dict.products.pendingSpec;
  const L = {
    datasheet: dict.products.datasheet,
    back: dict.common.backToProducts,
    noImage: dict.products.noImage,
    cta: dict.common.requestQuote
  };
  const name = pick(p.name, locale);
  const short = pick(p.short, locale);
  const description = pick(p.description, locale) || short;
  const applications = pickArray(p.applications, locale);
  const features = pickArray(p.features, locale);
  const options = pickArray(p.options, locale);
  const clients = pickArray(p.clients, locale);
  const specifications = Array.isArray(p.specifications)
    ? p.specifications.map((row, index) => ({
      id: row.id || `specification-${index}`,
      label: pick(row.label, locale),
      value: pick(row.value, locale)
    }))
    : SPEC_FIELDS.map((field) => ({
      id: field.id,
      label: pick(field.label, locale),
      value: pick(p.spec?.[field.id], locale)
    }));
  const visibleSpecifications = specifications.filter((row) => row.label && row.value);
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

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <ProductGallery images={[p.image, p.image2]} name={name} noImage={L.noImage} />
        {category && (
          <div className="mt-4 text-sm font-semibold" style={{ color: "var(--text-soft)" }}>
            {getCategoryLabel(category, locale)}
          </div>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href={`/${locale}/contact`} className="btn-gold justify-center text-sm">
            {L.cta} <ArrowLeft size={14} className={rtl ? "" : "rotate-180"} />
          </Link>
          <a
            href={`/${locale}/datasheet/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline justify-center text-sm"
          >
            <Download size={16} /> {L.datasheet}
          </a>
        </div>
      </div>

      <div className="min-w-0">
        <ProductTechnicalSpecifications
          title={name}
          series={p.series}
          description={description}
          features={features}
          options={options}
          specifications={visibleSpecifications}
          applications={applications}
          clients={clients}
          emptyMessage={pending}
          language={locale}
        />
      </div>
      </div>
    </section>
  );
}
