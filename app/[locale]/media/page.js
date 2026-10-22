import { getAparatChannelVideos, getMedia, mergeAparatVideos } from "@/lib/media";
import { getDictionary } from "@/lib/getDictionary";
import { getNews, getProjects } from "@/lib/content";
import { getArticles } from "@/lib/articles";
import MediaTabsSimple from "@/components/MediaTabsSimple";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = params;
  const seo = pageSeo(locale, "media");
  return buildMetadata({
    locale,
    path: "/media",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  });
}

export default async function MediaPage({ params, searchParams }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const media = getMedia();
  let aparatUnavailable = false;
  let channelVideos = [];
  try {
    channelVideos = await getAparatChannelVideos();
  } catch (error) {
    console.error("Unable to load Aparat channel videos:", error);
    aparatUnavailable = true;
  }

  const displayMedia = {
    ...media,
    videos: mergeAparatVideos(channelVideos, media.videos || []),
    gallery: [
      ...(media.gallery || []),
      ...getProjects()
        .filter((project) => project.active !== false && project.image)
        .map((project) => ({
          id: `project-${project.id}`,
          url: project.image,
          title: project.title,
          description: project.description
        }))
    ],
    aparatUnavailable,
    catalogs: (media.catalogs || []).filter((catalog) =>
      typeof catalog.url === "string" && catalog.url.startsWith("/uploads/catalogs/")
    )
  };
  const news = getNews().filter((item) => item.active !== false && item.status !== "pending");
  const articles = getArticles().filter((article) => article.active !== false);

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{dict.media && dict.media.badge || "Media"}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-10">
        <span className="heading-grad">{dict.media && dict.media.title1 || "مدیا"}</span>{" "}
        <span className="heading-gold">{dict.media && dict.media.title2 || "و گالری"}</span>
      </h1>

      <MediaTabsSimple
        media={displayMedia}
        news={news}
        articles={articles}
        locale={locale}
        dict={dict}
        initialTab={searchParams?.tab}
      />
    </section>
  );
}
