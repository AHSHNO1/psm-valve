"use client";
import { velocityExceedsGuide } from "@/lib/sizing-advanced";

export default function WhyThisSize({ result, form, fluid, locale }) {
  if (!result || result.error) return null;

  const L = {
    fa: {
      title: "چرا این سایز؟",
      autoOpen: "انتخاب خودکار",
      basedOn: "بر اساس",
      points: {
        cvCalc: "برآورد اولیه Cv؛ نیازمند تأیید مهندسی",
        openingRange: "قرار گرفتن در محدوده بهینه بازشدگی (۲۰-۸۰٪)",
        cavitation: "کنترل ریسک کاویتاسیون",
        velocity: "سرعت جریان مناسب در لوله",
        noise: "سطح نویز قابل قبول",
        reserve: "رزرو کافی برای افزایش ظرفیت"
      },
      finalNote: "این سایز بیشترین تطابق را با نیاز شما دارد"
    },
    en: {
      title: "Why This Size?",
      autoOpen: "Automatic Selection",
      basedOn: "Based on",
      points: {
        cvCalc: "Preliminary Cv estimate; requires engineering validation",
        openingRange: "Optimal opening range (20-80%)",
        cavitation: "Cavitation risk control",
        velocity: "Proper flow velocity in line",
        noise: "Acceptable noise level",
        reserve: "Adequate reserve for increased capacity"
      },
      finalNote: "This size best matches your requirements"
    },
    ar: {
      title: "لماذا هذا الحجم؟",
      autoOpen: "الاختيار التلقائي",
      basedOn: "بناءً على",
      points: {
        cvCalc: "تقدير أولي لـ Cv يتطلب مراجعة هندسية",
        openingRange: "نطاق الفتح الأمثل (20-80%)",
        cavitation: "التحكم في خطر التجويف",
        velocity: "سرعة تدفق مناسبة",
        noise: "مستوى ضوضاء مقبول",
        reserve: "احتياطي كافٍ للزيادة"
      },
      finalNote: "هذا الحجم يلبي متطلباتك بشكل أفضل"
    },
    ru: {
      title: "Почему этот размер?",
      autoOpen: "Автоматический выбор",
      basedOn: "На основе",
      points: {
        cvCalc: "Предварительная оценка Cv требует инженерной проверки",
        openingRange: "Оптимальный диапазон открытия (20-80%)",
        cavitation: "Контроль риска кавитации",
        velocity: "Правильная скорость потока",
        noise: "Приемлемый уровень шума",
        reserve: "Достаточный запас"
      },
      finalNote: "Этот размер лучше всего соответствует вашим требованиям"
    }
  }[locale] || {};

  // Determine which criteria pass
  const criteria = [
    {
      label: L.points.cvCalc,
      pass: true,
      detail: "Cv = " + result.Cv + " · estimate"
    },
    {
      label: L.points.openingRange,
      pass: result.openingPercent >= 20 && result.openingPercent <= 80,
      detail: result.openingPercent + "%"
    },
    {
      label: L.points.cavitation,
      pass: result.cavitationRisk === "low" || result.cavitationRisk === "medium",
      detail: result.cavitationRisk === "low" ? "✓" : result.cavitationRisk === "medium" ? "⚠" : "✗"
    },
    {
      label: L.points.velocity,
      pass: !result.velocity || !velocityExceedsGuide({ fluidType: result.fluidType || fluid, velocity: result.velocity, mach: result.mach }),
      detail: result.velocity ? result.velocity + " m/s" + (result.mach != null ? " · Ma " + result.mach : "") : "—"
    },
    {
      label: L.points.noise,
      pass: !result.noise || result.noise < 85,
      detail: result.noise ? result.noise + " dB" : "—"
    },
    {
      label: L.points.reserve,
      pass: result.openingPercent <= 75,
      detail: (100 - result.openingPercent) + "% reserve"
    }
  ];

  const passed = criteria.filter(function(c) { return c.pass; }).length;
  const total = criteria.length;

  return (
    <div className="card-glass p-5" style={{
      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(16, 185, 129, 0.01))",
      borderColor: "rgba(16, 185, 129, 0.25)"
    }}>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#FFFFFF"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
              {L.title}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>
              {L.autoOpen}
            </div>
          </div>
        </div>

        <div style={{
          padding: "4px 12px",
          borderRadius: 8,
          background: "rgba(16, 185, 129, 0.15)",
          color: "#059669",
          fontSize: 11,
          fontWeight: 900
        }}>
          {passed} / {total}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {criteria.map(function(c, i) {
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 9,
              background: c.pass ? "rgba(16, 185, 129, 0.06)" : "rgba(245, 158, 11, 0.06)"
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                display: "grid", placeItems: "center",
                background: c.pass ? "#10B981" : "#F59E0B",
                color: "#FFFFFF",
                flexShrink: 0
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {c.pass ? (
                    <polyline points="20 6 9 17 4 12"/>
                  ) : (
                    <><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                  )}
                </svg>
              </div>
              <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
                {c.label}
              </div>
              <div style={{
                fontSize: 10.5,
                fontWeight: 900,
                color: c.pass ? "#059669" : "#D97706",
                fontFamily: "monospace",
                direction: "ltr",
                whiteSpace: "nowrap"
              }}>
                {c.detail}
              </div>
            </div>
          );
        })}
      </div>

      {passed === total && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 10,
          background: "linear-gradient(135deg, #10B981, #059669)",
          color: "#FFFFFF",
          fontSize: 11.5,
          fontWeight: 900,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {L.finalNote}
        </div>
      )}
    </div>
  );
}
