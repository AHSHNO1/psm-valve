import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getProjects, saveProjects } from "@/lib/content";
import { locales } from "@/lib/i18n";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, projects: getProjects() });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { projects } = await request.json();
  if (!Array.isArray(projects)) return NextResponse.json({ ok: false }, { status: 400 });
  const projectsWithoutImages = projects.filter((project) =>
    !project ||
    typeof project.image !== "string" ||
    !/^\/(?:uploads\/images|images\/projects)\/[a-zA-Z0-9._-]+$/i.test(project.image)
  );
  if (projectsWithoutImages.length > 0) {
    return NextResponse.json(
      { ok: false, error: "برای ذخیره و انتشار هر پروژه، تصویر معتبر آن را بارگذاری کنید." },
      { status: 400 }
    );
  }
  saveProjects(projects);
  for (const locale of locales) revalidatePath(`/${locale}/projects`);
  return NextResponse.json({ ok: true });
}
