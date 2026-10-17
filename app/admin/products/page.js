import { getProducts } from "@/lib/product-store";
import { categories } from "@/lib/categories";
import ProductsClient from "@/components/admin/ProductsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return <ProductsClient products={getProducts()} categories={categories} />;
}
