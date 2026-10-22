import { getContent, updateContent } from "@/lib/content";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ content: getContent() });
}

export async function PATCH(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return err("ساختار محتوای ارسالی معتبر نیست", 400);
  }
  try {
    const updated = updateContent(body);
    // محتوا در صفحهٔ اصلی، دربارهٔ ما و چیدمان سراسری استفاده می‌شود.
    revalidatePublic([], { layout: true });
    return json({ content: updated });
  } catch (error) {
    console.error("Failed to save site content:", error);
    return err("ذخیرهٔ محتوای سایت ناموفق بود", 500);
  }
}
