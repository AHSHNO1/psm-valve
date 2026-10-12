"use client";
import HeroSlider from "./HeroSlider";
import { motion } from "framer-motion";

export default function HeroStatsCombined({ sliders, locale, fallbackDict }) {
  const stats = [
    { value: "+۱۵", label: locale === "fa" ? "سال تجربه" : "Years Experience" },
    { value: "+۲۰۰", label: locale === "fa" ? "مشتری فعال" : "Active Clients" },
    { value: "+۵۰۰", label: locale === "fa" ? "پروژه موفق" : "Projects" },
    { value: "۹۸٪", label: locale === "fa" ? "رضایت مشتری" : "Satisfaction" }
  ];

  return (
    <div>
      <HeroSlider sliders={sliders} locale={locale} fallbackDict={fallbackDict} />

      {/* Slim stats strip below hero */}
      <div style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        borderTop: "1px solid var(--border)"
      }}>
        <div className="container-x">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 0
          }} className="stats-strip">
            {stats.map(function(s, i) {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: "20px 12px",
                    textAlign: "center",
                    borderInlineStart: i > 0 ? "1px solid var(--border)" : "none"
                  }}
                  className="stats-strip-item"
                >
                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "var(--gold)",
                    lineHeight: 1,
                    marginBottom: 4
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--text-soft)",
                    letterSpacing: "0.02em"
                  }}>
                    {s.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .stats-strip {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .stats-strip-item:nth-child(3) {
            border-inline-start: 1px solid var(--border) !important;
          }
        }
      `}</style>
    </div>
  );
}
