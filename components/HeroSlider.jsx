"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useDictionary } from "./Providers";

const LOCALES = ["fa", "en", "ar", "ru"];

function getLocalizedText(value, locale) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.en || value.fa || "";
}

function getSlideDestination(href, locale) {
  if (typeof href !== "string") return null;
  const destination = href.trim();
  if (/^https?:\/\//i.test(destination)) {
    return { href: destination, external: true };
  }
  if (!destination.startsWith("/") || destination.startsWith("//")) return null;
  if (new RegExp("^/(" + LOCALES.join("|") + ")(/|$)").test(destination)) {
    return { href: destination, external: false };
  }
  return { href: "/" + locale + destination, external: false };
}

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

export default function HeroSlider({ sliders, locale, logo, fallbackDict }) {
  const { t } = useDictionary();
  const active = (sliders || []).filter(function(slide) { return slide.active !== false; });
  const activeKey = active.map(function(slide) { return slide.id; }).join("|");
  const [sequence, setSequence] = useState(function() {
    return active.map(function(_, index) { return index; });
  });
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const labels = t.slider;

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
  const currentSlide = active.length > 0 ? active[order[currentPosition]] : null;
  const fallbackTitle = fallbackDict && fallbackDict.hero
    ? [fallbackDict.hero.title1, fallbackDict.hero.title2, fallbackDict.hero.title3].filter(Boolean).join(" ")
    : "";
  const title = getLocalizedText(currentSlide && currentSlide.title, locale) || fallbackTitle;
  const subtitle = getLocalizedText(currentSlide && currentSlide.subtitle, locale) ||
    (fallbackDict && fallbackDict.hero && fallbackDict.hero.desc) || "";
  const ctaText = getLocalizedText(currentSlide && currentSlide.ctaText, locale) ||
    (fallbackDict && fallbackDict.hero && fallbackDict.hero.cta1) || "";
  const ctaDestination = getSlideDestination(
    (currentSlide && currentSlide.ctaHref) || "/products",
    locale
  );

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
      <div className="hero-photo-slider-overlay" aria-hidden="true" />

      <div className="hero-slide-copy" dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}>
        <div className="hero-slide-brand" dir="ltr">
          {logo && (
            <img
              className="hero-slide-logo"
              src={logo}
              alt=""
              onError={function(e) { e.currentTarget.style.display = "none"; }}
            />
          )}
          <span>PSM VALVE</span>
        </div>
        {title && <h1 className="hero-slide-title">{title}</h1>}
        {subtitle && <p className="hero-slide-subtitle">{subtitle}</p>}
        {ctaText && ctaDestination && (
          ctaDestination.external ? (
            <a
              className="hero-slide-cta"
              href={ctaDestination.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ctaText}
              <ChevronLeft size={18} aria-hidden="true" />
            </a>
          ) : (
            <Link className="hero-slide-cta" href={ctaDestination.href}>
              {ctaText}
              <ChevronLeft size={18} aria-hidden="true" />
            </Link>
          )
        )}
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
        .hero-photo-slider-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(10,12,15,.22), rgba(10,12,15,.1) 52%, rgba(10,12,15,.04)),
            linear-gradient(0deg, rgba(10,12,15,.14), transparent 58%);
          pointer-events: none;
        }
        .hero-slide-copy {
          position: absolute;
          z-index: 2;
          inset-inline-start: clamp(24px, 9vw, 132px);
          top: 50%;
          width: min(760px, calc(100% - 160px));
          color: #FFFFFF;
          transform: translateY(-50%);
        }
        .hero-slide-brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          color: #F5C518;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .12em;
        }
        .hero-slide-logo {
          width: 34px;
          height: 34px;
          object-fit: contain;
          border-radius: 9px;
          background: #FFFFFF;
          padding: 3px;
          box-shadow: 0 2px 12px rgba(0,0,0,.24);
        }
        .hero-slide-title {
          max-width: 15ch;
          margin: 0;
          color: #FFFFFF;
          font-size: clamp(28px, 4.2vw, 52px);
          font-weight: 800;
          line-height: 1.35;
          text-wrap: balance;
          text-shadow: 0 2px 12px rgba(0,0,0,.3);
        }
        .hero-slide-subtitle {
          max-width: 58ch;
          margin: 14px 0 0;
          color: rgba(255,255,255,.94);
          font-size: clamp(14px, 1.45vw, 17px);
          font-weight: 550;
          line-height: 1.9;
          text-wrap: balance;
          text-shadow: 0 1px 8px rgba(0,0,0,.32);
        }
        .hero-slide-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          margin-top: 28px;
          padding: 0 22px;
          border: 1px solid #F5C518;
          border-radius: 12px;
          background: linear-gradient(135deg, #F5C518, #D9A615);
          color: #1A1D21;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(0,0,0,.2);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .hero-slide-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0,0,0,.28);
        }
        .hero-slide-cta:focus-visible {
          outline: 3px solid #FFFFFF;
          outline-offset: 4px;
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
          .hero-photo-slider-overlay {
            background: linear-gradient(0deg, rgba(10,12,15,.34), rgba(10,12,15,.18) 58%, rgba(10,12,15,.05));
          }
          .hero-photo-slider-arrow { width: 38px; height: 38px; }
          .hero-photo-slider-previous { inset-inline-start: 12px; }
          .hero-photo-slider-next { inset-inline-end: 12px; }
          .hero-photo-slider-controls { bottom: 14px; }
          .hero-slide-copy {
            top: 48%;
            inset-inline-start: 16px;
            width: calc(100% - 80px);
            transform: translateY(-50%);
          }
          .hero-slide-brand { margin-bottom: 12px; font-size: 11px; }
          .hero-slide-logo { width: 28px; height: 28px; }
          .hero-slide-title { font-size: clamp(28px, 8vw, 42px); }
          .hero-slide-subtitle { margin-top: 12px; font-size: 14px; line-height: 1.65; }
          .hero-slide-cta { min-height: 44px; margin-top: 18px; padding-inline: 17px; font-size: 13px; }
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
