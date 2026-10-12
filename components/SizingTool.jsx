"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, AlertTriangle, CheckCircle2, Activity, Wind,
  Gauge, BarChart3, Zap, Droplets, Flame, ChevronDown,
  ArrowLeft, Beaker, Save, Trash2, Printer, X, Layers,
  Share2, RotateCcw
} from "lucide-react";
import {
  calcLiquidCv, calcGasCv, calcSteamCv, cvToSize,
  getRecommendation, FLUID_PRESETS
} from "@/lib/sizing-advanced";
import {
  PRESET_SCENARIOS, loadScenarios, saveScenario,
  removeScenario, clearScenarios
} from "@/lib/sizing-presets";
import { useDictionary } from "./Providers";

const DEFAULT_FORM = {
  Q: 100, Gf: 1, Gg: 0.65, P1: 10, P2: 6, T: 25,
  Pv: 0.5, Pc: 221, Z: 1, k: 1.4, xT: 0.7, FL: 0.9, W: 500
};

function getRecommendedCharacteristic(fluid, openingPercent) {
  if (fluid === "gas" || fluid === "steam") return "equal";
  if (fluid === "liquid") {
    if (openingPercent > 70) return "linear";
    return "equal";
  }
  return "equal";
}

// ============ INLINE STANDARDS TABLE ============
const STANDARDS_DN = [
  { dn: "DN15", nps: '1/2"', cv: 15 },
  { dn: "DN25", nps: '1"', cv: 45 },
  { dn: "DN50", nps: '2"', cv: 150 },
  { dn: "DN80", nps: '3"', cv: 320 },
  { dn: "DN100", nps: '4"', cv: 550 },
  { dn: "DN150", nps: '6"', cv: 1250 },
  { dn: "DN200", nps: '8"', cv: 2200 },
  { dn: "DN300", nps: '12"', cv: 4800 }
];

const STANDARDS_ANSI = [
  { ansi: "150", pn: "PN20", bar: 19.6 },
  { ansi: "300", pn: "PN50", bar: 51.1 },
  { ansi: "600", pn: "PN100", bar: 102.1 },
  { ansi: "900", pn: "PN150", bar: 153.2 },
  { ansi: "1500", pn: "PN250", bar: 255.3 },
  { ansi: "2500", pn: "PN420", bar: 425.5 }
];

