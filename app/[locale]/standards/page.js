import StandardsTable from "@/components/StandardsTable";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "standards");
  return buildMetadata({
    locale,
    path: "/standards",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  });
}

export default async function StandardsPage({ params }) {
  const { locale } = await params;
  return <StandardsTable locale={locale} />;
}
