"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { products } from "@/lib/products";
import { useDictionary } from "./Providers";

const categoryLabel = {
  "control-valves": { fa: "شیر کنترلی", en: "Control Valve", ar: "صمام تحكم", ru: "Регулирующий клапан" },
  "ball-valves": { fa: "شیر توپی", en: "Ball Valve", ar: "صمام كروي", ru: "Шаровой клапан" },
  "pneumatic-actuators": { fa: "اکچوئیتور", en: "Actuator", ar: "مؤثر", ru: "Привод" },
  "filters": { fa: "فیلتر", en: "Filter", ar: "مرشح", ru: "Фильтр" },
  default: { fa: "محصول", en: "Product", ar: "منتج", ru: "Продукт" }
};

export default function ProductGrid({ limit }) {
  const { locale, t } = useDictionary();
  const isRtl = locale === "fa" || locale === "ar";
  const DirectionalArrow = isRtl ? ArrowLeft : ArrowRight;
  const list = limit ? products.slice(0, limit) : products;

  const pick = (obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[locale] || obj.en || obj.fa || "";
  };

  const getCategory = (product) => {
    const map = categoryLabel[product.categoryId] || categoryLabel.default;
    return map[locale] || map.en || map.fa || "Product";
  };

  return (
    <section className="relative py-12 sm:py-16">
      <div className="container-x relative z-10">
        <div className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div>
            <span className="chip">
              <Sparkles size={12} />
              {t.products.badge}
            </span>
            <h2 className="section-title mt-3">
              <span className="heading-grad">{t.products.title1}</span>{" "}
              <span className="heading-gold">{t.products.title2}</span>
            </h2>
          </div>
          <Link href={"/" + locale + "/products"} className="btn-outline text-sm">
            {t.common.allProducts} <DirectionalArrow size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {list.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={"/" + locale + "/products/" + p.slug}
                className="product-card-masonelian group block h-full"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b"
                  style={{
                    background: "radial-gradient(circle at top, rgba(245, 197, 24, 0.16), transparent 40%), linear-gradient(135deg, var(--bg-soft), var(--bg-card))",
                    borderColor: "var(--border)"
                  }}
                >
                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ background: "rgba(15,17,20,0.9)", borderColor: "rgba(255,255,255,0.28)", color: "#FFFFFF" }}>
                    {getCategory(p)}
                  </div>

                  <div className="absolute top-3 right-3 z-10 rounded-full border px-2 py-1 text-[9px] font-black"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--gold)" }}>
                    {p.series}
                  </div>

                  {p.image ? (
                    <img
                      src={p.image}
                      alt={pick(p.name)}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-contain p-4 sm:p-5 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-18 h-18 rounded-full border-2 border-dashed opacity-70" style={{ borderColor: "var(--gold)" }} />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(10,12,14,0.55)] to-transparent" />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                    <span>PSM</span>
                    <span className="inline-flex items-center gap-1">
                      {t.common.learnMore}
                      <ArrowUpRight size={12} />
                    </span>
                  </div>

                  <h3 className="mb-2 line-clamp-2 text-sm font-black leading-snug sm:text-[15px]" style={{ color: "var(--text)" }}>
                    {pick(p.name)}
                  </h3>

                  <p className="line-clamp-2 text-xs leading-5 sm:text-[13px]" style={{ color: "var(--text-soft)" }}>
                    {pick(p.short)}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <span className="inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ borderColor: "var(--border)", color: "var(--gold)" }}>
                      {t.common.requestQuote}
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}>
                      <DirectionalArrow size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
