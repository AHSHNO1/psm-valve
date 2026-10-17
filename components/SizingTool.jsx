"use client";
import { useState, useEffect, useMemo, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, AlertTriangle, CheckCircle2, Activity, Wind,
  Gauge, BarChart3, Zap, Droplets, Flame, ChevronDown,
  ArrowLeft, Save, Trash2, Printer, X, Layers,
  Share2, RotateCcw, Copy, Check, HelpCircle, Sparkles,
  Info, Wand2, Globe2, Award, Camera, FlaskConical,
  LineChart, FileText, ClipboardList, Package, Star,
  Undo2
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
import {
  ValveCharacteristicChart, TipsAndStandards, AlternativeSizes,
  InstalledChart, DeltaPChart
} from "./SizingCharts";
import SizingWizard from "./SizingWizard";
import SizingCompare from "./SizingCompare";
import SizingReportModal from "./SizingReportModal";
import MaterialGuide from "./MaterialGuide";
import FluidPicker from "./FluidPicker";
import { suggestValves, selectCatalogValve } from "@/lib/valve-catalog";
import { SYSTEMS, formToSI, formFromSI, tempToC } from "@/lib/unit-system";
import { track } from "@/lib/analytics";

const DEFAULT_FORM = {
  Q: null, Gf: 1, Gg: 0.65, P1: null, P2: null, T: null,
  Pv: 0.5, Pc: 221, Z: 1, k: 1.4, xT: 0.7, FL: 0.9, W: null, pipeDn: null
};

function getRecommendedCharacteristic(fluid, openingPercent) {
  if (fluid === "gas" || fluid === "steam") return "equal";
  if (fluid === "liquid") {
    if (openingPercent > 70) return "linear";
    return "equal";
  }
  return "equal";
}

function validateForm(form, fluid, locale, unitSystem) {
  const errors = {};
  const isFa = locale === "fa";
  const invalidPositive = (value) =>
    !Number.isFinite(value) || value <= 0;
  const optionalInvalidPositive = (value) =>
    value != null && invalidPositive(value);

  if (fluid === "steam") {
    if (invalidPositive(form.W)) errors.W = isFa ? "دبی بخار باید عددی بزرگتر از صفر باشد" : "Steam flow must be a number greater than 0";
  } else {
    if (invalidPositive(form.Q)) errors.Q = isFa ? "دبی باید عددی بزرگتر از صفر باشد" : "Flow must be a number greater than 0";
  }

  if (invalidPositive(form.P1)) errors.P1 = isFa ? "فشار ورودی باید عددی مثبت باشد" : "P1 must be a positive number";
  if (!Number.isFinite(form.P2) || form.P2 < 0) errors.P2 = isFa ? "فشار خروجی باید عددی نامنفی باشد" : "P2 must be a non-negative number";
  if (Number.isFinite(form.P1) && Number.isFinite(form.P2) && form.P1 <= form.P2) {
    errors.P2 = isFa ? "فشار ورودی باید بیشتر از خروجی باشد" : "P1 must be > P2";
  }

  if (fluid === "liquid") {
    if (invalidPositive(form.Gf)) errors.Gf = isFa ? "چگالی نسبی باید عددی مثبت باشد" : "Gf must be a positive number";
    if (form.Pv != null && (!Number.isFinite(form.Pv) || form.Pv < 0)) {
      errors.Pv = isFa ? "فشار بخار باید عددی نامنفی باشد" : "Pv must be a non-negative number";
    }
    if (Number.isFinite(form.Pv) && Number.isFinite(form.P1) && form.Pv >= form.P1) {
      errors.Pv = isFa ? "فشار بخار باید کمتر از P1 باشد" : "Pv must be < P1";
    }
    if (optionalInvalidPositive(form.Pc)) errors.Pc = isFa ? "فشار بحرانی باید عددی مثبت باشد" : "Pc must be a positive number";
    if (form.FL != null && (!Number.isFinite(form.FL) || form.FL <= 0 || form.FL > 1)) {
      errors.FL = isFa ? "ضریب FL باید بیشتر از صفر و حداکثر ۱ باشد" : "FL must be greater than 0 and at most 1";
    }
  }

  if (fluid === "gas") {
    if (invalidPositive(form.Gg)) errors.Gg = isFa ? "چگالی گاز باید عددی مثبت باشد" : "Gg must be a positive number";
    if (invalidPositive(form.Z)) errors.Z = isFa ? "ضریب Z باید عددی مثبت باشد" : "Z must be a positive number";
    if (invalidPositive(form.k)) errors.k = isFa ? "نسبت گرمای ویژه باید عددی مثبت باشد" : "k must be a positive number";
    if (invalidPositive(form.xT)) errors.xT = isFa ? "ضریب xT باید عددی مثبت باشد" : "xT must be a positive number";
  }

  if (fluid !== "liquid") {
    const temperatureC = Number.isFinite(form.T)
      ? tempToC(form.T, unitSystem === "IMPERIAL" ? "°F" : "°C")
      : null;
    if (temperatureC == null || temperatureC < -200 || temperatureC > 800) {
      errors.T = isFa
        ? "دما باید بین ۲۰۰- و ۸۰۰ درجهٔ سلسیوس باشد"
        : "T must be between -200 and 800 °C";
    }
  }

  if (optionalInvalidPositive(form.pipeDn)) {
    errors.pipeDn = isFa ? "سایز لوله باید عددی مثبت باشد" : "Pipe size must be a positive number";
  } else if (form.pipeDn != null && (form.pipeDn < 15 || form.pipeDn > 2000)) {
    errors.pipeDn = isFa ? "سایز لوله باید بین DN15 و DN2000 باشد" : "Pipe size must be between DN15 and DN2000";
  }

  return errors;
}

const FIELD_HELP = {
  fa: {
    Q: "دبی حجمی سیال — مایع: m³/h، گاز: Nm³/h",
    W: "دبی جرمی بخار بر حسب kg/h",
    Gf: "چگالی نسبی مایع نسبت به آب (آب = ۱)",
    Gg: "چگالی نسبی گاز نسبت به هوا (هوا = ۱)",
    P1: "فشار مطلق ورودی شیر (bar)",
    P2: "فشار مطلق خروجی شیر (bar)",
    Pv: "فشار بخار مایع در دمای کار — برای تشخیص کاویتاسیون",
    Pc: "فشار بحرانی سیال — برای محاسبه دقیق‌تر",
    FL: "ضریب بازیابی فشار شیر (معمولاً ۰.۹)",
    T: "دمای سیال بر حسب سلسیوس",
    Z: "ضریب تراکم‌پذیری گاز (گاز ایده‌آل = ۱)",
    k: "نسبت گرمای ویژه Cp/Cv (هوا = ۱.۴)",
    xT: "ضریب افت فشار بحرانی (معمولاً ۰.۷)",
    pipeDn: "قطر اسمی لولهٔ ورودی/خروجی (DN). اگر شیر از لوله کوچک‌تر باشد، ضریب هندسهٔ اتصالات Fp روی Cv اعمال می‌شود."
  },
  en: {
    Q: "Volumetric flow — liquid: m³/h, gas: Nm³/h",
    W: "Steam mass flow in kg/h",
    Gf: "Liquid specific gravity relative to water",
    Gg: "Gas specific gravity relative to air",
    P1: "Absolute inlet pressure (bar)",
    P2: "Absolute outlet pressure (bar)",
    Pv: "Vapor pressure of liquid at operating temperature",
    Pc: "Critical pressure of fluid",
    FL: "Valve pressure recovery factor (≈0.9)",
    T: "Fluid temperature in °C",
    Z: "Gas compressibility factor (ideal gas = 1)",
    k: "Specific heat ratio Cp/Cv (air = 1.4)",
    xT: "Choked pressure drop ratio (typically 0.7)",
    pipeDn: "Nominal inlet/outlet pipe size (DN). When the valve is smaller than the pipe, the piping geometry factor Fp is applied to Cv."
  },
  ar: { Q: "التدفق", W: "تدفق البخار", Gf: "الكثافة", Gg: "كثافة الغاز", P1: "الدخول", P2: "الخروج", Pv: "ضغط البخار", Pc: "الضغط الحرج", FL: "معامل الاسترداد", T: "الحرارة", Z: "الانضغاط", k: "الحرارة النوعية", xT: "الانسداد", pipeDn: "قطر الأنبوب (DN)؛ إذا كان الصمام أصغر يُطبَّق Fp." },
  ru: { Q: "Расход", W: "Расход пара", Gf: "Плотность", Gg: "Плотность газа", P1: "Вход", P2: "Выход", Pv: "Давление паров", Pc: "Крит. давление", FL: "Коэффициент", T: "Температура", Z: "Сжимаемость", k: "Показатель", xT: "Запирание", pipeDn: "Диаметр трубы (DN); если клапан меньше, применяется Fp." }
};

function Field({ label, unit, value, onChange, step, help, error, placeholder, required }) {
  const [showHelp, setShowHelp] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();
  const isError = !!error;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <label htmlFor={inputId} style={{ fontSize: 11, fontWeight: 900, color: isError ? "#E81123" : "var(--text-muted)" }}>
            {label}
            {required && <span aria-hidden="true" style={{ color: "#E0A81A", marginInlineStart: 3 }}>*</span>}
          </label>
          {help && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              onMouseEnter={() => setShowHelp(true)}
              onMouseLeave={() => setShowHelp(false)}
              onFocus={() => setShowHelp(true)}
              onBlur={() => setShowHelp(false)}
              aria-label={label + " — " + help}
              aria-expanded={showHelp}
              aria-controls={helpId}
              style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "1px solid var(--border)", cursor: "help",
                background: "var(--bg-soft)", color: "var(--text-muted)",
                display: "grid", placeItems: "center", padding: 0
              }}
            >
              <HelpCircle size={11} />
            </button>
          )}
        </div>
        {unit && (
          <span style={{
            fontSize: 10, color: isError ? "#E81123" : "var(--text-soft)", fontFamily: "monospace",
            fontWeight: 800, padding: "2px 7px", borderRadius: 5,
            background: isError ? "rgba(232,17,35,0.08)" : "var(--bg-soft)",
            border: "1px solid var(--border)", whiteSpace: "nowrap"
          }}>{unit}</span>
        )}
      </div>
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        step={step || 1}
        value={value == null ? "" : value}
        placeholder={placeholder || ""}
        onChange={onChange}
        aria-invalid={isError}
        aria-required={required || undefined}
        required={required || undefined}
        aria-describedby={[isError ? errorId : null, showHelp && help ? helpId : null].filter(Boolean).join(" ") || undefined}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 9,
          border: "1.5px solid " + (isError ? "#E81123" : "var(--border)"),
          background: isError ? "rgba(232,17,35,0.06)" : "var(--bg-soft)",
          color: isError ? "#E81123" : "var(--text)",
          fontFamily: "monospace", fontSize: 13.5, fontWeight: 700,
          transition: "all 0.2s"
        }}
        onFocus={e => {
          if (!isError) {
            e.target.style.borderColor = "var(--gold)";
            e.target.style.background = "var(--bg-card)";
            e.target.style.boxShadow = "0 0 0 3px var(--glow)";
          }
        }}
        onBlur={e => {
          if (!isError) {
            e.target.style.borderColor = "var(--border)";
            e.target.style.background = "var(--bg-soft)";
            e.target.style.boxShadow = "none";
          }
        }}
      />
      {isError && (
        <div id={errorId} role="alert" style={{
          display: "flex", alignItems: "center", gap: 4,
          marginTop: 4, fontSize: 10, fontWeight: 800, color: "#E81123"
        }}>
          <AlertTriangle size={10} /> {error}
        </div>
      )}
      <AnimatePresence>
        {showHelp && help && !isError && (
          <motion.div
            id={helpId}
            role="note"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              position: "absolute", top: "100%", right: 0, left: 0,
              marginTop: 6, padding: "8px 11px", borderRadius: 9,
              background: "var(--bg)", color: "var(--text)",
              border: "1px solid var(--border-strong)",
              fontSize: 10.5, fontWeight: 600, lineHeight: 1.6,
              zIndex: 30, boxShadow: "var(--shadow-md)"
            }}
          >
            {help}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SizingTool({ catalog = [], cvTables = {} }) {
  const { locale } = useDictionary();
  const [fluid, setFluid] = useState("liquid");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [autoCalc, setAutoCalc] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [unitSystem, setUnitSystem] = useState("SI");
  const [wizardMode, setWizardMode] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFluidPicker, setShowFluidPicker] = useState(false);
  const [selectedFluidName, setSelectedFluidName] = useState(null);
  const [mobileTab, setMobileTab] = useState("form");
  const [referenceTab, setReferenceTab] = useState("reference");
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [showUndo, setShowUndo] = useState(false);

  const help = FIELD_HELP[locale] || FIELD_HELP.en;
  // فیلدهای بی‌بعد مثل Gf، Z، FL و xT واحد فیزیکی ندارند؛ برچسب «نسبت» گویاتر از «—» است.
  const ratioUnit = { fa: "نسبت", en: "ratio", ar: "نسبة", ru: "отн." }[locale] || "ratio";
  const sys = SYSTEMS[unitSystem];
  const isFa = locale === "fa";

  const errors = useMemo(() => validateForm(form, fluid, locale, unitSystem), [form, fluid, locale, unitSystem]);
  const hasErrors = Object.keys(errors).length > 0;

  const topProduct = useMemo(() => {
    if (!result || !result.Cv) return null;

    const fromCatalog = selectCatalogValve(result.Cv, catalog, cvTables);
    if (fromCatalog) {
      return {
        product: fromCatalog.product,
        matchedSize: { dn: fromCatalog.dn, cv: fromCatalog.cv, size: fromCatalog.dn },
        openingPercent: fromCatalog.openingPercent,
        source: "catalog"
      };
    }

    if (!result.size) return null;
    const sizeIn = parseFloat(String(result.size.size).replace(/[^0-9.]/g, ""));
    const match = suggestValves(catalog, sizeIn, { limit: 1 })[0];
    if (!match) return null;
    return {
      product: match,
      matchedSize: result.size,
      openingPercent: result.openingPercent,
      source: "generic"
    };
  }, [result, catalog, cvTables]);

  useEffect(() => { setSaved(loadScenarios()); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedData = localStorage.getItem("psm_sizing_form");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.form) setForm(Object.assign({}, DEFAULT_FORM, parsed.form));
        if (parsed.fluid) setFluid(parsed.fluid);
        if (parsed.unitSystem) setUnitSystem(parsed.unitSystem);
        if (parsed.selectedFluidName) setSelectedFluidName(parsed.selectedFluidName);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("psm_sizing_form", JSON.stringify({
          form, fluid, unitSystem, selectedFluidName
        }));
      } catch (e) {}
    }, 500);
    return () => clearTimeout(t);
  }, [form, fluid, unitSystem, selectedFluidName]);

  useEffect(() => {
    if (!autoCalc || !hasInteracted || hasErrors) return;
    const t = setTimeout(() => { runCalculation(false); }, 400);
    return () => clearTimeout(t);
  }, [form, fluid, autoCalc, hasInteracted, hasErrors]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (showCompare) setShowCompare(false);
        if (showFluidPicker) setShowFluidPicker(false);
        if (showReport) setShowReport(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCompare, showFluidPicker, showReport]);

  function runCalculation() {
    if (hasErrors) return;
    const siForm = formToSI(form, unitSystem, fluid);
    let r;
    if (fluid === "liquid") {
      r = calcLiquidCv({ Q: siForm.Q, Gf: siForm.Gf, P1: siForm.P1, P2: siForm.P2, Pv: siForm.Pv, Pc: siForm.Pc, FL: siForm.FL, pipeDnMm: form.pipeDn });
    } else if (fluid === "steam") {
      r = calcSteamCv({ W: siForm.W, P1: siForm.P1, P2: siForm.P2, T: siForm.T, pipeDnMm: form.pipeDn });
    } else {
      r = calcGasCv({ Q: siForm.Q, Gg: siForm.Gg, T: siForm.T, P1: siForm.P1, P2: siForm.P2, Z: siForm.Z, k: siForm.k, xT: siForm.xT, pipeDnMm: form.pipeDn });
    }
    if (r.error) { setResult({ error: r.error }); return; }
    const openingPercent = Math.min(100, Math.round((r.Cv / r.size.cv) * 100));
    const warnings = getRecommendation(openingPercent, r.choked, r.cavitationRisk, r.capacityExceeded);
    const recCharacteristic = getRecommendedCharacteristic(fluid, openingPercent);
    setResult(Object.assign({}, r, {
      openingPercent, warnings, fluidType: fluid,
      recommendedCharacteristic: recCharacteristic,
      timestamp: Date.now(),
      formSI: siForm
    }));
    setShowMore(false);
    track.calculationDone({
      fluid,
      cv: r.Cv,
      size: r.size.size,
      opening: openingPercent,
      choked: !!r.choked
    });
  }

  function update(k) {
    return (e) => {
      const raw = e.target.value;
      if (raw === "") {
        setForm(Object.assign({}, form, { [k]: null }));
      } else {
        const v = parseFloat(raw);
        setForm(Object.assign({}, form, { [k]: isNaN(v) ? null : v }));
      }
      setHasInteracted(true);
    };
  }

  function applyPreset(preset) {
    setFluid(preset.fluid);
    setForm(Object.assign({}, DEFAULT_FORM, preset.values));
    setResult(null);
    setHasInteracted(true);
    setSelectedFluidName(null);
    track.presetUsed({ preset: preset.id, fluid: preset.fluid });
  }

  function applyFluidPreset(key) {
    const p = FLUID_PRESETS[key];
    if (!p) return;
    setForm(Object.assign({}, form, { Gf: p.Gf, Pv: p.Pv, Pc: p.Pc }));
    setHasInteracted(true);
  }

  function handleFluidPick(pickedFluid) {
    setSelectedFluidName(pickedFluid.names[locale] || pickedFluid.names.en);
    if (pickedFluid.type !== fluid) setFluid(pickedFluid.type);
    const updates = {};
    if (pickedFluid.type === "liquid") {
      if (pickedFluid.Gf != null) updates.Gf = pickedFluid.Gf;
      if (pickedFluid.Pv != null) updates.Pv = pickedFluid.Pv;
      if (pickedFluid.Pc != null) updates.Pc = pickedFluid.Pc;
    } else if (pickedFluid.type === "gas") {
      if (pickedFluid.Gg != null) updates.Gg = pickedFluid.Gg;
      if (pickedFluid.k != null) updates.k = pickedFluid.k;
      if (pickedFluid.Z != null) updates.Z = pickedFluid.Z;
    } else if (pickedFluid.type === "steam") {
      if (pickedFluid.k != null) updates.k = pickedFluid.k;
    }
    setForm(Object.assign({}, form, updates));
    setHasInteracted(true);
    track.fluidPicked({ fluid: pickedFluid.id, type: pickedFluid.type });
  }

  function switchUnitSystem(newSys) {
    if (newSys === unitSystem) return;
    const siForm = formToSI(form, unitSystem, fluid);
    const newForm = formFromSI(siForm, newSys, fluid);
    setForm(newForm);
    setUnitSystem(newSys);
    setResult(null);
    track.unitToggled(newSys);
  }

  function handleReset() {
    if (!hasInteracted) return;
    const snapshot = {
      form: Object.assign({}, form),
      fluid,
      selectedFluidName,
      result
    };
    setForm(DEFAULT_FORM);
    setResult(null);
    setFluid("liquid");
    setSelectedFluidName(null);
    setHasInteracted(false);
    setUndoSnapshot(snapshot);
    setShowUndo(true);
    setTimeout(() => {
      setShowUndo(false);
      setUndoSnapshot(null);
    }, 6000);
    try { localStorage.removeItem("psm_sizing_form"); } catch (e) {}
  }

  function handleUndo() {
    if (!undoSnapshot) return;
    setForm(undoSnapshot.form);
    setFluid(undoSnapshot.fluid);
    setSelectedFluidName(undoSnapshot.selectedFluidName);
    setResult(undoSnapshot.result);
    setHasInteracted(true);
    setShowUndo(false);
    setUndoSnapshot(null);
  }

  function handleSave() {
    if (!result || !scenarioName.trim()) return;
    const item = {
      id: "sc-" + Date.now(),
      name: scenarioName.trim(),
      fluid,
      form: Object.assign({}, form),
      result
    };
    setSaved(saveScenario(item));
    setScenarioName("");
    setShowSaveDialog(false);
    track.scenarioSaved();
  }

  function handleRemove(id) { setSaved(removeScenario(id)); }

  function handleClearAll() {
    if (!confirm(isFa ? "همه سناریوها حذف شوند؟" : "Clear all scenarios?")) return;
    clearScenarios();
    setSaved([]);
  }

  function shareLink() {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams();
      params.set("fluid", fluid);
      params.set("unitSystem", unitSystem);
      Object.keys(form).forEach(k => {
        if (form[k] != null) params.set(k, String(form[k]));
      });
      const url = window.location.origin + window.location.pathname + "?" + params.toString();
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch (e) {}
  }

  const completion = useMemo(() => {
    const required = fluid === "steam" ? ["W", "P1", "P2"] : ["Q", "P1", "P2"];
    const filled = required.filter(k => form[k] && form[k] > 0);
    return Math.round((filled.length / required.length) * 100);
  }, [form, fluid]);

  const dP = (form.P1 != null && form.P2 != null) ? +(form.P1 - form.P2).toFixed(2) : 0;

  const L = {
    fa: {
      title: "سایزینگ شیر کنترلی",
      subtitle: "برآورد اولیه Cv/Kv",
      engineeringDisclaimer: "این نتیجه برآورد اولیه است، نه محاسبه تأییدشده ISA-75.01.01 (IEC 60534-2-1)؛ انتخاب نهایی را با مهندس شیر کنترل یا سازنده بررسی کنید.",
      capacityExceeded: "Cv موردنیاز از ظرفیت بزرگ‌ترین سایز فهرست‌شده بیشتر است؛ برای انتخاب سایز با مهندس شیر کنترل مشورت کنید.",
      liquid: "مایع", gas: "گاز", steam: "بخار",
      presets: "سناریوهای آماده", presetsHint: "با یک کلیک، فرم پر می‌شود",
      operatingPoint: "نقطه کاری", advanced: "تنظیمات پیشرفته",
      calculate: "محاسبه", reset: "بازنشانی", undo: "بازگردانی",
      cv: "ضریب Cv", size: "سایز پیشنهادی", opening: "بازشدگی",
      velocity: "سرعت", noise: "نویز", cav: "کاویتاسیون",
      low: "کم", medium: "متوسط", high: "بالا", flashing: "فلاشینگ",
      choked: "جریان Choked",
      more: "نمودارهای تخصصی", less: "بستن",
      save: "ذخیره", share: "اشتراک",
      compare: "مقایسه", report: "گزارش",
      reqQuote: "درخواست قیمت",
      saveDialog: "نام سناریو", confirm: "ذخیره", cancel: "انصراف",
      savedList: "سناریوهای ذخیره‌شده", removeAll: "حذف همه",
      formTab: "فرم", resultTab: "نتیجه",
      liveMode: "محاسبه زنده", liveOn: "روشن", liveOff: "خاموش",
      deltaP: "افت فشار (ΔP)",
      completion: "تکمیل فرم",
      wizardBtn: "حالت ساده",
      unitSI: "متریک", unitImperial: "اینچی",
      errorsTitle: "خطا در ورودی‌ها",
      errorsHint: "لطفاً مقادیر قرمز را اصلاح کنید",
      pickFluid: "انتخاب سیال",
      selectedFluid: "سیال انتخاب‌شده",
      resultEmptyTitle: "آماده محاسبه",
      resultEmptyDesc: "فرم را پر کنید تا نتیجه زنده نمایش داده شود",
      resultEmptyHint: "یا از سناریوهای آماده استفاده کنید",
      product: "محصول پیشنهادی PSM",
      productDataNote: "نام و سری از کاتالوگ PSM انتخاب شده است. Cv این سایز از جدول عمومی محاسبه شده؛ Cv کاتالوگی هر سری در حال تکمیل است و انتخاب نهایی باید با مهندسی PSM تأیید شود.",
      productSourceCatalog: "Cv کاتالوگ",
      productSourceGeneric: "Cv عمومی",
      productNoteCatalog: "سایز از جدول Cv ثبت‌شدهٔ همین سری انتخاب شده است؛ انتخاب نهایی را با مهندسی PSM تأیید کنید.",
      productHint: "بر اساس Cv محاسبه‌شده",
      noProduct: "محصولی برای این Cv یافت نشد",
      viewProduct: "مشاهده محصولات",
      refTitle: "مراجع فنی",
      refStandards: "استانداردها و توصیه‌ها",
      refMaterial: "راهنمای متریال",
      refCharts: "نمودارهای پیشرفته",
      lastCalc: "آخرین محاسبه",
      config: "تنظیمات"
    },
    en: {
      title: "Control Valve Sizing",
      subtitle: "Preliminary Cv/Kv estimate",
      engineeringDisclaimer: "This is a preliminary estimate, not a validated ISA-75.01.01 (IEC 60534-2-1) calculation. Confirm final valve selection with a control-valve engineer or manufacturer.",
      capacityExceeded: "Required Cv exceeds the largest listed valve size. Consult a control-valve engineer for selection.",
      liquid: "Liquid", gas: "Gas", steam: "Steam",
      presets: "Preset Scenarios", presetsHint: "One click to fill the form",
      operatingPoint: "Operating Point", advanced: "Advanced Settings",
      calculate: "Calculate", reset: "Reset", undo: "Undo",
      cv: "Cv Factor", size: "Recommended Size", opening: "Opening",
      velocity: "Velocity", noise: "Noise", cav: "Cavitation",
      low: "Low", medium: "Medium", high: "High", flashing: "Flashing",
      choked: "Choked Flow", more: "Advanced charts", less: "Hide",
      save: "Save", share: "Share",
      compare: "Compare", report: "Report",
      reqQuote: "Request Quote",
      saveDialog: "Scenario name", confirm: "Save", cancel: "Cancel",
      savedList: "Saved Scenarios", removeAll: "Clear all",
      formTab: "Form", resultTab: "Result",
      liveMode: "Live calc", liveOn: "ON", liveOff: "OFF",
      deltaP: "Pressure drop (ΔP)", completion: "Completion",
      wizardBtn: "Simple Mode",
      unitSI: "Metric", unitImperial: "Imperial",
      errorsTitle: "Invalid Inputs",
      errorsHint: "Please fix the red fields",
      pickFluid: "Pick Fluid", selectedFluid: "Selected Fluid",
      resultEmptyTitle: "Ready to calculate",
      resultEmptyDesc: "Fill the form to see live results",
      resultEmptyHint: "or use a preset scenario",
      product: "Suggested PSM Product",
      productDataNote: "The name and series come from the PSM catalogue. The Cv belongs to the general size table; per-series catalogue Cv is still being completed, so the final selection must be confirmed with PSM engineering.",
      productSourceCatalog: "Catalogue Cv",
      productSourceGeneric: "General Cv",
      productNoteCatalog: "This size comes from the recorded Cv table of this series; confirm the final selection with PSM engineering.",
      productHint: "Based on your calculated Cv",
      noProduct: "No matching product for this Cv",
      viewProduct: "View Products",
      refTitle: "Technical References",
      refStandards: "Standards & Tips",
      refMaterial: "Material Guide",
      refCharts: "Advanced Charts",
      lastCalc: "Last calculation",
      config: "Settings"
    },
    ar: {
      title: "تحديد حجم الصمام", subtitle: "تقدير أولي لـ Cv/Kv",
      engineeringDisclaimer: "هذا تقدير أولي وليس حسابًا معتمدًا وفق ISA-75.01.01 (IEC 60534-2-1). يجب تأكيد الاختيار النهائي مع مهندس صمامات التحكم أو الشركة المصنّعة.",
      capacityExceeded: "يتجاوز Cv المطلوب أكبر حجم مدرج؛ استشر مهندس صمامات التحكم لاختيار الحجم المناسب.",
      liquid: "سائل", gas: "غاز", steam: "بخار",
      presets: "سيناريوهات", presetsHint: "بنقرة واحدة",
      operatingPoint: "نقطة التشغيل", advanced: "متقدم",
      calculate: "احسب", reset: "إعادة", undo: "تراجع",
      cv: "Cv", size: "الحجم", opening: "الفتح",
      velocity: "السرعة", noise: "الضجيج", cav: "التجويف",
      low: "منخفض", medium: "متوسط", high: "عالي", flashing: "وميض",
      choked: "مختنق", more: "الرسوم", less: "إخفاء",
      save: "حفظ", share: "مشاركة", compare: "مقارنة", report: "تقرير",
      reqQuote: "طلب سعر", saveDialog: "الاسم", confirm: "حفظ", cancel: "إلغاء",
      savedList: "السيناريوهات", removeAll: "حذف",
      formTab: "النموذج", resultTab: "النتيجة",
      liveMode: "حي", liveOn: "مفعّل", liveOff: "معطّل",
      deltaP: "ΔP", completion: "الاكتمال",
      wizardBtn: "بسيط", unitSI: "متري", unitImperial: "إمبراطوري",
      errorsTitle: "أخطاء", errorsHint: "صحح الحقول الحمراء",
      pickFluid: "اختر السائل", selectedFluid: "المختار",
      resultEmptyTitle: "جاهز", resultEmptyDesc: "املأ النموذج",
      resultEmptyHint: "أو اختر سيناريو",
      product: "منتج مقترح", productHint: "بناءً على Cv",
      productDataNote: "الاسم والسلسلة من كتالوج PSM. قيمة Cv من الجدول العام؛ جدول Cv الخاص بكل سلسلة قيد الإكمال ويجب تأكيد الاختيار النهائي مع مهندسي PSM.",
      productSourceCatalog: "Cv الكتالوج",
      productSourceGeneric: "Cv العام",
      productNoteCatalog: "الحجم مأخوذ من جدول Cv المسجل لهذه السلسلة؛ أكد الاختيار النهائي مع مهندسي PSM.",
      noProduct: "لا يوجد", viewProduct: "عرض",
      refTitle: "المراجع", refStandards: "المعايير",
      refMaterial: "المواد", refCharts: "الرسوم",
      lastCalc: "آخر حساب", config: "إعدادات"
    },
    ru: {
      title: "Подбор клапана", subtitle: "Предварительная оценка Cv/Kv",
      engineeringDisclaimer: "Это предварительная оценка, а не подтвержденный расчет по ISA-75.01.01 (IEC 60534-2-1). Окончательный выбор следует согласовать с инженером по регулирующим клапанам или производителем.",
      capacityExceeded: "Требуемый Cv превышает максимальную пропускную способность в списке. Обратитесь к инженеру для подбора.",
      liquid: "Жидкость", gas: "Газ", steam: "Пар",
      presets: "Сценарии", presetsHint: "Один клик",
      operatingPoint: "Рабочая точка", advanced: "Дополнительно",
      calculate: "Рассчитать", reset: "Сброс", undo: "Отменить",
      cv: "Cv", size: "Размер", opening: "Открытие",
      velocity: "Скорость", noise: "Шум", cav: "Кавитация",
      low: "Низкий", medium: "Средний", high: "Высокий", flashing: "Вспышка",
      choked: "Крит", more: "Графики", less: "Скрыть",
      save: "Сохранить", share: "Поделиться", compare: "Сравнить", report: "Отчет",
      reqQuote: "Запросить", saveDialog: "Имя", confirm: "OK", cancel: "Отмена",
      savedList: "Сохраненные", removeAll: "Очистить",
      formTab: "Форма", resultTab: "Результат",
      liveMode: "Live", liveOn: "ВКЛ", liveOff: "ВЫКЛ",
      deltaP: "ΔP", completion: "Заполнено",
      wizardBtn: "Простой", unitSI: "Метрика", unitImperial: "Имперская",
      errorsTitle: "Ошибки", errorsHint: "Исправьте красные поля",
      pickFluid: "Выбрать среду", selectedFluid: "Выбрано",
      resultEmptyTitle: "Готово", resultEmptyDesc: "Заполните форму",
      resultEmptyHint: "или выберите сценарий",
      product: "Продукт", productHint: "По Cv",
      productDataNote: "Название и серия взяты из каталога PSM. Cv относится к общей таблице; каталожные Cv по сериям ещё заполняются, окончательный выбор подтверждает инженер PSM.",
      productSourceCatalog: "Cv каталога",
      productSourceGeneric: "Общий Cv",
      productNoteCatalog: "Размер выбран по записанной таблице Cv этой серии; окончательный выбор подтверждает инженер PSM.",
      noProduct: "Нет", viewProduct: "Смотреть",
      refTitle: "Справочники", refStandards: "Стандарты",
      refMaterial: "Материалы", refCharts: "Графики",
      lastCalc: "Последний", config: "Настройки"
    }
  }[locale] || {};

  const REF_TABS = [
    { id: "reference", icon: Info, label: L.refStandards },
    { id: "material", icon: FlaskConical, label: L.refMaterial },
    { id: "charts", icon: BarChart3, label: L.refCharts }
  ];

  if (wizardMode) {
    return (
      <section className="container-x py-6 sizing-root">
        <SizingWizard
          locale={locale}
          form={form}
          fluid={fluid}
          setForm={setForm}
          setFluid={setFluid}
          onCalculate={() => {
            setWizardMode(false);
            setTimeout(() => { runCalculation(true); setHasInteracted(true); }, 300);
          }}
          onCancel={() => setWizardMode(false)}
        />
      </section>
    );
  }

  return (
    <section className="container-x py-6 sizing-root">
      {/* ============ TOOLBAR ============ */}
      <div className="sizing-toolbar no-print">
        <button
          onClick={() => { setWizardMode(true); track.wizardOpened(); }}
          className="tb-btn tb-wizard"
        >
          <Wand2 size={14} />
          <span>{L.wizardBtn}</span>
        </button>

        <div className="tb-center">
          <button
            onClick={() => setAutoCalc(!autoCalc)}
            className={"tb-live" + (autoCalc ? " on" : "")}
          >
            <span className={"tb-live-dot" + (autoCalc && hasInteracted && !hasErrors ? " pulse" : "")} />
            <span>{L.liveMode}</span>
            <span className="tb-live-state">{autoCalc ? L.liveOn : L.liveOff}</span>
          </button>

          <div className="tb-unit">
            <button onClick={() => switchUnitSystem("SI")} className={unitSystem === "SI" ? "active" : ""}>
              {L.unitSI}
            </button>
            <button onClick={() => switchUnitSystem("IMPERIAL")} className={unitSystem === "IMPERIAL" ? "active" : ""}>
              {L.unitImperial}
            </button>
          </div>
        </div>

        <button onClick={handleReset} className="tb-btn tb-reset" title={L.reset}>
          <RotateCcw size={14} />
        </button>
      </div>

      {/* ============ MOBILE TABS ============ */}
      <div className="sizing-mobile-tabs no-print">
        <button onClick={() => setMobileTab("form")} className={mobileTab === "form" ? "active" : ""}>
          📝 {L.formTab}
        </button>
        <button onClick={() => setMobileTab("result")} className={mobileTab === "result" ? "active" : ""}>
          📊 {L.resultTab}
          {result && !result.error && <span className="mobile-tab-dot" />}
        </button>
      </div>

      {/* ============ MAIN 2-COLUMN GRID ============ */}
      <div className="sizing-main-grid">
        {/* ===== LEFT: FORM ===== */}
        <div className={"sizing-form-column" + (mobileTab === "form" ? " mobile-show" : "")}>

          {/* Fluid Picker */}
          <div className="sizing-card">
            <div className="card-head">
              <FlaskConical size={15} color="var(--gold)" />
              <span className="card-head-text">{L.pickFluid}</span>
            </div>

            <button onClick={() => setShowFluidPicker(true)} className="fluid-pick-btn">
              <div className="fluid-pick-icon">
                <FlaskConical size={17} />
              </div>
              <div className="fluid-pick-text">
                <div className="fluid-pick-label">{L.selectedFluid}</div>
                <div className="fluid-pick-value">
                  {selectedFluidName || (isFa ? "کلیک کنید — ۳۵ سیال" : "Click — 35 fluids")}
                </div>
              </div>
              <ArrowLeft size={14} color="var(--gold)" style={{ transform: "rotate(180deg)" }} />
            </button>

            <div className="fluid-type-chips">
              {[
                { id: "liquid", icon: Droplets, label: L.liquid },
                { id: "gas", icon: Wind, label: L.gas },
                { id: "steam", icon: Flame, label: L.steam }
              ].map(f => {
                const Icon = f.icon;
                const active = fluid === f.id;
                return (
                  <button key={f.id}
                    onClick={() => { setFluid(f.id); setHasInteracted(true); setSelectedFluidName(null); }}
                    className={active ? "active" : ""}
                  >
                    <Icon size={13} /> {f.label}
                  </button>
                );
              })}
            </div>

            {fluid === "liquid" && (
              <div className="fluid-presets">
                {Object.keys(FLUID_PRESETS).map(k => (
                  <button key={k} onClick={() => applyFluidPreset(k)} className="preset-chip">
                    {FLUID_PRESETS[k].name[locale] || FLUID_PRESETS[k].name.en}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="sizing-card">
            <div className="card-head">
              <Sparkles size={14} color="var(--gold)" />
              <span className="card-head-text">{L.presets}</span>
              <span className="card-head-hint">{L.presetsHint}</span>
            </div>
            <div className="presets-grid">
              {PRESET_SCENARIOS.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)}
                  className="preset-btn"
                  style={{ "--preset-color": p.color }}
                >
                  <div className="preset-icon" style={{ background: p.color + "15" }}>
                    {p.icon}
                  </div>
                  <div className="preset-name">{p.name[locale] || p.name.en}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="sizing-card">
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)" }}>{L.completion}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: completion === 100 ? "#10B981" : "var(--gold)" }}>{completion}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: completion + "%",
                  background: completion === 100 ? "linear-gradient(90deg, #10B981, #059669)" : "linear-gradient(135deg, #E0A81A, #B8850A)"
                }} />
              </div>
            </div>

            <div className="card-head" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
              <span className="card-head-text">{L.operatingPoint}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {fluid === "steam" ? (
                <Field label="W" unit={sys.flowSteam} value={form.W} onChange={update("W")} help={help.W} error={errors.W} placeholder="500" required />
              ) : (
                <Field label="Q" unit={fluid === "liquid" ? sys.flowLiquid : sys.flowGas} value={form.Q} onChange={update("Q")} help={help.Q} error={errors.Q} placeholder="100" required />
              )}
              {fluid === "liquid" && <Field label="Gf" unit={ratioUnit} value={form.Gf} onChange={update("Gf")} step={0.01} help={help.Gf} error={errors.Gf} placeholder="1.0" />}
              {fluid === "gas" && <Field label="Gg" unit={ratioUnit} value={form.Gg} onChange={update("Gg")} step={0.01} help={help.Gg} error={errors.Gg} placeholder="0.65" />}
              <Field label="P1" unit={sys.pressure} value={form.P1} onChange={update("P1")} step={0.1} help={help.P1} error={errors.P1} placeholder="10" required />
              <Field label="P2" unit={sys.pressure} value={form.P2} onChange={update("P2")} step={0.1} help={help.P2} error={errors.P2} placeholder="6" required />
              {fluid === "liquid" && <Field label="Pv" unit={sys.pressure} value={form.Pv} onChange={update("Pv")} step={0.01} help={help.Pv} error={errors.Pv} placeholder="0.5" />}
              {fluid !== "liquid" && <Field label="T" unit={sys.temp} value={form.T} onChange={update("T")} help={help.T} error={errors.T} placeholder="25" />}
              {fluid === "gas" && <Field label="Z" unit={ratioUnit} value={form.Z} onChange={update("Z")} step={0.01} help={help.Z} error={errors.Z} placeholder="1.0" />}
            </div>

            {dP > 0 && (
              <div className="dp-indicator">
                <span>{L.deltaP}</span>
                <strong>{dP} {sys.dP}</strong>
              </div>
            )}

            <button onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle">
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Zap size={12} /> {L.advanced}
              </span>
              <ChevronDown size={13} style={{ transform: showAdvanced ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {fluid === "liquid" && (
                  <>
                    <Field label="Pc" unit={sys.pressure} value={form.Pc} onChange={update("Pc")} help={help.Pc} error={errors.Pc} />
                    <Field label="FL" unit={ratioUnit} value={form.FL} onChange={update("FL")} step={0.01} help={help.FL} error={errors.FL} />
                  </>
                )}
                {fluid === "gas" && (
                  <>
                    <Field label="k" unit={ratioUnit} value={form.k} onChange={update("k")} step={0.01} help={help.k} error={errors.k} />
                    <Field label="xT" unit={ratioUnit} value={form.xT} onChange={update("xT")} step={0.01} help={help.xT} error={errors.xT} />
                  </>
                )}
                <Field label="D" unit="DN" value={form.pipeDn} onChange={update("pipeDn")} step={5} help={help.pipeDn} error={errors.pipeDn} placeholder="100" />
              </div>
            )}

            {hasErrors && (
              <div className="error-box">
                <AlertTriangle size={14} color="#E81123" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: "#E81123", marginBottom: 2 }}>
                    {L.errorsTitle}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "#E81123", opacity: 0.85 }}>
                    {L.errorsHint}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { runCalculation(); setHasInteracted(true); }}
              disabled={hasErrors}
              className="btn-gold justify-center"
              style={{
                width: "100%", marginTop: 14, padding: "13px", fontSize: 14,
                opacity: hasErrors ? 0.5 : 1,
                cursor: hasErrors ? "not-allowed" : "pointer"
              }}>
              <Calculator size={17} /> {L.calculate}
            </button>
          </div>

          {/* Saved scenarios */}
          {saved.length > 0 && (
            <div className="sizing-card" style={{ padding: 0, overflow: "hidden" }}>
              <button onClick={() => setShowSaved(!showSaved)} className="collapse-btn">
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
                  <Layers size={14} /> {L.savedList} ({saved.length})
                </span>
                <ChevronDown size={14} style={{ transform: showSaved ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--text-muted)" }} />
              </button>
              {showSaved && (
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    {saved.map(s => (
                      <div key={s.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8,
                        background: "var(--bg-soft)", border: "1px solid var(--border)"
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>{s.name}</div>
                          <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "monospace", direction: "ltr" }}>
                            Cv {s.result.Cv} · {s.result.size.size} · {s.result.openingPercent}%
                          </div>
                        </div>
                        <button onClick={() => handleRemove(s.id)}
                          style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: "rgba(232, 17, 35, 0.1)", color: "#E81123",
                            border: "none", cursor: "pointer", display: "grid", placeItems: "center"
                          }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
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

        {/* ===== RIGHT: RESULT ===== */}
        <div className={"sizing-result-column" + (mobileTab === "result" ? " mobile-show" : "")}>

          {!result || result.error ? (
            <div className="sizing-card result-empty">
              <div className="result-empty-icon">
                <Gauge size={28} />
              </div>
              <div className="result-empty-title">{L.resultEmptyTitle}</div>
              <div className="result-empty-desc">{L.resultEmptyDesc}</div>
              <div className="result-empty-hint">{L.resultEmptyHint}</div>
            </div>
          ) : (
            <>
              <div
                role="note"
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  marginBottom: 10, padding: "10px 12px", borderRadius: 10,
                  background: "rgba(201, 149, 13, 0.08)",
                  border: "1px solid var(--border)", color: "var(--text-soft)"
                }}
              >
                <Info size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--gold)" }} />
                <span style={{ fontSize: 11, lineHeight: 1.7 }}>{L.engineeringDisclaimer}</span>
              </div>
              {result.capacityExceeded && (
                <div role="alert" className="error-box" style={{ marginBottom: 10 }}>
                  <AlertTriangle size={14} color="#E81123" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, lineHeight: 1.7 }}>{L.capacityExceeded}</span>
                </div>
              )}
              <motion.div
                key={result.timestamp}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="result-hero-card"
              >
                <div className="result-hero-label">{L.cv}</div>
                <div className="result-hero-value">{result.Cv}</div>
                <div className="result-hero-sub">Kv {result.Kv}</div>

                <div className="result-hero-grid">
                  <div className="result-hero-mini">
                    <div className="result-mini-label">{L.size}</div>
                    <div className="result-mini-value gold">{result.size.size}</div>
                    <div className="result-mini-meta">{result.size.dn}</div>
                  </div>
                  <div className="result-hero-mini">
                    <div className="result-mini-label">{L.opening}</div>
                    <div className={"result-mini-value " + (result.openingPercent >= 20 && result.openingPercent <= 80 ? "green" : "amber")}>
                      {result.openingPercent}%
                    </div>
                    <div className="opening-bar">
                      <div className="opening-fill" style={{
                        width: result.openingPercent + "%",
                        background: result.openingPercent < 20 || result.openingPercent > 85 ? "#E81123" : "linear-gradient(90deg, #E0A81A, #B8850A)"
                      }} />
                    </div>
                  </div>
                </div>

                <div className="result-hero-metrics">
                  {result.velocity > 0 && (
                    <div className="hero-metric">
                      <Activity size={12} />
                      <span className="hero-metric-label">{L.velocity}</span>
                      <span className="hero-metric-value">{result.velocity}</span>
                    </div>
                  )}
                  {result.noise && (
                    <div className="hero-metric">
                      <Gauge size={12} />
                      <span className="hero-metric-label">{L.noise}</span>
                      <span className="hero-metric-value">{result.noise}</span>
                    </div>
                  )}
                  {result.pipingApplied && (
                    <div className="hero-metric">
                      <Activity size={12} />
                      <span className="hero-metric-label">Fp</span>
                      <span className="hero-metric-value">{result.Fp}</span>
                    </div>
                  )}
                  {result.cavitationRisk && (
                    <div className={"hero-metric cav-" + result.cavitationRisk}>
                      {result.cavitationRisk === "low" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      <span className="hero-metric-label">{L.cav}</span>
                      <span className="hero-metric-value">{result.cavitationRisk}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="result-actions-row">
                <button
                  onClick={() => { setShowReport(true); track.reportOpened(); }}
                  className="btn-gold result-action-main">
                  <FileText size={15} /> {L.report}
                </button>
                <button
                  onClick={() => { setShowCompare(true); track.compared(); }}
                  className="result-action-btn">
                  <Award size={14} /> {L.compare}
                </button>
                <button onClick={() => setShowSaveDialog(true)} className="result-action-btn">
                  <Save size={14} /> {L.save}
                </button>
                <button onClick={shareLink} className="result-action-btn">
                  <Share2 size={14} /> {L.share}
                </button>
              </div>

              <ValveCharacteristicChart result={result} form={form} locale={locale} />

              {topProduct && (
                <div className="result-product-card" style={{
                  background: "var(--bg-card)",
                  border: "1.5px solid var(--border-strong)"
                }}>
                  <div className="product-card-head">
                    <Package size={14} color="var(--gold)" />
                    <span style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>
                      {L.product}
                    </span>
                    <span style={{
                      marginInlineStart: "auto",
                      padding: "2px 8px", borderRadius: 20, fontSize: 8.5, fontWeight: 900,
                      background: topProduct.source === "catalog" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      color: topProduct.source === "catalog" ? "#065F46" : "#92400E"
                    }}>
                      {topProduct.source === "catalog" ? L.productSourceCatalog : L.productSourceGeneric}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
                    <div className="product-icon-sm" style={{ background: "var(--bg-soft)" }}>⚙️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text)", lineHeight: 1.5 }}>
                        {topProduct.product.name?.[locale] || topProduct.product.name?.en}
                      </div>
                      <div style={{
                        fontSize: 10.5, color: "var(--text-muted)", fontWeight: 700,
                        marginTop: 3, fontFamily: "monospace", direction: "ltr"
                      }}>
                        {topProduct.matchedSize.dn} · Cv {topProduct.matchedSize.cv} · {L.opening} {topProduct.openingPercent}%
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-soft)", marginTop: 8, lineHeight: 1.7, fontWeight: 600 }}>
                    {topProduct.source === "catalog" ? L.productNoteCatalog : L.productDataNote}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                    <Link href={"/" + locale + "/contact?product=" + encodeURIComponent(topProduct.product.series)}
                      onClick={() => track.quoteRequested({ product: topProduct.product.series, source: "result_card" })}
                      className="btn-gold justify-center"
                      style={{ padding: "8px", fontSize: 11 }}>
                      {L.reqQuote}
                    </Link>
                    <Link href={"/" + locale + "/products/" + topProduct.product.slug}
                      onClick={() => track.productViewed({ product: topProduct.product.series })}
                      className="btn-secondary justify-center"
                      style={{ padding: "8px", fontSize: 11 }}>
                      {L.viewProduct}
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============ REFERENCE TABS ============ */}
      <div className="reference-section no-print">
        <div className="reference-head">
          <Info size={14} color="var(--gold)" />
          <span>{L.refTitle}</span>
        </div>

        <div className="reference-tabs">
          {REF_TABS.map(t => {
            const Icon = t.icon;
            const active = referenceTab === t.id;
            return (
              <button key={t.id} onClick={() => setReferenceTab(t.id)} className={active ? "active" : ""}>
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="reference-content">
          {referenceTab === "reference" && (
            <TipsAndStandards result={result} form={form} locale={locale} />
          )}
          {referenceTab === "material" && (
            <MaterialGuide form={form} fluid={fluid} locale={locale} />
          )}
          {referenceTab === "charts" && (
            <div style={{ display: "grid", gap: 12 }}>
              {result && !result.error ? (
                <>
                  <AlternativeSizes result={result} locale={locale} />
                  <InstalledChart result={result} form={form} locale={locale} />
                  <DeltaPChart result={result} form={form} locale={locale} />
                </>
              ) : (
                <div className="sizing-card" style={{ padding: 40, textAlign: "center" }}>
                  <BarChart3 size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    {isFa ? "برای نمایش نمودارها، ابتدا محاسبه کنید" : "Calculate first to view charts"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ MODALS ============ */}
      <SizingReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        result={result}
        form={form}
        fluid={fluid}
        locale={locale}
        selectedFluidName={selectedFluidName}
      />

      <SizingCompare
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        result={result}
        form={form}
        fluid={fluid}
        locale={locale}
      />

      <FluidPicker
        isOpen={showFluidPicker}
        onClose={() => setShowFluidPicker(false)}
        onSelect={handleFluidPick}
        locale={locale}
        currentFluidType={fluid}
      />

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 90 }} onClick={() => setShowSaveDialog(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", zIndex: 100,
                background: "var(--bg-card)", border: "1px solid var(--border-strong)",
                borderRadius: 18, padding: 22, width: "90%", maxWidth: 400,
                boxShadow: "var(--shadow-lg)"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>
                {L.saveDialog}
              </div>
              <input
                type="text"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="form-input"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                style={{
                  fontSize: 13, padding: "10px 14px",
                  width: "100%", borderRadius: 9,
                  background: "var(--bg-soft)", color: "var(--text)",
                  border: "1.5px solid var(--border-strong)",
                  fontFamily: "inherit"
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={handleSave} className="btn-gold flex-1 justify-center text-sm" style={{ padding: "10px" }}>
                  {L.confirm}
                </button>
                <button onClick={() => setShowSaveDialog(false)} className="btn-outline" style={{ padding: "10px 16px", fontSize: 13 }}>
                  {L.cancel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
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
            <CheckCircle2 size={15} /> {isFa ? "لینک کپی شد" : "Link copied"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndo && undoSnapshot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed", bottom: 90, left: "50%",
              transform: "translateX(-50%)", zIndex: 60,
              padding: "10px 14px", borderRadius: 12,
              background: "var(--bg-card)", color: "var(--text)",
              border: "1px solid var(--border-strong)",
              fontSize: 12, fontWeight: 700,
              boxShadow: "var(--shadow-lg)",
              display: "flex", alignItems: "center", gap: 12
            }}
          >
            <span>{isFa ? "فرم بازنشانی شد" : "Form reset"}</span>
            <button onClick={handleUndo}
              style={{
                padding: "5px 10px", borderRadius: 8,
                background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                color: "#FFFFFF", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11, fontWeight: 900,
                display: "flex", alignItems: "center", gap: 4
              }}>
              <Undo2 size={12} /> {L.undo}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.6); }
        }

        /* ==== TOOLBAR ==== */
        .sizing-toolbar {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 8px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .tb-btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          cursor: pointer;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 900;
          background: var(--bg-soft);
          color: var(--text-soft);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .tb-btn:hover { background: var(--bg-card-hover); color: var(--text); }
        .tb-wizard {
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          border-color: transparent;
          color: #FFFFFF;
        }
        .tb-wizard:hover { box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35); color: #FFFFFF; }
        .tb-reset { padding: 8px 10px; }
        .tb-center {
          display: flex;
          justify-content: center;
          gap: 8px;
          align-items: center;
        }
        .tb-live {
          padding: 7px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          background: var(--bg-soft);
          color: var(--text-soft);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .tb-live.on {
          background: rgba(16, 185, 129, 0.10);
          border-color: rgba(16, 185, 129, 0.35);
          color: #10B981;
        }
        .tb-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #9CA3AF;
        }
        .tb-live.on .tb-live-dot { background: #10B981; }
        .tb-live-dot.pulse { animation: pulse 1.8s infinite; }
        .tb-live-state {
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 5px;
          background: rgba(0,0,0,0.05);
          margin-inline-start: 2px;
        }
        .dark .tb-live-state { background: rgba(255,255,255,0.08); }
        .tb-live.on .tb-live-state {
          background: rgba(16, 185, 129, 0.18);
          color: #10B981;
        }

        .tb-unit {
          display: flex;
          gap: 2px;
          padding: 3px;
          background: var(--bg-soft);
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .tb-unit button {
          padding: 5px 10px;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 10.5px;
          font-weight: 900;
          background: transparent;
          color: var(--text-soft);
          transition: all 0.15s;
        }
        .tb-unit button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
        }

        .sizing-mobile-tabs {
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding: 5px;
          background: var(--bg-soft);
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 12px;
        }
        .sizing-mobile-tabs button {
          padding: 11px;
          border-radius: 9px;
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
          gap: 6px;
          position: relative;
          transition: all 0.15s;
        }
        .sizing-mobile-tabs button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
        }
        .mobile-tab-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10B981;
        }
        .sizing-mobile-tabs button.active .mobile-tab-dot { background: #FFFFFF; }

        .sizing-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
          margin-bottom: 24px;
        }
        .sizing-form-column,
        .sizing-result-column {
          display: grid;
          gap: 12px;
          align-self: start;
        }

        .sizing-card {
          padding: 16px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .card-head-text {
          font-size: 12.5px;
          font-weight: 900;
          color: var(--text);
        }
        .card-head-hint {
          margin-inline-start: auto;
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .fluid-pick-btn {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(0,120,212,0.10), rgba(0,120,212,0.03));
          border: 1.5px solid rgba(0,120,212,0.35);
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.15s;
          margin-bottom: 12px;
          text-align: start;
        }
        .fluid-pick-btn:hover {
          border-color: #0078D4;
          background: linear-gradient(135deg, rgba(0,120,212,0.15), rgba(0,120,212,0.05));
        }
        .fluid-pick-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, #0078D4, #005A9E);
          color: #FFFFFF;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .fluid-pick-text { flex: 1; min-width: 0; }
        .fluid-pick-label {
          font-size: 9.5px; font-weight: 900;
          color: #0078D4;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .dark .fluid-pick-label { color: #4DA6FF; }
        .fluid-pick-value {
          font-size: 13.5px; font-weight: 900;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fluid-type-chips {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          background: var(--bg-soft);
          padding: 5px;
          border-radius: 11px;
          margin-bottom: 12px;
        }
        .fluid-type-chips button {
          padding: 9px 6px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          background: transparent;
          color: var(--text-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .fluid-type-chips button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
        }
        .fluid-presets {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .preset-chip {
          padding: 6px 12px;
          border-radius: 8px;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          color: var(--text-soft);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .preset-chip:hover { border-color: var(--gold); color: var(--gold); }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .preset-btn {
          padding: 12px;
          border-radius: 11px;
          background: var(--bg-soft);
          border: 1.5px solid var(--border);
          cursor: pointer;
          font-family: inherit;
          text-align: start;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s;
        }
        .preset-btn:hover {
          border-color: var(--preset-color);
          background: var(--bg-card-hover);
        }
        .preset-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: grid; place-items: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .preset-name {
          font-size: 11.5px; font-weight: 900;
          color: var(--text);
          line-height: 1.3;
        }

        .progress-bar {
          height: 4px; border-radius: 2px;
          background: var(--bg-soft); overflow: hidden;
        }
        .progress-fill { height: 100%; transition: width 0.4s ease; }

        .dp-indicator {
          margin-top: 12px; padding: 10px 14px;
          border-radius: 10px;
          background: rgba(224, 168, 26, 0.10);
          border: 1px solid rgba(224, 168, 26, 0.30);
          display: flex; align-items: center; justify-content: space-between;
        }
        .dp-indicator span { font-size: 10.5px; font-weight: 900; color: var(--text-soft); }
        .dp-indicator strong {
          font-size: 13px; font-weight: 900; color: var(--gold);
          font-family: monospace; direction: ltr;
        }

        .advanced-toggle {
          margin-top: 12px; width: 100%; padding: 10px 14px;
          border-radius: 10px;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          font-family: inherit;
          color: var(--text-soft);
          font-size: 11.5px; font-weight: 800;
          transition: all 0.15s;
        }
        .advanced-toggle:hover { border-color: var(--gold); color: var(--gold); }

        .error-box {
          margin-top: 12px; padding: 11px 14px;
          border-radius: 10px;
          background: rgba(232, 17, 35, 0.08);
          border: 1px solid rgba(232, 17, 35, 0.35);
          display: flex; align-items: flex-start; gap: 8px;
        }

        .result-empty {
          padding: 40px 20px;
          text-align: center;
          background: linear-gradient(135deg, rgba(201, 149, 13, 0.06), rgba(201, 149, 13, 0.02));
          border: 2px dashed rgba(201, 149, 13, 0.35) !important;
          border-radius: 16px;
        }
        .result-empty-icon {
          width: 68px; height: 68px; border-radius: 20px;
          margin: 0 auto 16px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          box-shadow: 0 12px 32px rgba(201, 149, 13, 0.35);
        }
        .result-empty-title {
          font-size: 15px; font-weight: 900;
          color: var(--text);
          margin-bottom: 6px;
        }
        .result-empty-desc {
          font-size: 12px; color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 4px;
        }
        .result-empty-hint {
          font-size: 10.5px; color: var(--text-muted);
          font-weight: 600; opacity: 0.75;
        }

        .result-hero-card {
          padding: 18px;
          border-radius: 16px;
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          box-shadow: 0 10px 24px rgba(201, 149, 13, 0.30);
        }
        .result-hero-label {
          font-size: 10px; font-weight: 900;
          opacity: 0.9;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
          color: #FFFFFF;
        }
        .result-hero-value {
          font-size: 52px; font-weight: 900;
          line-height: 1; text-align: center;
          font-family: monospace;
          margin: 6px 0;
          color: #FFFFFF;
        }
        .result-hero-sub {
          font-size: 11px; font-weight: 800;
          opacity: 0.85; text-align: center;
          font-family: monospace;
          color: #FFFFFF;
        }
        .result-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.25);
        }
        .result-hero-mini {
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.15);
          text-align: center;
        }
        .result-mini-label {
          font-size: 9px; font-weight: 900;
          opacity: 0.85;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: #FFFFFF;
        }
        .result-mini-value {
          font-size: 22px; font-weight: 900;
          font-family: monospace;
          line-height: 1;
          color: #FFFFFF;
        }
        .result-mini-value.gold { color: #FFF3C4; }
        .result-mini-value.green { color: #B8F5D4; }
        .result-mini-value.amber { color: #FFE0A3; }
        .result-mini-meta {
          font-size: 9px; font-weight: 700;
          opacity: 0.75; margin-top: 5px;
          font-family: monospace;
          color: #FFFFFF;
        }
        .opening-bar {
          height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.20);
          margin-top: 6px; overflow: hidden;
        }
        .opening-fill { height: 100%; }

        .result-hero-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.25);
        }
        .hero-metric {
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          color: #FFFFFF;
        }
        .hero-metric-label {
          opacity: 0.8;
          font-size: 9.5px;
        }
        .hero-metric-value {
          margin-inline-start: auto;
          font-family: monospace;
          font-weight: 900;
          font-size: 11px;
          direction: ltr;
        }
        .hero-metric.cav-low { background: rgba(184, 245, 212, 0.20); }
        .hero-metric.cav-medium,
        .hero-metric.cav-high { background: rgba(255, 224, 163, 0.25); }
        .hero-metric.cav-flashing { background: rgba(255, 200, 200, 0.25); }

        .result-actions-row {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 6px;
        }
        .result-action-main {
          padding: 11px;
          font-size: 12.5px;
        }
        .result-action-btn {
          padding: 11px 12px;
          border-radius: 10px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          color: var(--text);
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .result-action-btn:hover { border-color: var(--gold); color: var(--gold); }

        .result-product-card {
          padding: 14px;
          border-radius: 14px;
        }
        .product-card-head {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .product-icon-sm {
          width: 44px; height: 44px; border-radius: 11px;
          display: grid; place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .collapse-btn {
          width: 100%; padding: 14px 16px;
          background: transparent; border: none;
          display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; font-family: inherit;
        }

        .reference-section {
          padding: 16px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        .reference-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 12px;
        }
        .reference-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-soft);
          border-radius: 11px;
          margin-bottom: 14px;
        }
        .reference-tabs button {
          flex: 1;
          padding: 10px 8px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 900;
          background: transparent;
          color: var(--text-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .reference-tabs button.active {
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(201, 149, 13, 0.25);
        }

        @media (max-width: 1023px) {
          .sizing-mobile-tabs { display: grid; }
          .sizing-main-grid { grid-template-columns: 1fr; }
          .sizing-form-column,
          .sizing-result-column { display: none; }
          .sizing-form-column.mobile-show,
          .sizing-result-column.mobile-show { display: grid; }
          .sizing-toolbar {
            grid-template-columns: auto 1fr auto;
            gap: 6px;
          }
          .tb-wizard span { display: none; }
          .tb-live-state { display: none; }
          .reference-tabs button span { display: none; }
          .reference-tabs button { flex: none; padding: 10px; }
        }

        @media (max-width: 640px) {
          .presets-grid { grid-template-columns: 1fr; }
          .result-actions-row { grid-template-columns: 1fr 1fr; }
        }

        @media print {
          .no-print, header, footer, nav { display: none !important; }
          body { background: #FFFFFF !important; }
          .sizing-root { padding: 0 !important; }
          .sizing-card { background: #FFFFFF !important; border: 1px solid #D1D5DB !important; box-shadow: none !important; page-break-inside: avoid; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
    </section>
  );
}