import sharp from "sharp";

// سقف ابعاد و کیفیت برای تصاویر آپلودی؛ نسخهٔ اصلی نگه داشته نمی‌شود.
const MAX_EDGE = 2000;
const WEBP_QUALITY = 82;

/**
 * تصاویر راستری را به WebP سبک تبدیل می‌کند.
 * GIF متحرک و فایل‌هایی که بهینه‌سازی آن‌ها سودی ندارد دست‌نخورده می‌مانند.
 * در صورت خطا، null برمی‌گردد تا آپلود با فایل اصلی ادامه یابد.
 */
export async function optimizeRasterImage(buffer) {
  try {
    const metadata = await sharp(buffer, { failOn: "none" }).metadata();
    if (!metadata.width || !metadata.height) return null;
    if ((metadata.pages || 1) > 1) return null;

    const output = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    if (output.length >= buffer.length) return null;
    return output;
  } catch (error) {
    console.error("Image optimization skipped:", error.message);
    return null;
  }
}
