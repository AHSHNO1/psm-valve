export async function getDictionary(locale) {
  try {
    const dict = (await import(`@/messages/${locale}.json`)).default;
    return dict;
  } catch {
    return (await import("@/messages/fa.json")).default;
  }
}
