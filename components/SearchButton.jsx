"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeft } from "lucide-react";
import { useDictionary } from "./Providers";

function pickText(obj, locale) {
  if (!obj) return "";
  return obj[locale] || obj.en || obj.fa || "";
}

export default function SearchButton() {
  const { locale } = useDictionary();
  const [products, setProducts] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const catalogRequestStarted = useRef(false);
  const router = useRouter();
  const labels = {
    fa: {
      search: "جستجوی محصولات",
      close: "بستن جستجو",
      input: "جستجو بر اساس نام یا کد محصول",
      placeholder: "جستجوی محصول...",
      instruction: "نام یا کد محصول را تایپ کنید",
      noResults: "محصولی یافت نشد",
      loading: "در حال بارگذاری کاتالوگ…",
      loadError: "بارگذاری محصولات ناموفق بود.",
      retry: "تلاش دوباره"
    },
    en: {
      search: "Search products",
      close: "Close search",
      input: "Search by product name or series",
      placeholder: "Search products...",
      instruction: "Type a product name or series",
      noResults: "No products found",
      loading: "Loading product catalog…",
      loadError: "Unable to load products.",
      retry: "Try again"
    },
    ar: {
      search: "البحث عن المنتجات",
      close: "إغلاق البحث",
      input: "البحث باسم المنتج أو رقمه",
      placeholder: "البحث عن المنتجات...",
      instruction: "اكتب اسم المنتج أو رقمه",
      noResults: "لم يتم العثور على منتجات",
      loading: "جارٍ تحميل كتالوج المنتجات…",
      loadError: "تعذر تحميل المنتجات.",
      retry: "إعادة المحاولة"
    },
    ru: {
      search: "Поиск продукции",
      close: "Закрыть поиск",
      input: "Поиск по названию или серии",
      placeholder: "Поиск продукции...",
      instruction: "Введите название продукции или серию",
      noResults: "Продукция не найдена",
      loading: "Загрузка каталога…",
      loadError: "Не удалось загрузить каталог.",
      retry: "Повторить"
    }
  }[locale] || {
    search: "Search products",
    close: "Close search",
    input: "Search by product name or series",
    placeholder: "Search products...",
    instruction: "Type a product name or series",
    noResults: "No products found",
    loading: "Loading product catalog…",
    loadError: "Unable to load products.",
    retry: "Try again"
  };

  async function openSearch() {
    setOpen(true);
    if (catalogRequestStarted.current) return;

    catalogRequestStarted.current = true;
    setCatalogStatus("loading");
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok || !Array.isArray(data.products)) {
        throw new Error(data.error || labels.loadError);
      }
      setProducts(data.products);
      setCatalogStatus("loaded");
    } catch {
      catalogRequestStarted.current = false;
      setCatalogStatus("error");
    }
  }

  function retryCatalog() {
    catalogRequestStarted.current = false;
    setCatalogStatus("idle");
    openSearch();
  }

  useEffect(() => {
    function onKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const closeSearch = (restoreFocus) => {
    setOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const onDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSearch(true);
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(dialogRef.current.querySelectorAll(
      'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

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
    closeSearch(false);
    setQuery("");
    router.push(`/${locale}/products/${slug}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        ref={triggerRef}
        aria-label={labels.search}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "product-search-dialog" : undefined}
        className="header-control w-10 h-10 rounded-lg border grid place-items-center transition hover:text-gold-500 hover:border-gold-500"
        style={{ borderColor: "var(--border-strong)", color: "var(--text)", background: "var(--bg-card)" }}
      >
        <Search size={19} strokeWidth={2.4} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            id="product-search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={labels.search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onKeyDown={onDialogKeyDown}
            onClick={() => closeSearch(true)}
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
                  aria-label={labels.input}
                  placeholder={labels.placeholder}
                  className="flex-1 bg-transparent border-0 outline-none text-base"
                  style={{ color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => closeSearch(true)}
                  aria-label={labels.close}
                  className="p-1 rounded hover:bg-[var(--bg-soft)]">
                  <X size={18} style={{ color: "var(--text-soft)" }} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {!q && (
                  <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {labels.instruction}
                  </div>
                )}
                {q && catalogStatus === "loading" && (
                  <div className="p-6 text-center text-sm" role="status" style={{ color: "var(--text-muted)" }}>
                    {labels.loading}
                  </div>
                )}
                {q && catalogStatus === "error" && (
                  <div className="p-6 text-center text-sm" role="alert" style={{ color: "var(--text-muted)" }}>
                    <div>{labels.loadError}</div>
                    <button type="button" onClick={retryCatalog} className="mt-3 underline">
                      {labels.retry}
                    </button>
                  </div>
                )}
                {q && catalogStatus === "loaded" && results.length === 0 && (
                  <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {labels.noResults}
                  </div>
                )}
                {catalogStatus === "loaded" && results.map((p) => (
                  <button
                    type="button"
                    key={p.slug}
                    onClick={() => go(p.slug)}
                    className="w-full text-start flex items-center gap-4 p-4 transition hover:bg-[var(--bg-soft)] border-b"
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
