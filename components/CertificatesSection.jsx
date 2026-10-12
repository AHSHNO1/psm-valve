"use client";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function CertificatesSection({ certificates, content, locale }) {
  const active = (certificates || []).filter(function(c) { return c.active !== false; });
  if (active.length === 0) return null;

  const sectionContent = content && content.certificates ? content.certificates : {};
  const title = pick(sectionContent.title, locale) || (locale === "fa" ? "گواهینامه‌ها و استانداردها" : "Certificates & Standards");
  const subtitle = pick(sectionContent.subtitle, locale);

  return (
    <section className="container-x py-14 sm:py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <span className="chip">
          <Award size={12} /> {locale === "fa" ? "اعتبار بین‌المللی" : "International Recognition"}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h2>
        {subtitle && (
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="pub-cert-grid">
        {active.map(function(c, i) {
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="pub-cert-card"
            >
              {c.image ? (
                <img src={c.image} alt={pick(c.title, locale)} className="pub-cert-image" />
              ) : (
                <div className="pub-cert-badge">
                  <Award size={26} />
                </div>
              )}
              <div className="pub-cert-title">{pick(c.title, locale)}</div>
              {pick(c.issuer, locale) && (
                <div className="pub-cert-issuer">{pick(c.issuer, locale)}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
