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
    fa: "آمده‌ایم ملی بسازیم تا بمانیم",
    en: "We build nationally to last",
    ar: "نبني وطنياً لنبقى",
    ru: "Строим для страны, чтобы остаться"
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
      fa: "اراک، شهرک صنعتی حاجی‌آباد، خیابان صنعت",
      en: "Arak, Hajiabad Industrial Zone, Sanat St., Iran",
      ar: "أراك، المنطقة الصناعية حاجي آباد، شارع الصناعة",
      ru: "Арак, Промзона Хаджиабад, ул. Санат"
    },
    postalCode: "3819958199",
    country: { fa: "ایران", en: "Iran", ar: "إيران", ru: "Иран" }
  },

  // ---------- Social Media ----------
  social: {
    website: "https://www.psm-valve.com",
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