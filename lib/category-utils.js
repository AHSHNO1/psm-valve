export const CATEGORY_ICON_NAMES = [
  "Gauge",
  "Circle",
  "Sun",
  "Square",
  "ArrowRight",
  "Cylinder",
  "Minus",
  "ShieldAlert",
  "Snowflake",
  "Flame",
  "Package"
];

export const CATALOG_LOCALES = ["fa", "en", "ar", "ru"];

export function pickLocalized(value, locale) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.en || value.fa || value.ar || value.ru || "";
}

export function findCategory(categories, id) {
  return (categories || []).find((category) => category.id === id) || null;
}

export function getCategoryLabel(category, locale = "fa", allCategories = []) {
  if (!category) return "";
  const name = pickLocalized(category.name, locale);
  if (!category.parentId) return name;
  const parent = findCategory(allCategories, category.parentId);
  if (!parent) return name;
  const parentName = pickLocalized(parent.name, locale);
  return parentName ? `${parentName} / ${name}` : name;
}

export function isProductCategory(category) {
  return Boolean(category && !(Array.isArray(category.children) && category.children.length));
}

export function countProductsInCategory(products, categories, categoryId) {
  const ids = new Set([categoryId]);
  (categories || [])
    .filter((category) => category.parentId === categoryId)
    .forEach((category) => ids.add(category.id));
  return (products || []).filter((product) => ids.has(product.categoryId)).length;
}
