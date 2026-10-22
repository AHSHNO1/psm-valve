import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getCertificates, saveCertificates } from "@/lib/content";
import { validateCertificates } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ certificates: getCertificates() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateCertificates(body?.certificates);
  if (!result.ok) return err(result.error, 400);

  saveCertificates(result.items);
  revalidatePublic(["", "about"]);
  return json();
}
