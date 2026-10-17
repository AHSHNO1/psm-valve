import { NextResponse } from "next/server";
import { getProducts } from "@/lib/product-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, products: getProducts() }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Unable to load public product catalog:", error);
    return NextResponse.json({ ok: false, error: "بارگذاری کاتالوگ ناموفق بود." }, { status: 500 });
  }
}
