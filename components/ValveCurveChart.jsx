"use client";

function buildCurve(type) {
  const path = [];
  for (let i = 0; i <= 40; i++) {
    const opening = i * 2.5;
    let flowPercent;
    if (type === "linear") {
      flowPercent = opening;
    } else if (type === "equal") {
      const R = 50;
      flowPercent = opening === 0 ? 0 : (1 / R) * Math.pow(R, opening / 100) * 100;
    } else {
      flowPercent = Math.sqrt(opening / 100) * 100;
    }
    const x = 50 + (opening / 100) * 280;
    const y = 230 - (flowPercent / 100) * 180;
    path.push((i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1));
  }
  return path.join(" ");
}

export default function ValveCurveChart({ locale, currentOpening, currentFlow, recommendedType }) {
  const L = {
    fa: {
      title: "مشخصه جریان شیر",
      subtitle: "پیشنهاد شیر بر اساس نقطه کاری شما",
      linear: "خطی",
      equal: "درصد مساوی",
      quick: "بازشدگی سریع",
      opening: "درصد بازشدگی",
      flow: "ظرفیت جریان (٪)",
      recommended: "پیشنهادی",
      optimalZone: "محدوده بهینه ۲۰-۸۰٪",
      tip: "برای کنترل بهتر، نقطه کاری در محدوده ۲۰-۸۰٪ بازشدگی قرار گیرد",
      currentPoint: "نقطه فعلی"
    },
    en: {
      title: "Valve Flow Characteristic",
      subtitle: "Recommended valve based on your operating point",
      linear: "Linear",
      equal: "Equal %",
      quick: "Quick Opening",
      opening: "Opening %",
      flow: "Flow Capacity (%)",
      recommended: "Recommended",
      optimalZone: "Optimal Zone 20-80%",
      tip: "For better control, keep the operating point in the 20-80% opening range",
      currentPoint: "Current Point"
    },
    ar: {
      title: "خاصية تدفق الصمام",
      subtitle: "الصمام الموصى به",
      linear: "خطي",
      equal: "نسبة متساوية",
      quick: "فتح سريع",
      opening: "نسبة الفتح",
      flow: "سعة التدفق (٪)",
      recommended: "موصى به",
      optimalZone: "النطاق الأمثل 20-80%",
      tip: "حافظ على نقطة التشغيل في نطاق 20-80%",
      currentPoint: "النقطة الحالية"
    },
    ru: {
      title: "Характеристика потока",
      subtitle: "Рекомендуемый клапан",
      linear: "Линейная",
      equal: "Равнопроцентная",
      quick: "Быстрое открытие",
      opening: "Открытие %",
      flow: "Расход (%)",
      recommended: "Рекомендуется",
      optimalZone: "Оптимум 20-80%",
      tip: "Держите рабочую точку в диапазоне 20-80%",
      currentPoint: "Текущая точка"
    }
  }[locale] || {};

  const linearPath = buildCurve("linear");
  const equalPath = buildCurve("equal");
  const quickPath = buildCurve("quick");

  const pointX = currentOpening !== undefined
    ? 50 + (currentOpening / 100) * 280
    : null;
  const pointY = currentFlow !== undefined
    ? 230 - (currentFlow / 100) * 180
    : null;

  const optimalLeft = 50 + (20 / 100) * 280;
  const optimalRight = 50 + (80 / 100) * 280;
  const optimalWidth = optimalRight - optimalLeft;

  const curveColor = function(type) {
    if (recommendedType && recommendedType === type) return "#F5C518";
    return "#94A3B8";
  };
  const curveWidth = function(type) {
    return recommendedType && recommendedType === type ? 3 : 1.5;
  };
  const curveOpacity = function(type) {
    return recommendedType && recommendedType === type ? 1 : 0.4;
  };

  const curves = [
    { id: "linear", label: L.linear },
    { id: "equal", label: L.equal },
    { id: "quick", label: L.quick }
  ];

  return (
    <div className="card-glass p-5">
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              boxShadow: "0 0 8px rgba(201, 149, 13, 0.6)"
            }} />
            {L.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 600 }}>
            {L.subtitle}
          </div>
        </div>
      </div>

      {/* Legend ABOVE chart, horizontal */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        padding: "10px 14px",
        background: "var(--bg-soft)",
        borderRadius: 10,
        marginBottom: 12,
        border: "1px solid var(--border)"
      }}>
        {curves.map(function(c) {
          const isRec = recommendedType === c.id;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: isRec ? 26 : 20,
                height: isRec ? 4 : 3,
                borderRadius: 2,
                background: curveColor(c.id),
                opacity: curveOpacity(c.id)
              }} />
              <span style={{
                fontSize: 11.5,
                fontWeight: isRec ? 900 : 700,
                color: isRec ? "#B8850A" : "var(--text-soft)"
              }}>
                {c.label}
              </span>
              {isRec && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF"
                }}>
                  {L.recommended}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Chart — no legend inside */}
      <svg viewBox="0 0 380 265" style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="optimalZoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>
          <radialGradient id="pointGlowGrad">
            <stop offset="0%" stopColor="#F5C518" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Optimal zone background */}
        <rect
          x={optimalLeft}
          y="40"
          width={optimalWidth}
          height="190"
          fill="url(#optimalZoneGrad)"
          stroke="#10B981"
          strokeWidth="0.8"
          strokeDasharray="3,3"
          strokeOpacity="0.5"
        />

        {/* Optimal zone label — inside the zone, small */}
        <text
          x={optimalLeft + optimalWidth / 2}
          y="54"
          fontSize="8.5"
          fill="#059669"
          textAnchor="middle"
          fontWeight="900"
          letterSpacing="0.03em"
        >
          {L.optimalZone}
        </text>

        {/* Grid horizontal */}
        {[0, 25, 50, 75, 100].map(function(v, i) {
          const y = 230 - (v / 100) * 190;
          return (
            <g key={"h" + i}>
              <line x1="50" y1={y} x2="330" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5" />
              <text x="44" y={y + 3} fontSize="9" fill="var(--text-muted)" textAnchor="end" fontWeight="700">
                {v}
              </text>
            </g>
          );
        })}

        {/* Grid vertical */}
        {[0, 25, 50, 75, 100].map(function(v, i) {
          const x = 50 + (v / 100) * 280;
          return (
            <g key={"v" + i}>
              <line x1={x} y1="40" x2={x} y2="230" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5" />
              <text x={x} y="248" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="700">
                {v}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1="50" y1="40" x2="50" y2="230" stroke="var(--text-soft)" strokeWidth="1.5" />
        <line x1="50" y1="230" x2="330" y2="230" stroke="var(--text-soft)" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x="190" y="262" fontSize="10" fill="var(--text-soft)" textAnchor="middle" fontWeight="900" letterSpacing="0.02em">
          {L.opening}
        </text>
        <text x="18" y="140" fontSize="10" fill="var(--text-soft)" textAnchor="middle" fontWeight="900" transform="rotate(-90 18 140)" letterSpacing="0.02em">
          {L.flow}
        </text>

        {/* Curves — draw non-recommended first */}
        {curves.map(function(c) {
          const d = c.id === "linear" ? linearPath : c.id === "equal" ? equalPath : quickPath;
          const isRec = recommendedType === c.id;
          return (
            <path
              key={c.id}
              d={d}
              fill="none"
              stroke={curveColor(c.id)}
              strokeWidth={curveWidth(c.id)}
              opacity={curveOpacity(c.id)}
              strokeLinecap="round"
              style={isRec ? { filter: "drop-shadow(0 2px 6px rgba(245, 197, 24, 0.4))" } : {}}
            />
          );
        })}

        {/* Current point with glow */}
        {pointX !== null && pointY !== null && (
          <g>
            <circle cx={pointX} cy={pointY} r="18" fill="url(#pointGlowGrad)" />
            <line x1={pointX} y1={pointY} x2={pointX} y2="230" stroke="#F5C518" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
            <line x1={pointX} y1={pointY} x2="50" y2={pointY} stroke="#F5C518" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
            <circle cx={pointX} cy={pointY} r="6" fill="#F5C518" stroke="#1A1D21" strokeWidth="2" />
            <circle cx={pointX} cy={pointY} r="2.5" fill="#1A1D21" />
          </g>
        )}
      </svg>

      {/* Tip */}
      <div style={{
        marginTop: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(16, 185, 129, 0.08)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        fontSize: 11,
        color: "#059669",
        fontWeight: 700,
        lineHeight: 1.7,
        display: "flex",
        gap: 8,
        alignItems: "flex-start"
      }}>
        <span style={{ flexShrink: 0, fontSize: 13 }}>💡</span>
        {L.tip}
      </div>
    </div>
  );
}
