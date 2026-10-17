import { readJSON, writeJSON } from "./db";

// ============================================================
// COMPANY INFO — PSM Valve (Petro Sazeh Mihan)
// منبع واحد اطلاعات شرکت — همه کامپوننت‌ها از اینجا می‌خوانند
// ============================================================

export const COMPANY = {
  // ---------- Identity ----------
  name: {
    fa: "شرکت پتروسازه میهن",
    en: "Petro Sazeh Mihan Co.",
    ar: "شركة بترو سازه ميهان",
    ru: "Petro Sazeh Mihan"
  },
  shortName: {
    fa: "PSM",
    en: "PSM Valve",
    ar: "PSM",
    ru: "PSM"
  },
  brandEn: "PETRO SAZEH MIHAN CO.",
  slogan: {
    fa: "پیشرو در طراحی و تولید شیرهای صنعتی کنترلی",
    en: "Pioneering the design and manufacture of industrial control valves",
    ar: "روّاد تصميم وتصنيع صمامات التحكم الصناعية",
    ru: "Лидеры в проектировании и производстве промышленных регулирующих клапанов"
  },
  description: {
    fa: "دانش‌بنیان تولیدی نوع یک در زمینه طراحی و تولید شیرهای کنترلی",
    en: "Knowledge-based manufacturer of control valves",
    ar: "شركة قائمة على المعرفة لتصميم وتصنيع صمامات التحكم",
    ru: "Наукоемкое производство регулирующих клапанов"
  },

  // ---------- Contact ----------
  phone: {
    office: "+98 86 3413 1533",
    factory: "+98 86 3413 1533",
    mobile: ["+98 912 861 6063", "+98 918 893 9209"]
  },
  fax: {
    office: "+98 86 3413 1533 115",
    factory: "+98 86 3413 1533 115"
  },
  email: {
    primary: "Info@psmvalve.com",
    secondary: "psmvalve@gmail.com"
  },
  messengers: {
    bale: "psm_commercial@",
    rubika: "Psm_commercial@",
    eita: "Psm_commercial@"
  },

  // ---------- Address ----------
  address: {
    office: {
      fa: "اراک، شهرک صنعتی حاجی‌آباد، خیابان صنعت",
      en: "Arak, Hajiabad Industrial Zone, Sanat St., Iran",
      ar: "أراك، المنطقة الصناعية حاجي آباد، شارع الصناعة",
      ru: "Арак, Промзона Хаджиабад, ул. Санат"
    },
    factory: {
      fa: "اراک، کیلومتر ۱۲ جاده تهران، خیابان صنعت",
      en: "Sanat Street, km 12 Tehran Road, Arak, Iran",
      ar: "شارع الصناعة، الكيلومتر 12 من طريق طهران، أراك، إيران",
      ru: "Улица Санат, 12-й км Тегеранского шоссе, Арак, Иран"
    },
    factoryCoordinates: {
      latitude: "34.0765143",
      longitude: "49.8397136"
    },
    postalCode: "3819958199",
    country: { fa: "ایران", en: "Iran", ar: "إيران", ru: "Иран" }
  },

  // ---------- Social Media ----------
  social: {
    website: "https://www.psmvalve.com",
    aparat: "https://www.aparat.com/petrosazehmihan",
    whatsapp: "https://wa.me/989188939209",
    whatsappNumber: "989188939209",
    instagram: "https://www.instagram.com/petrosazemihan",
    instagramHandle: "@petrosazemihan"
  },

  // ---------- Certifications & Tags ----------
  certifications: [
    { fa: "دانش‌بنیان نوع یک", en: "Type-1 Knowledge-Based", icon: "award" },
    { fa: "ISO 9001", en: "ISO 9001", icon: "badge" },
    { fa: "استاندارد IEC 60534", en: "IEC 60534", icon: "file" }
  ]
};

