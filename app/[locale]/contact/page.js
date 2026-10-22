import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import ContactClient from "@/components/ContactClient";
import { getCompanyInfo } from "@/lib/company-info";
import { getBranding, getContent } from "@/lib/content";
import { getSettings } from "@/lib/db";

export async function generateMetadata({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const L = dict.contact || {};
  return buildMetadata({
    locale,
    path: "/contact",
    title: [L.title1, L.title2].filter(Boolean).join(" ") || dict.common?.company,
    description: typeof L.subtitle === "string" ? L.subtitle.slice(0, 160) : ""
  });
}

export default async function ContactPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const company = getCompanyInfo();
  const branding = getBranding();
  const content = getContent();
  const settings = getSettings();

  return <ContactClient dict={dict} locale={locale} company={company} branding={branding} content={content} career={settings} />;
}
