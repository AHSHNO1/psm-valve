"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeft } from "lucide-react";
import { products } from "@/lib/products";
import { useDictionary } from "./Providers";

function pickText(obj, locale) {
  if (!obj) return "";
  return obj[locale] || obj.en || obj.fa || "";
}

export default function SearchButton() {
  const { locale } = useDictionary();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q
    ? products
        .filter((p) => {
          const name = pickText(p.name, locale).toLowerCase();
          const short = pickText(p.short, locale).toLowerCase();
          const series = (p.series || "").toLowerCase();
          return name.includes(q) || short.includes(q) || series.includes(q);
        })
        .slice(0, 8)
    : [];

  const go = (slug) => {
    setOpen(false);
    setQuery("");
    router.push(`/${locale}/products/${slug}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="w-10 h-10 rounded-lg border grid place-items-center transition hover:text-gold-500 hover:border-gold-500"
        style={{ borderColor: "var(--border-strong)", color: "var(--text-soft)" }}
      >
        <Search size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <Search size={20} style={{ color: "var(--gold)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={locale === "fa" ? "جستجوی محصول..." : "Search products..."}
                  className="flex-1 bg-transparent border-0 outline-none text-base"
                  style={{ color: "var(--text)" }}
                />
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-[var(--bg-soft)]">
                  <X size={18} style={{ color: "var(--text-soft)" }} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {!q && (
                  <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {locale === "fa" ? "نام یا کد محصول را تایپ کنید" : "Type product name or series"}
                  </div>
                )}
                {q && results.length === 0 && (
                  <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {locale === "fa" ? "محصولی یافت نشد" : "No results"}
                  </div>
                )}
                {results.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => go(p.slug)}
                    className="w-full text-right flex items-center gap-4 p-4 transition hover:bg-[var(--bg-soft)] border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg grid place-items-center shrink-0"
                      style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}
                    >
                      <div className="w-6 h-6 rounded-full bg-gold-gradient" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>
                        {pickText(p.name, locale)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {p.series}
                      </div>
                    </div>
                    <ArrowLeft size={14} className="shrink-0" style={{ color: "var(--gold)" }} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
