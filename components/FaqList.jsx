"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, ChevronDown, MessageCircle, Search, X } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

function FAQItem({ faq, locale, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const answerId = "faq-answer-" + faq.id;

  return (
    <article
      style={{
        background: "var(--bg-card)",
        border: "1px solid " + (open ? "var(--gold)" : "var(--border)"),
        borderRadius: 16,
        marginBottom: 10,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: open ? "0 8px 24px rgba(20, 22, 27, 0.06)" : "none"
      }}
    >
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          onClick={function() { setOpen(!open); }}
          aria-expanded={open}
          aria-controls={answerId}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 20px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "start",
            fontFamily: "inherit"
          }}
        >
          <span style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: open
              ? "linear-gradient(135deg, #E0A81A, #B8850A)"
              : "var(--bg-soft)",
            color: open ? "#FFFFFF" : "var(--gold)",
            flexShrink: 0,
            fontWeight: 900,
            fontSize: 15,
            transition: "all 0.2s"
          }}>
            ?
          </span>
          <span style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 800,
            color: "var(--text)",
            lineHeight: 1.7
          }}>
            {pick(faq.question, locale)}
          </span>
          <ChevronDown
            size={19}
            aria-hidden="true"
            style={{
              color: "var(--text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
              flexShrink: 0
            }}
          />
        </button>
      </h3>

      <div
        id={answerId}
        hidden={!open}
        style={{
          padding: "16px 20px 20px",
          fontSize: 14,
          lineHeight: 2,
          color: "var(--text-soft)",
          borderTop: "1px solid var(--border)"
        }}
      >
        {pick(faq.answer, locale)}
      </div>
    </article>
  );
}

