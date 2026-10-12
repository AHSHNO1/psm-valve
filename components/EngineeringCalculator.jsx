"use client";
import { useState, useEffect } from "react";
import {
  UNIT_CONVERTERS, convertUnit, convertTemperature,
  calcPipeFlow, calcPipeDiameter, calcReynolds,
  calcFrictionLoss, calcVelocity, PIPE_ROUGHNESS, safeEval
} from "@/lib/sizing-advanced";
import {
  Calculator, ArrowLeftRight, Copy, Check, Activity, RotateCcw,
  Ruler, Zap, Sigma, Droplet, Wind, Gauge, Flame, Package, Scale, Box, Rocket, Bolt, Power, Beaker, Hand
} from "lucide-react";

// ============================================================
// CONFIG
// ============================================================
const CATEGORIES = [
  { id: "length", icon: Ruler, fa: "طول", en: "Length", color: "#0078D4" },
  { id: "pressure", icon: Gauge, fa: "فشار", en: "Pressure", color: "#F7630C" },
  { id: "temperature", icon: Flame, fa: "دما", en: "Temp", color: "#E81123" },
  { id: "flow", icon: Droplet, fa: "دبی", en: "Flow", color: "#00A896" },
  { id: "mass", icon: Scale, fa: "جرم", en: "Mass", color: "#7C3AED" },
  { id: "area", icon: Box, fa: "مساحت", en: "Area", color: "#0891B2" },
  { id: "volume", icon: Package, fa: "حجم", en: "Volume", color: "#DB2777" },
  { id: "velocity", icon: Rocket, fa: "سرعت", en: "Velocity", color: "#0284C7" },
  { id: "energy", icon: Bolt, fa: "انرژی", en: "Energy", color: "#CA8A04" },
  { id: "power", icon: Power, fa: "توان", en: "Power", color: "#059669" },
  { id: "density", icon: Beaker, fa: "چگالی", en: "Density", color: "#9333EA" },
  { id: "force", icon: Hand, fa: "نیرو", en: "Force", color: "#DC2626" },
  { id: "viscosity", icon: Wind, fa: "ویسکوزیته", en: "Viscosity", color: "#0D9488" }
];

const UNIT_NAMES = {
  m: { fa: "متر", en: "Meter" }, km: { fa: "کیلومتر", en: "km" }, cm: { fa: "سانتی‌متر", en: "cm" }, mm: { fa: "میلی‌متر", en: "mm" },
  in: { fa: "اینچ", en: "Inch" }, ft: { fa: "فوت", en: "Foot" }, yd: { fa: "یارد", en: "Yard" }, mi: { fa: "مایل", en: "Mile" },
  bar: { fa: "بار", en: "Bar" }, psi: { fa: "psi", en: "PSI" }, kPa: { fa: "کیلوپاسکال", en: "kPa" }, MPa: { fa: "مگاپاسکال", en: "MPa" },
  Pa: { fa: "پاسکال", en: "Pa" }, atm: { fa: "اتمسفر", en: "atm" }, mmHg: { fa: "mm جیوه", en: "mmHg" }, kgcm2: { fa: "kg/cm²", en: "kg/cm²" },
  C: { fa: "سلسیوس", en: "°C" }, F: { fa: "فارنهایت", en: "°F" }, K: { fa: "کلوین", en: "K" },
  m3h: { fa: "متر مکعب/ساعت", en: "m³/h" }, lmin: { fa: "لیتر/دقیقه", en: "L/min" }, ls: { fa: "لیتر/ثانیه", en: "L/s" },
  gpm: { fa: "گالن/دقیقه", en: "GPM" }, cfm: { fa: "CFM", en: "CFM" }, nm3h: { fa: "نرمال m³/h", en: "Nm³/h" }, kgs: { fa: "کیلوگرم/ثانیه", en: "kg/s" },
  kg: { fa: "کیلوگرم", en: "kg" }, g: { fa: "گرم", en: "g" }, t: { fa: "تن", en: "ton" }, lb: { fa: "پوند", en: "lb" }, oz: { fa: "اونس", en: "oz" },
  m2: { fa: "متر مربع", en: "m²" }, cm2: { fa: "cm²", en: "cm²" }, mm2: { fa: "mm²", en: "mm²" }, in2: { fa: "in²", en: "in²" }, ft2: { fa: "ft²", en: "ft²" },
  m3: { fa: "متر مکعب", en: "m³" }, l: { fa: "لیتر", en: "L" }, ml: { fa: "میلی‌لیتر", en: "mL" }, gal: { fa: "گالن", en: "gal" }, ft3: { fa: "ft³", en: "ft³" },
  ms: { fa: "متر/ثانیه", en: "m/s" }, kmh: { fa: "km/h", en: "km/h" }, ftps: { fa: "ft/s", en: "ft/s" }, mph: { fa: "mph", en: "mph" }, knots: { fa: "گرە", en: "knot" },
  J: { fa: "ژول", en: "J" }, kJ: { fa: "کیلوژول", en: "kJ" }, cal: { fa: "کالری", en: "cal" }, kcal: { fa: "کیلوکالری", en: "kcal" },
  Wh: { fa: "وات‌ساعت", en: "Wh" }, kWh: { fa: "کیلووات‌ساعت", en: "kWh" }, BTU: { fa: "BTU", en: "BTU" }, eV: { fa: "الکترون‌ولت", en: "eV" },
  W: { fa: "وات", en: "W" }, kW: { fa: "کیلووات", en: "kW" }, MW: { fa: "مگاوات", en: "MW" }, hp: { fa: "اسب بخار", en: "hp" },
  PS: { fa: "PS", en: "PS" }, BTU_h: { fa: "BTU/h", en: "BTU/h" }, cal_s: { fa: "cal/s", en: "cal/s" },
  kgm3: { fa: "kg/m³", en: "kg/m³" }, gcm3: { fa: "g/cm³", en: "g/cm³" }, kgl: { fa: "kg/L", en: "kg/L" },
  lbft3: { fa: "lb/ft³", en: "lb/ft³" }, lbgal: { fa: "lb/gal", en: "lb/gal" }, API: { fa: "API", en: "API" },
  N: { fa: "نیوتن", en: "N" }, kN: { fa: "کیلونیوتن", en: "kN" }, kgf: { fa: "kgf", en: "kgf" },
  lbf: { fa: "lbf", en: "lbf" }, dyn: { fa: "داین", en: "dyn" }, tonf: { fa: "tonf", en: "tonf" },
  Pas: { fa: "Pa·s", en: "Pa·s" }, mPas: { fa: "mPa·s", en: "mPa·s" }, cP: { fa: "cP", en: "cP" },
  poise: { fa: "پواز", en: "poise" }, cSt: { fa: "cSt", en: "cSt" }, St: { fa: "استوکس", en: "St" }
};

