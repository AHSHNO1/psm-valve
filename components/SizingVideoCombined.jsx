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
      sizingDesc: "برآورد اولیه Cv و سایز شیر؛ برای انتخاب نهایی با مهندس شیر کنترل مشورت کنید",
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
      sizingDesc: "Preliminary Cv and valve-size estimate; confirm final selection with a control-valve engineer",
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
      sizingDesc: "تقدير أولي لـ Cv وحجم الصمام؛ أكّد الاختيار النهائي مع مهندس صمامات التحكم",
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
      sizingDesc: "Предварительная оценка Cv и размера клапана; согласуйте окончательный выбор с инженером",
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
            padding: "clamp(18px, 4vw, 28px)",
            background: "linear-gradient(145deg, var(--bg-card), var(--bg-soft))",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden"
          }}
        >
          {/* Decorative grid */}
          <div className="grid-pattern" style={{
            position: "absolute", inset: 0, opacity: 0.22, pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            top: -60, right: -60,
            width: 200, height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--glow), transparent 70%)",
            filter: "blur(36px)",
            pointerEvents: "none"
          }} />

          <div style={{ position: "relative" }}>
            <span className="chip" style={{
              background: "var(--glow)",
              borderColor: "var(--border-strong)",
              color: "var(--gold)"
            }}>
              <Sparkles size={12} /> {L.sizingBadge}
            </span>

            <div style={{
              width: 64, height: 64, borderRadius: 18,
              marginTop: 20, marginBottom: 20,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#17191D",
              boxShadow: "0 10px 24px var(--glow)"
            }}>
              <Calculator size={30} />
            </div>

            <h3 style={{
              fontSize: 24,
              fontWeight: 900,
              color: "var(--text)",
              lineHeight: 1.3,
              marginBottom: 12
            }}>
              {L.sizingTitle}
            </h3>

            <p style={{
              fontSize: 14,
              lineHeight: 1.9,
              color: "var(--text-soft)",
              marginBottom: 20
            }}>
              {L.sizingDesc}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: 8, marginBottom: 24 }}>
              {L.sizingFeatures.map(function(f, i) {
                return (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-soft)"
                  }}>
                    <span style={{
                      width: 4, height: 4,
                      borderRadius: "50%",
                      background: "var(--gold)",
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
            padding: "clamp(18px, 4vw, 28px)",
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
