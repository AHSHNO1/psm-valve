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

export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const list = readProducts();
  const p = list.find((x) => x.slug === params.slug);
  if (!p) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, product: p });
}

export async function PATCH(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const updates = await request.json();
    const list = readProducts();
    const idx = list.findIndex((x) => x.slug === params.slug);
    if (idx === -1) return NextResponse.json({ ok: false, error: "محصول یافت نشد" }, { status: 404 });

    list[idx] = { ...list[idx], ...updates, slug: params.slug };
    writeProducts(list);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const list = readProducts();
  const filtered = list.filter((x) => x.slug !== params.slug);
  writeProducts(filtered);
  return NextResponse.json({ ok: true });
}
