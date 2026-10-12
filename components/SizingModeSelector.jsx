"use client";

export default function SizingModeSelector({ mode, onChange, locale }) {
  const L = {
    fa: { sizing: "سایزینگ شیر", calc: "ماشین‌حساب مهندسی" },
    en: { sizing: "Valve Sizing", calc: "Engineering Calc" },
    ar: { sizing: "تحديد حجم الصمام", calc: "الحاسبة الهندسية" },
    ru: { sizing: "Подбор клапана", calc: "Инженерный калькулятор" }
  }[locale] || {};

  const options = [
    { id: "sizing", label: L.sizing, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )},
    { id: "calculator", label: L.calc, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="11" x2="8" y2="11.01"/>
        <line x1="12" y1="11" x2="12" y2="11.01"/>
        <line x1="16" y1="11" x2="16" y2="11.01"/>
        <line x1="8" y1="16" x2="16" y2="16"/>
      </svg>
    )}
  ];

  return (
    <div style={{
      display: "inline-flex",
      gap: 4,
      padding: 4,
      borderRadius: 14,
      background: "var(--bg-soft)",
      border: "1px solid var(--border)",
      marginBottom: 18
    }} className="no-print">
      {options.map(function(opt) {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            onClick={function() { onChange(opt.id); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 900,
              background: active
                ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                : "transparent",
              color: active ? "#FFFFFF" : "var(--text-soft)",
              boxShadow: active ? "0 4px 12px rgba(201, 149, 13, 0.3)" : "none",
              transition: "all 0.18s"
            }}
            onMouseEnter={function(e) {
              if (!active) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={function(e) {
              if (!active) e.currentTarget.style.color = "var(--text-soft)";
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
