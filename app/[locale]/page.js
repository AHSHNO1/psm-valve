import HeroStatsCombined from "@/components/HeroStatsCombined";
import ExplodedViewer from "@/components/ExplodedViewer";
import ProductGrid from "@/components/ProductGrid";
import ServicesCombined from "@/components/ServicesCombined";
import SizingVideoCombined from "@/components/SizingVideoCombined";
import CredibilityCombined from "@/components/CredibilityCombined";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle, Mail } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import { getMedia } from "@/lib/media";
import {
  getContent,
  getSliders,
  getCertificates,
  getPartners,
  getServices
} from "@/lib/content";
import "./home-cta.css";

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

  const contact = {
    phone: "+98 86 3413 1533",
    phone2: "+98 86 3413 1918",
    whatsapp: "https://wa.me/989188939209",
    email: "Info@psmvalve.com"
  };

  const CTA = {
    fa: {
      title: "آماده همکاری هستیم",
      desc: "برای مشاوره فنی، انتخاب محصول و دریافت قیمت، همین حالا با تیم مهندسی ما تماس بگیرید",
      contactBtn: "درخواست قیمت",
      productsBtn: "مشاهده محصولات",
      callNow: "تماس فوری",
      whatsapp: "واتساپ",
      email: "ایمیل",
      hours: "شنبه تا پنجشنبه ۷ تا ۱۵"
    },
    en: {
      title: "Ready to Work Together",
      desc: "For technical consultation, product selection and quotation, contact our engineering team now",
      contactBtn: "Request Quote",
      productsBtn: "View Products",
      callNow: "Call Now",
      whatsapp: "WhatsApp",
      email: "Email",
      hours: "Saturday to Thursday, 7:00 – 15:00"
    },
    ar: {
      title: "مستعدون للتعاون",
      desc: "للاستشارة الفنية واختيار المنتج والحصول على عرض سعر، اتصل بفريقنا الهندسي الآن",
      contactBtn: "طلب سعر",
      productsBtn: "المنتجات",
      callNow: "اتصل الآن",
      whatsapp: "واتساب",
      email: "البريد",
      hours: "السبت إلى الخميس، ٧:٠٠ – ١٥:٠٠"
    },
    ru: {
      title: "Готовы к сотрудничеству",
      desc: "Для технической консультации, подбора продукта и получения котировки свяжитесь с нашей инженерной командой",
      contactBtn: "Запросить цену",
      productsBtn: "Продукты",
      callNow: "Позвонить",
      whatsapp: "WhatsApp",
      email: "Email",
      hours: "Суббота – четверг, 7:00 – 15:00"
    }
  }[locale] || {
    title: "Ready to Work Together",
    desc: "Contact our engineering team now",
    contactBtn: "Request Quote",
    productsBtn: "View Products",
    callNow: "Call Now",
    whatsapp: "WhatsApp",
    email: "Email",
    hours: "Saturday to Thursday, 7:00 – 15:00"
  };

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

      {/* ============ CTA FINAL ============ */}
      <section className="container-x py-12 sm:py-16">
        <div className="cta-final-wrap">
          <div className="cta-final-bg" />
          <div className="cta-final-content">
            <h2 className="cta-final-title">
              <span className="heading-gold">{CTA.title}</span>
            </h2>
            <p className="cta-final-desc">{CTA.desc}</p>

            <div className="cta-final-methods">
              <a href={"tel:" + contact.phone.replace(/\s/g, "")} className="cta-method">
                <div className="cta-method-icon" style={{ background: "rgba(0, 120, 212, 0.15)", color: "#4DA6FF" }}>
                  <Phone size={18} />
                </div>
                <div className="cta-method-text">
                  <div className="cta-method-label">{CTA.callNow}</div>
                  <div className="cta-method-value" style={{ direction: "ltr" }}>
                    {contact.phone}
                  </div>
                </div>
              </a>

              <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="cta-method">
                <div className="cta-method-icon" style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366" }}>
                  <MessageCircle size={18} />
                </div>
                <div className="cta-method-text">
                  <div className="cta-method-label">{CTA.whatsapp}</div>
                  <div className="cta-method-value" style={{ direction: "ltr" }}>
                    +98 918 893 9209
                  </div>
                </div>
              </a>

              <a href={"mailto:" + contact.email} className="cta-method">
                <div className="cta-method-icon" style={{ background: "rgba(224, 168, 26, 0.15)", color: "#E0A81A" }}>
                  <Mail size={18} />
                </div>
                <div className="cta-method-text">
                  <div className="cta-method-label">{CTA.email}</div>
                  <div className="cta-method-value" style={{ direction: "ltr" }}>
                    {contact.email}
                  </div>
                </div>
              </a>
            </div>

            <div className="cta-final-actions">
              <Link href={"/" + locale + "/contact"} className="btn-gold">
                {CTA.contactBtn} <ArrowLeft size={16} />
              </Link>
              <Link href={"/" + locale + "/products"} className="cta-outline">
                {CTA.productsBtn}
              </Link>
            </div>

            <div className="cta-final-hours">{CTA.hours}</div>
          </div>
        </div>
      </section>
    </>
  );
}