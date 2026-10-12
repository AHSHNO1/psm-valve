"use client";
import { useEffect, useState } from "react";

export default function StickySummary({ result, locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(function() {
    if (!result || result.error) { setVisible(false); return; }
    function onScroll() {
      if (window.scrollY > 400) setVisible(true);
      else setVisible(false);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return function() { window.removeEventListener("scroll", onScroll); };
  }, [result]);

  if (!result || result.error) return null;

  const L = {
    fa: { cv: "Cv", size: "سایز", opening: "بازشدگی", cav: "کاویتاسیون", low: "کم", medium: "متوسط", high: "بالا", flashing: "فلاشینگ" },
    en: { cv: "Cv", size: "Size", opening: "Opening", cav: "Cavitation", low: "Low", medium: "Medium", high: "High", flashing: "Flashing" },
    ar: { cv: "Cv", size: "الحجم", opening: "الفتح", cav: "التجويف", low: "منخفض", medium: "متوسط", high: "عالي", flashing: "وميض" },
    ru: { cv: "Cv", size: "Размер", opening: "Открытие", cav: "Кавитация", low: "Низкий", medium: "Средний", high: "Высокий", flashing: "Вспышка" }
  }[locale] || {};

  const cavColor =
    result.cavitationRisk === "low" ? "#10B981" :
    result.cavitationRisk === "flashing" ? "#E81123" : "#F59E0B";
  const cavLabel =
    result.cavitationRisk === "low" ? L.low :
    result.cavitationRisk === "medium" ? L.medium :
    result.cavitationRisk === "high" ? L.high : L.flashing;

  const openingColor =
    result.openingPercent < 20 || result.openingPercent > 85 ? "#E81123" : "#10B981";

  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%) translateY(" + (visible ? "0" : "20px") + ")",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
        maxWidth: "calc(100% - 32px)"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "10px 16px",
        background: "linear-gradient(135deg, #1F2124, #2A2D33)",
        border: "1px solid rgba(245, 197, 24, 0.3)",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35), 0 0 30px rgba(201, 149, 13, 0.15)",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {/* Cv */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 12px", borderInlineEnd: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(241, 243, 245, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {L.cv}
          </span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#F5C518", fontFamily: "monospace", direction: "ltr" }}>
            {result.Cv}
          </span>
        </div>

        {/* Size */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 12px", borderInlineEnd: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(241, 243, 245, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {L.size}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#F5C518", fontFamily: "monospace", direction: "ltr" }}>
            {result.size.size}
          </span>
        </div>

        {/* Opening */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 12px", borderInlineEnd: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(241, 243, 245, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {L.opening}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: openingColor, fontFamily: "monospace", direction: "ltr" }}>
            {result.openingPercent}%
          </span>
        </div>

        {/* Cavitation dot */}
        {result.cavitationRisk && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: cavColor,
              boxShadow: "0 0 8px " + cavColor
            }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: cavColor }}>
              {cavLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
