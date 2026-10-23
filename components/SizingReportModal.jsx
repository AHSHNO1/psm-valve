"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Printer, Camera, Save, Copy, Check, Share2,
  Activity, Star, ArrowLeft, FileText, AlertTriangle,
  CheckCircle2, Gauge, BarChart3, Package, TrendingDown, TrendingUp, Info, Waves
} from "lucide-react";
import { ValveCharacteristicChart } from "./SizingCharts";
import { VALVE_SIZES } from "@/lib/sizing-advanced";
import { buildSizingParams } from "@/lib/sizing-link";
import { generateSizingPDF } from "@/lib/pdf-generator";
import { velocityFromSI, barToPressure } from "@/lib/unit-system";
import { track } from "@/lib/analytics";

// نام مشخصهٔ ذاتی کاتالوگ در چهار زبان (خروجی انتخاب شیر)
const CATALOG_CHARACTERISTICS = {
  fa: { equal: "درصدی (Equal%)", modified: "درصدی اصلاح‌شده", linear: "خطی (Linear)", quick: "بازشدگی سریع" },
  en: { equal: "Equal %", modified: "Modified %", linear: "Linear", quick: "Quick opening" },
  ar: { equal: "نسبة متساوية (Equal%)", modified: "نسبة معدلة", linear: "خطي (Linear)", quick: "فتح سريع" },
  ru: { equal: "Равнопроцентная (Equal %)", modified: "Модифицированная", linear: "Линейная", quick: "Быстрооткрывающаяся" }
};

const MW_LABEL = {
  fa: "جرم مولکولی (MW)",
  en: "Molecular weight (MW)",
  ar: "الوزن الجزيئي (MW)",
  ru: "Молекулярная масса (MW)"
};

// برچسب‌های گزارش سرویس (شیر اطمینان / دسوپرهیتر) — روی L اصلی سوار می‌شود
const SERVICE_L = {
  fa: {
    psvTitle: "گزارش برآورد سایزینگ شیر اطمینان", psvSubtitle: "API RP 520 Part I و اوریفیس API 526 — پیش‌طراحی، نه محاسبه گواهی‌شده ASME",
    desuperTitle: "گزارش برآورد ایستگاه دسوپرهیتر", desuperSubtitle: "میزان آب اسپری بر پایهٔ اختلاط بی‌درار — تأیید نازل و تریم با سازنده",
    svcInputs: "پارامترهای ورودی", svcResults: "نتایج محاسبه", svcFindings: "هشدارها و ملاحظات", svcNotes: "فرض‌ها و یادداشت‌های موتور",
    orificeLbl: "اوریفیس API 526", areaLbl: "مساحت لازم", capacityLbl: "ظرفیت اوریفیس", utilLbl: "بهره‌گیری از اوریفیس",
    setPLbl: "فشار تنظیم (گیج)", overPLbl: "اضافه‌فشار مجاز", relPLbl: "فشار تخلیه (مطلق)", backPLbl: "فشار پشتی (مطلق)",
    regimeLbl: "نظم جریان", kdLbl: "Kd / Kb / Kc", equationLbl: "معادلهٔ به‌کاررفته", equivCvLbl: "Cv/Kv معادل (کنترل متقاطع)",
    valveTypeLbl: "نوع شیر", inletLossLbl: "افت غیرقابل بازیابی ورودی",
    waterLbl: "دبی آب اسپری", ratioLbl: "نسبت آب به بخار", dutyLbl: "بار حرارتی", targetTLbl: "دمای هدف خروجی",
    waterPLbl: "فشار ایستگاه آب", waterTLbl: "دمای آب", injCvLbl: "Cv شیر تزریق", satMarginLbl: "حاشیهٔ اشباع",
    tsatLbl: "دمای اشباع در P1", sprayDpLbl: "افت فشار اسپری", steamSupplyLbl: "Cv شیر بخار بالادست",
    superInLbl: "سوپرهیت ورودی", superOutLbl: "سوپرهیت خروجی",
    twoPhaseTitle: "گزارش برآورد سایزینگ دو‌فازی (فلشینگ)",
    twoPhaseSubtitle: "روش ω لوینگ / HEM / HNE — پیش‌طراحی، نه محاسبهٔ اعتباریسازی‌شدهٔ IEC 60534",
    tpMassLbl: "دبی جرمی کل W", tpQualityLbl: "کسیر بخار ورودی x", tpRhoL: "چگالی مایع ρL", tpRhoG: "چگالی بخار ρG",
    tpModelLbl: "مدل دو‌فازی", tpOmegaLbl: "پارامتر ω", tpFluxLbl: "شار جرمی گلوگاه", tpThroatLbl: "فشار گلوگاه / ηc",
    tpFlashLbl: "فشار آغاز فلاش", tpX2Lbl: "کیفیت خروجی", tpT2Lbl: "دمای خروجی", tpResLbl: "زمان اقامت در گلوگاه",
    tpEffAreaLbl: "مساحت مؤثر", tpSourceLbl: "منبع خواص", tpCompare: "مقایسهٔ چهار مدل دو‌فازی",
    tpSpreadLbl: "پراکندگی Cv مدل‌ها", tpMixVelLbl: "سرعت مخلوط خروجی", tpQactLbl: "دبی حجمی در شرایط جاری",
    tpRhoInLbl: "چگالی مخلوط ورودی", tpRhoOutLbl: "چگالی مخلوط خروجی", tpNotComputed: "محاسبه نشد",
    tpRatioLbl: "نسبت به ω", tpChokedLbl: "جریان Choked", tpYes: "بله", tpNo: "خیر"
  },
  en: {
    psvTitle: "Pressure Relief Valve Sizing Estimate", psvSubtitle: "API RP 520 Part I with API 526 orifice — preliminary, not an ASME-certified calculation",
    desuperTitle: "Desuperheater Station Estimate", desuperSubtitle: "Spray water from adiabatic mixing — nozzle and trim to be confirmed by the vendor",
    svcInputs: "Input Parameters", svcResults: "Calculated Results", svcFindings: "Warnings & Findings", svcNotes: "Engine Assumptions",
    orificeLbl: "API 526 orifice", areaLbl: "Required area", capacityLbl: "Orifice capacity", utilLbl: "Orifice utilisation",
    setPLbl: "Set pressure (gauge)", overPLbl: "Allowable overpressure", relPLbl: "Relieving pressure (absolute)", backPLbl: "Backpressure (absolute)",
    regimeLbl: "Flow regime", kdLbl: "Kd / Kb / Kc", equationLbl: "Equation used", equivCvLbl: "Equivalent Cv/Kv (cross-check)",
    valveTypeLbl: "Valve type", inletLossLbl: "Inlet non-recoverable loss",
    waterLbl: "Spray water flow", ratioLbl: "Water / steam ratio", dutyLbl: "Thermal duty", targetTLbl: "Target outlet temperature",
    waterPLbl: "Water station pressure", waterTLbl: "Water temperature", injCvLbl: "Injection valve Cv", satMarginLbl: "Saturation margin",
    tsatLbl: "Saturation temperature at P1", sprayDpLbl: "Spray dP", steamSupplyLbl: "Upstream steam valve Cv",
    superInLbl: "Inlet superheat", superOutLbl: "Outlet superheat",
    twoPhaseTitle: "Two-Phase (Flashing) Valve Sizing Estimate",
    twoPhaseSubtitle: "Leung omega / HEM / HNE — preliminary, not an IEC 60534 two-phase validation",
    tpMassLbl: "Total mass flow W", tpQualityLbl: "Inlet vapour mass fraction x", tpRhoL: "Liquid density ρL", tpRhoG: "Vapour density ρG",
    tpModelLbl: "Two-phase model", tpOmegaLbl: "omega parameter", tpFluxLbl: "Throat mass flux", tpThroatLbl: "Throat pressure / ηc",
    tpFlashLbl: "Flash onset pressure", tpX2Lbl: "Outlet quality", tpT2Lbl: "Outlet temperature", tpResLbl: "Throat residence time",
    tpEffAreaLbl: "Effective area", tpSourceLbl: "Property source", tpCompare: "Four-model two-phase comparison",
    tpSpreadLbl: "Cv spread of the models", tpMixVelLbl: "Outlet mixture velocity", tpQactLbl: "Volumetric flow at flowing conditions",
    tpRhoInLbl: "Inlet mixture density", tpRhoOutLbl: "Outlet mixture density", tpNotComputed: "not computed",
    tpRatioLbl: "Ratio to ω", tpChokedLbl: "Choked", tpYes: "Yes", tpNo: "No"
  },
  ar: {
    psvTitle: "تقدير حجم صمام الأمان", psvSubtitle: "API RP 520 الجزء الأول مع فتحة API 526 — تقديري وليس حسابًا معتمدًا من ASME",
    desuperTitle: "تقدير محطة إزالة الحرارة الفائقة", desuperSubtitle: "ماء الرش من الخلط الكظوم — يجب تأكيد الفوهة والتريم مع المصنّع",
    svcInputs: "المدخلات", svcResults: "النتائج", svcFindings: "التحذيرات", svcNotes: "فرضيات المحرك",
    orificeLbl: "فتحة API 526", areaLbl: "المساحة المطلوبة", capacityLbl: "سعة الفتحة", utilLbl: "نسبة الاستخدام",
    setPLbl: "ضغط الضبط (مقياس)", overPLbl: "الضغط الزائد المسموح", relPLbl: "ضغط التصريف (مطلق)", backPLbl: "الضغط الخلفي (مطلق)",
    regimeLbl: "نظام التدفق", kdLbl: "Kd / Kb / Kc", equationLbl: "المعادلة المستخدمة", equivCvLbl: "Cv/Kv المكافئ (مقارنة)",
    valveTypeLbl: "نوع الصمام", inletLossLbl: "فقد المدخل غير القابل للاسترجاع",
    waterLbl: "تدفق ماء الرش", ratioLbl: "نسبة الماء للبخار", dutyLbl: "الحمل الحراري", targetTLbl: "درجة حرارة الخروج الهدف",
    waterPLbl: "ضغط ماء التغذية", waterTLbl: "درجة حرارة الماء", injCvLbl: "Cv صمام الحقن", satMarginLbl: "هامش التشبع",
    tsatLbl: "درجة التشبع عند P1", sprayDpLbl: "فرق ضغط الرش", steamSupplyLbl: "Cv صمام البخار العلوي",
    superInLbl: "الحرارة الفائقة للمدخل", superOutLbl: "الحرارة الفائقة للخروج",
    twoPhaseTitle: "تقدير حجم الصمام للطورين (التبخّر السريع)",
    twoPhaseSubtitle: "طريقة أوميغا لوينغ / HEM / HNE — تقديري وليس تحققًا معتمدًا من IEC 60534",
    tpMassLbl: "التدفق الكتلي الكلي W", tpQualityLbl: "كسر البخار الكتلي عند المدخل x", tpRhoL: "كثافة السائل ρL", tpRhoG: "كثافة البخار ρG",
    tpModelLbl: "نموذج الطورين", tpOmegaLbl: "معلمة أوميغا", tpFluxLbl: "تدفق الكتلة عند الخانق", tpThroatLbl: "ضغط الخانق / ηc",
    tpFlashLbl: "ضغط بداية التبخّر", tpX2Lbl: "جودة المخرج", tpT2Lbl: "درجة حرارة المخرج", tpResLbl: "زمن المكوث في الخانق",
    tpEffAreaLbl: "المساحة الفعّالة", tpSourceLbl: "مصدر الخصائص", tpCompare: "مقارنة النماذج الأربعة للطورين",
    tpSpreadLbl: "انتشار قيم Cv بين النماذج", tpMixVelLbl: "سرعة الخليط عند المخرج", tpQactLbl: "التدفق الحجمي عند ظروف الجريان",
    tpRhoInLbl: "كثافة الخليط عند المدخل", tpRhoOutLbl: "كثافة الخليط عند المخرج", tpNotComputed: "لم تُحسب",
    tpRatioLbl: "النسبة إلى ω", tpChokedLbl: "مختنق", tpYes: "نعم", tpNo: "لا"
  },
  ru: {
    psvTitle: "Предварительный расчёт предохранительного клапана", psvSubtitle: "API RP 520 Часть I и сопло API 526 — оценка, не сертификат ASME",
    desuperTitle: "Оценка станции десуперхитера", desuperSubtitle: "Расход воды по адиабатическому смешению — сопло и трим уточняются у изготовителя",
    svcInputs: "Входные данные", svcResults: "Результаты", svcFindings: "Предупреждения", svcNotes: "Допущения расчёта",
    orificeLbl: "Сопло API 526", areaLbl: "Требуемая площадь", capacityLbl: "Пропускная способность", utilLbl: "Использование сопла",
    setPLbl: "Давление настройки (изб.)", overPLbl: "Допустимое избыточное давление", relPLbl: "Давление сброса (абс.)", backPLbl: "Противодавление (абс.)",
    regimeLbl: "Режим потока", kdLbl: "Kd / Kb / Kc", equationLbl: "Используемое уравнение", equivCvLbl: "Эквивалент Cv/Kv (сверка)",
    valveTypeLbl: "Тип клапана", inletLossLbl: "Невосстанавливаемые потери на входе",
    waterLbl: "Расход распыляемой воды", ratioLbl: "Вода / пар", dutyLbl: "Тепловая нагрузка", targetTLbl: "Целевая температура на выходе",
    waterPLbl: "Давление воды", waterTLbl: "Температура воды", injCvLbl: "Cv инжекционного клапана", satMarginLbl: "Запас до насыщения",
    tsatLbl: "Температура насыщения при P1", sprayDpLbl: "Перепад распыла", steamSupplyLbl: "Cv клапана пара",
    superInLbl: "Перегрев на входе", superOutLbl: "Перегрев на выходе",
    twoPhaseTitle: "Предварительный двухфазный расчёт (вскипание)",
    twoPhaseSubtitle: "Метод ω Лоунга / HEM / HNE — оценка, не подтверждённый расчёт IEC 60534",
    tpMassLbl: "Полный массовый расход W", tpQualityLbl: "Массовая доля пара на входе x", tpRhoL: "Плотность жидкости ρL", tpRhoG: "Плотность пара ρG",
    tpModelLbl: "Двухфазная модель", tpOmegaLbl: "Параметр ω", tpFluxLbl: "Массовый поток в горле", tpThroatLbl: "Давление в горле / ηc",
    tpFlashLbl: "Давление начала вскипания", tpX2Lbl: "Качество на выходе", tpT2Lbl: "Температура на выходе", tpResLbl: "Время пребывания в горле",
    tpEffAreaLbl: "Эффективная площадь", tpSourceLbl: "Источник свойств", tpCompare: "Сравнение четырёх двухфазных моделей",
    tpSpreadLbl: "Разброс Cv по моделям", tpMixVelLbl: "Скорость смеси на выходе", tpQactLbl: "Объёмный расход при рабочих условиях",
    tpRhoInLbl: "Плотность смеси на входе", tpRhoOutLbl: "Плотность смеси на выходе", tpNotComputed: "не рассчитано",
    tpRatioLbl: "Отношение к ω", tpChokedLbl: "Критический", tpYes: "да", tpNo: "нет"
  }
};

