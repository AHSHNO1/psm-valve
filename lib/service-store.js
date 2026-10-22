import { getServices } from "./content";
import { services as fallbackServices } from "./services";

// ادغام خدمات ذخیره‌شده در پنل با نسخهٔ ثابت؛ نسخهٔ پنل اولویت دارد
function normalize(entry, fallback) {
  const base = fallback || {};
  return {
    ...base,
    ...entry,
    name: entry.name || base.name || {},
    short: entry.short || base.short || {},
    icon: entry.icon || base.icon || "Cog",
    image: entry.image || base.image || "",
    features: Array.isArray(entry.features) ? entry.features : base.features || []
  };
}

export function getAllServices(options = {}) {
  const stored = getServices();
  const source = stored.length ? stored : fallbackServices;
  const merged = source.map((entry) => {
    const fallback = fallbackServices.find((item) => item.slug === entry.slug);
    return normalize(entry, fallback);
  });
  const filtered = options.includeInactive ? merged : merged.filter((item) => item.active !== false);
  return filtered.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
}

export function getServiceBySlug(slug) {
  return getAllServices({ includeInactive: true }).find((item) => item.slug === slug && item.active !== false) || null;
}
