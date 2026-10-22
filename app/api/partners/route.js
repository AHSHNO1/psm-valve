import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getPartners, savePartners } from "@/lib/content";
import { validatePartners } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ partners: getPartners() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validatePartners(body?.partners);
  if (!result.ok) return err(result.error, 400);

  savePartners(result.items);
  revalidatePublic(["", "partners"]);
  return json();
}