function mergeCompanyInfo(template, value) {
  if (typeof template === "string") {
    return typeof value === "string" && value.length <= 500 ? value : template;
  }
  if (Array.isArray(template)) {
    return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length <= 500)
      ? value.slice(0, 10)
      : template;
  }
  if (template && typeof template === "object") {
    return Object.fromEntries(Object.entries(template).map(([key, child]) => [
      key,
      mergeCompanyInfo(child, value && typeof value === "object" && !Array.isArray(value) ? value[key] : undefined)
    ]));
  }
  return template;
}

export function getCompanyInfo() {
  const stored = readJSON("company-info.json", null);
  const legacySettings = readJSON("settings.json", {}) || {};
  const legacyCoordinates = {
    latitude: typeof legacySettings.mapLat === "string" ? legacySettings.mapLat.trim() : "",
    longitude: typeof legacySettings.mapLng === "string" ? legacySettings.mapLng.trim() : ""
  };
  const validLegacyCoordinates =
    Number.isFinite(Number(legacyCoordinates.latitude)) &&
    Number(legacyCoordinates.latitude) >= -90 &&
    Number(legacyCoordinates.latitude) <= 90 &&
    Number.isFinite(Number(legacyCoordinates.longitude)) &&
    Number(legacyCoordinates.longitude) >= -180 &&
    Number(legacyCoordinates.longitude) <= 180;
  const fallback = stored || (
    legacyCoordinates.latitude && legacyCoordinates.longitude && validLegacyCoordinates
      ? { address: { factoryCoordinates: legacyCoordinates } }
      : {}
  );
  return mergeCompanyInfo(COMPANY, fallback);
}

export function saveCompanyInfo(info) {
  if (!validateCompanyInfo(info)) throw new Error("ساختار اطلاعات شرکت معتبر نیست");
  writeJSON("company-info.json", info);
  return info;
}

export function validateCompanyInfo(info) {
  function matches(template, value) {
    if (typeof template === "string") return typeof value === "string" && value.length <= 500;
    if (Array.isArray(template)) {
      return Array.isArray(value) && value.length <= 10 &&
        value.every((item) => typeof item === "string" && item.length <= 500);
    }
    if (template && typeof template === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const keys = Object.keys(template);
      return Object.keys(value).length === keys.length &&
        keys.every((key) => Object.prototype.hasOwnProperty.call(value, key) && matches(template[key], value[key]));
    }
    return typeof value === typeof template;
  }

  if (!matches(COMPANY, info)) return false;
  const latitude = info.address.factoryCoordinates.latitude;
  const longitude = info.address.factoryCoordinates.longitude;
  return Number.isFinite(Number(latitude)) && Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number.isFinite(Number(longitude)) && Number(longitude) >= -180 && Number(longitude) <= 180;
}

// ============================================================
// HELPERS
// ============================================================

export function getPhone(locale = "fa") {
  return {
    office: COMPANY.phone.office,
    factory: COMPANY.phone.factory,
    mobile: COMPANY.phone.mobile
  };
}

export function getAddress(type = "office", locale = "fa") {
  return COMPANY.address[type]?.[locale] || COMPANY.address[type]?.en || "";
}

export function getSocialLinks() {
  return [
    { id: "instagram", url: COMPANY.social.instagram, label: "Instagram" },
    { id: "whatsapp", url: COMPANY.social.whatsapp, label: "WhatsApp" },
    { id: "aparat", url: COMPANY.social.aparat, label: "Aparat" }
  ];
}

export function getEmailLinks() {
  return [
    { id: "primary", email: COMPANY.email.primary, label: "Email" },
    { id: "secondary", email: COMPANY.email.secondary, label: "Gmail" }
  ];
}

export function getMessengerLinks() {
  return [
    { id: "bale", handle: COMPANY.messengers.bale, label: { fa: "بله", en: "Bale" } },
    { id: "rubika", handle: COMPANY.messengers.rubika, label: { fa: "روبیکا", en: "Rubika" } },
    { id: "eita", handle: COMPANY.messengers.eita, label: { fa: "ایتا", en: "Eita" } }
  ];
}

export default COMPANY;