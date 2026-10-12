"use client";
import { useState } from "react";

const MATERIALS = [
  {
    id: "wcb",
    name: { fa: "WCB — فولاد کربنی", en: "WCB — Carbon Steel" },
    tempRange: [-29, 425],
    use: { fa: "آب، روغن، گاز غیرخورنده", en: "Water, oil, non-corrosive gas" },
    body: "ASTM A216 WCB",
    trim: { fa: "316 SS / Stellite", en: "316 SS / Stellite" },
    color: "#64748B",
    economical: true
  },
  {
    id: "cf8m",
    name: { fa: "CF8M — استیل 316", en: "CF8M — 316 Stainless" },
    tempRange: [-196, 540],
    use: { fa: "سیالات خورنده، اسیدها، آب دریا", en: "Corrosive fluids, acids, seawater" },
    body: "ASTM A351 CF8M",
    trim: { fa: "316 SS + HVOF", en: "316 SS + HVOF" },
    color: "#0891B2"
  },
  {
    id: "cf3m",
    name: { fa: "CF3M — استیل 316L", en: "CF3M — 316L Stainless" },
    tempRange: [-196, 450],
    use: { fa: "اسیدهای قوی، داروسازی", en: "Strong acids, pharmaceutical" },
    body: "ASTM A351 CF3M",
    trim: { fa: "316L SS", en: "316L SS" },
    color: "#0EA5E9"
  },
  {
    id: "duplex",
    name: { fa: "Duplex — استیل دوپلکس", en: "Duplex Stainless" },
    tempRange: [-50, 300],
    use: { fa: "آب دریا، کلراید بالا", en: "Seawater, high chloride" },
    body: "ASTM A995 4A/5A",
    trim: { fa: "Duplex + Stellite", en: "Duplex + Stellite" },
    color: "#7C3AED"
  },
  {
    id: "alloy20",
    name: { fa: "Alloy 20 — آلیاژ ۲۰", en: "Alloy 20" },
    tempRange: [-29, 425],
    use: { fa: "اسید سولفوریک", en: "Sulfuric acid" },
    body: "ASTM A351 CN7M",
    trim: { fa: "Alloy 20", en: "Alloy 20" },
    color: "#DB2777"
  },
  {
    id: "hastelloy",
    name: { fa: "Hastelloy C-276", en: "Hastelloy C-276" },
    tempRange: [-196, 675],
    use: { fa: "سیالات بسیار خورنده", en: "Highly corrosive fluids" },
    body: "ASTM A494 CW-12MW",
    trim: { fa: "Hastelloy C-276", en: "Hastelloy C-276" },
    color: "#DC2626"
  },
  {
    id: "cryo",
    name: { fa: "CF8M کرایوژنیک", en: "Cryogenic CF8M" },
    tempRange: [-254, -50],
    use: { fa: "LNG، نیتروژن مایع، اکسیژن مایع", en: "LNG, liquid nitrogen/oxygen" },
    body: "ASTM A351 CF8M (cryo-tested)",
    trim: { fa: "316 SS cryo", en: "316 SS cryo" },
    color: "#0284C7"
  }
];

function recommendMaterial(temp, fluidPreset, P1) {
  const t = temp || 25;
  const p = P1 || 10;
  const fluid = fluidPreset || "water";

  // Cryogenic
  if (t <= -50) return "cryo";

  // Extremely high temp
  if (t > 540) return "hastelloy";

  // Corrosive fluids
  if (fluid === "seawater" || fluid === "chloride") return "duplex";
  if (fluid === "acid" || fluid === "sulfuric") return "alloy20";
  if (fluid === "corrosive" || fluid === "highly-corrosive") return "hastelloy";

  // High pressure + high temp
  if (p > 100 && t > 300) return "cf8m";

  // Default moderate
  if (t > 425 || t < -29) return "cf8m";

  // Standard service → WCB
  return "wcb";
}

