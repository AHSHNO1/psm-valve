import { getProducts } from "@/lib/product-store";
import { getContent, getSliders } from "@/lib/content";
import { getMedia } from "@/lib/media";
import SiteContentHub from "@/components/admin/SiteContentHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function countImages(value) {
  if (!value || typeof value !== "object") return 0;
  if (Array.isArray(value)) return value.reduce((count, item) => count + countImages(item), 0);
  return Object.entries(value).reduce((count, [key, child]) => {
    if (/^(photo|image)$/i.test(key)) return count + countImageValues(child);
    return count + countImages(child);
  }, 0);
}

function countImageValues(value) {
  if (typeof value === "string") return value ? 1 : 0;
  if (Array.isArray(value)) return value.reduce((count, item) => count + countImageValues(item), 0);
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce((count, item) => count + countImageValues(item), 0);
}

export default function AdminContentPage() {
  const sliders = getSliders();
  const products = getProducts();
  const media = getMedia();
  const contentImageCount = countImages(getContent());

  return (
    <SiteContentHub
      stats={{
        slides: sliders.length,
        activeSlides: sliders.filter((slide) => slide.active !== false).length,
        products: products.length,
        siteImages: contentImageCount,
        galleryImages: (media.gallery || []).length,
        videos: (media.videos || []).length
      }}
    />
  );
}
