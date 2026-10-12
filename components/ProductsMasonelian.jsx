"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame, ArrowLeft, Filter, Package
} from "lucide-react";
import { categories } from "@/lib/categories";
import { useDictionary } from "./Providers";

const ICONS = {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame
};

export default function ProductsMasonelian() {
  const { locale, t } = useDictionary();
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all"
    ? categories
    : categories.filter((c) => c.id === activeCategory);

  const totalProducts = categories.reduce((s, c) => s + c.products.length, 0);

  return (
    <section className="container-x py-10 sm:py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="chip">
          <Package size={12} /> {t.products.catalog}
        </span>
        <h1 className="section-title mt-4">
          <span className="heading-grad">{t.products.pageTitle1}</span>{" "}
          <span className="heading-gold">{t.products.pageTitle2}</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-soft">
          {categories.length} {locale === "fa" ? "دسته" : "categories"} · {totalProducts} {locale === "fa" ? "محصول" : "products"}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} style={{ color: "var(--gold)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>
            {locale === "fa" ? "فیلتر بر اساس دسته" : "Filter by category"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "all" ? "btn-gold" : "btn-outline"
            }`}
            style={{ padding: activeCategory === "all" ? undefined : "0.5rem 1rem" }}
          >
            {locale === "fa" ? "همه" : "All"}
          </button>
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon] || Package;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === cat.id ? "btn-gold" : "btn-outline"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{cat.name[locale] || cat.name.fa}</span>
                <span className="sm:hidden">{(cat.name[locale] || cat.name.fa).split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product loops */}
      <div className="space-y-12 sm:space-y-16">
        {filtered.map((cat) => {
          const Icon = ICONS[cat.icon] || Package;
          return (
            <div key={cat.id} id={cat.id}>
              {/* Category header */}
              <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl grid place-items-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-lg sm:text-2xl" style={{ color: "var(--text)" }}>
                    {cat.name[locale] || cat.name.fa}
                  </h2>
                  <p className="text-xs sm:text-sm mt-1 text-soft leading-relaxed">
                    {cat.desc[locale] || cat.desc.fa}
                  </p>
                </div>
              </div>

              {/* Product grid */}
              <div className="product-grid-masonelian">
                {cat.products.map((p, i) => (
                  <motion.div
                    key={p.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                  >
                    <Link
                      href={`/${locale}/products/${p.slug}`}
                      className="product-card-masonelian block p-4 sm:p-6 h-full"
                    >
                      {/* Product visual placeholder */}
                      <div
                        className="relative aspect-[4/3] rounded-xl mb-4 sm:mb-5 grid place-items-center overflow-hidden"
                        style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}
                      >
                        <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gold-gradient opacity-20 blur-2xl group-hover:opacity-40 transition" />
                        <div className="absolute w-14 sm:w-16 h-14 sm:h-16 rounded-full border-2 grid place-items-center"
                          style={{ borderColor: "var(--border-strong)" }}>
                          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gold-gradient" />
                        </div>
                        {/* Series badge */}
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--gold)" }}>
                          {p.series}
                        </div>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base leading-6" style={{ color: "var(--text)" }}>
                        {p.name[locale] || p.name.fa}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                        {p.short[locale] || p.short.fa}
                      </p>

                      <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "var(--gold)" }}>
                        {t.common.learnMore} <ArrowLeft size={12} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
