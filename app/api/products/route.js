import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createProduct, getProducts } from "@/lib/product-store";
import { isProductCategory } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, products: getProducts() });
  } catch (error) {
    console.error("Unable to load products:", error);
    return NextResponse.json({ ok: false, error: "بارگذاری محصولات ناموفق بود." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let product;
  try {
    product = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }

  if (!product || typeof product !== "object" || Array.isArray(product) ||
      typeof product.slug !== "string" || !/^[a-z0-9-]+$/.test(product.slug) ||
      typeof product.series !== "string" || !product.series.trim() ||
      !isProductCategory(product.categoryId) ||
      !product.name || typeof product.name.fa !== "string" || !product.name.fa.trim()) {
    return NextResponse.json({ ok: false, error: "فیلدهای الزامی محصول معتبر نیست." }, { status: 400 });
  }

  try {
    if (!createProduct(product)) {
      return NextResponse.json({ ok: false, error: "این نامک قبلاً استفاده شده." }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to create product:", error);
    return NextResponse.json({ ok: false, error: "ذخیره محصول ناموفق بود." }, { status: 500 });
  }
}
