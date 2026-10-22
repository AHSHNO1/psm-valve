"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, BadgeCheck, Gauge } from "lucide-react";
import MediaImage from "./MediaImage";

const COPY = {
  fa: {
    model: "شیر کنترلی سری 51000",
    modelNote: "طراحی‌شده برای کنترل دقیق جریان",
    specs: [
      { icon: Gauge, label: "محاسبه سایزینگ", value: "Cv / Kv · IEC 60534" },
      { icon: Activity, label: "پوشش‌دهی صنعتی", value: "فناوری HVOF" },
      { icon: BadgeCheck, label: "مهندسی ساخت", value: "از طراحی تا آزمون" }
    ]
  },
  en: {
    model: "51000 Series Control Valve",
    modelNote: "Engineered for precise flow control",
    specs: [
      { icon: Gauge, label: "Valve sizing", value: "Cv / Kv · IEC 60534" },
      { icon: Activity, label: "Industrial coating", value: "HVOF technology" },
      { icon: BadgeCheck, label: "Manufacturing", value: "Design through testing" }
    ]
  },
  ar: {
    model: "صمام التحكم سلسلة 51000",
    modelNote: "مصمم للتحكم الدقيق في التدفق",
    specs: [
      { icon: Gauge, label: "حساب الحجم", value: "Cv / Kv · IEC 60534" },
      { icon: Activity, label: "طلاء صناعي", value: "تقنية HVOF" },
      { icon: BadgeCheck, label: "هندسة التصنيع", value: "من التصميم إلى الاختبار" }
    ]
  },
  ru: {
    model: "Регулирующий клапан серии 51000",
    modelNote: "Разработан для точного управления потоком",
    specs: [
      { icon: Gauge, label: "Подбор клапана", value: "Cv / Kv · IEC 60534" },
      { icon: Activity, label: "Промышленное покрытие", value: "Технология HVOF" },
      { icon: BadgeCheck, label: "Производство", value: "От проектирования до испытаний" }
    ]
  }
};

