import HeroStatsCombined from "@/components/HeroStatsCombined";
import ExplodedViewerLazy from "@/components/ExplodedViewerLazy";
import ProductGrid from "@/components/ProductGrid";
import ServicesCombined from "@/components/ServicesCombined";
import SizingVideoCombined from "@/components/SizingVideoCombined";
import CredibilityCombined from "@/components/CredibilityCombined";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";
import { getMedia } from "@/lib/media";
import { getProducts } from "@/lib/product-store";
import { getCategories } from "@/lib/category-store";
import {
  getSliders,
  getCertificates,
  getPartners,
  getServices,
  getBranding
} from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "home");
  return buildMetadata({
    locale,
    path: "",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    titleAbsolute: true
  });
}

export default async function Home({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const media = getMedia();
  const sliders = getSliders();
  const certificates = getCertificates();
  const partners = getPartners();
  const services = getServices();
  const branding = getBranding();
  const categories = getCategories();
  const homeProducts = getProducts().slice(0, 8).map((product) => ({
    slug: product.slug,
    series: product.series,
    categoryId: product.categoryId,
    image: product.image,
    name: product.name,
    short: product.short
  }));
  const heroFallback = {
    hero: {
      title1: dict.hero?.title1,
      title2: dict.hero?.title2,
      title3: dict.hero?.title3,
      desc: dict.hero?.desc,
      cta1: dict.hero?.cta1
    }
  };

  return (
    <>
      <HeroStatsCombined
        sliders={sliders}
        locale={locale}
        fallbackDict={heroFallback}
        logo={branding.logo}
      />

      <ExplodedViewerLazy locale={locale} />

      <ProductGrid products={homeProducts} categories={categories} />

      <ServicesCombined services={services} locale={locale} />

      <SizingVideoCombined videoUrl={media.introVideoUrl} locale={locale} />

      <CredibilityCombined
        certificates={certificates}
        partners={partners}
        locale={locale}
      />
    </>
  );
}