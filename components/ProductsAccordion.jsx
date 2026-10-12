"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame, ChevronDown, Package, ArrowLeft
} from "lucide-react";
import { categories } from "@/lib/categories";
import { useDictionary } from "./Providers";

const ICONS = {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame
};

export default function ProductsAccordion() {
  const { locale, t } = useDictionary();
  const [openId, setOpenId] = useState(categories[0].id);

  const toggle = (id) => setOpenId(openId === id ? null : id);

  return (
    <section className="container-x py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="chip">
            <Package size={12} /> {t.products.catalog}
          </span>
          <h1 className="section-title mt-4">
            <span className="heading-grad">{t.products.pageTitle1}</span>{" "}
            <span className="heading-gold">{t.products.pageTitle2}</span>
          </h1>
          <p className="mt-4 text-soft">
            {categories.length} {locale === "fa" ? "دسته محصول" : "categories"} · {" "}
            {categories.reduce((s, c) => s + c.subcategories.length, 0)}{" "}
            {locale === "fa" ? "محصول" : "products"}
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon] || Package;
            const isOpen = openId === cat.id;
            const catName = cat.name[locale] || cat.name.fa;

            return (
              <div
                key={cat.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid " + (isOpen ? "var(--gold)" : "var(--border)"),
                  boxShadow: isOpen ? "var(--shadow-md)" : "var(--shadow-sm)"
                }}
              >
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-[var(--bg-soft)] transition"
                  style={{ color: "var(--text)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl grid place-items-center shrink-0 transition"
                      style={{
                        background: isOpen ? "linear-gradient(135deg,#D4A017,#F5C518)" : "var(--bg-soft)",
                        color: isOpen ? "#1A1D21" : "var(--gold)"
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg">{catName}</div>
                      <div className="text-xs text-muted mt-1">
                        {cat.subcategories.length} {locale === "fa" ? "زیرمجموعه" : "items"}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className="transition-transform"
                    style={{
                      color: "var(--gold)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)"
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="p-5 pt-0 space-y-2"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <div className="pt-4 space-y-2">
                          {cat.subcategories.map((sub) => {
                            const subName = sub.name[locale] || sub.name.fa;
                            return (
                              <Link
                                key={sub.slug}
                                href={`/${locale}/products/${sub.slug}`}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-soft)] transition group"
                              >
                                <span
                                  className="font-semibold text-sm group-hover:text-[var(--gold)] transition"
                                  style={{ color: "var(--text-soft)" }}
                                >
                                  {subName}
                                </span>
                                <ArrowLeft
                                  size={14}
                                  className="opacity-0 group-hover:opacity-100 transition"
                                  style={{ color: "var(--gold)" }}
                                />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
