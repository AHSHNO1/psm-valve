"use client";
import { useState } from "react";
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
  const [loaded, setLoaded] = useState(false);
  // تصاویر above-the-fold فید نمی‌گیرند تا LCP کند نشود
  const fadeClass = priority ? "" : " img-fade" + (loaded ? " img-loaded" : "");
  const markLoaded = (element) => {
    if (element?.complete && element.naturalWidth > 0) setLoaded(true);
  };

  if (!src) return null;

  if (typeof src === "string" && OPTIMIZABLE.test(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={(className || "") + fadeClass}
          priority={priority}
          loading={loading}
          style={style}
          onLoad={() => setLoaded(true)}
          ref={markLoaded}
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
        className={(className || "") + fadeClass}
        priority={priority}
        loading={loading}
        style={style}
        onLoad={() => setLoaded(true)}
        ref={markLoaded}
        onError={onError}
      />
    );
  }

  return (
    <img
      ref={markLoaded}
      src={src}
      alt={alt}
      className={(className || "") + fadeClass}
      style={style}
      loading={priority ? "eager" : loading || "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={onError}
    />
  );
}
