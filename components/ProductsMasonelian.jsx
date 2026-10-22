"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame, ArrowLeft, Filter, Package, Search, X
} from "lucide-react";
import { getCategoryLabel } from "@/lib/category-utils";
import MediaImage from "./MediaImage";
import { useDictionary } from "./Providers";

const ICONS = {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame
};

const PRODUCTS_LABELS = {
  fa: {
    categories: "دسته",
    products: "محصول",
    filter: "فیلتر بر اساس دسته",
    all: "همه",
    search: "جستجو در کاتالوگ محصولات",
    searchPlaceholder: "نام محصول، سری یا مشخصات را جستجو کنید",
    results: "نمایش {count} از {total} محصول",
    noResults: "محصولی مطابق جستجوی شما پیدا نشد.",
    emptyCategory: "هنوز محصولی در این دسته ثبت نشده است.",
    clear: "پاک کردن فیلترها",
    clearSearch: "پاک کردن جستجو"
  },
  en: {
    categories: "categories",
    products: "products",
    filter: "Filter by category",
    all: "All",
    search: "Search product catalog",
    searchPlaceholder: "Search product name, series or specifications",
    results: "Showing {count} of {total} products",
    noResults: "No products match your search.",
    emptyCategory: "No products have been added to this category yet.",
    clear: "Clear filters",
    clearSearch: "Clear search"
  },
  ar: {
    categories: "فئات",
    products: "منتج",
    filter: "تصفية حسب الفئة",
    all: "الكل",
    search: "البحث في كتالوج المنتجات",
    searchPlaceholder: "ابحث باسم المنتج أو السلسلة أو المواصفات",
    results: "عرض {count} من أصل {total} منتج",
    noResults: "لم يتم العثور على منتجات تطابق بحثك.",
    emptyCategory: "لم تتم إضافة منتجات إلى هذه الفئة بعد.",
    clear: "مسح عوامل التصفية",
    clearSearch: "مسح البحث"
  },
  ru: {
    categories: "категории",
    products: "продуктов",
    filter: "Фильтр по категории",
    all: "Все",
    search: "Поиск по каталогу продукции",
    searchPlaceholder: "Название продукта, серия или характеристики",
    results: "Показано {count} из {total} продуктов",
    noResults: "По вашему запросу ничего не найдено.",
    emptyCategory: "В этой категории пока нет продуктов.",
    clear: "Сбросить фильтры",
    clearSearch: "Очистить поиск"
  }
};

const DIGITS = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
};

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩]/g, (digit) => DIGITS[digit])
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .trim();
}

function getSearchText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return Object.values(value).map(getSearchText).join(" ");
}

function pickLocalized(value, locale) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.en || value.fa || "";
}

