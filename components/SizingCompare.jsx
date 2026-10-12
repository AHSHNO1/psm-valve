"use client";
import { useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowLeft, AlertTriangle, TrendingDown, TrendingUp, Award } from "lucide-react";
import { VALVE_SIZES } from "@/lib/sizing-advanced";

export default function SizingCompare({ isOpen, onClose, result, form, fluid, locale = "fa" }) {
  const isFa = locale === "fa";
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const L = {
    fa: {
      title: "مقایسه سایزهای جایگزین",
      subtitle: "سه سایز پیشنهادی حول نقطه کار شما",
      size: "سایز", dn: "DN", cv: "Cv",
      opening: "بازشدگی", velocity: "سرعت", noise: "نویز", verdict: "ارزیابی",
      best: "بهترین انتخاب",
      tooSmall: "خیلی کوچک", small: "کوچک", optimal: "بهینه", large: "بزرگ", tooLarge: "خیلی بزرگ",
      reqQuote: "درخواست قیمت",
      rule: "قاعده: بازشدگی بهینه بین ۲۰٪ تا ۸۰٪",
      range: "محدوده بهینه",
      note: "هر سه سایز محاسبه را قبول می‌کنند، اما کنترل و راندمان متفاوت است."
    },
    en: {
      title: "Compare Alternative Sizes", subtitle: "Three candidate sizes around your operating point",
      size: "Size", dn: "DN", cv: "Cv",
      opening: "Opening", velocity: "Velocity", noise: "Noise", verdict: "Verdict",
      best: "Best Choice",
      tooSmall: "Too Small", small: "Small", optimal: "Optimal", large: "Large", tooLarge: "Too Large",
      reqQuote: "Request Quote",
      rule: "Rule: optimal opening between 20% – 80%",
      range: "Optimal Range",
      note: "All three sizes satisfy the calculation, but control & efficiency differ."
    },
    ar: {
      title: "مقارنة الأحجام", subtitle: "ثلاثة أحجام",
      size: "الحجم", dn: "DN", cv: "Cv",
      opening: "الفتح", velocity: "السرعة", noise: "الضجيج", verdict: "الحكم",
      best: "الأفضل",
      tooSmall: "صغير جدًا", small: "صغير", optimal: "أمثل", large: "كبير", tooLarge: "كبير جدًا",
      reqQuote: "طلب سعر",
      rule: "النطاق الأمثل ٢٠٪ – ٨٠٪", range: "الأمثل",
      note: "الأحجام الثلاثة تفي بالحساب، لكن التحكم يختلف."
    },
    ru: {
      title: "Сравнение размеров", subtitle: "Три варианта",
      size: "Размер", dn: "DN", cv: "Cv",
      opening: "Открытие", velocity: "Скорость", noise: "Шум", verdict: "Оценка",
      best: "Лучший выбор",
      tooSmall: "Слишком мал", small: "Мал", optimal: "Оптимально", large: "Велик", tooLarge: "Слишком велик",
      reqQuote: "Запросить",
      rule: "Оптимум: 20% – 80%", range: "Оптимально",
      note: "Все три размера подходят."
    }
  }[locale] || L_enFallback();

  const candidates = useMemo(() => {
    if (!result || !result.Cv) return [];
    const required = result.Cv;
    const recIdx = VALVE_SIZES.findIndex(s => s.size === result.size.size);
    if (recIdx < 0) return [];

    const indices = [
      Math.max(0, recIdx - 1),
      recIdx,
      Math.min(VALVE_SIZES.length - 1, recIdx + 1)
    ];
    const uniqueIndices = [...new Set(indices)];

    return uniqueIndices.map((idx) => {
      const size = VALVE_SIZES[idx];
      const opening = Math.round((required / size.cv) * 100);

      const idInch = parseFloat(size.size);
      const idM = (idInch * 25.4) / 1000;
      const areaM2 = Math.PI * Math.pow(idM / 2, 2);
      const Q = fluid === "steam" ? (form.W / 1000) * 1.2 : (form.Q || 0);
      const velocity = areaM2 > 0 ? (Q / 3600) / areaM2 : 0;

      const dP = Math.max(0.1, (form.P1 || 0) - (form.P2 || 0));
      const noise = Math.max(45, Math.round(45 + 15 * Math.log10(dP) + 10 * Math.log10(Math.max(Q, 1) / 100)));

      let verdict, verdictColor, verdictIcon;
      if (opening < 10) { verdict = L.tooSmall; verdictColor = "#E81123"; verdictIcon = TrendingDown; }
      else if (opening < 20) { verdict = L.small; verdictColor = "#F59E0B"; verdictIcon = TrendingDown; }
      else if (opening <= 80) { verdict = L.optimal; verdictColor = "#10B981"; verdictIcon = Check; }
      else if (opening <= 100) { verdict = L.large; verdictColor = "#F59E0B"; verdictIcon = TrendingUp; }
      else { verdict = L.tooLarge; verdictColor = "#E81123"; verdictIcon = TrendingUp; }

      return {
        idx, size, opening,
        velocity: +velocity.toFixed(2),
        noise,
        verdict, verdictColor, verdictIcon,
        isRecommended: idx === recIdx,
        isOptimal: opening >= 20 && opening <= 80
      };
    });
  }, [result, form, fluid, L]);

  if (!mounted) return null;
  if (!isOpen) return null;
  if (!result || result.error || candidates.length === 0) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              background: "rgba(10, 12, 16, 0.72)",
              backdropFilter: "blur(6px)",
              zIndex: 9998
            }}
          />

          <div
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
              zIndex: 9999,
              pointerEvents: "none"
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              style={{
                width: "100%", maxWidth: 900,
                maxHeight: "92vh", overflow: "auto",
                background: "var(--bg-card)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                boxShadow: "0 40px 80px rgba(0, 0, 0, 0.4)",
                pointerEvents: "auto"
              }}
            >
              {/* Header */}
              <div style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "sticky", top: 0, zIndex: 5,
                background: "var(--bg-card)",
                borderTopLeftRadius: 20, borderTopRightRadius: 20
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                    color: "#FFFFFF"
                  }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{L.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{L.subtitle}</div>
                  </div>
                </div>
                <button onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "var(--bg-soft)", border: "none", cursor: "pointer",
                    display: "grid", placeItems: "center",
                    color: "var(--text-soft)"
                  }}>
                  <X size={16} />
                </button>
              </div>

              {/* Cards */}
              <div style={{
                padding: 22,
                display: "grid",
                gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))`,
                gap: 12
              }} className="compare-grid">
                {candidates.map((c, i) => {
                  const VIcon = c.verdictIcon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        padding: 16, borderRadius: 14,
                        background: c.isRecommended
                          ? "linear-gradient(135deg, rgba(224,168,26,0.10), rgba(184,133,10,0.03))"
                          : "#FFFFFF",
                        border: c.isRecommended
                          ? "2px solid #E0A81A"
                          : "1.5px solid var(--border)",
                        position: "relative"
                      }}
                    >
                      {c.isRecommended && (
                        <div style={{
                          position: "absolute", top: -10, right: 12,
                          padding: "3px 10px", borderRadius: 20,
                          background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                          color: "#FFFFFF", fontSize: 9.5, fontWeight: 900,
                          letterSpacing: "0.05em",
                          boxShadow: "0 4px 12px rgba(201,149,13,0.35)"
                        }}>
                          ★ {L.best}
                        </div>
                      )}

                      <div style={{
                        fontSize: 26, fontWeight: 900, fontFamily: "monospace",
                        color: c.isRecommended ? "#B8850A" : "var(--text)",
                        lineHeight: 1, marginBottom: 4,
                        direction: "ltr", textAlign: "center"
                      }}>
                        {c.size.size}
                      </div>
                      <div style={{
                        fontSize: 10, fontFamily: "monospace",
                        color: "var(--text-muted)", textAlign: "center",
                        marginBottom: 14, direction: "ltr"
                      }}>
                        {c.size.dn} · {c.size.nps}
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)" }}>{L.opening}</span>
                          <span style={{
                            fontSize: 15, fontWeight: 900, fontFamily: "monospace",
                            color: c.isOptimal ? "#10B981" : c.verdictColor,
                            direction: "ltr"
                          }}>
                            {c.opening}%
                          </span>
                        </div>
                        <div style={{
                          height: 6, borderRadius: 3,
                          background: "var(--bg-soft)", overflow: "hidden",
                          position: "relative"
                        }}>
                          <div style={{
                            position: "absolute",
                            left: "20%", right: "20%", top: 0, bottom: 0,
                            background: "rgba(16,185,129,0.10)"
                          }} />
                          <div style={{
                            width: Math.min(100, c.opening) + "%",
                            height: "100%",
                            background: c.isOptimal
                              ? "linear-gradient(90deg, #10B981, #059669)"
                              : c.verdictColor,
                            position: "relative", zIndex: 1,
                            transition: "width 0.4s"
                          }} />
                        </div>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          marginTop: 3, fontSize: 8.5, color: "var(--text-muted)",
                          fontFamily: "monospace"
                        }}>
                          <span>0%</span>
                          <span style={{ color: "#10B981", fontWeight: 900 }}>{L.range}</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <CompareRow label={L.cv} value={c.size.cv} />
                      <CompareRow label={L.velocity} value={c.velocity + " m/s"} />
                      <CompareRow label={L.noise} value={c.noise + " dB"} last />

                      <div style={{
                        marginTop: 12, padding: "8px 12px", borderRadius: 10,
                        background: c.verdictColor + "12",
                        border: "1px solid " + c.verdictColor + "40",
                        display: "flex", alignItems: "center", gap: 6
                      }}>
                        <VIcon size={13} color={c.verdictColor} strokeWidth={2.8} />
                        <span style={{ fontSize: 11.5, fontWeight: 900, color: c.verdictColor }}>
                          {c.verdict}
                        </span>
                      </div>

                      {c.isRecommended && (
                        <a
                          href={"/" + locale + "/contact"}
                          className="btn-gold justify-center"
                          style={{
                            marginTop: 10, padding: "9px 12px",
                            fontSize: 11.5, textDecoration: "none",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                          }}
                        >
                          {L.reqQuote} <ArrowLeft size={12} />
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div style={{
                margin: "0 22px 22px",
                padding: "12px 16px", borderRadius: 12,
                background: "linear-gradient(135deg, rgba(0,120,212,0.06), rgba(0,120,212,0.02))",
                border: "1px solid rgba(0,120,212,0.25)",
                display: "flex", alignItems: "flex-start", gap: 10
              }}>
                <AlertTriangle size={16} color="#0078D4" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-soft)", lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 900, color: "#0078D4", marginBottom: 4 }}>{L.rule}</div>
                  {L.note}
                </div>
              </div>

              <style jsx global>{`
                @media (max-width: 700px) {
                  .compare-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

function L_enFallback() {
  return {
    title: "Compare", subtitle: "", size: "Size", dn: "DN", cv: "Cv",
    opening: "Opening", velocity: "Velocity", noise: "Noise", verdict: "Verdict",
    best: "Best", tooSmall: "Too Small", small: "Small", optimal: "Optimal",
    large: "Large", tooLarge: "Too Large", reqQuote: "Quote",
    rule: "", range: "Optimal", note: ""
  };
}

function CompareRow({ label, value, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: last ? "none" : "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 900,
        fontFamily: "monospace", direction: "ltr",
        color: "var(--text)"
      }}>{value}</span>
    </div>
  );
}