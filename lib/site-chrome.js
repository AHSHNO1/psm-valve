import { readJSON, writeJSON } from "@/lib/db";
import { categories } from "@/lib/categories";

const HEADER_CATEGORIES = categories.filter((category) => !category.parentId);
const HEADER_CATEGORY_IDS = new Set(HEADER_CATEGORIES.map((category) => category.id));
const LOCALES = ["fa", "en", "ar", "ru"];

export const DEFAULT_SITE_CHROME = {
  header: {
    layout: "standard",
    navAlignment: "center",
    showTagline: true,
    showSearch: true,
    showTheme: true,
    showLocale: true,
    hiddenNavItems: [],
    categoryOrder: HEADER_CATEGORIES.map((category) => category.id),
    hiddenCategoryIds: [],
    categoryNames: {}
  },
  footer: {
    layout: "balanced",
    showBrand: true,
    showLinks: true,
    showContact: true,
    showSocial: true,
    showBottom: true
  }
};

const HEADER_LAYOUTS = new Set(["standard", "compact"]);
const NAV_ALIGNMENTS = new Set(["center", "start"]);
const FOOTER_LAYOUTS = new Set(["balanced", "brand-focus", "compact"]);
const NAV_ITEMS = new Set(["home", "about", "sizing", "products", "services", "partners", "media", "contact"]);
const BOOLEAN_KEYS = ["showTagline", "showSearch", "showTheme", "showLocale"];
const FOOTER_BOOLEAN_KEYS = ["showBrand", "showLinks", "showContact", "showSocial", "showBottom"];

export function getSiteChrome() {
  const stored = readJSON("site-chrome.json", null);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return structuredClone(DEFAULT_SITE_CHROME);
  }
  const settings = {
    ...structuredClone(DEFAULT_SITE_CHROME),
    ...stored,
    header: { ...DEFAULT_SITE_CHROME.header, ...stored.header },
    footer: { ...DEFAULT_SITE_CHROME.footer, ...stored.footer }
  };
  return validateSiteChrome(settings) ? settings : structuredClone(DEFAULT_SITE_CHROME);
}

export function validateSiteChrome(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const header = value.header;
  const footer = value.footer;
  if (!header || !footer || typeof header !== "object" || typeof footer !== "object") return false;
  if (!HEADER_LAYOUTS.has(header.layout) || !NAV_ALIGNMENTS.has(header.navAlignment)) return false;
  if (!FOOTER_LAYOUTS.has(footer.layout)) return false;
  if (!BOOLEAN_KEYS.every((key) => typeof header[key] === "boolean")) return false;
  if (!FOOTER_BOOLEAN_KEYS.every((key) => typeof footer[key] === "boolean")) return false;
  if (!Array.isArray(header.hiddenNavItems) ||
      header.hiddenNavItems.some((item) => typeof item !== "string" || !NAV_ITEMS.has(item))) return false;
  if (!Array.isArray(header.categoryOrder) ||
      header.categoryOrder.some((id) => typeof id !== "string" || !HEADER_CATEGORY_IDS.has(id)) ||
      new Set(header.categoryOrder).size !== header.categoryOrder.length) return false;
  if (!Array.isArray(header.hiddenCategoryIds) ||
      header.hiddenCategoryIds.some((id) => typeof id !== "string" || !HEADER_CATEGORY_IDS.has(id))) return false;
  if (!header.categoryNames || typeof header.categoryNames !== "object" || Array.isArray(header.categoryNames)) return false;
  for (const [id, names] of Object.entries(header.categoryNames)) {
    if (!HEADER_CATEGORY_IDS.has(id) || !names || typeof names !== "object" || Array.isArray(names)) return false;
    if (Object.entries(names).some(([locale, name]) =>
      !LOCALES.includes(locale) || typeof name !== "string" || name.length > 200
    )) return false;
  }
  return true;
}

export function saveSiteChrome(value) {
  if (!validateSiteChrome(value)) throw new TypeError("Invalid header and footer settings");
  writeJSON("site-chrome.json", value);
  return value;
}
