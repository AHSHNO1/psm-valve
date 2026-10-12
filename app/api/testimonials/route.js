import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTestimonials, saveTestimonials } from "@/lib/content";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, testimonials: getTestimonials() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { testimonials } = await request.json();
  if (!Array.isArray(testimonials)) return NextResponse.json({ ok: false }, { status: 400 });
  saveTestimonials(testimonials);
  return NextResponse.json({ ok: true });
}
