import { getContent } from "@/lib/content";
import ContentClient from "@/components/admin/ContentClient";

export default function AdminContentPage() {
  const content = getContent();
  return <ContentClient initial={content} />;
}
