import { getMedia } from "@/lib/media";
import MediaClient from "@/components/admin/MediaClient";

export default function AdminMediaPage() {
  const media = getMedia();
  return <MediaClient initial={media} />;
}
