"use client";
import { VALVE_SIZES } from "@/lib/sizing-advanced";

export default function AltSizesComparison({ currentCv, currentSize, locale }) {
  const idx = VALVE_SIZES.findIndex(function(s) { return s.size === currentSize.size; });
  if (idx === -1) return null;

  const smaller = idx > 0 ? VALVE_SIZES[idx - 1] : null;
  const current = VALVE_SIZES[idx];
  const larger = idx < VALVE_SIZES.length - 1 ? VALVE_SIZES[idx + 1] : null;

  const L = {
    fa: {
      title: "مقایسه سایزهای جایگزین",
      subtitle: "سایزهای دیگر برای نقطه کاری شما",
      smaller: "کوچک‌تر",
      current: "پیشنهاد ما",
      larger: "بزرگ‌تر",
      opening: "بازشدگی",
      status: "وضعیت",
      tooHigh: "خیلی بالا",
      optimal: "بهینه",
      tooLow: "خیلی پایین",
      acceptable: "قابل قبول",
      maxCv: "حداکثر Cv",
      warning: "هشدار",
      note: "سایز فعلی بهترین تعادل بین کنترل و رزرو را دارد"
    },
    en: {
      title: "Alternative Sizes",
      subtitle: "Other sizes for your operating point",
      smaller: "Smaller",
      current: "Recommended",
      larger: "Larger",
      opening: "Opening",
      status: "Status",
      tooHigh: "Too High",
      optimal: "Optimal",
      tooLow: "Too Low",
      acceptable: "Acceptable",
      maxCv: "Max Cv",
      warning: "Warning",
      note: "Current size offers the best balance between control and reserve"
    },
    ar: {
      title: "الأحجام البديلة",
      subtitle: "أحجام أخرى لنقطة التشغيل",
      smaller: "أصغر",
      current: "موصى به",
      larger: "أكبر",
      opening: "الفتح",
      status: "الحالة",
      tooHigh: "عالي جداً",
      optimal: "مثالي",
      tooLow: "منخفض جداً",
      acceptable: "مقبول",
      maxCv: "أقصى Cv",
      warning: "تحذير",
      note: "الحجم الحالي يوفر أفضل توازن"
    },
    ru: {
      title: "Альтернативные размеры",
      subtitle: "Другие размеры для вашей рабочей точки",
      smaller: "Меньше",
      current: "Рекомендуется",
      larger: "Больше",
      opening: "Открытие",
      status: "Статус",
      tooHigh: "Слишком высокое",
      optimal: "Оптимально",
      tooLow: "Слишком низкое",
      acceptable: "Приемлемо",
      maxCv: "Макс. Cv",
      warning: "Внимание",
      note: "Текущий размер — лучший баланс между контролем и резервом"
    }
  }[locale] || {};

  function analyze(size) {
    if (!size) return null;
    const opening = (currentCv / size.cv) * 100;
    let status, color;
    if (opening > 90) { status = L.tooHigh; color = "#E81123"; }
    else if (opening > 80) { status = L.acceptable; color = "#F59E0B"; }
    else if (opening >= 20) { status = L.optimal; color = "#10B981"; }
    else { status = L.tooLow; color = "#F59E0B"; }
    return { opening: Math.round(opening), status: status, color: color };
  }

  const options = [
    smaller ? { size: smaller, label: L.smaller, analysis: analyze(smaller) } : null,
    { size: current, label: L.current, analysis: analyze(current), highlight: true },
    larger ? { size: larger, label: L.larger, analysis: analyze(larger) } : null
  ].filter(Boolean);

  return (
    <div className="card-glass p-5">
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          {L.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>
          {L.subtitle}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + options.length + ", 1fr)", gap: 8 }}>
        {options.map(function(opt, i) {
          const isHighlight = opt.highlight;
          return (
            <div key={i} style={{
              padding: 12,
              borderRadius: 12,
              background: isHighlight
                ? "linear-gradient(135deg, rgba(224, 168, 26, 0.12), rgba(184, 133, 10, 0.04))"
                : "var(--bg-soft)",
              border: "1.5px solid " + (isHighlight ? "#E0A81A" : "var(--border)"),
              textAlign: "center",
              position: "relative"
            }}>
              {isHighlight && (
                <div style={{
                  position: "absolute",
                  top: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF",
                  fontSize: 8.5,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(201, 149, 13, 0.4)"
                }}>
                  ★ {opt.label}
                </div>
              )}

              {!isHighlight && (
                <div style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6
                }}>
                  {opt.label}
                </div>
              )}

              <div style={{
                fontSize: isHighlight ? 22 : 18,
                fontWeight: 900,
                color: isHighlight ? "#B8850A" : "var(--text)",
                marginTop: isHighlight ? 4 : 0,
                fontFamily: "monospace"
              }}>
                {opt.size.size}
              </div>

              <div style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginBottom: 8,
                fontFamily: "monospace",
                display: "flex",
                justifyContent: "center",
                gap: 5
              }}>
                <span>{opt.size.dn}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{opt.size.nps}</span>
              </div>

              {/* Opening bar */}
              <div style={{
                height: 4,
                borderRadius: 2,
                background: "rgba(20, 22, 27, 0.08)",
                marginBottom: 6,
                overflow: "hidden"
              }}>
                <div style={{
                  width: Math.min(100, opt.analysis.opening) + "%",
                  height: "100%",
                  background: opt.analysis.color,
                  borderRadius: 2
                }} />
              </div>

              <div style={{
                fontSize: 12,
                fontWeight: 900,
                color: opt.analysis.color,
                marginBottom: 3
              }}>
                {opt.analysis.opening}%
              </div>

              <div style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: opt.analysis.color,
                padding: "2px 6px",
                borderRadius: 5,
                background: opt.analysis.color + "15"
              }}>
                {opt.analysis.status}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(201, 149, 13, 0.06)",
        border: "1px solid rgba(201, 149, 13, 0.2)",
        fontSize: 11,
        color: "#8A6508",
        fontWeight: 700,
        lineHeight: 1.6,
        display: "flex",
        gap: 8,
        alignItems: "flex-start"
      }}>
        <span style={{ flexShrink: 0 }}>✓</span>
        {L.note}
      </div>
    </div>
  );
}
