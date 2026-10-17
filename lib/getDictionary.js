import { getTranslation } from "@/lib/translations";

export async function getDictionary(locale) {
  return getTranslation(locale);
}
