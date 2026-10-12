import StandardsTable from "@/components/StandardsTable";

export const metadata = {
  title: "استانداردهای مهندسی | پترو سازه میهن",
  description: "جدول استانداردهای DN، NPS، ANSI، PN، Cv و Kv"
};

export default function StandardsPage({ params }) {
  const { locale } = params;
  return <StandardsTable locale={locale} />;
}
