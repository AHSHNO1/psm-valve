import { getFaqs } from "@/lib/content";
import FaqClient from "@/components/admin/FaqClient";

export default function AdminFaqPage() {
  const items = getFaqs();
  return <FaqClient initial={items} />;
}
