import HeroStatsCombined from "@/components/HeroStatsCombined";
import ExplodedViewer from "@/components/ExplodedViewer";
import ProductGrid from "@/components/ProductGrid";
import ServicesCombined from "@/components/ServicesCombined";
import SizingVideoCombined from "@/components/SizingVideoCombined";
import CredibilityCombined from "@/components/CredibilityCombined";
import { getDictionary } from "@/lib/getDictionary";
import { getMedia } from "@/lib/media";
import { getProducts } from "@/lib/product-store";
import {
  getContent,
  getSliders,
  getCertificates,
  getPartners,
  getServices,
  getBranding
} from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const media = getMedia();
  const content = getContent();
  const sliders = getSliders();
  const certificates = getCertificates();
  const partners = getPartners();
  const services = getServices();
  const branding = getBranding();
  const products = getProducts();

  return (
    <>
      <HeroStatsCombined
        sliders={sliders}
        locale={locale}
        fallbackDict={dict}
        logo={branding.logo}
      />

      <ExplodedViewer locale={locale} />

      <ProductGrid products={products} limit={8} />

      <ServicesCombined services={services} locale={locale} />

      <SizingVideoCombined videoUrl={media.introVideoUrl} locale={locale} />

      <CredibilityCombined
        certificates={certificates}
        partners={partners}
        content={content}
        locale={locale}
      />
    </>
  );
}