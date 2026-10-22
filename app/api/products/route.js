import { isProductCategory } from "@/lib/category-store";
import { createProduct, getProducts } from "@/lib/product-store";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  try {
    return json({ products: getProducts() });
  } catch (error) {
    console.error("Unable to load products:", error);
    return err("بارگذاری محصولات ناموفق بود.", 500);
  }
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const product = await readJson(request);
  if (isResponse(product)) return product;

  if (!product || typeof product !== "object" || Array.isArray(product) ||
      typeof product.slug !== "string" || !/^[a-z0-9-]+$/.test(product.slug) ||
      typeof product.series !== "string" || !product.series.trim() ||
      !isProductCategory(product.categoryId) ||
      !product.name || typeof product.name.fa !== "string" || !product.name.fa.trim()) {
    return err("فیلدهای الزامی محصول معتبر نیست.", 400);
  }

  try {
    if (!createProduct(product)) {
      return err("این نامک قبلاً استفاده شده.", 409);
    }
    revalidatePublic(["", "products", `products/${product.slug}`, `products/${product.slug}/datasheet`, "sizing"]);
    return json({}, { status: 201 });
  } catch (error) {
    console.error("Unable to create product:", error);
    return err("ذخیره محصول ناموفق بود.", 500);
  }
}
