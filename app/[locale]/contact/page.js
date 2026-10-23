import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";
import ContactClient from "@/components/ContactClient";
import { getCompanyInfo } from "@/lib/company-info";
import { getBranding, getContent } from "@/lib/content";
import { getSettings } from "@/lib/db";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "contact");
  return buildMetadata({
    locale,
    path: "/contact",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    titleAbsolute: true
  });
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const company = getCompanyInfo();
  const branding = getBranding();
  const content = getContent();
  const settings = getSettings();

  return <ContactClient dict={dict} locale={locale} company={company} branding={branding} content={content} career={settings} />;
}
