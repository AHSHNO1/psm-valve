import { getProducts } from "@/lib/product-store";
import { getCvTables } from "@/lib/valve-cv";
import CvTablesClient from "@/components/admin/CvTablesClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "جدول Cv محصولات | پنل مدیریت",
  robots: { index: false, follow: false }
};

export default function CvTablesPage() {
  const products = getProducts().map((product) => ({
    slug: product.slug,
    series: product.series,
    name: product.name,
    categoryId: product.categoryId,
    size: product.spec && product.spec.size
  }));

  const tables = getCvTables();

  return <CvTablesClient products={products} initial={tables.series} />;
}
