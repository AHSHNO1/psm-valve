"use client";
import { useState } from "react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

function FAQItem({ faq, locale, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid " + (open ? "var(--gold)" : "var(--border)"),
        borderRadius: 16,
        marginBottom: 10,
        overflow: "hidden",
        transition: "all 0.2s"
      }}
    >
      <button
        onClick={function() { setOpen(!open); }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "right",
          fontFamily: "inherit"
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          display: "grid", placeItems: "center",
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
        </div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.5 }}>
          {pick(faq.question, locale)}
        </div>
        <div style={{
          color: "var(--text-muted)",
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s",
          fontSize: 18
        }}>
          ▾
        </div>
      </button>

      {open && (
        <div style={{
          padding: "0 20px 20px 74px",
          fontSize: 14,
          lineHeight: 2,
          color: "var(--text-soft)",
          borderTop: "1px solid var(--border)",
          paddingTop: 16
        }}>
          {pick(faq.answer, locale)}
        </div>
      )}
    </div>
  );
}

export default function FaqList({ faqs, content, locale }) {
  const meta = (content && content.faq) || {};
  const title = pick(meta.title, locale) || (locale === "fa" ? "سوالات متداول" : "FAQ");
  const subtitle = pick(meta.subtitle, locale) || "";

  const labels = {
    fa: { badge: "پاسخ سریع", empty: "به‌زودی سوالات اضافه می‌شود" },
    en: { badge: "Quick Answers", empty: "Questions coming soon" },
    ar: { badge: "إجابات سريعة", empty: "الأسئلة قريباً" },
    ru: { badge: "Быстрые ответы", empty: "Скоро" }
  }[locale] || { badge: "FAQ", empty: "Coming soon" };

  // Group by category
  const grouped = {};
  faqs.forEach(function(f) {
    const cat = pick(f.category, locale) || (locale === "fa" ? "عمومی" : "General");
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  });

  return (
    <section className="container-x py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="chip">{labels.badge}</span>
        <h1 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {faqs.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{labels.empty}</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {Object.keys(grouped).map(function(cat, gi) {
            return (
              <div key={gi} style={{ marginBottom: 32 }}>
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
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--gold)"
                  }} />
                  {cat}
                </h2>
                {grouped[cat].map(function(f, fi) {
                  return (
                    <FAQItem
                      key={f.id}
                      faq={f}
                      locale={locale}
                      defaultOpen={gi === 0 && fi === 0}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