function unitLabel(code, locale) {
  const u = UNIT_NAMES[code];
  if (!u) return code;
  return (locale === "fa" ? u.fa : u.en) + " (" + code + ")";
}

// ============================================================
// MAIN
// ============================================================
export default function EngineeringCalculator({ locale }) {
  const [tab, setTab] = useState("converter");

  const L = {
    fa: { converter: "تبدیل واحد", pipe: "محاسبات لوله", scientific: "ماشین‌حساب علمی" },
    en: { converter: "Unit Converter", pipe: "Pipe Calculations", scientific: "Scientific Calculator" },
    ar: { converter: "محول الوحدات", pipe: "حسابات الأنابيب", scientific: "حاسبة علمية" },
    ru: { converter: "Конвертер", pipe: "Трубопроводы", scientific: "Научный" }
  }[locale] || {};

  const tabs = [
    { id: "converter", icon: Ruler, label: L.converter },
    { id: "pipe", icon: Zap, label: L.pipe },
    { id: "scientific", icon: Calculator, label: L.scientific }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Tab bar — big, prominent */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 6,
        marginBottom: 16,
        padding: 5,
        background: "var(--bg-soft)",
        borderRadius: 14,
        border: "1px solid var(--border)"
      }}>
        {tabs.map(function(t) {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }}
              style={{
                padding: "12px 16px", borderRadius: 10, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 900,
                background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
                color: active ? "#FFFFFF" : "var(--text-soft)",
                boxShadow: active ? "0 6px 16px rgba(201, 149, 13, 0.35)" : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "converter" && <UnitConverter locale={locale} />}
      {tab === "pipe" && <PipeCalculator locale={locale} />}
      {tab === "scientific" && <ScientificCalculator locale={locale} />}
    </div>
  );
}

