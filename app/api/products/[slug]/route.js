import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteProduct, getProduct, updateProduct } from "@/lib/product-store";
import { isProductCategory } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const product = getProduct(params.slug);
    if (!product) return NextResponse.json({ ok: false, error: "محصول پیدا نشد." }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error("Unable to load product:", error);
    return NextResponse.json({ ok: false, error: "بارگذاری محصول ناموفق بود." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return NextResponse.json({ ok: false, error: "اطلاعات محصول معتبر نیست." }, { status: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(updates, "categoryId") && !isProductCategory(updates.categoryId)) {
    return NextResponse.json({ ok: false, error: "دسته‌بندی محصول معتبر نیست." }, { status: 400 });
  }

  try {
    if (!updateProduct(params.slug, updates)) {
      return NextResponse.json({ ok: false, error: "محصول پیدا نشد." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to update product:", error);
    return NextResponse.json({ ok: false, error: "ذخیره تغییرات محصول ناموفق بود." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    if (!deleteProduct(params.slug)) {
      return NextResponse.json({ ok: false, error: "محصول پیدا نشد." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete product:", error);
    return NextResponse.json({ ok: false, error: "حذف محصول ناموفق بود." }, { status: 500 });
  }
}
