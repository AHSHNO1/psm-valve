import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCvTables, saveSeriesCv, deleteSeriesCv } from "@/lib/valve-cv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...getCvTables() });
}

export async function PUT(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["بدنهٔ JSON معتبر نیست."] }, { status: 400 });
  }

  const result = saveSeriesCv(body?.series, body?.sizes);
  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }
  return NextResponse.json({ ok: true, series: result.series, sizes: result.sizes });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const series = new URL(request.url).searchParams.get("series") || "";
  const result = deleteSeriesCv(series);
  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