function StandardsTable({ locale }) {
  const [tab, setTab] = useState("dn");

  return (
    <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
          <span>📊</span>
          {locale === "fa" ? "جدول استانداردها" : "Standards"}
        </div>
        <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-soft)", borderRadius: 8 }}>
          <button onClick={function() { setTab("dn"); }} style={{
            padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 10, fontWeight: 900,
            background: tab === "dn" ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
            color: tab === "dn" ? "#FFFFFF" : "var(--text-soft)"
          }}>DN/NPS</button>
          <button onClick={function() { setTab("ansi"); }} style={{
            padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 10, fontWeight: 900,
            background: tab === "ansi" ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
            color: tab === "ansi" ? "#FFFFFF" : "var(--text-soft)"
          }}>ANSI/PN</button>
        </div>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-soft)", zIndex: 1 }}>
            <tr>
              {(tab === "dn" ? ["DN", "NPS", "Cv"] : ["ANSI", "PN", "bar"]).map(function(h, i) {
                return (
                  <th key={i} style={{
                    padding: "8px 12px", textAlign: "center",
                    fontSize: 10, fontWeight: 900, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--border)"
                  }}>{h}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(tab === "dn" ? STANDARDS_DN : STANDARDS_ANSI).map(function(d, i) {
              const row = tab === "dn"
                ? [d.dn, d.nps, d.cv]
                : ["Class " + d.ansi, d.pn, d.bar];
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)" }}>
                  {row.map(function(c, j) {
                    return (
                      <td key={j} style={{
                        padding: "7px 12px", textAlign: "center",
                        fontFamily: "monospace", fontWeight: j === 0 ? 900 : 700,
                        color: j === 0 ? "#B8850A" : "var(--text)"
                      }}>{c}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ INLINE MATERIAL GUIDE ============
const MATERIALS = [
  { id: "wcb", name: { fa: "WCB فولاد کربنی", en: "WCB Carbon Steel" }, tempRange: [-29, 425], body: "ASTM A216 WCB", color: "#64748B" },
  { id: "cf8m", name: { fa: "CF8M استیل 316", en: "CF8M 316 SS" }, tempRange: [-196, 540], body: "ASTM A351 CF8M", color: "#0891B2" },
  { id: "cf3m", name: { fa: "CF3M استیل 316L", en: "CF3M 316L SS" }, tempRange: [-196, 450], body: "ASTM A351 CF3M", color: "#0EA5E9" },
  { id: "duplex", name: { fa: "Duplex دوپلکس", en: "Duplex SS" }, tempRange: [-50, 300], body: "ASTM A995 4A", color: "#7C3AED" },
  { id: "alloy20", name: { fa: "Alloy 20", en: "Alloy 20" }, tempRange: [-29, 425], body: "ASTM A351 CN7M", color: "#DB2777" },
  { id: "hastelloy", name: { fa: "Hastelloy C-276", en: "Hastelloy C-276" }, tempRange: [-196, 675], body: "ASTM A494 CW-12MW", color: "#DC2626" },
  { id: "cryo", name: { fa: "CF8M کرایو", en: "Cryogenic CF8M" }, tempRange: [-254, -50], body: "ASTM A351 CF8M cryo", color: "#0284C7" }
];

function MaterialGuide({ form, locale }) {
  const temp = form.T || 25;
  const p = form.P1 || 10;

  let recId = "wcb";
  if (temp <= -50) recId = "cryo";
  else if (temp > 540) recId = "hastelloy";
  else if (p > 100 && temp > 300) recId = "cf8m";
  else if (temp > 425 || temp < -29) recId = "cf8m";

  const recommended = MATERIALS.find(function(m) { return m.id === recId; });

  return (
    <div className="card-glass" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span>🔬</span>
        {locale === "fa" ? "راهنمای انتخاب متریال" : "Material Guide"}
      </div>

      {recommended && (
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 10,
          background: recommended.color + "12",
          border: "1.5px solid " + recommended.color + "50"
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: recommended.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            {locale === "fa" ? "پیشنهاد" : "Recommended"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
            {recommended.name[locale] || recommended.name.en}
          </div>
          <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--text-soft)" }}>
            {recommended.body} · {recommended.tempRange[0]}…{recommended.tempRange[1]}°C
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 4 }}>
        {MATERIALS.map(function(m) {
          const isRec = m.id === recId;
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderRadius: 8,
              background: isRec ? m.color + "10" : "var(--bg-soft)",
              border: "1px solid " + (isRec ? m.color + "50" : "var(--border)")
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: m.color
              }} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: isRec ? 900 : 700, color: isRec ? m.color : "var(--text)" }}>
                {m.name[locale] || m.name.en}
              </div>
              <div style={{ fontSize: 9.5, fontFamily: "monospace", color: "var(--text-muted)" }}>
                {m.tempRange[0]}…{m.tempRange[1]}°C
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function SizingTool() {
  const { locale } = useDictionary();
  const [fluid, setFluid] = useState("liquid");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mobileTab, setMobileTab] = useState("form");

  useEffect(function() { setSaved(loadScenarios()); }, []);

  // Auto-save to localStorage
  useEffect(function() {
    if (typeof window === "undefined") return;
    try {
      const savedData = localStorage.getItem("psm_sizing_form");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.form) setForm(Object.assign({}, DEFAULT_FORM, parsed.form));
        if (parsed.fluid) setFluid(parsed.fluid);
      }
    } catch (e) {}
  }, []);

  useEffect(function() {
    if (typeof window === "undefined") return;
    const t = setTimeout(function() {
      try {
        localStorage.setItem("psm_sizing_form", JSON.stringify({ form: form, fluid: fluid }));
      } catch (e) {}
    }, 500);
    return function() { clearTimeout(t); };
  }, [form, fluid]);

  function update(k) {
    return function(e) {
      const v = parseFloat(e.target.value);
      setForm(Object.assign({}, form, { [k]: isNaN(v) ? 0 : v }));
    };
  }

  function applyPreset(preset) {
    setFluid(preset.fluid);
    setForm(Object.assign({}, DEFAULT_FORM, preset.values));
    setResult(null);
  }

  function applyFluidPreset(key) {
    const p = FLUID_PRESETS[key];
    if (!p) return;
    setForm(Object.assign({}, form, { Gf: p.Gf, Pv: p.Pv, Pc: p.Pc }));
  }

  function calculate() {
    let r;
    if (fluid === "liquid") {
      r = calcLiquidCv({ Q: form.Q, Gf: form.Gf, P1: form.P1, P2: form.P2, Pv: form.Pv, Pc: form.Pc, FL: form.FL });
    } else if (fluid === "steam") {
      r = calcSteamCv({ W: form.W, P1: form.P1, P2: form.P2, T: form.T });
    } else {
      r = calcGasCv({ Q: form.Q, Gg: form.Gg, T: form.T, P1: form.P1, P2: form.P2, Z: form.Z, k: form.k, xT: form.xT });
    }
    if (r.error) { setResult({ error: r.error }); return; }
    const openingPercent = Math.min(100, Math.round((r.Cv / r.size.cv) * 100));
    const warnings = getRecommendation(openingPercent, r.choked, r.cavitationRisk);
    const recCharacteristic = getRecommendedCharacteristic(fluid, openingPercent);
    setResult(Object.assign({}, r, {
      openingPercent: openingPercent,
      warnings: warnings,
      fluidType: fluid,
      recommendedCharacteristic: recCharacteristic,
      timestamp: Date.now()
    }));
    setShowMore(false);
  }

  function reset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setFluid("liquid");
    try { localStorage.removeItem("psm_sizing_form"); } catch (e) {}
  }

  function handleSave() {
    if (!result || !scenarioName.trim()) return;
    const item = {
      id: "sc-" + Date.now(),
      name: scenarioName.trim(),
      fluid: fluid,
      form: Object.assign({}, form),
      result: result
    };
    setSaved(saveScenario(item));
    setScenarioName("");
    setShowSaveDialog(false);
  }

  function handleRemove(id) { setSaved(removeScenario(id)); }

  function handleClearAll() {
    if (!confirm("همه سناریوها حذف شوند؟")) return;
    clearScenarios();
    setSaved([]);
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  function handleDownloadPDF() {
    try {
      // Simple print to PDF approach
      window.print();
    } catch (e) {
      alert("خطا در تولید PDF");
    }
  }

  function handleDownloadCSV() {
    if (!result) return;
    const rows = [
      ["PSM VALVE — Petro Sazeh Mihan"],
      ["IT Department"],
      [""],
      ["Parameter", "Value", "Unit"],
      ["Fluid", fluid, ""],
      ["Q", form.Q, fluid === "steam" ? "kg/h" : "m3/h"],
      ["P1", form.P1, "bar"],
      ["P2", form.P2, "bar"],
      ["Pv", form.Pv || "-", "bar"],
      ["T", form.T || "-", "C"],
      [""],
      ["Cv", result.Cv, ""],
      ["Kv", result.Kv, ""],
      ["Size", result.size.size, ""],
      ["DN", result.size.dn, ""],
      ["NPS", result.size.nps, ""],
      ["Opening", result.openingPercent + "%", ""],
      ["Velocity", result.velocity || "-", "m/s"],
      ["Noise", result.noise || "-", "dB"],
      ["Cavitation", result.cavitationRisk || "-", ""]
    ];
    const csv = rows.map(function(r) {
      return r.map(function(c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PSM-Sizing-" + Date.now() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareLink() {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams();
      params.set("fluid", fluid);
      Object.keys(form).forEach(function(k) { params.set(k, String(form[k])); });
      const url = window.location.origin + window.location.pathname + "?" + params.toString();
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(function() { setShowShareToast(false); }, 2500);
    } catch (e) {}
  }

  const L = {
    fa: {
      title: "سایزینگ شیر کنترلی",
      subtitle: "محاسبه دقیق Cv/Kv بر اساس IEC 60534",
      liquid: "مایع", gas: "گاز", steam: "بخار",
      presets: "سناریوها",
      operatingPoint: "نقطه کاری",
      advanced: "پیشرفته",
      calculate: "محاسبه",
      reset: "بازنشانی",
      emptyTitle: "فرم را پر کنید",
      emptyDesc: "یا از سناریوهای آماده استفاده کنید",
      cv: "ضریب Cv", size: "سایز", opening: "بازشدگی",
      velocity: "سرعت", noise: "نویز", cav: "کاویتاسیون",
      low: "کم", medium: "متوسط", high: "بالا", flashing: "فلاشینگ",
      choked: "جریان Choked",
      more: "جزئیات", less: "بستن",
      pdf: "PDF", excel: "Excel", print: "چاپ", save: "ذخیره", share: "اشتراک",
      reqQuote: "درخواست قیمت",
      saveDialog: "نام سناریو", confirm: "ذخیره", cancel: "انصراف",
      savedList: "سناریوهای ذخیره‌شده",
      removeAll: "حذف همه",
      formTab: "فرم", resultsTab: "نتایج",
      chartTitle: "نمودار مشخصه جریان",
      whyTitle: "چرا این سایز؟",
      altTitle: "مقایسه سایزها",
      tipsTitle: "توصیه‌ها",
      printTitle: "گزارش سایزینگ شیر کنترلی"
    },
    en: {
      title: "Control Valve Sizing",
      subtitle: "Accurate Cv/Kv calculation per IEC 60534",
      liquid: "Liquid", gas: "Gas", steam: "Steam",
      presets: "Scenarios",
      operatingPoint: "Operating Point",
      advanced: "Advanced",
      calculate: "Calculate",
      reset: "Reset",
      emptyTitle: "Fill the form",
      emptyDesc: "or use a preset scenario",
      cv: "Cv", size: "Size", opening: "Opening",
      velocity: "Velocity", noise: "Noise", cav: "Cavitation",
      low: "Low", medium: "Medium", high: "High", flashing: "Flashing",
      choked: "Choked Flow",
      more: "Details", less: "Hide",
      pdf: "PDF", excel: "Excel", print: "Print", save: "Save", share: "Share",
      reqQuote: "Request Quote",
      saveDialog: "Scenario name", confirm: "Save", cancel: "Cancel",
      savedList: "Saved scenarios",
      removeAll: "Clear all",
      formTab: "Form", resultsTab: "Results",
      chartTitle: "Flow Characteristic",
      whyTitle: "Why this size?",
      altTitle: "Alt Sizes",
      tipsTitle: "Tips",
      printTitle: "Control Valve Sizing Report"
    },
    ar: {
      title: "تحديد حجم الصمام",
      subtitle: "حساب Cv/Kv وفقًا لـ IEC 60534",
      liquid: "سائل", gas: "غاز", steam: "بخار",
      presets: "سيناريوهات", operatingPoint: "نقطة التشغيل", advanced: "متقدم",
      calculate: "احسب", reset: "إعادة",
      emptyTitle: "املأ النموذج", emptyDesc: "أو اختر سيناريو",
      cv: "Cv", size: "الحجم", opening: "الفتح",
      velocity: "السرعة", noise: "الضجيج", cav: "التجويف",
      low: "منخفض", medium: "متوسط", high: "عالي", flashing: "وميض",
      choked: "تدفق مختنق", more: "المزيد", less: "إخفاء",
      pdf: "PDF", excel: "Excel", print: "طباعة", save: "حفظ", share: "مشاركة",
      reqQuote: "طلب سعر", saveDialog: "اسم السيناريو", confirm: "حفظ", cancel: "إلغاء",
      savedList: "السيناريوهات", removeAll: "حذف الكل",
      formTab: "النموذج", resultsTab: "النتائج",
      chartTitle: "خصائص التدفق", whyTitle: "لماذا؟", altTitle: "مقارنة", tipsTitle: "نصائح",
      printTitle: "تقرير"
    },
    ru: {
      title: "Подбор клапана",
      subtitle: "Расчет Cv/Kv по IEC 60534",
      liquid: "Жидкость", gas: "Газ", steam: "Пар",
      presets: "Сценарии", operatingPoint: "Рабочая точка", advanced: "Ещё",
      calculate: "Рассчитать", reset: "Сброс",
      emptyTitle: "Заполните форму", emptyDesc: "или выберите пресет",
      cv: "Cv", size: "Размер", opening: "Открытие",
      velocity: "Скорость", noise: "Шум", cav: "Кавитация",
      low: "Низкий", medium: "Средний", high: "Высокий", flashing: "Вспышка",
      choked: "Крит. поток", more: "Детали", less: "Скрыть",
      pdf: "PDF", excel: "Excel", print: "Печать", save: "Сохранить", share: "Поделиться",
      reqQuote: "Запросить", saveDialog: "Имя", confirm: "Сохранить", cancel: "Отмена",
      savedList: "Сохраненные", removeAll: "Очистить",
      formTab: "Форма", resultsTab: "Результаты",
      chartTitle: "Характеристика", whyTitle: "Почему?", altTitle: "Сравнить", tipsTitle: "Советы",
      printTitle: "Отчет"
    }
  }[locale] || {};

  return (
    <section className="container-x py-6 sizing-root">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-4 no-print">
        <h1 className="text-xl sm:text-2xl font-black" style={{ color: "var(--text)" }}>
          <span className="heading-grad">{L.title}</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
          {L.subtitle}
        </p>
      </div>

      {/* Mobile tab */}
      <div className="mobile-tab-bar">
        <button onClick={function() { setMobileTab("form"); }} className={"mobile-tab-btn" + (mobileTab === "form" ? " active" : "")}>
          📝 {L.formTab}
        </button>
        <button onClick={function() { setMobileTab("results"); }} className={"mobile-tab-btn" + (mobileTab === "results" ? " active" : "")}>
          📊 {L.resultsTab}
        </button>
      </div>

      {/* Main grid */}
      <div className="sizing-grid">

        {/* LEFT: FORM */}
        <div className={"no-print sizing-form-col" + (mobileTab === "form" ? " mobile-show" : "")}>

          {/* Presets */}
          <div className="card-glass" style={{ padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              ⚡ {L.presets}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {PRESET_SCENARIOS.map(function(p) {
                return (
                  <button key={p.id} onClick={function() { applyPreset(p); }}
                    style={{
                      padding: 10, borderRadius: 10, background: "#FFFFFF",
                      border: "1.5px solid var(--border)", cursor: "pointer",
                      fontFamily: "inherit", textAlign: "start",
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={function(e) {
                      e.currentTarget.style.borderColor = p.color;
                      e.currentTarget.style.background = p.color + "08";
                    }}
                    onMouseLeave={function(e) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "#FFFFFF";
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      display: "grid", placeItems: "center",
                      background: p.color + "15", fontSize: 16,
                      flexShrink: 0
                    }}>{p.icon}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", lineHeight: 1.3 }}>
                        {p.name[locale] || p.name.en}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fluid + Inputs */}
          <div className="card-glass" style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 12, background: "var(--bg-soft)", padding: 5, borderRadius: 11 }}>
              {[
                { id: "liquid", icon: Droplets, label: L.liquid },
                { id: "gas", icon: Wind, label: L.gas },
                { id: "steam", icon: Flame, label: L.steam }
              ].map(function(f) {
                const Icon = f.icon;
                const active = fluid === f.id;
                return (
                  <button key={f.id} onClick={function() { setFluid(f.id); setResult(null); }}
                    style={{
                      padding: "8px 6px", borderRadius: 8, border: "none",
                      cursor: "pointer", fontFamily: "inherit",
                      fontSize: 12, fontWeight: 900,
                      background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
                      color: active ? "#FFFFFF" : "var(--text-soft)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                    }}>
                    <Icon size={14} /> {f.label}
                  </button>
                );
              })}
            </div>

            {fluid === "liquid" && (
              <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
                {Object.keys(FLUID_PRESETS).map(function(k) {
                  return (
                    <button key={k} onClick={function() { applyFluidPreset(k); }}
                      style={{
                        padding: "5px 10px", borderRadius: 8,
                        background: "var(--bg-soft)", border: "1px solid var(--border)",
                        color: "var(--text-soft)", fontSize: 11, fontWeight: 800,
                        cursor: "pointer", fontFamily: "inherit"
                      }}>
                      {FLUID_PRESETS[k].name[locale] || FLUID_PRESETS[k].name.en}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{L.operatingPoint}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {fluid === "steam" ? (
                <Field label="W" unit="kg/h" value={form.W} onChange={update("W")} />
              ) : (
                <Field label="Q" unit={fluid === "liquid" ? "m³/h" : "Nm³/h"} value={form.Q} onChange={update("Q")} />
              )}
              {fluid === "liquid" && <Field label="Gf" unit="—" value={form.Gf} onChange={update("Gf")} step={0.01} />}
              {fluid === "gas" && <Field label="Gg" unit="—" value={form.Gg} onChange={update("Gg")} step={0.01} />}
              <Field label="P1" unit="bar" value={form.P1} onChange={update("P1")} step={0.1} />
              <Field label="P2" unit="bar" value={form.P2} onChange={update("P2")} step={0.1} />
              {fluid === "liquid" && <Field label="Pv" unit="bar" value={form.Pv} onChange={update("Pv")} step={0.01} />}
              {fluid !== "liquid" && <Field label="T" unit="°C" value={form.T} onChange={update("T")} />}
              {fluid === "gas" && <Field label="Z" unit="—" value={form.Z} onChange={update("Z")} step={0.01} />}
            </div>

            <button onClick={function() { setShowAdvanced(!showAdvanced); }}
              style={{
                marginTop: 12, width: "100%", padding: "8px 12px",
                borderRadius: 9, background: "var(--bg-soft)", border: "1px solid var(--border)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "inherit", color: "var(--text-soft)", fontSize: 11.5, fontWeight: 800
              }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Zap size={12} /> {L.advanced}
              </span>
              <ChevronDown size={13} style={{ transform: showAdvanced ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {fluid === "liquid" && (
                  <>
                    <Field label="Pc" unit="bar" value={form.Pc} onChange={update("Pc")} />
                    <Field label="FL" unit="—" value={form.FL} onChange={update("FL")} step={0.01} />
                  </>
                )}
                {fluid === "gas" && (
                  <>
                    <Field label="k" unit="—" value={form.k} onChange={update("k")} step={0.01} />
                    <Field label="xT" unit="—" value={form.xT} onChange={update("xT")} step={0.01} />
                  </>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 12 }}>
              <button onClick={calculate} className="btn-gold justify-center" style={{ padding: "12px", fontSize: 13.5 }}>
                <Calculator size={17} /> {L.calculate}
              </button>
              <button onClick={reset} style={{
                padding: "12px 16px", borderRadius: 10,
                background: "var(--bg-soft)", border: "1px solid var(--border)",
                color: "var(--text-soft)", cursor: "pointer",
                display: "grid", placeItems: "center"
              }}>
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Saved scenarios */}
          {saved.length > 0 && (
            <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
              <button onClick={function() { setShowSaved(!showSaved); }}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 900, color: "var(--text-soft)" }}>
                  <Layers size={13} /> {L.savedList} ({saved.length})
                </span>
                <ChevronDown size={13} style={{
                  transform: showSaved ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s", color: "var(--text-muted)"
                }} />
              </button>
              {showSaved && (
                <div style={{ padding: "0 12px 12px" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    {saved.map(function(s) {
                      return (
                        <div key={s.id} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 10px", borderRadius: 8,
                          background: "var(--bg-soft)", border: "1px solid var(--border)"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text)" }}>{s.name}</div>
                            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "monospace", direction: "ltr" }}>
                              Cv {s.result.Cv} · {s.result.size.size} · {s.result.openingPercent}%
                            </div>
                          </div>
                          <button onClick={function() { handleRemove(s.id); }}
                            style={{
                              width: 22, height: 22, borderRadius: 6,
                              background: "rgba(232, 17, 35, 0.1)", color: "#E81123",
                              border: "none", cursor: "pointer", display: "grid", placeItems: "center"
                            }}>
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={handleClearAll} style={{
                    marginTop: 8, fontSize: 10.5, fontWeight: 900, color: "#E81123",
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    <Trash2 size={10} /> {L.removeAll}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: RESULTS + STANDARDS + MATERIAL */}
        <div className={"sizing-results-col" + (mobileTab === "results" ? " mobile-show" : "")}>

          {/* Empty */}
          {!result && (
            <div className="card-glass no-print" style={{
              padding: 40, minHeight: 220,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, rgba(201, 149, 13, 0.04), rgba(201, 149, 13, 0.01))",
              border: "2px dashed rgba(201, 149, 13, 0.3)", textAlign: "center"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, marginBottom: 14,
                display: "grid", placeItems: "center",
                background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                color: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(201, 149, 13, 0.35)"
              }}>
                <Gauge size={28} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{L.emptyTitle}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{L.emptyDesc}</div>
            </div>
          )}

          {/* Error */}
          {result && result.error && (
            <div className="card-glass p-4 no-print" style={{ borderColor: "#E81123", background: "rgba(232, 17, 35, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E81123", fontSize: 12, fontWeight: 900 }}>
                <AlertTriangle size={16} /> {result.error}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <motion.div
              id="sizing-print-area"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "grid", gap: 10 }}
            >
              {/* Print header */}
              <div className="print-only" style={{ display: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "2px solid #C9950D", marginBottom: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 11,
                    display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                    color: "#FFFFFF", fontWeight: 900, fontSize: 13
                  }}>PSM</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#1A1D21" }}>{L.printTitle}</div>
                    <div style={{ fontSize: 10, color: "#7A8290" }}>{new Date().toLocaleDateString("fa-IR")}</div>
                  </div>
                </div>
              </div>

              {/* Result grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 8 }}>
                <div style={{
                  padding: 16, borderRadius: 16,
                  background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                  color: "#FFFFFF", textAlign: "center",
                  boxShadow: "0 10px 24px rgba(201, 149, 13, 0.35)",
                  display: "flex", flexDirection: "column", justifyContent: "center"
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.9, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                    {L.cv}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, fontFamily: "monospace" }}>
                    {result.Cv}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, marginTop: 6, fontFamily: "monospace" }}>
                    Kv {result.Kv}
                  </div>
                </div>

                <div className="card-glass" style={{ padding: 16, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    {L.size}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "var(--gold)", lineHeight: 1, fontFamily: "monospace" }}>
                    {result.size.size}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 6, display: "flex", justifyContent: "center", gap: 6, fontFamily: "monospace" }}>
                    <span>{result.size.dn}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{result.size.nps}</span>
                  </div>
                </div>

                <div className="card-glass" style={{ padding: 16, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    {L.opening}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", lineHeight: 1, fontFamily: "monospace" }}>
                    {result.openingPercent}%
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--bg-soft)", marginTop: 8, overflow: "hidden" }}>
                    <div style={{
                      width: result.openingPercent + "%", height: "100%",
                      background: result.openingPercent < 20 || result.openingPercent > 85 ? "#E81123" : "linear-gradient(90deg, #E0A81A, #B8850A)"
                    }} />
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="card-glass" style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
                {result.velocity > 0 && <Metric icon={<Activity size={12} />} label={L.velocity} value={result.velocity + " m/s"} />}
                {result.noise && <Metric icon={<Gauge size={12} />} label={L.noise} value={result.noise + " dB"} />}
                {result.sigma && <Metric icon={<BarChart3 size={12} />} label="σ" value={result.sigma} />}
                {result.cavitationRisk && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 9px", borderRadius: 8,
                    background: (result.cavitationRisk === "low" ? "#10B981" : result.cavitationRisk === "flashing" ? "#E81123" : "#F59E0B") + "12",
                    border: "1px solid " + (result.cavitationRisk === "low" ? "#10B981" : result.cavitationRisk === "flashing" ? "#E81123" : "#F59E0B") + "30"
                  }}>
                    {result.cavitationRisk === "low" ? <CheckCircle2 size={12} color="#10B981" /> : <AlertTriangle size={12} color={result.cavitationRisk === "flashing" ? "#E81123" : "#F59E0B"} />}
                    <span style={{
                      fontSize: 10, fontWeight: 900,
                      color: result.cavitationRisk === "low" ? "#10B981" : result.cavitationRisk === "flashing" ? "#E81123" : "#F59E0B"
                    }}>
                      {L.cav}: {result.cavitationRisk === "low" ? L.low : result.cavitationRisk === "medium" ? L.medium : result.cavitationRisk === "high" ? L.high : L.flashing}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Btn onClick={handleDownloadPDF} icon={<Printer size={14} />} label="PDF" highlight />
                <Btn onClick={handleDownloadCSV} icon={<Save size={14} />} label="Excel" highlight />
                <Btn onClick={function() { setShowSaveDialog(true); }} icon={<Save size={14} />} label={L.save} />
                <Btn onClick={shareLink} icon={<Share2 size={14} />} label={L.share} />
              </div>

              {/* Toggle details */}
              <button onClick={function() { setShowMore(!showMore); }}
                className="no-print"
                style={{
                  padding: "10px", borderRadius: 10,
                  background: "var(--bg-soft)", border: "1px dashed var(--border-strong)",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: 11.5, fontWeight: 900, color: "var(--text-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}>
                <ChevronDown size={13} style={{ transform: showMore ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                {showMore ? L.less : L.more}
              </button>

              {showMore && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div className="card-glass" style={{ padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>{L.whyTitle}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-soft)", lineHeight: 1.7 }}>
                      ✓ Cv = {result.Cv} محاسبه شده طبق IEC 60534<br />
                      ✓ بازشدگی {result.openingPercent}% — {result.openingPercent >= 20 && result.openingPercent <= 80 ? "بهینه" : "خارج از محدوده" }<br />
                      ✓ کاویتاسیون: {result.cavitationRisk || "کم"}<br />
                      {result.choked && "⚠️ جریان Choked تشخیص داده شد"}
                    </div>
                  </div>
                </div>
              )}

              <Link href={"/" + locale + "/contact"} className="btn-gold justify-center text-sm no-print" style={{ padding: "11px" }}>
                {L.reqQuote} <ArrowLeft size={14} />
              </Link>
            </motion.div>
          )}

          {/* Standards — ALWAYS visible */}
          <StandardsTable locale={locale} />

          {/* Material — ALWAYS visible */}
          <MaterialGuide form={form} locale={locale} />
        </div>
      </div>

      {/* Save dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <>
            <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(20, 22, 27, 0.5)", backdropFilter: "blur(4px)", zIndex: 90 }} onClick={function() { setShowSaveDialog(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="no-print"
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", zIndex: 100,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 18, padding: 22, width: "90%", maxWidth: 400,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>
                {L.saveDialog}
              </div>
              <input
                type="text"
                value={scenarioName}
                onChange={function(e) { setScenarioName(e.target.value); }}
                className="form-input"
                autoFocus
                onKeyDown={function(e) { if (e.key === "Enter") handleSave(); }}
                style={{ fontSize: 13, padding: "10px 14px" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={handleSave} className="btn-gold flex-1 justify-center text-sm" style={{ padding: "10px" }}>
                  {L.confirm}
                </button>
                <button onClick={function() { setShowSaveDialog(false); }} className="btn-outline" style={{ padding: "10px 16px", fontSize: 13 }}>
                  {L.cancel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="no-print"
            style={{
              position: "fixed", bottom: 90, left: "50%",
              transform: "translateX(-50%)", zIndex: 50,
              padding: "10px 20px", borderRadius: 12,
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#FFFFFF", fontSize: 12, fontWeight: 900,
              boxShadow: "0 12px 32px rgba(16, 185, 129, 0.4)",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <CheckCircle2 size={15} /> لینک کپی شد
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .mobile-tab-bar { display: none; }
        .sizing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .sizing-form-col, .sizing-results-col {
          display: grid;
          gap: 10px;
          align-self: start;
        }
        @media (max-width: 1023px) {
          .mobile-tab-bar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            padding: 5px;
            background: var(--bg-soft);
            border-radius: 12px;
            border: 1px solid var(--border);
            margin-bottom: 12px;
          }
          .mobile-tab-btn {
            padding: 10px;
            border-radius: 9px;
            border: none;
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 900;
            background: transparent;
            color: var(--text-soft);
            transition: all 0.15s;
          }
          .mobile-tab-btn.active {
            background: linear-gradient(135deg, #E0A81A, #B8850A);
            color: #FFFFFF;
          }
          .sizing-grid { grid-template-columns: 1fr; }
          .sizing-form-col, .sizing-results-col { display: none; }
          .sizing-form-col.mobile-show, .sizing-results-col.mobile-show { display: grid; }
        }
        @media print {
          .no-print, header, footer, nav { display: none !important; }
          body { background: #FFFFFF !important; }
          .sizing-root { padding: 0 !important; }
          .print-only { display: block !important; }
          .card-glass { background: #FFFFFF !important; border: 1px solid #D1D5DB !important; box-shadow: none !important; page-break-inside: avoid; }
          .sizing-grid { display: block !important; }
          .sizing-form-col, .sizing-results-col { display: block !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
    </section>
  );
}

function Field({ label, unit, value, onChange, step }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 900, color: "var(--text-muted)" }}>{label}</span>
        {unit && <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "monospace", fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "var(--bg-soft)" }}>{unit}</span>}
      </div>
      <input
        type="number"
        step={step || 1}
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: "9px 10px", borderRadius: 9,
          border: "1.5px solid var(--border)", background: "var(--bg-soft)",
          color: "var(--text)", fontFamily: "monospace", fontSize: 13.5, fontWeight: 700
        }}
        onFocus={function(e) {
          e.target.style.borderColor = "#E0A81A";
          e.target.style.background = "#FFFFFF";
          e.target.style.boxShadow = "0 0 0 3px rgba(201, 149, 13, 0.12)";
        }}
        onBlur={function(e) {
          e.target.style.borderColor = "var(--border)";
          e.target.style.background = "var(--bg-soft)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "var(--gold)" }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", fontFamily: "monospace", direction: "ltr" }}>{value}</div>
    </div>
  );
}

function Btn({ onClick, icon, label, highlight }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "11px 8px", borderRadius: 10,
        background: highlight ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "#FFFFFF",
        border: highlight ? "none" : "1.5px solid var(--border)",
        color: highlight ? "#FFFFFF" : "var(--text)",
        cursor: "pointer", fontFamily: "inherit",
        fontSize: 12, fontWeight: 900,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        boxShadow: highlight ? "0 4px 12px rgba(201, 149, 13, 0.25)" : "none",
        transition: "all 0.15s"
      }}>
      {icon} {label}
    </button>
  );
}