export default function FaqList({ faqs, content, locale }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const meta = (content && content.faq) || {};
  const isRtl = locale === "fa" || locale === "ar";
  const defaultTitle = {
    fa: "سوالات متداول",
    en: "Frequently Asked Questions",
    ar: "الأسئلة الشائعة",
    ru: "Часто задаваемые вопросы"
  }[locale] || "FAQ";
  const title = pick(meta.title, locale) || defaultTitle;
  const subtitle = pick(meta.subtitle, locale);

  const labels = {
    fa: {
      badge: "راهنمای سریع",
      empty: "هنوز پرسشی ثبت نشده است",
      all: "همه موضوع‌ها",
      search: "جستجو در پرسش‌ها...",
      count: "پرسش",
      noResults: "پرسشی با این عبارت پیدا نشد.",
      clear: "پاک کردن جستجو",
      contactTitle: "پاسخ پرسش خود را پیدا نکردید؟",
      contactDesc: "برای دریافت راهنمایی فنی یا استعلام قیمت با کارشناسان ما در تماس باشید.",
      contact: "تماس با کارشناسان"
    },
    en: {
      badge: "Quick guide",
      empty: "No questions have been added yet",
      all: "All topics",
      search: "Search questions...",
      count: "questions",
      noResults: "No questions match your search.",
      clear: "Clear search",
      contactTitle: "Couldn't find your answer?",
      contactDesc: "Contact our team for technical guidance or a quotation.",
      contact: "Contact our team"
    },
    ar: {
      badge: "دليل سريع",
      empty: "لم تتم إضافة أسئلة بعد",
      all: "جميع الموضوعات",
      search: "ابحث في الأسئلة...",
      count: "أسئلة",
      noResults: "لم نعثر على أسئلة تطابق بحثك.",
      clear: "مسح البحث",
      contactTitle: "لم تجد إجابة سؤالك؟",
      contactDesc: "تواصل مع فريقنا للحصول على إرشاد فني أو عرض سعر.",
      contact: "تواصل مع فريقنا"
    },
    ru: {
      badge: "Краткий справочник",
      empty: "Вопросы пока не добавлены",
      all: "Все темы",
      search: "Поиск по вопросам...",
      count: "вопросов",
      noResults: "По вашему запросу ничего не найдено.",
      clear: "Очистить поиск",
      contactTitle: "Не нашли ответ?",
      contactDesc: "Свяжитесь с нашей командой за технической консультацией или предложением.",
      contact: "Связаться с нами"
    }
  }[locale] || {
    badge: "FAQ",
    empty: "No questions have been added yet",
    all: "All topics",
    search: "Search questions...",
    count: "questions",
    noResults: "No questions match your search.",
    clear: "Clear search",
    contactTitle: "Couldn't find your answer?",
    contactDesc: "Contact our team for technical guidance or a quotation.",
    contact: "Contact our team"
  };

  const categories = Array.from(new Set(
    faqs.map(function(faq) {
      return pick(faq.category, locale) || (locale === "fa" ? "عمومی" : "General");
    })
  ));
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filteredFaqs = faqs.filter(function(faq) {
    const category = pick(faq.category, locale);
    const matchesCategory = !selectedCategory || category === selectedCategory;
    const searchableText = [
      pick(faq.question, locale),
      pick(faq.answer, locale),
      category
    ].join(" ").toLocaleLowerCase(locale);
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
  const grouped = {};
  filteredFaqs.forEach(function(faq) {
    const category = pick(faq.category, locale) || (locale === "fa" ? "عمومی" : "General");
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(faq);
  });
  const formatNumber = function(value) {
    return value.toLocaleString(locale);
  };

  return (
    <section className="container-x py-10 sm:py-16" dir={isRtl ? "rtl" : "ltr"}>
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <span className="chip">{labels.badge}</span>
        <h1 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
        <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          {formatNumber(faqs.length)} {labels.count}
        </p>
      </div>

      {faqs.length === 0 ? (
        <div className="card-glass p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <p style={{ color: "var(--text-muted)" }}>{labels.empty}</p>
        </div>
      ) : (
        <>
          <div className="max-w-3xl mx-auto mb-8">
            <label
              htmlFor="faq-search"
              className="sr-only"
            >
              {labels.search}
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              minHeight: 52,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-muted)"
            }}>
              <Search size={18} aria-hidden="true" />
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={function(event) { setQuery(event.target.value); }}
                placeholder={labels.search}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "13px 0",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--text)",
                  font: "inherit"
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={function() { setQuery(""); }}
                  aria-label={labels.clear}
                  title={labels.clear}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 32,
                    height: 32,
                    border: "none",
                    borderRadius: 8,
                    background: "var(--bg-soft)",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div
            className="max-w-3xl mx-auto mb-8"
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}
            aria-label={labels.all}
          >
            {[{ value: "", label: labels.all }].concat(categories.map(function(category) {
              return { value: category, label: category };
            })).map(function(item) {
              const active = selectedCategory === item.value;
              return (
                <button
                  key={item.value || "all"}
                  type="button"
                  onClick={function() { setSelectedCategory(item.value); }}
                  aria-pressed={active}
                  className={active ? "btn-gold" : "btn-outline"}
                  style={{
                    minHeight: 38,
                    padding: "8px 14px",
                    fontSize: 12
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="card-glass p-8 sm:p-12 text-center max-w-3xl mx-auto">
              <p style={{ color: "var(--text-muted)" }}>{labels.noResults}</p>
              <button
                type="button"
                onClick={function() { setQuery(""); setSelectedCategory(""); }}
                className="btn-outline mt-5"
              >
                {labels.clear}
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {Object.keys(grouped).map(function(category, categoryIndex) {
                return (
                  <div key={category} style={{ marginBottom: 32 }}>
                    <h2 style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: "var(--text)",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--gold)"
                      }} />
                      {category}
                    </h2>
                    {grouped[category].map(function(faq, faqIndex) {
                      return (
                        <FAQItem
                          key={faq.id}
                          faq={faq}
                          locale={locale}
                          defaultOpen={categoryIndex === 0 && faqIndex === 0}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-w-3xl mx-auto mt-10">
            <div className="card-glass p-6 sm:p-8" style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20
            }}>
              <div style={{ flex: "1 1 260px" }}>
                <h2 style={{
                  margin: "0 0 8px",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "var(--text)"
                }}>
                  {labels.contactTitle}
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "var(--text-soft)"
                }}>
                  {labels.contactDesc}
                </p>
              </div>
              <Link href={"/" + locale + "/contact"} className="btn-gold">
                <MessageCircle size={16} aria-hidden="true" />
                {labels.contact}
                <ArrowUpLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
