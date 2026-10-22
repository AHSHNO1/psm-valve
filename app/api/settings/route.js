import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getSettings, updateSettings } from "@/lib/db";
import { whitelistKeys } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// کلیدهای شناخته‌شده = کلیدهای موجود در data/settings.json + چند کلید مستندِ اضافی.
// updatedAt توسط updateSettings مدیریت می‌شود اما در بدنه مجاز است.
export const KNOWN_SETTINGS_KEYS = [
  "siteName", "siteNameEn", "tagline", "slogan", "description",
  "phone", "phone2", "mobile", "mobile2", "fax",
  "email", "email2", "address", "addressFactory", "postalCode",
  "country", "website", "social", "branding", "companyVideoUrl",
  // اضافی‌های مستند:
  "seoTitle", "seoDescription", "mapUrl", "workingHours",
  "updatedAt"
];

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ settings: getSettings() });
}

export async function PATCH(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = whitelistKeys(body, KNOWN_SETTINGS_KEYS);
  if (!result.ok) return err(result.error, 400, result.unknown ? { unknownKeys: result.unknown } : undefined);

  const updated = updateSettings(result.data);
  // تنظیمات در فوتر/تماس و چیدمان سراسری استفاده می‌شود.
  revalidatePublic(["contact"], { layout: true });
  return json({ settings: updated });
}
