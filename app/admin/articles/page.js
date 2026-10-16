import { getArticles } from "@/lib/articles";
import ArticlesClient from "@/components/admin/ArticlesClient";

export const dynamic = "force-dynamic";

export default function AdminArticlesPage() {
  return <ArticlesClient initial={getArticles()} />;
}
