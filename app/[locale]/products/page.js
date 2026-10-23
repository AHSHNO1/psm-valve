import ProductsMasonelian from "@/components/ProductsMasonelian";
import { getProducts } from "@/lib/product-store";
import { getCategories, getCatalogHeader } from "@/lib/category-store";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const header = getCatalogHeader();
  const seo = pageSeo(locale, "products");
  const heading = [header.title1?.[locale], header.title2?.[locale]].filter(Boolean).join(" ").trim();
  return buildMetadata({
    locale,
    path: "/products",
    title: heading || seo.title,
    description: header.description?.[locale] || seo.description,
    keywords: seo.keywords
  });
}

export default async function ProductsPage() {
  return (
    <ProductsMasonelian
      products={getProducts()}
      categories={getCategories()}
      header={getCatalogHeader()}
    />
  );
}
