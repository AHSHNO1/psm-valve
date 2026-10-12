const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

console.log("=== Verifying all imported components ===\n");

const components = [
  "SizingModeSelector",
  "EngineeringCalculator",
  "ValveCurveChart",
  "AltSizesComparison",
  "WhyThisSize",
  "StickySummary",
  "AdvancedTips",
  "SizingQuickPanel",
  "PresetScenariosRow",
  "SmartField",
  "CompareResult",
  "StandardsStrip",
  "MaterialGuide",
  "SizingWizard"
];

let allOk = true;

components.forEach(function(name) {
  const filePath = path.join(ROOT, "components", name + ".jsx");
  if (!fs.existsSync(filePath)) {
    console.log("[MISSING] " + name + ".jsx");
    allOk = false;
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const hasDefaultExport = content.indexOf("export default") !== -1;
  const isJSX = content.indexOf("return (") !== -1 || content.indexOf("return <") !== -1;

  if (!hasDefaultExport) {
    console.log("[NO DEFAULT EXPORT] " + name + ".jsx");
    allOk = false;
  } else {
    console.log("[OK] " + name + ".jsx");
  }
});

console.log("\n=== Files summary ===");
console.log(allOk ? "All components are OK" : "Some components are missing or broken");

// ============================================================
// FIX CompareResult if missing
// ============================================================
const comparePath = path.join(ROOT, "components", "CompareResult.jsx");
if (!fs.existsSync(comparePath)) {
  console.log("\n[CREATING] CompareResult.jsx");
  const compareContent = `"use client";
import { X, TrendingUp } from "lucide-react";

export default function CompareResult({ resultA, resultB, locale, onClose, onSwap }) {
  if (!resultA || !resultB) return null;

  const L = {
    fa: { title: "مقایسه دو سناریو", scenarioA: "سناریو A", scenarioB: "سناریو B", cv: "Cv", size: "سایز", opening: "بازشدگی", velocity: "سرعت", noise: "نویز", cav: "کاویتاسیون", close: "بستن", swap: "جابجایی", low: "کم", medium: "متوسط", high: "بالا", flashing: "فلاشینگ" },
    en: { title: "Compare Scenarios", scenarioA: "Scenario A", scenarioB: "Scenario B", cv: "Cv", size: "Size", opening: "Opening", velocity: "Velocity", noise: "Noise", cav: "Cavitation", close: "Close", swap: "Swap", low: "Low", medium: "Medium", high: "High", flashing: "Flashing" },
    ar: { title: "مقارنة", scenarioA: "أ", scenarioB: "ب", cv: "Cv", size: "الحجم", opening: "الفتح", velocity: "السرعة", noise: "الضجيج", cav: "التجويف", close: "إغلاق", swap: "تبديل", low: "منخفض", medium: "متوسط", high: "عالي", flashing: "وميض" },
    ru: { title: "Сравнение", scenarioA: "A", scenarioB: "B", cv: "Cv", size: "Размер", opening: "Открытие", velocity: "Скорость", noise: "Шум", cav: "Кавитация", close: "Закрыть", swap: "Обмен", low: "Низкий", medium: "Средний", high: "Высокий", flashing: "Вспышка" }
  }[locale] || {};

  function cavLabel(r) {
    if (r === "low") return L.low;
    if (r === "medium") return L.medium;
    if (r === "high") return L.high;
    if (r === "flashing") return L.flashing;
    return "—";
  }

  function cavColor(r) {
    if (r === "low") return "#10B981";
    if (r === "flashing") return "#E81123";
    return "#F59E0B";
  }

  function compareNumeric(a, b, reverse) {
    if (a === b) return "same";
    const aB = reverse ? a < b : a > b;
    return aB ? "A" : "B";
  }

  const rows = [
    { label: L.cv, valA: resultA.Cv, valB: resultB.Cv, better: compareNumeric(resultA.Cv, resultB.Cv, true) },
    { label: L.size, valA: resultA.size.size, valB: resultB.size.size, better: "same" },
    { label: L.opening, valA: resultA.openingPercent + "%", valB: resultB.openingPercent + "%", better: "same" },
    { label: L.velocity, valA: resultA.velocity ? resultA.velocity + " m/s" : "—", valB: resultB.velocity ? resultB.velocity + " m/s" : "—", better: "same" },
    { label: L.noise, valA: resultA.noise ? resultA.noise + " dB" : "—", valB: resultB.noise ? resultB.noise + " dB" : "—", better: "same" },
    { label: L.cav, valA: cavLabel(resultA.cavitationRisk), valB: cavLabel(resultB.cavitationRisk), better: "same", colorA: cavColor(resultA.cavitationRisk), colorB: cavColor(resultB.cavitationRisk) }
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20, 22, 27, 0.7)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #E0A81A, #B8850A)", color: "#FFFFFF" }}>
              <TrendingUp size={18} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{L.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg-soft)", border: "1px solid var(--border)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text)" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ padding: 12, fontSize: 11, fontWeight: 900 }}></div>
            <div style={{ padding: 12, background: "rgba(0, 120, 212, 0.10)", border: "1.5px solid rgba(0, 120, 212, 0.3)", borderRadius: 11, textAlign: "center", fontSize: 12, fontWeight: 900, color: "#0078D4" }}>{L.scenarioA}</div>
            <div style={{ padding: 12, background: "rgba(201, 149, 13, 0.10)", border: "1.5px solid rgba(201, 149, 13, 0.3)", borderRadius: 11, textAlign: "center", fontSize: 12, fontWeight: 900, color: "#B8850A" }}>{L.scenarioB}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {rows.map(function(r, i) {
              const aWins = r.better === "A";
              const bWins = r.better === "B";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                  <div style={{ padding: "10px 14px", fontSize: 11.5, fontWeight: 900, color: "var(--text-muted)" }}>{r.label}</div>
                  <div style={{ padding: "10px 14px", background: aWins ? "rgba(16, 185, 129, 0.08)" : "var(--bg-soft)", border: "1px solid " + (aWins ? "rgba(16, 185, 129, 0.35)" : "var(--border)"), borderRadius: 10, textAlign: "center", fontFamily: "monospace", fontSize: 13, fontWeight: 900, color: r.colorA || (aWins ? "#059669" : "var(--text)") }}>{r.valA}</div>
                  <div style={{ padding: "10px 14px", background: bWins ? "rgba(16, 185, 129, 0.08)" : "var(--bg-soft)", border: "1px solid " + (bWins ? "rgba(16, 185, 129, 0.35)" : "var(--border)"), borderRadius: 10, textAlign: "center", fontFamily: "monospace", fontSize: 13, fontWeight: 900, color: r.colorB || (bWins ? "#059669" : "var(--text)") }}>{r.valB}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button onClick={onSwap} style={{ flex: 1, padding: "12px", borderRadius: 11, background: "var(--bg-soft)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
              ⇄ {L.swap}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(comparePath, compareContent, "utf8");
  console.log("[CREATED] CompareResult.jsx");
}

console.log("\n=== DONE ===");
console.log("Now run: npm run dev");