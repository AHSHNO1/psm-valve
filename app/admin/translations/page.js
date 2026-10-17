import { getTranslations } from "@/lib/translations";
import TranslationsClient from "@/components/admin/TranslationsClient";

export default function AdminTranslationsPage() {
  return <TranslationsClient initial={getTranslations()} />;
}
