import { getDictionary } from "@/lib/getDictionary";
import { getSettings } from "@/lib/db";
import ContactClient from "@/components/ContactClient";

export default async function ContactPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const settings = getSettings();

  return <ContactClient dict={dict} settings={settings} locale={locale} />;
}
