"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings,
  ArrowLeft, Sparkles, Target, Zap, ShieldCheck, Activity, Crosshair
} from "lucide-react";

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings };

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const HIGHLIGHTED = ["hvf-coating", "lop-test"];

export default function ServicesSection({ services, locale, dict }) {
  const active = (services || []).filter(function(s) { return s.active !== false; });
  if (active.length === 0) return null;

  const highlightedServices = active.filter(function(s) {
    return HIGHLIGHTED.indexOf(s.slug) !== -1;
  });
  const otherServices = active.filter(function(s) {
    return HIGHLIGHTED.indexOf(s.slug) === -1;
  });

  const labels = {
    fa: {
      badge: "خدمات ما",
      title1: "خدمات",
      title2: "تخصصی",
      all: "همه خدمات",
      special: "خدمات ویژه",
      alsoAvailable: "سایر خدمات"
    },
    en: {
      badge: "Our Services",
      title1: "Specialized",
      title2: "Services",
      all: "All Services",
      special: "Featured",
      alsoAvailable: "Other Services"
    },
    ar: {
      badge: "خدماتنا",
      title1: "خدمات",
      title2: "متخصصة",
      all: "جميع الخدمات",
      special: "مميزة",
      alsoAvailable: "خدمات أخرى"
    },
    ru: {
      badge: "Наши услуги",
      title1: "Специализированные",
      title2: "услуги",
      all: "Все услуги",
      special: "Особые",
      alsoAvailable: "Другие услуги"
    }
  };
  const L = labels[locale] || labels.en;

  // Features for each highlighted service
  const hvofFeatures = {
    fa: ["ضخامت پوشش ۱۵۰ تا ۵۰۰ میکرون", "سختی ۱۱۰۰ تا ۱۴۰۰ HV", "چسبندگی بالای پوشش", "افزایش عمر تا ۵ برابر"],
    en: ["Coating thickness 150-500 μm", "Hardness 1100-1400 HV", "High adhesion strength", "Up to 5x longer life"],
    ar: ["سمك الطلاء 150-500 ميكرون", "الصلابة 1100-1400 HV", "قوة التصاق عالية", "عمر أطول 5 أضعاف"],
    ru: ["Толщина покрытия 150-500 мкм", "Твердость 1100-1400 HV", "Высокая адгезия", "Срок службы до 5 раз"]
  };
  const lopFeatures = {
    fa: ["تست دقیق در محل نصب", "تجهیزات کالیبره شده", "گزارش دقیق عملکرد", "شناسایی نشتی و کاویتاسیون"],
    en: ["Precise on-site testing", "Calibrated equipment", "Detailed performance report", "Leak & cavitation detection"],
    ar: ["اختبار دقيق في الموقع", "تجهيزات معايرة", "تقرير أداء مفصل", "كشف التسرب والتجويف"],
    ru: ["Точные испытания на месте", "Калиброванное оборудование", "Подробный отчет", "Обнаружение утечек и кавитации"]
  };

  return (
    <section className="container-x py-12 sm:py-20">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="chip">{L.badge}</span>
          <h2 className="section-title mt-3">
            <span className="heading-grad">{L.title1}</span>{" "}
            <span className="heading-gold">{L.title2}</span>
          </h2>
        </div>
        <Link href={"/" + locale + "/services"} className="btn-outline text-sm">
          {L.all} <ArrowLeft size={16} />
        </Link>
      </div>

      {/* SPECIAL: HVOF + LOP - two big cards */}
      {highlightedServices.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {highlightedServices.map(function(s, i) {
            const Icon = ICONS[s.icon] || Flame;
            const isHvof = s.slug === "hvf-coating";
            const features = isHvof ? (hvofFeatures[locale] || hvofFeatures.fa) : (lopFeatures[locale] || lopFeatures.fa);
            const color1 = isHvof ? "#FF7A1F" : "#0078D4";
            const color2 = isHvof ? "#D14A00" : "#005A9E";

            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-3xl overflow-hidden p-7 sm:p-9 transition-all hover:-translate-y-2"
                style={{
                  background: "linear-gradient(135deg, " + color1 + "15, " + color2 + "08)",
                  border: "2px solid " + color1 + "55",
                  boxShadow: "0 20px 50px " + color1 + "25"
                }}
              >
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full opacity-30 blur-3xl pointer-events-none"
                  style={{ background: color1 }} />

                {/* Badge */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, " + color1 + ", " + color2 + ")", color: "#FFFFFF" }}>
                    <Sparkles size={11} /> {L.special}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl grid place-items-center mb-5 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, " + color1 + ", " + color2 + ")",
                    color: "#FFFFFF",
                    boxShadow: "0 12px 30px " + color1 + "50"
                  }}>
                  <Icon size={30} />
                </div>

                {/* Title */}
                <h3 className="font-black text-xl sm:text-2xl mb-3 leading-tight"
                  style={{ color: "var(--text)" }}>
                  {pick(s.name, locale)}
                </h3>

                {/* Desc */}
                <p className="text-sm sm:text-base leading-7 mb-6"
                  style={{ color: "var(--text-soft)" }}>
                  {pick(s.short, locale)}
                </p>

                {/* Features grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {features.map(function(f, idx) {
                    return (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm"
                        style={{ color: "var(--text)" }}>
                        {isHvof ? (
                          <Flame size={14} style={{ color: color1, flexShrink: 0, marginTop: 2 }} />
                        ) : (
                          <Crosshair size={14} style={{ color: color1, flexShrink: 0, marginTop: 2 }} />
                        )}
                        <span className="leading-relaxed">{f}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <Link
                  href={"/" + locale + "/services"}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all hover:gap-3"
                  style={{
                    background: "linear-gradient(135deg, " + color1 + ", " + color2 + ")",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 20px " + color1 + "40"
                  }}
                >
                  {L.all} <ArrowLeft size={16} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* OTHER SERVICES - smaller cards */}
      {otherServices.length > 0 && (
        <div>
          <h3 className="font-black text-base mb-4 flex items-center gap-2"
            style={{ color: "var(--text-soft)" }}>
            <div className="w-8 h-1 rounded-full" style={{ background: "var(--gold)" }} />
            {L.alsoAvailable}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {otherServices.slice(0, 4).map(function(s, i) {
              const Icon = ICONS[s.icon] || Cog;
              return (
                <motion.div
                  key={s.slug}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="h-full p-4 sm:p-5 rounded-2xl transition-all hover:-translate-y-1"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="w-11 h-11 rounded-xl grid place-items-center mb-3"
                      style={{ background: "var(--glow)", color: "var(--gold)" }}>
                      <Icon size={20} />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm leading-tight mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {pick(s.name, locale)}
                    </h4>
                    <p className="text-[10px] sm:text-xs leading-5 line-clamp-2"
                      style={{ color: "var(--text-muted)" }}>
                      {pick(s.short, locale)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
