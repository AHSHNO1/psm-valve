import { getProduct } from "@/lib/product-store";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";
import { getCompanyInfo } from "@/lib/company-info";
import { isValidLocale } from "@/lib/i18n";
import DatasheetPrint from "@/components/DatasheetPrint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATASHEET_LABEL = {
  fa: "دیتاشیت",
  en: "Datasheet",
  ar: "صحيفة بيانات",
  ru: "Паспорт изделия"
};

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  const name = product?.name?.[locale] || product?.name?.en || product?.name?.fa || product?.series;
  return {
    title: product
      ? `${DATASHEET_LABEL[locale] || "Datasheet"} — ${name}`
      : "Datasheet",
    robots: { index: false, follow: false }
  };
}

export default async function DatasheetPage({ params }) {
  const { locale, slug } = await params;
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
