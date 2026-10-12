"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings,
  ArrowLeft, Sparkles, Crosshair
} from "lucide-react";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings };

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const HIGHLIGHTED = ["hvf-coating", "lop-test"];

export default function ServicesCombined({ services, locale }) {
  const all = (services || []).filter(function(s) { return s.active !== false; });
  const highlighted = all.filter(function(s) { return HIGHLIGHTED.indexOf(s.slug) !== -1; });
  const others = all.filter(function(s) { return HIGHLIGHTED.indexOf(s.slug) === -1; }).slice(0, 4);

  const labels = {
    fa: { badge: "خدمات تخصصی", title1: "خدمات", title2: "ما", all: "همه خدمات", special: "خدمات ویژه", others: "سایر خدمات" },
    en: { badge: "Specialized Services", title1: "Our", title2: "Services", all: "All Services", special: "Featured", others: "Other Services" },
    ar: { badge: "خدماتنا", title1: "خدمات", title2: "متخصصة", all: "جميع الخدمات", special: "مميزة", others: "خدمات أخرى" },
    ru: { badge: "Наши услуги", title1: "Наши", title2: "услуги", all: "Все услуги", special: "Особые", others: "Другие услуги" }
  }[locale] || {};

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="chip">{labels.badge}</span>
          <h2 className="section-title mt-3">
            <span className="heading-grad">{labels.title1}</span>{" "}
            <span className="heading-gold">{labels.title2}</span>
          </h2>
        </div>
        <Link href={"/" + locale + "/services"} className="btn-outline text-sm">
          {labels.all} <ArrowLeft size={16} />
        </Link>
      </div>

      {highlighted.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          {highlighted.map(function(s, i) {
            const Icon = ICONS[s.icon] || Flame;
            const isHvof = s.slug === "hvf-coating";
            const c1 = isHvof ? "#F7630C" : "#0078D4";
            const c2 = isHvof ? "#CA5010" : "#005A9E";
            const features = isHvof
              ? (locale === "fa"
                ? ["پوشش ۱۵۰-۵۰۰ میکرون", "سختی ۱۱۰۰-۱۴۰۰ HV", "افزایش عمر تا ۵ برابر", "چسبندگی بالا"]
                : ["150-500μm coating", "Hardness 1100-1400 HV", "Up to 5x longer life", "High adhesion"])
              : (locale === "fa"
                ? ["تست دقیق در محل نصب", "تجهیزات کالیبره", "گزارش دقیق عملکرد", "شناسایی کاویتاسیون"]
                : ["Precise on-site testing", "Calibrated equipment", "Detailed report", "Cavitation detection"]);

            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-3xl overflow-hidden p-6 sm:p-8 hover:-translate-y-1 transition-all"
                style={{
                  background: "linear-gradient(135deg, " + c1 + "12, " + c2 + "06)",
                  border: "2px solid " + c1 + "40",
                  boxShadow: "0 12px 32px " + c1 + "20"
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, " + c1 + ", " + c2 + ")",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 20px " + c1 + "50"
                  }}>
                    <Icon size={26} />
                  </div>
                  <span style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, " + c1 + ", " + c2 + ")",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <Sparkles size={10} /> {labels.special}
                  </span>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", marginBottom: 8, lineHeight: 1.35 }}>
                  {pick(s.name, locale)}
                </h3>

                <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-soft)", marginBottom: 16 }}>
                  {pick(s.short, locale)}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  {features.map(function(f, idx) {
                    return (
                      <div key={idx} className="flex items-start gap-2"
                        style={{ fontSize: 11.5, color: "var(--text-soft)", fontWeight: 600 }}>
                        {isHvof ? (
                          <Flame size={13} style={{ color: c1, flexShrink: 0, marginTop: 2 }} />
                        ) : (
                          <Crosshair size={13} style={{ color: c1, flexShrink: 0, marginTop: 2 }} />
                        )}
                        <span>{f}</span>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={"/" + locale + "/services"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all"
                  style={{
                    background: "linear-gradient(135deg, " + c1 + ", " + c2 + ")",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 12px " + c1 + "40"
                  }}
                >
                  {locale === "fa" ? "جزئیات بیشتر" : "Learn More"} <ArrowLeft size={14} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {others.map(function(s, i) {
            const Icon = ICONS[s.icon] || Cog;
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl hover:-translate-y-1 transition-all"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  display: "grid", placeItems: "center",
                  background: "var(--glow)",
                  color: "var(--gold)",
                  marginBottom: 10
                }}>
                  <Icon size={18} />
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 5, lineHeight: 1.35 }}>
                  {pick(s.name, locale)}
                </h4>
                <p style={{
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "var(--text-muted)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {pick(s.short, locale)}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
