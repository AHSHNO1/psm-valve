"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import MediaImage from "./MediaImage";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function TestimonialsSection({ testimonials, locale }) {
  const active = (testimonials || []).filter(function(t) { return t.active !== false; });
  if (active.length === 0) return null;

  return (
    <section className="container-x py-14 sm:py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <span className="chip">
          <Star size={12} /> {locale === "fa" ? "نظرات مشتریان" : "Testimonials"}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">
            {locale === "fa" ? "آنچه مشتریان" : "What Our"}{" "}
          </span>
          <span className="heading-gold">
            {locale === "fa" ? "می‌گویند" : "Clients Say"}
          </span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {active.map(function(t, i) {
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-glass p-6 relative"
            >
              <Quote size={40} className="absolute top-4 left-4 opacity-10"
                style={{ color: "var(--gold)" }} />

              <div className="flex items-center gap-1 mb-4 relative z-10">
                {[1,2,3,4,5].map(function(n) {
                  return (
                    <Star key={n} size={16}
                      fill={n <= t.rating ? "#F5C518" : "transparent"}
                      style={{ color: n <= t.rating ? "#F5C518" : "var(--border-strong)" }}
                    />
                  );
                })}
              </div>

              <p className="text-sm leading-7 mb-5 relative z-10"
                style={{ color: "var(--text-soft)" }}>
                {pick(t.text, locale)}
              </p>

              <div className="flex items-center gap-3 pt-4"
                style={{ borderTop: "1px solid var(--border)" }}>
                {t.image ? (
                  <MediaImage src={t.image} alt="" width={88} height={88} sizes="44px" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full grid place-items-center"
                    style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
                    <span className="text-white font-black">
                      {pick(t.name, locale).charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-black text-sm truncate" style={{ color: "var(--text)" }}>
                    {pick(t.name, locale)}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {pick(t.role, locale)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
