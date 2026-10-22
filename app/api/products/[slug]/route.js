import { isProductCategory } from "@/lib/category-store";
import { deleteProduct, getProduct, updateProduct } from "@/lib/product-store";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function productPaths(slug) {
  return ["", "products", `products/${slug}`, `products/${slug}/datasheet`, "sizing"];
}

export async function GET(request, { params }) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  try {
    const product = getProduct(params.slug);
    if (!product) return err("محصول پیدا نشد.", 404);
    return json({ product });
  } catch (error) {
    console.error("Unable to load product:", error);
    return err("بارگذاری محصول ناموفق بود.", 500);
  }
}

export async function PATCH(request, { params }) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const updates = await readJson(request);
  if (isResponse(updates)) return updates;
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return err("اطلاعات محصول معتبر نیست.", 400);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "categoryId") && !isProductCategory(updates.categoryId)) {
    return err("دسته‌بندی محصول معتبر نیست.", 400);
  }

  try {
    if (!updateProduct(params.slug, updates)) {
      return err("محصول پیدا نشد.", 404);
    }
    revalidatePublic(productPaths(params.slug));
    return json();
  } catch (error) {
    console.error("Unable to update product:", error);
    return err("ذخیره تغییرات محصول ناموفق بود.", 500);
  }
}

export async function DELETE(request, { params }) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  try {
    if (!deleteProduct(params.slug)) {
      return err("محصول پیدا نشد.", 404);
    }
    revalidatePublic(productPaths(params.slug));
    return json();
  } catch (error) {
    console.error("Unable to delete product:", error);
    return err("حذف محصول ناموفق بود.", 500);
  }
}
