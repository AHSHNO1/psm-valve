"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function ProcessSection({ content, locale }) {
  const process = (content && content.process) || {};
  const steps = process.steps || [];
  if (steps.length === 0) return null;

  const title = pick(process.title, locale) || (locale === "fa" ? "فرآیند کار ما" : "Our Work Process");
  const subtitle = pick(process.subtitle, locale) || "";

  const labels = {
    fa: { badge: "مراحل کار", more: "جزئیات فرآیند" },
    en: { badge: "Our Process", more: "View Process" },
    ar: { badge: "خطوات العمل", more: "عرض العملية" },
    ru: { badge: "Этапы", more: "Подробнее" }
  }[locale] || {};

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="text-center mb-10">
        <span className="chip">
          <Workflow size={12} /> {labels.badge}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h2>
        {subtitle && (
          <p className="mt-3 text-sm max-w-2xl mx-auto" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Horizontal timeline */}
      <div style={{ position: "relative" }}>
        {/* Dotted line background */}
        <div style={{
          position: "absolute",
          top: 30,
          left: "10%",
          right: "10%",
          height: 2,
          background: "linear-gradient(90deg, transparent, var(--gold), var(--gold), var(--gold), transparent)",
          opacity: 0.25,
          display: "none"
        }} className="process-line" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map(function(step, i) {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-center relative"
              >
                {/* Circle number */}
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  margin: "0 auto 14px",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 900,
                  boxShadow: "0 10px 24px rgba(201, 149, 13, 0.35)",
                  position: "relative",
                  zIndex: 1,
                  border: "4px solid var(--bg)"
                }}>
                  {step.num || (i + 1)}
                </div>

                <div style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "var(--text)",
                  lineHeight: 1.4,
                  marginBottom: 6,
                  padding: "0 4px"
                }}>
                  {pick(step.title, locale)}
                </div>

                <div style={{
                  fontSize: 11,
                  lineHeight: 1.65,
                  color: "var(--text-muted)",
                  padding: "0 4px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {pick(step.desc, locale)}
                </div>

                {/* Arrow between (except last) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block" style={{
                    position: "absolute",
                    top: 22,
                    insetInlineStart: -8,
                    color: "var(--gold)",
                    fontSize: 16,
                    opacity: 0.5
                  }}>
                    ←
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href={"/" + locale + "/process"} className="btn-outline text-sm">
          {labels.more} <ArrowLeft size={16} />
        </Link>
      </div>
    </section>
  );
}
