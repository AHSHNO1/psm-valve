"use client";
import { useState, useEffect, useMemo, useId, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, AlertTriangle, CheckCircle2, Activity, Wind,
  Gauge, BarChart3, Zap, Droplets, Flame, ChevronDown,
  ArrowLeft, Save, Trash2, Printer, X, Layers,
  Share2, RotateCcw, Copy, Check, HelpCircle, Sparkles,
  Info, Wand2, Globe2, Award, Camera, FlaskConical,
  LineChart, FileText, ClipboardList, Package, Star,
  Undo2, SlidersHorizontal, ShieldAlert, Thermometer, ArrowDownWideNarrow, Waves, Clock
} from "lucide-react";
import {
  calcLiquidCv, calcGasCv, calcSteamCv, cvToSize, bodyVelocity,
  getRecommendation, FLUID_PRESETS, getSeriesProfile
} from "@/lib/sizing-advanced";
import { calcPsvCv } from "@/lib/psv-sizing";
import {
  calcDesuperheater, ATOMIZING_DP_DEFAULT_BAR, ATOMIZING_DP_FRACTION,
  NEAR_SATURATION_REJECT_C, NEAR_SATURATION_WARN_C
} from "@/lib/desuperheater";
import { calcLetdown } from "@/lib/letdown";
import { calcTwoPhaseCv, compareTwoPhaseModels, CV_TO_AREA_MM2 } from "@/lib/two-phase";
import { saturationTempC, steamDensity } from "@/lib/steam-tables";
import { fluidTypeDefaults } from "@/lib/fluids-database";
import { parseSizingParams, buildSizingParams, pickSeriesValve, SIZING_MODES, TWO_PHASE_MODELS } from "@/lib/sizing-link";
import {
  PRESET_SCENARIOS, DESUPER_PRESETS, loadScenarios, saveScenario,
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
import { SYSTEMS, formToSI, formFromSI, barToPressure } from "@/lib/unit-system";
import {
  flowToEngine, engineToFlow, flowUnitGroups, defaultFlowUnit,
  mwFromGg, ggFromMW, velocityFromSI,
  FIELD_UNIT_CATEGORY, unitGroups, fieldUnit, convertFieldUnit, unitFromSI
} from "@/lib/unit-system";
import { track } from "@/lib/analytics";
import { warningText } from "@/lib/warning-text";

// پیش‌فرض‌ها منطبق بر آب شیرین در ۲۰ درجه (Pv ≈ فشار بخار آب، Pc آب)؛
// MW عمداً خالی است تا با انتخاب سیال گازی از دیتابیس پر شود.
// nu = گرانروی سینماتیکی (cSt) — پیش‌فرض آب
const DEFAULT_FORM = {
  Q: null, Gf: 1, Gg: 0.65, MW: null, P1: null, P2: null, T: null,
  Pv: 0.0317, Pc: 221.2, Z: 1, k: 1.4, xT: 0.7, FL: 0.9, W: null, pipeDn: null,
  QUnit: null, WUnit: null, nu: 1, QMin: null, marginPct: 0,
  // شیر اطمینان (API 520/526)
  setP: null, overpressurePct: 10, inletLossPct: null, Kd: null, Kb: null, Kc: null, balanced: false,
  // ایستگاه دسوپرهیت
  T2: null, waterP: null, waterT: 25, waterGf: 1, supplyP: null, dvP: null, atomizing: true,
  // لت‌داون و دو‌فازی
  stages: null, drynessPct: null, qualityPct: null, tpModel: "omega",
  // ضریب عدم‌تعادل HNE (N) و ضریب دبی مؤثر گلوگاه (Kd دو‌فازی) — خالی = پیش‌فرض موتور
  N: null, tpKd: null
};

// برچسب‌های حالت‌های سرویس (PSV/دسوپرهیتر/لت‌داون) — روی L سوار می‌شوند
const SERVICE_LABELS = {
  fa: {
    superheatIn: "دمای بخار ورودی", superheatOut: "سوپرهیت خروجی", duty: "بار حرارتی",
    satMargin: "حاشیهٔ اشباع", sprayDp: "افت فشار اسپری", engineNotes: "یادداشت‌های موتور محاسبه",
    ratedNote: "ظرفیت اسمی", valveType: "نوع شیر", serviceMode: "حالت محاسبه",
    crossCheck: "فقط برای مقایسه با سایزینگ شیر کنترل — ضریب تخلیهٔ نامی نیست",
    stageCount: "تعداد مراحل", governing: "مرحلهٔ حاکم"
  },
  en: {
    superheatIn: "Inlet steam temp", superheatOut: "Outlet superheat", duty: "Heat duty",
    satMargin: "Saturation margin", sprayDp: "Spray ΔP", engineNotes: "Calculation engine notes",
    ratedNote: "Rated capacity", valveType: "Valve type", serviceMode: "Calculation mode",
    crossCheck: "Cross-check against control-valve Cv only — not a rated relief coefficient",
    stageCount: "Stages", governing: "Governing stage"
  },
  ar: {
    superheatIn: "حرارة البخار الداخل", superheatOut: "الحرارة الفائقة بالمخرج", duty: "الحمل الحراري",
    satMargin: "هامش التشبع", sprayDp: "هبوط ضغط الرش", engineNotes: "ملاحظات محرك الحساب",
    ratedNote: "السعة الاسمية", valveType: "نوع الصمام", serviceMode: "نوع الحساب",
    crossCheck: "للمقارنة مع Cv صمام التحكم فقط — ليس معامل تصريف مقدراً",
    stageCount: "عدد المراحل", governing: "المرحلة الحاكمة"
  },
  ru: {
    superheatIn: "Температура пара на входе", superheatOut: "Перегрев на выходе", duty: "Тепловая нагрузка",
    satMargin: "Запас до насыщения", sprayDp: "Перепад распыла", engineNotes: "Примечания расчётного модуля",
    ratedNote: "Номинальная способность", valveType: "Тип клапана", serviceMode: "Режим расчёта",
    crossCheck: "Только для сравнения с Cv регулирующего клапана — не номинальный коэффициент",
    stageCount: "Ступени", governing: "Расчётная ступень"
  }
};

function getRecommendedCharacteristic(fluid, openingPercent) {
  if (fluid === "gas" || fluid === "steam") return "equal";
  if (fluid === "liquid") {
    if (openingPercent > 70) return "linear";
    return "equal";
  }
  return "equal";
}

// نگاشت مشخصهٔ ذاتی کاتالوگ به کلید برچسب چهارزبانه
const CHARACTERISTIC_LABEL_KEYS = {
  equal: "charEqual",
  modified: "charModified",
  linear: "charLinear",
  quick: "charQuick"
};

function characteristicLabel(labels, characteristic) {
  const key = CHARACTERISTIC_LABEL_KEYS[characteristic];
  return (key && labels[key]) || labels.charUnknown;
}

// سه سرچشمهٔ داده برای سایز پیشنهادی: Cv اندازه‌گیری‌شدهٔ کاتالوگ، برآورد مهندسی،
// و جدول عمومی. رنگ و متن بنچ باید همین تفاوت را بگوید، نه اینکه برآورد را
// «کاتالوگ» نشان دهد.
function productSourceBadge(labels, topProduct) {
  if (topProduct.source === "catalog") {
    return { text: labels.productSourceCatalog, bg: "rgba(16,185,129,0.12)", fg: "#065F46" };
  }
  const estimated = topProduct.source === "estimated";
  return {
    text: estimated ? labels.productSourceEstimated : labels.productSourceGeneric,
    bg: "rgba(245,158,11,0.12)",
    fg: "#92400E"
  };
}

/** توضیح صادقِ سرچشمهٔ Cv؛ برای برآورد، خطای آزمونِ برگشتی درجابه‌گذاری میشود */
function productSourceNote(labels, topProduct) {
  if (topProduct.source === "catalog") return labels.productNoteCatalog;
  if (topProduct.source !== "estimated") return labels.productDataNote;
  const band = Number.isFinite(topProduct.errorPct) ? `±${Math.round(topProduct.errorPct)}%` : "±45%";
  return String(labels.productNoteEstimated).replace("{band}", band);
}

// اعتبارسنجی روی مقادیر واحد-موتوری (SI) انجام میشود؛
// با واحد مستقل هر فیلد، مقایسهٔ مستقیمِ مقادیر نمایشی (مثلاً P1 بر حسب bar با P2 بر حسب psi) معنا ندارد.
function validateForm(form, fluid, locale, mode = "control") {
  const errors = {};
  const isFa = locale === "fa";
  const invalidPositive = (value) =>
    !Number.isFinite(value) || value <= 0;
  const optionalInvalidPositive = (value) =>
    value != null && invalidPositive(value);
  // ضرایب شیر اطمینان در بازهٔ (۰،۱] تعریف میشوند
  const badCoefficient = (value) => value != null && (!Number.isFinite(value) || value <= 0 || value > 1);

  // دبی لازم بر حسب حالت: دسوپرهیتر همیشه جرمی، PSV مایع حجمی، لت‌داون گاز هر دو
  const needMass = mode === "desuper" || mode === "twoPhase" || fluid === "steam" || (mode === "psv" && fluid !== "liquid");
  if (needMass) {
    if (invalidPositive(form.W)) errors.W = isFa ? "دبی جرمی باید عددی بزرگتر از صفر باشد" : "Mass flow must be a number greater than 0";
  } else if (mode === "letdown" && fluid === "gas") {
    if (invalidPositive(form.Q) && invalidPositive(form.W)) {
      errors.Q = isFa ? "دبی حجمی (Q) یا جرمی (W) لازم است" : "Provide a volumetric (Q) or mass (W) flow";
    }
  } else if (invalidPositive(form.Q)) {
    errors.Q = isFa ? "دبی باید عددی بزرگتر از صفر باشد" : "Flow must be a number greater than 0";
  }

  if (mode === "psv") {
    // فشار تنظیم (گیج) یا فشار تخلیهٔ مطلق — یکی کافی است
    const hasSet = Number.isFinite(form.setP) && form.setP > 0;
    if (!hasSet && invalidPositive(form.P1)) {
      errors.P1 = isFa ? "فشار تنظیم (گیج) یا فشار تخلیهٔ مطلق P1 لازم است" : "Provide a gauge set pressure or an absolute relieving pressure P1";
    }
    if (optionalInvalidPositive(form.setP)) {
      errors.setP = isFa ? "فشار تنظیم باید عددی مثبت باشد" : "Set pressure must be a positive number";
    }
    if (form.overpressurePct != null && (!Number.isFinite(form.overpressurePct) || form.overpressurePct < 0 || form.overpressurePct > 21)) {
      errors.overpressurePct = isFa ? "درصد اضافه‌فشار باید بین ۰ و ۲۱ باشد" : "Overpressure must be between 0 and 21 percent";
    }
    // فشار پشتی (مطلق) باید از فشار تخلیه کمتر باشد
    const relieving = hasSet ? form.setP * (1 + (Number(form.overpressurePct) || 0) / 100) + 1.01325 : Number(form.P1);
    if (Number.isFinite(form.P2) && form.P2 >= 0 && Number.isFinite(relieving) && form.P2 >= relieving) {
      errors.P2 = isFa ? "فشار پشتی باید کمتر از فشار تخلیه باشد" : "Backpressure must be below the relieving pressure";
    }
    if (badCoefficient(form.Kd)) errors.Kd = isFa ? "Kd باید در بازهٔ (۰،۱] باشد" : "Kd must be in (0, 1]";
    if (badCoefficient(form.Kb)) errors.Kb = isFa ? "Kb باید در بازهٔ (۰،۱] باشد" : "Kb must be in (0, 1]";
    if (badCoefficient(form.Kc)) errors.Kc = isFa ? "Kc باید در بازهٔ (۰،۱] باشد" : "Kc must be in (0, 1]";
    if (optionalInvalidPositive(form.inletLossPct)) {
      errors.inletLossPct = isFa ? "افت فشار ورودی باید عددی مثبت باشد" : "Inlet pressure loss must be a positive number";
    }
    if (fluid === "liquid") {
      if (invalidPositive(form.Gf)) errors.Gf = isFa ? "چگالی نسبی مایع باید عددی مثبت باشد" : "Gf must be a positive number";
    } else {
      if (invalidPositive(form.Z)) errors.Z = isFa ? "ضریب Z باید عددی مثبت باشد" : "Z must be a positive number";
      if (!Number.isFinite(form.k) || form.k <= 1) errors.k = isFa ? "نسبت گرمای ویژه باید بزرگ‌تر از ۱ باشد" : "k must be greater than 1";
      if (fluid === "gas" && invalidPositive(form.Gg)) errors.Gg = isFa ? "چگالی نسبی گاز باید عددی مثبت باشد" : "Gg must be a positive number";
      if (!Number.isFinite(form.T)) errors.T = isFa ? "دمای تخلیه لازم است" : "Relieving temperature is required";
    }
    return errors;
  }

  if (mode === "desuper") {
    if (invalidPositive(form.P1)) errors.P1 = isFa ? "فشار ایستگاه باید عددی مثبت باشد" : "Station pressure must be a positive number";
    const t1 = Number.isFinite(form.T) ? Number(form.T) : null;
    const t2 = Number.isFinite(form.T2) ? Number(form.T2) : null;
    if (t1 == null) errors.T = isFa ? "دمای بخار ورودی لازم است" : "Inlet steam temperature is required";
    if (t2 == null) errors.T2 = isFa ? "دمای هدف پس از دی‌سوپرهیت لازم است" : "Target temperature is required";
    if (t1 != null && t2 != null && t2 >= t1) {
      errors.T2 = isFa ? "دمای هدف باید از دمای ورودی کمتر باشد" : "Target temperature must be below the inlet temperature";
    }
    if (invalidPositive(form.waterP)) {
      errors.waterP = isFa ? "فشار آب تزریق باید عددی مثبت باشد" : "Injection water pressure must be a positive number";
    } else if (Number.isFinite(form.P1) && Number(form.waterP) <= Number(form.P1)) {
      errors.waterP = isFa ? "فشار آب باید از فشار ایستگاه بیشتر باشد" : "Water pressure must exceed the station pressure";
    }
    if (optionalInvalidPositive(form.waterT)) errors.waterT = isFa ? "دمای آب باید عددی مثبت باشد" : "Water temperature must be a positive number";
    if (optionalInvalidPositive(form.supplyP)) {
      errors.supplyP = isFa ? "فشار بالادست بخار باید عددی مثبت باشد" : "Steam supply pressure must be a positive number";
    } else if (form.supplyP != null && Number.isFinite(form.P1) && Number(form.supplyP) <= Number(form.P1)) {
      errors.supplyP = isFa ? "فشار بالادست بخار باید از فشار ایستگاه بیشتر باشد" : "Steam supply pressure must exceed the station pressure";
    }
    if (optionalInvalidPositive(form.dvP)) errors.dvP = isFa ? "افت فشار شکار باید عددی مثبت باشد" : "Spray pressure drop must be a positive number";
    if (optionalInvalidPositive(form.waterGf)) errors.waterGf = isFa ? "چگالی نسبی آب باید عددی مثبت باشد" : "Water Gf must be a positive number";
    return errors;
  }

  if (mode === "twoPhase") {
    // شار جرمی مخلوط: دبی جرمی، چگالی مایع و کسیر بخار ورودی لازم است
    if (invalidPositive(form.Gf)) errors.Gf = isFa ? "چگالی نسبی مایع باید عددی مثبت باشد" : "Liquid specific gravity must be a positive number";
    const xPct = Number(form.qualityPct);
    if (form.qualityPct == null) {
      errors.qualityPct = isFa ? "کسیر جرمی بخار ورودی لازم است (۰ = مایع تنها، ۱۰۰ = بخار خالص)" : "Inlet vapour mass fraction is required (0 = liquid only, 100 = dry vapour)";
    } else if (!Number.isFinite(xPct) || xPct < 0 || xPct > 100) {
      errors.qualityPct = isFa ? "کسیر بخار باید بین ۰ تا ۱۰۰٪ باشد" : "Vapour fraction must be between 0 and 100 percent";
    }
    if (invalidPositive(form.P1)) errors.P1 = isFa ? "فشار ورودی مطلق باید عددی مثبت باشد" : "Inlet absolute pressure must be a positive number";
    // P2 در روش دو‌فازی مطلق و مثبت است (برخلاف شیر کنترل که صفر هم معنا دارد)
    if (invalidPositive(form.P2)) {
      errors.P2 = isFa ? "فشار خروجی مطلق باید عددی مثبت باشد" : "Outlet absolute pressure must be a positive number";
    } else if (Number.isFinite(form.P1) && form.P2 >= form.P1) {
      errors.P2 = isFa ? "فشار ورودی باید بیشتر از خروجی باشد" : "P1 must be > P2";
    }
    // در ورودیِ اشباع Pv = P1 مجاز است (فلاشینگ از دهانهٔ ورودی)؛ فقط Pv > P1 غیرفیزیکی است
    if (form.Pv != null && (!Number.isFinite(Number(form.Pv)) || form.Pv < 0)) {
      errors.Pv = isFa ? "فشار بخار باید عددی نامنفی باشد" : "Pv must be a non-negative number";
    } else if (Number.isFinite(form.Pv) && Number.isFinite(form.P1) && form.Pv > form.P1) {
      errors.Pv = isFa ? "فشار بخار نباید از P1 بیشتر باشد" : "Pv must not exceed P1";
    }
    if (optionalInvalidPositive(form.Pc)) errors.Pc = isFa ? "فشار بحرانی باید عددی مثبت باشد" : "Pc must be a positive number";
    if (form.N != null && !(Number(form.N) > 0 && Number(form.N) <= 4)) {
      errors.N = isFa ? "ضریب عدم‌تعادل N باید بین ۰ و ۴ باشد (رایج ۱٫۰ تا ۲٫۰)" : "Non-equilibrium factor N must be between 0 and 4 (typically 1.0–2.0)";
    }
    if (form.tpKd != null && (!Number.isFinite(Number(form.tpKd)) || form.tpKd <= 0 || form.tpKd > 1)) {
      errors.tpKd = isFa ? "Kd باید در بازهٔ (۰،۱] باشد" : "Kd must be in (0, 1]";
    }
    return errors;
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
    if (optionalInvalidPositive(form.nu)) {
      errors.nu = isFa ? "گرانروی باید عددی مثبت باشد" : "Viscosity must be a positive number";
    }
  }

  if (fluid === "gas") {
    if (invalidPositive(form.Gg)) errors.Gg = isFa ? "چگالی گاز باید عددی مثبت باشد" : "Gg must be a positive number";
    if (invalidPositive(form.Z)) errors.Z = isFa ? "ضریب Z باید عددی مثبت باشد" : "Z must be a positive number";
    if (invalidPositive(form.k)) errors.k = isFa ? "نسبت گرمای ویژه باید عددی مثبت باشد" : "k must be a positive number";
    if (invalidPositive(form.xT)) errors.xT = isFa ? "ضریب xT باید عددی مثبت باشد" : "xT must be a positive number";
  }

  if (fluid !== "liquid") {
    // دما در نسخهٔ موتور سلسیوس است (تبدیل واحد در formToSI انجام شده)
    const temperatureC = Number.isFinite(form.T) ? Number(form.T) : null;
    if (temperatureC == null || temperatureC < -200 || temperatureC > 800) {
      errors.T = isFa
        ? "دما باید بین ۲۰۰- و ۸۰۰ درجهٔ سلسیوس باشد"
        : "T must be between -200 and 800 °C";
    }
  }

  if (mode === "letdown") {
    if (form.stages != null && (!Number.isInteger(Number(form.stages)) || Number(form.stages) < 1 || Number(form.stages) > 8)) {
      errors.stages = isFa ? "تعداد مراحل باید عددی صحیح بین ۱ و ۸ باشد" : "Stages must be a whole number between 1 and 8";
    }
    if (fluid === "steam" && form.drynessPct != null && (form.drynessPct < 0 || form.drynessPct > 100)) {
      errors.drynessPct = isFa ? "کیفیت بخار باید بین ۰ تا ۱۰۰٪ باشد" : "Steam dryness must be between 0 and 100 percent";
    }
  }

  if (optionalInvalidPositive(form.pipeDn)) {
    errors.pipeDn = isFa ? "سایز لوله باید عددی مثبت باشد" : "Pipe size must be a positive number";
  } else if (form.pipeDn != null && (form.pipeDn < 15 || form.pipeDn > 2000)) {
    errors.pipeDn = isFa ? "سایز لوله باید بین DN15 و DN2000 باشد" : "Pipe size must be between DN15 and DN2000";
  }

  return errors;
}

// ---- واحد دبی و جرم مولکولی: برچسبها و پیامهای اعتبارسنجی ----
const FLOW_I18N = {
  fa: {
    groupVolumetric: "دبی حجمی",
    groupMass: "دبی جرمی",
    mwHelp: "جرم مولکولی گاز (kg/kmol). برای تبدیل دبی جرمی به حجمی و همگامسازی Gg استفاده میشود (Gg = MW ÷ 28.96).",
    qHelp: "دبی سیال — واحد حجمی (m3/h، Nm3/h، gpm، SCFM) یا جرمی (kg/h، lb/h) قابل انتخاب است.",
    densityRequired: "برای دبی جرمی گاز، جرم مولکولی (MW) یا چگالی نسبی (Gg) لازم است.",
    unknownUnit: "واحد دبی انتخابشده پشتیبانی نمیشود.",
    mwInvalid: "جرم مولکولی باید عددی بزرگتر از صفر باشد"
  },
  en: {
    groupVolumetric: "Volumetric",
    groupMass: "Mass flow",
    mwHelp: "Gas molecular weight (kg/kmol). Used to convert a mass flow to volumetric and to keep Gg in sync (Gg = MW / 28.96).",
    qHelp: "Flow rate — pick a volumetric (m3/h, Nm3/h, gpm, SCFM) or a mass (kg/h, lb/h) unit.",
    densityRequired: "Enter the molecular weight (MW) or relative density (Gg) for a gas mass flow.",
    unknownUnit: "The selected flow unit is not supported.",
    mwInvalid: "MW must be a number greater than 0"
  },
  ar: {
    groupVolumetric: "تدفق حجمي",
    groupMass: "تدفق كتلي",
    mwHelp: "الوزن الجزيئي للغاز (kg/kmol) لتحويل التدفق الكتلي إلى حجمي ومزامنة Gg.",
    qHelp: "التدفق — يمكن اختيار وحدة حجمية أو كتلية.",
    densityRequired: "أدخل الوزن الجزيئي (MW) أو الكثافة النسبية (Gg) للتدفق الكتلي للغاز.",
    unknownUnit: "وحدة التدفق غير مدعومة.",
    mwInvalid: "يجب أن يكون الوزن الجزيئي أكبر من صفر"
  },
  ru: {
    groupVolumetric: "Объёмный",
    groupMass: "Массовый",
    mwHelp: "Молекулярная масса газа (kg/kmol) для перевода массового расхода в объёмный и синхронизации Gg.",
    qHelp: "Расход — выберите объёмную или массовую единицу.",
    densityRequired: "Укажите молекулярную массу (MW) или относительную плотность (Gg) для массового расхода газа.",
    unknownUnit: "Выбранная единица расхода не поддерживается.",
    mwInvalid: "Молекулярная масса должна быть больше нуля"
  }
};

// بررسی سازگاری واحد دبی با سیال (مثلاً دبی جرمی گاز بدون MW/Gg)
function validateFlowInputs(form, fluid, locale, unitSystem, mode = "control") {
  const t = FLOW_I18N[locale] || FLOW_I18N.en;
  const errors = {};
  const ctx = { Gf: form.Gf, MW: form.MW, Gg: form.Gg };
  if (fluid === "gas" && form.MW != null && form.MW !== "" && !(Number(form.MW) > 0)) {
    errors.MW = t.mwInvalid;
  }

  // فیلد دبی فعال با حالت عوض میشود (دسوپرهیتر و PSV گاز/بخار دبی جرمی می‌خواهند)
  const useMass = mode === "desuper" || fluid === "steam" || (mode === "psv" && fluid !== "liquid");
  const key = useMass ? "W" : "Q";
  const unit = useMass
    ? (form.WUnit || SYSTEMS[unitSystem].flowMass || SYSTEMS[unitSystem].flowSteam)
    : (form.QUnit || defaultFlowUnit(unitSystem, fluid));
  const value = form[key];
  if (value != null && value !== "") {
    const conv = flowToEngine(value, unit, useMass ? "steam" : fluid, ctx);
    if (conv.error === "densityRequired") errors[key] = t.densityRequired;
    else if (conv.error === "unknownUnit") errors[key] = t.unknownUnit;
  }
  return errors;
}

// گروههای واحد با برچسب محلی برای <optgroup>
function localizeUnitGroups(groups, locale) {
  const t = FLOW_I18N[locale] || FLOW_I18N.en;
  return groups.map((g) => ({
    id: g.id,
    label: g.id === "mass" ? t.groupMass : t.groupVolumetric,
    units: g.units
  }));
}

// برچسب گروههای واحد برای انتخابگر مستقل هر فیلد
const UNIT_GROUP_LABELS = {
  fa: { metric: "متریک", imperial: "امپریال", temperature: "دما", kinematic: "سینماتیکی", dynamic: "داینامیکی", density: "چگالی", length: "طول", percent: "درصد" },
  en: { metric: "Metric", imperial: "Imperial", temperature: "Temperature", kinematic: "Kinematic", dynamic: "Dynamic", density: "Density", length: "Length", percent: "Percent" },
  ar: { metric: "متري", imperial: "إمبراطوري", temperature: "الحرارة", kinematic: "حركية", dynamic: "ديناميكية", density: "الكثافة", length: "الطول", percent: "النسبة" },
  ru: { metric: "Метрическая", imperial: "Имперская", temperature: "Температура", kinematic: "Кинематическая", dynamic: "Динамическая", density: "Плотность", length: "Длина", percent: "Проценты" }
};

// واحد بی‌بعد «نسبت» در چگالی نسبی — نمایش محلی به‌جای خط تیره
// «fraction» هم کوتاه‌تر نمایش داده میشود تا در ستارِ باریک سرریز نکند
const UNIT_LABEL_I18N = {
  fa: { "—": "نسبت", fraction: "کسری" },
  en: { "—": "ratio", fraction: "frac" },
  ar: { "—": "نسبة", fraction: "كسري" },
  ru: { "—": "отн.", fraction: "доля" }
};

function categoryUnitGroups(category, locale) {
  const t = Object.assign({}, UNIT_GROUP_LABELS.en, UNIT_GROUP_LABELS[locale] || {});
  const labels = UNIT_LABEL_I18N[locale] || {};
  return unitGroups(category).map((g) => ({
    id: g.id,
    label: t[g.id] || g.id,
    units: g.units.map((u) => (labels[u] ? { value: u, label: labels[u] } : u))
  }));
}

const FIELD_HELP = {
  fa: {
    Q: "دبی حجمی سیال — مایع: m³/h، گاز: Nm³/h",
    W: "دبی جرمی بخار بر حسب kg/h",
    Gf: "چگالی نسبی مایع نسبت به آب (آب = ۱) — در صورت نیاز با واحد چگالی (kg/m³) وارد کنید",
    Gg: "چگالی نسبی گاز نسبت به هوا (هوا = ۱)",
    P1: "فشار مطلق ورودی شیر — واحدش را از گوشهٔ فیلد انتخاب کنید",
    P2: "فشار مطلق خروجی شیر — واحد مستقل از P1 قابل انتخاب است",
    Pv: "فشار بخار مایع در دمای کار — برای تشخیص کاویتاسیون",
    Pc: "فشار بحرانی سیال — برای محاسبه دقیق‌تر",
    FL: "ضریب بازیابی فشار شیر (معمولاً ۰.۹)",
    T: "دمای سیال — سلسیوس، فارنهایت یا کلوین",
    Z: "ضریب تراکم‌پذیری گاز (گاز ایده‌آل = ۱)",
    k: "نسبت گرمای ویژه Cp/Cv (هوا = ۱.۴)",
    xT: "ضریب افت فشار بحرانی (معمولاً ۰.۷)",
    nu: "گرانروی مایع: سینماتیکی (cSt، آب در ۲۰ درجه ≈ ۱) یا داینامیک (cP — چگالی مایع لازم است). در جریان لامینار/گذار، Cv با ضریب FR اصلاح می‌شود (IEC 60534-2-1 بند ۱۰).",
    pipeDn: "قطر لولهٔ ورودی/خروجی (DN، mm یا اینچ). اگر شیر از لوله کوچک‌تر باشد، ضریب هندسهٔ اتصالات Fp روی Cv اعمال می‌شود.",
    setP: "فشار تنظیم شیر اطمینان بر حسب گیج — فشار تخلیه از آن و اضافه‌فشار محاسبه می‌شود",
    overpressurePct: "اضافه‌فشار مجاز: ۱۰٪ تک‌شیر، ۱۶٪ چندنصبه، ۲۱٪ حالت آتش (API 520)",
    relievingP: "فشار تخلیهٔ مطلق — اگر فشار تنظیم را وارد کرده باشید، خودکار محاسبه می‌شود",
    backP: "فشار پشتی مطلق (اتمسفر = صفر گیج) — برای شیر فنری متعارف حداکثر ۱۰٪ فشار تنظیم",
    inletLossPct: "افت غیرقابل‌بازگشت خط ورودی، درصد فشار تنظیم — کرانهِ API 520 سه درصد است",
    Kd: "ضریب ظرفیت کاهیده — ۰.۹۷۵ گاز و ۰.۶۵ مایع فرض می‌شود؛ مقدار تأییدشدهٔ ASME را وارد کنید",
    Kb: "ضریب فشار پشتی — برای شیرهای بالنسد از منحنی سازنده گرفته می‌شود",
    Kc: "ضریب ترکیب دیسک و نشیمنگاه — ۱ برای شیر بدون دیسک شکسته",
    T2: "دمای بخار پس از دی‌سوپرهیت — باید بالای نقطهٔ اشباع در فشار ایستگاه بماند",
    superheatIn: "دمای بخار سوپرهیت ورودی — جدول بخار تا ۵۵۰ °C معتبر است",
    waterP: "فشار آب تزریق (مطلق) — باید از فشار ایستگاه بیشتر باشد تا اسپری ممکن شود",
    waterT: "دمای آب اسپری — با آنتالپی آب، دبی لازم آب تعیین می‌شود",
    supplyP: "فشار بخار بالادست شیر کاهش فشار — در آن صورت Cv شیر بخار هم محاسبه می‌شود",
    dvP: "افت فشار نازل/شکار — پیش‌فرض راهنمای اتمایزینگ اعمال می‌شود",
    stages: "تعداد مراحل کاهش فشار — خالی یعنی خودکار بر پایهٔ قاعدهٔ نسبت فشار",
    drynessPct: "کسری خشکی بخار ورودی (۱۰۰ = اشباع خشک) — کانتنس در لت‌داون فرسایش ایجاد می‌کند",
    qualityPct: "کسیر جرمی بخار در ورودی شیر (۰ = مایع تنها، ۱۰۰ = بخار خالص). در دو‌فازی همین عدد شار و Cv لازم را چند برابر می‌کند",
    N: "ضریب عدم‌تعادل HNE (سبک Sheldon–Schreuder): ۱ = تعادل کامل، ۱٫۴ پیش‌فرض، تا ۲ برای تریم بلند/فلشینگ شدید. قدر دقیق آن دادهٔ آزمون سازنده است",
    tpKd: "ضریب دبی مؤثر گلوگاه در تبدیل Cv↔مساحت. پیش‌فرض ۱ = اوریفیس ایده‌آل (نتیجه خوش‌بینانه)؛ برای تریم واقعی ≈ ۰٫۸۵ وارد کنید تا Cv لازم حدود ۱۵٪ بالا برود",
    MWtwoPhase: "برای آب خالی بگذارید تا جدول بخار IAPWS به کار آید؛ برای سیال غیرآب (پروپان، اتانول و…) MW را وارد کنید تا منحنی اشباع از Clausius–Clapeyron ساخته شود",
    PvTwo: "فشار بخار در دمای ورودی — آغاز فلاش و نقطهٔ لنگهٔ روش ω از همین عدد می‌آید؛ برای ورودی اشباع آن را برابر P1 بگیرید",
    tpModelOmega: "روش ω لوینگ (AIChE، پیوست API 520 و IEC 60534-2-1): دو‌نقطه‌ای و دفاع‌پذیرترین گزینه — پیش‌فرض",
    tpModelHem: "HEM: همگن تعادلی با ادغام عددی ∫v dp روی مسیر ایزنتروپیک — تعادل کامل فرض می‌کند پس Cv آن کم‌ترین لازم است",
    tpModelHne: "HNE: همان HEM با ضریب عدم‌تعادل N (شار تقسیم بر N) — واقع‌بینانه‌تر برای فلشینگ آب",
    tpModelAdditive: "جمع سادهٔ Cv مایع و گاز — فلاش و چگالی مخلوط در گلوگاه را نمی‌بیند؛ فقط برای مقایسه، قابل اتکا نیست"
  },
  en: {
    Q: "Volumetric flow — liquid: m³/h, gas: Nm³/h",
    W: "Steam mass flow in kg/h",
    Gf: "Liquid specific gravity relative to water (water = 1) — can also be entered as a density (kg/m³)",
    Gg: "Gas specific gravity relative to air",
    P1: "Absolute inlet pressure — pick its unit on the field",
    P2: "Absolute outlet pressure — its unit can differ from P1",
    Pv: "Vapor pressure of liquid at operating temperature",
    Pc: "Critical pressure of fluid",
    FL: "Valve pressure recovery factor (≈0.9)",
    T: "Fluid temperature — °C, °F or K",
    Z: "Gas compressibility factor (ideal gas = 1)",
    k: "Specific heat ratio Cp/Cv (air = 1.4)",
    xT: "Choked pressure drop ratio (typically 0.7)",
    nu: "Liquid viscosity: kinematic (cSt, water at 20 °C ≈ 1) or dynamic (cP — needs the liquid density). In laminar/transition flow Cv is corrected with the FR factor (IEC 60534-2-1 Clause 10).",
    pipeDn: "Inlet/outlet pipe size (DN, mm or inch). When the valve is smaller than the pipe, the piping geometry factor Fp is applied to Cv.",
    setP: "PSV set pressure (gauge) — relieving pressure follows from it plus the allowable overpressure",
    overpressurePct: "Allowable overpressure: 10% single valve, 16% multiple valves, 21% fire case (API 520)",
    relievingP: "Absolute relieving pressure — computed automatically when the set pressure is given",
    backP: "Absolute backpressure (atmosphere = 0 gauge) — a conventional spring valve is limited to 10% of set",
    inletLossPct: "Non-recoverable inlet line loss, % of set pressure — API 520 limits it to 3%",
    Kd: "Effective discharge coefficient — 0.975 gas / 0.65 liquid assumed; enter the ASME-certified value",
    Kb: "Backpressure capacity factor — taken from the manufacturer curve for bellows valves",
    Kc: "Combination factor — 1 unless a rupture disk is installed upstream",
    T2: "Steam temperature after desuperheating — must stay above saturation at the station pressure",
    superheatIn: "Inlet superheated steam temperature — the steam table is valid to 550 °C",
    waterP: "Absolute injection water pressure — must exceed the station pressure to spray at all",
    waterT: "Spray water temperature — sets the water enthalpy and therefore the required flow",
    supplyP: "Upstream steam pressure of the letdown valve — also sizes the steam valve itself",
    dvP: "Nozzle/atomising pressure drop — the guideline value is used when left empty",
    stages: "Number of pressure-reduction stages — empty means auto from the pressure-ratio rule",
    drynessPct: "Inlet steam dryness fraction (100 = dry saturated) — condensate causes erosion on letdown",
    qualityPct: "Inlet vapour mass fraction (0 = liquid only, 100 = dry vapour). In flashing service this single number multiplies the required Cv",
    N: "HNE non-equilibrium factor (Sheldon–Schreuder style): 1 = full equilibrium, 1.4 default, up to 2 for long trims or severe flashing. The exact value is manufacturer test data",
    tpKd: "Effective throat discharge coefficient in the Cv↔area conversion. Default 1 = ideal orifice (optimistic); real trim is ≈ 0.85, which raises the required Cv by about 15%",
    MWtwoPhase: "Leave empty for water so the IAPWS steam table is used; for other fluids (propane, ethanol…) enter MW and the saturation curve is built from Clausius–Clapeyron",
    PvTwo: "Vapour pressure at the inlet temperature — it sets the flash onset and the ω reference point; take it equal to P1 for a saturated inlet",
    tpModelOmega: "Leung ω method (AIChE, API 520 appendix / IEC 60534-2-1): two-point and the most defensible choice — default",
    tpModelHem: "HEM: homogeneous equilibrium, numerical ∫v dp along the isentropic path — assumes full equilibrium so its Cv is a lower bound",
    tpModelHne: "HNE: the same HEM divided by the non-equilibrium factor N — closer to real flashing water",
    tpModelAdditive: "Simple Cv_liquid + Cv_gas sum — ignores flashing and throat mixture density; comparison only, not usable for design"
  },
  ar: { Q: "التدفق", W: "تدفق البخار", Gf: "الكثافة", Gg: "كثافة الغاز", P1: "الدخول", P2: "الخروج", Pv: "ضغط البخار", Pc: "الضغط الحرج", FL: "معامل الاسترداد", T: "الحرارة", Z: "الانضغاط", k: "الحرارة النوعية", xT: "الانسداد", nu: "اللزوجة الحركية بالسنتيستوك؛ في الجريان الصفائحي يُصحح Cv بمعامل FR.", pipeDn: "قطر الأنبوب (DN)؛ إذا كان الصمام أصغر يُطبَّق Fp." },
  ru: { Q: "Расход", W: "Расход пара", Gf: "Плотность", Gg: "Плотность газа", P1: "Вход", P2: "Выход", Pv: "Давление паров", Pc: "Крит. давление", FL: "Коэффициент", T: "Температура", Z: "Сжимаемость", k: "Показатель", xT: "Запирание", nu: "Кинематическая вязкость, сСт; при ламинарном потоке Cv корректируется коэффициентом FR.", pipeDn: "Диаметр трубы (DN); если клапан меньше, применяется Fp." }
};

function Field({ label, unit, unitGroups, onUnitChange, value, onChange, step, help, error, placeholder, required }) {
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
        {unitGroups && unitGroups.length > 0 ? (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            aria-label={label + " — unit"}
            title={label + " — unit"}
            style={{
              fontSize: 10, color: isError ? "#E81123" : "var(--text-soft)", fontFamily: "monospace",
              fontWeight: 800, padding: "2px 4px", borderRadius: 5,
              background: isError ? "rgba(232,17,35,0.08)" : "var(--bg-soft)",
              border: "1px solid var(--border)", whiteSpace: "nowrap", cursor: "pointer",
              // در ستارِ دو ستونهٔ موبایل، انتخابگر نباید سرریز کند
              maxWidth: "62%", minWidth: 0, flexShrink: 1,
              overflow: "hidden", textOverflow: "ellipsis"
            }}
          >
            {unitGroups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.units.map((item) => {
                  const u = typeof item === "string" ? { value: item, label: item } : item;
                  return <option key={u.value} value={u.value}>{u.label}</option>;
                })}
              </optgroup>
            ))}
          </select>
        ) : unit && (
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

// برچسب‌های واشر/راهنمای کارت نتیجهٔ حالت‌های سرویس
const SERVICE_LABELS_2 = {
  fa: {
    psvDisclaimer: "نتیجه بر پایهٔ API 520 بخش یکم و سلم اوریفیس API 526 است؛ Kd تأییدشدهٔ ASME و ظرفیت نهایی باید با سازنده نهایی شود.",
    desuperDisclaimer: "توازن آدیاباتیک تزریق آب با آنتالپی جدول بخار؛ طول نفوذ قطره، تعداد سوراخ لنس و محدودیت متریال بدنه دادهٔ سازنده است.",
    keLimitHint: "انرژی جنبشی خروجی بر پایهٔ ISA RP75.23 — کران راهنمای ۴۸۰ kW/m²",
    equivalentCv: "Cv معادل", reliefTsat: "اشباع", ratedNote: "ظرفیت اسمی"
  },
  en: {
    psvDisclaimer: "Result follows API 520 Part I with the API 526 orifice ladder; the ASME-certified Kd and the rated capacity must still be confirmed with the manufacturer.",
    desuperDisclaimer: "Adiabatic water-injection balance on steam-table enthalpies; droplet penetration length, lance hole count and body material limits remain vendor data.",
    keLimitHint: "Outlet kinetic energy per ISA RP75.23 — 480 kW/m² guideline limit",
    equivalentCv: "Equivalent Cv", reliefTsat: "Saturation", ratedNote: "Rated capacity"
  },
  ar: {
    psvDisclaimer: "النتيجة وفق API 520 الجزء الأول وسلم فتحات API 526؛ يجب تأكيد معامل التصريف المعتمد من ASME والسعة الاسمية لدى المصنّع.",
    desuperDisclaimer: "توازن حقن مائي كظوم على إنثالبي جداول البخار؛ طول اختراق القطرات وعدد ثقوب القاذبة وحدود مادة الجسم تبقى من بيانات المصنّع.",
    keLimitHint: "الطاقة الحركية بالمخرج وفق ISA RP75.23 — الحد الدلالي ٤٨٠ كيلوواط/م²",
    equivalentCv: "Cv المكافئ", reliefTsat: "التشبع", ratedNote: "السعة الاسمية"
  },
  ru: {
    psvDisclaimer: "Расчёт выполнен по API 520 Часть I с рядом сопел API 526; сертифицированный ASME Kd и номинальную способность нужно подтвердить у изготовителя.",
    desuperDisclaimer: "Адиабатический баланс впрыска воды по энтальпиям паровой таблицы; длина проникновения капель, число отверстий форсунки и ограничения материала корпуса — данные изготовителя.",
    keLimitHint: "Кинетическая энергия на выходе по ISA RP75.23 — ориентир 480 кВт/м²",
    equivalentCv: "Эквивалент Cv", reliefTsat: "Насыщение", ratedNote: "Номинальная способность"
  }
};

// خطاهای موتور دسوپرهیتر کلید ترجمه دارند؛ متن خام فقط fallback است.
// placeholderها با مقادیر errorParams پر می‌شوند تا عددهای واقعی دیده شوند.
const DESUPER_ERROR_I18N = {
  fa: {
    steamFlow: "دبی بخار باید بزرگ‌تر از صفر باشد.",
    stationPressure: "فشار ایستگاه P1 باید بزرگ‌تر از صفر باشد.",
    temperaturesRequired: "دمای بخار ورودی و دمای هدف را وارد کنید.",
    tablePressure: "فشار P1 = {P1} bar بیرون از دامنهٔ جدول بخار (۰٫۰۲ تا ۴۰ bar مطلق) است.",
    inletNotSuperheated: "بخار ورودی در {T1} °C و {P1} bar سوپرهیت نیست یا بیرون از جدول بخار است؛ دمای ورودی باید بالای دمای اشباع باشد.",
    targetAboveInlet: "دمای هدف {T2} °C باید کمتر از دمای بخار ورودی {T1} °C باشد.",
    targetBelowSaturation: "دمای هدف {T2} °C پایین‌تر از نقطهٔ اشباع {tsat} °C در فشار P1 است؛ آب تزریق‌شده تبخیر نمی‌شود و بخار تر/باران تولید می‌شود. T2 را دست‌کم ۵ تا ۱۵ °C بالای اشباع بگیرید.",
    targetOutOfTable: "دمای هدف {T2} °C بیرون از دامنهٔ جدول بخار است.",
    waterTemperature: "دمای آب {waterT} °C بیرون از دامنهٔ جدول آب (۲۰ تا ۵۵۰ °C) است.",
    waterEnthalpy: "آنتالپی آب تزریق‌شده از آنتالپی بخار خروجی بیشتر است؛ دمای آب و دمای هدف را بررسی کنید."
  },
  en: {
    steamFlow: "Steam flow must be greater than zero.",
    stationPressure: "Station pressure P1 must be greater than zero.",
    temperaturesRequired: "Enter both the inlet steam temperature and the target temperature.",
    tablePressure: "P1 = {P1} bar is outside the steam-table range (0.02–40 bar abs).",
    inletNotSuperheated: "Inlet steam at {T1} °C / {P1} bar is not superheated (or outside the table); the inlet temperature must be above saturation.",
    targetAboveInlet: "Target temperature {T2} °C must be below the inlet steam temperature {T1} °C.",
    targetBelowSaturation: "Target {T2} °C is below saturation {tsat} °C at P1 — injected water cannot evaporate and the line will carry wet steam. Keep T2 at least 5–15 °C above saturation.",
    targetOutOfTable: "Target temperature {T2} °C is outside the steam-table range.",
    waterTemperature: "Water temperature {waterT} °C is outside the water-table range (20–550 °C).",
    waterEnthalpy: "Injected-water enthalpy exceeds the outlet steam enthalpy; check the water temperature and target temperature."
  },
  ar: {
    steamFlow: "يجب أن يكون تدفق البخار أكبر من الصفر.",
    stationPressure: "يجب أن يكون ضغط المحطة P1 أكبر من الصفر.",
    temperaturesRequired: "أدخل درجة حرارة البخار الداخل ودرجة الحرارة الهدف.",
    tablePressure: "الضغط P1 = {P1} bar خارج نطاق جدول البخار (٠٫٠٢ إلى ٤٠ bar مطلق).",
    inletNotSuperheated: "البخار الداخل عند {T1} °C و {P1} bar ليس محمّصًا أو خارج الجدول؛ يجب أن تكون حرارة الدخول أعلى من التشبع.",
    targetAboveInlet: "درجة الحرارة الهدف {T2} °C يجب أن تكون أقل من حرارة البخار الداخل {T1} °C.",
    targetBelowSaturation: "الحرارة الهدف {T2} °C أقل من التشبع {tsat} °C عند P1 — الماء المحقون لا يتبخر وسيظهر بخار رطب. أبقِ T2 أعلى من التشبع بـ ٥ إلى ١٥ °C على الأقل.",
    targetOutOfTable: "درجة الحرارة الهدف {T2} °C خارج نطاق جدول البخار.",
    waterTemperature: "حرارة الماء {waterT} °C خارج نطاق جدول الماء (٢٠ إلى ٥٥٠ °C).",
    waterEnthalpy: "إنثالبي الماء المحقون أعلى من إنثالبي البخار الخارج؛ راجع حرارة الماء والحرارة الهدف."
  },
  ru: {
    steamFlow: "Расход пара должен быть больше нуля.",
    stationPressure: "Давление станции P1 должно быть больше нуля.",
    temperaturesRequired: "Введите температуру входящего пара и целевую температуру.",
    tablePressure: "P1 = {P1} bar вне диапазона паровой таблицы (0,02–40 bar абс.).",
    inletNotSuperheated: "Входной пар при {T1} °C / {P1} bar не перегрет (или вне таблицы); температура входа должна быть выше насыщения.",
    targetAboveInlet: "Целевая температура {T2} °C должна быть ниже температуры входящего пара {T1} °C.",
    targetBelowSaturation: "Целевая температура {T2} °C ниже насыщения {tsat} °C при P1 — впрыснутая вода не испарится, пар станет влажным. Держите T2 минимум на 5–15 °C выше насыщения.",
    targetOutOfTable: "Целевая температура {T2} °C вне диапазона паровой таблицы.",
    waterTemperature: "Температура воды {waterT} °C вне диапазона водяной таблицы (20–550 °C).",
    waterEnthalpy: "Энтальпия впрыснутой воды выше энтальпии выходного пара; проверьте температуру воды и целевую температуру."
  }
};

function desuperErrorText(result, locale) {
  const table = DESUPER_ERROR_I18N[locale] || DESUPER_ERROR_I18N.en;
  const tpl = result.errorKey ? table[result.errorKey] : null;
  if (!tpl) return result.error;
  return tpl.replace(/\{(\w+)\}/g, (m, key) => {
    const v = result.errorParams ? result.errorParams[key] : null;
    return v == null ? m : String(v);
  });
}

// کارت نتیجهٔ حالت‌های سرویس: خروجی PSV و دسوپرهیتر شکل سایزینگ شیر کنترل
// (Cv/سایز/بازشدگی) را ندارد — اوریفیس و ظرفیت تخلیه یا دبی آب تزریق را می‌دهد.
function ServiceResult({ result, L, onShare, onReport }) {
  const [showNotes, setShowNotes] = useState(false);
  const isPsv = result.mode === "psv";
  const orifice = result.requiredOrifice || {};

  return (
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
        <span style={{ fontSize: 11, lineHeight: 1.7 }}>{isPsv ? L.psvDisclaimer : L.desuperDisclaimer}</span>
      </div>

      <motion.div
        key={result.timestamp}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="result-hero-card"
      >
        <div className="result-hero-label">{isPsv ? L.orifice : L.waterFlow}</div>
        <div className="result-hero-value">
          {isPsv ? (orifice.letter || "—") : result.waterFlowKgH}
          {!isPsv && <span style={{ fontSize: 14, fontWeight: 800 }}> kg/h</span>}
        </div>
        <div className="result-hero-sub">
          {isPsv
            ? result.areaCm2 + " cm² · " + result.areaIn2 + " in²" +
              (orifice.designations ? " · " + orifice.designations.join(" / ") : "") +
              (orifice.dn ? " · " + orifice.dn.inlet + "×" + orifice.dn.outlet : "")
            : result.waterFlowLMin + " L/min · " + (result.waterToSteamRatio * 100).toFixed(1) + "% " + L.sprayRatio}
        </div>

        <div className="result-hero-grid">
          {isPsv ? (
            <>
              <div className="result-hero-mini">
                <div className="result-mini-label">{L.orificeCapacity}</div>
                <div className="result-mini-value gold">{result.capacityKgH == null ? "—" : result.capacityKgH}</div>
                <div className="result-mini-meta">kg/h</div>
              </div>
              <div className="result-hero-mini">
                <div className="result-mini-label">{L.utilisation}</div>
                <div className={"result-mini-value " + (result.utilisation > 1 ? "amber" : "green")}>
                  {result.utilisation == null ? "—" : Math.round(result.utilisation * 100) + "%"}
                </div>
                <div className="opening-bar">
                  <div className="opening-fill" style={{
                    width: Math.min(100, result.utilisation == null ? 0 : result.utilisation * 100) + "%",
                    background: result.utilisation != null && result.utilisation > 1 ? "#E81123" : "linear-gradient(90deg, #E0A81A, #B8850A)"
                  }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="result-hero-mini">
                <div className="result-mini-label">{L.injectionCv}</div>
                <div className="result-mini-value gold">{result.waterCv == null ? "—" : result.waterCv}</div>
                <div className="result-mini-meta">{result.waterValveSize || "—"}</div>
              </div>
              <div className="result-hero-mini">
                <div className="result-mini-label">{L.satMargin}</div>
                <div className={"result-mini-value " + (result.saturationMarginC > 10 ? "green" : "amber")}>
                  {result.saturationMarginC == null ? "—" : result.saturationMarginC + " °C"}
                </div>
                <div className="result-mini-meta">{L.reliefTsat}: {result.saturationTempC} °C</div>
              </div>
            </>
          )}
        </div>

        <div className="result-hero-metrics">
          {isPsv ? (
            <>
              <div className="hero-metric">
                <Gauge size={12} />
                <span className="hero-metric-label">{L.relievingP}</span>
                <span className="hero-metric-value">{result.P1RelievingBar} bar</span>
              </div>
              <div className="hero-metric">
                <Activity size={12} />
                <span className="hero-metric-label">{L.flowRegime}</span>
                <span className="hero-metric-value">
                  {result.flowRegime} · {result.criticalRatio != null ? "rc " + result.criticalRatio : "—"}
                </span>
              </div>
              <div className="hero-metric">
                <ShieldAlert size={12} />
                <span className="hero-metric-label">Kd / Kb / Kc</span>
                <span className="hero-metric-value">{result.Kd} / {result.Kb} / {result.Kc}</span>
              </div>
              {result.C != null && (
                <div className="hero-metric">
                  <BarChart3 size={12} />
                  <span className="hero-metric-label">C</span>
                  <span className="hero-metric-value">{result.C}</span>
                </div>
              )}
              {result.F2 != null && (
                <div className="hero-metric">
                  <BarChart3 size={12} />
                  <span className="hero-metric-label">F2</span>
                  <span className="hero-metric-value">{result.F2}</span>
                </div>
              )}
              <div className="hero-metric" title={L.crossCheck}>
                <Activity size={12} />
                <span className="hero-metric-label">{L.equivalentCv}</span>
                <span className="hero-metric-value">{result.equivalentCv} / Kv {result.equivalentKv}</span>
              </div>
            </>
          ) : (
            <>
              <div className="hero-metric">
                <Thermometer size={12} />
                <span className="hero-metric-label">{L.superheatIn}</span>
                <span className="hero-metric-value">+{result.superheatInC} °C</span>
              </div>
              <div className="hero-metric">
                <Thermometer size={12} />
                <span className="hero-metric-label">{L.superheatOut}</span>
                <span className="hero-metric-value">+{result.superheatOutC} °C</span>
              </div>
              <div className="hero-metric">
                <Flame size={12} />
                <span className="hero-metric-label">{L.duty}</span>
                <span className="hero-metric-value">{result.dutyKW} kW</span>
              </div>
              <div className="hero-metric">
                <Droplets size={12} />
                <span className="hero-metric-label">{L.waterDpLabel}</span>
                <span className="hero-metric-value">
                  {result.waterValveDPBar == null ? "—" : result.waterValveDPBar + " bar"}
                </span>
              </div>
              <div className="hero-metric">
                <Droplets size={12} />
                <span className="hero-metric-label">{L.waterDpAfterNozzle}</span>
                <span className="hero-metric-value">{result.atomizingDPBar} bar</span>
              </div>
              {result.steamCv != null && (
                <div className="hero-metric">
                  <Gauge size={12} />
                  <span className="hero-metric-label">{L.steamValveCv}</span>
                  <span className="hero-metric-value">
                    Cv {result.steamCv}{result.steamValve && result.steamValve.size ? " · " + result.steamValve.size.size : ""}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <div className="result-actions-row">
        <button onClick={onReport} className="result-action-btn">
          <FileText size={14} /> {L.report}
        </button>
        <button onClick={onShare} className="result-action-btn">
          <Share2 size={14} /> {L.share}
        </button>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="result-warnings no-print">
          {result.warnings.map((w, i) => (
            <div key={i} className={"warning-chip " + w.type} role={w.type === "danger" ? "alert" : "note"}>
              {w.type === "info" ? <Info size={12} /> : <AlertTriangle size={12} />}
              <span>{w.text}</span>
            </div>
          ))}
        </div>
      )}

      {result.notes && result.notes.length > 0 && (
        <div className="sizing-card" style={{ padding: 0, overflow: "hidden", marginTop: 10 }}>
          <button onClick={() => setShowNotes(!showNotes)} className="collapse-btn">
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
              <HelpCircle size={14} /> {L.engineNotes} ({result.notes.length})
            </span>
            <ChevronDown size={14} style={{ transform: showNotes ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--text-muted)" }} />
          </button>
          {showNotes && (
            <ul style={{ margin: 0, padding: "0 16px 14px 16px", display: "grid", gap: 6, listStyle: "none" }}>
              {result.notes.map((n, i) => (
                <li key={i} dir="ltr" style={{ fontSize: 10.5, lineHeight: 1.7, color: "var(--text-soft)", fontWeight: 600, textAlign: "left" }}>
                  • {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export default function SizingTool({ catalog = [], cvTables = {} }) {
  const { locale } = useDictionary();
  const [fluid, setFluid] = useState("liquid");
  // حالت محاسبه: شیر کنترل یا سرویس تخصصی (PSV / دسوپرهیتر / لت‌داون / دو‌فازی)
  const [mode, setMode] = useState("control");
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
  // پارامترهای بازیابی‌شده از پیوند مشترک (سری/سایز انتخابی در URL)
  const [sharedSeries, setSharedSeries] = useState(null);
  const [seriesProfile, setSeriesProfile] = useState(null);
  // سیال انتخابشده در ویزارد، پیش از بهروزرسانی state در همین رفرنس نگه داشته میشود
  const wizardFluidRef = useRef(null);

  const help = useMemo(() => {
    const t = FLOW_I18N[locale] || FLOW_I18N.en;
    return Object.assign({}, FIELD_HELP[locale] || FIELD_HELP.en, { Q: t.qHelp, MW: t.mwHelp });
  }, [locale]);
  // فیلدهای بی‌بعد مثل Gf، Z، FL و xT واحد فیزیکی ندارند؛ برچسب «نسبت» گویاتر از «—» است.
  const ratioUnit = { fa: "نسبت", en: "ratio", ar: "نسبة", ru: "отн." }[locale] || "ratio";
  const sys = SYSTEMS[unitSystem];
  const isFa = locale === "fa";

  // دبی: واحد انتخابی کاربر (یا پیشفرض سیستم/سیال) و گروههای واحد برای UI
  const qUnit = form.QUnit || defaultFlowUnit(unitSystem, fluid);
  const wUnit = form.WUnit || sys.flowMass || sys.flowSteam;
  const qUnitGroups = useMemo(() => localizeUnitGroups(flowUnitGroups(fluid), locale), [fluid, locale]);
  const wUnitGroups = useMemo(() => localizeUnitGroups(flowUnitGroups("steam"), locale), [locale]);

  // واحد مستقل هر فیلد (مثل Q) — انتخاب صریح کاربر وگرنه پیشفرض سیستم
  const fieldUnits = useMemo(() => {
    const map = {};
    for (const field of Object.keys(FIELD_UNIT_CATEGORY)) map[field] = fieldUnit(form, field, unitSystem);
    return map;
  }, [form, unitSystem]);
  // props انتخابگر واحد یک فیلد برای <Field>
  const unitProps = (field) => ({
    unit: fieldUnits[field],
    unitGroups: categoryUnitGroups(FIELD_UNIT_CATEGORY[field], locale),
    onUnitChange: (u) => changeFieldUnit(field, u)
  });

  // هر حالت محاسبه مجموعه فیلد و سیال مخصوص خودش را می‌خواهد
  const isPsv = mode === "psv";
  const isDesuper = mode === "desuper";
  const isLetdown = mode === "letdown";
  const isTwoPhase = mode === "twoPhase";
  // دسوپرهیتر و PSVِ بخار/گاز و سایزینگ دو‌فازی دبی جرمی می‌خواهند
  const needMass = isDesuper || isTwoPhase || fluid === "steam" || (isPsv && fluid !== "liquid");
  // فرم SI (ورودی موتور) — همهٔ محاسبات از این نسخه استفاده میکنند
  const siForm = useMemo(() => formToSI(form, unitSystem, fluid), [form, unitSystem, fluid]);

  // راهنمای زندهٔ ایستگاه دی‌سوپرهیتر: اشباع، حداقل دمای هدف، حاشیهٔ فعلی و
  // افت فشارهای سمت آب — همان چهار عددی که پیش از محاسبه از خطا جلوگیری می‌کنند.
  const desuperGuide = useMemo(() => {
    if (!isDesuper) return null;
    const p1 = opt(siForm.P1);
    const tsatRaw = p1 ? saturationTempC(p1) : null;
    const tsat = typeof tsatRaw === "number" ? tsatRaw : null;
    const t2 = opt(siForm.T2);
    const waterP = opt(siForm.waterP);
    const atomizingDp = p1 ? Math.max(ATOMIZING_DP_DEFAULT_BAR, ATOMIZING_DP_FRACTION * p1) : null;
    const waterAvailable = waterP != null && p1 != null ? waterP - p1 : null;
    const valveDp = waterAvailable != null && atomizingDp != null ? waterAvailable - atomizingDp : null;
    return {
      tsat: tsat != null ? +tsat.toFixed(1) : null,
      minTarget: tsat != null ? +(tsat + NEAR_SATURATION_REJECT_C).toFixed(1) : null,
      margin: tsat != null && t2 != null ? +(t2 - tsat).toFixed(1) : null,
      waterAvailable: waterAvailable != null ? +waterAvailable.toFixed(2) : null,
      valveDp: valveDp != null ? +valveDp.toFixed(2) : null,
      atomizingDp: atomizingDp != null ? +atomizingDp.toFixed(2) : null
    };
  }, [isDesuper, siForm.P1, siForm.T2, siForm.waterP]);
  // تبدیل دبی جرمی↔حجمی با چگالیِ واحد-موتوری انجام میشود
  const densityCtx = { Gf: siForm.Gf, MW: siForm.MW, Gg: siForm.Gg };

  // موتور دو‌فازی منبع منحنی اشباع را از MW انتخاب می‌کند (۱۷ < MW < ۱۹ ⇒ جدول
  // بخار IAPWS، وگرنه Clausius–Clapeyron). یک MWِ مانده از حالت گاز، سرویس آب
  // را بی‌صدا از جدول خارج می‌کند ⇒ همان‌جا که وارد می‌شود اعلام می‌گردد.
  const tpMw = opt(siForm.MW);
  const tpUsesSteamTable = tpMw == null || (tpMw > 17 && tpMw < 19);


  // افت فشار: در SI محاسبه و به واحد نمایشی تبدیل میشود؛ اگر P1 و P2 واحد متفاوتی
  // داشته باشند ΔP در bar نشان داده میشود تا گمراه‌کننده نباشد
  // (در ایستگاه دسوپرهیت P2 معنا ندارد و فشار ایستگاه همان P1 است)
  const dpUnit = fieldUnits.P1 === fieldUnits.P2 ? fieldUnits.P1 : "bar";
  const dP = mode !== "desuper" && siForm.P1 != null && siForm.P2 != null
    ? +barToPressure(siForm.P1 - siForm.P2, dpUnit).toFixed(3)
    : 0;

  // واحدهای نمایشی نتایج (گزارش، CSV، PDF) — بر پایهٔ واحد فیلد ورودی
  const displayUnits = useMemo(() => ({
    flow: fluid === "steam" ? wUnit : qUnit,
    pressure: fieldUnits.P1,
    temp: fieldUnits.T,
    velocity: sys.velocity,
    field: fieldUnits,
    dp: dP,
    dpUnit
  }), [fluid, qUnit, wUnit, fieldUnits, sys.velocity, dP, dpUnit]);

  // واحدهای SI موتور — نمودارها همیشه با SI رسم میشوند و محورها همین برچسب را دارند
  const siEngineUnits = useMemo(() => ({
    flow: fluid === "gas" ? "Nm3/h" : "m3/h",
    pressure: "bar",
    velocity: "m/s"
  }), [fluid]);

  const errors = useMemo(
    () => Object.assign(
      {},
      validateForm(siForm, fluid, locale, mode),
      validateFlowInputs(form, fluid, locale, unitSystem, mode)
    ),
    [siForm, form, fluid, locale, unitSystem, mode]
  );
  const hasErrors = Object.keys(errors).length > 0;

  const topProduct = useMemo(() => {
    if (!result || !result.Cv) return null;

    // سری پیش‌انتخاب‌شده از پیوند مشترک (series=...) — اگر در کاتالوگ Cv باشد
    // شکل جداول Cv می‌تواند ساده یا پوشیده با کلید series باشد (همان انعطاف valve-catalog)
    const seriesTables =
      cvTables?.series && typeof cvTables.series === "object" ? cvTables.series : cvTables;
    if (sharedSeries?.series && seriesTables?.[sharedSeries.series]) {
      const forced = pickSeriesValve(seriesTables, sharedSeries.series, result.Cv, sharedSeries.dn);
      const product = catalog.find((p) => String(p.series) === String(sharedSeries.series));
      if (forced && product) {
        return {
          product,
          matchedSize: { dn: forced.dn, cv: forced.cv, size: forced.dn },
          openingPercent: forced.openingPercent,
          characteristic: forced.characteristic,
          curveBased: true,
          withinMargin: forced.openingPercent <= 80,
          nps: forced.nps,
          source: forced.source || "catalog",
          confidence: forced.confidence || null,
          errorPct: typeof forced.errorPct === "number" ? forced.errorPct : null,
          forced: true,
          insufficient: forced.insufficient,
          dnMatched: forced.dnMatched
        };
      }
    }

    const fromCatalog = selectCatalogValve(result.Cv, catalog, cvTables);
    if (fromCatalog) {
      return {
        product: fromCatalog.product,
        matchedSize: { dn: fromCatalog.dn, cv: fromCatalog.cv, size: fromCatalog.dn },
        openingPercent: fromCatalog.openingPercent,
        characteristic: fromCatalog.characteristic,
        curveBased: fromCatalog.curveBased,
        withinMargin: fromCatalog.withinMargin,
        nps: fromCatalog.nps,
        source: fromCatalog.source || "catalog",
        confidence: fromCatalog.confidence || null,
        errorPct: typeof fromCatalog.errorPct === "number" ? fromCatalog.errorPct : null
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
      characteristic: result.recommendedCharacteristic || null,
      curveBased: false,
      withinMargin: null,
      nps: null,
      source: "generic"
    };
  }, [result, catalog, cvTables, sharedSeries]);

  useEffect(() => { setSaved(loadScenarios()); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // اولویت با پیوند مشترک است؛ اگر پارامتری در URL نبود به localStorage برمی‌گردیم
    try {
      const shared = parseSizingParams(window.location.search);
      if (shared.hasParams) {
        setFluid(shared.fluid);
        setMode(shared.mode);
        setUnitSystem(shared.unitSystem);
        setForm(Object.assign({}, DEFAULT_FORM, shared.form));
        if (shared.series) {
          setSharedSeries({ series: shared.series, dn: shared.dn });
          // پروفایل ضرایب سری (FL/xT تیپیکال) روی فرم اعمال می‌شود
          const profile = getSeriesProfile(shared.series);
          if (profile) {
            setForm((f) => Object.assign({}, f, { FL: profile.fl, xT: profile.xT }));
            setSeriesProfile(profile);
          }
        }
        setHasInteracted(true);
        return;
      }
    } catch (e) {}
    try {
      const savedData = localStorage.getItem("psm_sizing_form");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.form) setForm(Object.assign({}, DEFAULT_FORM, parsed.form));
        if (parsed.fluid) setFluid(parsed.fluid);
        if (SIZING_MODES.includes(parsed.mode)) setMode(parsed.mode);
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
          form, fluid, mode, unitSystem, selectedFluidName
        }));
      } catch (e) {}
    }, 500);
    return () => clearTimeout(t);
  }, [form, fluid, mode, unitSystem, selectedFluidName]);

  useEffect(() => {
    if (!autoCalc || !hasInteracted || hasErrors) return;
    const t = setTimeout(() => { runCalculation(false); }, 400);
    return () => clearTimeout(t);
  }, [form, fluid, mode, autoCalc, hasInteracted, hasErrors]);

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

  // تغییر نوع سیال: فرم با پیش‌فرض‌های نمایندهٔ آن دسته پر می‌شود، مگر همان سیال باشد
  function selectFluid(next) {
    setHasInteracted(true);
    if (next === fluid) return;
    setFluid(next);
    setSelectedFluidName(null);
    setForm(Object.assign({}, form, fluidTypeDefaults(next), { QUnit: null, WUnit: null }));
  }

  // دسوپرهیتر فقط بخار است و لت‌داون فقط گاز/بخار؛ در ورود به این حالت‌ها سیال اصلاح می‌شود
  // دو‌فازی «مایع + بخار» است: فاز پیوسته از دید موتور مایع است، پس سیال قفل روی مایع
  function changeMode(next) {
    setHasInteracted(true);
    if (next === mode) return;
    setMode(next);
    if (next === "desuper" && fluid !== "steam") selectFluid("steam");
    else if (next === "letdown" && fluid === "liquid") selectFluid("gas");
    else if (next === "twoPhase" && fluid !== "liquid") selectFluid("liquid");
  }

  // ورودی موتورهای سرویس از فرم واحد-موتوری (SI) ساخته میشود.
  // فیلد خالی باید undefined بماند نه ۰، وگرنه پیشفرض خودِ موتور از کار می‌افتد.
  function opt(v) {
    return v == null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v);
  }

  function psvInputs() {
    const gg = siForm.MW != null && Number(siForm.MW) > 0 ? ggFromMW(siForm.MW) : siForm.Gg;
    const isLiquid = fluid === "liquid";
    return {
      fluidType: fluid,
      W: isLiquid ? undefined : opt(siForm.W),
      Q: isLiquid ? opt(siForm.Q) : undefined,
      G: opt(siForm.Gf),
      M: isLiquid ? undefined : (opt(siForm.MW) != null ? opt(siForm.MW) : (gg != null ? mwFromGg(gg) : undefined)),
      k: isLiquid ? undefined : opt(siForm.k),
      Z: isLiquid ? undefined : opt(siForm.Z),
      // فشار تنظیم گیج است؛ اگر داده نشود P1 مطلق مستقیم خوانده میشود
      setPressureBar: opt(siForm.setP),
      overpressurePct: opt(siForm.overpressurePct),
      P1: opt(siForm.P1),
      backPressureBar: opt(siForm.P2),
      T: siForm.T != null ? Number(siForm.T) + 273.15 : undefined,
      Kd: opt(siForm.Kd),
      Kb: opt(siForm.Kb),
      Kc: opt(siForm.Kc),
      balanced: Boolean(siForm.balanced),
      inletLossPct: opt(siForm.inletLossPct)
    };
  }

  function desuperInputs() {
    return {
      steamFlowKgH: opt(siForm.W),
      P1Bar: opt(siForm.P1),
      T1C: opt(siForm.T),
      T2TargetC: opt(siForm.T2),
      waterPBar: opt(siForm.waterP),
      waterTC: opt(siForm.waterT),
      waterGf: opt(siForm.waterGf),
      dvPBar: opt(siForm.dvP),
      steamSupplyPBar: opt(siForm.supplyP),
      atomizing: siForm.atomizing !== false
    };
  }

  function letdownInputs(ggEff) {
    return {
      fluid: fluid === "steam" ? "steam" : "gas",
      W: opt(siForm.W),
      Q: opt(siForm.Q),
      P1: opt(siForm.P1),
      P2: opt(siForm.P2),
      T1: opt(siForm.T),
      MW: opt(siForm.MW),
      Gg: ggEff,
      k: opt(siForm.k),
      Z: opt(siForm.Z),
      stages: opt(siForm.stages),
      pipeDn: opt(siForm.pipeDn),
      dryness: siForm.drynessPct != null ? Number(siForm.drynessPct) / 100 : undefined
    };
  }

  // چگالی بخار در ورودی (kg/m³) — موتور دو‌فازی آن را می‌خواهد، کاربر نه.
  // برای آب/بخار از جدول بخار در همان حالتی گرفته می‌شود که مخلوط دو‌فازی در آن
  // است (بخار اشباع در P1)؛ خارج از دامنهٔ جدول یا برای سیال غیرآب، گاز ایده‌آل
  // با MW/Z و دمای ورودی. منبع در «yادداشت» نتیجه اعلام می‌شود تا حدس نباشد.
  function vapourDensity(p1Bar, tC, mw, z) {
    if (!(p1Bar > 0)) return null;
    const isWaterish = mw == null || (mw > 17 && mw < 19);
    if (isWaterish) {
      const tsat = saturationTempC(p1Bar);
      if (typeof tsat === "number") {
        const rho = steamDensity(p1Bar, tsat + 0.5); // بخار اشباع (نیم درجه سوپرهیت برای عبور از آزمون جدول)
        if (typeof rho === "number" && rho > 0) {
          return { rhoG: +rho.toFixed(3), source: "steam table (saturated vapour at P1)" };
        }
      }
    }
    const m = mw != null && mw > 0 ? Number(mw) : 18.015;
    const zz = z != null && z > 0 ? Number(z) : 1;
    const tk = (tC != null && Number.isFinite(Number(tC)) ? Number(tC) : (isWaterish && typeof saturationTempC(p1Bar) === "number" ? saturationTempC(p1Bar) : 100)) + 273.15;
    const rho = (p1Bar * 1e5 * (m / 1000)) / (zz * 8.314 * tk);
    return rho > 0 ? { rhoG: +rho.toFixed(3), source: "ideal gas at inlet T with MW/Z" } : null;
  }

  function twoPhaseInputs(vd) {
    const gf = opt(siForm.Gf);
    const rhoL = gf != null ? +(gf * 999).toFixed(1) : undefined; // Gf نسبی → kg/m³ (۹۹۹ = آب ۶۰°F)
    const vap = vd || vapourDensity(siForm.P1, siForm.T, siForm.MW, siForm.Z);
    return {
      model: TWO_PHASE_MODELS.includes(siForm.tpModel) ? siForm.tpModel : "omega",
      W: opt(siForm.W),
      x: siForm.qualityPct != null ? Number(siForm.qualityPct) / 100 : undefined,
      P1: opt(siForm.P1),
      P2: opt(siForm.P2),
      rhoL,
      rhoG: vap ? vap.rhoG : undefined,
      T: opt(siForm.T),
      Pv: opt(siForm.Pv),
      Pc: opt(siForm.Pc),
      MW: opt(siForm.MW),
      Z: opt(siForm.Z),
      k: opt(siForm.k),
      N: opt(siForm.N),
      Kd: opt(siForm.tpKd),
      FL: opt(siForm.FL),
      xT: opt(siForm.xT)
    };
  }

  function runCalculation(userInitiated = false) {
    if (hasErrors) return;
    // دکمهٔ محاسبه در موبایل باید کاربر را به تب نتیجه ببرد؛ محاسبهٔ زندهٔ
    // خودکار نباید وسط تایپ فرم را پنهان کند.
    if (userInitiated) setMobileTab("result");
    // siForm از memo بالای کامپوننت میآید: هر واحد (حجمی/جرمی) به واحد موتور تبدیل شده است
    const ggEff = siForm.MW != null && Number(siForm.MW) > 0 ? ggFromMW(siForm.MW) : siForm.Gg;

    if (mode === "psv" || mode === "desuper") {
      const data = mode === "psv" ? calcPsvCv(psvInputs()) : calcDesuperheater(desuperInputs());
      if (!data) return;
      // errorKey/errorParams برای ترجمهٔ پیام موتور در UI حفظ می‌شود
      if (data.error) {
        setResult({ error: data.error, errorKey: data.errorKey, errorParams: data.errorParams, mode });
        return;
      }
      setResult(Object.assign({}, data, {
        mode,
        fluidType: fluid,
        warnings: (data.warnings || []).map((w) => Object.assign({}, w, { engineText: w.text, text: warningText(w, locale, mode) })),
        timestamp: Date.now(),
        formSI: siForm
      }));
      setShowMore(false);
      track.calculationDone({ fluid, mode });
      return;
    }

    let r;
    if (mode === "twoPhase") {
      // موتور دو‌فازی خودش Cv و سایز می‌دهد؛ بقیهٔ مسیر (حاشیه، بازشدگی،
      // تطبیق محصول) مشترک با شیر کنترل است
      const vap = vapourDensity(siForm.P1, siForm.T, siForm.MW, siForm.Z);
      const tpIn = twoPhaseInputs(vap);
      const tp = calcTwoPhaseCv(tpIn);
      if (tp.error) { setResult({ error: tp.error }); return; }
      const cmp = compareTwoPhaseModels(tpIn);
      r = Object.assign({}, tp, {
        // مقایسهٔ مدل‌ها فقط وقتی معنا دارد که هر چهار مدل اجرا شده باشند
        twoPhase: cmp.error ? null : cmp,
        // سرعت مخلوط در بدنه — همان بدنهٔ مشترک نتایج کنترل
        velocity: tp.outletVelocityMps,
        // منبع عدد بخار: کاربر آن را وارد نکرده، پس باید در گزارش دیده شود
        vapourSource: vap ? vap.source : null,
        vapourDensityKgM3: vap ? vap.rhoG : null,
        flashing: tpIn.Pv != null && tpIn.P2 < tpIn.Pv
      });
    } else if (fluid === "liquid") {
      r = calcLiquidCv({ Q: siForm.Q, Gf: siForm.Gf, P1: siForm.P1, P2: siForm.P2, Pv: siForm.Pv, Pc: siForm.Pc, FL: siForm.FL, nu: siForm.nu, pipeDnMm: siForm.pipeDn });
    } else if (fluid === "steam") {
      r = calcSteamCv({ W: siForm.W, P1: siForm.P1, P2: siForm.P2, T: siForm.T, pipeDnMm: siForm.pipeDn });
    } else {
      r = calcGasCv({ Q: siForm.Q, Gg: ggEff, T: siForm.T, P1: siForm.P1, P2: siForm.P2, Z: siForm.Z, k: siForm.k, xT: siForm.xT, pipeDnMm: siForm.pipeDn });
    }
    if (r.error) { setResult({ error: r.error }); return; }

    // لت‌داون: Cv از موتور مشترک گاز/بخار می‌آید؛ بررسی‌های مخصوص ایستگاه
    // (مراحل کاهش فشار، ماخ تریم/فلنج، انرژی جنبشی RP75.23) روی آن سوار میشود
    if (mode === "letdown") {
      const ld = calcLetdown(letdownInputs(ggEff));
      if (ld.error) { setResult({ error: ld.error }); return; }
      r = Object.assign({}, r, ld.delegate || {}, { Cv: ld.Cv, Kv: ld.Kv, size: ld.size, letdown: ld });
    }

    // حاشیهٔ طراحی: Cv نهایی = Cv محاسبه‌شده × (1 + margin/100)
    const marginPct = Number(siForm.marginPct) > 0 ? Number(siForm.marginPct) : 0;
    if (marginPct > 0) {
      r.rawCv = r.Cv;
      r.marginPct = marginPct;
      r.Cv = +(r.Cv * (1 + marginPct / 100)).toFixed(2);
      r.Kv = +(r.Cv / 1.156).toFixed(2);
      r.size = cvToSize(r.Cv);
      r.capacityExceeded = r.size.capacityExceeded;
      // سرعت/ماخ بازمحاسبه میشوند تا هشدارها با سایز نهایی (نه پیش از حاشیه) بسازند
      const newVelocity = bodyVelocity(r.qActualM3h, r.size);
      if (newVelocity != null) {
        if (r.mach != null && r.velocity > 0) {
          r.mach = +(r.mach * (newVelocity / r.velocity)).toFixed(3);
        }
        r.velocity = newVelocity;
      }
    }

    const openingPercent = Math.min(100, Math.round((r.Cv / r.size.cv) * 100));

    // سایزینگ دو-نقطه‌ای: بررسی کنترل‌پذیری در دبی مینیمم (turndown)
    // در حالت دو‌فازی این مسیر رد می‌شود: معادلهٔ تک‌فازی برای جریان فلاش‌کننده
    // اعتبار ندارد و عدد CvMin گمراه‌کننده می‌شد
    if (mode !== "twoPhase" && fluid !== "steam" && siForm.QMin != null && siForm.QMin > 0 && siForm.QMin < siForm.Q) {
      let rMin;
      if (fluid === "liquid") {
        rMin = calcLiquidCv({ Q: siForm.QMin, Gf: siForm.Gf, P1: siForm.P1, P2: siForm.P2, Pv: siForm.Pv, Pc: siForm.Pc, FL: siForm.FL, nu: siForm.nu, pipeDnMm: siForm.pipeDn });
      } else {
        rMin = calcGasCv({ Q: siForm.QMin, Gg: ggEff, T: siForm.T, P1: siForm.P1, P2: siForm.P2, Z: siForm.Z, k: siForm.k, xT: siForm.xT, pipeDnMm: siForm.pipeDn });
      }
      if (!rMin.error) {
        const cvSel = Math.max(r.size.cv, r.Cv);
        r.CvMin = rMin.Cv;
        r.openingMin = Math.round((rMin.Cv / cvSel) * 100);
      }
    }

    const warnings = (mode === "twoPhase"
      // در حالت دو‌فازی خفگی/سرعت/فلاشینگ را خودِ موتور با پیام اختصاصی می‌گوید؛
      // از لایهٔ عمومی فقط پیام‌های بازشدگی و ظرفیت می‌آید
      ? getRecommendation(openingPercent, false, null, r.capacityExceeded, { fluidType: "liquid" })
      : getRecommendation(openingPercent, r.choked, r.cavitationRisk, r.capacityExceeded, {
          flashing: r.flashing, Rev: r.Rev, FR: r.FR, sigma: r.sigma,
          fluidType: fluid, velocity: r.velocity, mach: r.mach, openingMin: r.openingMin
        })).map((w) => Object.assign({}, w, { text: warningText(w, locale) }));
    if (r.letdown) {
      r.letdown.warnings.forEach((w) => warnings.push(Object.assign({}, w, { text: warningText(w, locale, "letdown") })));
    }
    // موتور دو‌فازی: هشدارهای مدل + پراکندگی مدل‌ها (متن انگلیسی برای PDF حفظ می‌شود)
    if (mode === "twoPhase") {
      const localized = (w) => Object.assign({}, w, { engineText: w.text, text: warningText(w, locale, "twoPhase") });
      (r.warnings || []).forEach((w) => warnings.push(localized(w)));
      if (r.twoPhase) {
        (r.twoPhase.warnings || [])
          .filter((w) => w.key === "modelSpread")
          .forEach((w) => warnings.push(localized(w)));
      }
    }

    const recCharacteristic = getRecommendedCharacteristic(fluid, openingPercent);
    setResult(Object.assign({}, r, {
      openingPercent, warnings, fluidType: fluid, mode,
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

  // تغییر واحد دبی بدون از دست دادن معنی عدد: مقدار فعلی به واحد جدید تبدیل میشود
  function changeFlowUnit(target, nextUnit) {
    const isQ = target === "Q";
    const currentUnit = isQ ? qUnit : wUnit;
    if (nextUnit === currentUnit) return;
    const fluidKind = fluid === "steam" ? "steam" : fluid;
    let converted = form[target];
    if (converted != null && converted !== "") {
      const engine = flowToEngine(converted, currentUnit, fluidKind, densityCtx);
      const back = engine.error ? { value: null } : engineToFlow(engine.value, nextUnit, fluidKind, densityCtx);
      if (back.value != null) converted = +Number(back.value).toPrecision(6);
    }
    setForm(Object.assign({}, form, {
      [target]: converted,
      [isQ ? "QUnit" : "WUnit"]: nextUnit
    }));
    setHasInteracted(true);
  }

  // تغییر واحد یک فیلد (فشار/دما/ویسکوزیته/چگالی/طول/درصد) بدون تغییر معنی فیزیکی
  function changeFieldUnit(field, nextUnit) {
    const category = FIELD_UNIT_CATEGORY[field];
    if (!category || nextUnit === fieldUnits[field]) return;
    let converted = form[field];
    if (converted != null && converted !== "") {
      const res = convertFieldUnit(category, converted, fieldUnits[field], nextUnit, { Gf: siForm.Gf });
      converted = res.error || res.value == null ? null : +Number(res.value).toPrecision(6);
    }
    setForm(Object.assign({}, form, { [field]: converted, [`${field}Unit`]: nextUnit }));
    setHasInteracted(true);
  }

  // MW و Gg به هم قفلاند: Gg = MW ÷ 28.96 (فقط برای گاز)
  function updateMW(e) {
    const raw = e.target.value;
    const parsed = raw === "" ? null : parseFloat(raw);
    const value = parsed != null && Number.isFinite(parsed) ? parsed : null;
    setForm(Object.assign({}, form, {
      MW: value,
      Gg: value == null ? form.Gg : +ggFromMW(value).toFixed(4)
    }));
    setHasInteracted(true);
  }

  function updateGg(e) {
    const raw = e.target.value;
    const parsed = raw === "" ? null : parseFloat(raw);
    const value = parsed != null && Number.isFinite(parsed) ? parsed : null;
    setForm(Object.assign({}, form, {
      Gg: value,
      MW: value == null ? form.MW : +mwFromGg(value).toFixed(2)
    }));
    setHasInteracted(true);
  }

  function applyPreset(preset) {
    setFluid(preset.fluid);
    // مقادیر پریستها بر پایهٔ SI هستند؛ در حالت اینچی به واحد نمایشی تبدیل میشوند
    setForm(formFromSI(Object.assign({}, DEFAULT_FORM, preset.values), unitSystem, preset.fluid));
    setResult(null);
    setHasInteracted(true);
    setSelectedFluidName(null);
    track.presetUsed({ preset: preset.id, fluid: preset.fluid });
  }

  // دادهٔ مرجع سیالات/پریست‌ها در واحد موتور (bar/°C/cSt/نسبی) است → واحد انتخابی فیلد
  function fieldFromEngine(field, engineValue, gfEngine = siForm.Gf) {
    if (engineValue == null) return null;
    const res = unitFromSI(FIELD_UNIT_CATEGORY[field], engineValue, fieldUnits[field], { Gf: gfEngine });
    if (res.error || res.value == null) return engineValue;
    return +Number(res.value).toPrecision(6);
  }

  function applyFluidPreset(key) {
    const p = FLUID_PRESETS[key];
    if (!p) return;
    setForm(Object.assign({}, form, {
      Gf: fieldFromEngine("Gf", p.Gf),
      Pv: fieldFromEngine("Pv", p.Pv),
      Pc: fieldFromEngine("Pc", p.Pc),
      ...(p.nu != null ? { nu: fieldFromEngine("nu", p.nu, p.Gf) } : {})
    }));
    setHasInteracted(true);
  }

  function handleFluidPick(pickedFluid) {
    setSelectedFluidName(pickedFluid.names[locale] || pickedFluid.names.en);
    const switchingType = pickedFluid.type !== fluid;
    if (switchingType) setFluid(pickedFluid.type);
    const updates = {};
    // با تغییر نوع سیال، واحد دبی بیمعنا میشود: به پیشفرض همان سیال برمیگردیم
    if (switchingType) {
      updates.QUnit = null;
      updates.WUnit = null;
    }
    if (pickedFluid.type === "liquid") {
      if (pickedFluid.Gf != null) updates.Gf = fieldFromEngine("Gf", pickedFluid.Gf);
      // دادههای مرجع سیالات بر پایهٔ SI (bar و cSt) هستند
      if (pickedFluid.Pv != null) updates.Pv = fieldFromEngine("Pv", pickedFluid.Pv);
      if (pickedFluid.Pc != null) updates.Pc = fieldFromEngine("Pc", pickedFluid.Pc);
      if (pickedFluid.nu != null) updates.nu = fieldFromEngine("nu", pickedFluid.nu, pickedFluid.Gf);
    } else if (pickedFluid.type === "gas") {
      if (pickedFluid.Gg != null) {
        updates.Gg = pickedFluid.Gg;
        // MW کاتالوگ دقیق‌تر از تبدیل Gg است؛ در نبود آن از Gg محاسبه میشود
        updates.MW = pickedFluid.MW != null ? pickedFluid.MW : +mwFromGg(pickedFluid.Gg).toFixed(2);
      }
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
    setSharedSeries(null);
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
      // پیوند کوتاه و بدون راز: فقط پارامترهای معتبر سایزینگ + سری انتخابی
      const query = buildSizingParams({
        fluid,
        unitSystem,
        mode,
        form,
        series: sharedSeries?.series || null,
        dn: sharedSeries?.dn || null
      });
      const url = window.location.origin + window.location.pathname + "?" + query;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      // URL را نگه می‌داریم تا همان پیوند بازنشر شود
      window.history.replaceState(null, "", "?" + query);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch (e) {}
  }

  const completion = useMemo(() => {
    const flowKey = mode === "desuper" || mode === "twoPhase" || fluid === "steam" || (mode === "psv" && fluid !== "liquid") ? "W" : "Q";
    let required;
    if (mode === "desuper") required = ["W", "P1", "T", "T2", "waterP"];
    else if (mode === "letdown") required = [flowKey, "P1", "P2", "T"];
    else if (mode === "psv") required = [flowKey, fluid === "liquid" ? "P1" : "T"];
    else if (mode === "twoPhase") required = ["W", "P1", "P2", "Gf", "qualityPct"];
    else required = fluid === "steam" ? ["W", "P1", "P2"] : ["Q", "P1", "P2"];
    // در PSV فشار تنظیم (گیج) جای P1 مطلق را می‌گیرد
    if (mode === "psv" && form.setP > 0) required = required.map(k => (k === "P1" ? "setP" : k));
    // کسیر بخار صفر معتبر است (مایع تنها که داخل شیر فلاش می‌کند)، پس فقط پر بودنش کافی است
    const filled = required.filter(k => (k === "qualityPct" ? form[k] != null : form[k] && form[k] > 0));
    return Math.round((filled.length / required.length) * 100);
  }, [form, fluid, mode]);

  const L = {
    fa: {
      title: "سایزینگ شیر کنترلی",
      subtitle: "برآورد اولیه Cv/Kv",
      engineeringDisclaimer: "این نتیجه برآورد اولیه است، نه محاسبه تأییدشده ISA-75.01.01 (IEC 60534-2-1)؛ برای انتخاب نهایی، با واحد مهندسی شرکت پتروسازه میهن بررسی کنید.",
      capacityExceeded: "Cv موردنیاز از ظرفیت بزرگ‌ترین سایز فهرست‌شده بیشتر است؛ برای انتخاب سایز با واحد مهندسی شرکت پتروسازه میهن مشورت کنید.",
      liquid: "مایع", gas: "گاز", steam: "بخار",
      presets: "سناریوهای آماده", presetsHint: "با یک کلیک، فرم پر می‌شود",
      operatingPoint: "نقطه کاری", advanced: "تنظیمات پیشرفته",
      application: "نوع محاسبه",
      modeControl: "شیر کنترل", modePsv: "شیر اطمینان", modeDesuper: "دی‌سوپرهیتر", modeLetdown: "لت‌داون",
      modeTwoPhase: "دو‌فازی (فلشینگ)",
      modePsvHint: "API 520/526 — اوریفیس و ظرفیت تخلیه",
      modeDesuperHint: "تزریق آب به بخار سوپرهیت",
      modeLetdownHint: "کاهش فشار گاز/بخار با بررسی مراحل",
      modeTwoPhaseHint: "مایع + بخار با روش ω لوینگ، HEM و HNE — مقایسهٔ مدل‌ها",
      setP: "فشار تنظیم (گیج)", overpressure: "اضافه‌فشار", backP: "فشار پشتی", inletLoss: "افت ورودی",
      balanced: "بالنسد (bellows)", Kd: "Kd ظرفیت", Kb: "Kb فشارپشتی", Kc: "Kc دیسک",
      T2: "دمای هدف", waterP: "فشار آب", waterT: "دمای آب", waterGf: "چگالی آب",
      supplyP: "فشار بخار بالادست", dvP: "افت فشار شکار", atomizing: "شکار اتمایزینگ",
      stages: "تعداد مراحل", dryness: "کیفیت بخار",
      quality: "کسیر بخار ورودی x", vapourSource: "چگالی بخار",
      propsLbl: "منبع خواص", propsIapws: "جدول بخار IAPWS-IF97", propsCC: "کلازیوس–کلاپیرون (سیال غیرآب)",
      propsWater: "منبع منحنی اشباع: جدول بخار IAPWS-IF97 (۰٫۲ تا ۲۰۰ bar) — چون MW خالی یا ≈ ۱۸ است.",
      propsNonWater: "MW واردشده سیال را غیرآب می‌کند: منحنی اشباع از کلازیوس–کلاپیرون ساخته می‌شود و فقط تا دو‌برابر فشار لنگر اعتبار دارد؛ برای آب این فیلد را خالی بگذارید، وگرنه فشار خروجی بیرون از این دامنه می‌افتد و حالت پایین‌دست محاسبه نمی‌شود.",
      massFlux: "شار جرمی گلوگاه", throatPLbl: "فشار گلوگاه", omegaLbl: "پارامتر ω",
      flashPLbl: "فشار آغاز فلاش", xOutLbl: "کیفیت خروجی", residenceLbl: "زمان اقامت",
      areaLbl: "مساحت مؤثر", modelLbl: "مدل", modelCompare: "مقایسهٔ چهار مدل دو‌فازی",
      ratioOmega: "نسبت به ω", twoPhaseNote: "سایزینگ دو‌فازی ذاتاً نامطمئن است؛ مدل انتخابی را در سفارش قید کنید.",
      orifice: "اوریفیس API 526", orificeArea: "مساحت لازم", orificeCapacity: "ظرفیت نامی",
      utilisation: "بهره‌گیری", relievingP: "فشار تخلیه", flowRegime: "نظم جریان",
      waterFlow: "دبی آب", sprayRatio: "نسبت اسپری", injectionCv: "Cv شیر تزریق", steamValveCv: "Cv شیر بخار",
      stage: "مرحله", outletTemp: "دمای خروجی", outletMachLbl: "ماخ خروجی", kinEth: "انرژی جنبشی",
      qMin: "دبی مینیمم", qMinHelp: "بررسی کنترل‌پذیری در کم‌باری (سایزینگ دو-نقطه‌ای) — اختیاری", margin: "حاشیهٔ طراحی", marginHelp: "درصد اضافه‌شدن به Cv محاسبه‌شده (مثلاً ۲۰٪)",
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
      calcErrorTitle: "محاسبه انجام نشد",
      calcErrorHint: "ورودی‌ها را اصلاح کنید و دوباره «محاسبه» را بزنید.",
      satStatus: "وضعیت ایستگاه",
      satAtP1: "دمای اشباع در P1",
      minTarget: "کمینهٔ T2",
      currentMargin: "حاشیهٔ فعلی",
      waterDpLabel: "ΔP شیر آب",
      waterDpAfterNozzle: "ΔP نازل اتمایز",
      desuperPresetHint: "پریست‌های دی‌سوپرهیتر دبی بخار، دمای هدف و فشار آب را با هم پر می‌کنند تا محاسبه بدون فیلد خالی اجرا شود.",
      satMarginHint: "برای پرهیز از شوک حرارتی و بخار تر، T2 را دست‌کم ۱۵ °C بالای اشباع نگه دارید؛ زیر ۵ °C خطاست.",
      waterDpHint: "ΔP آب باید مثبت و پس از کسر افت نازل، برای کنترل شیر کافی باشد.",
      product: "محصول پیشنهادی PSM",
      productDataNote: "نام و سری از کاتالوگ PSM انتخاب شده است. Cv این سایز از جدول عمومی محاسبه شده؛ Cv کاتالوگی هر سری در حال تکمیل است و انتخاب نهایی باید با مهندسی PSM تأیید شود.",
      productSourceCatalog: "Cv کاتالوگ",
      productSourceGeneric: "Cv عمومی",
      productSourceEstimated: "Cv برآوردی",
      productNoteEstimated: "Cv این سایز دادهٔ اندازه‌گیری‌شده نیست؛ از قانون مقیاس Cv روی سری‌های اندازه‌گیری‌شده به‌دست آمده (خط آزمون {band}). انتخاب نهایی باید با مهندسی PSM تأیید شود.",
      productNoteCatalog: "سایز از جدول Cv ثبت‌شدهٔ همین سری انتخاب شده است؛ انتخاب نهایی را با مهندسی PSM تأیید کنید.",
      characteristicLabel: "مشخصهٔ ذاتی",
      charEqual: "درصدی (Equal%)",
      charModified: "درصدی اصلاح‌شده",
      charLinear: "خطی (Linear)",
      charQuick: "بازشدگی سریع",
      charUnknown: "نامشخص",
      curveBasis: "مبنای بازشدگی: منحنی کاتالوگ",
      linearBasis: "مبنای بازشدگی: فرض خطی (بدون منحنی)",
      trimRatedCv: "ترم (Cv نامی)",
      marginExceeded: "بازشدگی از ۸۰٪ بیشتر است — سایز بزرگ‌تر پیشنهاد می‌شود",
      productHint: "بر اساس Cv محاسبه‌شده",
      noProduct: "محصولی برای این Cv یافت نشد",
      viewProduct: "مشاهده محصولات",
      refTitle: "مراجع فنی",
      refStandards: "استانداردها و توصیه‌ها",
      refMaterial: "راهنمای متریال",
      refCharts: "نمودارهای پیشرفته",
      lastCalc: "آخرین محاسبه",
      config: "تنظیمات",
      noiseNote: "برآورد راهنمای نویز (رویهٔ log10) — محاسبهٔ کامل IEC 60534-8-3 نیست",
      steamBasisLbl: "مبنای بخار",
      saturated: "اشباع",
      superheated: "سوپرهیت",
      sizedFrom: "سایز از محصول «{product}»",
      revHint: "عدد رینولدز شیر — IEC 60534-2-1 بند ۱۰",
      frHint: "ضریب تصحیح ویسکوزیته FR؛ Cv توربولنت تقسیم بر FR"
    },
    en: {
      title: "Control Valve Sizing",
      subtitle: "Preliminary Cv/Kv estimate",
      engineeringDisclaimer: "This is a preliminary estimate, not a validated ISA-75.01.01 (IEC 60534-2-1) calculation. For the final selection, consult the Engineering Department of Petro Sazeh Mihan Co.",
      capacityExceeded: "Required Cv exceeds the largest listed valve size. Consult the Engineering Department of Petro Sazeh Mihan Co. for selection.",
      liquid: "Liquid", gas: "Gas", steam: "Steam",
      presets: "Preset Scenarios", presetsHint: "One click to fill the form",
      operatingPoint: "Operating Point", advanced: "Advanced Settings",
      application: "Calculation type",
      modeControl: "Control valve", modePsv: "Safety valve", modeDesuper: "Desuperheater", modeLetdown: "Letdown",
      modeTwoPhase: "Two-phase (flashing)",
      modePsvHint: "API 520/526 — orifice and relieving capacity",
      modeDesuperHint: "Water injection into superheated steam",
      modeLetdownHint: "Gas/steam pressure reduction with stage checks",
      modeTwoPhaseHint: "Liquid + vapour by Leung ω, HEM and HNE with model comparison",
      setP: "Set pressure (gauge)", overpressure: "Overpressure", backP: "Backpressure", inletLoss: "Inlet loss",
      balanced: "Balanced (bellows)", Kd: "Kd discharge", Kb: "Kb backpressure", Kc: "Kc rupture disk",
      T2: "Target temperature", waterP: "Water pressure", waterT: "Water temperature", waterGf: "Water density",
      supplyP: "Upstream steam pressure", dvP: "Spray pressure drop", atomizing: "Atomizing spray",
      stages: "Number of stages", dryness: "Steam quality",
      quality: "Inlet vapour fraction x", vapourSource: "Vapour density",
      propsLbl: "Property source", propsIapws: "IAPWS-IF97 steam table", propsCC: "Clausius–Clapeyron (non-water)",
      propsWater: "Saturation curve source: IAPWS-IF97 steam table (0.2 … 200 bar) — MW is empty or ≈ 18.",
      propsNonWater: "The MW entered makes the fluid non-water: the saturation curve is built from Clausius–Clapeyron and is only valid within 2× the anchor pressure. For water leave MW empty, otherwise the outlet pressure falls outside that range and the downstream state cannot be computed.",
      massFlux: "Throat mass flux", throatPLbl: "Throat pressure", omegaLbl: "Omega parameter",
      flashPLbl: "Flash onset pressure", xOutLbl: "Outlet quality", residenceLbl: "Residence time",
      areaLbl: "Effective area", modelLbl: "Model", modelCompare: "Four two-phase models compared",
      ratioOmega: "Ratio to ω", twoPhaseNote: "Two-phase sizing is inherently uncertain — state the selected model in the order.",
      orifice: "API 526 orifice", orificeArea: "Required area", orificeCapacity: "Rated capacity",
      utilisation: "Utilisation", relievingP: "Relieving pressure", flowRegime: "Flow regime",
      waterFlow: "Water flow", sprayRatio: "Spray ratio", injectionCv: "Injection valve Cv", steamValveCv: "Steam valve Cv",
      stage: "Stage", outletTemp: "Outlet temperature", outletMachLbl: "Outlet Mach", kinEth: "Kinetic energy",
      qMin: "Min flow", qMinHelp: "Turndown check at minimum flow (two-point sizing) — optional", margin: "Design margin", marginHelp: "Percentage added to the calculated Cv (e.g. 20%)",
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
      calcErrorTitle: "Calculation failed",
      calcErrorHint: "Correct the inputs and press Calculate again.",
      satStatus: "Station check",
      satAtP1: "Saturation at P1",
      minTarget: "Minimum T2",
      currentMargin: "Current margin",
      waterDpLabel: "Water valve ΔP",
      waterDpAfterNozzle: "Atomising nozzle ΔP",
      desuperPresetHint: "Desuperheater presets fill steam flow, target temperature and water pressure together so Calculate runs without empty fields.",
      satMarginHint: "Keep T2 at least 15 °C above saturation to avoid thermal shock and wet steam; below 5 °C is an error.",
      waterDpHint: "Water ΔP must be positive and, after the nozzle drop, still leave control authority across the valve.",
      product: "Suggested PSM Product",
      productDataNote: "The name and series come from the PSM catalogue. The Cv belongs to the general size table; per-series catalogue Cv is still being completed, so the final selection must be confirmed with PSM engineering.",
      productSourceCatalog: "Catalogue Cv",
      productSourceGeneric: "General Cv",
      productSourceEstimated: "Estimated Cv",
      productNoteEstimated: "This size Cv is not measured data; it comes from the Cv scaling law fitted to the measured series (back-test error {band}). Confirm the final selection with PSM engineering.",
      productNoteCatalog: "This size comes from the recorded Cv table of this series; confirm the final selection with PSM engineering.",
      characteristicLabel: "Inherent characteristic",
      charEqual: "Equal %",
      charModified: "Modified %",
      charLinear: "Linear",
      charQuick: "Quick opening",
      charUnknown: "Not recorded",
      curveBasis: "Opening basis: catalogue curve",
      linearBasis: "Opening basis: linear assumption (no curve)",
      trimRatedCv: "Trim (rated Cv)",
      marginExceeded: "Opening above 80% — a larger size is recommended",
      productHint: "Based on your calculated Cv",
      noProduct: "No matching product for this Cv",
      viewProduct: "View Products",
      refTitle: "Technical References",
      refStandards: "Standards & Tips",
      refMaterial: "Material Guide",
      refCharts: "Advanced Charts",
      lastCalc: "Last calculation",
      config: "Settings",
      noiseNote: "Indicative noise estimate (log10 heuristic) — not a full IEC 60534-8-3 calculation",
      steamBasisLbl: "Steam basis",
      saturated: "Saturated",
      superheated: "Superheated",
      sizedFrom: "Sized from product {product}",
      revHint: "Valve Reynolds number — IEC 60534-2-1 Clause 10",
      frHint: "Viscosity correction factor FR; turbulent Cv divided by FR"
    },
    ar: {
      title: "تحديد حجم الصمام", subtitle: "تقدير أولي لـ Cv/Kv",
      engineeringDisclaimer: "هذا تقدير أولي وليس حسابًا معتمدًا وفق ISA-75.01.01 (IEC 60534-2-1). يجب مراجعة الاختيار النهائي مع الإدارة الهندسية لشركة بترو سازه ميهان.",
      capacityExceeded: "يتجاوز Cv المطلوب أكبر حجم مدرج؛ استشر الإدارة الهندسية لشركة بترو سازه ميهان لاختيار الحجم المناسب.",
      liquid: "سائل", gas: "غاز", steam: "بخار",
      presets: "سيناريوهات", presetsHint: "بنقرة واحدة",
      operatingPoint: "نقطة التشغيل", advanced: "متقدم",
      application: "نوع الحساب",
      modeControl: "صمام تحكم", modePsv: "صمام أمان", modeDesuper: "مزيل الحرارة الزائدة", modeLetdown: "خفض الضغط",
      modeTwoPhase: "طوران (غليان)",
      modePsvHint: "API 520/526 — الفوهة وسعة التصريف",
      modeDesuperHint: "حقن الماء في البخار فائق التسخين",
      modeLetdownHint: "خفض ضغط الغاز/البخار مع فحص المراحل",
      modeTwoPhaseHint: "سائل + بخار بطريقتي ω وHEM/HNE مع مقارنة النماذج",
      setP: "ضغط الضبط (مقياس)", overpressure: "الضغط الزائد", backP: "الضغط الخلفي", inletLoss: "فقد المدخل",
      balanced: "متوازن (منفاخ)", Kd: "Kd التصريف", Kb: "Kb الضغط الخلفي", Kc: "Kc قرص الانفجار",
      T2: "درجة الحرارة الهدف", waterP: "ضغط الماء", waterT: "درجة حرارة الماء", waterGf: "كثافة الماء",
      supplyP: "ضغط البخار العلوي", dvP: "هبوط ضغط الرش", atomizing: "رش مُذَرٍّ",
      stages: "عدد المراحل", dryness: "جودة البخار",
      quality: "كسر البخار عند المدخل x", vapourSource: "كثافة البخار",
      propsLbl: "مصدر الخصائص", propsIapws: "جدول بخار IAPWS-IF97", propsCC: "كلاوزيوس–كلابيرون (سائل غير الماء)",
      propsWater: "منحنى الإشباع مأخوذ من جدول بخار IAPWS-IF97 (من ۰٫۲ إلى ۲۰۰ بار) لأن MW فارغ أو ≈ ۱۸.",
      propsNonWater: "الوزن الجزيئي المُدخل يجعل المائع غير الماء: يُبنى منحنى الإشباع من كلاوزيوس–كلابيرون ولا صالح إلا في نطاق ضعف ضغط المرجع. للماء اترك هذا الحقل فارغًا، وإلا يخرج ضغط المخرج عن هذا النطاق ولا تُحسب حالة المخرج.",
      massFlux: "تدفق الكتلة عند الخانق", throatPLbl: "ضغط الخانق", omegaLbl: "معامل أوميغا",
      flashPLbl: "ضغط بداية الغليان", xOutLbl: "جودة المخرج", residenceLbl: "زمن المكث",
      areaLbl: "المساحة الفعالة", modelLbl: "النموذج", modelCompare: "مقارنة نماذج الطورين الأربعة",
      ratioOmega: "النسبة إلى ω", twoPhaseNote: "حساب الطورين غير مؤكد بطبيعته؛ اذكر النموذج المختار في أمر الشراء.",
      orifice: "فوهة API 526", orificeArea: "المساحة المطلوبة", orificeCapacity: "السعة الاسمية",
      utilisation: "نسبة الاستخدام", relievingP: "ضغط التصريف", flowRegime: "نظام التدفق",
      waterFlow: "تدفق الماء", sprayRatio: "نسبة الرش", injectionCv: "Cv صمام الحقن", steamValveCv: "Cv صمام البخار",
      stage: "مرحلة", outletTemp: "حرارة المخرج", outletMachLbl: "ماخ المخرج", kinEth: "الطاقة الحركية",
      qMin: "أقل تدفق", qMinHelp: "فحص القابلية للتحكم عند أقل تدفق — اختياري", margin: "هامش التصميم", marginHelp: "نسبة مضافة إلى Cv المحسوب (مثل 20٪)",
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
      calcErrorTitle: "لم يتم الحساب",
      calcErrorHint: "صحح المدخلات ثم اضغط «احسب» مجددًا.",
      satStatus: "حالة المحطة",
      satAtP1: "التشبع عند P1",
      minTarget: "أدنى T2",
      currentMargin: "الهامش الحالي",
      waterDpLabel: "ΔP صمام الماء",
      waterDpAfterNozzle: "ΔP فوهة الرش",
      desuperPresetHint: "هذه السيناريوهات تملأ تدفق البخار والحرارة الهدف وضغط الماء معًا حتى يعمل الحساب دون حقول فارغة.",
      satMarginHint: "أبقِ T2 أعلى من التشبع بـ ١٥ °C على الأقل لتجنب الصدمة الحرارية والبخار الرطب؛ وأقل من ٥ °C خطأ.",
      waterDpHint: "يجب أن يكون ΔP الماء موجبًا وأن يبقي بعد هبوط الفوهة سلطة تحكم كافية للصمام.",
      product: "منتج مقترح", productHint: "بناءً على Cv",
      productDataNote: "الاسم والسلسلة من كتالوج PSM. قيمة Cv من الجدول العام؛ جدول Cv الخاص بكل سلسلة قيد الإكمال ويجب تأكيد الاختيار النهائي مع مهندسي PSM.",
      productSourceCatalog: "Cv الكتالوج",
      productSourceGeneric: "Cv العام",
      productSourceEstimated: "Cv تقديري",
      productNoteEstimated: "قيمة Cv لهذا المقاس ليست بيانات مقاسة؛ إنها تقدير من قانون تنسيق Cv على السلاسل المقاسة (خطأ الاختبار {band}). يجب تأكيد الاختيار النهائي مع مهندسي PSM.",
      productNoteCatalog: "الحجم مأخوذ من جدول Cv المسجل لهذه السلسلة؛ أكد الاختيار النهائي مع مهندسي PSM.",
      characteristicLabel: "المنحنى الذاتي",
      charEqual: "نسبة متساوية (Equal%)",
      charModified: "نسبة معدلة",
      charLinear: "خطي (Linear)",
      charQuick: "فتح سريع",
      charUnknown: "غير مسجل",
      curveBasis: "أساس الفتح: منحنى الكاتالوج",
      linearBasis: "أساس الفتح: افتراض خطي (بدون منحنى)",
      trimRatedCv: "القطعة الداخلية (Cv الاسمي)",
      marginExceeded: "نسبة الفتح تتجاوز ۸۰٪ — يُنصح بحجم أكبر",
      noProduct: "لا يوجد", viewProduct: "عرض",
      refTitle: "المراجع", refStandards: "المعايير",
      refMaterial: "المواد", refCharts: "الرسوم",
      lastCalc: "آخر حساب", config: "إعدادات",
      noiseNote: "تقدير إرشادي للضجيج (log10) — وليس حساب IEC 60534-8-3 الكامل",
      steamBasisLbl: "أساس البخار",
      saturated: "مشبع",
      superheated: "مسخن",
      sizedFrom: "تم التحديد من المنتج {product}",
      revHint: "عدد رينولدز للصمام — IEC 60534-2-1 البند 10",
      frHint: "معامل تصحيح اللزوجة FR؛ Cv مضروبًا في 1/FR"
    },
    ru: {
      title: "Подбор клапана", subtitle: "Предварительная оценка Cv/Kv",
      engineeringDisclaimer: "Это предварительная оценка, а не подтвержденный расчет по ISA-75.01.01 (IEC 60534-2-1). Окончательный выбор следует согласовать с инженерным отделом компании Petro Sazeh Mihan.",
      capacityExceeded: "Требуемый Cv превышает максимальную пропускную способность в списке. Обратитесь в инженерный отдел Petro Sazeh Mihan для подбора.",
      liquid: "Жидкость", gas: "Газ", steam: "Пар",
      presets: "Сценарии", presetsHint: "Один клик",
      operatingPoint: "Рабочая точка", advanced: "Дополнительно",
      application: "Тип расчёта",
      modeControl: "Регулирующий клапан", modePsv: "Предохранительный клапан", modeDesuper: "Десуперхитер", modeLetdown: "Дросселирование",
      modeTwoPhase: "Двухфазный (flash)",
      modePsvHint: "API 520/526 — сопло и пропускная способность",
      modeDesuperHint: "Впрыск воды в перегретый пар",
      modeLetdownHint: "Снижение давления газа/пара с проверкой ступеней",
      modeTwoPhaseHint: "Жидкость + пар по ω Леунга, HEM и HNE со сравнением моделей",
      setP: "Давление настройки (изб.)", overpressure: "Избыточное давление", backP: "Противодавление", inletLoss: "Потери на входе",
      balanced: "Сбалансированный (сильфон)", Kd: "Kd коэффициента", Kb: "Kb противодавления", Kc: "Kc разрывная пластина",
      T2: "Целевая температура", waterP: "Давление воды", waterT: "Температура воды", waterGf: "Плотность воды",
      supplyP: "Давление пара до клапана", dvP: "Перепад на распыл", atomizing: "Атомизирующий распыл",
      stages: "Число ступеней", dryness: "Сухость пара",
      quality: "Доль пара на входе x", vapourSource: "Плотность пара",
      propsLbl: "Источник свойств", propsIapws: "Таблица пара IAPWS-IF97", propsCC: "Клаузиус–Клапейрон (не вода)",
      propsWater: "Кривая насыщения взята из таблицы пара IAPWS-IF97 (0,2 … 200 бар), так как MW пуст или ≈ 18.",
      propsNonWater: "Указанный MW считает среду неводной: кривая насыщения строится по Клаузиусу–Клапейрону и действует лишь в пределах двойного давления опорной точки. Для воды оставьте поле пустым, иначе давление на выходе выйдет за этот диапазон и конечное состояние не будет рассчитано.",
      massFlux: "Массовый поток в горле", throatPLbl: "Давление в горле", omegaLbl: "Параметр ω",
      flashPLbl: "Давление начала flash", xOutLbl: "Сухость на выходе", residenceLbl: "Время пребывания",
      areaLbl: "Эффективная площадь", modelLbl: "Модель", modelCompare: "Сравнение четырёх двухфазных моделей",
      ratioOmega: "Отношение к ω", twoPhaseNote: "Двухфазный расчёт принципиально неопределён — укажите выбранную модель в заказе.",
      orifice: "Сопло API 526", orificeArea: "Требуемая площадь", orificeCapacity: "Номинальная способность",
      utilisation: "Использование", relievingP: "Давление сброса", flowRegime: "Режим потока",
      waterFlow: "Расход воды", sprayRatio: "Соотношение впрыска", injectionCv: "Cv клапана впрыска", steamValveCv: "Cv парового клапана",
      stage: "Ступень", outletTemp: "Температура на выходе", outletMachLbl: "Мах на выходе", kinEth: "Кинетическая энергия",
      qMin: "Мин. расход", qMinHelp: "Проверка управляемости при минимальном расходе — необязательно", margin: "Запас проекта", marginHelp: "Процент к расчётному Cv (например, 20%)",
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
      calcErrorTitle: "Расчёт не выполнен",
      calcErrorHint: "Исправьте входные данные и нажмите «Рассчитать» снова.",
      satStatus: "Проверка станции",
      satAtP1: "Насыщение при P1",
      minTarget: "Минимум T2",
      currentMargin: "Текущий запас",
      waterDpLabel: "ΔP водяного клапана",
      waterDpAfterNozzle: "ΔP форсунки",
      desuperPresetHint: "Пресеты десуперхитера заполняют расход пара, целевую температуру и давление воды вместе — расчёт выполняется без пустых полей.",
      satMarginHint: "Держите T2 минимум на 15 °C выше насыщения, чтобы избежать теплового удара и влажного пара; ниже 5 °C — ошибка.",
      waterDpHint: "ΔP воды должен быть положительным и после потерь на форсунке оставлять запас для регулирования клапаном.",
      product: "Продукт", productHint: "По Cv",
      productDataNote: "Название и серия взяты из каталога PSM. Cv относится к общей таблице; каталожные Cv по сериям ещё заполняются, окончательный выбор подтверждает инженер PSM.",
      productSourceCatalog: "Cv каталога",
      productSourceGeneric: "Общий Cv",
      productSourceEstimated: "Оценочный Cv",
      productNoteEstimated: "Cv этого размера не измерен — это оценка по степенному закону Cv, подогнанному по измеренным сериям (погрешность бэк-теста {band}). Окончательный выбор подтверждает инженер PSM.",
      productNoteCatalog: "Размер выбран по записанной таблице Cv этой серии; окончательный выбор подтверждает инженер PSM.",
      characteristicLabel: "Собственная характеристика",
      charEqual: "Равнопроцентная (Equal %)",
      charModified: "Модифицированная",
      charLinear: "Линейная",
      charQuick: "Быстрооткрывающаяся",
      charUnknown: "Не записана",
      curveBasis: "Основа открытия: каталожная кривая",
      linearBasis: "Основа открытия: линейное допущение",
      trimRatedCv: "Трим (номинальный Cv)",
      marginExceeded: "Открытие выше 80% — рекомендуется больший размер",
      noProduct: "Нет", viewProduct: "Смотреть",
      refTitle: "Справочники", refStandards: "Стандарты",
      refMaterial: "Материалы", refCharts: "Графики",
      lastCalc: "Последний", config: "Настройки",
      noiseNote: "Ориентировочная оценка шума (log10) — не полный расчёт IEC 60534-8-3",
      steamBasisLbl: "База пара",
      saturated: "Насыщенный",
      superheated: "Перегретый",
      sizedFrom: "Подбор по продукту {product}",
      revHint: "Число Рейнольдса клапана — IEC 60534-2-1, раздел 10",
      frHint: "Коэффициент вязкостной коррекции FR; Cv делится на FR"
    }
  }[locale] || {};

  Object.assign(L, SERVICE_LABELS[locale] || SERVICE_LABELS.en, SERVICE_LABELS_2[locale] || SERVICE_LABELS_2.en);

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
          form={siForm}
          fluid={fluid}
          setForm={(next) => {
            // ویزارد همیشه با مقادیر SI کار میکند؛ خروجی به واحد نمایشی تبدیل میشود
            const targetFluid = wizardFluidRef.current || fluid;
            setForm(formFromSI(Object.assign({}, next, { QUnit: null, WUnit: null }), unitSystem, targetFluid));
          }}
          setFluid={(f) => { wizardFluidRef.current = f; setFluid(f); }}
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

          {/* چیپ سری انتخاب‌شده از صفحهٔ محصول (قبل از اولین محاسبه هم دیده می‌شود) */}
          {sharedSeries && (
            <div className="sizing-card" role="note" style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              borderColor: "var(--gold)", borderWidth: 1.5, borderStyle: "solid"
            }}>
              <Star size={14} color="var(--gold)" />
              <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800, color: "var(--text)" }}>
                {isFa ? "سری" : "Series"} <bdi dir="ltr">{sharedSeries.series}</bdi>
                {sharedSeries.dn ? ` · ${sharedSeries.dn}` : ""}
                {seriesProfile && (
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                    {` — FL ${seriesProfile.fl} · xT ${seriesProfile.xT} (${seriesProfile.type})`}
                  </span>
                )}
              </span>
              <button
                onClick={() => { setSharedSeries(null); setSeriesProfile(null); }}
                className="result-action-btn"
                style={{ padding: "4px 10px", fontSize: 10 }}
                aria-label={isFa ? "حذف انتخاب سری" : "Clear series selection"}
              >
                ✕
              </button>
            </div>
          )}

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

            <div className="card-head" style={{ marginTop: 6, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
              <SlidersHorizontal size={14} color="var(--gold)" />
              <span className="card-head-text">{L.application}</span>
            </div>

            <div className="fluid-type-chips">
              {[
                { id: "control", icon: Gauge, label: L.modeControl },
                { id: "psv", icon: ShieldAlert, label: L.modePsv },
                { id: "desuper", icon: Thermometer, label: L.modeDesuper },
                { id: "letdown", icon: ArrowDownWideNarrow, label: L.modeLetdown },
                { id: "twoPhase", icon: Waves, label: L.modeTwoPhase }
              ].map(m => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button key={m.id} onClick={() => changeMode(m.id)} className={active ? "active" : ""}>
                    <Icon size={13} /> {m.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", marginTop: 5 }}>
              {L["mode" + mode.slice(0, 1).toUpperCase() + mode.slice(1) + "Hint"] || ""}
            </div>

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
                    onClick={() => { if (!isDesuper && !isTwoPhase) selectFluid(f.id); }}
                    disabled={(isDesuper && f.id !== "steam") || (isTwoPhase && f.id !== "liquid")}
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
              {(isDesuper ? DESUPER_PRESETS : PRESET_SCENARIOS).map(p => (
                <button key={p.id} onClick={() => applyPreset(p)}
                  className="preset-btn"
                  style={{ "--preset-color": p.color }}
                  title={(p.desc && (p.desc[locale] || p.desc.en)) || ""}
                >
                  <div className="preset-icon" style={{ background: p.color + "15" }}>
                    {p.icon}
                  </div>
                  <div className="preset-name">{p.name[locale] || p.name.en}</div>
                </button>
              ))}
            </div>
            {isDesuper && (
              <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, lineHeight: 1.7, color: "var(--text-muted)" }}>
                {L.desuperPresetHint}
              </div>
            )}
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
              {needMass ? (
                <Field label="W" unit={wUnit} unitGroups={wUnitGroups} onUnitChange={(u) => changeFlowUnit("W", u)} value={form.W} onChange={update("W")} help={help.W} error={errors.W} placeholder="500" required />
              ) : (
                <Field label="Q" unit={qUnit} unitGroups={qUnitGroups} onUnitChange={(u) => changeFlowUnit("Q", u)} value={form.Q} onChange={update("Q")} help={help.Q} error={errors.Q} placeholder="100" required />
              )}
              {fluid === "liquid" && <Field label="Gf" {...unitProps("Gf")} value={form.Gf} onChange={update("Gf")} step={fieldUnits.Gf === "—" || fieldUnits.Gf === "g/cm³" ? 0.01 : 1} help={help.Gf} error={errors.Gf} placeholder="1.0" />}
              {fluid === "gas" && <Field label="Gg" unit={ratioUnit} value={form.Gg} onChange={updateGg} step={0.01} help={help.Gg} error={errors.Gg} placeholder="0.65" />}
              {fluid === "gas" && <Field label="MW" unit="kg/kmol" value={form.MW} onChange={updateMW} step={0.01} help={help.MW} error={errors.MW} placeholder="18.82" />}
              {isPsv ? (
                <>
                  <Field label={L.setP} {...unitProps("setP")} value={form.setP} onChange={update("setP")} step={0.1} help={help.setP} error={errors.setP} placeholder="10" />
                  <Field label={L.overpressure} {...unitProps("overpressurePct")} value={form.overpressurePct} onChange={update("overpressurePct")} step={1} help={help.overpressurePct} error={errors.overpressurePct} placeholder="10" />
                  <Field label={L.relievingP} {...unitProps("P1")} value={form.P1} onChange={update("P1")} step={0.1} help={help.relievingP} error={errors.P1} placeholder="—" />
                  <Field label={L.backP} {...unitProps("P2")} value={form.P2} onChange={update("P2")} step={0.1} help={help.backP} error={errors.P2} placeholder="0" />
                </>
              ) : isDesuper ? (
                <>
                  <Field label="P1" {...unitProps("P1")} value={form.P1} onChange={update("P1")} step={0.1} help={help.P1} error={errors.P1} placeholder="10" required />
                  <Field label={L.T2} {...unitProps("T2")} value={form.T2} onChange={update("T2")} step={1} help={help.T2} error={errors.T2} placeholder="260" required />
                  <Field label={L.waterP} {...unitProps("waterP")} value={form.waterP} onChange={update("waterP")} step={0.1} help={help.waterP} error={errors.waterP} placeholder="10" required />
                  <Field label={L.waterT} {...unitProps("waterT")} value={form.waterT} onChange={update("waterT")} step={1} help={help.waterT} error={errors.waterT} placeholder="25" />
                  <Field label={L.waterGf} {...unitProps("waterGf")} value={form.waterGf} onChange={update("waterGf")} step={0.01} error={errors.waterGf} placeholder="1" />
                  <Field label={L.supplyP} {...unitProps("supplyP")} value={form.supplyP} onChange={update("supplyP")} step={0.1} help={help.supplyP} error={errors.supplyP} placeholder="—" />
                  <Field label={L.dvP} {...unitProps("dvP")} value={form.dvP} onChange={update("dvP")} step={0.1} help={help.dvP} error={errors.dvP} placeholder="—" />
                </>
              ) : (
                <>
                  <Field label="P1" {...unitProps("P1")} value={form.P1} onChange={update("P1")} step={0.1} help={help.P1} error={errors.P1} placeholder="10" required />
                  <Field label="P2" {...unitProps("P2")} value={form.P2} onChange={update("P2")} step={0.1} help={help.P2} error={errors.P2} placeholder="6" required />
                </>
              )}
              {fluid === "liquid" && <Field label="Pv" {...unitProps("Pv")} value={form.Pv} onChange={update("Pv")} step={0.01} help={isTwoPhase ? help.PvTwo : help.Pv} error={errors.Pv} placeholder="0.0317" />}
              {fluid === "liquid" && <Field label="ν" {...unitProps("nu")} value={form.nu} onChange={update("nu")} step={0.1} help={help.nu} error={errors.nu} placeholder="1" />}
              {isTwoPhase && <Field label={L.quality} {...unitProps("qualityPct")} value={form.qualityPct} onChange={update("qualityPct")} step={1} help={help.qualityPct} error={errors.qualityPct} placeholder="0" required />}
              {isTwoPhase && <Field label="T" {...unitProps("T")} value={form.T} onChange={update("T")} help={help.T} error={errors.T} placeholder="179.9" />}
              {fluid !== "liquid" && <Field label={isDesuper ? L.superheatIn : "T"} {...unitProps("T")} value={form.T} onChange={update("T")} help={help.T} error={errors.T} placeholder="25" required={isDesuper} />}
              {fluid === "gas" && <Field label="Z" unit={ratioUnit} value={form.Z} onChange={update("Z")} step={0.01} help={help.Z} error={errors.Z} placeholder="1.0" />}
              {isPsv && <Field label={L.inletLoss} {...unitProps("inletLossPct")} value={form.inletLossPct} onChange={update("inletLossPct")} step={0.5} help={help.inletLossPct} error={errors.inletLossPct} placeholder="—" />}
              {isLetdown && (
                <>
                  <Field label={L.stages} unit="#" value={form.stages} onChange={update("stages")} step={1} help={help.stages} error={errors.stages} placeholder="auto" />
                  {fluid === "steam" && <Field label={L.dryness} {...unitProps("drynessPct")} value={form.drynessPct} onChange={update("drynessPct")} step={1} help={help.drynessPct} error={errors.drynessPct} placeholder="100" />}
                </>
              )}
            </div>

            {isTwoPhase && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>{L.modelLbl}</div>
                <div className="fluid-type-chips">
                  {[
                    { id: "omega", label: "ω Leung", hint: help.tpModelOmega },
                    { id: "hem", label: "HEM", hint: help.tpModelHem },
                    { id: "hne", label: "HNE", hint: help.tpModelHne },
                    { id: "additive", label: "Cv₁ + Cv₂", hint: help.tpModelAdditive }
                  ].map(m => {
                    const active = (form.tpModel || "omega") === m.id;
                    return (
                      <button key={m.id} title={m.hint} onClick={() => setForm(Object.assign({}, form, { tpModel: m.id }))} className={active ? "active" : ""}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(isPsv || isDesuper) && (
              <div className="toggle-row">
                {isPsv && (
                  <button type="button" onClick={() => setForm(Object.assign({}, form, { balanced: !form.balanced }))} aria-pressed={Boolean(form.balanced)} className={"toggle-chip" + (form.balanced ? " active" : "")}>
                    <ShieldAlert size={11} /> {L.balanced}
                  </button>
                )}
                {isDesuper && (
                  <button type="button" onClick={() => setForm(Object.assign({}, form, { atomizing: form.atomizing === false }))} aria-pressed={form.atomizing !== false} className={"toggle-chip" + (form.atomizing !== false ? " active" : "")}>
                    <Droplets size={11} /> {L.atomizing}
                  </button>
                )}
              </div>
            )}

            {desuperGuide && (
              <div role="status" style={{
                marginTop: 12, padding: "10px 12px", borderRadius: 10,
                background: "var(--bg-soft)", border: "1px solid var(--border)"
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                  fontSize: 10, fontWeight: 900, color: "var(--text-muted)"
                }}>
                  <Thermometer size={12} color="var(--gold)" /> {L.satStatus}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)" }}>{L.satAtP1}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>
                      {desuperGuide.tsat == null ? "—" : desuperGuide.tsat + " °C"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)" }}>{L.minTarget}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>
                      {desuperGuide.minTarget == null ? "—" : desuperGuide.minTarget + " °C"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)" }}>{L.currentMargin}</div>
                    <div style={{
                      fontSize: 12.5, fontWeight: 900, fontFamily: "monospace",
                      color: desuperGuide.margin == null ? "var(--text-muted)"
                        : desuperGuide.margin < NEAR_SATURATION_REJECT_C ? "#E81123"
                          : desuperGuide.margin < NEAR_SATURATION_WARN_C ? "#B45309" : "#059669"
                    }}>
                      {desuperGuide.margin == null ? "—" : (desuperGuide.margin > 0 ? "+" : "") + desuperGuide.margin + " °C"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)" }}>{L.waterDpLabel}</div>
                    <div style={{
                      fontSize: 12.5, fontWeight: 900, fontFamily: "monospace",
                      color: desuperGuide.valveDp == null ? "var(--text-muted)"
                        : desuperGuide.valveDp <= 0 ? "#E81123"
                          : desuperGuide.valveDp < 0.5 * desuperGuide.atomizingDp ? "#B45309" : "#059669"
                    }}>
                      {desuperGuide.valveDp == null ? "—" : desuperGuide.valveDp + " bar"}
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)" }}>
                        {" / "}{L.waterDpAfterNozzle} {desuperGuide.atomizingDp == null ? "—" : desuperGuide.atomizingDp + " bar"}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 7, fontSize: 9.5, fontWeight: 700, lineHeight: 1.65, color: "var(--text-muted)" }}>
                  {L.satMarginHint}
                  {desuperGuide.valveDp != null && desuperGuide.valveDp <= 0 ? " " + L.waterDpHint : ""}
                </div>
              </div>
            )}

            {dP > 0 && (
              <div className="dp-indicator">
                <span>{L.deltaP}</span>
                <strong>{dP} {dpUnit}</strong>
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
                    <Field label="Pc" {...unitProps("Pc")} value={form.Pc} onChange={update("Pc")} help={help.Pc} error={errors.Pc} />
                    <Field label="FL" unit={ratioUnit} value={form.FL} onChange={update("FL")} step={0.01} help={help.FL} error={errors.FL} />
                  </>
                )}
                {fluid === "gas" && (
                  <>
                    <Field label="k" unit={ratioUnit} value={form.k} onChange={update("k")} step={0.01} help={help.k} error={errors.k} />
                    <Field label="xT" unit={ratioUnit} value={form.xT} onChange={update("xT")} step={0.01} help={help.xT} error={errors.xT} />
                  </>
                )}
                {isPsv && (
                  <>
                    <Field label={L.Kd} unit={ratioUnit} value={form.Kd} onChange={update("Kd")} step={0.01} help={help.Kd} error={errors.Kd} />
                    <Field label={L.Kb} unit={ratioUnit} value={form.Kb} onChange={update("Kb")} step={0.01} help={help.Kb} error={errors.Kb} />
                    <Field label={L.Kc} unit={ratioUnit} value={form.Kc} onChange={update("Kc")} step={0.01} help={help.Kc} error={errors.Kc} />
                  </>
                )}
                {isTwoPhase && (
                  <>
                    <Field label="MW" unit="kg/kmol" value={form.MW} onChange={update("MW")} step={0.01} help={help.MWtwoPhase} error={errors.MW} placeholder="18.015" />
                    <Field label="N" unit={ratioUnit} value={form.N} onChange={update("N")} step={0.1} help={help.N} error={errors.N} placeholder="1.4" />
                    <Field label="Kd" unit={ratioUnit} value={form.tpKd} onChange={update("tpKd")} step={0.01} help={help.tpKd} error={errors.tpKd} placeholder="1" />
                    <div
                      role="note"
                      style={{
                        gridColumn: "1 / -1", display: "flex", gap: 6, alignItems: "flex-start",
                        fontSize: 10.5, fontWeight: 700, lineHeight: 1.65, padding: "7px 9px",
                        borderRadius: 8, background: tpUsesSteamTable ? "var(--bg-soft)" : "rgba(180, 83, 9, 0.10)",
                        border: "1px solid " + (tpUsesSteamTable ? "var(--border)" : "rgba(180, 83, 9, 0.45)"),
                        color: tpUsesSteamTable ? "var(--text-muted)" : "#B45309"
                      }}>
                      {tpUsesSteamTable ? <Info size={11} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 2 }} />}
                      <span>{tpUsesSteamTable ? L.propsWater : L.propsNonWater}</span>
                    </div>
                  </>
                )}
                <Field label="D" {...unitProps("pipeDn")} value={form.pipeDn} onChange={update("pipeDn")} step={fieldUnits.pipeDn === "in" ? 0.25 : 5} help={help.pipeDn} error={errors.pipeDn} placeholder={fieldUnits.pipeDn === "in" ? "4" : "100"} />
                {fluid !== "steam" && !isTwoPhase && (
                  <Field label={L.qMin} unit={qUnit} value={form.QMin} onChange={update("QMin")} placeholder="—" help={L.qMinHelp} />
                )}
                <Field label={L.margin} {...unitProps("marginPct")} value={form.marginPct} onChange={update("marginPct")} step={fieldUnits.marginPct === "fraction" ? 0.05 : 5} placeholder="0" help={L.marginHelp} />
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
              onClick={() => { runCalculation(true); setHasInteracted(true); }}
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

          {!result ? (
            <div className="sizing-card result-empty">
              <div className="result-empty-icon">
                <Gauge size={28} />
              </div>
              <div className="result-empty-title">{L.resultEmptyTitle}</div>
              <div className="result-empty-desc">{L.resultEmptyDesc}</div>
              <div className="result-empty-hint">{L.resultEmptyHint}</div>
            </div>
          ) : result.error ? (
            <div className="sizing-card result-empty" role="alert" aria-live="assertive">
              <div className="result-empty-icon" style={{ color: "#E81123", background: "rgba(232, 17, 35, 0.08)" }}>
                <AlertTriangle size={28} />
              </div>
              <div className="result-empty-title" style={{ color: "#E81123" }}>{L.calcErrorTitle}</div>
              <div className="result-empty-desc" style={{ maxWidth: 460, color: "var(--text)", fontWeight: 700 }}>
                {result.mode === "desuper" || result.errorKey
                  ? desuperErrorText(result, locale)
                  : result.error}
              </div>
              <div className="result-empty-hint">{L.calcErrorHint}</div>
            </div>
          ) : (result.mode === "psv" || result.mode === "desuper") ? (
            <ServiceResult
              result={result}
              L={L}
              onShare={shareLink}
              onReport={() => { setShowReport(true); track.reportOpened(); }}
            />
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
                      <span className="hero-metric-value">{velocityFromSI(result.velocity, sys.velocity)} {sys.velocity}{result.mach != null ? ` · Ma ${result.mach}` : ""}</span>
                    </div>
                  )}
                  {result.noise && (
                    <div className="hero-metric" title={L.noiseNote}>
                      <Gauge size={12} />
                      <span className="hero-metric-label">{L.noise}</span>
                      <span className="hero-metric-value">≈{result.noise}</span>
                    </div>
                  )}
                  {result.pipingApplied && (
                    <div className="hero-metric">
                      <Activity size={12} />
                      <span className="hero-metric-label">Fp</span>
                      <span className="hero-metric-value">{result.Fp}</span>
                    </div>
                  )}
                  {result.marginPct > 0 && (
                    <div className="hero-metric">
                      <Gauge size={12} />
                      <span className="hero-metric-label">{L.margin}</span>
                      <span className="hero-metric-value">+{result.marginPct}%</span>
                    </div>
                  )}
                  {result.CvMin != null && (
                    <div className={"hero-metric" + (result.openingMin < 15 ? " cav-high" : "")}>
                      <Activity size={12} />
                      <span className="hero-metric-label">{L.qMin}</span>
                      <span className="hero-metric-value">Cv {result.CvMin} · {result.openingMin}%</span>
                    </div>
                  )}
                  {result.flashing && (
                    <div className="hero-metric cav-flashing">
                      <AlertTriangle size={12} />
                      <span className="hero-metric-label">{L.flashing}</span>
                      <span className="hero-metric-value">P2 &lt; Pv</span>
                    </div>
                  )}
                  {result.cavitationLevel && !result.flashing && (
                    <div className={"hero-metric cav-" + result.cavitationLevel}>
                      {result.cavitationLevel === "low" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      <span className="hero-metric-label">{L.cav}</span>
                      <span className="hero-metric-value">{L[result.cavitationLevel]}</span>
                    </div>
                  )}
                  {result.Rev != null && (
                    <div className="hero-metric" title={L.revHint}>
                      <Activity size={12} />
                      <span className="hero-metric-label">Rev</span>
                      <span className="hero-metric-value">{result.Rev.toLocaleString()}</span>
                    </div>
                  )}
                  {result.FR != null && result.FR < 1 && (
                    <div className="hero-metric cav-high" title={L.frHint}>
                      <Activity size={12} />
                      <span className="hero-metric-label">FR</span>
                      <span className="hero-metric-value">{result.FR}</span>
                    </div>
                  )}
                  {result.letdown && (
                    <>
                      <div className="hero-metric">
                        <Activity size={12} />
                        <span className="hero-metric-label">{L.stageCount}</span>
                        <span className="hero-metric-value">
                          {result.letdown.stages}{result.letdown.stagesRecommended !== result.letdown.stages ? " / " + result.letdown.stagesRecommended : ""} · {L.governing} {result.letdown.governingStage}
                        </span>
                      </div>
                      {result.letdown.outletTempC != null && (
                        <div className="hero-metric">
                          <Thermometer size={12} />
                          <span className="hero-metric-label">{L.outletTemp}</span>
                          <span className="hero-metric-value">{result.letdown.outletTempC} °C</span>
                        </div>
                      )}
                      {result.letdown.outletMach != null && (
                        <div className="hero-metric">
                          <Gauge size={12} />
                          <span className="hero-metric-label">{L.outletMachLbl}</span>
                          <span className="hero-metric-value">{result.letdown.outletMach} · r {result.letdown.pressureRatio}</span>
                        </div>
                      )}
                      {result.letdown.kineticEnergyKwM2 != null && (
                        <div className="hero-metric" title={L.keLimitHint}>
                          <Activity size={12} />
                          <span className="hero-metric-label">{L.kinEth}</span>
                          <span className="hero-metric-value">{result.letdown.kineticEnergyKwM2} kW/m²{result.letdown.kineticEnergyRatio ? " · " + result.letdown.kineticEnergyRatio + "×" : ""}</span>
                        </div>
                      )}
                    </>
                  )}
                  {result.twoPhase || result.model ? (
                    <>
                      <div className="hero-metric" title={L.twoPhaseNote}>
                        <Activity size={12} />
                        <span className="hero-metric-label">{L.modelLbl}</span>
                        <span className="hero-metric-value">
                          {result.model === "omega" ? "ω" : result.model.toUpperCase()}{result.omega != null ? " · ω = " + result.omega : ""}
                        </span>
                      </div>
                      {result.massFlux != null && (
                        <div className="hero-metric">
                          <Activity size={12} />
                          <span className="hero-metric-label">{L.massFlux}</span>
                          <span className="hero-metric-value">{result.massFlux.toLocaleString()} kg/m²·s</span>
                        </div>
                      )}
                      {result.throatPressureBar != null && (
                        <div className="hero-metric">
                          <Gauge size={12} />
                          <span className="hero-metric-label">{L.throatPLbl}</span>
                          <span className="hero-metric-value">
                            {result.throatPressureBar} bar{result.criticalPressureRatio != null ? " · ηc " + result.criticalPressureRatio : ""}
                          </span>
                        </div>
                      )}
                      {result.saturationPressureBar != null && (
                        <div className="hero-metric">
                          <Thermometer size={12} />
                          <span className="hero-metric-label">{L.flashPLbl}</span>
                          <span className="hero-metric-value">{result.saturationPressureBar} bar</span>
                        </div>
                      )}
                      {result.outletQuality != null && (
                        <div className="hero-metric">
                          <Waves size={12} />
                          <span className="hero-metric-label">{L.xOutLbl}</span>
                          <span className="hero-metric-value">
                            x = {(result.outletQuality * 100).toFixed(1)}%{result.outletTempC != null ? " · " + result.outletTempC + " °C" : ""}
                          </span>
                        </div>
                      )}
                      {result.areaMm2 != null && (
                        <div className="hero-metric">
                          <BarChart3 size={12} />
                          <span className="hero-metric-label">{L.areaLbl}</span>
                          <span className="hero-metric-value">{result.areaMm2} mm²</span>
                        </div>
                      )}
                      {result.residenceTimeMs != null && (
                        <div className="hero-metric">
                          <Clock size={12} />
                          <span className="hero-metric-label">{L.residenceLbl}</span>
                          <span className="hero-metric-value">≈ {result.residenceTimeMs} ms</span>
                        </div>
                      )}
                      {result.propertySource && (
                        <div className="hero-metric" title={result.vapourSource ? L.vapourSource + ": " + result.vapourSource : L.twoPhaseNote}>
                          <Droplets size={12} />
                          <span className="hero-metric-label">{L.propsLbl}</span>
                          <span className="hero-metric-value">
                            {result.propertySource === "iapws-if97" ? L.propsIapws : L.propsCC}
                            {result.vapourDensityKgM3 != null ? " · ρG " + result.vapourDensityKgM3 + " kg/m³" : ""}
                          </span>
                        </div>
                      )}
                      {result.outletStateKnown === false && (
                        <div className="hero-metric" role="note">
                          <AlertTriangle size={12} color="#E81123" />
                          <span className="hero-metric-label">{L.xOutLbl}</span>
                          <span className="hero-metric-value" style={{ color: "#E81123" }}>—</span>
                        </div>
                      )}
                    </>
                  ) : null}
                  {result.steamBasis && (
                    <div className="hero-metric">
                      <Flame size={12} />
                      <span className="hero-metric-label">{L.steamBasisLbl}</span>
                      <span className="hero-metric-value">
                        {result.steamBasis === "superheated"
                          ? `${L.superheated} (+${result.superheatC} °C)`
                          : L.saturated}
                      </span>
                    </div>
                  )}
                </div>

                {(result.noise || result.viscosityCorrected) && (
                  <div className="result-hero-footnote">
                    {result.noise && <span>{L.noiseNote}</span>}
                    {result.viscosityCorrected && (
                      <span>{isFa
                        ? `جریان ${result.flowRegime === "laminar" ? "لامینار" : "گذار"} — Cv با FR=${result.FR} تصحیح ویسکوزیته شد؛ با سازنده تأیید کنید.`
                        : `${result.flowRegime} flow — Cv viscosity-corrected with FR=${result.FR}; verify with vendor.`}</span>
                    )}
                  </div>
                )}
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

              {result.warnings && result.warnings.length > 0 && (
                <div className="result-warnings no-print">
                  {result.warnings.map((w, i) => (
                    <div key={i} className={"warning-chip " + w.type} role={w.type === "danger" ? "alert" : "note"}>
                      {w.type === "info" ? <Info size={12} /> : <AlertTriangle size={12} />}
                      <span>{w.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.twoPhase && (
                <div className="sizing-card" style={{ marginTop: 10 }}>
                  <div className="card-head" style={{ marginBottom: 8 }}>
                    <Waves size={14} color="var(--gold)" />
                    <span className="card-head-text">{L.modelCompare}</span>
                  </div>
                  <div style={{ display: "grid", gap: 3, direction: "ltr" }}>
                    {result.twoPhase.rows.map((row) => (
                      <div key={row.model} style={{
                        display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1.4fr", gap: 6,
                        alignItems: "center", padding: "6px 8px", borderRadius: 8,
                        background: row.model === result.model ? "rgba(224, 168, 26, 0.12)" : "var(--bg-soft)",
                        border: "1px solid " + (row.model === result.model ? "var(--gold)" : "var(--border)")
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text)" }}>
                          {row.model === "omega" ? "ω Leung" : row.model === "additive" ? "Cv₁+Cv₂" : row.model.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: row.error ? "#E81123" : "var(--text)", fontFamily: "monospace" }}>
                          {row.error ? "—" : "Cv " + row.Cv}
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {row.error ? "" : (row.ratioVsOmega != null ? row.ratioVsOmega + "×" : "—")}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-soft)" }} title={row.error || ""}>
                          {row.error ? "—" : `${row.size || "—"} · ${row.choked ? L.choked : "—"}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.7 }}>
                    {L.twoPhaseNote}
                    {result.twoPhase.minCv != null && result.twoPhase.maxCv != null && result.twoPhase.minCv > 0
                      ? ` · ${result.twoPhase.minCv} … ${result.twoPhase.maxCv} Cv`
                      : ""}
                  </div>
                </div>
              )}

              {topProduct && topProduct.forced && (
                <div role="note" className="sized-from-banner">
                  <Star size={13} />
                  <span style={{ flex: 1 }}>
                    {L.sizedFrom.replace("{product}", topProduct.product.name?.[locale] || topProduct.product.name?.en || topProduct.product.series)}
                  </span>
                  <Link href={"/" + locale + "/products/" + topProduct.product.slug} className="sized-from-link">
                    {L.viewProduct}
                  </Link>
                </div>
              )}

              <ValveCharacteristicChart result={result} form={siForm} locale={locale} />

              {topProduct && (
                <div className="result-product-card" style={{
                  background: "var(--bg-card)",
                  border: topProduct.source === "estimated"
                    ? "1.5px solid rgba(245,158,11,0.55)"
                    : "1.5px solid var(--border-strong)"
                }}>
                  <div className="product-card-head">
                    <Package size={14} color="var(--gold)" />
                    <span style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>
                      {L.product}
                    </span>
                    <span style={{
                      marginInlineStart: "auto",
                      padding: "2px 8px", borderRadius: 20, fontSize: 8.5, fontWeight: 900,
                      background: productSourceBadge(L, topProduct).bg,
                      color: productSourceBadge(L, topProduct).fg
                    }}>
                      {productSourceBadge(L, topProduct).text}
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
                      {topProduct.characteristic && (
                        <div style={{ fontSize: 10, color: "var(--text-soft)", fontWeight: 700, marginTop: 3 }}>
                          {L.characteristicLabel}: {characteristicLabel(L, topProduct.characteristic)}
                          {" · "}
                          {topProduct.curveBased ? L.curveBasis : L.linearBasis}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-soft)", marginTop: 8, lineHeight: 1.7, fontWeight: 600 }}>
                    {productSourceNote(L, topProduct)}
                  </div>
                  {topProduct.withinMargin === false && (
                    <div role="alert" style={{ fontSize: 10, color: "#92400E", fontWeight: 800, marginTop: 6 }}>
                      ⚠ {L.marginExceeded}
                    </div>
                  )}
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
            <TipsAndStandards result={result} form={siForm} units={displayUnits} locale={locale} />
          )}
          {referenceTab === "material" && (
            <MaterialGuide form={siForm} fluid={fluid} locale={locale} />
          )}
          {referenceTab === "charts" && (
            <div style={{ display: "grid", gap: 12 }}>
              {result && !result.error ? (
                <>
                  <AlternativeSizes result={result} locale={locale} />
                  <InstalledChart result={result} form={siForm} units={siEngineUnits} locale={locale} />
                  <DeltaPChart result={result} form={siForm} units={siEngineUnits} locale={locale} />
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
        formSI={siForm}
        units={displayUnits}
        unitSystem={unitSystem}
        fluid={fluid}
        locale={locale}
        mode={mode}
        selectedFluidName={selectedFluidName}
        catalogMatch={topProduct}
      />

      <SizingCompare
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        result={result}
        form={form}
        units={displayUnits}
        unitSystem={unitSystem}
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
        .toggle-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .toggle-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 7px;
          border: 1px solid var(--border);
          background: var(--bg-soft);
          color: var(--text-muted);
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
        }
        .toggle-chip.active {
          border-color: var(--gold);
          color: var(--gold);
          background: rgba(224, 168, 26, 0.10);
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

        .result-hero-footnote {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 10px;
          font-size: 9.5px;
          font-weight: 600;
          line-height: 1.6;
          opacity: 0.78;
          color: #FFFFFF;
        }

        .result-warnings {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .warning-chip {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 9px;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1.6;
          border: 1px solid var(--border);
        }
        .warning-chip svg { flex-shrink: 0; margin-top: 2px; }
        .warning-chip.danger { background: rgba(232, 17, 35, 0.08); color: #E81123; border-color: rgba(232, 17, 35, 0.35); }
        .warning-chip.warning { background: rgba(224, 168, 26, 0.10); color: #92400E; border-color: rgba(224, 168, 26, 0.4); }
        .warning-chip.info { background: var(--bg-soft); color: var(--text-soft); }

        .sized-from-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #065F46;
          font-size: 11px;
          font-weight: 800;
        }
        .sized-from-banner svg { flex-shrink: 0; }
        .sized-from-link {
          margin-inline-start: auto;
          font-size: 10px;
          font-weight: 900;
          color: var(--gold);
          white-space: nowrap;
        }

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