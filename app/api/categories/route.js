import { getCatalog, saveCatalog, validateCatalog } from "@/lib/category-store";
import { getProducts } from "@/lib/product-store";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { pickLocalized } from "@/lib/category-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  try {
    const catalog = getCatalog();
    return json({ catalog, categories: catalog.categories });
  } catch (error) {
    console.error("Unable to load product catalog:", error);
    return err("بارگذاری دسته‌بندی‌ها ناموفق بود.", 500);
  }
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateCatalog(body && body.catalog ? body.catalog : body);
  if (!result.ok) return err(result.error, 400);

  const current = getCatalog();
  const nextIds = new Set(result.value.categories.map((category) => category.id));
  const products = getProducts();
  const removedWithProducts = current.categories.find((category) =>
    !nextIds.has(category.id) && products.some((product) => product.categoryId === category.id)
  );
  if (removedWithProducts) {
    const label = pickLocalized(removedWithProducts.name, "fa") || removedWithProducts.id;
    return err(`دسته «${label}» دارای محصول است؛ ابتدا محصولات آن را جابه‌جا یا حذف کنید.`, 409);
  }

  try {
    const catalog = saveCatalog(result.value);
    revalidatePublic([
      "",
      "products",
      ...products.map((product) => `products/${product.slug}`)
    ]);
    return json({ catalog });
  } catch (error) {
    console.error("Unable to save product catalog:", error);
    return err("ذخیره دسته‌بندی‌ها ناموفق بود.", 500);
  }
}
