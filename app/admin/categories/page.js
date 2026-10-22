import CategoriesClient from "@/components/admin/CategoriesClient";
import ContentStudioNav from "@/components/admin/ContentStudioNav";
import { getCatalog } from "@/lib/category-store";
import { getProducts } from "@/lib/product-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <ContentStudioNav />
      <CategoriesClient initialCatalog={getCatalog()} products={getProducts()} />
    </div>
  );
}
