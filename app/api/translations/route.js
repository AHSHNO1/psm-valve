import { getTranslations, saveTranslations, validateTranslations } from "@/lib/translations";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ translations: getTranslations() });
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  if (!validateTranslations(body?.translations)) {
    return err("ساختار ترجمه‌ها معتبر نیست یا شامل فیلدهای ناشناخته است", 400);
  }

  try {
    const translations = saveTranslations(body.translations);
    // ترجمه‌ها از طریق دیکشنری در همهٔ صفحات استفاده می‌شوند.
    revalidatePublic([], { layout: true });
    return json({ translations });
  } catch (error) {
    console.error("Failed to save site translations:", error);
    return err("ذخیرهٔ ترجمه‌ها ناموفق بود", 500);
  }
}
