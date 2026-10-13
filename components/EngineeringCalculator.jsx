"use client";
import { useState, useEffect } from "react";
import {
  UNIT_CONVERTERS, convertUnit, convertTemperature,
  calcPipeFlow, calcPipeDiameter, calcReynolds,
  calcFrictionLoss, calcVelocity, PIPE_ROUGHNESS, safeEval
} from "@/lib/sizing-advanced";
import {
  Calculator, ArrowLeftRight, Copy, Check, Activity, RotateCcw,
  Ruler, Zap, Sigma, Droplet, Wind, Gauge, Flame, Package, Scale, Box,
  Rocket, Bolt, Power, Beaker, Hand, History, X, Clock
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
export default function EngineeringCalculator({ locale = "fa" }) {
  const [tab, setTab] = useState("converter");
  const isFa = locale === "fa";

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
      {/* Tab bar */}
      <div className="eng-tab-bar">
        {tabs.map(function (t) {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={function () { setTab(t.id); }}
              className={active ? "active" : ""}
            >
              <Icon size={16} /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "converter" && <UnitConverter locale={locale} />}
      {tab === "pipe" && <PipeCalculator locale={locale} />}
      {tab === "scientific" && <ScientificCalculator locale={locale} />}

      <style jsx global>{`
        .eng-tab-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 16px;
          padding: 5px;
          background: var(--bg-soft);
          border-radius: 14px;
          border: 1px solid var(--border);
        }
        .eng-tab-bar button {
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          background: transparent;
          color: var(--text-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .eng-tab-bar button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(201, 149, 13, 0.35);
        }
        @media (max-width: 640px) {
          .eng-tab-bar button span { display: none; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// UNIT CONVERTER
// ============================================================
function UnitConverter({ locale }) {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("cm");
  const [value, setValue] = useState("1");
  const [copied, setCopied] = useState(false);
  const [convHistory, setConvHistory] = useState([]);

  useEffect(function () {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("psm_conv_history");
      if (saved) setConvHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  function addToHistory(entry) {
    setConvHistory(function (prev) {
      const filtered = prev.filter(function (h) {
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

  const activeCat = CATEGORIES.find(function (c) { return c.id === category; });

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
      setTimeout(function () { setCopied(false); }, 1500);
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
    <div className="conv-layout">
      {/* Category picker */}
      <div className="conv-cat-panel">
        <div className="conv-cat-title">
          {locale === "fa" ? "دسته‌بندی" : "Category"}
        </div>
        <div className="conv-cat-grid">
          {CATEGORIES.map(function (c) {
            const active = category === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={function () { changeCategory(c.id); }}
                title={locale === "fa" ? c.fa : c.en}
                className={active ? "active" : ""}
                style={{ "--cat-color": c.color }}
              >
                <Icon size={16} />
                <span>{locale === "fa" ? c.fa : c.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Converter card */}
      <div className="conv-card">
        {/* Header */}
        <div className="conv-head">
          <div
            className="conv-head-icon"
            style={{ background: activeCat.color + "20", color: activeCat.color }}
          >
            <activeCat.icon size={20} />
          </div>
          <div>
            <div className="conv-head-title">
              {locale === "fa" ? activeCat.fa : activeCat.en}
            </div>
            <div className="conv-head-sub">
              {units.length} {locale === "fa" ? "واحد" : "units"}
            </div>
          </div>
        </div>

        {/* From / To */}
        <div className="conv-row">
          <div className="conv-field">
            <div className="conv-label">{locale === "fa" ? "از" : "From"}</div>
            <input
              type="number"
              value={value}
              onChange={function (e) { setValue(e.target.value); }}
              className="conv-input-big"
            />
            <select
              value={fromUnit}
              onChange={function (e) { setFromUnit(e.target.value); }}
              className="conv-select"
            >
              {units.map(function (u) {
                return <option key={u} value={u}>{unitLabel(u, locale)}</option>;
              })}
            </select>
          </div>

          <button onClick={swap} className="conv-swap" title="Swap">
            <ArrowLeftRight size={20} />
          </button>

          <div className="conv-field">
            <div className="conv-label">{locale === "fa" ? "به" : "To"}</div>
            <div className="conv-output-wrap">
              <input
                type="text"
                value={formatted}
                readOnly
                className="conv-input-big conv-output"
              />
              <button onClick={copy} className="conv-copy">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <select
              value={toUnit}
              onChange={function (e) { setToUnit(e.target.value); }}
              className="conv-select"
            >
              {units.map(function (u) {
                return <option key={u} value={u}>{unitLabel(u, locale)}</option>;
              })}
            </select>
          </div>
        </div>

        {/* History */}
        {convHistory.length > 0 && (
          <div className="conv-history">
            <div className="conv-history-head">
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={11} /> {locale === "fa" ? "تبدیل‌های اخیر" : "Recent"}
              </span>
              <button
                onClick={function () {
                  setConvHistory([]);
                  try { localStorage.removeItem("psm_conv_history"); } catch (e) {}
                }}
                className="conv-history-clear"
              >
                {locale === "fa" ? "پاک" : "Clear"}
              </button>
            </div>
            <div className="conv-history-list">
              {convHistory.map(function (h) {
                return (
                  <button
                    key={h.id}
                    onClick={function () {
                      setCategory(h.category);
                      setFromUnit(h.from);
                      setToUnit(h.to);
                      setValue(h.value);
                    }}
                    className="conv-history-item"
                  >
                    <span>
                      {h.value} {h.from} → <strong>{h.result} {h.to}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick reference */}
        <div className="conv-quick">
          <div className="conv-quick-title">
            {locale === "fa" ? "تبدیل سریع ۱ واحد" : "Quick: 1 Unit"}
          </div>
          <div className="conv-quick-grid">
            {units.slice(0, 8).map(function (u) {
              if (u === fromUnit) return null;
              const quick = category === "temperature"
                ? convertTemperature(1, fromUnit, u)
                : convertUnit(category, 1, fromUnit, u);
              const active = u === toUnit;
              return (
                <button
                  key={u}
                  onClick={function () { setToUnit(u); }}
                  className={active ? "active" : ""}
                >
                  <strong>{Number(quick.toFixed(3))}</strong> {u}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .conv-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 14px;
        }
        .conv-cat-panel {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px;
          box-shadow: var(--shadow-sm);
          align-self: start;
        }
        .conv-cat-title {
          font-size: 10px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 4px;
          margin-bottom: 8px;
        }
        .conv-cat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5px;
        }
        .conv-cat-grid button {
          padding: 10px 4px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-soft);
          color: var(--text-soft);
          cursor: pointer;
          font-family: inherit;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
        }
        .conv-cat-grid button:hover {
          border-color: var(--cat-color);
          color: var(--cat-color);
        }
        .conv-cat-grid button.active {
          background: linear-gradient(135deg, var(--cat-color), var(--cat-color));
          color: #FFFFFF;
          border-color: transparent;
          box-shadow: 0 4px 12px var(--cat-color);
          opacity: 0.95;
        }

        .conv-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px;
          box-shadow: var(--shadow-sm);
        }
        .conv-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 14px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
        }
        .conv-head-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
        }
        .conv-head-title {
          font-size: 15px;
          font-weight: 900;
          color: var(--text);
        }
        .conv-head-sub {
          font-size: 10.5px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .conv-row {
          display: grid;
          grid-template-columns: 1fr 52px 1fr;
          gap: 12px;
          align-items: center;
        }
        .conv-field { min-width: 0; }
        .conv-label {
          font-size: 10px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .conv-input-big {
          width: 100%;
          padding: 16px 14px;
          border-radius: 11px;
          font-family: monospace;
          font-size: 22px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 10px;
          line-height: 1;
          border: 2px solid var(--border-strong);
          background: var(--bg-soft);
          color: var(--text);
          outline: none;
        }
        .conv-input-big:focus {
          border-color: var(--gold);
          background: var(--bg-card);
          box-shadow: 0 0 0 3px var(--glow);
        }
        .conv-output-wrap {
          position: relative;
          margin-bottom: 10px;
        }
        .conv-output-wrap .conv-output {
          margin-bottom: 0;
          padding-inline-end: 52px;
          color: var(--gold);
          border-color: var(--gold);
          background: rgba(224, 168, 26, 0.08);
        }
        .conv-copy {
          position: absolute;
          top: 50%;
          inset-inline-end: 10px;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(224, 168, 26, 0.15);
          color: var(--gold);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .conv-copy:hover {
          background: var(--gold);
          color: #FFFFFF;
        }

        .conv-swap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(201, 149, 13, 0.35);
          transition: all 0.3s;
          justify-self: center;
          margin-top: 20px;
        }
        .conv-swap:hover {
          transform: rotate(180deg) scale(1.1);
        }

        .conv-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 12.5px;
          font-weight: 700;
          background: var(--bg-soft);
          color: var(--text);
          border: 1.5px solid var(--border-strong);
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }
        .conv-select:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px var(--glow);
        }

        .conv-history {
          margin-top: 14px;
          padding: 12px 14px;
          background: var(--bg-soft);
          border-radius: 11px;
          border: 1px solid var(--border);
        }
        .conv-history-head {
          font-size: 9.5px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .conv-history-clear {
          background: transparent;
          border: none;
          color: #E81123;
          cursor: pointer;
          font-family: inherit;
          font-size: 9px;
          font-weight: 900;
        }
        .conv-history-list {
          display: grid;
          gap: 4px;
        }
        .conv-history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          cursor: pointer;
          font-family: inherit;
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-soft);
          transition: all 0.15s;
          text-align: start;
        }
        .conv-history-item:hover {
          border-color: var(--gold);
          background: rgba(224, 168, 26, 0.05);
        }
        .conv-history-item span {
          font-family: monospace;
          direction: ltr;
        }
        .conv-history-item strong { color: var(--gold); }

        .conv-quick {
          margin-top: 18px;
          padding: 12px 14px;
          background: var(--bg-soft);
          border-radius: 11px;
          border: 1px solid var(--border);
        }
        .conv-quick-title {
          font-size: 9.5px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .conv-quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 6px;
        }
        .conv-quick-grid button {
          padding: 6px 10px;
          background: var(--bg-card);
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 10.5px;
          font-family: monospace;
          direction: ltr;
          text-align: center;
          color: var(--text-soft);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .conv-quick-grid button:hover {
          border-color: var(--gold);
        }
        .conv-quick-grid button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          border-color: transparent;
        }
        .conv-quick-grid button strong {
          color: var(--gold);
        }
        .conv-quick-grid button.active strong { color: #FFFFFF; }

        @media (max-width: 900px) {
          .conv-layout { grid-template-columns: 1fr; }
          .conv-row { grid-template-columns: 1fr; }
          .conv-swap { margin-top: 0; }
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
      inDiameter: "القطر", inVelocity: "السرعة", inFlow: "التدفق",
      inDensity: "الكثافة", inViscosity: "اللزوجة",
      inLength: "الطول", inRoughness: "المادة",
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
      inDensity: "Плотность", inViscosity: "Вязкость",
      inLength: "Длина", inRoughness: "Материал",
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
      <div className="pipe-modes">
        {modes.map(function (m) {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={function () { setMode(m.id); }}
              className={active ? "active" : ""}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="pipe-grid">
        {/* Inputs */}
        <div className="pipe-inputs">
          <div className="pipe-title">{locale === "fa" ? "ورودی‌ها" : "Inputs"}</div>
          <div style={{ display: "grid", gap: 12 }}>
            {(mode === "flow" || mode === "friction" || mode === "velocity") && (
              <FieldCompact label={L.inDiameter} value={inputs.diameter} onChange={function (val) { upd("diameter", val); }} />
            )}
            {(mode === "diameter" || mode === "friction" || mode === "velocity") && (
              <FieldCompact label={L.inFlow} value={inputs.flow} onChange={function (val) { upd("flow", val); }} />
            )}
            {(mode === "flow" || mode === "diameter") && (
              <FieldCompact label={L.inVelocity} value={inputs.velocity} onChange={function (val) { upd("velocity", val); }} />
            )}
            {mode === "friction" && (
              <>
                <FieldCompact label={L.inLength} value={inputs.length} onChange={function (val) { upd("length", val); }} />
                <div>
                  <label className="pipe-field-label">{L.inRoughness}</label>
                  <select
                    value={inputs.roughness}
                    onChange={function (e) { upd("roughness", e.target.value); }}
                    className="pipe-select"
                  >
                    {Object.keys(PIPE_ROUGHNESS).map(function (k) {
                      const r = PIPE_ROUGHNESS[k];
                      return (
                        <option key={k} value={k}>
                          {r.label[locale] || r.label.en} ({r.value} mm)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}
            {(mode === "flow" || mode === "friction" || mode === "diameter") && (
              <>
                <FieldCompact label={L.inDensity} value={inputs.density} onChange={function (val) { upd("density", val); }} />
                <FieldCompact label={L.inViscosity} value={inputs.viscosity} onChange={function (val) { upd("viscosity", val); }} />
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="pipe-results">
          <div className="pipe-results-title">
            <Activity size={13} /> {L.results}
          </div>

          {!results && (
            <div className="pipe-results-empty">
              {locale === "fa" ? "برای مشاهده نتایج، ورودی‌ها را پر کنید" : "Fill inputs to see results"}
            </div>
          )}

          {results && results.error && (
            <div className="pipe-results-error">{results.error}</div>
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
                <div className="reynolds-box">
                  <div className="reynolds-icon" style={{
                    background: regimeColor(reynoldsInfo.regime) + "20",
                    color: regimeColor(reynoldsInfo.regime)
                  }}>Re</div>
                  <div style={{ flex: 1 }}>
                    <div className="reynolds-label">{L.reynolds}</div>
                    <div className="reynolds-value">{reynoldsInfo.Re.toLocaleString()}</div>
                  </div>
                  <div className="reynolds-badge" style={{
                    background: regimeColor(reynoldsInfo.regime) + "20",
                    color: regimeColor(reynoldsInfo.regime),
                    borderColor: regimeColor(reynoldsInfo.regime) + "40"
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
        .pipe-modes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
          padding: 5px;
          background: var(--bg-soft);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .pipe-modes button {
          padding: 10px 8px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          background: transparent;
          color: var(--text-soft);
          transition: all 0.18s;
        }
        .pipe-modes button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(201, 149, 13, 0.3);
        }

        .pipe-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pipe-inputs,
        .pipe-results {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }
        .pipe-results {
          background: linear-gradient(135deg, rgba(201, 149, 13, 0.08), rgba(201, 149, 13, 0.02));
          border: 1.5px solid rgba(201, 149, 13, 0.35);
        }
        .pipe-title {
          font-size: 11px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }
        .pipe-field-label {
          font-size: 10.5px;
          font-weight: 900;
          color: var(--text-muted);
          margin-bottom: 5px;
          display: block;
        }
        .pipe-select {
          width: 100%;
          padding: 9px 11px;
          border-radius: 9px;
          background: var(--bg-soft);
          color: var(--text);
          border: 1.5px solid var(--border);
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }
        .pipe-select:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px var(--glow);
        }

        .pipe-results-title {
          font-size: 11px;
          font-weight: 900;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pipe-results-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }
        .pipe-results-error {
          padding: 12px;
          border-radius: 10px;
          background: rgba(232, 17, 35, 0.08);
          border: 1px solid rgba(232, 17, 35, 0.35);
          color: #E81123;
          font-size: 12px;
          font-weight: 900;
        }

        .reynolds-box {
          margin-top: 4px;
          padding: 12px;
          border-radius: 11px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .reynolds-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 12px;
        }
        .reynolds-label {
          font-size: 9px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .reynolds-value {
          font-size: 16px;
          font-weight: 900;
          color: var(--text);
          font-family: monospace;
          direction: ltr;
        }
        .reynolds-badge {
          padding: 5px 11px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 900;
          border: 1px solid;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .pipe-grid { grid-template-columns: 1fr; }
          .pipe-modes { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

function FieldCompact({ label, value, onChange }) {
  return (
    <div>
      <label className="pipe-field-label">{label}</label>
      <input
        type="number"
        value={value}
        onChange={function (e) { onChange(e.target.value); }}
        className="pipe-input-field"
        style={{
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 13,
          padding: "10px 12px",
          width: "100%",
          borderRadius: 9,
          background: "var(--bg-soft)",
          color: "var(--text)",
          border: "1.5px solid var(--border)",
          outline: "none"
        }}
        onFocus={function (e) {
          e.target.style.borderColor = "var(--gold)";
          e.target.style.background = "var(--bg-card)";
          e.target.style.boxShadow = "0 0 0 3px var(--glow)";
        }}
        onBlur={function (e) {
          e.target.style.borderColor = "var(--border)";
          e.target.style.background = "var(--bg-soft)";
          e.target.style.boxShadow = "none";
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
        fontSize: 10,
        fontWeight: 900,
        opacity: 0.9,
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 900,
        fontFamily: "monospace",
        direction: "ltr",
        lineHeight: 1
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
      background: "var(--bg-card)",
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
// SCIENTIFIC CALCULATOR
// ============================================================
function ScientificCalculator({ locale }) {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState([]);
  const [lastAnswer, setLastAnswer] = useState(0);

  useEffect(function () {
    function onKey(e) {
      const k = e.key;
      if (["INPUT", "TEXTAREA"].indexOf(document.activeElement.tagName) !== -1) return;
      if (/[0-9]/.test(k)) setExpr(function (x) { return x + k; });
      else if (".+-*/()".indexOf(k) !== -1 && k.length === 1) setExpr(function (x) { return x + k; });
      else if (k === "Enter" || k === "=") { e.preventDefault(); evaluate(); }
      else if (k === "Backspace") setExpr(function (x) { return x.slice(0, -1); });
      else if (k === "Escape") setExpr("");
    }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  });

  function evaluate() {
    const r = safeEval(expr);
    if (r !== null) {
      setHistory(function (h) { return [{ expr: expr, result: r, id: Date.now() }].concat(h).slice(0, 15); });
      setLastAnswer(r);
      setExpr(String(r));
    } else {
      setExpr("Error");
      setTimeout(function () { setExpr(""); }, 800);
    }
  }

  function click(t) {
    if (t === "C") { setExpr(""); return; }
    if (t === "⌫") { setExpr(function (e) { return e.slice(0, -1); }); return; }
    if (t === "=") { evaluate(); return; }
    if (t === "ANS") { setExpr(function (e) { return e + lastAnswer; }); return; }
    setExpr(function (e) { return e + t; });
  }

  const buttons = [
    { l: "C", t: "C", s: "danger" }, { l: "⌫", t: "⌫", s: "warn" },
    { l: "(", t: "(", s: "fn" }, { l: ")", t: ")", s: "fn" }, { l: "÷", t: "/", s: "op" },
    { l: "√", t: "√", s: "fn" }, { l: "7", t: "7" }, { l: "8", t: "8" }, { l: "9", t: "9" }, { l: "×", t: "*", s: "op" },
    { l: "x²", t: "^2", s: "fn" }, { l: "4", t: "4" }, { l: "5", t: "5" }, { l: "6", t: "6" }, { l: "−", t: "-", s: "op" },
    { l: "sin", t: "sin(", s: "fn" }, { l: "1", t: "1" }, { l: "2", t: "2" }, { l: "3", t: "3" }, { l: "+", t: "+", s: "op" },
    { l: "cos", t: "cos(", s: "fn" }, { l: "0", t: "0" }, { l: ".", t: "." }, { l: "ANS", t: "ANS", s: "fn" }, { l: "=", t: "=", s: "eq" }
  ];

  function btnStyle(s) {
    switch (s) {
      case "op": return { background: "rgba(0, 120, 212, 0.12)", color: "#0078D4" };
      case "fn": return { background: "rgba(135, 100, 184, 0.12)", color: "#8764B8" };
      case "eq": return { background: "linear-gradient(135deg, #E0A81A, #B8850A)", color: "#FFFFFF" };
      case "danger": return { background: "rgba(232, 17, 35, 0.12)", color: "#E81123" };
      case "warn": return { background: "rgba(245, 158, 11, 0.12)", color: "#D97706" };
      default: return { background: "var(--bg-soft)", color: "var(--text)" };
    }
  }

  const preview = safeEval(expr);

  return (
    <div className="sci-layout">
      <div className="sci-main">
        {/* Display */}
        <div className="sci-display">
          <div className="sci-expr">{expr || "0"}</div>
          <div className="sci-preview">
            {preview !== null && expr ? "= " + Number(preview.toFixed(8)) : ""}
          </div>
        </div>

        {/* Keypad */}
        <div className="sci-keypad">
          {buttons.map(function (b, i) {
            const st = btnStyle(b.s);
            return (
              <button
                key={i}
                onClick={function () { click(b.t); }}
                style={st}
                className="sci-key"
              >
                {b.l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sci-history">
        <div className="sci-history-head">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <History size={12} />
            {locale === "fa" ? "تاریخچه" : "History"}
          </span>
          {history.length > 0 && (
            <button
              onClick={function () { setHistory([]); }}
              className="sci-history-clear"
              title={locale === "fa" ? "پاک‌کردن" : "Clear"}
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
        <div className="sci-history-body">
          {history.length === 0 ? (
            <div className="sci-history-empty">
              {locale === "fa" ? "محاسبه‌ای انجام نشده" : "No calculations yet"}
            </div>
          ) : (
            history.map(function (h) {
              return (
                <button
                  key={h.id}
                  onClick={function () { setExpr(String(h.result)); }}
                  className="sci-history-item"
                >
                  <div className="sci-history-expr">{h.expr}</div>
                  <div className="sci-history-result">= {Number(h.result.toFixed(8))}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <style jsx global>{`
        .sci-layout {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 12px;
        }
        .sci-main {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .sci-display {
          padding: 22px 26px 18px;
          background: var(--bg-soft);
          border-bottom: 1px solid var(--border);
        }
        .dark .sci-display {
          background: linear-gradient(135deg, #0F1114, #1A1C20);
        }
        .sci-expr {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-soft);
          font-family: monospace;
          direction: ltr;
          text-align: right;
          word-break: break-all;
          margin-bottom: 10px;
          min-height: 24px;
        }
        .sci-preview {
          font-size: 32px;
          font-weight: 900;
          color: var(--gold);
          font-family: monospace;
          direction: ltr;
          text-align: right;
          min-height: 38px;
        }

        .sci-keypad {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .sci-key {
          padding: 16px 8px;
          border-radius: 11px;
          border: none;
          font-size: 15px;
          font-weight: 900;
          font-family: monospace;
          cursor: pointer;
          transition: all 0.1s;
        }
        .sci-key:hover {
          transform: translateY(-2px);
        }
        .sci-key:active {
          transform: translateY(0) scale(0.98);
        }

        .sci-history {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          max-height: 520px;
        }
        .sci-history-head {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          font-weight: 900;
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sci-history-clear {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: rgba(232, 17, 35, 0.12);
          color: #E81123;
          border: none;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .sci-history-body {
          flex: 1;
          overflow-y: auto;
        }
        .sci-history-empty {
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
        }
        .sci-history-item {
          display: block;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border);
          text-align: start;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .sci-history-item:hover {
          background: var(--bg-soft);
        }
        .sci-history-expr {
          font-size: 10.5px;
          color: var(--text-muted);
          font-family: monospace;
          direction: ltr;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 3px;
        }
        .sci-history-result {
          font-size: 14px;
          font-weight: 900;
          color: var(--gold);
          font-family: monospace;
          direction: ltr;
        }

        @media (max-width: 900px) {
          .sci-layout { grid-template-columns: 1fr; }
          .sci-history { max-height: 260px; }
        }
      `}</style>
    </div>
  );
}