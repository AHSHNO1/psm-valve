"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import MediaImage from "./MediaImage";
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
  const [engaged, setEngaged] = useState(false);
  const reduceMotion = useReducedMotion();
  const labels = t.slider;

  // پارالاکس ظریف اسکرول‌محور (فقط transform — بدون اثر بر LCP/CLS)
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 64]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);

  useEffect(function() {
    setSequence(active.map(function(_, index) { return index; }));
    setPosition(0);
  }, [activeKey]);

  useEffect(function() {
    if (engaged) return;
    function activate() { setEngaged(true); }
    const events = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"];
    events.forEach(function(event) {
      window.addEventListener(event, activate, { passive: true, once: true });
    });
    return function() {
      events.forEach(function(event) {
        window.removeEventListener(event, activate);
      });
    };
  }, [engaged]);

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
    if (active.length < 2 || paused || reduceMotion || !engaged) return;
    const timer = setInterval(function() {
      if (currentPosition < order.length - 1) {
        setPosition(currentPosition + 1);
      } else {
        setSequence(shuffleIndices(active.length, order[currentPosition]));
        setPosition(0);
      }
    }, 7000);
    return function() { clearInterval(timer); };
  }, [active.length, activeKey, paused, reduceMotion, engaged, currentPosition, order]);

  const fallbackImage = "/images/services/valve-repair.png";
  const image = active.length > 0
    ? active[order[currentPosition]]?.image || fallbackImage
    : fallbackImage;
  const currentIndex = active.length > 0 ? order[currentPosition] : -1;
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
    <section ref={sectionRef} className="hero-photo-slider" aria-label={labels.label}>
      {active.length > 0 ? (
        <motion.div
          className="hero-photo-parallax"
          aria-hidden="true"
          style={reduceMotion ? undefined : { scale: imageScale }}
        >
          {active.map(function(slide, index) {
            return (
              <MediaImage
                key={(slide.id || "slide") + "-" + index}
                src={slide.image || fallbackImage}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                loading={index === 0 ? undefined : "eager"}
                className={
                  "hero-photo-slider-image hero-photo-slide" +
                  (index === currentIndex ? " is-active" : "")
                }
              />
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          className="hero-photo-parallax"
          aria-hidden="true"
          style={reduceMotion ? undefined : { scale: imageScale }}
        >
          <MediaImage
            src={image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="hero-photo-slider-image hero-photo-slide is-active"
          />
        </motion.div>
      )}
      <div className="hero-photo-slider-overlay" aria-hidden="true" />

      <motion.div
        className="hero-slide-copy-wrap"
        style={reduceMotion ? undefined : { y: copyY }}
      >
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
      </motion.div>

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
    </section>
  );
}
