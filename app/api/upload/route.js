import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

// نوع مجاز → پسوند ثابت. پسوند هرگز از نام فایل کاربر گرفته نمی‌شود؛
// وگرنه می‌توان با نام «x.html» و MIME جعلی، HTML اجراشدنی روی دامنهٔ سایت نوشت.
const ALLOWED = {
  images: {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
  },
  videos: {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov"
  },
  catalogs: {
    "application/pdf": ".pdf"
  },
  posters: {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  }
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/** تشخیص نوع واقعی فایل از امضای باینری (magic bytes) */
function detectMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.toString("ascii", 1, 4) === "PNG" &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 4) === "GIF8") {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "qt  ") return "video/quicktime";
    if (["isom", "iso2", "mp41", "mp42", "avc1", "dash", "M4V "].includes(brand)) {
      return "video/mp4";
    }
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }
  return null;
}

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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "فایل بیش از 50MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectMime(buffer);
    const ext = detected ? ALLOWED[type][detected] : null;

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "محتوای فایل با فرمت‌های مجاز این بخش نمی‌خواند" },
        { status: 400 }
      );
    }

    const originalName = path.basename(file.name || "file").slice(0, 120);
    const safeName =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + ext;

    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, buffer);

    const url = `/uploads/${type}/${safeName}`;

    return NextResponse.json({
      ok: true,
      url,
      filename: safeName,
      size: buffer.length,
      originalName
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ ok: false, error: "خطا در آپلود" }, { status: 500 });
  }
}
