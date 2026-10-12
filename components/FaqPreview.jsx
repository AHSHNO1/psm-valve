"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function FaqPreview({ faqs, locale }) {
  const active = (faqs || []).filter(function(f) { return f.active !== false; }).slice(0, 5);
  const [openIdx, setOpenIdx] = useState(0);

  if (active.length === 0) return null;

  const title = locale === "fa" ? "سوالات متداول" : "FAQ";

  return (
    <section className="container-x py-12 sm:py-20">
      <div className="text-center mb-10">
        <span className="chip">
          <HelpCircle size={12} /> {locale === "fa" ? "پاسخ سریع" : "Quick Answers"}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto">
        {active.map(function(f, i) {
          const isOpen = openIdx === i;
          return (
            <div
              key={f.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid " + (isOpen ? "var(--gold)" : "var(--border)"),
                borderRadius: 14,
                marginBottom: 8,
                overflow: "hidden",
                transition: "all 0.2s"
              }}
            >
              <button
                onClick={function() { setOpenIdx(isOpen ? -1 : i); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 18px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "right",
                  fontFamily: "inherit"
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  display: "grid", placeItems: "center",
                  background: isOpen ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "var(--bg-soft)",
                  color: isOpen ? "#FFFFFF" : "var(--gold)",
                  flexShrink: 0,
                  fontWeight: 900,
                  fontSize: 14
                }}>
                  ?
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "var(--text)", lineHeight: 1.5 }}>
                  {pick(f.question, locale)}
                </div>
                <div style={{
                  color: "var(--text-muted)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                  fontSize: 16
                }}>
                  ▾
                </div>
              </button>

              {isOpen && (
                <div style={{
                  padding: "0 18px 18px 64px",
                  fontSize: 13,
                  lineHeight: 1.9,
                  color: "var(--text-soft)"
                }}>
                  {pick(f.answer, locale)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Link href={"/" + locale + "/faq"} className="btn-outline text-sm">
          {locale === "fa" ? "همه سوالات" : "All FAQs"} <ArrowLeft size={16} />
        </Link>
      </div>
    </section>
  );
}
