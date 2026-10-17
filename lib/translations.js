import { readJSON, writeJSON } from "@/lib/db";
import fa from "@/messages/fa.json";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import ru from "@/messages/ru.json";
import { locales } from "@/lib/i18n";

const bundledTranslations = { fa, en, ar, ru };

export function getTranslations() {
  const stored = readJSON("translations.json", null);
  return Object.fromEntries(locales.map((locale) => [
    locale,
    mergeTranslationShape(bundledTranslations[locale], stored?.[locale])
  ]));
}

function mergeTranslationShape(template, value) {
  if (typeof template === "string") {
    return typeof value === "string" && value.length <= 10000 ? value : template;
  }
  if (Array.isArray(template)) {
    return template.map((item, index) => mergeTranslationShape(item, Array.isArray(value) ? value[index] : undefined));
  }
  if (template && typeof template === "object") {
    return Object.fromEntries(Object.entries(template).map(([key, child]) => [
      key,
      mergeTranslationShape(child, value && typeof value === "object" && !Array.isArray(value) ? value[key] : undefined)
    ]));
  }
  return typeof value === typeof template ? value : template;
}

export function getTranslation(locale) {
  const translations = getTranslations();
  return translations[locale] || translations.fa;
}

export function saveTranslations(translations) {
  writeJSON("translations.json", translations);
  return translations;
}

export function validateTranslations(translations) {
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) return false;
  const keys = Object.keys(translations);
  if (keys.length !== locales.length || locales.some((locale) => !keys.includes(locale))) return false;

  function matchesShape(template, value) {
    if (typeof template === "string") return typeof value === "string" && value.length <= 10000;
    if (Array.isArray(template)) {
      return Array.isArray(value) &&
        value.length === template.length &&
        template.every((item, index) => matchesShape(item, value[index]));
    }
    if (template && typeof template === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const templateKeys = Object.keys(template);
      return Object.keys(value).length === templateKeys.length &&
        templateKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key) && matchesShape(template[key], value[key]));
    }
    return typeof value === typeof template;
  }

  return locales.every((locale) => matchesShape(bundledTranslations[locale], translations[locale]));
}
