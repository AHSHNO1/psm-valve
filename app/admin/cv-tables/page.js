import { getProducts } from "@/lib/product-store";
import { buildSizingCatalog } from "@/lib/valve-catalog";
import { getCvTables, getCvCatalogSummary, getSizingTablesForClient } from "@/lib/valve-cv";
import CvTablesClient from "@/components/admin/CvTablesClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "جدول Cv محصولات | پنل مدیریت",
  robots: { index: false, follow: false }
};

export default function CvTablesPage() {
  const all = getProducts();

  // همان شرطی که صفحهٔ سایزینگ استفاده می‌کند: بازهٔ سایز از spec یا از NPS جدول Cv
  const sizingTables = getSizingTablesForClient();
  const sizingSeries = new Set(
    buildSizingCatalog(all, sizingTables.series).map((product) => product.series)
  );

  const products = all.map((product) => ({
    slug: product.slug,
    series: product.series,
    name: product.name,
    categoryId: product.categoryId,
    sizeText: product.spec && product.spec.size,
    inSizing: sizingSeries.has(product.series)
  }));

  const tables = getCvTables();
  const catalog = getCvCatalogSummary();

  return <CvTablesClient products={products} initial={tables.series} catalog={catalog} />;
}
