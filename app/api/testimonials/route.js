import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";
import { getTestimonials, saveTestimonials } from "@/lib/content";
import { validateTestimonials } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ testimonials: getTestimonials() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const result = validateTestimonials(body?.testimonials);
  if (!result.ok) return err(result.error, 400);

  saveTestimonials(result.items);
  revalidatePublic(["", "why-us"]);
  return json();
}
