import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getBranding, saveBranding } from "@/lib/content";
import { whitelistKeys } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// کلیدهای شناخته‌شده = کلیدهای موجود در data/branding.json + چند کلید مستندِ اضافی.
export const KNOWN_BRANDING_KEYS = [
  "logo", "logoLight", "logoIcon", "favicon",
  "primaryColor", "secondaryColor", "socialLinks",
  // اضافی‌های مستند:
  "fontFamily", "themeRadius"
];

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ branding: getBranding() });
}

export async function PATCH(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = whitelistKeys(body, KNOWN_BRANDING_KEYS);
  if (!result.ok) return err(result.error, 400, result.unknown ? { unknownKeys: result.unknown } : undefined);

  const updated = saveBranding(result.data);
  // برندینگ در چیدمان سراسری (هدر/فوتر) و تماس استفاده می‌شود.
  revalidatePublic(["contact"], { layout: true });
  return json({ branding: updated });
}