// ============================================================
// UNIT CONVERTER — full width, bigger
// ============================================================
function UnitConverter({ locale }) {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("cm");
  const [value, setValue] = useState("1");
  const [copied, setCopied] = useState(false);
  const [convHistory, setConvHistory] = useState([]);

  // Load history from localStorage
  useEffect(function() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("psm_conv_history");
      if (saved) setConvHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  function addToHistory(entry) {
    setConvHistory(function(prev) {
      const filtered = prev.filter(function(h) {
        return !(h.from === entry.from && h.to === entry.to && h.value === entry.value);
      });
      const next = [entry].concat(filtered).slice(0, 8);
      if (typeof window !== "undefined") {
        try { localStorage.setItem("psm_conv_history", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
  }

  const units = category === "temperature"
    ? ["C", "F", "K"]
    : Object.keys(UNIT_CONVERTERS[category].units);

  const activeCat = CATEGORIES.find(function(c) { return c.id === category; });

  function changeCategory(cat) {
    setCategory(cat);
    if (cat === "temperature") { setFromUnit("C"); setToUnit("F"); }
    else {
      const keys = Object.keys(UNIT_CONVERTERS[cat].units);
      setFromUnit(keys[0]); setToUnit(keys[1] || keys[0]);
    }
  }

  const num = parseFloat(value) || 0;
  const result = category === "temperature"
    ? convertTemperature(num, fromUnit, toUnit)
    : convertUnit(category, num, fromUnit, toUnit);
  const formatted = Number(result.toFixed(8)).toString();

  function swap() { setFromUnit(toUnit); setToUnit(fromUnit); }
  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 1500);
      addToHistory({
        id: Date.now(),
        from: fromUnit,
        to: toUnit,
        value: value,
        result: formatted,
        category: category
      });
    }
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      gap: 14
    }} className="conv-layout">

      {/* Category picker — tile grid */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 10,
        boxShadow: "0 1px 3px rgba(20, 22, 27, 0.04)",
        alignSelf: "start"
      }}>
        <div style={{
          fontSize: 10, fontWeight: 900,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "0 4px",
          marginBottom: 8
        }}>
          {locale === "fa" ? "دسته‌بندی" : "Category"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 5
        }}>
          {CATEGORIES.map(function(c) {
            const active = category === c.id;
            const Icon = c.icon;
            return (
              <button key={c.id} onClick={function() { changeCategory(c.id); }}
                title={locale === "fa" ? c.fa : c.en}
                style={{
                  padding: "10px 4px",
                  borderRadius: 10,
                  border: "1px solid " + (active ? "transparent" : "var(--border)"),
                  background: active
                    ? "linear-gradient(135deg, " + c.color + ", " + c.color + "cc)"
                    : "#FFFFFF",
                  color: active ? "#FFFFFF" : "var(--text-soft)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 10,
                  fontWeight: 900,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: active ? "0 4px 12px " + c.color + "40" : "none",
                  transition: "all 0.15s"
                }}>
                <Icon size={16} />
                <span>{locale === "fa" ? c.fa : c.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Converter card */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 22,
        boxShadow: "0 1px 3px rgba(20, 22, 27, 0.04)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Category header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          paddingBottom: 14, marginBottom: 18,
          borderBottom: "1px solid var(--border)"
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            display: "grid", placeItems: "center",
            background: activeCat.color + "15",
            color: activeCat.color
          }}>
            <activeCat.icon size={20} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
              {locale === "fa" ? activeCat.fa : activeCat.en}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>
              {units.length} {locale === "fa" ? "واحد" : "units"}
            </div>
          </div>
        </div>

        {/* From / To */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 52px 1fr",
          gap: 12,
          alignItems: "center",
          flex: 1
        }}>
          {/* From */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8
            }}>
              {locale === "fa" ? "از" : "From"}
            </div>
            <input
              type="number"
              value={value}
              onChange={function(e) { setValue(e.target.value); }}
              className="form-input"
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 900,
                padding: "16px 14px",
                textAlign: "center",
                marginBottom: 10,
                lineHeight: 1,
                border: "2px solid var(--border)"
              }}
            />
            <select value={fromUnit} onChange={function(e) { setFromUnit(e.target.value); }}
              className="form-input" style={{ fontSize: 12.5, fontWeight: 700, padding: "10px 12px" }}>
              {units.map(function(u) {
                return <option key={u} value={u}>{unitLabel(u, locale)}</option>;
              })}
            </select>
          </div>

          {/* Swap button */}
          <button onClick={swap}
            style={{
              width: 52, height: 52, borderRadius: 14,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF", border: "none", cursor: "pointer",
              boxShadow: "0 6px 16px rgba(201, 149, 13, 0.35)",
              transition: "all 0.3s",
              justifySelf: "center",
              marginTop: 20
            }}
            onMouseEnter={function(e) { e.currentTarget.style.transform = "rotate(180deg) scale(1.1)"; }}
            onMouseLeave={function(e) { e.currentTarget.style.transform = "rotate(0) scale(1)"; }}
          >
            <ArrowLeftRight size={20} />
          </button>

          {/* To */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8
            }}>
              {locale === "fa" ? "به" : "To"}
            </div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                type="text"
                value={formatted}
                readOnly
                className="form-input"
                style={{
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 900,
                  padding: "16px 52px 16px 14px",
                  textAlign: "center",
                  color: "#B8850A",
                  background: "linear-gradient(135deg, #FFFBF0, #FFF9E6)",
                  border: "2px solid #E0A81A",
                  lineHeight: 1,
                  cursor: "pointer"
                }}
              />
              <button onClick={copy}
                style={{
                  position: "absolute",
                  top: "50%",
                  insetInlineEnd: 10,
                  transform: "translateY(-50%)",
                  width: 36, height: 36, borderRadius: 10,
                  display: "grid", placeItems: "center",
                  background: copied ? "#10B981" : "rgba(201, 149, 13, 0.15)",
                  color: copied ? "#FFFFFF" : "#8A6508",
                  border: "none", cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <select value={toUnit} onChange={function(e) { setToUnit(e.target.value); }}
              className="form-input" style={{ fontSize: 12.5, fontWeight: 700, padding: "10px 12px" }}>
              {units.map(function(u) {
                return <option key={u} value={u}>{unitLabel(u, locale)}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Recent conversions history */}
      {convHistory.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "#FFFFFF",
          borderRadius: 10,
          border: "1px solid var(--border)"
        }}>
          <div style={{
            fontSize: 9.5,
            fontWeight: 900,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>{locale === "fa" ? "تبدیل‌های اخیر" : "Recent"}</span>
            <button
              onClick={function() {
                setConvHistory([]);
                try { localStorage.removeItem("psm_conv_history"); } catch (e) {}
              }}
              style={{
                fontSize: 9,
                color: "#E81123",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 900
              }}>
              {locale === "fa" ? "پاک" : "Clear"}
            </button>
          </div>
          <div style={{
            display: "grid",
            gap: 4
          }}>
            {convHistory.map(function(h) {
              return (
                <button
                  key={h.id}
                  onClick={function() {
                    setCategory(h.category);
                    setFromUnit(h.from);
                    setToUnit(h.to);
                    setValue(h.value);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "var(--text-soft)",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={function(e) {
                    e.currentTarget.style.borderColor = "#E0A81A";
                    e.currentTarget.style.background = "#FFFBF0";
                  }}
                  onMouseLeave={function(e) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-soft)";
                  }}
                >
                  <span style={{ fontFamily: "monospace", direction: "ltr" }}>
                    {h.value} {h.from} → <strong style={{ color: "#B8850A" }}>{h.result} {h.to}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick reference */}
        <div style={{
          marginTop: 18,
          padding: "12px 14px",
          background: "var(--bg-soft)",
          borderRadius: 11,
          border: "1px solid var(--border)"
        }}>
          <div style={{
            fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.05em",
            marginBottom: 8
          }}>
            {locale === "fa" ? "تبدیل سریع ۱ واحد" : "Quick: 1 Unit"}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 6
          }}>
            {units.slice(0, 8).map(function(u) {
              if (u === fromUnit) return null;
              const quick = category === "temperature"
                ? convertTemperature(1, fromUnit, u)
                : convertUnit(category, 1, fromUnit, u);
              const active = u === toUnit;
              return (
                <button key={u} onClick={function() { setToUnit(u); }}
                  style={{
                    padding: "6px 10px",
                    background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "#FFFFFF",
                    borderRadius: 8,
                    border: "1px solid " + (active ? "transparent" : "var(--border)"),
                    fontSize: 10.5,
                    fontFamily: "monospace",
                    direction: "ltr",
                    textAlign: "center",
                    color: active ? "#FFFFFF" : "var(--text-soft)",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}>
                  <strong style={{ color: active ? "#FFFFFF" : "#B8850A" }}>
                    {Number(quick.toFixed(3))}
                  </strong> {u}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .conv-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// PIPE CALCULATOR
// ============================================================
function PipeCalculator({ locale }) {
  const [mode, setMode] = useState("flow");
  const [inputs, setInputs] = useState({
    diameter: "50", velocity: "2", flow: "14.14",
    density: "1000", viscosity: "0.001",
    length: "100", roughness: "steel"
  });

  function upd(k, v) { setInputs(Object.assign({}, inputs, { [k]: v })); }

  const L = {
    fa: {
      flow: "دبی از قطر", diameter: "قطر از دبی", friction: "افت فشار", velocity: "سرعت",
      inDiameter: "قطر (mm)", inVelocity: "سرعت (m/s)", inFlow: "دبی (m³/h)",
      inDensity: "چگالی (kg/m³)", inViscosity: "ویسکوزیته (Pa·s)",
      inLength: "طول لوله (m)", inRoughness: "جنس لوله",
      results: "نتایج", flowRate: "دبی", diameterOut: "قطر",
      velocityOut: "سرعت", area: "سطح مقطع",
      reynolds: "رینولدز", regime: "رژیم",
      frictionFactor: "ضریب f", headLoss: "افت هد", pressureDrop: "افت فشار",
      laminar: "آرام", turbulent: "مغشوش", transitional: "انتقالی",
      gpm: "GPM", lmin: "L/min"
    },
    en: {
      flow: "Flow from D", diameter: "Diameter from Q", friction: "Friction Loss", velocity: "Velocity",
      inDiameter: "Diameter (mm)", inVelocity: "Velocity (m/s)", inFlow: "Flow (m³/h)",
      inDensity: "Density (kg/m³)", inViscosity: "Viscosity (Pa·s)",
      inLength: "Pipe Length (m)", inRoughness: "Pipe Material",
      results: "Results", flowRate: "Flow Rate", diameterOut: "Diameter",
      velocityOut: "Velocity", area: "Area",
      reynolds: "Reynolds", regime: "Regime",
      frictionFactor: "Factor f", headLoss: "Head Loss", pressureDrop: "Pressure Drop",
      laminar: "Laminar", turbulent: "Turbulent", transitional: "Transitional",
      gpm: "GPM", lmin: "L/min"
    },
    ar: {
      flow: "التدفق", diameter: "القطر", friction: "الفقدان", velocity: "السرعة",
      inDiameter: "القطر (mm)", inVelocity: "السرعة (m/s)", inFlow: "التدفق (m³/h)",
      inDensity: "الكثافة", inViscosity: "اللزوجة", inLength: "الطول", inRoughness: "المادة",
      results: "النتائج", flowRate: "التدفق", diameterOut: "القطر",
      velocityOut: "السرعة", area: "المقطع",
      reynolds: "رينولدز", regime: "النظام",
      frictionFactor: "f", headLoss: "الرأس", pressureDrop: "الضغط",
      laminar: "صفحي", turbulent: "مضطرب", transitional: "انتقالي",
      gpm: "GPM", lmin: "L/min"
    },
    ru: {
      flow: "Расход из D", diameter: "Диаметр из Q", friction: "Потери", velocity: "Скорость",
      inDiameter: "Диаметр (mm)", inVelocity: "Скорость (m/s)", inFlow: "Расход (m³/h)",
      inDensity: "Плотность", inViscosity: "Вязкость", inLength: "Длина", inRoughness: "Материал",
      results: "Результаты", flowRate: "Расход", diameterOut: "Диаметр",
      velocityOut: "Скорость", area: "Сечение",
      reynolds: "Рейнольдс", regime: "Режим",
      frictionFactor: "f", headLoss: "Напор", pressureDrop: "Перепад",
      laminar: "Ламинарный", turbulent: "Турбулентный", transitional: "Переходный",
      gpm: "GPM", lmin: "L/min"
    }
  }[locale] || {};

  const d = parseFloat(inputs.diameter) || 0;
  const v = parseFloat(inputs.velocity) || 0;
  const q = parseFloat(inputs.flow) || 0;
  const rho = parseFloat(inputs.density) || 0;
  const mu = parseFloat(inputs.viscosity) || 0;
  const len = parseFloat(inputs.length) || 0;
  const rough = PIPE_ROUGHNESS[inputs.roughness] || PIPE_ROUGHNESS.steel;

  let results = null, reynoldsInfo = null, frictionInfo = null;
  if (mode === "flow") {
    results = calcPipeFlow({ diameter_mm: d, velocity_ms: v });
    reynoldsInfo = calcReynolds({ density: rho, velocity: v, diameter_mm: d, viscosity: mu });
  } else if (mode === "diameter") {
    results = calcPipeDiameter({ flow_m3h: q, velocity_ms: v });
    if (!results.error) reynoldsInfo = calcReynolds({ density: rho, velocity: v, diameter_mm: results.diameter_mm, viscosity: mu });
  } else if (mode === "friction") {
    results = calcFrictionLoss({ flow_m3h: q, diameter_mm: d, length_m: len, roughness_mm: rough.value, density: rho, viscosity: mu });
    if (!results.error) {
      reynoldsInfo = { Re: results.Re, regime: results.Re > 4000 ? "Turbulent" : results.Re > 2300 ? "Transitional" : "Laminar" };
      frictionInfo = results;
    }
  } else if (mode === "velocity") {
    results = calcVelocity({ flow_m3h: q, diameter_mm: d });
  }

  function regimeLabel(r) {
    if (r === "Laminar") return L.laminar;
    if (r === "Turbulent") return L.turbulent;
    if (r === "Transitional") return L.transitional;
    return r;
  }
  function regimeColor(r) {
    if (r === "Laminar") return "#10B981";
    if (r === "Turbulent") return "#0078D4";
    return "#F59E0B";
  }

  const modes = [
    { id: "flow", label: L.flow },
    { id: "diameter", label: L.diameter },
    { id: "friction", label: L.friction },
    { id: "velocity", label: L.velocity }
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Mode selector */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5,
        padding: 5, background: "var(--bg-soft)",
        borderRadius: 12, border: "1px solid var(--border)"
      }}>
        {modes.map(function(m) {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={function() { setMode(m.id); }}
              style={{
                padding: "10px 8px", borderRadius: 9, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 900,
                background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
                color: active ? "#FFFFFF" : "var(--text-soft)",
                boxShadow: active ? "0 4px 12px rgba(201, 149, 13, 0.3)" : "none",
                transition: "all 0.18s"
              }}>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Inputs + Results side by side */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }} className="pipe-2col">

        {/* Inputs */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 1px 3px rgba(20, 22, 27, 0.04)"
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 14
          }}>
            {locale === "fa" ? "ورودی‌ها" : "Inputs"}
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(mode === "flow" || mode === "friction" || mode === "velocity") && (
              <FieldCompact label={L.inDiameter} value={inputs.diameter} onChange={function(v) { upd("diameter", v); }} />
            )}
            {(mode === "diameter" || mode === "friction" || mode === "velocity") && (
              <FieldCompact label={L.inFlow} value={inputs.flow} onChange={function(v) { upd("flow", v); }} />
            )}
            {(mode === "flow" || mode === "diameter") && (
              <FieldCompact label={L.inVelocity} value={inputs.velocity} onChange={function(v) { upd("velocity", v); }} />
            )}
            {mode === "friction" && (
              <>
                <FieldCompact label={L.inLength} value={inputs.length} onChange={function(v) { upd("length", v); }} />
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 900, color: "var(--text-muted)", marginBottom: 5, display: "block" }}>
                    {L.inRoughness}
                  </label>
                  <select value={inputs.roughness} onChange={function(e) { upd("roughness", e.target.value); }}
                    className="form-input" style={{ fontSize: 12, fontWeight: 700, padding: "9px 11px" }}>
                    {Object.keys(PIPE_ROUGHNESS).map(function(k) {
                      const r = PIPE_ROUGHNESS[k];
                      return <option key={k} value={k}>
                        {r.label[locale] || r.label.en} ({r.value} mm)
                      </option>;
                    })}
                  </select>
                </div>
              </>
            )}
            {(mode === "flow" || mode === "friction" || mode === "diameter") && (
              <>
                <FieldCompact label={L.inDensity} value={inputs.density} onChange={function(v) { upd("density", v); }} />
                <FieldCompact label={L.inViscosity} value={inputs.viscosity} onChange={function(v) { upd("viscosity", v); }} />
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{
          background: "linear-gradient(135deg, rgba(201, 149, 13, 0.06), rgba(201, 149, 13, 0.01))",
          border: "1.5px solid rgba(201, 149, 13, 0.3)",
          borderRadius: 14,
          padding: 18
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900,
            color: "var(--gold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 14,
            display: "flex", alignItems: "center", gap: 6
          }}>
            <Activity size={13} /> {L.results}
          </div>

          {!results && (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 600
            }}>
              {locale === "fa" ? "برای مشاهده نتایج، ورودی‌ها را پر کنید" : "Fill inputs to see results"}
            </div>
          )}

          {results && results.error && (
            <div style={{
              padding: 12, borderRadius: 10,
              background: "rgba(232, 17, 35, 0.08)",
              border: "1px solid rgba(232, 17, 35, 0.3)",
              color: "#E81123", fontSize: 12, fontWeight: 900
            }}>
              {results.error}
            </div>
          )}

          {results && !results.error && (
            <div style={{ display: "grid", gap: 8 }}>
              {mode === "flow" && (
                <>
                  <ResultBig label={L.flowRate} value={results.flow_m3h} unit="m³/h" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultSmall label={L.lmin} value={results.flow_lmin} unit="L/min" />
                    <ResultSmall label={L.gpm} value={results.flow_gpm} unit="GPM" />
                  </div>
                  <ResultSmall label={L.area} value={results.area_mm2} unit="mm²" />
                </>
              )}
              {mode === "diameter" && (
                <>
                  <ResultBig label={L.diameterOut} value={results.diameter_mm} unit="mm" />
                  <ResultSmall label="inch" value={results.diameter_in} unit='"' />
                </>
              )}
              {mode === "friction" && frictionInfo && (
                <>
                  <ResultBig label={L.velocityOut} value={results.velocity} unit="m/s" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultSmall label={L.pressureDrop} value={results.pressureDrop_bar} unit="bar" />
                    <ResultSmall label={L.headLoss} value={results.headLoss_m} unit="m" />
                  </div>
                  <ResultSmall label={L.frictionFactor} value={results.frictionFactor} />
                </>
              )}
              {mode === "velocity" && (
                <>
                  <ResultBig label={L.velocityOut} value={results.velocity_ms} unit="m/s" />
                  <ResultSmall label="ft/s" value={results.velocity_fts} unit="ft/s" />
                </>
              )}

              {reynoldsInfo && reynoldsInfo.Re > 0 && (
                <div style={{
                  marginTop: 4,
                  padding: 12,
                  borderRadius: 11,
                  background: "#FFFFFF",
                  border: "1px solid " + regimeColor(reynoldsInfo.regime) + "40",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    display: "grid", placeItems: "center",
                    background: regimeColor(reynoldsInfo.regime) + "15",
                    color: regimeColor(reynoldsInfo.regime),
                    fontWeight: 900, fontSize: 12
                  }}>Re</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 900,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 3
                    }}>
                      {L.reynolds}
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 900,
                      color: "var(--text)",
                      fontFamily: "monospace",
                      direction: "ltr"
                    }}>
                      {reynoldsInfo.Re.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    padding: "5px 11px", borderRadius: 8,
                    background: regimeColor(reynoldsInfo.regime) + "15",
                    color: regimeColor(reynoldsInfo.regime),
                    fontSize: 11, fontWeight: 900,
                    border: "1px solid " + regimeColor(reynoldsInfo.regime) + "40",
                    whiteSpace: "nowrap"
                  }}>
                    {regimeLabel(reynoldsInfo.regime)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .pipe-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function FieldCompact({ label, value, onChange }) {
  return (
    <div>
      <label style={{
        fontSize: 10.5, fontWeight: 900,
        color: "var(--text-muted)",
        marginBottom: 5, display: "block"
      }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        className="form-input"
        style={{
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 13,
          padding: "10px 12px"
        }}
      />
    </div>
  );
}

function ResultBig({ label, value, unit }) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 12,
      background: "linear-gradient(135deg, #E0A81A, #B8850A)",
      color: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 6px 16px rgba(201, 149, 13, 0.3)"
    }}>
      <div style={{
        fontSize: 10, fontWeight: 900,
        opacity: 0.9,
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 900,
        fontFamily: "monospace",
        direction: "ltr",
        lineHeight: 1,
        textShadow: "0 2px 6px rgba(0,0,0,0.15)"
      }}>
        {value}
        {unit && (
          <span style={{
            fontSize: 11, marginInlineStart: 4,
            opacity: 0.85, fontWeight: 700
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultSmall({ label, value, unit }) {
  return (
    <div style={{
      padding: 10,
      borderRadius: 10,
      background: "#FFFFFF",
      border: "1px solid var(--border)"
    }}>
      <div style={{
        fontSize: 9, fontWeight: 900,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 4
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 900,
        color: "var(--text)",
        fontFamily: "monospace",
        direction: "ltr",
        lineHeight: 1
      }}>
        {value}
        {unit && (
          <span style={{
            fontSize: 9.5, marginInlineStart: 3,
            opacity: 0.7, fontWeight: 700
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SCIENTIFIC CALCULATOR — bigger, cleaner
// ============================================================
function ScientificCalculator({ locale }) {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState([]);
  const [lastAnswer, setLastAnswer] = useState(0);

  useEffect(function() {
    function onKey(e) {
      const k = e.key;
      if (["INPUT", "TEXTAREA"].indexOf(document.activeElement.tagName) !== -1) return;
      if (/[0-9]/.test(k)) setExpr(function(x) { return x + k; });
      else if (".+-*/()".indexOf(k) !== -1 && k.length === 1) setExpr(function(x) { return x + k; });
      else if (k === "Enter" || k === "=") { e.preventDefault(); evaluate(); }
      else if (k === "Backspace") setExpr(function(x) { return x.slice(0, -1); });
      else if (k === "Escape") setExpr("");
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  });

  function evaluate() {
    const r = safeEval(expr);
    if (r !== null) {
      setHistory(function(h) { return [{ expr: expr, result: r, id: Date.now() }].concat(h).slice(0, 15); });
      setLastAnswer(r);
      setExpr(String(r));
    } else {
      setExpr("Error");
      setTimeout(function() { setExpr(""); }, 800);
    }
  }

  function click(t) {
    if (t === "C") { setExpr(""); return; }
    if (t === "⌫") { setExpr(function(e) { return e.slice(0, -1); }); return; }
    if (t === "=") { evaluate(); return; }
    if (t === "ANS") { setExpr(function(e) { return e + lastAnswer; }); return; }
    setExpr(function(e) { return e + t; });
  }

  const buttons = [
    { l: "C", t: "C", s: "danger" }, { l: "⌫", t: "⌫", s: "warn" },
    { l: "(", t: "(", s: "fn" }, { l: ")", t: ")", s: "fn" }, { l: "÷", t: "/", s: "op" },
    { l: "√", t: "√", s: "fn" }, { l: "7", t: "7" }, { l: "8", t: "8" }, { l: "9", t: "9" }, { l: "×", t: "*", s: "op" },
    { l: "x²", t: "^2", s: "fn" }, { l: "4", t: "4" }, { l: "5", t: "5" }, { l: "6", t: "6" }, { l: "−", t: "-", s: "op" },
    { l: "sin", t: "sin(", s: "fn" }, { l: "1", t: "1" }, { l: "2", t: "2" }, { l: "3", t: "3" }, { l: "+", t: "+", s: "op" },
    { l: "cos", t: "cos(", s: "fn" }, { l: "0", t: "0" }, { l: ".", t: "." }, { l: "ANS", t: "ANS", s: "fn" }, { l: "=", t: "=", s: "eq" }
  ];

  function style(s) {
    switch (s) {
      case "op": return { bg: "rgba(0, 120, 212, 0.10)", color: "#0078D4" };
      case "fn": return { bg: "rgba(135, 100, 184, 0.10)", color: "#8764B8" };
      case "eq": return { bg: "linear-gradient(135deg, #E0A81A, #B8850A)", color: "#FFFFFF" };
      case "danger": return { bg: "rgba(232, 17, 35, 0.10)", color: "#E81123" };
      case "warn": return { bg: "rgba(245, 158, 11, 0.10)", color: "#D97706" };
      default: return { bg: "#F4F5F7", color: "#1A1D21" };
    }
  }

  const preview = safeEval(expr);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 260px",
      gap: 12
    }} className="sci-2col">
      {/* Calculator */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(20, 22, 27, 0.04)"
      }}>
        {/* Display */}
        <div style={{
          padding: "22px 26px 18px",
          background: "linear-gradient(135deg, #0F1114, #1A1C22)",
          borderBottom: "1px solid var(--border)"
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: "rgba(241, 243, 245, 0.55)",
            fontFamily: "monospace",
            direction: "ltr",
            textAlign: "right",
            wordBreak: "break-all",
            marginBottom: 10,
            minHeight: 24
          }}>
            {expr || "0"}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 900,
            color: "#F5C518",
            fontFamily: "monospace",
            direction: "ltr",
            textAlign: "right",
            minHeight: 38,
            textShadow: "0 0 20px rgba(245, 197, 24, 0.4)"
          }}>
            {preview !== null && expr ? "= " + Number(preview.toFixed(8)) : ""}
          </div>
        </div>

        {/* Keypad */}
        <div style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6
        }}>
          {buttons.map(function(b, i) {
            const st = style(b.s);
            return (
              <button key={i} onClick={function() { click(b.t); }}
                style={{
                  padding: "16px 8px",
                  borderRadius: 11,
                  border: "none",
                  background: st.bg, color: st.color,
                  fontSize: 15, fontWeight: 900,
                  fontFamily: "monospace", cursor: "pointer",
                  transition: "all 0.1s"
                }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {b.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(20, 22, 27, 0.04)"
      }}>
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 12, fontWeight: 900,
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>{locale === "fa" ? "تاریخچه" : "History"}</span>
          {history.length > 0 && (
            <button onClick={function() { setHistory([]); }}
              style={{
                width: 26, height: 26, borderRadius: 8,
                background: "rgba(232, 17, 35, 0.10)",
                color: "#E81123",
                border: "none", cursor: "pointer",
                display: "grid", placeItems: "center"
              }}
              title={locale === "fa" ? "پاک‌کردن" : "Clear"}>
              <RotateCcw size={12} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {history.length === 0 ? (
            <div style={{
              padding: 30, textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 11, fontWeight: 700
            }}>
              {locale === "fa" ? "محاسبه‌ای انجام نشده" : "No calculations yet"}
            </div>
          ) : (
            history.map(function(h) {
              return (
                <button key={h.id} onClick={function() { setExpr(String(h.result)); }}
                  style={{
                    display: "block", width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "start",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "var(--bg-soft)"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    fontSize: 10.5, color: "var(--text-muted)",
                    fontFamily: "monospace",
                    direction: "ltr",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 3
                  }}>
                    {h.expr}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 900,
                    color: "#B8850A",
                    fontFamily: "monospace",
                    direction: "ltr"
                  }}>
                    = {Number(h.result.toFixed(8))}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .sci-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
