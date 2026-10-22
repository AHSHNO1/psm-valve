import { getCvTables, saveSeriesCv, deleteSeriesCv } from "@/lib/valve-cv";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json(getCvTables());
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = saveSeriesCv(body?.series, body?.sizes);
  if (!result.ok) {
    return err("اعتبارسنجی جداول CV ناموفق بود", 400, { errors: result.errors });
  }
  // جداول CV در ابزار سایزینگ و برگه‌های دادهٔ محصول استفاده می‌شوند.
  revalidatePublic(["sizing", "units", ""]);
  return json({ series: result.series, sizes: result.sizes });
}

export async function DELETE(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const series = new URL(request.url).searchParams.get("series") || "";
  const result = deleteSeriesCv(series);
  if (!result.ok) {
    return err("جدول CV یافت نشد", 404, { errors: result.errors });
  }
  revalidatePublic(["sizing", "units", ""]);
  return json();
}
