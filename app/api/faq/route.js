import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getFaqs, saveFaqs } from "@/lib/content";
import { validateFaqs } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ faqs: getFaqs() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateFaqs(body?.faqs);
  if (!result.ok) return err(result.error, 400);

  saveFaqs(result.items);
  revalidatePublic(["", "faq"]);
  return json();
}