export default function ProductsMasonelian({ products = [], categories = [], header = null }) {
  const { locale, t } = useDictionary();
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const labels = PRODUCTS_LABELS[locale] || PRODUCTS_LABELS.en;
  const normalizedQuery = normalizeSearchText(query);

  const visibleCategories = useMemo(() => categories.filter((category) => {
    if (category.hidden) return false;
    if (!category.parentId) return true;
    const parent = categories.find((item) => item.id === category.parentId);
    return !parent || !parent.hidden;
  }), [categories]);

  const catalogCategories = useMemo(() => visibleCategories
    .map((category) => ({
      ...category,
      products: products.filter((product) => product.categoryId === category.id)
    })), [products, visibleCategories]);

  const filterCategories = visibleCategories.filter((category) => !category.parentId);

  const filtered = useMemo(() => catalogCategories
    .filter((category) => {
      if (activeCategory === "all") return !category.parentId;
      if (category.id === activeCategory) return true;
      // نمای والد، زیرمجموعه‌ها را هم نشان می‌دهد
      return category.parentId === activeCategory;
    })
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => {
        if (!normalizedQuery) return true;
        const searchableText = normalizeSearchText([
          product.series,
          product.name,
          product.short,
          product.spec,
          product.specs,
          category.name,
          category.desc,
          category.parentId && categories.find((item) => item.id === category.parentId)?.name
        ].map(getSearchText).join(" "));
        return searchableText.includes(normalizedQuery);
      })
    })), [activeCategory, catalogCategories, normalizedQuery]);

  const totalProducts = products.length;
  const resultCount = filtered.reduce((count, category) => count + category.products.length, 0);
  const visibleCategoryCount = new Set(visibleCategories.map((category) => category.parentId || category.id)).size;
  const hasFilters = activeCategory !== "all" || Boolean(query.trim());
  const headerBadge = pickLocalized(header?.badge, locale) || t.products.catalog;
  const headerTitle1 = pickLocalized(header?.title1, locale) || t.products.pageTitle1;
  const headerTitle2 = pickLocalized(header?.title2, locale) || t.products.pageTitle2;
  const headerDescription = pickLocalized(header?.description, locale);
  const resultMessage = labels.results
    .replace("{count}", String(resultCount))
    .replace("{total}", String(totalProducts));

  return (
    <section className="container-x py-10 sm:py-16" aria-labelledby="products-page-title">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="chip">
          <Package size={12} /> {headerBadge}
        </span>
        <h1 id="products-page-title" className="section-title mt-4">
          <span className="heading-grad">{headerTitle1}</span>{" "}
          <span className="heading-gold">{headerTitle2}</span>
        </h1>
        {headerDescription && (
          <p className="mt-4 text-sm sm:text-base text-soft leading-7">{headerDescription}</p>
        )}
        <p className="mt-4 text-sm sm:text-base text-soft">
          {visibleCategoryCount} {labels.categories} · {totalProducts} {labels.products}
        </p>
      </div>

      <div className="mb-8 sm:mb-12">
        <form
          role="search"
          aria-label={labels.search}
          className="relative mb-5 max-w-2xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search
            size={18}
            aria-hidden="true"
            className="absolute inset-y-0 my-auto"
            style={{ insetInlineStart: "1rem", color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={labels.search}
            placeholder={labels.searchPlaceholder}
            className="input-field"
            style={{ paddingInlineStart: "2.9rem", paddingInlineEnd: query ? "2.9rem" : undefined }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={labels.clearSearch}
              className="absolute inset-y-0 my-auto grid h-9 w-9 place-items-center rounded-lg transition hover:bg-[var(--bg-soft)]"
              style={{ insetInlineEnd: "0.5rem", color: "var(--text-muted)" }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} aria-hidden="true" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>
              {labels.filter}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" aria-live="polite" style={{ color: "var(--text-muted)" }}>
              {resultMessage}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setQuery("");
                }}
                className="text-xs font-bold underline underline-offset-4"
                style={{ color: "var(--gold)" }}
              >
                {labels.clear}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeCategory === "all" ? "btn-gold" : "btn-outline"
            }`}
            style={{ padding: activeCategory === "all" ? undefined : "0.5rem 1rem" }}
          >
            {labels.all}
          </button>
          {filterCategories.map((cat) => {
            const Icon = ICONS[cat.icon] || Package;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === cat.id ? "btn-gold" : "btn-outline"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{getCategoryLabel(cat, locale, categories)}</span>
                <span className="sm:hidden">{getCategoryLabel(cat, locale, categories).split(" / ").at(-1).split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product loops */}
      {filtered.length > 0 ? (
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
                  {cat.parentId && (
                    <p className="mb-1 text-[10px] sm:text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {getCategoryLabel(categories.find((item) => item.id === cat.parentId), locale, categories)}
                    </p>
                  )}
                  <h2 className="font-black text-lg sm:text-2xl" style={{ color: "var(--text)" }}>
                    {cat.parentId ? pickLocalized(cat.name, locale) : getCategoryLabel(cat, locale, categories)}
                  </h2>
                  <p className="text-xs sm:text-sm mt-1 text-soft leading-relaxed">
                    {pickLocalized(cat.desc, locale)}
                  </p>
                </div>
              </div>

              {/* زیرمجموعه‌ها */}
              {cat.children && cat.children.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 mb-6 sm:mb-8">
                  {cat.children.map(function (childId) {
                    const child = catalogCategories.find(function (item) { return item.id === childId; });
                    if (!child) return null;
                    const ChildIcon = ICONS[child.icon] || Package;
                    return (
                      <button
                        key={childId}
                        type="button"
                        onClick={function () { setActiveCategory(childId); }}
                        className="text-start flex items-start gap-3 rounded-xl p-4 transition-all hover:border-[var(--gold)]"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                      >
                        <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                          style={{ background: "var(--bg-soft)", color: "var(--gold)" }}>
                          <ChildIcon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black" style={{ color: "var(--text)" }}>
                            {pickLocalized(child.name, locale)}
                          </span>
                          <span className="block text-xs mt-0.5 leading-5" style={{ color: "var(--text-muted)" }}>
                            {pickLocalized(child.desc, locale)}
                          </span>
                        </span>
                        <ArrowLeft size={14} style={{ color: "var(--gold)", marginTop: 4 }} />
                      </button>
                    );
                  })}
                </div>
              )}

              {cat.products.length > 0 ? (
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
                      className="product-card-masonelian group block p-4 sm:p-6 h-full"
                    >
                      {p.image ? (
                        <div
                          className="relative aspect-[4/3] rounded-xl mb-4 sm:mb-5 overflow-hidden bg-[var(--bg-soft)]"
                          style={{ border: "1px solid var(--border)" }}
                        >
                          <MediaImage
                            src={p.image}
                            alt={pickLocalized(p.name, locale)}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="w-full h-full object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--gold)" }}>
                            {p.series}
                          </div>
                        </div>
                      ) : (
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
                      )}

                      <h3 className="font-bold text-sm sm:text-base leading-6" style={{ color: "var(--text)" }}>
                        {pickLocalized(p.name, locale)}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                        {pickLocalized(p.short, locale)}
                      </p>

                      <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "var(--gold)" }}>
                        {t.common.learnMore} <ArrowLeft size={12} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              ) : (
                <div className="card-glass rounded-2xl px-5 py-6 text-sm leading-7" style={{ color: "var(--text-soft)" }} role="status">
                  <p>{pickLocalized(cat.desc, locale)}</p>
                  {cat.parentId && (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {locale === "fa"
                        ? "محصولی در این زیرمجموعه ثبت نشده است؛ برای ثبت، از پنل مدیریت استفاده کنید."
                        : "No products are listed in this subcategory yet."}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      ) : (
        <div className="card-glass px-5 py-12 text-center" role="status">
          <Search size={28} aria-hidden="true" className="mx-auto mb-3" style={{ color: "var(--gold)" }} />
          <p className="font-bold" style={{ color: "var(--text)" }}>
            {activeCategory !== "all" && !normalizedQuery ? labels.emptyCategory : labels.noResults}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setQuery("");
            }}
            className="btn-outline mt-5 text-sm"
          >
            {labels.clear}
          </button>
        </div>
      )}
    </section>
  );
}
