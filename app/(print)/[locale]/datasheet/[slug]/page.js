import { getProduct } from "@/lib/product-store";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";
import { getCompanyInfo } from "@/lib/company-info";
import { isValidLocale } from "@/lib/i18n";
import DatasheetPrint from "@/components/DatasheetPrint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const product = getProduct(params.slug);
  return {
    title: product
      ? `Datasheet — ${product.name?.fa || product.name?.en || product.series}`
      : "Datasheet",
    robots: { index: false, follow: false }
  };
}

export default async function DatasheetPage({ params }) {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const product = getProduct(slug);
  if (!product) notFound();

  const dict = await getDictionary(locale);
  const company = getCompanyInfo();

  return (
    <DatasheetPrint
      product={product}
      locale={locale}
      dict={dict}
      company={company}
    />
  );
}
