import { getProjects, saveProjects } from "@/lib/content";
import { guard, readJson, json, err, isResponse, revalidatePublic } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;
  return json({ projects: getProjects() });
}

export async function POST(request) {
  const session = await guard(request);
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;

  const { projects } = body || {};
  if (!Array.isArray(projects)) {
    return err("فهرست پروژه‌ها معتبر نیست", 400);
  }
  if (projects.length > 500) {
    return err("تعداد پروژه‌ها از حد مجاز (۵۰۰) بیشتر است", 400);
  }
  const projectsWithoutImages = projects.filter((project) =>
    !project ||
    typeof project.image !== "string" ||
    !/^\/(?:uploads\/images|images\/projects)\/[a-zA-Z0-9._-]+$/i.test(project.image)
  );
  if (projectsWithoutImages.length > 0) {
    return err("برای ذخیره و انتشار هر پروژه، تصویر معتبر آن را بارگذاری کنید.", 400);
  }

  saveProjects(projects);
  revalidatePublic(["", "projects"]);
  return json();
}
