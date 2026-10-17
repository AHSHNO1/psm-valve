import { getContent } from "@/lib/content";
import ContentClient from "@/components/admin/ContentClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminSiteTextPage() {
  return <ContentClient initial={getContent()} />;
}