export default function MaterialGuide({ form, fluid, locale }) {
  const [temp, setTemp] = useState(form && form.T !== undefined ? form.T : 25);
  const [pressure, setPressure] = useState(form && form.P1 !== undefined ? form.P1 : 10);
  const [serviceType, setServiceType] = useState("water");

  const L = {
    fa: {
      title: "راهنمای انتخاب متریال",
      subtitle: "پیشنهاد بدنه و تریم بر اساس شرایط سرویس",
      tempLabel: "دمای کاری (°C)",
      pressLabel: "فشار کاری (bar)",
      serviceLabel: "نوع سرویس",
      recommended: "متریال پیشنهادی",
      body: "بدنه",
      trim: "تریم",
      use: "کاربرد",
      tempRange: "محدوده دما",
      allMaterials: "همه گزینه‌ها",
      services: {
        water: "آب / روغن (غیرخورنده)",
        seawater: "آب دریا",
        acid: "اسید سولفوریک",
        corrosive: "خورنده متوسط",
        "highly-corrosive": "خورنده شدید",
        chloride: "کلراید بالا"
      }
    },
    en: {
      title: "Material Selection Guide",
      subtitle: "Body and trim recommendation based on service conditions",
      tempLabel: "Working Temperature (°C)",
      pressLabel: "Working Pressure (bar)",
      serviceLabel: "Service Type",
      recommended: "Recommended Material",
      body: "Body",
      trim: "Trim",
      use: "Application",
      tempRange: "Temp Range",
      allMaterials: "All Options",
      services: {
        water: "Water / Oil (non-corrosive)",
        seawater: "Seawater",
        acid: "Sulfuric Acid",
        corrosive: "Moderately Corrosive",
        "highly-corrosive": "Highly Corrosive",
        chloride: "High Chloride"
      }
    },
    ar: {
      title: "دليل اختيار المواد",
      subtitle: "توصية الجسم والقيمة بناءً على ظروف الخدمة",
      tempLabel: "درجة الحرارة",
      pressLabel: "الضغط",
      serviceLabel: "نوع الخدمة",
      recommended: "المواد الموصى بها",
      body: "الجسم",
      trim: "القيمة",
      use: "التطبيق",
      tempRange: "نطاق الحرارة",
      allMaterials: "جميع الخيارات",
      services: {
        water: "ماء / زيت",
        seawater: "ماء البحر",
        acid: "حمض الكبريتيك",
        corrosive: "متآكل متوسط",
        "highly-corrosive": "متآكل بشدة",
        chloride: "كلوريد عالي"
      }
    },
    ru: {
      title: "Подбор материалов",
      subtitle: "Рекомендация корпуса и трима",
      tempLabel: "Рабочая температура (°C)",
      pressLabel: "Рабочее давление (bar)",
      serviceLabel: "Тип службы",
      recommended: "Рекомендуемый материал",
      body: "Корпус",
      trim: "Трим",
      use: "Применение",
      tempRange: "Диапазон температур",
      allMaterials: "Все варианты",
      services: {
        water: "Вода / масло",
        seawater: "Морская вода",
        acid: "Серная кислота",
        corrosive: "Среднеагрессивные",
        "highly-corrosive": "Сильно агрессивные",
        chloride: "Высокий хлорид"
      }
    }
  }[locale] || {};

  const recommendedId = recommendMaterial(temp, serviceType, pressure);
  const recommended = MATERIALS.find(function(m) { return m.id === recommendedId; });

  const services = ["water", "seawater", "acid", "corrosive", "highly-corrosive", "chloride"];

  return (
    <div className="card-glass p-5">
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔬</span>
          {L.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>
          {L.subtitle}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            {L.tempLabel}
          </label>
          <input
            type="number"
            value={temp}
            onChange={function(e) { setTemp(parseFloat(e.target.value) || 0); }}
            className="form-input"
            style={{ fontFamily: "monospace", fontWeight: 700, padding: "8px 10px", fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            {L.pressLabel}
          </label>
          <input
            type="number"
            value={pressure}
            onChange={function(e) { setPressure(parseFloat(e.target.value) || 0); }}
            className="form-input"
            style={{ fontFamily: "monospace", fontWeight: 700, padding: "8px 10px", fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>
            {L.serviceLabel}
          </label>
          <select
            value={serviceType}
            onChange={function(e) { setServiceType(e.target.value); }}
            className="form-input"
            style={{ fontSize: 11, fontWeight: 700, padding: "8px 8px" }}
          >
            {services.map(function(s) {
              return <option key={s} value={s}>{L.services[s]}</option>;
            })}
          </select>
        </div>
      </div>

      {recommended && (
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: "linear-gradient(135deg, " + recommended.color + "12, " + recommended.color + "04)",
          border: "1.5px solid " + recommended.color + "50",
          marginBottom: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: recommended.color,
              color: "#FFFFFF",
              fontWeight: 900, fontSize: 13
            }}>
              ★
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: recommended.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                {L.recommended}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>
                {recommended.name[locale] || recommended.name.en}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoRow label={L.body} value={recommended.body} />
            <InfoRow label={L.trim} value={recommended.trim[locale] || recommended.trim.en} />
            <InfoRow label={L.tempRange} value={recommended.tempRange[0] + " to " + recommended.tempRange[1] + " °C"} />
            <InfoRow label={L.use} value={recommended.use[locale] || recommended.use.en} />
          </div>
        </div>
      )}

      <div style={{
        fontSize: 10, fontWeight: 900, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em",
        marginBottom: 8, marginTop: 6
      }}>
        {L.allMaterials}
      </div>

      <div style={{ display: "grid", gap: 5 }}>
        {MATERIALS.map(function(m) {
          const isRec = m.id === recommendedId;
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 9,
              background: isRec ? m.color + "10" : "var(--bg-soft)",
              border: "1px solid " + (isRec ? m.color + "50" : "var(--border)")
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: m.color,
                boxShadow: isRec ? "0 0 8px " + m.color : "none"
              }} />
              <div style={{ flex: 1, fontSize: 11.5, fontWeight: isRec ? 900 : 700, color: isRec ? m.color : "var(--text)" }}>
                {m.name[locale] || m.name.en}
              </div>
              <div style={{
                fontSize: 10, fontFamily: "monospace",
                color: "var(--text-muted)", direction: "ltr", whiteSpace: "nowrap"
              }}>
                {m.tempRange[0]}…{m.tempRange[1]}°C
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{
        fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2
      }}>
        {label}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  );
}
