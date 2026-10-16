import { getAparatChannelVideos, getMedia, mergeAparatVideos } from "@/lib/media";
import MediaClient from "@/components/admin/MediaClient";

export default async function AdminMediaPage() {
  const storedMedia = getMedia();
  const media = {
    ...storedMedia,
    catalogs: (storedMedia.catalogs || []).filter((catalog) =>
      typeof catalog.url === "string" && catalog.url.startsWith("/uploads/catalogs/")
    )
  };
  let initial = media;
  try {
    const channelVideos = await getAparatChannelVideos();
    initial = {
      ...media,
      videos: mergeAparatVideos(channelVideos, media.videos || [], true)
    };
  } catch (error) {
    console.error("Unable to load Aparat videos in media admin:", error);
  }

  return <MediaClient initial={initial} />;
}
