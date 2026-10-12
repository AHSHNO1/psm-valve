import { getFaqs, getContent } from "@/lib/content";
import FaqList from "@/components/FaqList";

export default async function FaqPage({ params }) {
  const { locale } = params;
  const faqs = getFaqs().filter(function(f) { return f.active !== false; });
  const content = getContent();

  return <FaqList faqs={faqs} content={content} locale={locale} />;
}
