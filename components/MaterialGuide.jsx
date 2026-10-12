"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X, AlertTriangle, Info, Thermometer, Gauge, Sparkles } from "lucide-react";

// ============================================================
// MATERIAL DATABASE
// ============================================================
const MATERIALS = [
  {
    id: "wcb",
    name: { fa: "WCB — فولاد کربنی", en: "WCB — Carbon Steel" },
    body: "ASTM A216 WCB",
    tempRange: [-29, 425],
    pressureMax: 100,
    color: "#64748B",
    use: {
      fa: "کاربرد عمومی — آب، روغن، گاز خشک، بخار",
      en: "General service — water, oil, dry gas, steam"
    }
  },
  {
    id: "cf8m",
    name: { fa: "CF8M — استیل 316", en: "CF8M — 316 Stainless" },
    body: "ASTM A351 CF8M",
    tempRange: [-196, 540],
    pressureMax: 200,
    color: "#0891B2",
    use: {
      fa: "خورنده، اسید، آب دریا، دما بالا",
      en: "Corrosive, acid, seawater, high temp"
    }
  },
  {
    id: "cf3m",
    name: { fa: "CF3M — استیل 316L", en: "CF3M — 316L Stainless" },
    body: "ASTM A351 CF3M",
    tempRange: [-196, 450],
    pressureMax: 200,
    color: "#0EA5E9",
    use: {
      fa: "خورنده‌تر از 316، جوش‌پذیری بهتر",
      en: "More corrosion resistant than 316, better weldability"
    }
  },
  {
    id: "duplex",
    name: { fa: "Duplex — دوپلکس", en: "Duplex SS" },
    body: "ASTM A995 4A",
    tempRange: [-50, 300],
    pressureMax: 250,
    color: "#7C3AED",
    use: {
      fa: "آب دریا، کلرید بالا، خوردگی تنشی",
      en: "Seawater, high chloride, stress corrosion"
    }
  },
  {
    id: "alloy20",
    name: { fa: "Alloy 20", en: "Alloy 20" },
    body: "ASTM A351 CN7M",
    tempRange: [-29, 425],
    pressureMax: 200,
    color: "#DB2777",
    use: {
      fa: "اسید سولفوریک، فسفریک",
      en: "Sulfuric acid, phosphoric acid"
    }
  },
  {
    id: "hastelloy",
    name: { fa: "Hastelloy C-276", en: "Hastelloy C-276" },
    body: "ASTM A494 CW-12MW",
    tempRange: [-196, 675],
    pressureMax: 250,
    color: "#DC2626",
    use: {
      fa: "شدیداً خورنده، دما بسیار بالا",
      en: "Highly corrosive, very high temp"
    }
  },
  {
    id: "cryo",
    name: { fa: "CF8M کرایوژنیک", en: "CF8M Cryogenic" },
    body: "ASTM A351 CF8M (impact tested)",
    tempRange: [-254, -50],
    pressureMax: 100,
    color: "#0284C7",
    use: {
      fa: "LNG، نیتروژن مایع، اکسیژن مایع",
      en: "LNG, liquid nitrogen, liquid oxygen"
    }
  }
];

