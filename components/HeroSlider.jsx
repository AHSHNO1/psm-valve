"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

function shuffleIndices(count, avoidFirst) {
  const indexes = Array.from({ length: count }, function(_, index) { return index; });
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const value = indexes[i];
    indexes[i] = indexes[j];
    indexes[j] = value;
  }
  if (indexes.length > 1 && indexes[0] === avoidFirst) {
    const swapIndex = indexes.findIndex(function(index, position) {
      return position > 0 && index !== avoidFirst;
    });
    const value = indexes[0];
    indexes[0] = indexes[swapIndex];
    indexes[swapIndex] = value;
  }
  return indexes;
}

const CONTROL_LABELS = {
  fa: { label: "اسلایدر تصاویر صفحه اصلی", previous: "اسلاید قبلی", next: "اسلاید بعدی", slide: "اسلاید", pause: "توقف اسلایدها", play: "ادامه اسلایدها" },
  en: { label: "Homepage image slider", previous: "Previous slide", next: "Next slide", slide: "Slide", pause: "Pause slides", play: "Resume slides" },
  ar: { label: "عارض صور الصفحة الرئيسية", previous: "الشريحة السابقة", next: "الشريحة التالية", slide: "الشريحة", pause: "إيقاف الشرائح", play: "استئناف الشرائح" },
  ru: { label: "Слайдер изображений главной страницы", previous: "Предыдущий слайд", next: "Следующий слайд", slide: "Слайд", pause: "Приостановить слайды", play: "Продолжить слайды" }
};

