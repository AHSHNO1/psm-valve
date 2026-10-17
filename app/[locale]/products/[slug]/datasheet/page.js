import { getProduct } from "@/lib/product-store";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";
import { getCompanyInfo } from "@/lib/company-info";
import DatasheetPrint from "@/components/DatasheetPrint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DatasheetPage({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) notFound();
  const dict = await getDictionary(locale);
  const company = getCompanyInfo();

  return <DatasheetPrint product={p} locale={locale} dict={dict} company={company} />;
}
