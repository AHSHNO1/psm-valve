import { toIsoDate } from "./jalali";

export function pickNewsText(value, locale, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[locale] || value.fa || value.en || value.ar || value.ru || fallback;
}

export function newsGallery(item) {
  if (!item) return [];
  const images = [];
  if (item.image) images.push(item.image);
  for (const image of Array.isArray(item.gallery) ? item.gallery : []) {
    if (image && !images.includes(image)) images.push(image);
  }
  return images;
}

export function contentParagraphs(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function formatNewsDate(value, locale) {
  if (!value) return "";
  const iso = toIsoDate(value);
  if (!iso) return value;
  try {
    const date = new Date(iso + "T12:00:00Z");
    const tag = locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-SA" : locale === "ru" ? "ru-RU" : "en-GB";
    return new Intl.DateTimeFormat(tag, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  } catch {
    return value;
  }
}

export function newsIsoDate(value) {
  return toIsoDate(value);
}
