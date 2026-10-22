import { getProduct } from "@/lib/product-store";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { getCategories } from "@/lib/category-store";
import { getCategoryLabel } from "@/lib/category-utils";
import { SPEC_FIELDS } from "@/lib/spec-fields";
import {
  buildMetadata,
  absoluteUrl,
  localeUrl,
  breadcrumbSchema,
  jsonLdScript,
  DEFAULT_OG_IMAGE
} from "@/lib/seo";
import { COMPANY } from "@/lib/company-info";
import { getCvCatalog, getSizingTables } from "@/lib/valve-cv";
import { estimatedTrimCurve } from "@/lib/valve-catalog";
import ProductGallery from "@/components/ProductGallery";
import ProductTechnicalSpecifications from "@/components/ProductTechnicalSpecifications";
import ProductCvCatalog from "@/components/ProductCvCatalog";

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

// متادیتای اختصاصی هر محصول: عنوان + توضیح + canonical/hreflang (lib/seo)
function toLatinDigits(value) {
  return String(value || "").replace(/[۰-۹٠-٩]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(d) % 10));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) return { robots: { index: false, follow: false } };

  const name = pick(p.name, locale) || pick(p.name, "en") || slug;
  const seriesStr = p.series ? String(p.series) : "";
  // فقط وقتی شمارهٔ سری در عنوان نیامده، آن را اضافه کن (جلوگیری از تکرار)
  const nameHasSeries = seriesStr && toLatinDigits(name).includes(toLatinDigits(seriesStr));
  const series = seriesStr && !nameHasSeries ? ` (${seriesStr})` : "";
  const short = pick(p.short, locale) || p.description?.[locale] || "";
  const suffix = { fa: "مشخصات فنی و جدول Cv", en: "Specifications & Cv table", ar: "المواصفات وجدول Cv", ru: "Характеристики и таблица Cv" }[locale] || "Specifications";

  return buildMetadata({
    locale,
    path: `/products/${slug}`,
    title: `${name}${series} — ${suffix}`,
    description: short ? short.slice(0, 160) : `${name}${series}. ${suffix}.`,
    type: "website",
    keywords: [name, seriesStr, "Cv", "control valve", "PSM Valve"].filter(Boolean),
    image: p.image || p.image2 || undefined,
    imageAlt: `${name}${series}`
  });
}

export default async function ProductPage({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) notFound();

  const dict = await getDictionary(locale);
  const categories = getCategories();
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
  const description = (p.description && p.description[locale]) || short;
  const seriesValue = p.series ? String(p.series) : "";
  const series = seriesValue && !toLatinDigits(name).includes(toLatinDigits(seriesValue))
    ? ` (${seriesValue})`
    : "";
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

  // آیا این سری در کاتالوگ Cv پوشش دارد؟ (اندازه‌گیری‌شده یا برآورد مهندسی)
  const catalog = getCvCatalog();
  const tables = getSizingTables();
  const seriesEntry = p.series ? tables.series[String(p.series)] : null;
  const hasCv = Boolean(seriesEntry && Array.isArray(seriesEntry.sizes) && seriesEntry.sizes.length > 0);

  // برای کلاینت فقط تریمِ نامی (بیشترین Cv) هر سایز می‌فرستیم؛ حجم payload کم شود
  const cvSizes = hasCv
    ? seriesEntry.sizes.map((s) => {
      const trims = Array.isArray(s.trims) ? s.trims : [];
      let rated = trims.find((t) => Number(t.cv) === Number(s.cv));
      if (!rated && trims.length) rated = trims.reduce((m, t) => (Number(t.cv) > Number(m.cv) ? t : m), trims[0]);
      return {
        dn: s.dn,
        nps: typeof s.nps === "number" ? s.nps : null,
        dnMm: typeof s.dnMm === "number" ? s.dnMm : null,
        cvMax: s.cv,
        source: s.source || "catalog",
        confidence: s.confidence || null,
        errorPct: typeof s.errorPct === "number" ? s.errorPct : null,
        rated: rated ? {
          cv: rated.cv,
          characteristic: rated.characteristic || null,
          ratio50: typeof rated.ratio50 === "number" ? rated.ratio50 : null,
          rangeability: typeof rated.rangeability === "number" ? rated.rangeability : null,
          curve: estimatedTrimCurve(seriesEntry, s, rated) || []
        } : null
      };
    })
    : [];

  const imageList = [p.image, p.image2].filter(Boolean);
  const productUrl = localeUrl(locale, `/products/${slug}`);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${name}${series}`,
    description: description || short || name,
    url: productUrl,
    image: (imageList.length ? imageList : [DEFAULT_OG_IMAGE]).map(absoluteUrl),
    sku: p.series ? String(p.series) : slug,
    category: category ? getCategoryLabel(category, locale, categories) : undefined,
    brand: { "@type": "Brand", name: "PSM Valve" },
    manufacturer: {
      "@type": "Organization",
      name: COMPANY.brandEn,
      url: "https://www.psmvalve.com"
    },
    additionalProperty: visibleSpecifications.slice(0, 12).map((row) => ({
      "@type": "PropertyValue",
      name: row.label,
      value: row.value
    }))
  };
  const breadcrumb = breadcrumbSchema([
    { name: dict.nav?.home || "Home", url: localeUrl(locale) },
    { name: dict.nav?.products || "Products", url: localeUrl(locale, "/products") },
    { name: `${name}${series}`, url: productUrl }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />
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
            {getCategoryLabel(category, locale, categories)}
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

      {hasCv && (
        <ProductCvCatalog
          locale={locale}
          seriesId={String(p.series)}
          openings={catalog.openings}
          sizes={cvSizes}
          provenance={seriesEntry.provenance || "measured"}
          estimate={seriesEntry.estimate || null}
          productSlug={slug}
        />
      )}
    </section>
    </>
  );
}