// ============================================================
// RECOMMENDATION ENGINE
// ============================================================
function analyzeMaterials(form, fluid, locale) {
  const temp = (form.T != null ? form.T : 25);
  const press = form.P1 || 10;
  const isFa = locale === "fa";

  const evaluated = MATERIALS.map(m => {
    const inTemp = temp >= m.tempRange[0] && temp <= m.tempRange[1];
    const inPress = press <= m.pressureMax;
    const eligible = inTemp && inPress;

    const fails = [];
    if (!inTemp) {
      if (temp < m.tempRange[0]) {
        fails.push(isFa
          ? `دما ${temp}°C کمتر از حد مجاز ${m.tempRange[0]}°C است`
          : `Temp ${temp}°C below limit ${m.tempRange[0]}°C`);
      } else {
        fails.push(isFa
          ? `دما ${temp}°C بیشتر از حد مجاز ${m.tempRange[1]}°C است`
          : `Temp ${temp}°C above limit ${m.tempRange[1]}°C`);
      }
    }
    if (!inPress) {
      fails.push(isFa
        ? `فشار ${press} bar بالاتر از حد ${m.pressureMax} bar`
        : `Pressure ${press} bar above ${m.pressureMax} bar`);
    }

    return { ...m, eligible, inTemp, inPress, fails };
  });

  // Pick recommended: first eligible, priority by temp rules
  let recId = null;
  if (temp <= -50) recId = "cryo";
  else if (temp > 540) recId = "hastelloy";
  else if (temp > 425 || press > 100) recId = "cf8m";
  else recId = "wcb";

  let recommended = evaluated.find(m => m.id === recId && m.eligible);
  if (!recommended) recommended = evaluated.find(m => m.eligible);

  // Reason
  const reasons = [];
  if (temp <= -50) {
    reasons.push(isFa
      ? `دمای کاری ${temp}°C در محدوده کرایوژنیک است`
      : `Operating temp ${temp}°C is in cryogenic range`);
  } else if (temp > 540) {
    reasons.push(isFa
      ? `دمای کاری ${temp}°C بالاتر از 540°C — نیاز به Hastelloy`
      : `Operating temp ${temp}°C exceeds 540°C — needs Hastelloy`);
  } else if (temp > 425) {
    reasons.push(isFa
      ? `دمای کاری ${temp}°C بالاتر از 425°C — WCB مناسب نیست`
      : `Operating temp ${temp}°C exceeds 425°C — WCB unsuitable`);
  } else if (temp < -29) {
    reasons.push(isFa
      ? `دمای کاری ${temp}°C پایین‌تر از -29°C — نیاز به استیل`
      : `Operating temp ${temp}°C below -29°C — needs stainless`);
  } else {
    reasons.push(isFa
      ? `دمای کاری ${temp}°C در محدوده استاندارد WCB`
      : `Operating temp ${temp}°C within standard WCB range`);
  }

  if (press > 100 && press <= 200) {
    reasons.push(isFa
      ? `فشار کاری ${press} bar بالاتر از 100 bar`
      : `Operating pressure ${press} bar exceeds 100 bar`);
  } else {
    reasons.push(isFa
      ? `فشار کاری ${press} bar در محدوده مجاز`
      : `Operating pressure ${press} bar within limits`);
  }

  if (fluid === "gas") {
    reasons.push(isFa ? "سیال گازی — توجه به دمای کاری" : "Gas fluid — temperature critical");
  } else if (fluid === "steam") {
    reasons.push(isFa ? "سیال بخار — نیاز به متریال مقاوم به حرارت" : "Steam service — heat resistant material");
  }

  const alternatives = evaluated.filter(m => m.eligible && m.id !== recommended?.id).slice(0, 3);
  const rejected = evaluated.filter(m => !m.eligible);

  return { recommended, alternatives, rejected, reasons, evaluated, temp, press };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MaterialGuide({ form, fluid, locale = "fa" }) {
  const analysis = useMemo(() => analyzeMaterials(form, fluid, locale), [form, fluid, locale]);
  const { recommended, alternatives, rejected, reasons, temp, press } = analysis;
  const isFa = locale === "fa";

  const L = {
    fa: {
      title: "راهنمای انتخاب متریال",
      subtitle: "بر اساس شرایط کاری شما",
      conditions: "شرایط کاری",
      temp: "دما",
      pressure: "فشار",
      recommended: "پیشنهاد ما",
      whyThis: "چرا این متریال؟",
      alternatives: "گزینه‌های جایگزین",
      notSuitable: "مناسب نیست",
      useCase: "کاربرد",
      range: "محدوده مجاز",
      reason: "دلیل رد"
    },
    en: {
      title: "Material Selection Guide",
      subtitle: "Based on your operating conditions",
      conditions: "Operating Conditions",
      temp: "Temp",
      pressure: "Pressure",
      recommended: "Our Recommendation",
      whyThis: "Why this material?",
      alternatives: "Alternatives",
      notSuitable: "Not Suitable",
      useCase: "Use case",
      range: "Allowed range",
      reason: "Rejected because"
    },
    ar: {
      title: "دليل المواد", subtitle: "بناءً على ظروف التشغيل",
      conditions: "الظروف", temp: "الحرارة", pressure: "الضغط",
      recommended: "التوصية", whyThis: "لماذا؟",
      alternatives: "بدائل", notSuitable: "غير مناسب",
      useCase: "الاستخدام", range: "النطاق", reason: "السبب"
    },
    ru: {
      title: "Подбор материала", subtitle: "По вашим условиям",
      conditions: "Условия", temp: "Температура", pressure: "Давление",
      recommended: "Наша рекомендация", whyThis: "Почему?",
      alternatives: "Альтернативы", notSuitable: "Не подходит",
      useCase: "Применение", range: "Диапазон", reason: "Причина"
    }
  }[locale] || {};

  const name = (m) => m.name[locale] || m.name.en;
  const useText = (m) => m.use[locale] || m.use.en;

  return (
    <div className="card-glass" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, #0891B2, #0E7490)",
          color: "#FFFFFF"
        }}>
          <Sparkles size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{L.title}</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>{L.subtitle}</div>
        </div>
      </div>

      {/* Operating Conditions */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, marginBottom: 14
      }}>
        <div style={{
          padding: "10px 12px", borderRadius: 10,
          background: "var(--bg-soft)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <Thermometer size={14} color="#E81123" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
              {L.temp}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", fontFamily: "monospace", direction: "ltr" }}>
              {temp}°C
            </div>
          </div>
        </div>
        <div style={{
          padding: "10px 12px", borderRadius: 10,
          background: "var(--bg-soft)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <Gauge size={14} color="#0078D4" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
              {L.pressure}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", fontFamily: "monospace", direction: "ltr" }}>
              {press} bar
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Card */}
      {recommended && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 16, borderRadius: 14, marginBottom: 12,
            background: `linear-gradient(135deg, ${recommended.color}15, ${recommended.color}05)`,
            border: `2px solid ${recommended.color}60`,
            position: "relative"
          }}
        >
          <div style={{
            position: "absolute", top: -10, right: 14,
            padding: "3px 10px", borderRadius: 20,
            background: recommended.color, color: "#FFFFFF",
            fontSize: 9.5, fontWeight: 900, letterSpacing: "0.05em",
            boxShadow: `0 4px 12px ${recommended.color}50`
          }}>
            ★ {L.recommended}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: recommended.color, color: "#FFFFFF",
              fontSize: 16, fontWeight: 900
            }}>
              <Check size={22} strokeWidth={3} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>
                {name(recommended)}
              </div>
              <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--text-soft)", marginTop: 2 }}>
                {recommended.body}
              </div>
            </div>
          </div>

          {/* Range */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 10px", borderRadius: 9,
            background: "#FFFFFF", border: "1px solid var(--border)",
            marginBottom: 10
          }}>
            <Thermometer size={12} color={recommended.color} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-soft)" }}>{L.range}:</span>
            <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: recommended.color, direction: "ltr" }}>
              {recommended.tempRange[0]}…{recommended.tempRange[1]}°C · {recommended.pressureMax} bar
            </span>
          </div>

          {/* Use case */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6,
            padding: "8px 10px", borderRadius: 9,
            background: "#FFFFFF", border: "1px solid var(--border)",
            marginBottom: 10
          }}>
            <Info size={12} color={recommended.color} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)", lineHeight: 1.55 }}>
              {useText(recommended)}
            </span>
          </div>

          {/* Why this material? */}
          <div style={{
            padding: 12, borderRadius: 10,
            background: "#FFFFFF", border: "1px dashed " + recommended.color + "60"
          }}>
            <div style={{
              fontSize: 10.5, fontWeight: 900, color: recommended.color,
              marginBottom: 8, display: "flex", alignItems: "center", gap: 5
            }}>
              <Sparkles size={11} /> {L.whyThis}
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              {reasons.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 6,
                  fontSize: 11, fontWeight: 600, color: "var(--text-soft)", lineHeight: 1.55
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: recommended.color, marginTop: 6, flexShrink: 0
                  }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 900, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.05em",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 5
          }}>
            <Check size={11} color="#10B981" /> {L.alternatives}
          </div>
          <div style={{ display: "grid", gap: 5 }}>
            {alternatives.map(m => (
              <div key={m.id} style={{
                padding: "8px 12px", borderRadius: 9,
                background: "var(--bg-soft)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: m.color, flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text)" }}>
                    {name(m)}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "monospace", direction: "ltr" }}>
                    {m.tempRange[0]}…{m.tempRange[1]}°C
                  </div>
                </div>
                <Check size={14} color="#10B981" strokeWidth={3} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 900, color: "#E81123",
            textTransform: "uppercase", letterSpacing: "0.05em",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 5
          }}>
            <X size={11} strokeWidth={3} /> {L.notSuitable} ({rejected.length})
          </div>
          <div style={{ display: "grid", gap: 5 }}>
            {rejected.map(m => (
              <div key={m.id} style={{
                padding: "8px 12px", borderRadius: 9,
                background: "rgba(232,17,35,0.04)",
                border: "1px solid rgba(232,17,35,0.20)",
                display: "flex", alignItems: "flex-start", gap: 8
              }}>
                <X size={13} color="#E81123" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>
                    {name(m)}
                  </div>
                  {m.fails.map((f, i) => (
                    <div key={i} style={{
                      fontSize: 10, fontWeight: 600,
                      color: "#E81123", opacity: 0.85,
                      display: "flex", alignItems: "flex-start", gap: 4, lineHeight: 1.5
                    }}>
                      <span>•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}