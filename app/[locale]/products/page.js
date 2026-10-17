import ProductsMasonelian from "@/components/ProductsMasonelian";
import { getProducts } from "@/lib/product-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <ProductsMasonelian products={getProducts()} />;
}
