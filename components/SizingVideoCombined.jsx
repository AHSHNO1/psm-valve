"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, ArrowLeft, Play, Sparkles } from "lucide-react";
import VideoEmbed from "./VideoEmbed";

export default function SizingVideoCombined({ videoUrl, locale }) {
  const L = {
    fa: {
      sizingBadge: "ابزار آنلاین",
      sizingTitle: "نرم‌افزار سایزینگ شیر",
      sizingDesc: "محاسبه دقیق Cv و انتخاب سایز مناسب شیر بر اساس استاندارد IEC 60534",
      sizingFeatures: ["محاسبه Cv و Kv", "انتخاب سایز خودکار", "شناسایی کاویتاسیون", "دانلود دیتاشیت"],
      sizingCta: "امتحان کنید",
      videoBadge: "معرفی شرکت",
      videoTitle: "پترو سازه میهن در یک نگاه",
      videoDesc: "با محصولات، خدمات و کارخانه ما بیشتر آشنا شوید",
      placeholder: "ویدئو به‌زودی اضافه می‌شود"
    },
    en: {
      sizingBadge: "Online Tool",
      sizingTitle: "Valve Sizing Software",
      sizingDesc: "Accurate Cv calculation and proper valve size selection per IEC 60534",
      sizingFeatures: ["Cv & Kv calculation", "Auto size selection", "Cavitation detection", "Download datasheet"],
      sizingCta: "Try It Now",
      videoBadge: "Company Intro",
      videoTitle: "PSM Valve at a Glance",
      videoDesc: "Learn more about our products, services and factory",
      placeholder: "Video coming soon"
    },
    ar: {
      sizingBadge: "أداة عبر الإنترنت",
      sizingTitle: "برنامج تحديد حجم الصمام",
      sizingDesc: "حساب دقيق Cv واختيار حجم الصمام المناسب وفقًا لـ IEC 60534",
      sizingFeatures: ["حساب Cv و Kv", "اختيار تلقائي", "كشف التجويف", "تحميل صحيفة البيانات"],
      sizingCta: "جربه الآن",
      videoBadge: "تعريف بالشركة",
      videoTitle: "بترو سازه ميهن في لمحة",
      videoDesc: "تعرف على منتجاتنا وخدماتنا ومصنعنا",
      placeholder: "الفيديو قريباً"
    },
    ru: {
      sizingBadge: "Онлайн-инструмент",
      sizingTitle: "Программа подбора клапана",
      sizingDesc: "Точный расчет Cv и выбор размера клапана по IEC 60534",
      sizingFeatures: ["Расчет Cv и Kv", "Авто-подбор размера", "Обнаружение кавитации", "Скачать техпаспорт"],
      sizingCta: "Попробовать",
      videoBadge: "О компании",
      videoTitle: "PSM Valve кратко",
      videoDesc: "Узнайте больше о нашей продукции и заводе",
      placeholder: "Видео скоро"
    }
  }[locale] || {};

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sizing card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative",
            borderRadius: 24,
            padding: 28,
            background: "linear-gradient(135deg, #0F1114 0%, #1F2124 100%)",
            border: "1px solid rgba(212, 160, 23, 0.3)",
            overflow: "hidden"
          }}
        >
          {/* Decorative grid */}
          <div className="grid-pattern" style={{
            position: "absolute", inset: 0, opacity: 0.15
          }} />
          <div style={{
            position: "absolute",
            top: -60, right: -60,
            width: 200, height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 197, 24, 0.2), transparent 70%)",
            filter: "blur(40px)"
          }} />

          <div style={{ position: "relative" }}>
            <span className="chip" style={{
              background: "rgba(245, 197, 24, 0.15)",
              borderColor: "rgba(245, 197, 24, 0.4)",
              color: "#F5C518"
            }}>
              <Sparkles size={12} /> {L.sizingBadge}
            </span>

            <div style={{
              width: 64, height: 64, borderRadius: 18,
              marginTop: 20, marginBottom: 20,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF",
              boxShadow: "0 12px 28px rgba(201, 149, 13, 0.4)"
            }}>
              <Calculator size={30} />
            </div>

            <h3 style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.3,
              marginBottom: 12
            }}>
              {L.sizingTitle}
            </h3>

            <p style={{
              fontSize: 14,
              lineHeight: 1.9,
              color: "rgba(241, 243, 245, 0.7)",
              marginBottom: 20
            }}>
              {L.sizingDesc}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {L.sizingFeatures.map(function(f, i) {
                return (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(241, 243, 245, 0.75)"
                  }}>
                    <span style={{
                      width: 4, height: 4,
                      borderRadius: "50%",
                      background: "#F5C518",
                      flexShrink: 0
                    }} />
                    {f}
                  </div>
                );
              })}
            </div>

            <Link href={"/" + locale + "/sizing"} className="btn-gold text-sm">
              {L.sizingCta} <ArrowLeft size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Video card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            position: "relative",
            borderRadius: 24,
            padding: 28,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            overflow: "hidden"
          }}
        >
          <span className="chip">
            <Play size={12} /> {L.videoBadge}
          </span>

          <h3 style={{
            fontSize: 20,
            fontWeight: 900,
            color: "var(--text)",
            lineHeight: 1.3,
            marginTop: 18,
            marginBottom: 10
          }}>
            {L.videoTitle}
          </h3>

          <p style={{
            fontSize: 13,
            lineHeight: 1.8,
            color: "var(--text-soft)",
            marginBottom: 18
          }}>
            {L.videoDesc}
          </p>

          <div style={{ borderRadius: 14, overflow: "hidden" }}>
            {videoUrl ? (
              <VideoEmbed url={videoUrl} title={L.videoTitle} />
            ) : (
              <div style={{
                aspectRatio: "16/9",
                background: "linear-gradient(135deg, var(--bg-soft), var(--bg-card))",
                display: "grid",
                placeItems: "center",
                borderRadius: 14,
                border: "1px dashed var(--border-strong)"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 60, height: 60,
                    borderRadius: "50%",
                    margin: "0 auto 12px",
                    display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 20px rgba(201, 149, 13, 0.35)"
                  }}>
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                    {L.placeholder}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