export default function HeroSlider({ sliders, locale, logo }) {
  const active = (sliders || []).filter(function(slide) { return slide.active !== false; });
  const activeKey = active.map(function(slide) { return slide.id; }).join("|");
  const [sequence, setSequence] = useState(function() {
    return active.map(function(_, index) { return index; });
  });
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const labels = CONTROL_LABELS[locale] || CONTROL_LABELS.en;

  useEffect(function() {
    setSequence(shuffleIndices(active.length));
    setPosition(0);
  }, [activeKey]);

  const isValidSequence = sequence.length === active.length &&
    sequence.every(function(index) { return index >= 0 && index < active.length; });
  const order = isValidSequence
    ? sequence
    : active.map(function(_, index) { return index; });
  const currentPosition = Math.min(position, Math.max(order.length - 1, 0));

  useEffect(function() {
    if (active.length < 2 || paused || reduceMotion) return;
    const timer = setInterval(function() {
      if (currentPosition < order.length - 1) {
        setPosition(currentPosition + 1);
      } else {
        setSequence(shuffleIndices(active.length, order[currentPosition]));
        setPosition(0);
      }
    }, 7000);
    return function() { clearInterval(timer); };
  }, [active.length, activeKey, paused, reduceMotion, currentPosition, order]);

  const image = active.length > 0
    ? active[order[currentPosition]]?.image || "/images/services/valve-repair.png"
    : "/images/services/valve-repair.png";
  const isRtl = locale === "fa" || locale === "ar";
  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  function next() {
    if (currentPosition < order.length - 1) {
      setPosition(currentPosition + 1);
    } else {
      setSequence(shuffleIndices(active.length, order[currentPosition]));
      setPosition(0);
    }
  }

  function previous() {
    setPosition(currentPosition > 0 ? currentPosition - 1 : order.length - 1);
  }

  return (
    <section className="hero-photo-slider" aria-label={labels.label}>
      <img
        key={image}
        src={image}
        alt=""
        fetchPriority="high"
        className="hero-photo-slider-image"
      />

      <div className="hero-brand-plaque" dir="ltr" aria-label="PSM | Grade 1 Knowledge Company. Designing and Manufacturing of Control Valves.">
        {logo && (
          <img
            className="hero-brand-logo"
            src={logo}
            alt=""
            onError={function(e) { e.currentTarget.style.display = "none"; }}
          />
        )}
        <div className="hero-brand-copy">
          <div className="hero-brand-heading">
            <span className="hero-brand-name">PSM</span>
            <span className="hero-brand-divider" aria-hidden="true" />
            <span className="hero-brand-grade">Grade 1 Knowledge Company</span>
          </div>
          <div className="hero-brand-description">
            Designing &amp; Manufacturing of Control Valves
          </div>
        </div>
      </div>

      {active.length > 1 && (
        <>
          <button
            type="button"
            className="hero-photo-slider-arrow hero-photo-slider-previous"
            aria-label={labels.previous}
            onClick={previous}
          >
            <PreviousIcon size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-photo-slider-arrow hero-photo-slider-next"
            aria-label={labels.next}
            onClick={next}
          >
            <NextIcon size={22} aria-hidden="true" />
          </button>

          <div className="hero-photo-slider-controls">
            <div className="hero-photo-slider-dots">
              {order.map(function(slideIndex, index) {
                return (
                  <button
                    key={active[slideIndex].id || slideIndex}
                    type="button"
                    className={"hero-photo-slider-dot" + (index === currentPosition ? " is-active" : "")}
                    aria-label={labels.slide + " " + (index + 1)}
                    aria-current={index === currentPosition ? "true" : undefined}
                    onClick={function() { setPosition(index); }}
                  />
                );
              })}
            </div>
            <button
              type="button"
              className="hero-photo-slider-toggle"
              aria-label={paused ? labels.play : labels.pause}
              title={paused ? labels.play : labels.pause}
              onClick={function() { setPaused(function(value) { return !value; }); }}
            >
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
          </div>
        </>
      )}

      <style jsx global>{`
        .hero-photo-slider {
          position: relative;
          width: 100%;
          height: clamp(420px, 78vh, 760px);
          overflow: hidden;
          background: #202124;
        }
        .hero-photo-slider-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: hero-photo-appear .35s ease-out both;
        }
        .hero-brand-plaque {
          position: absolute;
          z-index: 2;
          inset-inline-start: clamp(24px, 7vw, 96px);
          top: 50%;
          display: flex;
          align-items: center;
          gap: 14px;
          width: min(520px, calc(100% - 112px));
          padding: clamp(17px, 2.4vw, 23px);
          border: 1px solid rgba(255,255,255,.28);
          border-inline-start: 3px solid #E0A81A;
          border-radius: 16px;
          background: linear-gradient(120deg, rgba(12,15,18,.86), rgba(25,29,34,.72));
          box-shadow: 0 18px 42px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.12);
          backdrop-filter: blur(10px);
          transform: translateY(-50%) perspective(1200px) rotateY(-2deg);
          transform-style: preserve-3d;
          color: #FFFFFF;
          pointer-events: none;
        }
        .hero-brand-logo {
          width: clamp(48px, 6vw, 64px);
          height: clamp(48px, 6vw, 64px);
          flex: 0 0 auto;
          object-fit: contain;
          border-radius: 10px;
          background: #FFFFFF;
          padding: 2px;
          box-shadow: 0 7px 16px rgba(0,0,0,.24);
          transform: translateZ(10px);
        }
        .hero-brand-copy { min-width: 0; transform: translateZ(12px); }
        .hero-brand-heading {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 8px;
        }
        .hero-brand-name {
          color: #F5C518;
          font-size: clamp(25px, 4vw, 38px);
          font-weight: 900;
          letter-spacing: .06em;
          line-height: 1;
          text-shadow: 0 2px 0 #8D6500, 0 5px 12px rgba(0,0,0,.42);
        }
        .hero-brand-divider {
          width: 1px;
          height: 22px;
          background: rgba(255,255,255,.42);
        }
        .hero-brand-grade {
          color: #F1F3F5;
          font-size: clamp(11px, 1.45vw, 14px);
          font-weight: 800;
          letter-spacing: .025em;
          text-shadow: 0 2px 9px rgba(0,0,0,.55);
        }
        .hero-brand-description {
          color: #FFFFFF;
          font-size: clamp(13px, 1.8vw, 17px);
          font-weight: 700;
          line-height: 1.45;
          letter-spacing: .015em;
          text-wrap: balance;
          text-shadow: 0 2px 10px rgba(0,0,0,.55);
        }
        .hero-photo-slider-arrow {
          position: absolute;
          top: 50%;
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border: 1px solid rgba(255,255,255,.55);
          border-radius: 50%;
          background: rgba(18,20,22,.35);
          color: #fff;
          cursor: pointer;
          transform: translateY(-50%);
          transition: background .2s ease, border-color .2s ease;
        }
        .hero-photo-slider-arrow:hover,
        .hero-photo-slider-arrow:focus-visible {
          border-color: #fff;
          background: rgba(18,20,22,.65);
        }
        .hero-photo-slider-previous { inset-inline-start: 24px; }
        .hero-photo-slider-next { inset-inline-end: 24px; }
        .hero-photo-slider-controls {
          position: absolute;
          left: 50%;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          background: rgba(18,20,22,.38);
          transform: translateX(-50%);
          backdrop-filter: blur(8px);
        }
        .hero-photo-slider-dots {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .hero-photo-slider-dot {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 99px;
          background: rgba(255,255,255,.66);
          cursor: pointer;
          transition: width .2s ease, background .2s ease;
        }
        .hero-photo-slider-dot.is-active {
          width: 22px;
          background: #fff;
        }
        .hero-photo-slider-toggle {
          display: grid;
          width: 26px;
          height: 26px;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }
        .hero-photo-slider-toggle:focus-visible,
        .hero-photo-slider-dot:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }
        @keyframes hero-photo-appear {
          from { opacity: .8; }
          to { opacity: 1; }
        }
        @media (max-width: 640px) {
          .hero-photo-slider { height: min(68vh, 560px); min-height: 360px; }
          .hero-photo-slider-arrow { width: 38px; height: 38px; }
          .hero-photo-slider-previous { inset-inline-start: 12px; }
          .hero-photo-slider-next { inset-inline-end: 12px; }
          .hero-photo-slider-controls { bottom: 14px; }
          .hero-brand-plaque {
            top: 40%;
            inset-inline-start: 16px;
            width: calc(100% - 80px);
            gap: 10px;
            padding: 14px 12px;
            border-radius: 13px;
            transform: translateY(-50%) perspective(1200px) rotateY(-1deg);
          }
          .hero-brand-logo { width: 42px; height: 42px; }
          .hero-brand-heading { gap: 7px; margin-bottom: 6px; }
          .hero-brand-name { font-size: 25px; }
          .hero-brand-grade { font-size: 10px; }
          .hero-brand-divider { height: 18px; }
          .hero-brand-description { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-photo-slider-image { animation: none; }
          .hero-photo-slider-arrow,
          .hero-photo-slider-dot { transition: none; }
        }
      `}</style>
    </section>
  );
}
