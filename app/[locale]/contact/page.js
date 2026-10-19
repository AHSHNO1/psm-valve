import { getDictionary } from "@/lib/getDictionary";
import ContactClient from "@/components/ContactClient";
import { getCompanyInfo } from "@/lib/company-info";
import { getBranding, getContent } from "@/lib/content";
import { getSettings } from "@/lib/db";

export default async function ContactPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const company = getCompanyInfo();
  const branding = getBranding();
  const content = getContent();
  const settings = getSettings();

  return <ContactClient dict={dict} locale={locale} company={company} branding={branding} content={content} career={settings} />;
}
