import { consumeRateLimit } from "@/lib/rate-limit";
import { guard, json, err, isResponse } from "@/lib/api-helpers";
import { optimizeRasterImage } from "@/lib/image-optimizer";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

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
  const session = await guard(request);
  if (isResponse(session)) return session;

  // محدودسازی آپلود (ضد پرکردن دیسک/اسپم): ۴۰ آپلود در هر ۱۰ دقیقه برای هر IP
  const rate = consumeRateLimit(request, "upload", 40, 10 * 60 * 1000);
  if (!rate.allowed) {
    return err("تعداد آپلودها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.", 429, {
      code: "rate_limited"
    }, { headers: { "Retry-After": String(rate.retryAfter) } });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "images";

    if (!file || typeof file === "string") {
      return err("فایلی انتخاب نشده", 400);
    }

    if (!ALLOWED[type]) {
      return err("نوع نامعتبر", 400);
    }

    if (file.size > MAX_SIZE) {
      return err("فایل بیش از 50MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectMime(buffer);
    const ext = detected ? ALLOWED[type][detected] : null;

    if (!ext) {
      return err("محتوای فایل با فرمت‌های مجاز این بخش نمی‌خواند", 400);
    }

    // تصاویر راستری در همان لحظهٔ آپلود به WebP بهینه تبدیل می‌شوند تا
    // فایل‌های چند مگابایتی وارد مخزن رسانه نشوند. GIF متحرک دست‌نخورده می‌ماند.
    let payload = buffer;
    let outputMime = detected;
    if (detected.startsWith("image/") && detected !== "image/gif") {
      const optimized = await optimizeRasterImage(buffer);
      if (optimized) {
        payload = optimized;
        outputMime = "image/webp";
      }
    }
    const outputExt = ALLOWED[type][outputMime] || ext;

    const originalName = path.basename(file.name || "file").slice(0, 120);
    const safeName =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + outputExt;

    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, payload);

    const url = `/uploads/${type}/${safeName}`;

    return json({ url, filename: safeName, size: payload.length, originalName });
  } catch (error) {
    console.error("Upload failed:", error);
    return err("خطا در آپلود", 500);
  }
}
