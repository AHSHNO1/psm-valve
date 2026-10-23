import { getFaqs, getContent } from "@/lib/content";
import FaqList from "@/components/FaqList";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "faq");
  return buildMetadata({
    locale,
    path: "/faq",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  });
}

export default async function FaqPage({ params }) {
  const { locale } = await params;
  const faqs = getFaqs().filter(function(f) { return f.active !== false; });
  const content = getContent();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .map(function(faq) {
        return {
          "@type": "Question",
          name: pick(faq.question, locale),
          acceptedAnswer: {
            "@type": "Answer",
            text: pick(faq.answer, locale)
          }
        };
      })
      .filter(function(item) { return item.name && item.acceptedAnswer.text; })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c")
        }}
      />
      <FaqList faqs={faqs} content={content} locale={locale} />
    </>
  );
}
