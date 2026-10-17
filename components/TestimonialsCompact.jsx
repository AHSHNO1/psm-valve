"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function TestimonialsCompact({ testimonials, locale }) {
  const active = (testimonials || []).filter(function(t) { return t.active !== false; });
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(function() {
    if (active.length < 2 || hovered) return;
    const t = setInterval(function() {
      setIdx(function(i) { return (i + 1) % active.length; });
    }, 6000);
    return function() { clearInterval(t); };
  }, [active.length, hovered]);

  if (active.length === 0) return null;

  const current = active[idx];

  function next() { setIdx(function(i) { return (i + 1) % active.length; }); }
  function prev() { setIdx(function(i) { return (i - 1 + active.length) % active.length; }); }

  const L = {
    fa: { badge: "نظرات مشتریان", title: "آنچه مشتریان می‌گویند" },
    en: { badge: "Testimonials", title: "What Clients Say" },
    ar: { badge: "شهادات العملاء", title: "ماذا يقول عملاؤنا" },
    ru: { badge: "Отзывы клиентов", title: "Что говорят клиенты" }
  }[locale] || {};

  const rating = current.rating || 5;

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="text-center mb-10">
        <span className="chip">
          <Star size={12} /> {L.badge}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{L.title}</span>
        </h2>
      </div>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          position: "relative"
        }}
        onMouseEnter={function() { setHovered(true); }}
        onMouseLeave={function() { setHovered(false); }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "40px 30px 30px",
              position: "relative",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center"
            }}
          >
            {/* Big quote icon top */}
            <div style={{
              position: "absolute",
              top: -22,
              left: "50%",
              transform: "translateX(-50%)",
              width: 44,
              height: 44,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF",
              boxShadow: "0 8px 20px rgba(201, 149, 13, 0.35)"
            }}>
              <Quote size={20} />
            </div>

            {/* Rating */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              marginBottom: 18,
              marginTop: 6
            }}>
              {[1,2,3,4,5].map(function(n) {
                return (
                  <Star key={n} size={16}
                    fill={n <= rating ? "#F5C518" : "transparent"}
                    style={{ color: n <= rating ? "#F5C518" : "var(--border-strong)" }} />
                );
              })}
            </div>

            {/* Quote text */}
            <p style={{
              fontSize: 15,
              lineHeight: 2,
              color: "var(--text)",
              marginBottom: 24,
              fontStyle: "italic",
              fontWeight: 500
            }}>
              «{pick(current.text, locale)}»
            </p>

            {/* Author */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingTop: 20,
              borderTop: "1px solid var(--border)"
            }}>
              {current.image ? (
                <img src={current.image} alt="" style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--gold)"
                }} />
              ) : (
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: 900
                }}>
                  {pick(current.name, locale).charAt(0)}
                </div>
              )}
              <div style={{ textAlign: "start" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
                  {pick(current.name, locale)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {pick(current.role, locale)}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {active.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              style={{
                position: "absolute",
                top: "50%",
                insetInlineEnd: -22,
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 6px 18px rgba(20, 22, 27, 0.12)",
                cursor: "pointer",
                color: "var(--gold)",
                zIndex: 2
              }}
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              style={{
                position: "absolute",
                top: "50%",
                insetInlineStart: -22,
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 6px 18px rgba(20, 22, 27, 0.12)",
                cursor: "pointer",
                color: "var(--gold)",
                zIndex: 2
              }}
            >
              <ChevronLeft size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {active.length > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 20
          }}>
            {active.map(function(_, i) {
              return (
                <button
                  key={i}
                  onClick={function() { setIdx(i); }}
                  aria-label={"Testimonial " + (i + 1)}
                  style={{
                    width: i === idx ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    background: i === idx ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "var(--border-strong)",
                    transition: "all 0.3s"
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
