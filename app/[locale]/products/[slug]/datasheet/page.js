import { getProduct, products } from "@/lib/products";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/getDictionary";
import DatasheetPrint from "@/components/DatasheetPrint";

export async function generateStaticParams() {
  const { locales } = await import("@/lib/i18n");
  return locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug }))
  );
}

export default async function DatasheetPage({ params }) {
  const { locale, slug } = params;
  const p = getProduct(slug);
  if (!p) notFound();
  const dict = await getDictionary(locale);

  return <DatasheetPrint product={p} locale={locale} dict={dict} />;
}
