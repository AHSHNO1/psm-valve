import { getSiteChrome, saveSiteChrome, validateSiteChrome } from "@/lib/site-chrome";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ settings: getSiteChrome() });
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  if (!validateSiteChrome(body?.settings)) {
    return err("تنظیمات چیدمان معتبر نیست", 400);
  }

  try {
    const settings = saveSiteChrome(body.settings);
    // چیدمان هدر/فوتر در چیدمان سراسری همهٔ صفحات استفاده می‌شود.
    revalidatePublic([], { layout: true });
    return json({ settings });
  } catch (error) {
    console.error("Failed to save header and footer settings:", error);
    return err("ذخیرهٔ چیدمان هدر و فوتر ناموفق بود", 500);
  }
}
