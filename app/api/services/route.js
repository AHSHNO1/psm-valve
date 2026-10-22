import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getServices, saveServices } from "@/lib/content";
import { validateServices } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ services: getServices() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateServices(body?.services);
  if (!result.ok) return err(result.error, 400);

  const previous = getServices();
  saveServices(result.items);
  const slugs = new Set([
    ...previous.map((item) => item.slug),
    ...result.items.map((item) => item.slug)
  ]);
  const paths = ["", "services"];
  for (const slug of slugs) if (slug) paths.push(`services/${slug}`);
  revalidatePublic(paths);
  return json();
}
