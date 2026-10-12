import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  videos: ["video/mp4", "video/webm", "video/quicktime"],
  catalogs: ["application/pdf"],
  posters: ["image/jpeg", "image/png", "image/webp"]
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "images";

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "فایلی انتخاب نشده" }, { status: 400 });
    }

    if (!ALLOWED[type]) {
      return NextResponse.json({ ok: false, error: "نوع نامعتبر" }, { status: 400 });
    }

    if (!ALLOWED[type].includes(file.type)) {
      return NextResponse.json({ ok: false, error: "فرمت فایل مجاز نیست" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "فایل بیش از 50MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || "file";
    const ext = path.extname(originalName) || "";
    const safeName = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + ext;

    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, buffer);

    const url = `/uploads/${type}/${safeName}`;

    return NextResponse.json({
      ok: true,
      url,
      filename: safeName,
      size: file.size,
      originalName
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "خطا در آپلود" }, { status: 500 });
  }
}
