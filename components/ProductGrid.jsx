"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { products } from "@/lib/products";
import { useDictionary } from "./Providers";

export default function ProductGrid({ limit }) {
  const { locale, t } = useDictionary();
  const list = limit ? products.slice(0, limit) : products;

  const pick = (obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[locale] || obj.en || obj.fa || "";
  };

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div>
          <span className="chip">{t.products.badge}</span>
          <h2 className="section-title mt-3">
            <span className="heading-grad">{t.products.title1}</span>{" "}
            <span className="heading-gold">{t.products.title2}</span>
          </h2>
        </div>
        <Link href={"/" + locale + "/products"} className="btn-outline text-sm">
          {t.common.allProducts} <ArrowLeft size={16} />
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
              className="block h-full rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl group"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="relative aspect-square grid place-items-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--bg-soft), var(--bg-card))" }}>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={pick(p.name, locale)}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-contain p-3 sm:p-5 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-gold-gradient opacity-20 blur-2xl group-hover:opacity-40 transition" />
                    <div className="absolute w-16 h-16 rounded-full border-2 grid place-items-center"
                      style={{ borderColor: "var(--border-strong)" }}>
                      <div className="w-9 h-9 rounded-full bg-gold-gradient" />
                    </div>
                  </>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--gold)" }}>
                  {p.series}
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="font-black text-xs sm:text-sm leading-tight mb-1 line-clamp-2"
                  style={{ color: "var(--text)" }}>
                  {pick(p.name)}
                </h3>
                <p className="text-[10px] sm:text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
                  {pick(p.short)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
