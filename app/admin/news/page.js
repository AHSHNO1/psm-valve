import { getNews } from "@/lib/content";
import NewsClient from "@/components/admin/NewsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminNewsPage() {
  const items = getNews();
  return <NewsClient initial={items} />;
}