export default function SizingReportModal({ isOpen, onClose, result, form, formSI = null, units = null, unitSystem = "SI", fluid, locale = "fa", selectedFluidName, catalogMatch = null, mode = "control" }) {
  const [mounted, setMounted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shotLoading, setShotLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // شناسه و تاریخ گزارش یک بار در باز شدن مودال ساخته میشوند (نه در هر رندر)
  const [reportStamp] = useState(() => Date.now().toString().slice(-6));
  const [reportDate] = useState(() => new Date().toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB"));

  const isFa = locale === "fa";
  const characteristicNames = CATALOG_CHARACTERISTICS[locale] || CATALOG_CHARACTERISTICS.en;
  const characteristicName = catalogMatch && catalogMatch.characteristic
    ? characteristicNames[catalogMatch.characteristic] || catalogMatch.characteristic
    : null;

  // واحدهای نمایشی از SizingTool میآیند؛ در نبود آنها واحدهای SI فرض میشوند
  const flowUnit = (units && units.flow) || (fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m³/h" : "Nm³/h"));
  const pressureUnit = (units && units.pressure) || "bar";
  const tempUnit = (units && units.temp) || "°C";
  const velocityUnit = (units && units.velocity) || "m/s";
  const mwLabel = MW_LABEL[locale] || MW_LABEL.en;
  // واحد مستقل هر فیلد (انتخاب کاربر) — برای برچسب درست مقادیر ورودی
  const fieldUnits = (units && units.field) || {};
  const unitOf = (field, fallback) => fieldUnits[field] || fallback;
  // نمودارها همیشه با فرم SI رسم میشوند (معادلات موتور بر پایهٔ SI است)
  const chartForm = formSI || form;
  // افت فشار از نسخهٔ SI (bar) محاسبه و به واحد نمایشی تبدیل میشود
  const dpBar = (chartForm.P1 || 0) - (chartForm.P2 || 0);
  const dpDisplay = +barToPressure(dpBar, pressureUnit).toFixed(3);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && isOpen) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const L = {
    fa: {
      title: "گزارش برآورد اولیه سایزینگ شیر", subtitle: "نتیجه تأییدشده ISA-75.01.01 (IEC 60534-2-1) نیست",
      engineeringDisclaimer: "این برآورد جایگزین محاسبه کامل ISA-75.01.01 (IEC 60534-2-1) یا تأیید سازنده نیست؛ برای انتخاب نهایی، با واحد مهندسی شرکت پتروسازه میهن بررسی کنید.",
      capacityExceeded: "Cv موردنیاز از ظرفیت بزرگ‌ترین سایز فهرست‌شده بیشتر است؛ انتخاب نهایی نیازمند بررسی مهندسی است.",
      reportRef: "شماره گزارش", date: "تاریخ",
      inputs: "پارامترهای ورودی", chart: "مشخصه جریان شیر",
      candidates: "سایزهای پیشنهادی", candidateHint: "سه سایز حول نقطه کار شما",
      tips: "توصیه‌های مهندسی", exports: "خروجی گزارش",
      fullReport: "گزارش کامل PDF", image: "تصویر گزارش", excel: "Excel (CSV)",
      copy: "کپی متن", copied: "کپی شد", copyLink: "کپی لینک", linkCopied: "لینک کپی شد",
      reqQuote: "درخواست قیمت", close: "بستن",
      fluidLbl: "سیال", flowLbl: "دبی", p1Lbl: "فشار ورودی", p2Lbl: "فشار خروجی",
      dpLbl: "افت فشار", gfLbl: "چگالی نسبی", ggLbl: "چگالی گاز", pvLbl: "فشار بخار", tLbl: "دما",
      cvLbl: "ضریب Cv", kvLbl: "ضریب Kv", sizeLbl: "سایز", openingLbl: "بازشدگی",
      velocityLbl: "سرعت", noiseLbl: "نویز", cavLbl: "کاویتاسیون",
      marginLbl: "حاشیهٔ طراحی", minCvLbl: "Cv در دبی مینیمم", minOpenLbl: "بازشدگی در دبی مینیمم", machLbl: "عدد ماخ در بدنه",
      recommended: "پیشنهاد", tooSmall: "خیلی کوچک", small: "کوچک", optimal: "بهینه", large: "بزرگ", tooLarge: "خیلی بزرگ",
      catalogTitle: "انتخاب از کاتالوگ PSM",
      catalogSeries: "سری",
      catalogTrim: "ترم (Cv نامی)",
      catalogCharacteristic: "مشخصهٔ ذاتی",
      catalogBasis: "مبنای بازشدگی",
      catalogBasisCurve: "منحنی کاتالوگ",
      catalogBasisLinear: "فرض خطی (بدون منحنی)",
      catalogDataSrc: "سرچشمهٔ دادهٔ Cv",
      dataSrcCatalog: "اندازه‌گیری‌شدهٔ کاتالوگ",
      dataSrcEstimated: "برآورد مهندسی ({band}، اعتماد {confidence})",
      dataSrcAdmin: "جدول دست‌نویس ادمین",
      dataSrcGeneric: "جدول Cv عمومی",
      estimateWarn: "Cv انتخاب‌شده اندازه‌گیری‌شده نیست؛ از قانون مقیاس Cv روی سری‌های اندازه‌گیری‌شده به‌دست آمده و باید پیش از سفارش تأیید شود.",
      catalogMarginWarn: "بازشدگی از ۸۰٪ بیشتر است — سایز بزرگ‌تر پیشنهاد می‌شود",
      nuLbl: "گرانروی (ν)", revLbl: "رینولدز شیر (Rev)", frLbl: "ضریب FR",
      flashLbl: "فلاشینگ (P2<Pv)", steamBasisLbl: "مبنای بخار",
      saturated: "اشباع", superheated: "سوپرهیت",
      riskLow: "کم", riskMedium: "متوسط", riskHigh: "بالا", riskFlashing: "فلاشینگ",
      noiseNote: "نویز ≈ برآورد راهنما (log10) است، نه محاسبهٔ IEC 60534-8-3",
      ldTitle: "ایستگاه لت‌داون (ISA RP75.23)", ldStages: "مراحل کاهش فشار", ldGoverning: "مرحلهٔ حاکم",
      ldT2: "دمای خروجی", ldMachOut: "عدد ماخ خروجی", ldRatio: "نسبت فشار", ldKE: "انرژی جنبشی خروجی"
    },
    en: {
      title: "Preliminary Control Valve Sizing Estimate", subtitle: "Not a validated ISA-75.01.01 (IEC 60534-2-1) calculation",
      engineeringDisclaimer: "This estimate is not a substitute for a complete ISA-75.01.01 (IEC 60534-2-1) calculation or manufacturer validation. For the final selection, consult the Engineering Department of Petro Sazeh Mihan Co.",
      capacityExceeded: "Required Cv exceeds the largest listed valve size. Final selection requires engineering review.",
      reportRef: "Report No.", date: "Date",
      inputs: "Input Parameters", chart: "Valve Flow Characteristic",
      candidates: "Suggested Valve Sizes", candidateHint: "Three sizes around your operating point",
      tips: "Engineering Recommendations", exports: "Report Exports",
      fullReport: "Full PDF Report", image: "Report Image", excel: "Excel (CSV)",
      copy: "Copy Text", copied: "Copied", copyLink: "Copy Link", linkCopied: "Link copied",
      reqQuote: "Request Quote", close: "Close",
      fluidLbl: "Fluid", flowLbl: "Flow", p1Lbl: "Inlet pressure", p2Lbl: "Outlet pressure",
      dpLbl: "Pressure drop", gfLbl: "Specific gravity", ggLbl: "Gas gravity", pvLbl: "Vapor pressure", tLbl: "Temperature",
      cvLbl: "Cv Factor", kvLbl: "Kv Factor", sizeLbl: "Size", openingLbl: "Opening",
      velocityLbl: "Velocity", noiseLbl: "Noise", cavLbl: "Cavitation",
      marginLbl: "Design margin", minCvLbl: "Cv at min flow", minOpenLbl: "Opening at min flow", machLbl: "Body Mach",
      recommended: "Recommended", tooSmall: "Too Small", small: "Small", optimal: "Optimal", large: "Large", tooLarge: "Too Large",
      catalogTitle: "PSM catalogue selection",
      catalogSeries: "Series",
      catalogTrim: "Trim (rated Cv)",
      catalogCharacteristic: "Inherent characteristic",
      catalogBasis: "Opening basis",
      catalogBasisCurve: "Catalogue curve",
      catalogBasisLinear: "Linear assumption (no curve)",
      catalogDataSrc: "Cv data source",
      dataSrcCatalog: "Measured catalogue data",
      dataSrcEstimated: "Engineering estimate ({band}, confidence {confidence})",
      dataSrcAdmin: "Admin draft table",
      dataSrcGeneric: "General Cv table",
      estimateWarn: "The selected Cv is not measured data — it comes from the Cv scaling law fitted to the measured series and must be confirmed before ordering.",
      catalogMarginWarn: "Opening above 80% — a larger size is recommended",
      nuLbl: "Viscosity (ν)", revLbl: "Valve Reynolds (Rev)", frLbl: "FR factor",
      flashLbl: "Flashing (P2<Pv)", steamBasisLbl: "Steam basis",
      saturated: "Saturated", superheated: "Superheated",
      riskLow: "Low", riskMedium: "Medium", riskHigh: "High", riskFlashing: "Flashing",
      noiseNote: "Noise ≈ is an indicative estimate (log10 heuristic), not IEC 60534-8-3",
      ldTitle: "Letdown station (ISA RP75.23)", ldStages: "Pressure stages", ldGoverning: "Governing stage",
      ldT2: "Outlet temperature", ldMachOut: "Outlet Mach", ldRatio: "Pressure ratio", ldKE: "Outlet kinetic energy"
    },
    ar: {
      title: "تقدير أولي لحجم صمام التحكم", subtitle: "ليس حسابًا معتمدًا وفق ISA-75.01.01 (IEC 60534-2-1)",
      engineeringDisclaimer: "هذا التقدير لا يغني عن حساب كامل وفق ISA-75.01.01 (IEC 60534-2-1) أو تأكيد الشركة المصنّعة. يجب مراجعة الاختيار النهائي مع الإدارة الهندسية لشركة بترو سازه ميهان.",
      capacityExceeded: "يتجاوز Cv المطلوب أكبر حجم مدرج؛ يتطلب الاختيار النهائي مراجعة هندسية.",
      reportRef: "رقم التقرير", date: "التاريخ",
      inputs: "المدخلات", chart: "الرسم", candidates: "الأحجام المقترحة",
      candidateHint: "ثلاثة أحجام", tips: "التوصيات", exports: "التصدير",
      fullReport: "PDF", image: "صورة", excel: "Excel", copy: "نسخ", copied: "تم",
      copyLink: "نسخ الرابط", linkCopied: "تم النسخ", reqQuote: "طلب سعر", close: "إغلاق",
      fluidLbl: "السائل", flowLbl: "التدفق", p1Lbl: "الدخول", p2Lbl: "الخروج",
      dpLbl: "الفرق", gfLbl: "الكثافة", ggLbl: "كثافة الغاز", pvLbl: "ضغط البخار", tLbl: "الحرارة",
      cvLbl: "Cv", kvLbl: "Kv", sizeLbl: "الحجم", openingLbl: "الفتح",
      velocityLbl: "السرعة", noiseLbl: "الضجيج", cavLbl: "التجويف",
      marginLbl: "هامش التصميم", minCvLbl: "Cv عند أقل تدفق", minOpenLbl: "الفتح عند أقل تدفق", machLbl: "رقم ماخ في الجسم",
      recommended: "موصى به", tooSmall: "صغير جدًا", small: "صغير", optimal: "أمثل", large: "كبير", tooLarge: "كبير جدًا",
      catalogTitle: "الاختيار من كتالوج PSM",
      catalogSeries: "السلسلة",
      catalogTrim: "القطعة الداخلية (Cv الاسمي)",
      catalogCharacteristic: "المنحنى الذاتي",
      catalogBasis: "أساس الفتح",
      catalogBasisCurve: "منحنى الكاتالوج",
      catalogBasisLinear: "افتراض خطي (بدون منحنى)",
      catalogDataSrc: "مصدر بيانات Cv",
      dataSrcCatalog: "بيانات كتالوج مقاسة",
      dataSrcEstimated: "تقدير هندسي ({band}، ثقة {confidence})",
      dataSrcAdmin: "جدول مسودة المشرف",
      dataSrcGeneric: "جدول Cv العام",
      estimateWarn: "قيمة Cv المختارة غير مقاسة؛ إنها تقدير من قانون تنسيق Cv على السلاسل المقاسة ويجب تأكيدَها قبل الطلب.",
      catalogMarginWarn: "نسبة الفتح تتجاوز ۸۰٪ — يُنصح بحجم أكبر",
      nuLbl: "اللزوجة (ν)", revLbl: "رينولدز للصمام (Rev)", frLbl: "معامل FR",
      flashLbl: "وميض (P2<Pv)", steamBasisLbl: "أساس البخار",
      saturated: "مشبع", superheated: "مسخن",
      riskLow: "منخفض", riskMedium: "متوسط", riskHigh: "عالي", riskFlashing: "وميض",
      noiseNote: "الضجيج ≈ تقدير إرشادي (log10) وليس حساب IEC 60534-8-3",
      ldTitle: "محطة خفض الضغط (ISA RP75.23)", ldStages: "مراحل خفض الضغط", ldGoverning: "المرحلة الحاكمة",
      ldT2: "حرارة المخرج", ldMachOut: "رقم ماخ الخارج", ldRatio: "نسبة الضغط", ldKE: "الطاقة الحركية للمخرج"
    },
    ru: {
      title: "Предварительная оценка регулирующего клапана", subtitle: "Расчет не подтвержден по ISA-75.01.01 (IEC 60534-2-1)",
      engineeringDisclaimer: "Эта оценка не заменяет полный расчет по ISA-75.01.01 (IEC 60534-2-1) или подтверждение производителя. Окончательный выбор согласуйте с инженерным отделом компании Petro Sazeh Mihan.",
      capacityExceeded: "Требуемый Cv превышает максимальный размер в списке; необходима инженерная проверка.",
      reportRef: "№", date: "Дата", inputs: "Входные данные", chart: "График",
      candidates: "Размеры", candidateHint: "Три варианта", tips: "Рекомендации", exports: "Экспорт",
      fullReport: "PDF", image: "Изображение", excel: "Excel", copy: "Копировать", copied: "Скопировано",
      copyLink: "Копировать ссылку", linkCopied: "Ссылка скопирована", reqQuote: "Запросить", close: "Закрыть",
      fluidLbl: "Среда", flowLbl: "Расход", p1Lbl: "Вход", p2Lbl: "Выход",
      dpLbl: "Перепад", gfLbl: "Плотность", ggLbl: "Газ", pvLbl: "Давл. паров", tLbl: "Темп.",
      cvLbl: "Cv", kvLbl: "Kv", sizeLbl: "Размер", openingLbl: "Открытие",
      velocityLbl: "Скорость", noiseLbl: "Шум", cavLbl: "Кавитация",
      marginLbl: "Запас проектирования", minCvLbl: "Cv при мин. расходе", minOpenLbl: "Открытие при мин. расходе", machLbl: "Число Маха в корпусе",
      recommended: "Рекомендуется", tooSmall: "Слишком мал", small: "Мал", optimal: "Оптимально", large: "Велик", tooLarge: "Слишком велик",
      catalogTitle: "Выбор из каталога PSM",
      catalogSeries: "Серия",
      catalogTrim: "Трим (номинальный Cv)",
      catalogCharacteristic: "Собственная характеристика",
      catalogBasis: "Основа открытия",
      catalogBasisCurve: "Каталожная кривая",
      catalogBasisLinear: "Линейное допущение (без кривой)",
      catalogDataSrc: "Источник данных Cv",
      dataSrcCatalog: "Измеренные данные каталога",
      dataSrcEstimated: "Инженерная оценка ({band}, достоверность {confidence})",
      dataSrcAdmin: "Черновая таблица администратора",
      dataSrcGeneric: "Общая таблица Cv",
      estimateWarn: "Выбранный Cv не измерен — это оценка по степенному закону Cv по измеренным сериям; подтвердите перед заказом.",
      catalogMarginWarn: "Открытие выше 80% — рекомендуется больший размер",
      nuLbl: "Вязкость (ν)", revLbl: "Число Рейнольдса (Rev)", frLbl: "Коэффициент FR",
      flashLbl: "Кавитационное вскипание (P2<Pv)", steamBasisLbl: "База пара",
      saturated: "Насыщенный", superheated: "Перегретый",
      riskLow: "Низкий", riskMedium: "Средний", riskHigh: "Высокий", riskFlashing: "Вскипание",
      noiseNote: "Шум ≈ — ориентировочная оценка (log10), не расчёт IEC 60534-8-3",
      ldTitle: "Станция дросселирования (ISA RP75.23)", ldStages: "Ступени снижения", ldGoverning: "Расчётная ступень",
      ldT2: "Температура на выходе", ldMachOut: "Число Маха на выходе", ldRatio: "Отношение давлений", ldKE: "Кинетическая энергия на выходе"
    }
  }[locale] || {};
  Object.assign(L, SERVICE_L[locale] || SERVICE_L.en);

  // حالت سرویس: شیر اطمینان، دسوپرهیتر و دو‌فازی دیتاشیت مخصوص خودشان را دارند
  const svcMode = (result && result.mode)
    || (mode === "psv" || mode === "desuper" || mode === "twoPhase" ? mode : "control");
  const isService = svcMode === "psv" || svcMode === "desuper" || svcMode === "twoPhase";
  const svcFormSI = Object.assign({}, formSI || {}, (result && result.formSI) || {});
  const dash = "—";
  const val = (v, unit) => (v == null || !Number.isFinite(Number(v)) || String(v) === "" ? dash : `${v}${unit ? " " + unit : ""}`);
  // عنوان و زیرعنوان گزارش به‌ازای هر حالت سرویس
  const SVC_TITLE = { psv: "psvTitle", desuper: "desuperTitle", twoPhase: "twoPhaseTitle" };
  const SVC_SUB = { psv: "psvSubtitle", desuper: "desuperSubtitle", twoPhase: "twoPhaseSubtitle" };
  const svcTitleKey = SVC_TITLE[svcMode] || "title";
  const svcSubKey = SVC_SUB[svcMode] || "subtitle";
  const twoPhaseRows = (result && result.twoPhase && result.twoPhase.rows) || [];
  // یادداشت‌های موتور + یادداشت‌های جدول مقایسهٔ مدل‌ها (فقط دو‌فازی)
  const svcNotes = [
    ...((result && result.notes) || []),
    ...(svcMode === "twoPhase" && result && result.twoPhase ? result.twoPhase.notes || [] : [])
  ];

  // ردیف‌های لت‌داون: گزارش شیر کنترل این عددها را ندارد، ولی بدون آنها ایستگاه
  // لت‌داون قابل دفاع نیست (مراحل، ماخ خروجی و انرژی جنبشی ISA RP75.23).
  const letdownRows = (() => {
    const ld = result && result.letdown;
    if (!ld) return [];
    const rows = [];
    if (ld.stages != null) {
      rows.push([L.ldStages, `${ld.stages}${ld.stagesRecommended !== ld.stages ? ` / ${ld.stagesRecommended}` : ""}`, ""]);
    }
    if (ld.governingStage != null) rows.push([L.ldGoverning, ld.governingStage, ""]);
    if (ld.outletTempC != null) rows.push([L.ldT2, ld.outletTempC, "°C"]);
    if (ld.outletMach != null) rows.push([L.ldMachOut, ld.outletMach, ld.pressureRatio != null ? `r ${ld.pressureRatio}` : ""]);
    if (ld.kineticEnergyKwM2 != null) {
      rows.push([L.ldKE, ld.kineticEnergyKwM2, ld.kineticEnergyRatio != null ? `kW/m² · ${ld.kineticEnergyRatio}×` : "kW/m²"]);
    }
    return rows;
  })();

  // سرچشمهٔ دادهٔ سایز انتخابی: اندازه‌گیری‌شده / برآورد / دست‌نویس ادمین / جدول عمومی.
  // بدون این ردیف، Cv برآوردی در گزارش دقیقاً مثل دادهٔ کاتالوگ خوانده می‌شود.
  const dataSourceLabel = (() => {
    if (!catalogMatch) return null;
    const src = catalogMatch.source || "catalog";
    if (src !== "estimated") {
      return src === "catalog" ? L.dataSrcCatalog : src === "admin" ? L.dataSrcAdmin : L.dataSrcGeneric;
    }
    const band = Number.isFinite(catalogMatch.errorPct) ? `±${Math.round(catalogMatch.errorPct)}%` : "±45%";
    // سطح اعتماد در داده به‌صورت کلید انگلیسی ذخیره می‌شود؛ در گزارش باید بومی شود
    const confidence = catalogMatch.confidence === "medium" ? L.riskMedium : L.riskLow;
    return String(L.dataSrcEstimated).replace("{band}", band).replace("{confidence}", confidence);
  })();
  const isEstimatedMatch = Boolean(catalogMatch && catalogMatch.source === "estimated");

  function twoPhaseModelName(m) {
    if (!m) return dash;
    if (m === "omega") return "ω (Leung)";
    if (m === "additive") return "Cv₁ + Cv₂";
    return String(m).toUpperCase();
  }

  const serviceSummary = useMemo(() => {
    if (!isService || !result) return null;
    const orifice = result.requiredOrifice || {};
    const inputs = [["Fluid", selectedFluidName || result.fluidType || fluid]];
    const results = [];
    if (svcMode === "psv") {
      inputs.push([result.fluidType === "liquid" ? "Relief flow (Q)" : "Relief load (W)",
        result.fluidType === "liquid" ? val(svcFormSI.Q, "m³/h") : val(svcFormSI.W, "kg/h")]);
      inputs.push([L.setPLbl, val(svcFormSI.setP, "bar")]);
      inputs.push([L.overPLbl, val(svcFormSI.overpressurePct != null ? svcFormSI.overpressurePct : 10, "%")]);
      inputs.push([L.relPLbl, val(result.P1RelievingBar, "bar")]);
      inputs.push([L.backPLbl, val(result.P2Bar, "bar")]);
      if (result.fluidType === "liquid") {
        inputs.push(["Relative density (G)", val(svcFormSI.Gf)]);
      } else {
        if (result.fluidType === "steam") {
          // بخار با M و k پیش‌فرض موتور حساب می‌شود؛ عدد فرم در نتیجه اثر ندارد
          inputs.push(["Steam basis", "M = 18.015, k = 1.31 (engine default)"]);
        } else {
          inputs.push(["Molar mass (M)", val(svcFormSI.MW, "kg/kmol")]);
          inputs.push(["k", val(svcFormSI.k)]);
          inputs.push(["Z", val(svcFormSI.Z)]);
        }
        inputs.push([L.tLbl, val(svcFormSI.T, "°C")]);
      }
      if (svcFormSI.inletLossPct != null) inputs.push([L.inletLossLbl, val(svcFormSI.inletLossPct, "%")]);
      inputs.push([L.valveTypeLbl, svcFormSI.balanced ? "Balanced bellows" : "Conventional spring"]);

      results.push([L.orificeLbl, `${orifice.letter || dash}${orifice.designations ? " — " + orifice.designations.join(" / ") : ""}${orifice.dn ? " · " + orifice.dn.inlet + "×" + orifice.dn.outlet : ""}`]);
      results.push([L.areaLbl, `${val(result.areaCm2, "cm²")} · ${val(result.areaMm2, "mm²")} · ${val(result.areaIn2, "in²")}`]);
      results.push([L.capacityLbl, val(result.capacityKgH, "kg/h")]);
      results.push([L.utilLbl, result.utilisation == null ? dash : (result.utilisation * 100).toFixed(1) + " %"]);
      results.push([L.regimeLbl, `${result.flowRegime || dash}${result.criticalRatio != null ? " · rc " + result.criticalRatio : ""}`]);
      results.push([L.kdLbl, `${val(result.Kd)} / ${val(result.Kb)} / ${val(result.Kc)}`]);
      if (result.C != null) results.push(["C", val(result.C)]);
      if (result.F2 != null) results.push(["F2", val(result.F2)]);
      results.push([L.equationLbl, result.equation || dash]);
      results.push([L.equivCvLbl, `${val(result.equivalentCv)} / ${val(result.equivalentKv)}`]);
    } else if (svcMode === "twoPhase") {
      const gfTp = Number(svcFormSI.Gf);
      const rhoL = Number.isFinite(gfTp) && gfTp > 0 ? +(gfTp * 999).toFixed(1) : null;
      inputs.push([L.tpMassLbl, val(svcFormSI.W, "kg/h")]);
      inputs.push([L.tpQualityLbl, val(svcFormSI.qualityPct != null ? svcFormSI.qualityPct : 0, "%")]);
      inputs.push([L.p1Lbl, val(svcFormSI.P1, "bar")]);
      inputs.push([L.p2Lbl, val(svcFormSI.P2, "bar")]);
      inputs.push([L.dpLbl, val(+dpBar.toFixed(3), "bar")]);
      inputs.push([L.tpRhoL, rhoL == null ? dash : `${rhoL} kg/m³ (${L.gfLbl} ${gfTp})`]);
      inputs.push([L.tpRhoG, result.vapourDensityKgM3 == null ? dash : `${result.vapourDensityKgM3} kg/m³`]);
      inputs.push([L.pvLbl, val(svcFormSI.Pv, "bar")]);
      if (svcFormSI.Pc != null) inputs.push(["Pc", val(svcFormSI.Pc, "bar")]);
      inputs.push([L.tLbl, val(svcFormSI.T, "°C")]);
      inputs.push([mwLabel, svcFormSI.MW == null ? (isFa ? "خالی — جدول بخار" : "empty — steam table") : val(svcFormSI.MW, "kg/kmol")]);
      if (svcFormSI.k != null) inputs.push(["k", val(svcFormSI.k)]);
      if (svcFormSI.Z != null) inputs.push(["Z", val(svcFormSI.Z)]);
      if (svcFormSI.N != null) inputs.push(["N", val(svcFormSI.N)]);
      // Kd واقعیِ موتور (result.Kd) — نه حدس نمایشی؛ اگر کاربر عددی نداده باشد
      // پیش‌فرض موتور (۱ = اوریفیس ایده‌آل) در Cv اثر کرده و همان چاپ می‌شود.
      {
        const kdTp = result.Kd != null ? result.Kd : svcFormSI.tpKd;
        inputs.push(["Kd", val(kdTp) + (svcFormSI.tpKd == null && kdTp != null ? (isFa ? " (پیش‌فرض موتور)" : " (engine default)") : "")]);
      }
      inputs.push(["FL / xT", `${val(svcFormSI.FL)} / ${val(svcFormSI.xT)}`]);
      inputs.push([L.tpModelLbl, twoPhaseModelName(result.model)]);

      const pfx = result.propertySource === "iapws-if97" ? "IAPWS-IF97" : "Clausius–Clapeyron";
      results.push([L.cvLbl, `Cv ${val(result.Cv)} · Kv ${val(result.Kv)}`]);
      results.push([L.sizeLbl, `${(result.size && result.size.size) || dash} · ${(result.size && result.size.dn) || dash}`]);
      results.push([L.openingLbl, result.openingPercent == null ? dash : result.openingPercent + " %"]);
      results.push([L.tpEffAreaLbl, val(result.areaMm2, "mm²")]);
      results.push([L.tpFluxLbl, val(result.massFlux, "kg/(m²·s)")]);
      results.push([L.tpOmegaLbl, result.omega == null ? dash : val(result.omega)]);
      results.push([L.tpThroatLbl, `${val(result.throatPressureBar, "bar")} / ${val(result.criticalPressureRatio)}`]);
      results.push([L.tpChokedLbl, result.choked ? L.tpYes : L.tpNo]);
      results.push([L.tpFlashLbl, val(result.saturationPressureBar, "bar")]);
      results.push([L.tpX2Lbl, result.outletQuality == null ? L.tpNotComputed : (result.outletQuality * 100).toFixed(1) + " %"]);
      results.push([L.tpT2Lbl, result.outletTempC == null ? L.tpNotComputed : val(result.outletTempC, "°C")]);
      results.push([L.tpRhoInLbl, val(result.inletDensity, "kg/m³")]);
      results.push([L.tpRhoOutLbl, result.outletDensity == null ? L.tpNotComputed : val(result.outletDensity, "kg/m³")]);
      results.push([L.tpQactLbl, val(result.qActualM3h, "m³/h")]);
      results.push([L.tpMixVelLbl, result.outletVelocityMps == null ? L.tpNotComputed : val(result.outletVelocityMps, "m/s")]);
      results.push([L.tpResLbl, result.residenceTimeMs == null ? L.tpNotComputed : val(result.residenceTimeMs, "ms")]);
      results.push([L.tpSourceLbl, `${pfx}${result.vapourSource ? " · ρG: " + result.vapourSource : ""}`]);
      if (result.twoPhase && result.twoPhase.minCv != null && result.twoPhase.maxCv != null) {
        results.push([L.tpSpreadLbl, `${result.twoPhase.minCv} … ${result.twoPhase.maxCv} Cv (${(result.twoPhase.maxCv / result.twoPhase.minCv).toFixed(2)}×)`]);
      }
    } else {
      inputs.push(["Steam flow (W)", val(svcFormSI.W, "kg/h")]);
      inputs.push([L.p1Lbl, val(svcFormSI.P1, "bar")]);
      inputs.push([L.tLbl, val(svcFormSI.T, "°C")]);
      inputs.push([L.targetTLbl, val(svcFormSI.T2, "°C")]);
      inputs.push([L.waterPLbl, val(svcFormSI.waterP, "bar")]);
      inputs.push([L.waterTLbl, val(svcFormSI.waterT != null ? svcFormSI.waterT : 25, "°C")]);
      if (svcFormSI.supplyP != null) inputs.push(["Steam supply pressure", val(svcFormSI.supplyP, "bar")]);
      if (svcFormSI.dvP != null) inputs.push([L.sprayDpLbl, val(svcFormSI.dvP, "bar")]);

      results.push([L.waterLbl, `${val(result.waterFlowKgH, "kg/h")} · ${val(result.waterFlowLMin, "L/min")}`]);
      results.push([L.ratioLbl, result.waterToSteamRatio == null ? dash : (result.waterToSteamRatio * 100).toFixed(2) + " %"]);
      results.push([L.dutyLbl, val(result.dutyKW, "kW")]);
      results.push([L.tsatLbl, val(result.saturationTempC, "°C")]);
      results.push([L.superInLbl, val(result.superheatInC, "K")]);
      results.push([L.superOutLbl, val(result.superheatOutC, "K")]);
      results.push([L.satMarginLbl, val(result.saturationMarginC, "K")]);
      results.push([L.sprayDpLbl, result.waterValveDPBar == null ? val(result.atomizingDPBar, "bar") : `${val(result.waterValveDPBar)} / ${val(result.atomizingDPBar)} bar`]);
      results.push([L.injCvLbl, result.waterCv == null ? dash : `Cv ${val(result.waterCv)} · Kv ${val(result.waterKv)}`]);
      if (result.steamCv != null) results.push([L.steamSupplyLbl, val(result.steamCv)]);
    }
    return { inputs, results };
  }, [isService, svcMode, result, svcFormSI, L, fluid, selectedFluidName]);

  const candidates = useMemo(() => {
    if (!result || !result.Cv || !result.size) return [];
    const required = result.Cv;
    const recIdx = VALVE_SIZES.findIndex(s => s.size === result.size.size);
    if (recIdx < 0) return [];

    const indices = [Math.max(0, recIdx - 1), recIdx, Math.min(VALVE_SIZES.length - 1, recIdx + 1)];
    const uniqueIndices = [...new Set(indices)];

    return uniqueIndices.map((idx) => {
      const size = VALVE_SIZES[idx];
      const opening = Math.round((required / size.cv) * 100);
      const dP = Math.max(0.1, dpBar);
      // سرعت و نویز با واحد موتور (m³/h و bar) محاسبه میشوند
      const Q = fluid === "steam" ? (chartForm.W / 1000) * 1.2 : (chartForm.Q || 0);
      const idInch = parseFloat(size.size);
      const idM = (idInch * 25.4) / 1000;
      const areaM2 = Math.PI * Math.pow(idM / 2, 2);
      const velocity = areaM2 > 0 ? (Q / 3600) / areaM2 : 0;
      const noise = Math.max(45, Math.round(45 + 15 * Math.log10(dP) + 10 * Math.log10(Math.max(Q, 1) / 100)));

      let verdict, verdictColor;
      if (opening < 10) { verdict = L.tooSmall; verdictColor = "#E81123"; }
      else if (opening < 20) { verdict = L.small; verdictColor = "#F59E0B"; }
      else if (opening <= 80) { verdict = L.optimal; verdictColor = "#10B981"; }
      else if (opening <= 100) { verdict = L.large; verdictColor = "#F59E0B"; }
      else { verdict = L.tooLarge; verdictColor = "#E81123"; }

      return {
        size, opening, velocity: +velocity.toFixed(2), noise,
        verdict, verdictColor,
        isRecommended: idx === recIdx,
        isOptimal: opening >= 20 && opening <= 80
      };
    });
  }, [result, form, fluid, L]);

  async function captureChartImage() {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const chartEl = document.getElementById("report-chart-for-pdf");
      if (!chartEl) return null;
      const canvas = await html2canvas(chartEl, {
        backgroundColor: "#FFFFFF", scale: 2, useCORS: true, logging: false
      });
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.error("Chart capture failed:", e);
      return null;
    }
  }

  async function handleDownloadPDF() {
    if (!result || pdfLoading) return;
    setPdfLoading(true);
    try {
      const chartImage = isService ? null : await captureChartImage();
      const fileName = await generateSizingPDF({
        result, form, formSI: chartForm, fluid, locale, selectedFluidName, candidates, chartImage,
        units: { flow: flowUnit, pressure: pressureUnit, temp: tempUnit, velocity: velocityUnit, field: fieldUnits, dp: dpDisplay, dpUnit: pressureUnit },
        mw: form.MW,
        catalogMatch
      });
      track.pdfDownloaded({
        cv: result.Cv,
        size: (isService && result.requiredOrifice && result.requiredOrifice.letter)
          || (result.size && result.size.size) || undefined,
        fluid,
        mode: result.mode || "control"
      });
      if (!fileName) throw new Error("no file");
    } catch (err) {
      console.error(err);
      alert(isFa ? "خطا در تولید PDF" : "Error generating PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleScreenshot() {
    if (!result || shotLoading) return;
    setShotLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const element = document.getElementById("report-print-area");
      if (!element) return;
      const canvas = await html2canvas(element, {
        backgroundColor: "#FFFFFF", scale: 2, useCORS: true, logging: false
      });
      const link = document.createElement("a");
      link.download = `PSM-Report-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      track.screenshotTaken();
    } catch (err) {
      console.error(err);
      alert(isFa ? "خطا در ساخت تصویر" : "Error creating image");
    } finally {
      setShotLoading(false);
    }
  }

  function downloadCsv(rows) {
    const csv = rows.map(r => r.map(c => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PSM-Report-" + Date.now() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    track.csvDownloaded();
  }

  function handleDownloadCSV() {
    if (!result) return;
    if (isService && serviceSummary) {
      const csvModeHeader = svcMode === "psv"
        ? "PSV sizing — API RP 520 Part I / API 526 (preliminary)"
        : svcMode === "twoPhase"
          ? "Two-phase flashing sizing — Leung omega / HEM / HNE (preliminary)"
          : "Desuperheater station — adiabatic mixing estimate";
      const modelRows = svcMode === "twoPhase" && twoPhaseRows.length
        ? [[""], ["Model comparison", "Cv", "Ratio to omega", "Size", "Choked"],
            ...twoPhaseRows.map((r) => [r.model, r.error ? "" : r.Cv, r.error ? "" : r.ratioVsOmega, r.error ? "" : (r.size || ""), r.error ? "not computed" : (r.choked ? "yes" : "no")])]
        : [];
      downloadCsv([
        ["PSM VALVE — Petro Sazeh Mihan"],
        [csvModeHeader],
        [""], ["Parameter", "Value", "Unit"],
        ...serviceSummary.inputs,
        [""], ["Result", "", ""],
        ...serviceSummary.results,
        ...modelRows,
        [""], ["Warnings", "", ""],
        ...(result.warnings || []).map(w => [w.type, w.text, ""]),
        [""], ["Engine notes", "", ""],
        ...svcNotes.map(nn => [nn, "", ""])
      ]);
      return;
    }
    const rows = [
      ["PSM VALVE — Petro Sazeh Mihan"], ["IT Department"], [""],
      ["Parameter", "Value", "Unit"],
      [L.fluidLbl, selectedFluidName || fluid, ""],
      [L.flowLbl, fluid === "steam" ? form.W : form.Q, flowUnit],
      [L.p1Lbl, form.P1, unitOf("P1", pressureUnit)], [L.p2Lbl, form.P2, unitOf("P2", pressureUnit)],
      [L.dpLbl, dpDisplay, pressureUnit],
      ...(fluid === "liquid" ? [[L.gfLbl, form.Gf, unitOf("Gf", "—")], [L.pvLbl, form.Pv, unitOf("Pv", pressureUnit)], [L.nuLbl, form.nu != null ? form.nu : "-", unitOf("nu", "cSt")]] : []),
      ...(fluid === "gas" ? [[L.ggLbl, form.Gg, "—"], [mwLabel, form.MW, "kg/kmol"]] : []),
      ...(fluid !== "liquid" ? [[L.tLbl, form.T, tempUnit]] : []),
      [""], ["Result", "", ""],
      [L.cvLbl, result.Cv, ""], [L.kvLbl, result.Kv, ""],
      [L.sizeLbl, result.size.size, ""], ["DN", result.size.dn, ""],
      [L.openingLbl, result.openingPercent + "%", ""],
      ...(result.marginPct > 0 ? [[L.marginLbl, `+${result.marginPct}% (Cv ${result.rawCv ?? "-"} → ${result.Cv})`, ""]] : []),
      ...(result.CvMin != null ? [[L.minCvLbl, result.CvMin, ""], [L.minOpenLbl, result.openingMin + "%", ""]] : []),
      [L.velocityLbl, result.velocity ? velocityFromSI(result.velocity, velocityUnit) : "-", velocityUnit],
      ...(result.mach != null ? [[L.machLbl, result.mach, "Ma < 0.3"]] : []),
      [L.noiseLbl + " (≈)", result.noise || "-", "dB (indicative — not IEC 60534-8-3)"],
      ...(fluid === "liquid" ? [
        [L.revLbl, result.Rev != null ? result.Rev : "-", ""],
        [L.frLbl, result.FR != null ? result.FR : "1 (turbulent)", ""],
        ["FF", result.FF != null ? result.FF : "-", ""],
        ["Fp", result.Fp != null ? result.Fp : "-", ""],
        ["dPmax", result.dPmax != null ? result.dPmax : "-", pressureUnit],
        [L.flashLbl, result.flashing ? (isFa ? "بله" : "Yes") : (isFa ? "خیر" : "No")],
        [L.cavLbl, result.cavitationLevel || result.cavitationRisk || "-", ""]
      ] : []),
      ...(fluid === "steam" && result.steamBasis ? [[L.steamBasisLbl, result.steamBasis === "superheated" ? `${L.superheated} (+${result.superheatC} °C)` : L.saturated, ""]] : []),
      ...(letdownRows.length ? [[""], [L.ldTitle, "", ""], ...letdownRows] : []),
      // سایز انتخابی از کاتالوگ بدون گفتن سرچشمهٔ داده، نصفه‌حقیقت است
      ...(catalogMatch ? [
        [""], [L.catalogTitle, "", ""],
        [L.catalogSeries, String(catalogMatch.product.series), ""],
        [L.sizeLbl, catalogMatch.matchedSize.dn, ""],
        [L.catalogTrim, catalogMatch.matchedSize.cv, ""],
        [L.catalogBasis, catalogMatch.curveBased ? L.catalogBasisCurve : L.catalogBasisLinear, ""],
        [L.catalogDataSrc, dataSourceLabel, ""],
        ...(isEstimatedMatch ? [[L.estimateWarn, "", ""]] : [])
      ] : []),
      ["Engineering note", L.engineeringDisclaimer, ""],
      [""], ["Alternative Sizes", "", ""],
      ["Size", "Cv", "Opening %", "Verdict"]
    ];
    candidates.forEach(c => rows.push([c.size.size, c.size.cv, c.opening + "%", c.verdict]));

    downloadCsv(rows);
  }

  function handleCopy() {
    if (!result) return;
    let text;
    if (isService && serviceSummary) {
      const txtMode = svcMode === "psv" ? "PSV Sizing Report"
        : svcMode === "twoPhase" ? "Two-Phase Sizing Report" : "Desuperheater Report";
      text = [
        "═══════════════════════════════",
        `  PSM VALVE — ${txtMode}`,
        "═══════════════════════════════", "",
        ...serviceSummary.inputs.map(r => `${r[0]}: ${r[1]}`), "",
        "───────── RESULT ─────────",
        ...serviceSummary.results.map(r => `${r[0]}: ${r[1]}`), "",
        ...(svcMode === "twoPhase" && twoPhaseRows.length
          ? ["───── MODEL COMPARISON ─────",
             ...twoPhaseRows.map(r => `${r.model}: ${r.error ? "not computed" : `Cv ${r.Cv} · ${r.ratioVsOmega != null ? r.ratioVsOmega + "x omega" : "—"} · ${r.size || dash} · ${r.choked ? "choked" : "not choked"}`}`), ""]
          : []),
        ...(result.warnings && result.warnings.length ? ["───────── WARNINGS ─────────", ...result.warnings.map(w => `${w.type.toUpperCase()}: ${w.text}`), ""] : []),
        ...(svcNotes.length ? ["───────── NOTES ─────────", ...svcNotes.map(nn => "• " + nn), ""] : []),
        `Generated: ${new Date().toLocaleString()}`, "PSM Valve · psm-valve.com"
      ].join("\n");
    } else {
    text = [
      "═══════════════════════════════", "  PSM VALVE — Sizing Report", "═══════════════════════════════", "",
      `${L.fluidLbl}: ${selectedFluidName || fluid}`,
      `${L.flowLbl}: ${fluid === "steam" ? form.W + " " + flowUnit : form.Q + " " + flowUnit}`,
      `P1: ${form.P1} ${unitOf("P1", pressureUnit)} · P2: ${form.P2} ${unitOf("P2", pressureUnit)} · ΔP: ${dpDisplay} ${pressureUnit}`,"",
      "───────── RESULT ─────────",
      `Cv: ${result.Cv} · Kv: ${result.Kv}`,
      `${L.sizeLbl}: ${result.size.size} (${result.size.dn})`,
      `${L.openingLbl}: ${result.openingPercent}%`,
      ...(fluid === "liquid" && result.Rev != null ? [`${L.revLbl}: ${result.Rev} · ${L.frLbl}: ${result.FR ?? 1}`] : []),
      ...(fluid === "liquid" && result.flashing ? [`⚠ ${L.flashLbl}`] : []),
      ...(result.noise ? [`${L.noiseLbl}: ≈${result.noise} dB (indicative)`] : []),
      ...(letdownRows.length ? ["", `───── ${L.ldTitle.toUpperCase()} ─────`, ...letdownRows.map((r) => `${r[0]}: ${r[1]} ${r[2]}`.trim())] : []),
      ...(catalogMatch ? [
        "", `───── ${L.catalogTitle.toUpperCase()} ─────`,
        `${L.catalogSeries}: ${catalogMatch.product.series} · ${catalogMatch.matchedSize.dn} · Cv ${catalogMatch.matchedSize.cv}`,
        `${L.catalogDataSrc}: ${dataSourceLabel}`
      ] : []),
      ...(isEstimatedMatch ? [`⚠ ${L.estimateWarn}`] : []), "",
      L.engineeringDisclaimer, "",
      "───── ALTERNATIVE SIZES ─────",
      ...candidates.map(c => `${c.size.size}: Cv ${c.size.cv} · ${c.opening}% · ${c.verdict}`),
      "", `Generated: ${new Date().toLocaleString()}`, "PSM Valve · psm-valve.com"
    ].join("\n");
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleShare() {
    if (typeof window === "undefined") return;
    try {
      const query = buildSizingParams({ fluid, unitSystem, mode: svcMode, form });
      const url = window.location.origin + window.location.pathname + "?" + query;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  if (!mounted || !result || result.error) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              background: "rgba(10, 12, 16, 0.78)",
              backdropFilter: "blur(8px)",
              zIndex: 9998
            }}
          />
          <div
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 12, zIndex: 9999, pointerEvents: "none"
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              style={{
                width: "100%", maxWidth: 880, maxHeight: "94vh",
                display: "flex", flexDirection: "column",
                background: "var(--bg-card)",
                borderRadius: 20,
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--shadow-lg)",
                pointerEvents: "auto",
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: "16px 22px",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    display: "grid", placeItems: "center",
                    background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                    color: "#FFFFFF", fontWeight: 900, fontSize: 12,
                    fontFamily: "monospace"
                  }}>PSM</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{isService ? L[svcTitleKey] : L.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{isService ? L[svcSubKey] : L.subtitle}</div>
                  </div>
                </div>
                <button onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "var(--bg-soft)", border: "none", cursor: "pointer",
                    display: "grid", placeItems: "center", color: "var(--text-soft)"
                  }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
                <div id="report-print-area" style={{ display: "grid", gap: 16 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 10.5, color: "var(--text-muted)", fontWeight: 700,
                    paddingBottom: 10, borderBottom: "1px solid var(--border)"
                  }}>
                    <span>{L.reportRef}: PSM-SZ-{reportStamp}</span>
                    <span>{L.date}: {reportDate}</span>
                  </div>

                  {isService && svcMode === "twoPhase" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 10 }}>
                      <div style={{
                        padding: 18, borderRadius: 16,
                        background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                        color: "#FFFFFF", textAlign: "center",
                        display: "flex", flexDirection: "column", justifyContent: "center"
                      }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.9, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          {L.cvLbl}
                        </div>
                        <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, fontFamily: "monospace" }}>{val(result.Cv)}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, marginTop: 8, fontFamily: "monospace" }}>
                          Kv {val(result.Kv)} · {val(result.areaMm2)} mm²
                        </div>
                      </div>

                      <div className="card-glass" style={{ padding: 14, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          {L.sizeLbl}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--gold)", lineHeight: 1.2, fontFamily: "monospace" }}>
                          {(result.size && result.size.size) || dash}
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace", direction: "ltr" }}>
                          {val(result.openingPercent)} % · {(result.size && result.size.dn) || dash}
                        </div>
                      </div>

                      <div className="card-glass" style={{ padding: 14, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          {L.tpFluxLbl}
                        </div>
                        <div style={{ fontSize: 21, fontWeight: 900, color: "var(--text)", lineHeight: 1.2, fontFamily: "monospace" }}>
                          {val(result.massFlux)}
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace", direction: "ltr" }}>
                          {twoPhaseModelName(result.model)} · ω {val(result.omega)}
                        </div>
                      </div>
                    </div>
                  )}

                  {isService && svcMode !== "twoPhase" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 10 }}>
                      <div style={{
                        padding: 18, borderRadius: 16,
                        background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                        color: "#FFFFFF", textAlign: "center",
                        display: "flex", flexDirection: "column", justifyContent: "center"
                      }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.9, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          {svcMode === "psv" ? L.orificeLbl : L.waterLbl}
                        </div>
                        <div style={{ fontSize: svcMode === "psv" ? 42 : 26, fontWeight: 900, lineHeight: 1.1, fontFamily: "monospace" }}>
                          {svcMode === "psv" ? (result.requiredOrifice && result.requiredOrifice.letter) || dash : val(result.waterFlowKgH)}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, marginTop: 8, fontFamily: "monospace" }}>
                          {svcMode === "psv"
                            ? `${val(result.areaCm2)} cm² · ${val(result.areaIn2)} in²`
                            : `${val(result.waterFlowLMin)} L/min`}
                        </div>
                      </div>

                      <div className="card-glass" style={{ padding: 14, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          {svcMode === "psv" ? L.capacityLbl : L.ratioLbl}
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 900, color: "var(--gold)", lineHeight: 1.2, fontFamily: "monospace" }}>
                          {svcMode === "psv" ? `${val(result.capacityKgH)} kg/h` : (result.waterToSteamRatio * 100).toFixed(2) + " %"}
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace", direction: "ltr" }}>
                          {svcMode === "psv"
                            ? ((result.requiredOrifice && result.requiredOrifice.designations) || []).join(" / ")
                            : `${val(result.dutyKW)} kW`}
                        </div>
                      </div>

                      <div className="card-glass" style={{ padding: 14, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          {svcMode === "psv" ? L.utilLbl : L.satMarginLbl}
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", lineHeight: 1.2, fontFamily: "monospace" }}>
                          {svcMode === "psv" ? (result.utilisation == null ? dash : (result.utilisation * 100).toFixed(0) + "%") : `${val(result.saturationMarginC)} °C`}
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "var(--bg-soft)", marginTop: 10, overflow: "hidden" }}>
                          <div style={{
                            width: svcMode === "psv" && result.utilisation != null ? Math.min(100, result.utilisation * 100) + "%" : "0%",
                            height: "100%",
                            background: result.requiredOrifice && result.requiredOrifice.insufficient ? "#E81123" : "linear-gradient(90deg, #E0A81A, #B8850A)"
                          }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {!isService && (
                  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 10 }}>
                    <div style={{
                      padding: 18, borderRadius: 16,
                      background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                      color: "#FFFFFF", textAlign: "center",
                      boxShadow: "0 10px 24px rgba(201, 149, 13, 0.30)",
                      display: "flex", flexDirection: "column", justifyContent: "center"
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.9, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                        {L.cvLbl}
                      </div>
                      <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, fontFamily: "monospace" }}>{result.Cv}</div>
                      <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, marginTop: 8, fontFamily: "monospace" }}>Kv {result.Kv}</div>
                    </div>

                    <div className="card-glass" style={{ padding: 16, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>{L.sizeLbl}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--gold)", lineHeight: 1, fontFamily: "monospace" }}>
                        {result.size.size}
                      </div>
                      <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace", direction: "ltr" }}>
                        {result.size.dn} · {result.size.nps}
                      </div>
                    </div>

                    <div className="card-glass" style={{ padding: 16, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: 9.5, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>{L.openingLbl}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", lineHeight: 1, fontFamily: "monospace" }}>
                        {result.openingPercent}%
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--bg-soft)", marginTop: 10, overflow: "hidden" }}>
                        <div style={{
                          width: result.openingPercent + "%", height: "100%",
                          background: result.openingPercent < 20 || result.openingPercent > 85 ? "#E81123" : "linear-gradient(90deg, #E0A81A, #B8850A)"
                        }} />
                      </div>
                    </div>
                  </div>
                  )}

                  {catalogMatch && (
                    <div>
                      <div className="report-heading">
                        <Package size={13} color="var(--gold)" />
                        {L.catalogTitle}
                      </div>
                      <div style={{
                        padding: 14, borderRadius: 12,
                        background: "var(--bg-soft)", border: "1px solid var(--border)"
                      }}>
                        <ReportRow label={L.catalogSeries} value={String(catalogMatch.product.series)} />
                        <ReportRow
                          label={L.sizeLbl}
                          value={catalogMatch.matchedSize.dn + (catalogMatch.nps ? ` (${catalogMatch.nps}")` : "")}
                        />
                        <ReportRow label={L.catalogTrim} value={"Cv " + catalogMatch.matchedSize.cv} />
                        {characteristicName && (
                          <ReportRow label={L.catalogCharacteristic} value={characteristicName} />
                        )}
                        <ReportRow label={L.openingLbl} value={catalogMatch.openingPercent + "%"} />
                        <ReportRow label={L.catalogBasis} value={catalogMatch.curveBased ? L.catalogBasisCurve : L.catalogBasisLinear} />
                        <ReportRow
                          label={L.catalogDataSrc}
                          value={dataSourceLabel}
                          valueColor={isEstimatedMatch ? "#92400E" : undefined}
                          plain
                          last
                        />
                      </div>
                      {isEstimatedMatch && (
                        <div role="note" style={{ marginTop: 8, fontSize: 10.5, fontWeight: 800, color: "#92400E", lineHeight: 1.7 }}>
                          ⚠ {L.estimateWarn}
                        </div>
                      )}
                      {catalogMatch.withinMargin === false && (
                        <div role="alert" style={{ marginTop: 8, fontSize: 10.5, fontWeight: 800, color: "#92400E" }}>
                          ⚠ {L.catalogMarginWarn}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="report-heading">
                      <FileText size={13} color="var(--gold)" />
                      {L.inputs}
                    </div>
                    <div style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--bg-soft)", border: "1px solid var(--border)"
                    }}>
                      {!isService && <ReportRow label={L.fluidLbl} value={selectedFluidName || fluid} />}
                      {isService && serviceSummary && serviceSummary.inputs.map((r, i) => (
                        <ReportRow key={"in" + i} label={r[0]} value={r[1]} last={!serviceSummary.results.length} />
                      ))}
                      {!isService && (<>
                      {fluid === "steam" ? (
                        <ReportRow label={L.flowLbl} value={form.W + " " + flowUnit} />
                      ) : (
                        <ReportRow label={L.flowLbl} value={form.Q + " " + flowUnit} />
                      )}
                      <ReportRow label={L.p1Lbl} value={form.P1 + " " + unitOf("P1", pressureUnit)} />
                      <ReportRow label={L.p2Lbl} value={form.P2 + " " + unitOf("P2", pressureUnit)} />
                      <ReportRow label={L.dpLbl} value={dpDisplay + " " + pressureUnit} />
                      {fluid === "liquid" && <ReportRow label={L.gfLbl} value={form.Gf + " " + unitOf("Gf", "—")} />}
                      {fluid === "gas" && <ReportRow label={L.ggLbl} value={form.Gg} />}
                      {fluid === "gas" && <ReportRow label={mwLabel} value={form.MW} />}
                      {fluid === "liquid" && <ReportRow label={L.pvLbl} value={form.Pv + " " + unitOf("Pv", pressureUnit)} />}
                      {fluid === "liquid" && form.nu != null && <ReportRow label={L.nuLbl} value={form.nu + " " + unitOf("nu", "cSt")} last />}
                      {fluid === "steam" && result.steamBasis && (
                        <ReportRow
                          label={L.steamBasisLbl}
                          value={result.steamBasis === "superheated"
                            ? `${L.superheated} (+${result.superheatC} °C)`
                            : L.saturated}
                        />
                      )}
                      {fluid !== "liquid" && <ReportRow label={L.tLbl} value={form.T + " " + tempUnit} last />}
                      </>)}
                    </div>
                  </div>

                  {isService && serviceSummary && serviceSummary.results.length > 0 && (
                    <div>
                      <div className="report-heading">
                        <Gauge size={13} color="var(--gold)" />
                        {L.svcResults}
                      </div>
                      <div style={{
                        padding: 14, borderRadius: 12,
                        background: "var(--bg-soft)", border: "1px solid var(--border)"
                      }}>
                        {serviceSummary.results.map((r, i) => (
                          <ReportRow
                            key={"rs" + i}
                            label={r[0]}
                            value={r[1]}
                            last={i === serviceSummary.results.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!isService && letdownRows.length > 0 && (
                    <div>
                      <div className="report-heading">
                        <Gauge size={13} color="var(--gold)" />
                        {L.ldTitle}
                      </div>
                      <div style={{
                        padding: 14, borderRadius: 12,
                        background: "var(--bg-soft)", border: "1px solid var(--border)"
                      }}>
                        {letdownRows.map((r, i) => (
                          <ReportRow
                            key={"ld" + i}
                            label={r[0]}
                            value={`${r[1]}${r[2] ? " " + r[2] : ""}`}
                            last={i === letdownRows.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {svcMode === "twoPhase" && twoPhaseRows.length > 0 && (
                    <div>
                      <div className="report-heading">
                        <Waves size={13} color="var(--gold)" />
                        {L.tpCompare}
                      </div>
                      <div style={{
                        padding: 12, borderRadius: 12,
                        background: "var(--bg-soft)", border: "1px solid var(--border)",
                        direction: "ltr"
                      }}>
                        <div style={{
                          display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1.2fr", gap: 6,
                          paddingBottom: 6, marginBottom: 4, borderBottom: "1px solid var(--border)"
                        }}>
                          {[L.tpModelLbl, L.cvLbl, L.tpRatioLbl, L.sizeLbl, L.tpChokedLbl].map((h, i) => (
                            <span key={"h" + i} style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase" }}>
                              {h}
                            </span>
                          ))}
                        </div>
                        {twoPhaseRows.map((row) => {
                          const isSel = row.model === result.model;
                          return (
                            <div key={row.model} style={{
                              display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1.2fr", gap: 6,
                              alignItems: "center", padding: "6px 4px",
                              background: isSel ? "rgba(224,168,26,0.12)" : "transparent",
                              borderRadius: 6
                            }}>
                              <span style={{ fontSize: 11, fontWeight: 900, color: isSel ? "var(--gold)" : "var(--text)" }}>
                                {twoPhaseModelName(row.model)}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: row.error ? "#E81123" : "var(--text)" }}>
                                {row.error ? dash : val(row.Cv)}
                              </span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "monospace", color: "var(--text-muted)" }}>
                                {row.error ? dash : (row.ratioVsOmega != null ? row.ratioVsOmega + "×" : dash)}
                              </span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "monospace", color: "var(--text-soft)" }}>
                                {row.error ? dash : (row.size || dash)}
                              </span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-soft)" }} title={row.error || ""}>
                                {row.error ? L.tpNotComputed : (row.choked ? L.tpYes : L.tpNo)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {result.twoPhase && result.twoPhase.minCv != null && result.twoPhase.minCv > 0 && (
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", marginTop: 8, direction: "ltr" }}>
                          {L.tpSpreadLbl}: {result.twoPhase.minCv} … {result.twoPhase.maxCv} Cv
                        </div>
                      )}
                    </div>
                  )}

                  {!isService && (<>
                  <div>
                    <div className="report-heading">
                      <BarChart3 size={13} color="var(--gold)" />
                      {L.chart}
                    </div>
                    <div id="report-chart-for-pdf">
                      <ValveCharacteristicChart result={result} form={chartForm} locale={locale} />
                    </div>
                  </div>

                  <div>
                    <div className="report-heading">
                      <Package size={13} color="var(--gold)" />
                      {L.candidates}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, marginBottom: 10 }}>
                      {L.candidateHint}
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${candidates.length}, minmax(0, 1fr))`,
                      gap: 10
                    }}>
                      {candidates.map((c, i) => {
                        const VIcon = c.opening < 20 ? TrendingDown : c.opening > 80 ? TrendingUp : Check;
                        return (
                          <div key={i} style={{
                            padding: 14, borderRadius: 12,
                            background: c.isRecommended ? "rgba(224,168,26,0.10)" : "var(--bg-soft)",
                            border: c.isRecommended ? "2px solid #E0A81A" : "1px solid var(--border)",
                            position: "relative"
                          }}>
                            {c.isRecommended && (
                              <div style={{
                                position: "absolute", top: -8, right: 10,
                                padding: "2px 8px", borderRadius: 10,
                                background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                                color: "#FFFFFF", fontSize: 8.5, fontWeight: 900,
                                display: "flex", alignItems: "center", gap: 3
                              }}>
                                <Star size={7} fill="#FFFFFF" /> {L.recommended}
                              </div>
                            )}
                            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: c.isRecommended ? "var(--gold)" : "var(--text)", textAlign: "center", marginBottom: 4, direction: "ltr" }}>
                              {c.size.size}
                            </div>
                            <div style={{ fontSize: 9.5, color: "var(--text-muted)", textAlign: "center", fontFamily: "monospace", marginBottom: 10, direction: "ltr" }}>
                              {c.size.dn}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border)" }}>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>Cv</span>
                              <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>{c.size.cv}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{L.openingLbl}</span>
                              <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: c.isOptimal ? "#10B981" : c.verdictColor }}>
                                {c.opening}%
                              </span>
                            </div>
                            <div style={{
                              marginTop: 8, padding: "6px 8px", borderRadius: 8,
                              background: c.verdictColor + "15",
                              border: "1px solid " + c.verdictColor + "45",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                            }}>
                              <VIcon size={11} color={c.verdictColor} strokeWidth={2.8} />
                              <span style={{ fontSize: 10, fontWeight: 900, color: c.verdictColor }}>{c.verdict}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  </>)}

                  <div>
                    <div className="report-heading">
                      <CheckCircle2 size={13} color="var(--gold)" />
                      {isService ? L.svcFindings : L.tips}
                    </div>

                    {isService && (
                      <div className="card-glass" style={{ padding: 14, display: "grid", gap: 8 }}>
                        {(result.warnings || []).length === 0 && (
                          <div style={{ fontSize: 11.5, color: "#10B981", fontWeight: 900 }}>
                            ✓ {isFa ? "هیچ هشداری ثبت نشد" : "No warnings raised"}
                          </div>
                        )}
                        {(result.warnings || []).map((w, i) => (
                          <div
                            key={"w" + i}
                            role={w.type === "danger" ? "alert" : "note"}
                            style={{
                              fontSize: 11, lineHeight: 1.8, fontWeight: 700,
                              color: w.type === "danger" ? "#B91C1C" : w.type === "warning" ? "#92400E" : "var(--text-soft)"
                            }}
                          >
                            {w.type === "info" ? <Info size={11} style={{ verticalAlign: "-1px", marginInlineEnd: 4 }} /> : <AlertTriangle size={11} style={{ verticalAlign: "-1px", marginInlineEnd: 4 }} />}
                            {w.text}
                          </div>
                        ))}
                        {svcNotes.length > 0 && (
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                              {L.svcNotes}
                            </div>
                            {svcNotes.map((nn, i) => (
                              <div key={"n" + i} dir="ltr" style={{ fontSize: 10.5, lineHeight: 1.7, color: "var(--text-soft)", textAlign: "left" }}>
                                • {nn}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!isService && (
                    <div className="card-glass" style={{ padding: 14 }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-soft)", lineHeight: 1.8 }}>
                        ✓ Cv = {result.Cv} ({isFa ? "برآورد اولیه" : "preliminary estimate"})<br />
                        {result.marginPct > 0 && <>✓ {L.marginLbl}: +{result.marginPct}% — Cv {result.rawCv} → {result.Cv}<br /></>}
                        ✓ {L.openingLbl} {result.openingPercent}% — {result.openingPercent >= 20 && result.openingPercent <= 80 ? (isFa ? "بهینه" : "Optimal") : (isFa ? "خارج از محدوده" : "Out of range")}<br />
                        {fluid === "liquid" && (result.flashing
                          ? <>⚠️ {L.flashLbl} — {isFa ? "فشار خروجی پایین‌تر از فشار بخار است" : "outlet pressure is below vapour pressure"}<br /></>
                          : <>✓ {L.cavLbl}: {result.cavitationLevel === "high" ? L.riskHigh : result.cavitationLevel === "medium" ? L.riskMedium : result.cavitationLevel === "low" ? L.riskLow : (result.cavitationRisk || L.riskLow)}<br /></>)}
                        {fluid === "liquid" && result.Rev != null && (
                          <>✓ {L.revLbl}: {result.Rev}{result.FR != null ? ` · ${L.frLbl}: ${result.FR}` : ""}<br /></>
                        )}
                        {fluid === "liquid" && result.FF != null && (
                          <>✓ FF: {result.FF} · ΔPmax: {result.dPmax} bar{result.Fp != null ? ` · Fp: ${result.Fp}` : ""}<br /></>
                        )}
                        {result.velocity > 0 && (
                          <>✓ {L.velocityLbl}: {result.velocity} m/s{result.mach != null ? ` · ${L.machLbl}: ${result.mach}` : ""}<br /></>
                        )}
                        {fluid === "steam" && result.steamBasis && (
                          <>✓ {L.steamBasisLbl}: {result.steamBasis === "superheated" ? `${L.superheated} (+${result.superheatC} °C)` : L.saturated}<br /></>
                        )}
                        {result.noise && <>≈ {L.noiseLbl}: {result.noise} dB — {L.noiseNote}<br /></>}
                        {result.choked && "⚠️ " + (isFa ? "جریان Choked" : "Choked Flow")}<br />
                        {result.capacityExceeded && "⚠️ " + L.capacityExceeded}
                      </div>
                      <div role="note" style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.7, marginTop: 8 }}>
                        {L.engineeringDisclaimer}
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                padding: "16px 22px",
                borderTop: "1px solid var(--border)",
                flexShrink: 0
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 900, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10
                }}>
                  {L.exports}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8
                }}>
                  <ExportBtn onClick={handleDownloadPDF} icon={pdfLoading ? <Activity size={18} /> : <Printer size={18} />} label={pdfLoading ? "..." : "PDF"} sub={isFa ? "گزارش کامل" : "Full report"} highlight />
                  <ExportBtn onClick={handleScreenshot} icon={shotLoading ? <Activity size={18} /> : <Camera size={18} />} label={isFa ? "تصویر" : "Image"} sub={isFa ? "PNG" : "PNG"} highlight />
                  <ExportBtn onClick={handleDownloadCSV} icon={<Save size={18} />} label="Excel" sub={isFa ? "CSV" : "CSV"} />
                  <ExportBtn onClick={handleCopy} icon={copied ? <Check size={18} /> : <Copy size={18} />} label={copied ? L.copied : L.copy} sub={isFa ? "متن گزارش" : "Report text"} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  <button onClick={handleShare} className="btn-outline" style={{ justifyContent: "center", padding: "10px" }}>
                    <Share2 size={14} />
                    <span style={{ fontSize: 11.5, fontWeight: 900 }}>
                      {copied ? L.linkCopied : L.copyLink}
                    </span>
                  </button>
                  <Link href={"/" + locale + "/contact"} className="btn-gold justify-center" style={{ padding: "10px", fontSize: 11.5 }} onClick={onClose}>
                    {L.reqQuote} <ArrowLeft size={13} />
                  </Link>
                </div>
              </div>

              <style jsx global>{`
                .report-heading {
                  font-size: 11.5px;
                  font-weight: 900;
                  color: var(--text);
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  padding-bottom: 8px;
                  margin-bottom: 10px;
                  border-bottom: 2px solid #C9950D;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }
              `}</style>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

function ReportRow({ label, value, last, valueColor, plain }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0",
      borderBottom: last ? "none" : "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 900,
        color: valueColor || "var(--text)",
        // متن سرچشمهٔ داده ترجمه‌پذیر است؛ قالب monospace/ltr فقط برای عدد
        fontFamily: plain ? "inherit" : "monospace",
        direction: plain ? "inherit" : "ltr",
        textAlign: "end", maxWidth: "62%"
      }}>{value}</span>
    </div>
  );
}

function ExportBtn({ onClick, icon, label, sub, highlight }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "12px 10px",
        borderRadius: 12,
        background: highlight ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "var(--bg-soft)",
        border: highlight ? "none" : "1.5px solid var(--border)",
        color: highlight ? "#FFFFFF" : "var(--text)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "start",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: highlight ? "0 4px 12px rgba(201, 149, 13, 0.25)" : "none",
        transition: "all 0.15s"
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "grid", placeItems: "center",
          width: 30, height: 30, borderRadius: 8,
          background: highlight ? "rgba(255,255,255,0.20)" : "var(--bg-card)",
          color: highlight ? "#FFFFFF" : "var(--text)"
        }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 900 }}>{label}</span>
      </div>
      {sub && (
        <div style={{
          fontSize: 9.5, fontWeight: 600,
          color: highlight ? "rgba(255,255,255,0.85)" : "var(--text-muted)"
        }}>
          {sub}
        </div>
      )}
    </button>
  );
}