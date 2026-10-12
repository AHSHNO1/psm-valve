"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function HeroSlider({ sliders, locale, fallbackDict }) {
  const active = (sliders || []).filter(function(s) { return s.active !== false; });
  const [index, setIndex] = useState(0);

  useEffect(function() {
    if (active.length < 2) return;
    const t = setInterval(function() {
      setIndex(function(i) { return (i + 1) % active.length; });
    }, 7000);
    return function() { clearInterval(t); };
  }, [active.length]);

  useEffect(function() {
    if (index >= active.length && active.length > 0) {
      setIndex(0);
    }
  }, [active.length, index]);

  if (active.length === 0) {
    return <FallbackHero locale={locale} dict={fallbackDict} />;
  }

  const current = active[index];

  function next() { setIndex(function(i) { return (i + 1) % active.length; }); }
  function prev() { setIndex(function(i) { return (i - 1 + active.length) % active.length; }); }

  const title = pick(current.title, locale);
  const subtitle = pick(current.subtitle, locale);
  const ctaText = pick(current.ctaText, locale);

  return (
    <section style={{
      position: "relative",
      minHeight: "88vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden"
    }}>
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          {current.image ? (
            <>
              <img
                src={current.image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(15, 17, 20, 0.92) 0%, rgba(15, 17, 20, 0.75) 40%, rgba(15, 17, 20, 0.45) 70%, rgba(15, 17, 20, 0.65) 100%)"
              }} />
            </>
          ) : (
            <>
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, #0A0C0F 0%, #1A1C22 35%, #232730 70%, #0F1114 100%)"
              }} />
              {/* Decorative grid */}
              <div className="grid-pattern" style={{
                position: "absolute",
                inset: 0,
                opacity: 0.18
              }} />
              {/* Gold glow top-right */}
              <div style={{
                position: "absolute",
                top: "-15%",
                right: "-10%",
                width: "55%",
                height: "80%",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(245, 197, 24, 0.20), transparent 65%)",
                filter: "blur(70px)"
              }} />
              {/* Blue glow bottom-left */}
              <div style={{
                position: "absolute",
                bottom: "-15%",
                left: "-10%",
                width: "45%",
                height: "70%",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0, 120, 212, 0.15), transparent 65%)",
                filter: "blur(70px)"
              }} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container-x" style={{
        position: "relative",
        zIndex: 10,
        paddingTop: 40,
        paddingBottom: 40
      }}>
        <div style={{ maxWidth: 780 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "rgba(245, 197, 24, 0.12)",
                  border: "1px solid rgba(245, 197, 24, 0.4)",
                  marginBottom: 28,
                  backdropFilter: "blur(8px)"
                }}
              >
                <Sparkles size={13} style={{ color: "#F5C518" }} />
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: "#F5C518",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}>
                  {locale === "fa" ? "پترو سازه میهن" : "PSM Valve"}
                </span>
              </motion.div>

              {/* Title — big & refined */}
              <h1 style={{
                fontSize: "clamp(32px, 5vw, 62px)",
                fontWeight: 900,
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                margin: 0,
                marginBottom: 24,
                textShadow: "0 4px 24px rgba(0, 0, 0, 0.3)"
              }}>
                {title}
              </h1>

              {/* Gold divider */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 72 }}
                transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #E0A81A, #F5C518, #E0A81A)",
                  marginBottom: 24,
                  boxShadow: "0 0 16px rgba(245, 197, 24, 0.5)"
                }}
              />

              {/* Subtitle — nice typography */}
              {subtitle && (
                <p style={{
                  fontSize: "clamp(15px, 1.4vw, 18px)",
                  lineHeight: 1.9,
                  color: "rgba(241, 243, 245, 0.82)",
                  margin: 0,
                  marginBottom: 36,
                  maxWidth: 640,
                  fontWeight: 500,
                  letterSpacing: "0.005em"
                }}>
                  {subtitle}
                </p>
              )}

              {/* CTA buttons */}
              {ctaText && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 14 }}
                >
                  <Link
                    href={"/" + locale + (current.ctaHref || "/products")}
                    className="btn-gold"
                    style={{
                      padding: "15px 30px",
                      fontSize: 15,
                      fontWeight: 900,
                      boxShadow: "0 12px 30px rgba(201, 149, 13, 0.4)"
                    }}
                  >
                    {ctaText} <ArrowLeft size={18} />
                  </Link>
                  <Link
                    href={"/" + locale + "/contact"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "15px 28px",
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1.5px solid rgba(255, 255, 255, 0.25)",
                      textDecoration: "none",
                      backdropFilter: "blur(12px)",
                      transition: "all 0.25s"
                    }}
                  >
                    {locale === "fa" ? "تماس با ما" : "Contact Us"}
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      {active.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            style={{
              position: "absolute",
              top: "50%",
              insetInlineEnd: 24,
              transform: "translateY(-50%)",
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#FFFFFF",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              transition: "all 0.25s",
              zIndex: 20
            }}
            onMouseEnter={function(e) {
              e.currentTarget.style.background = "rgba(245, 197, 24, 0.9)";
              e.currentTarget.style.color = "#1A1D21";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={function(e) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            style={{
              position: "absolute",
              top: "50%",
              insetInlineStart: 24,
              transform: "translateY(-50%)",
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#FFFFFF",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              transition: "all 0.25s",
              zIndex: 20
            }}
            onMouseEnter={function(e) {
              e.currentTarget.style.background = "rgba(245, 197, 24, 0.9)";
              e.currentTarget.style.color = "#1A1D21";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={function(e) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <ChevronLeft size={24} />
          </button>
        </>
      )}

      {/* Dots + counter */}
      {active.length > 1 && (
        <div style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 20
        }}>
          <div style={{
            display: "flex",
            gap: 6
          }}>
            {active.map(function(_, i) {
              return (
                <button
                  key={i}
                  onClick={function() { setIndex(i); }}
                  aria-label={"Slide " + (i + 1)}
                  style={{
                    width: i === index ? 30 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    background: i === index
                      ? "linear-gradient(90deg, #E0A81A, #F5C518)"
                      : "rgba(255, 255, 255, 0.35)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: i === index ? "0 0 12px rgba(245, 197, 24, 0.6)" : "none"
                  }}
                />
              );
            })}
          </div>

          {/* Slide counter */}
          <div style={{
            padding: "4px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            fontSize: 11,
            fontWeight: 900,
            color: "rgba(255, 255, 255, 0.9)",
            letterSpacing: "0.05em",
            direction: "ltr"
          }}>
            {(index + 1).toString().padStart(2, "0")} / {active.length.toString().padStart(2, "0")}
          </div>
        </div>
      )}
    </section>
  );
}

function FallbackHero({ locale, dict }) {
  const t = dict || {};
  const hero = t.hero || {};
  function v(x, d) { return x ? (x[locale] || x.en || x.fa || d) : d; }

  return (
    <section style={{
      position: "relative",
      minHeight: "88vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden"
    }}>
      {/* Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0A0C0F 0%, #1A1C22 35%, #232730 70%, #0F1114 100%)"
      }} />
      <div className="grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.18 }} />
      <div style={{
        position: "absolute",
        top: "-15%",
        right: "-10%",
        width: "55%",
        height: "80%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245, 197, 24, 0.20), transparent 65%)",
        filter: "blur(70px)"
      }} />
      <div style={{
        position: "absolute",
        bottom: "-15%",
        left: "-10%",
        width: "45%",
        height: "70%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 120, 212, 0.15), transparent 65%)",
        filter: "blur(70px)"
      }} />

      <div className="container-x" style={{
        position: "relative",
        zIndex: 10,
        paddingTop: 40,
        paddingBottom: 40
      }}>
        <div style={{ maxWidth: 780 }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(245, 197, 24, 0.12)",
            border: "1px solid rgba(245, 197, 24, 0.4)",
            marginBottom: 28,
            backdropFilter: "blur(8px)"
          }}>
            <Sparkles size={13} style={{ color: "#F5C518" }} />
            <span style={{
              fontSize: 11.5,
              fontWeight: 900,
              color: "#F5C518",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}>
              {v(hero.badge, "دانش‌بنیان · مورد تأیید صنعت نفت")}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 62px)",
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            margin: 0,
            marginBottom: 24,
            textShadow: "0 4px 24px rgba(0, 0, 0, 0.3)"
          }}>
            {v(hero.title1, "مهندسی دقیق")}{" "}
            <span style={{
              background: "linear-gradient(135deg, #F5C518, #E0A81A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              {v(hero.title2, "شیرهای کنترلی")}
            </span>
            <br />
            <span style={{
              fontSize: "clamp(24px, 3.5vw, 42px)",
              color: "rgba(241, 243, 245, 0.65)",
              fontWeight: 700
            }}>
              {v(hero.title3, "برای صنایع حیاتی")}
            </span>
          </h1>

          {/* Gold divider */}
          <div style={{
            width: 72,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #E0A81A, #F5C518, #E0A81A)",
            marginBottom: 24,
            boxShadow: "0 0 16px rgba(245, 197, 24, 0.5)"
          }} />

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(15px, 1.4vw, 18px)",
            lineHeight: 1.9,
            color: "rgba(241, 243, 245, 0.82)",
            margin: 0,
            marginBottom: 36,
            maxWidth: 640,
            fontWeight: 500,
            letterSpacing: "0.005em"
          }}>
            {v(hero.desc, "")}
          </p>

          {/* CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link href={"/" + locale + "/products"} className="btn-gold" style={{
              padding: "15px 30px",
              fontSize: 15,
              fontWeight: 900,
              boxShadow: "0 12px 30px rgba(201, 149, 13, 0.4)"
            }}>
              {v(hero.cta1, "مشاهده محصولات")} <ArrowLeft size={18} />
            </Link>
            <Link href={"/" + locale + "/contact"} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "15px 28px",
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 800,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              textDecoration: "none",
              backdropFilter: "blur(12px)",
              transition: "all 0.25s"
            }}>
              {locale === "fa" ? "تماس با ما" : "Contact Us"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
