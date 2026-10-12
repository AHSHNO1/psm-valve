export const locales = ["fa", "en", "ar", "ru"];
export const defaultLocale = "fa";

export const localeNames = {
  fa: "فارسی",
  en: "English",
  ar: "العربية",
  ru: "Русский"
};

export const localeFlags = {
  fa: "IR",
  en: "EN",
  ar: "AR",
  ru: "RU"
};

export const localeDirs = {
  fa: "rtl",
  en: "ltr",
  ar: "rtl",
  ru: "ltr"
};

export function isRtl(locale) {
  return localeDirs[locale] === "rtl";
}

export function isValidLocale(locale) {
  return locales.includes(locale);
}
