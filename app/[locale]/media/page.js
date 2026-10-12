import { getMedia } from "@/lib/media";
import { getDictionary } from "@/lib/getDictionary";
import { getNews } from "@/lib/content";
import { articles } from "@/lib/articles";
import MediaTabsSimple from "@/components/MediaTabsSimple";

export default async function MediaPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const media = getMedia();
  const news = getNews();

  return (
    <section className="container-x py-10 sm:py-16">
      <span className="chip">{dict.media && dict.media.badge || "Media"}</span>
      <h1 className="section-title mt-3 mb-8 sm:mb-10">
        <span className="heading-grad">{dict.media && dict.media.title1 || "مدیا"}</span>{" "}
        <span className="heading-gold">{dict.media && dict.media.title2 || "و گالری"}</span>
      </h1>

      <MediaTabsSimple
        media={media}
        news={news}
        articles={articles}
        locale={locale}
        dict={dict}
      />
    </section>
  );
}
