import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

function readProducts() {
  const filePath = path.join(process.cwd(), "lib", "products.js");
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/export const products = (\[[\s\S]*?\]);/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function writeProducts(products) {
  const filePath = path.join(process.cwd(), "lib", "products.js");
  const content = `// Auto-generated products database
// Edited via admin panel

export const products = ${JSON.stringify(products, null, 2)};

export function getProduct(slug) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categoryId) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getAllProducts() {
  return products;
}
`;
  fs.writeFileSync(filePath, content, "utf8");
}

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, products: readProducts() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const product = await request.json();

    if (!product.slug || !product.series || !product.name?.fa) {
      return NextResponse.json({ ok: false, error: "فیلدهای الزامی خالی است" }, { status: 400 });
    }

    const list = readProducts();
    if (list.find((x) => x.slug === product.slug)) {
      return NextResponse.json({ ok: false, error: "این نامک قبلاً استفاده شده" }, { status: 400 });
    }

    list.push(product);
    writeProducts(list);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
