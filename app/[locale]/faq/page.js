import { getFaqs, getContent } from "@/lib/content";
import FaqList from "@/components/FaqList";

export default async function FaqPage({ params }) {
  const { locale } = params;
  const faqs = getFaqs().filter(function(f) { return f.active !== false; });
  const content = getContent();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(function(faq) {
      function pick(value) {
        if (!value) return "";
        if (typeof value === "string") return value;
        return value[locale] || value.en || value.fa || "";
      }

      return {
        "@type": "Question",
        name: pick(faq.question),
        acceptedAnswer: {
          "@type": "Answer",
          text: pick(faq.answer)
        }
      };
    })
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
