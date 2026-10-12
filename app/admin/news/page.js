import { getNews } from "@/lib/content";
import NewsClient from "@/components/admin/NewsClient";

export default function AdminNewsPage() {
  const items = getNews();
  return <NewsClient initial={items} />;
}
