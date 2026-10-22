import { readJSON, writeJSON } from "./db";
import { categories as SEED_CATEGORIES } from "./categories";
import { CATALOG_LOCALES, CATEGORY_ICON_NAMES } from "./category-utils";

const FILE = "product-catalog.json";
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CATEGORIES = 100;
const HEADER_FIELDS = {
  badge: 100,
  title1: 160,
  title2: 160,
  description: 600
};

function emptyLocalized() {
  return CATALOG_LOCALES.reduce((out, locale) => {
    out[locale] = "";
    return out;
  }, {});
}

export const DEFAULT_CATALOG_HEADER = {
  badge: emptyLocalized(),
  title1: emptyLocalized(),
  title2: emptyLocalized(),
  description: emptyLocalized()
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeLocalized(value, maxLength) {
  const out = emptyLocalized();
  if (typeof value === "string") {
    out.fa = cleanString(value, maxLength);
    out.en = out.fa;
    return out;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const locale of CATALOG_LOCALES) {
    out[locale] = cleanString(value[locale], maxLength);
  }
  return out;
}

function normalizeHeader(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const header = {};
  for (const [field, maxLength] of Object.entries(HEADER_FIELDS)) {
    header[field] = normalizeLocalized(source[field], maxLength);
  }
  return header;
}

function normalizeCategory(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const id = cleanString(raw.id, 64).toLowerCase();
  if (!id) return null;
  return {
    id,
    name: normalizeLocalized(raw.name, 200),
    desc: normalizeLocalized(raw.desc, 600),
    icon: CATEGORY_ICON_NAMES.includes(raw.icon) ? raw.icon : "Package",
    parentId: cleanString(raw.parentId, 64),
    hidden: raw.hidden === true
  };
}

function withChildren(categories) {
  const childrenByParent = new Map();
  for (const category of categories) {
    if (!category.parentId) continue;
    if (!childrenByParent.has(category.parentId)) childrenByParent.set(category.parentId, []);
    childrenByParent.get(category.parentId).push(category.id);
  }
  return categories.map((category) => ({
    ...category,
    children: childrenByParent.get(category.id) || []
  }));
}

function seedCatalog() {
  return {
    header: clone(DEFAULT_CATALOG_HEADER),
    categories: SEED_CATEGORIES.map((category) => ({
      id: category.id,
      name: normalizeLocalized(category.name, 200),
      desc: normalizeLocalized(category.desc, 600),
      icon: CATEGORY_ICON_NAMES.includes(category.icon) ? category.icon : "Package",
      parentId: category.parentId || "",
      hidden: false
    }))
  };
}

export function validateCatalog(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "ساختار کاتالوگ معتبر نیست." };
  }
  const rawCategories = Array.isArray(value.categories) ? value.categories : null;
  if (!rawCategories || rawCategories.length === 0) {
    return { ok: false, error: "حداقل یک دسته‌بندی لازم است." };
  }
  if (rawCategories.length > MAX_CATEGORIES) {
    return { ok: false, error: "تعداد دسته‌بندی‌ها بیش از حد مجاز است." };
  }

  const categories = [];
  const ids = new Set();
  for (const raw of rawCategories) {
    const category = normalizeCategory(raw);
    if (!category) return { ok: false, error: "یکی از دسته‌بندی‌ها فاقد شناسه معتبر است." };
    if (!ID_PATTERN.test(category.id)) {
      return { ok: false, error: `شناسه «${category.id}» فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و خط تیره باشد.` };
    }
    if (ids.has(category.id)) {
      return { ok: false, error: `شناسه «${category.id}» تکراری است.` };
    }
    if (!category.name.fa && !category.name.en) {
      return { ok: false, error: `نام دسته «${category.id}» را وارد کنید.` };
    }
    ids.add(category.id);
    categories.push(category);
  }

  for (const category of categories) {
    if (!category.parentId) continue;
    if (category.parentId === category.id) {
      return { ok: false, error: "دسته نمی‌تواند زیرمجموعه خودش باشد." };
    }
    const parent = categories.find((item) => item.id === category.parentId);
    if (!parent) {
      return { ok: false, error: `دسته والد «${category.parentId}» پیدا نشد.` };
    }
    if (parent.parentId) {
      return { ok: false, error: "زیرمجموعه‌ها فقط یک سطح تودرتو پشتیبانی می‌شوند." };
    }
  }

  return {
    ok: true,
    value: {
      header: normalizeHeader(value.header),
      categories: withChildren(categories)
    }
  };
}

export function getCatalog() {
  const stored = readJSON(FILE, null);
  const fallback = seedCatalog();
  if (!stored) {
    return { ...fallback, categories: withChildren(fallback.categories) };
  }
  const candidate = Array.isArray(stored)
    ? { categories: stored, header: clone(DEFAULT_CATALOG_HEADER) }
    : stored;
  const result = validateCatalog(candidate);
  if (!result.ok) {
    console.error("Invalid product catalog store, using seed data:", result.error);
    return { ...fallback, categories: withChildren(fallback.categories) };
  }
  return result.value;
}

export function getCategories() {
  return getCatalog().categories;
}

export function getCatalogHeader() {
  return getCatalog().header;
}

export function getCategory(id) {
  return getCategories().find((category) => category.id === id) || null;
}

export function isProductCategory(id) {
  const category = getCategory(id);
  return Boolean(category && category.children.length === 0);
}

export function saveCatalog(value) {
  const result = validateCatalog(value);
  if (!result.ok) throw new TypeError(result.error);
  writeJSON(FILE, result.value);
  return result.value;
}
