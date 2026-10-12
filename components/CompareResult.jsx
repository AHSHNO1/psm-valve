"use client";
import { X, TrendingUp, TrendingDown, Minus, Save } from "lucide-react";

export default function CompareResult({ resultA, resultB, locale, onClose, onSwap }) {
  if (!resultA || !resultB) return null;

  const L = {
    fa: {
      title: "مقایسه دو سناریو",
      scenarioA: "سناریو A",
      scenarioB: "سناریو B",
      cv: "ضریب Cv",
      size: "سایز",
      opening: "بازشدگی",
      velocity: "سرعت",
      noise: "نویز",
      cav: "کاویتاسیون",
      better: "بهتر",
      worse: "ضعیف‌تر",
      same: "یکسان",
      close: "بستن",
      swap: "جابجایی",
      low: "کم", medium: "متوسط", high: "بالا", flashing: "فلاشینگ"
    },
    en: {
      title: "Compare Two Scenarios",
      scenarioA: "Scenario A",
      scenarioB: "Scenario B",
      cv: "Cv Coefficient",
      size: "Size",
      opening: "Opening",
      velocity: "Velocity",
      noise: "Noise",
      cav: "Cavitation",
      better: "Better",
      worse: "Worse",
      same: "Same",
      close: "Close",
      swap: "Swap",
      low: "Low", medium: "Medium", high: "High", flashing: "Flashing"
    },
    ar: {
      title: "مقارنة سيناريوهين",
      scenarioA: "السيناريو أ",
      scenarioB: "السيناريو ب",
      cv: "Cv", size: "الحجم", opening: "الفتح",
      velocity: "السرعة", noise: "الضجيج", cav: "التجويف",
      better: "أفضل", worse: "أسوأ", same: "نفسه",
      close: "إغلاق", swap: "تبديل",
      low: "منخفض", medium: "متوسط", high: "عالي", flashing: "وميض"
    },
    ru: {
      title: "Сравнение двух сценариев",
      scenarioA: "Сценарий A",
      scenarioB: "Сценарий B",
      cv: "Cv", size: "Размер", opening: "Открытие",
      velocity: "Скорость", noise: "Шум", cav: "Кавитация",
      better: "Лучше", worse: "Хуже", same: "То же",
      close: "Закрыть", swap: "Обмен",
      low: "Низкий", medium: "Средний", high: "Высокий", flashing: "Вспышка"
    }
  }[locale] || {};

  function cavLabel(risk) {
    if (risk === "low") return L.low;
    if (risk === "medium") return L.medium;
    if (risk === "high") return L.high;
    if (risk === "flashing") return L.flashing;
    return "—";
  }

  function cavColor(risk) {
    if (risk === "low") return "#10B981";
    if (risk === "flashing") return "#E81123";
    return "#F59E0B";
  }

  // Scoring helpers
  function compareNumeric(a, b, reverseBetter) {
    if (a === b) return "same";
    const aBetter = reverseBetter ? a < b : a > b;
    return aBetter ? "A" : "B";
  }

  function compareOpening(a, b) {
    // Closer to 60 is better
    const aDist = Math.abs(60 - a);
    const bDist = Math.abs(60 - b);
    if (a === b) return "same";
    return aDist < bDist ? "A" : "B";
  }

  function compareCav(a, b) {
    const order = { low: 3, medium: 2, high: 1, flashing: 0 };
    const va = order[a] || 0;
    const vb = order[b] || 0;
    if (va === vb) return "same";
    return va > vb ? "A" : "B";
  }

  const rows = [
    { label: L.cv, valA: resultA.Cv, valB: resultB.Cv, better: compareNumeric(resultA.Cv, resultB.Cv, true) },
    { label: L.size, valA: resultA.size.size, valB: resultB.size.size, better: "same" },
    { label: L.opening, valA: resultA.openingPercent + "%", valB: resultB.openingPercent + "%", better: compareOpening(resultA.openingPercent, resultB.openingPercent) },
    { label: L.velocity, valA: resultA.velocity ? resultA.velocity + " m/s" : "—", valB: resultB.velocity ? resultB.velocity + " m/s" : "—", better: "same" },
    { label: L.noise, valA: resultA.noise ? resultA.noise + " dB" : "—", valB: resultB.noise ? resultB.noise + " dB" : "—", better: compareNumeric(resultA.noise || 0, resultB.noise || 0, true) },
    {
      label: L.cav,
      valA: cavLabel(resultA.cavitationRisk),
      valB: cavLabel(resultB.cavitationRisk),
      better: compareCav(resultA.cavitationRisk, resultB.cavitationRisk),
      colorA: cavColor(resultA.cavitationRisk),
      colorB: cavColor(resultB.cavitationRisk)
    }
  ];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(20, 22, 27, 0.7)",
      backdropFilter: "blur(6px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }} onClick={onClose}>
      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
        }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF"
            }}>
              <TrendingUp size={18} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
              {L.title}
            </div>
          </div>
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--bg-soft)", border: "1px solid var(--border)",
              cursor: "pointer",
              display: "grid", placeItems: "center",
              color: "var(--text)"
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Comparison table */}
        <div style={{ padding: 20 }}>
          {/* Headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 10
          }}>
            <div style={{
              padding: "12px",
              fontSize: 11,
              fontWeight: 900,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}></div>
            <div style={{
              padding: "12px",
              background: "rgba(0, 120, 212, 0.10)",
              border: "1.5px solid rgba(0, 120, 212, 0.3)",
              borderRadius: 11,
              textAlign: "center",
              fontSize: 12,
              fontWeight: 900,
              color: "#0078D4"
            }}>
              {L.scenarioA}
            </div>
            <div style={{
              padding: "12px",
              background: "rgba(201, 149, 13, 0.10)",
              border: "1.5px solid rgba(201, 149, 13, 0.3)",
              borderRadius: 11,
              textAlign: "center",
              fontSize: 12,
              fontWeight: 900,
              color: "#B8850A"
            }}>
              {L.scenarioB}
            </div>
          </div>

          {/* Rows */}
          <div style={{ display: "grid", gap: 6 }}>
            {rows.map(function(r, i) {
              const aWins = r.better === "A";
              const bWins = r.better === "B";
              return (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  alignItems: "center"
                }}>
                  <div style={{
                    padding: "10px 14px",
                    fontSize: 11.5,
                    fontWeight: 900,
                    color: "var(--text-muted)"
                  }}>
                    {r.label}
                  </div>
                  <div style={{
                    padding: "10px 14px",
                    background: aWins ? "rgba(16, 185, 129, 0.08)" : "var(--bg-soft)",
                    border: "1px solid " + (aWins ? "rgba(16, 185, 129, 0.35)" : "var(--border)"),
                    borderRadius: 10,
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: 900,
                    color: r.colorA || (aWins ? "#059669" : "var(--text)"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5
                  }}>
                    {r.valA}
                    {aWins && (
                      <span style={{
                        fontSize: 9, padding: "1px 5px",
                        borderRadius: 4,
                        background: "#10B981", color: "#FFFFFF",
                        fontWeight: 900
                      }}>✓</span>
                    )}
                  </div>
                  <div style={{
                    padding: "10px 14px",
                    background: bWins ? "rgba(16, 185, 129, 0.08)" : "var(--bg-soft)",
                    border: "1px solid " + (bWins ? "rgba(16, 185, 129, 0.35)" : "var(--border)"),
                    borderRadius: 10,
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: 900,
                    color: r.colorB || (bWins ? "#059669" : "var(--text)"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5
                  }}>
                    {r.valB}
                    {bWins && (
                      <span style={{
                        fontSize: 9, padding: "1px 5px",
                        borderRadius: 4,
                        background: "#10B981", color: "#FFFFFF",
                        fontWeight: 900
                      }}>✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button onClick={onSwap}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 11,
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 900,
                color: "var(--text)"
              }}>
              ⇄ {L.swap}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
