import Image from "next/image";

// فقط فایل‌های محلی با فرمت راستر از بهینه‌ساز Next عبور می‌کنند؛
// GIF (برای حفظ انیمیشن) و URLهای خارجی با تگ img معمولی نمایش داده می‌شوند.
const OPTIMIZABLE = /^\/[^?#]+\.(?:jpe?g|png|webp|avif)(?:\?.*)?$/i;

export default function MediaImage({
  src,
  alt = "",
  fill = false,
  width = 1200,
  height = 900,
  sizes,
  className,
  priority = false,
  loading,
  style,
  onError
}) {
  if (!src) return null;

  if (typeof src === "string" && OPTIMIZABLE.test(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          priority={priority}
          loading={loading}
          style={style}
          onError={onError}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={className}
        priority={priority}
        loading={loading}
        style={style}
        onError={onError}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : loading || "lazy"}
      decoding="async"
      onError={onError}
    />
  );
}
