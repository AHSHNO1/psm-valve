import { readJSON, writeJSON } from "./db";
import { units as defaultUnits } from "./units";

const DEFAULT_ABOUT_STATS = {
  foundedYear: { fa: "۱۳۹۰", en: "1390", ar: "1390", ru: "1390" },
  departments: { fa: "۶", en: "6", ar: "6", ru: "6" },
  coating: { fa: "HVOF", en: "HVOF", ar: "HVOF", ru: "HVOF" },
  classification: { fa: "نوع یک", en: "Type I", ar: "Type I", ru: "Тип I" }
};

// ============ CONTENT ============
export function getContent() {
  const stored = readJSON("content.json", {}) || {};
  const storedStats = stored.aboutStats && typeof stored.aboutStats === "object" && !Array.isArray(stored.aboutStats)
    ? stored.aboutStats
    : {};
  return {
    ...stored,
    contactGuide: {
      photo: "/images/departments/manufacturing.jpg",
      ...(stored.contactGuide || {})
    },
    aboutStats: Object.fromEntries(Object.entries(DEFAULT_ABOUT_STATS).map(([key, defaults]) => [
      key,
      {
        ...defaults,
        ...(storedStats[key] && typeof storedStats[key] === "object" && !Array.isArray(storedStats[key])
          ? storedStats[key]
          : {})
      }
    ])),
    units: Array.isArray(stored.units) && stored.units.length ? stored.units : defaultUnits
  };
}

export function updateContent(patch) {
  const current = getContent();
  const updated = { ...current, ...patch };
  writeJSON("content.json", updated);
  return updated;
}

// ============ SLIDERS ============
export function getSliders() {
  return readJSON("sliders.json", []) || [];
}

export function saveSliders(list) {
  writeJSON("sliders.json", list);
  return list;
}

// ============ CERTIFICATES ============
export function getCertificates() {
  return readJSON("certificates.json", []) || [];
}

export function saveCertificates(list) {
  writeJSON("certificates.json", list);
  return list;
}

// ============ TESTIMONIALS ============
export function getTestimonials() {
  return readJSON("testimonials.json", []) || [];
}

export function saveTestimonials(list) {
  writeJSON("testimonials.json", list);
  return list;
}

// ============ PARTNERS ============
export function getPartners() {
  return readJSON("partners.json", []) || [];
}

export function savePartners(list) {
  writeJSON("partners.json", list);
  return list;
}

// ============ BRANDING ============
export function getBranding() {
  return readJSON("branding.json", {
    logo: "/logo/logo-main.png",
    logoLight: "/logo/logo-main.png",
    logoIcon: "/logo/logo-icon.png",
    favicon: "/logo/logo-icon.png",
    primaryColor: "#D4A017",
    secondaryColor: "#C0C0C0",
    socialLinks: {}
  }) || {};
}

export function saveBranding(patch) {
  const current = getBranding();
  const updated = { ...current, ...patch };
  writeJSON("branding.json", updated);
  return updated;
}

// ============ SERVICES ============
export function getServices() {
  return readJSON("services.json", []) || [];
}

export function saveServices(list) {
  writeJSON("services.json", list);
  return list;
}

// ============ NEWS ============
export function getNews() {
  return readJSON("news.json", []) || [];
}

export function saveNews(list) {
  writeJSON("news.json", list);
  return list;
}

// ============ CEO ============
export function getCeo() {
  const c = getContent();
  return c.ceo || {};
}

export function saveCeo(ceoData) {
  const current = getContent();
  current.ceo = ceoData;
  writeJSON("content.json", current);
  return ceoData;
}


// ============ FAQ ============
export function getFaqs() {
  return readJSON("faq.json", []) || [];
}

export function saveFaqs(list) {
  writeJSON("faq.json", list);
  return list;
}

// ============ PROJECTS ============
export function getProjects() {
  return readJSON("projects.json", []) || [];
}

export function saveProjects(list) {
  writeJSON("projects.json", list);
  return list;
}
