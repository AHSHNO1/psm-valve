import { getCompanyInfo, saveCompanyInfo, validateCompanyInfo } from "@/lib/company-info";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ company: getCompanyInfo() });
}

export async function PUT(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  if (!validateCompanyInfo(body?.company)) {
    return err("اطلاعات شرکت معتبر نیست", 400);
  }

  try {
    const company = saveCompanyInfo(body.company);
    // اطلاعات شرکت در فوتر/تماس و چیدمان سراسری استفاده می‌شود.
    revalidatePublic(["contact"], { layout: true });
    return json({ company });
  } catch (error) {
    console.error("Failed to save company information:", error);
    return err("ذخیره اطلاعات شرکت ناموفق بود", 500);
  }
}
