"use client";
import { FlaskConical, BadgeCheck } from "lucide-react";

export default function KnowledgeBadge({ locale, variant }) {
  const labels = {
    fa: { title: "شرکت دانش‌بنیان", type: "تولیدی نوع یک" },
    en: { title: "Knowledge-Based", type: "Production Type I" },
    ar: { title: "شركة قائمة على المعرفة", type: "إنتاجية النوع الأول" },
    ru: { title: "Наукоемкая", type: "Производство тип I" }
  };
  const L = labels[locale] || labels.en;

  if (variant === "header") {
    return (
      <div
        className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(224, 168, 26, 0.15), rgba(184, 133, 10, 0.08))",
          border: "1px solid rgba(224, 168, 26, 0.4)"
        }}
      >
        <FlaskConical size={13} style={{ color: "var(--gold)" }} />
        <span className="text-[10px] font-black" style={{ color: "var(--text)" }}>
          {L.title}
        </span>
        <span className="text-[9px] font-bold" style={{ color: "var(--gold)" }}>
          · {L.type}
        </span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div
        className="flex items-start gap-3 p-3 rounded-xl"
        style={{
          background: "linear-gradient(135deg, rgba(224, 168, 26, 0.08), rgba(184, 133, 10, 0.04))",
          border: "1px solid rgba(224, 168, 26, 0.25)"
        }}
      >
        <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
          <FlaskConical size={16} style={{ color: "#FFFFFF" }} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black flex items-center gap-1" style={{ color: "var(--text)" }}>
            <BadgeCheck size={11} style={{ color: "var(--gold)" }} />
            {L.title}
          </div>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: "var(--gold)" }}>
            {L.type}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
