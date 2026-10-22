"use client";
import Link from "next/link";
import HeroSlider from "./HeroSlider";
import { motion } from "framer-motion";
import { Package, Calculator, FileText, Phone, ArrowLeft } from "lucide-react";

export default function HeroStatsCombined({ sliders, locale, fallbackDict, logo }) {
  const L = {
    fa: {
      products: "محصولات",
      productsSub: "مشاهده دسته‌بندی محصولات",
      sizing: "سایزینگ آنلاین",
      sizingSub: "محاسبه اولیه Cv و Kv",
      catalog: "کاتالوگ PDF",
      catalogSub: "دریافت کاتالوگ‌های محصولات",
      contact: "مشاوره فنی",
      contactSub: "ارتباط با کارشناسان ما"
    },
    en: {
      products: "Products",
      productsSub: "Browse product categories",
      sizing: "Online Sizing",
      sizingSub: "Estimate Cv and Kv",
      catalog: "PDF Catalog",
      catalogSub: "Browse product catalogs",
      contact: "Technical Support",
      contactSub: "Talk with our specialists"
    },
    ar: {
      products: "المنتجات",
      productsSub: "تصفح فئات المنتجات",
      sizing: "تحديد الحجم",
      sizingSub: "تقدير أولي لقيمتي Cv وKv",
      catalog: "الكتالوج PDF",
      catalogSub: "تصفح كتالوجات المنتجات",
      contact: "دعم فني",
      contactSub: "تواصل مع خبرائنا"
    },
    ru: {
      products: "Продукты",
      productsSub: "Категории продукции",
      sizing: "Онлайн-подбор",
      sizingSub: "Предварительный расчет Cv и Kv",
      catalog: "Каталог PDF",
      catalogSub: "Каталоги продукции",
      contact: "Техподдержка",
      contactSub: "Связь с нашими специалистами"
    }
  }[locale] || {};

  const actions = [
    {
      id: "products",
      href: "/" + locale + "/products",
      icon: Package,
      title: L.products,
      sub: L.productsSub,
      color: "#0078D4"
    },
    {
      id: "sizing",
      href: "/" + locale + "/sizing",
      icon: Calculator,
      title: L.sizing,
      sub: L.sizingSub,
      color: "#E0A81A",
      featured: true
    },
    {
      id: "catalog",
      href: "/" + locale + "/media?tab=catalogs",
      icon: FileText,
      title: L.catalog,
      sub: L.catalogSub,
      color: "#10B981"
    },
    {
      id: "contact",
      href: "/" + locale + "/contact",
      icon: Phone,
      title: L.contact,
      sub: L.contactSub,
      color: "#DB2777"
    }
  ];

  return (
    <div>
      <HeroSlider
        sliders={sliders}
        locale={locale}
        logo={logo}
        fallbackDict={fallbackDict}
      />

      {/* Smart Action Bar */}
      <div className="smart-bar-section">
        <div className="container-x">
          <div className="smart-bar-grid">
            {actions.map(function (a, i) {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                >
                  <Link
                    href={a.href}
                    className={"smart-card" + (a.featured ? " smart-card-featured" : "")}
                    style={{ "--sc": a.color }}
                  >
                    <div className="smart-icon">
                      <Icon size={20} strokeWidth={2.4} />
                    </div>
                    <div className="smart-content">
                      <div className="smart-title">
                        {a.title}
                        <ArrowLeft size={12} className="smart-arrow" />
                      </div>
                      <div className="smart-sub">{a.sub}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
