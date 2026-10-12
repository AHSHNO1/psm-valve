"use client";

export default function PresetScenariosRow({ presets, onSelect, locale }) {
  return (
    <div className="card-glass" style={{ padding: 14 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 900,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          {locale === "fa" ? "سناریوهای آماده" : "Preset Scenarios"}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8
      }} className="preset-grid">
        {presets.map(function(p) {
          return (
            <button
              key={p.id}
              onClick={function() { onSelect(p); }}
              className="preset-card-btn"
              style={{
                padding: "14px 12px",
                borderRadius: 12,
                background: "#FFFFFF",
                border: "1.5px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "center",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={function(e) {
                e.currentTarget.style.borderColor = p.color;
                e.currentTarget.style.background = p.color + "08";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px " + p.color + "25";
              }}
              onMouseLeave={function(e) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Colored icon circle */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                background: p.color + "15",
                fontSize: 22,
                border: "1.5px solid " + p.color + "30"
              }}>
                {p.icon}
              </div>

              <div style={{
                fontSize: 11.5,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.3,
                marginBottom: 2
              }}>
                {p.name[locale] || p.name.en}
              </div>

              <div style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: "var(--text-muted)",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {p.desc[locale] || p.desc.en}
              </div>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @media (max-width: 767px) {
          .preset-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
