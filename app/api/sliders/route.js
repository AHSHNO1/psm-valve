import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getSliders, saveSliders } from "@/lib/content";
import { validateSliders } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ sliders: getSliders() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateSliders(body?.sliders);
  if (!result.ok) return err(result.error, 400);

  saveSliders(result.items);
  revalidatePublic([""]);
  return json();
}
