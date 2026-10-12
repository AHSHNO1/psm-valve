"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const ICONS = {
  award: "🏆",
  sparkles: "✨",
  cog: "⚙️",
  users: "👥",
  settings: "🔧",
  building: "🏢"
};

export default function WhyUsSection({ content, locale }) {
  const whyUs = (content && content.whyUs) || {};
  const features = whyUs.features || [];

  if (features.length === 0) return null;

  const title = pick(whyUs.title, locale) || (locale === "fa" ? "چرا ما؟" : "Why Us?");

  return (
    <section className="container-x py-12 sm:py-20">
      <div className="text-center mb-12">
        <span className="chip">
          <Sparkles size={12} /> {locale === "fa" ? "مزیت‌های ما" : "Our Advantages"}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-gold">{title}</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {features.map(function(f, i) {
          const emoji = ICONS[f.icon] || "⭐";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-glass p-5 text-center hover:border-gold-500/40 hover:-translate-y-1 transition-all"
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                margin: "0 auto 12px",
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, rgba(224, 168, 26, 0.15), rgba(184, 133, 10, 0.05))",
                fontSize: 24,
                border: "1px solid rgba(201, 149, 13, 0.25)"
              }}>
                {emoji}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.4,
                marginBottom: 6
              }}>
                {pick(f.title, locale)}
              </div>
              <div style={{
                fontSize: 11,
                lineHeight: 1.7,
                color: "var(--text-soft)"
              }}>
                {pick(f.desc, locale)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link href={"/" + locale + "/why-us"} className="btn-outline text-sm">
          {locale === "fa" ? "بیشتر بدانید" : "Learn More"} <ArrowLeft size={16} />
        </Link>
      </div>
    </section>
  );
}
