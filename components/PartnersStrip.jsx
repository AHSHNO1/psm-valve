"use client";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import MediaImage from "./MediaImage";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function PartnersStrip({ partners, locale }) {
  const active = (partners || []).filter(function(p) { return p.active !== false; });
  if (active.length === 0) return null;

  const title = {
    fa: "همراهان و شرکای تجاری",
    en: "Trusted By",
    ar: "شركاؤنا",
    ru: "Нам доверяют"
  }[locale] || "Trusted By";

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
          <Building2 size={14} style={{ color: "var(--gold)" }} />
          <span className="text-xs font-black tracking-wider" style={{ color: "var(--text-soft)" }}>
            {title}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {active.slice(0, 12).map(function(p, i) {
          const card = (
            <div
              className="aspect-[3/2] rounded-xl grid place-items-center p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)"
              }}
            >
              {p.logo ? (
                <MediaImage
                  src={p.logo}
                  alt={pick(p.name, locale)}
                  width={300}
                  height={200}
                  sizes="(max-width: 640px) 33vw, 16vw"
                  className="max-w-full max-h-16 object-contain grayscale hover:grayscale-0 transition"
                />
              ) : (
                <div className="text-center">
                  <Building2 size={28} style={{ color: "var(--text-muted)", margin: "0 auto 6px" }} />
                  <div className="text-[10px] font-bold truncate" style={{ color: "var(--text-muted)" }}>
                    {pick(p.name, locale)}
                  </div>
                </div>
              )}
            </div>
          );

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {p.url && p.url !== "#" ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer">{card}</a>
              ) : card}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
