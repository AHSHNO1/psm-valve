import { products } from "@/lib/products";
import { categories } from "@/lib/categories";
import ProductsClient from "@/components/admin/ProductsClient";

export default function AdminProductsPage() {
  return <ProductsClient products={products} categories={categories} />;
}
