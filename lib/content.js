import { readJSON, writeJSON } from "./db";

// ============ CONTENT ============
export function getContent() {
  return readJSON("content.json", {}) || {};
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
    logo: "",
    logoLight: "",
    favicon: "",
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
