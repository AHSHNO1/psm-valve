"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Printer, Camera, Save, Copy, Check, Share2,
  Activity, Star, ArrowLeft, FileText, AlertTriangle,
  CheckCircle2, Gauge, BarChart3, Package, TrendingDown, TrendingUp
} from "lucide-react";
import { ValveCharacteristicChart } from "./SizingCharts";
import { VALVE_SIZES } from "@/lib/sizing-advanced";
import { generateSizingPDF } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";

export default function SizingReportModal({ isOpen, onClose, result, form, fluid, locale = "fa", selectedFluidName }) {
  const [mounted, setMounted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shotLoading, setShotLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFa = locale === "fa";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && isOpen) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const L = {
    fa: {
      title: "گزارش برآورد اولیه سایزینگ شیر", subtitle: "نتیجه تأییدشده ISA-75.01.01 (IEC 60534-2-1) نیست",
      engineeringDisclaimer: "این برآورد جایگزین محاسبه کامل ISA-75.01.01 (IEC 60534-2-1) یا تأیید سازنده نیست؛ انتخاب نهایی را با مهندس شیر کنترل بررسی کنید.",
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
      recommended: "پیشنهاد", tooSmall: "خیلی کوچک", small: "کوچک", optimal: "بهینه", large: "بزرگ", tooLarge: "خیلی بزرگ"
    },
    en: {
      title: "Preliminary Control Valve Sizing Estimate", subtitle: "Not a validated ISA-75.01.01 (IEC 60534-2-1) calculation",
      engineeringDisclaimer: "This estimate is not a substitute for a complete ISA-75.01.01 (IEC 60534-2-1) calculation or manufacturer validation. Confirm final selection with a control-valve engineer.",
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
      recommended: "Recommended", tooSmall: "Too Small", small: "Small", optimal: "Optimal", large: "Large", tooLarge: "Too Large"
    },
    ar: {
      title: "تقدير أولي لحجم صمام التحكم", subtitle: "ليس حسابًا معتمدًا وفق ISA-75.01.01 (IEC 60534-2-1)",
      engineeringDisclaimer: "هذا التقدير لا يغني عن حساب كامل وفق ISA-75.01.01 (IEC 60534-2-1) أو تأكيد الشركة المصنّعة. يجب مراجعة الاختيار النهائي مع مهندس صمامات التحكم.",
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
      recommended: "موصى به", tooSmall: "صغير جدًا", small: "صغير", optimal: "أمثل", large: "كبير", tooLarge: "كبير جدًا"
    },
    ru: {
      title: "Предварительная оценка регулирующего клапана", subtitle: "Расчет не подтвержден по ISA-75.01.01 (IEC 60534-2-1)",
      engineeringDisclaimer: "Эта оценка не заменяет полный расчет по ISA-75.01.01 (IEC 60534-2-1) или подтверждение производителя. Окончательный выбор согласуйте с инженером.",
      capacityExceeded: "Требуемый Cv превышает максимальный размер в списке; необходима инженерная проверка.",
      reportRef: "№", date: "Дата", inputs: "Входные данные", chart: "График",
      candidates: "Размеры", candidateHint: "Три варианта", tips: "Рекомендации", exports: "Экспорт",
      fullReport: "PDF", image: "Изображение", excel: "Excel", copy: "Копировать", copied: "Скопировано",
      copyLink: "Копировать ссылку", linkCopied: "Ссылка скопирована", reqQuote: "Запросить", close: "Закрыть",
      fluidLbl: "Среда", flowLbl: "Расход", p1Lbl: "Вход", p2Lbl: "Выход",
      dpLbl: "Перепад", gfLbl: "Плотность", ggLbl: "Газ", pvLbl: "Давл. паров", tLbl: "Темп.",
      cvLbl: "Cv", kvLbl: "Kv", sizeLbl: "Размер", openingLbl: "Открытие",
      velocityLbl: "Скорость", noiseLbl: "Шум", cavLbl: "Кавитация",
      recommended: "Рекомендуется", tooSmall: "Слишком мал", small: "Мал", optimal: "Оптимально", large: "Велик", tooLarge: "Слишком велик"
    }
  }[locale] || {};

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
      const dP = Math.max(0.1, (form.P1 || 0) - (form.P2 || 0));
      const Q = fluid === "steam" ? (form.W / 1000) * 1.2 : (form.Q || 0);
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
      const chartImage = await captureChartImage();
      await generateSizingPDF({ result, form, fluid, locale, selectedFluidName, candidates, chartImage });
      track.pdfDownloaded({ cv: result.Cv, size: result.size.size, fluid });
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

  function handleDownloadCSV() {
    if (!result) return;
    const rows = [
      ["PSM VALVE — Petro Sazeh Mihan"], ["IT Department"], [""],
      ["Parameter", "Value", "Unit"],
      [L.fluidLbl, selectedFluidName || fluid, ""],
      [L.flowLbl, fluid === "steam" ? form.W : form.Q, fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m³/h" : "Nm³/h")],
      [L.p1Lbl, form.P1, "bar"], [L.p2Lbl, form.P2, "bar"],
      [L.dpLbl, (form.P1 - form.P2).toFixed(2), "bar"],
      ...(fluid === "liquid" ? [[L.gfLbl, form.Gf, "—"], [L.pvLbl, form.Pv, "bar"]] : []),
      ...(fluid === "gas" ? [[L.ggLbl, form.Gg, "—"]] : []),
      ...(fluid !== "liquid" ? [[L.tLbl, form.T, "°C"]] : []),
      [""], ["Result", "", ""],
      [L.cvLbl, result.Cv, ""], [L.kvLbl, result.Kv, ""],
      [L.sizeLbl, result.size.size, ""], ["DN", result.size.dn, ""],
      [L.openingLbl, result.openingPercent + "%", ""],
      [L.velocityLbl, result.velocity || "-", "m/s"],
      [L.noiseLbl, result.noise || "-", "dB"],
      [L.cavLbl, result.cavitationRisk || "-", ""],
      ["Engineering note", L.engineeringDisclaimer, ""],
      [""], ["Alternative Sizes", "", ""],
      ["Size", "Cv", "Opening %", "Verdict"]
    ];
    candidates.forEach(c => rows.push([c.size.size, c.size.cv, c.opening + "%", c.verdict]));

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

  function handleCopy() {
    if (!result) return;
    const dP = (form.P1 - form.P2).toFixed(2);
    const text = [
      "═══════════════════════════════", "  PSM VALVE — Sizing Report", "═══════════════════════════════", "",
      `${L.fluidLbl}: ${selectedFluidName || fluid}`,
      `${L.flowLbl}: ${fluid === "steam" ? form.W + " kg/h" : form.Q + " " + (fluid === "liquid" ? "m³/h" : "Nm³/h")}`,
      `P1: ${form.P1} bar · P2: ${form.P2} bar · ΔP: ${dP} bar`, "",
      "───────── RESULT ─────────",
      `Cv: ${result.Cv} · Kv: ${result.Kv}`,
      `${L.sizeLbl}: ${result.size.size} (${result.size.dn})`,
      `${L.openingLbl}: ${result.openingPercent}%`, "",
      L.engineeringDisclaimer, "",
      "───── ALTERNATIVE SIZES ─────",
      ...candidates.map(c => `${c.size.size}: Cv ${c.size.cv} · ${c.opening}% · ${c.verdict}`),
      "", `Generated: ${new Date().toLocaleString()}`, "PSM Valve · psm-valve.com"
    ].join("\n");

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
      const params = new URLSearchParams();
      params.set("fluid", fluid);
      Object.keys(form).forEach(k => { if (form[k] != null) params.set(k, String(form[k])); });
      const url = window.location.origin + window.location.pathname + "?" + params.toString();
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
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{L.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{L.subtitle}</div>
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
                    <span>{L.reportRef}: PSM-SZ-{Date.now().toString().slice(-6)}</span>
                    <span>{L.date}: {new Date().toLocaleDateString(isFa ? "fa-IR" : "en-GB")}</span>
                  </div>

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

                  <div>
                    <div className="report-heading">
                      <FileText size={13} color="var(--gold)" />
                      {L.inputs}
                    </div>
                    <div style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--bg-soft)", border: "1px solid var(--border)"
                    }}>
                      <ReportRow label={L.fluidLbl} value={selectedFluidName || fluid} />
                      {fluid === "steam" ? (
                        <ReportRow label={L.flowLbl} value={form.W + " kg/h"} />
                      ) : (
                        <ReportRow label={L.flowLbl} value={form.Q + (fluid === "liquid" ? " m³/h" : " Nm³/h")} />
                      )}
                      <ReportRow label={L.p1Lbl} value={form.P1 + " bar"} />
                      <ReportRow label={L.p2Lbl} value={form.P2 + " bar"} />
                      <ReportRow label={L.dpLbl} value={(form.P1 - form.P2).toFixed(2) + " bar"} />
                      {fluid === "liquid" && <ReportRow label={L.gfLbl} value={form.Gf} />}
                      {fluid === "gas" && <ReportRow label={L.ggLbl} value={form.Gg} />}
                      {fluid === "liquid" && <ReportRow label={L.pvLbl} value={form.Pv + " bar"} />}
                      {fluid !== "liquid" && <ReportRow label={L.tLbl} value={form.T + " °C"} last />}
                    </div>
                  </div>

                  <div>
                    <div className="report-heading">
                      <BarChart3 size={13} color="var(--gold)" />
                      {L.chart}
                    </div>
                    <div id="report-chart-for-pdf">
                      <ValveCharacteristicChart result={result} form={form} locale={locale} />
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

                  <div>
                    <div className="report-heading">
                      <CheckCircle2 size={13} color="var(--gold)" />
                      {L.tips}
                    </div>
                    <div className="card-glass" style={{ padding: 14 }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-soft)", lineHeight: 1.8 }}>
                        ✓ Cv = {result.Cv} ({isFa ? "برآورد اولیه" : "preliminary estimate"})<br />
                        ✓ {L.openingLbl} {result.openingPercent}% — {result.openingPercent >= 20 && result.openingPercent <= 80 ? (isFa ? "بهینه" : "Optimal") : (isFa ? "خارج از محدوده" : "Out of range")}<br />
                        ✓ {L.cavLbl}: {result.cavitationRisk || (isFa ? "کم" : "Low")}<br />
                        {result.choked && "⚠️ " + (isFa ? "جریان Choked" : "Choked Flow")}<br />
                        {result.capacityExceeded && "⚠️ " + L.capacityExceeded}
                      </div>
                      <div role="note" style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.7, marginTop: 8 }}>
                        {L.engineeringDisclaimer}
                      </div>
                    </div>
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

function ReportRow({ label, value, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0",
      borderBottom: last ? "none" : "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 900,
        color: "var(--text)",
        fontFamily: "monospace", direction: "ltr"
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