export default function HeroEngineeringDetails({ locale = "fa", showProductVisual = true }) {
  const copy = COPY[locale] || COPY.en;
  const reduceMotion = useReducedMotion();

  return (
    <>
      {showProductVisual && (
        <div className="hero-valve-stage" aria-hidden="true">
          <div className="hero-valve-orbit hero-valve-orbit-outer" />
          <div className="hero-valve-orbit hero-valve-orbit-inner" />
          <motion.div
            className="hero-valve-image-wrap"
            animate={reduceMotion ? {} : { y: [0, -9, 0], rotateY: [-5, 2, -5], rotateX: [2, -1, 2] }}
            transition={reduceMotion ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <MediaImage
              src="/images/products/51000.png"
              alt=""
              fill
              sizes="(max-width: 900px) 86vw, 50vw"
              loading="eager"
              className="hero-valve-image"
            />
          </motion.div>
          <motion.div
            className="hero-valve-callout hero-valve-callout-top"
            animate={reduceMotion ? {} : { y: [0, -5, 0] }}
            transition={reduceMotion ? {} : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="hero-callout-dot" />
            <span dir="ltr">IEC 60534</span>
          </motion.div>
          <motion.div
            className="hero-valve-callout hero-valve-callout-bottom"
            animate={reduceMotion ? {} : { y: [0, 5, 0] }}
            transition={reduceMotion ? {} : { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <span className="hero-callout-dot" />
            <span dir="ltr">Cv / Kv</span>
          </motion.div>
          <div className="hero-valve-caption">
            <span>{copy.model}</span>
            <small>{copy.modelNote}</small>
          </div>
        </div>
      )}

      <div className="hero-engineering-rail" aria-label={copy.modelNote}>
        {copy.specs.map(function(spec, index) {
          const Icon = spec.icon;
          return (
            <motion.div
              key={spec.value}
              className="hero-engineering-item"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.12, duration: 0.45 }}
            >
              <span className="hero-engineering-icon"><Icon size={18} strokeWidth={1.8} /></span>
              <span className="hero-engineering-copy">
                <strong>{spec.label}</strong>
                <small dir="ltr">{spec.value}</small>
              </span>
            </motion.div>
          );
        })}
      </div>

      <style jsx global>{`
        .hero-slider {
          isolation: isolate;
          min-height: max(720px, 88vh) !important;
          padding-bottom: 128px;
          background: #101317;
        }
        .hero-slider-rtl .hero-valve-stage { inset-inline-start: 1.5%; }
        .hero-slider-ltr .hero-valve-stage { inset-inline-end: 1.5%; }
        .hero-slider-rtl .hero-content-wrap { margin-inline-start: auto; }
        .hero-slider-ltr .hero-content-wrap { margin-inline-end: auto; }
        .hero-valve-stage {
          position: absolute;
          z-index: 2;
          top: 5%;
          width: min(49vw, 690px);
          height: 72%;
          display: grid;
          place-items: center;
          perspective: 1100px;
          pointer-events: none;
        }
        .hero-valve-stage::before {
          content: "";
          position: absolute;
          width: 78%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224,168,26,.20), rgba(9,12,15,.02) 68%);
          filter: blur(24px);
        }
        .hero-valve-orbit {
          position: absolute;
          border: 1px solid rgba(245,197,24,.22);
          border-radius: 50%;
          transform-style: preserve-3d;
        }
        .hero-valve-orbit-outer {
          width: 78%;
          aspect-ratio: 1;
          transform: rotateX(68deg) rotateZ(-18deg);
          animation: hero-orbit-spin 26s linear infinite;
        }
        .hero-valve-orbit-inner {
          width: 62%;
          aspect-ratio: 1;
          border-color: rgba(255,255,255,.15);
          transform: rotateX(70deg) rotateZ(25deg);
          animation: hero-orbit-spin 34s linear infinite reverse;
        }
        .hero-valve-image-wrap {
          position: relative;
          width: 91%;
          height: 100%;
          display: grid;
          place-items: center;
          transform-style: preserve-3d;
          filter: drop-shadow(0 32px 42px rgba(0,0,0,.48));
        }
        .hero-valve-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: screen;
        }
        .hero-valve-callout {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          color: rgba(255,255,255,.92);
          background: rgba(20,23,27,.72);
          border: 1px solid rgba(245,197,24,.34);
          border-radius: 999px;
          box-shadow: 0 12px 30px rgba(0,0,0,.24);
          backdrop-filter: blur(12px);
          font: 700 11px/1.2 system-ui, sans-serif;
        }
        .hero-valve-callout-top { inset-inline-end: 8%; top: 19%; }
        .hero-valve-callout-bottom { inset-inline-start: 7%; bottom: 22%; }
        .hero-callout-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: #F5C518;
          box-shadow: 0 0 12px #F5C518;
        }
        .hero-valve-caption {
          position: absolute;
          inset-inline-end: 8%;
          bottom: 4%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: end;
          color: rgba(255,255,255,.92);
          font-size: 12px;
          font-weight: 800;
        }
        .hero-valve-caption small {
          color: rgba(241,243,245,.58);
          font-size: 10px;
          font-weight: 500;
        }
        .hero-engineering-rail {
          position: absolute;
          z-index: 12;
          inset-inline: max(24px, calc((100vw - 1280px) / 2 + 40px));
          bottom: 24px;
          min-height: 82px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 18px;
          background: linear-gradient(105deg, rgba(17,20,24,.88), rgba(36,39,43,.72));
          box-shadow: 0 18px 48px rgba(0,0,0,.28);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }
        .hero-engineering-rail::before {
          content: "";
          position: absolute;
          inset-block: 0;
          inset-inline-start: 0;
          width: 28%;
          background: linear-gradient(90deg, transparent, rgba(245,197,24,.10), transparent);
          transform: skewX(-18deg);
          animation: hero-rail-glint 7s ease-in-out infinite;
          pointer-events: none;
        }
        .hero-engineering-item {
          position: relative;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
        }
        .hero-engineering-item + .hero-engineering-item {
          border-inline-start: 1px solid rgba(255,255,255,.12);
        }
        .hero-engineering-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(245,197,24,.28);
          border-radius: 12px;
          background: rgba(245,197,24,.10);
          color: #F5C518;
          transform: translateZ(0);
          transition: transform .25s ease, background .25s ease;
        }
        .hero-engineering-item:hover .hero-engineering-icon {
          background: rgba(245,197,24,.18);
          transform: perspective(400px) rotateY(16deg) translateY(-2px);
        }
        .hero-engineering-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hero-engineering-copy strong {
          overflow: hidden;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hero-engineering-copy small {
          overflow: hidden;
          color: rgba(241,243,245,.58);
          font: 500 10px/1.4 system-ui, sans-serif;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @keyframes hero-orbit-spin {
          from { transform: rotateX(68deg) rotateZ(0deg); }
          to { transform: rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes hero-rail-glint {
          0%, 35% { transform: translateX(-160%) skewX(-18deg); }
          75%, 100% { transform: translateX(500%) skewX(-18deg); }
        }
        @media (max-width: 900px) {
          .hero-slider { min-height: 760px !important; padding-bottom: 126px; }
          .hero-valve-stage { top: 7%; width: min(50vw, 410px); height: 49%; opacity: .68; }
          .hero-valve-caption { display: none; }
          .hero-slider .hero-content-wrap { max-width: 72%; }
          .hero-engineering-rail { inset-inline: 24px; bottom: 18px; }
          .hero-engineering-item { gap: 8px; padding: 12px; }
          .hero-engineering-icon { width: 34px; height: 34px; flex-basis: 34px; }
          .hero-engineering-copy strong { font-size: 11px; }
        }
        @media (max-width: 620px) {
          .hero-slider { min-height: 790px !important; padding-bottom: 205px; }
          .hero-slider .hero-content-wrap { max-width: 100%; }
          .hero-slider .hero-slide-controls { bottom: 188px !important; }
          .hero-valve-stage { top: 40%; width: 86vw; height: 34%; opacity: .47; }
          .hero-valve-callout { padding: 7px 10px; font-size: 9px; }
          .hero-engineering-rail {
            inset-inline: 16px;
            bottom: 14px;
            grid-template-columns: 1fr;
            min-height: 0;
            border-radius: 15px;
          }
          .hero-engineering-item { min-height: 54px; padding: 7px 12px; }
          .hero-engineering-item + .hero-engineering-item {
            border-inline-start: 0;
            border-top: 1px solid rgba(255,255,255,.10);
          }
          .hero-engineering-icon { width: 34px; height: 34px; flex-basis: 34px; }
          .hero-engineering-copy { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; }
          .hero-engineering-copy strong, .hero-engineering-copy small { font-size: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-valve-orbit,
          .hero-engineering-rail::before { animation: none !important; }
        }
      `}</style>
    </>
  );
}
