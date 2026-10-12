import HeroStatsCombined from "@/components/HeroStatsCombined";
import ExplodedViewer from "@/components/ExplodedViewer";
import ProductGrid from "@/components/ProductGrid";
import ServicesCombined from "@/components/ServicesCombined";
import SizingVideoCombined from "@/components/SizingVideoCombined";
import CredibilityCombined from "@/components/CredibilityCombined";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { getMedia } from "@/lib/media";
import {
  getContent,
  getSliders,
  getCertificates,
  getPartners,
  getServices
} from "@/lib/content";

export default async function Home({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const media = getMedia();
  const content = getContent();
  const sliders = getSliders();
  const certificates = getCertificates();
  const partners = getPartners();
  const services = getServices();

  function pickC(obj, fallback) {
    if (!obj) return fallback;
    if (typeof obj === "string") return obj;
    return obj[locale] || obj.fa || obj.en || fallback;
  }

  return (
    <>
      <HeroStatsCombined sliders={sliders} locale={locale} fallbackDict={dict} />

      <ExplodedViewer locale={locale} />

      <ProductGrid limit={8} />

      <ServicesCombined services={services} locale={locale} />

      <SizingVideoCombined videoUrl={media.introVideoUrl} locale={locale} />

      <CredibilityCombined
        certificates={certificates}
        partners={partners}
        content={content}
        locale={locale}
      />

      <section className="container-x py-12 sm:py-16">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 md:p-16 text-center"
          style={{
            background: "linear-gradient(160deg, #0F1114 0%, #1F2124 50%, #3A3D42 100%)",
            border: "1px solid rgba(212, 160, 23, 0.3)"
          }}>
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black">
              <span className="heading-gold">
                {pickC(content.cta && content.cta.title, dict.cta.title)}
              </span>
            </h2>
            <p className="mt-5 text-silver-300 max-w-2xl mx-auto leading-8 text-sm sm:text-base">
              {pickC(content.cta && content.cta.desc, dict.cta.desc)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4 justify-center">
              <Link href={"/" + locale + "/contact"} className="btn-gold text-sm">
                {pickC(content.cta && content.cta.button, dict.cta.button)} <ArrowLeft size={18} />
              </Link>
              <Link href={"/" + locale + "/products"} className="btn-outline text-sm">
                {dict.common.allProducts}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
