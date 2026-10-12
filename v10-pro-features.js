const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

function w(rel, content) {
  const full = path.join(ROOT, rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("[OK] " + rel);
}

console.log("=== v10 Professional Features ===\n");

// ============================================================
// 1. SCENARIOS DATA FILE
// ============================================================
console.log("=== 1. Scenarios data file ===\n");

if (!fs.existsSync(path.join(ROOT, "data", "scenarios.json"))) {
  w("data/scenarios.json", JSON.stringify({ scenarios: [] }, null, 2));
} else {
  console.log("[EXISTS] data/scenarios.json");
}

// ============================================================
// 2. SCENARIOS API
// ============================================================
console.log("=== 2. Scenarios API ===\n");

w("app/api/scenarios/route.js", `import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getScenariosPath() {
  return path.join(process.cwd(), "data", "scenarios.json");
}

function readAll() {
  const filePath = getScenariosPath();
  if (!fs.existsSync(filePath)) return { scenarios: [] };
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return { scenarios: [] };
  }
}

function writeAll(data) {
  const filePath = getScenariosPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// GET — list scenarios for a session
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "No session" }, { status: 400 });
  }

  const all = readAll();
  const mine = (all.scenarios || []).filter(function(s) {
    return s.session === sessionId;
  });

  return NextResponse.json({ ok: true, scenarios: mine });
}

// POST — save a scenario
export async function POST(request) {
  try {
    const body = await request.json();
    const { session, scenario } = body;

    if (!session || !scenario) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const all = readAll();
    const list = all.scenarios || [];

    // Limit to 20 per session
    const mine = list.filter(function(s) { return s.session === session; });
    if (mine.length >= 20) {
      return NextResponse.json({ ok: false, error: "Maximum 20 scenarios per session" }, { status: 400 });
    }

    const newScenario = {
      id: "sc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      session: session,
      createdAt: new Date().toISOString(),
      ...scenario
    };

    list.unshift(newScenario);

    // Cap total to 500
    const trimmed = list.slice(0, 500);
    writeAll({ scenarios: trimmed });

    return NextResponse.json({ ok: true, scenario: newScenario });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// DELETE — remove a scenario
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const session = searchParams.get("session");

  if (!id || !session) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const all = readAll();
  const filtered = (all.scenarios || []).filter(function(s) {
    return !(s.id === id && s.session === session);
  });
  writeAll({ scenarios: filtered });

  return NextResponse.json({ ok: true });
}
`);

// ============================================================
// 3. PDF GENERATOR
// ============================================================
console.log("=== 3. PDF Generator ===\n");

w("lib/pdf-generator.js", `// Generate professional PDF from sizing results
// Uses html2canvas + jsPDF

export async function generatePDF(options) {
  const { element, filename, locale, meta } = options;

  if (typeof window === "undefined") return;

  // Dynamic imports (client-only)
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // Capture the results element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "A4");

  // Header — Company Logo & Info
  const pageWidth = 210;
  const margin = 15;

  // Draw gold header bar
  pdf.setFillColor(201, 149, 13);
  pdf.rect(0, 0, pageWidth, 22, "F");

  // Company name in white
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("PSM VALVE", margin, 10);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Petro Sazeh Mihan", margin, 16);

  // Date on the right
  pdf.text(new Date().toLocaleDateString("en-US"), pageWidth - margin - 30, 10);
  pdf.text("Valve Sizing Report", pageWidth - margin - 30, 16);

  // Body — result image
  pdf.setTextColor(0, 0, 0);
  const startY = 28;

  // If image fits on one page
  if (imgHeight <= pageHeight - startY - 20) {
    pdf.addImage(imgData, "PNG", margin, startY, imgWidth - 2 * margin, imgHeight);
  } else {
    // Multi-page
    let remainingHeight = imgHeight;
    let position = 0;
    let currentY = startY;
    const availableHeight = pageHeight - startY - 20;

    while (remainingHeight > 0) {
      const pageCanvas = document.createElement("canvas");
      const pageCtx = pageCanvas.getContext("2d");
      const imgHeightMM = Math.min(remainingHeight, availableHeight);
      const imgHeightPx = (imgHeightMM * canvas.width) / imgWidth;

      pageCanvas.width = canvas.width;
      pageCanvas.height = imgHeightPx;
      pageCtx.drawImage(
        canvas,
        0,
        position,
        canvas.width,
        imgHeightPx,
        0,
        0,
        canvas.width,
        imgHeightPx
      );

      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(pageImgData, "PNG", margin, currentY, imgWidth - 2 * margin, imgHeightMM);

      position += imgHeightPx;
      remainingHeight -= imgHeightMM;

      if (remainingHeight > 0) {
        pdf.addPage();
        currentY = margin;
      }
    }
  }

  // Footer
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "www.psmvalve.com  |  info@psmvalve.com  |  Arak, Iran",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    pdf.text(
      "Page " + i + " of " + totalPages,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Save
  pdf.save(filename || "PSM-Sizing-Report.pdf");
}

export async function generateCSV(options) {
  const { result, form, fluid, locale } = options;

  if (typeof window === "undefined") return;

  const rows = [
    ["#", "Parameter", "Value", "Unit"],
    ["1", "Fluid Type", fluid, ""],
    ["2", "Flow Rate (Q)", form.Q, fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m3/h" : "Nm3/h")],
    ["3", "Relative Density", fluid === "liquid" ? form.Gf : form.Gg, ""],
    ["4", "Inlet Pressure P1", form.P1, "bar"],
    ["5", "Outlet Pressure P2", form.P2, "bar"],
    ["6", "Vapor Pressure Pv", form.Pv || "-", "bar"],
    ["7", "Temperature T", form.T || "-", "°C"],
    ["", "", "", ""],
    ["RESULT", "", "", ""],
    ["8", "Cv Coefficient", result.Cv, ""],
    ["9", "Kv Coefficient", result.Kv, ""],
    ["10", "Valve Size", result.size.size, ""],
    ["11", "DN", result.size.dn, ""],
    ["12", "NPS", result.size.nps, ""],
    ["13", "Opening", result.openingPercent + "%", ""],
    ["14", "Velocity", result.velocity || "-", "m/s"],
    ["15", "Noise", result.noise || "-", "dB"],
    ["16", "Cavitation Risk", result.cavitationRisk || "-", ""],
    ["17", "Choked Flow", result.choked ? "Yes" : "No", ""]
  ];

  const csv = rows.map(function(r) {
    return r.map(function(c) {
      const s = String(c == null ? "" : c);
      if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(",");
  }).join("\\n");

  // BOM for Excel to read UTF-8 correctly
  const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "PSM-Sizing-Report.csv";
  link.click();
  URL.revokeObjectURL(url);
}
`);

// ============================================================
// 4. WIZARD COMPONENT
// ============================================================
console.log("=== 4. SizingWizard ===\n");

w("components/SizingWizard.jsx", `"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Droplets, Wind, Flame, Check, X, Beaker, Gauge, Thermometer, Zap, Calculator } from "lucide-react";
import { FLUID_PRESETS } from "@/lib/sizing-advanced";

const FLUID_OPTIONS = [
  { id: "liquid", icon: Droplets, color: "#0078D4",
    fa: { title: "مایع", desc: "آب، روغن، اسید، سوخت" },
    en: { title: "Liquid", desc: "Water, oil, acid, fuel" } },
  { id: "gas", icon: Wind, color: "#F7630C",
    fa: { title: "گاز", desc: "گاز طبیعی، هوا، بخار خشک" },
    en: { title: "Gas", desc: "Natural gas, air, dry vapor" } },
  { id: "steam", icon: Flame, color: "#E81123",
    fa: { title: "بخار", desc: "بخار اشباع، بخار فوق گرم" },
    en: { title: "Steam", desc: "Saturated, superheated" } }
];

const PRESET_LIQUIDS = [
  { id: "water", icon: "💧", fa: "آب", en: "Water", Pv: 0.0317, Pc: 221, Gf: 1.0 },
  { id: "oil", icon: "🛢", fa: "روغن", en: "Oil", Pv: 0.01, Pc: 22, Gf: 0.85 },
  { id: "gasoline", icon: "⛽", fa: "بنزین", en: "Gasoline", Pv: 0.65, Pc: 32, Gf: 0.75 },
  { id: "condensate", icon: "💦", fa: "کاندنس", en: "Condensate", Pv: 0.5, Pc: 42, Gf: 0.7 }
];

export default function SizingWizard({ onComplete, onClose, locale }) {
  const [step, setStep] = useState(1);
  const [fluid, setFluid] = useState(null);
  const [preset, setPreset] = useState(null);
  const [data, setData] = useState({
    Q: 100, P1: 10, P2: 6, T: 25, Pv: 0.5, Pc: 221, Gf: 1, W: 500
  });

  const L = {
    fa: {
      title: "راهنمای سایزینگ گام‌به‌گام",
      subtitle: "در ۳ مرحله ساده به نتیجه برسید",
      step1: "نوع سیال",
      step2: "شرایط کاری",
      step3: "خلاصه و محاسبه",
      next: "مرحله بعد",
      back: "مرحله قبل",
      finish: "محاسبه کن",
      cancel: "انصراف",
      chooseLiquid: "سیال نمونه را انتخاب کنید",
      choose: "انتخاب",
      selected: "انتخاب شده",
      flow: "دبی",
      p1: "فشار ورودی",
      p2: "فشار خروجی",
      temp: "دما",
      pv: "فشار بخار",
      summary: "خلاصه ورودی‌ها",
      notSelected: "انتخاب نشده",
      step: "مرحله",
      of: "از"
    },
    en: {
      title: "Step-by-Step Sizing Wizard",
      subtitle: "Get results in 3 simple steps",
      step1: "Fluid Type",
      step2: "Conditions",
      step3: "Summary",
      next: "Next Step",
      back: "Back",
      finish: "Calculate",
      cancel: "Cancel",
      chooseLiquid: "Choose a liquid preset",
      choose: "Select",
      selected: "Selected",
      flow: "Flow",
      p1: "Inlet Pressure",
      p2: "Outlet Pressure",
      temp: "Temperature",
      pv: "Vapor Pressure",
      summary: "Summary",
      notSelected: "Not selected",
      step: "Step",
      of: "of"
    },
    ar: {
      title: "معالج تحديد الحجم",
      subtitle: "احصل على النتائج في 3 خطوات",
      step1: "نوع السائل",
      step2: "الظروف",
      step3: "الملخص",
      next: "التالي",
      back: "السابق",
      finish: "احسب",
      cancel: "إلغاء",
      chooseLiquid: "اختر سائل جاهز",
      choose: "اختيار",
      selected: "محدد",
      flow: "التدفق",
      p1: "الضغط الداخل",
      p2: "الضغط الخارج",
      temp: "الحرارة",
      pv: "ضغط البخار",
      summary: "الملخص",
      notSelected: "غير محدد",
      step: "خطوة",
      of: "من"
    },
    ru: {
      title: "Пошаговый подбор",
      subtitle: "Результат в 3 шага",
      step1: "Тип жидкости",
      step2: "Условия",
      step3: "Итог",
      next: "Далее",
      back: "Назад",
      finish: "Рассчитать",
      cancel: "Отмена",
      chooseLiquid: "Выберите пресет",
      choose: "Выбрать",
      selected: "Выбрано",
      flow: "Расход",
      p1: "Давление P1",
      p2: "Давление P2",
      temp: "Температура",
      pv: "Давление паров",
      summary: "Итог",
      notSelected: "Не выбрано",
      step: "Шаг",
      of: "из"
    }
  }[locale] || {};

  const steps = [
    { id: 1, label: L.step1 },
    { id: 2, label: L.step2 },
    { id: 3, label: L.step3 }
  ];

  function selectFluid(id) {
    setFluid(id);
    setPreset(null);
    if (id !== "liquid") setPreset({ id: "default" });
  }

  function selectPreset(p) {
    setPreset(p);
    setData(function(prev) {
      return Object.assign({}, prev, { Pv: p.Pv, Pc: p.Pc, Gf: p.Gf });
    });
  }

  function canNext() {
    if (step === 1) return fluid && preset;
    if (step === 2) return data.Q > 0 && data.P1 > 0 && data.P2 > 0 && data.P1 > data.P2;
    return true;
  }

  function next() {
    if (!canNext()) return;
    if (step < 3) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function finish() {
    onComplete({
      fluid: fluid,
      form: Object.assign({}, data, { Gg: data.Gg || 0.65, Z: 1, k: 1.4, xT: 0.7, FL: 0.9 })
    });
  }

  function update(k, v) {
    setData(Object.assign({}, data, { [k]: parseFloat(v) || 0 }));
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(20, 22, 27, 0.7)",
      backdropFilter: "blur(8px)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }} onClick={onClose}>
      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
        }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>
              ✨ {L.title}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>
              {L.subtitle}
            </div>
          </div>
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--bg-soft)", border: "1px solid var(--border)",
              cursor: "pointer",
              display: "grid", placeItems: "center",
              color: "var(--text)"
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div style={{
          padding: "16px 24px",
          background: "var(--bg-soft)",
          borderBottom: "1px solid var(--border)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10
          }}>
            {steps.map(function(s, i) {
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1
                }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    display: "grid",
                    placeItems: "center",
                    background: isDone || isActive
                      ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                      : "var(--bg-card)",
                    border: isDone || isActive ? "none" : "1px solid var(--border)",
                    color: isDone || isActive ? "#FFFFFF" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 900,
                    boxShadow: isActive ? "0 4px 12px rgba(201, 149, 13, 0.35)" : "none",
                    transition: "all 0.2s",
                    flexShrink: 0
                  }}>
                    {isDone ? <Check size={14} /> : s.id}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: isActive ? "var(--text)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      background: isDone ? "#E0A81A" : "var(--border)",
                      borderRadius: 1,
                      marginInlineStart: 8
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, minHeight: 280 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1 — Fluid */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.step1}
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                    marginBottom: 20
                  }}>
                    {FLUID_OPTIONS.map(function(f) {
                      const Icon = f.icon;
                      const active = fluid === f.id;
                      const t = f[locale] || f.en;
                      return (
                        <button key={f.id} onClick={function() { selectFluid(f.id); }}
                          style={{
                            padding: 16,
                            borderRadius: 14,
                            border: "2px solid " + (active ? f.color : "var(--border)"),
                            background: active ? f.color + "10" : "#FFFFFF",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "center",
                            transition: "all 0.2s",
                            position: "relative"
                          }}>
                          {active && (
                            <div style={{
                              position: "absolute",
                              top: 8,
                              insetInlineEnd: 8,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: f.color,
                              display: "grid",
                              placeItems: "center",
                              color: "#FFFFFF"
                            }}>
                              <Check size={12} />
                            </div>
                          )}
                          <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            margin: "0 auto 10px",
                            display: "grid", placeItems: "center",
                            background: f.color + "15",
                            color: f.color
                          }}>
                            <Icon size={24} />
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.5 }}>
                            {t.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {fluid === "liquid" && (
                    <>
                      <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {L.chooseLiquid}
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8
                      }}>
                        {PRESET_LIQUIDS.map(function(p) {
                          const active = preset && preset.id === p.id;
                          return (
                            <button key={p.id} onClick={function() { selectPreset(p); }}
                              style={{
                                padding: 12,
                                borderRadius: 12,
                                border: "1.5px solid " + (active ? "#E0A81A" : "var(--border)"),
                                background: active ? "rgba(201, 149, 13, 0.08)" : "#FFFFFF",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "center",
                                transition: "all 0.15s"
                              }}>
                              <div style={{ fontSize: 24, marginBottom: 6 }}>{p.icon}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>
                                {locale === "fa" ? p.fa : p.en}
                              </div>
                              <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, marginTop: 3, fontFamily: "monospace" }}>
                                Gf {p.Gf}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {fluid === "gas" && (
                    <div style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(247, 99, 12, 0.06)",
                      border: "1px solid rgba(247, 99, 12, 0.25)",
                      fontSize: 12,
                      color: "#CA5010",
                      fontWeight: 700,
                      lineHeight: 1.7
                    }}>
                      ℹ️ برای گاز طبیعی، Gg = 0.65 و برای هوا Gg = 1.0 در نظر بگیرید. در مرحله بعد می‌توانید وارد کنید.
                    </div>
                  )}

                  {fluid === "steam" && (
                    <div style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(232, 17, 35, 0.06)",
                      border: "1px solid rgba(232, 17, 35, 0.25)",
                      fontSize: 12,
                      color: "#C40E1C",
                      fontWeight: 700,
                      lineHeight: 1.7
                    }}>
                      ⚠️ برای بخار، دبی جرمی (kg/h) و دما استفاده می‌شود. مقادیر را در مرحله بعد وارد کنید.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 — Conditions */}
              {step === 2 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.step2}
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14
                  }}>
                    {fluid === "steam" ? (
                      <WizardField label={L.flow} unit="kg/h" value={data.W} onChange={function(v) { update("W", v); }} />
                    ) : (
                      <WizardField
                        label={L.flow}
                        unit={fluid === "liquid" ? "m³/h" : "Nm³/h"}
                        value={data.Q}
                        onChange={function(v) { update("Q", v); }}
                      />
                    )}
                    <WizardField label={L.p1} unit="bar" value={data.P1} onChange={function(v) { update("P1", v); }} />
                    <WizardField label={L.p2} unit="bar" value={data.P2} onChange={function(v) { update("P2", v); }} />

                    {fluid === "liquid" && (
                      <WizardField label={L.pv} unit="bar" value={data.Pv} onChange={function(v) { update("Pv", v); }} />
                    )}
                    {fluid !== "liquid" && (
                      <WizardField label={L.temp} unit="°C" value={data.T} onChange={function(v) { update("T", v); }} />
                    )}
                    {fluid === "gas" && (
                      <WizardField label="Gg" unit="—" value={data.Gg || 0.65} onChange={function(v) { update("Gg", v); }} />
                    )}
                  </div>

                  {data.P1 && data.P2 && data.P1 <= data.P2 && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(232, 17, 35, 0.08)",
                      border: "1px solid rgba(232, 17, 35, 0.3)",
                      color: "#E81123",
                      fontSize: 12,
                      fontWeight: 800
                    }}>
                      ⚠️ فشار ورودی باید بیشتر از فشار خروجی باشد
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — Summary */}
              {step === 3 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.summary}
                  </div>

                  <div style={{
                    padding: 16,
                    borderRadius: 14,
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)"
                  }}>
                    <SummaryRow label={L.step1} value={FLUID_OPTIONS.find(function(f) { return f.id === fluid; })?.[locale]?.title || fluid} />
                    {preset && preset.id !== "default" && (
                      <SummaryRow label={L.chooseLiquid} value={locale === "fa" ? preset.fa : preset.en} />
                    )}
                    {fluid === "steam" ? (
                      <SummaryRow label={L.flow} value={data.W + " kg/h"} />
                    ) : (
                      <SummaryRow label={L.flow} value={data.Q + (fluid === "liquid" ? " m³/h" : " Nm³/h")} />
                    )}
                    <SummaryRow label={L.p1} value={data.P1 + " bar"} />
                    <SummaryRow label={L.p2} value={data.P2 + " bar"} />
                    {fluid === "liquid" && <SummaryRow label={L.pv} value={data.Pv + " bar"} />}
                    {fluid !== "liquid" && <SummaryRow label={L.temp} value={data.T + " °C"} />}
                    {fluid === "gas" && <SummaryRow label="Gg" value={String(data.Gg || 0.65)} />}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 10,
          background: "var(--bg-soft)"
        }}>
          {step > 1 && (
            <button onClick={back}
              style={{
                padding: "12px 20px",
                borderRadius: 11,
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
              <ArrowRight size={14} /> {L.back}
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button onClick={onClose}
            style={{
              padding: "12px 20px",
              borderRadius: 11,
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 900,
              color: "var(--text-muted)"
            }}>
            {L.cancel}
          </button>

          {step < 3 ? (
            <button onClick={next}
              disabled={!canNext()}
              style={{
                padding: "12px 24px",
                borderRadius: 11,
                border: "none",
                cursor: canNext() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                background: canNext()
                  ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                  : "var(--bg-soft)",
                color: canNext() ? "#FFFFFF" : "var(--text-muted)",
                boxShadow: canNext() ? "0 6px 16px rgba(201, 149, 13, 0.35)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: canNext() ? 1 : 0.5
              }}>
              {L.next} <ArrowLeft size={14} />
            </button>
          ) : (
            <button onClick={finish}
              style={{
                padding: "12px 24px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
              <Calculator size={14} /> {L.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardField({ label, unit, value, onChange }) {
  return (
    <div>
      <label style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 900,
        color: "var(--text-muted)",
        marginBottom: 6
      }}>
        <span>{label}</span>
        <span style={{
          fontFamily: "monospace",
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 5,
          background: "var(--bg-soft)"
        }}>
          {unit}
        </span>
      </label>
      <input
        type="number"
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "2px solid var(--border)",
          background: "var(--bg-soft)",
          color: "var(--text)",
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: 700,
          transition: "all 0.15s"
        }}
        onFocus={function(e) {
          e.target.style.borderColor = "#E0A81A";
          e.target.style.background = "#FFFFFF";
        }}
        onBlur={function(e) {
          e.target.style.borderColor = "var(--border)";
          e.target.style.background = "var(--bg-soft)";
        }}
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", fontFamily: "monospace", direction: "ltr" }}>{value}</span>
    </div>
  );
}
`);

// ============================================================
// 5. UPDATE SizingTool to integrate everything
// ============================================================
console.log("=== 5. Update SizingTool ===\n");

let sizing = fs.readFileSync(path.join(ROOT, "components", "SizingTool.jsx"), "utf8");

// Add imports
if (sizing.indexOf("SizingWizard") === -1) {
  sizing = sizing.replace(
    'import MaterialGuide from "./MaterialGuide";',
    'import MaterialGuide from "./MaterialGuide";\nimport SizingWizard from "./SizingWizard";\nimport { generatePDF, generateCSV } from "@/lib/pdf-generator";'
  );
  console.log("[OK] Imports added");
}

// Add FileText, Download, Wand2, Cloud icons
if (sizing.indexOf("Wand2") === -1) {
  sizing = sizing.replace(
    /(\bShare2, RotateCcw, RefreshCw\b)/,
    "$1, Wand2, FileText, Download, Cloud, CloudOff"
  );
}

// Add state for wizard
if (sizing.indexOf("showWizard") === -1) {
  sizing = sizing.replace(
    "const [mobileTab, setMobileTab] = useState(\"form\");",
    "const [mobileTab, setMobileTab] = useState(\"form\");\n  const [showWizard, setShowWizard] = useState(false);\n  const [sessionId, setSessionId] = useState(null);\n  const [serverSaved, setServerSaved] = useState([]);"
  );
  console.log("[OK] Wizard state added");
}

// Get/create session ID on mount
if (sizing.indexOf("psm_session_id") === -1) {
  sizing = sizing.replace(
    "  // Load scenarios on mount\n  useEffect(function() { setSaved(loadScenarios()); }, []);",
    `  // Load scenarios on mount
  useEffect(function() { setSaved(loadScenarios()); }, []);

  // Get or create session ID
  useEffect(function() {
    if (typeof window === "undefined") return;
    let id = localStorage.getItem("psm_session_id");
    if (!id) {
      id = "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("psm_session_id", id);
    }
    setSessionId(id);
    // Load server scenarios
    fetch("/api/scenarios?session=" + id)
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.ok) setServerSaved(d.scenarios); })
      .catch(function() {});
  }, []);`
  );
}

// Add wizard completion handler
if (sizing.indexOf("handleWizardComplete") === -1) {
  sizing = sizing.replace(
    "  function reset() {",
    `  function handleWizardComplete(data) {
    setFluid(data.fluid);
    setForm(Object.assign({}, DEFAULT_FORM, data.form));
    setShowWizard(false);
    // Auto-calculate
    setTimeout(function() {
      // Use the same calculate logic but with new form
      let r;
      if (data.fluid === "liquid") {
        r = calcLiquidCv({ Q: data.form.Q, Gf: data.form.Gf, P1: data.form.P1, P2: data.form.P2, Pv: data.form.Pv, Pc: data.form.Pc, FL: data.form.FL });
      } else if (data.fluid === "steam") {
        r = calcSteamCv({ W: data.form.W, P1: data.form.P1, P2: data.form.P2, T: data.form.T });
      } else {
        r = calcGasCv({ Q: data.form.Q, Gg: data.form.Gg, T: data.form.T, P1: data.form.P1, P2: data.form.P2, Z: data.form.Z, k: data.form.k, xT: data.form.xT });
      }
      if (r.error) { setResult({ error: r.error }); return; }
      const openingPercent = Math.min(100, Math.round((r.Cv / r.size.cv) * 100));
      const warnings = getRecommendation(openingPercent, r.choked, r.cavitationRisk);
      const recCharacteristic = getRecommendedCharacteristic(data.fluid, openingPercent);
      setResult(Object.assign({}, r, {
        openingPercent: openingPercent,
        flowPercent: openingPercent,
        warnings: warnings,
        fluidType: data.fluid,
        recommendedCharacteristic: recCharacteristic,
        timestamp: Date.now()
      }));
    }, 100);
  }

  async function handleSaveToServer() {
    if (!result || !sessionId) return;
    const name = prompt("نام سناریو / Scenario name:");
    if (!name) return;
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionId,
          scenario: {
            name: name,
            fluid: fluid,
            form: form,
            result: {
              Cv: result.Cv,
              Kv: result.Kv,
              size: result.size,
              openingPercent: result.openingPercent,
              velocity: result.velocity,
              noise: result.noise,
              cavitationRisk: result.cavitationRisk,
              choked: result.choked
            }
          }
        })
      });
      const data = await res.json();
      if (data.ok) {
        setServerSaved(function(prev) { return [data.scenario].concat(prev); });
        setShowShareToast(true);
        setTimeout(function() { setShowShareToast(false); }, 2500);
      } else {
        alert(data.error || "خطا در ذخیره");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  }

  async function handleDeleteFromServer(id) {
    if (!sessionId) return;
    if (!confirm("این سناریو از سرور حذف شود؟")) return;
    try {
      await fetch("/api/scenarios?id=" + id + "&session=" + sessionId, { method: "DELETE" });
      setServerSaved(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
    } catch (e) {}
  }

  async function handleDownloadPDF() {
    const el = document.getElementById("sizing-print-area");
    if (!el) return;
    try {
      await generatePDF({
        element: el,
        filename: "PSM-Sizing-" + Date.now() + ".pdf",
        locale: locale
      });
    } catch (e) {
      alert("PDF generation failed: " + e.message);
    }
  }

  function handleDownloadCSV() {
    if (!result) return;
    generateCSV({ result: result, form: form, fluid: fluid, locale: locale });
  }

  function reset() {`
  );
  console.log("[OK] Handlers added");
}

// Add wizard button near header
if (sizing.indexOf("openWizard") === -1) {
  const headerEnd = `<div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }} className="no-print">
        <SizingModeSelector mode={mode} onChange={setMode} locale={locale} />
      </div>`;

  if (sizing.indexOf(headerEnd) !== -1) {
    sizing = sizing.replace(
      headerEnd,
      `<div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        flexWrap: "wrap"
      }} className="no-print">
        <SizingModeSelector mode={mode} onChange={setMode} locale={locale} />
        {mode === "sizing" && (
          <button
            onClick={function() { setShowWizard(true); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 10,
              border: "1.5px dashed #E0A81A",
              background: "rgba(201, 149, 13, 0.05)",
              color: "#B8850A",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 900,
              transition: "all 0.18s"
            }}
            onMouseEnter={function(e) {
              e.currentTarget.style.background = "rgba(201, 149, 13, 0.12)";
              e.currentTarget.style.borderStyle = "solid";
            }}
            onMouseLeave={function(e) {
              e.currentTarget.style.background = "rgba(201, 149, 13, 0.05)";
              e.currentTarget.style.borderStyle = "dashed";
            }}
          >
            <Wand2 size={14} />
            {locale === "fa" ? "راهنمای گام‌به‌گام" : locale === "ar" ? "المعالج" : locale === "ru" ? "Мастер" : "Wizard"}
          </button>
        )}
      </div>`
    );
    console.log("[OK] Wizard button added");
  }
}

// Wrap results in print-area id
if (sizing.indexOf('id="sizing-print-area"') === -1) {
  sizing = sizing.replace(
    `<motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "grid", gap: 10 }}
                >`,
    `<motion.div
                  id="sizing-print-area"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "grid", gap: 10 }}
                >`
  );
  console.log("[OK] Print area ID added");
}

// Replace action buttons row with expanded version (6 buttons)
const actionRowPattern = /<div className="no-print" style=\{\{\s*display: "grid",\s*gridTemplateColumns: "repeat\(4, 1fr\)",\s*gap: 6\s*\}\}>[\s\S]*?<\/div>/;

if (actionRowPattern.test(sizing)) {
  sizing = sizing.replace(
    actionRowPattern,
    `<div className="no-print" style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6
                  }}>
                    <ActionBtn onClick={handleDownloadPDF} icon={<FileText size={13} />} label="PDF" />
                    <ActionBtn onClick={handleDownloadCSV} icon={<Download size={13} />} label="Excel" />
                    <ActionBtn onClick={handlePrint} icon={<Printer size={13} />} label={L.print} />
                    <ActionBtn onClick={handleSaveToServer} icon={<Cloud size={13} />} label="ذخیره" />
                    <ActionBtn
                      onClick={function() {
                        if (compareSnapshot) openCompare();
                        else saveForCompare();
                      }}
                      icon={<Layers size={13} />}
                      label={compareSnapshot ? L.compareNow : "مقایسه"}
                    />
                    <ActionBtn onClick={shareLink} icon={<Share2 size={13} />} label={L.share} />
                  </div>`
  );
  console.log("[OK] Action buttons updated");
}

// Add server scenarios list under localStorage saved
if (sizing.indexOf("serverSaved.length > 0") === -1) {
  const savedBlockEnd = `              )}
            </div>

            {/* ===== RIGHT: RESULTS + STANDARDS + MATERIAL ===== */}`;

  if (sizing.indexOf(savedBlockEnd) !== -1) {
    sizing = sizing.replace(
      savedBlockEnd,
      `              )}

              {/* Server-saved scenarios */}
              {serverSaved.length > 0 && (
                <div className="card-glass" style={{ padding: 0, overflow: "hidden", marginTop: 10 }}>
                  <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 900, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Cloud size={13} style={{ color: "#0078D4" }} />
                    {locale === "fa" ? "سناریوهای سرور" : "Server Scenarios"} ({serverSaved.length})
                  </div>
                  <div style={{ padding: 10, display: "grid", gap: 5 }}>
                    {serverSaved.slice(0, 5).map(function(s) {
                      return (
                        <div key={s.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 11px",
                          borderRadius: 9,
                          background: "rgba(0, 120, 212, 0.05)",
                          border: "1px solid rgba(0, 120, 212, 0.2)"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>
                              {s.name}
                            </div>
                            <div style={{
                              fontSize: 9.5,
                              color: "var(--text-muted)",
                              fontFamily: "monospace",
                              direction: "ltr"
                            }}>
                              Cv {s.result?.Cv} · {s.result?.size?.size} · {s.result?.openingPercent}%
                            </div>
                          </div>
                          <button
                            onClick={function() { handleDeleteFromServer(s.id); }}
                            style={{
                              width: 24, height: 24, borderRadius: 7,
                              background: "rgba(232, 17, 35, 0.1)",
                              color: "#E81123",
                              border: "none", cursor: "pointer",
                              display: "grid", placeItems: "center",
                              flexShrink: 0
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ===== RIGHT: RESULTS + STANDARDS + MATERIAL ===== */}`
    );
    console.log("[OK] Server scenarios list added");
  }
}

// Add wizard modal at end
if (sizing.indexOf("<SizingWizard") === -1) {
  sizing = sizing.replace(
    "{/* Compare modal */}",
    `{/* Wizard modal */}
      {showWizard && (
        <SizingWizard
          onComplete={handleWizardComplete}
          onClose={function() { setShowWizard(false); }}
          locale={locale}
        />
      )}

      {/* Compare modal */}`
  );
  console.log("[OK] Wizard modal added");
}

fs.writeFileSync(path.join(ROOT, "components", "SizingTool.jsx"), sizing, "utf8");
console.log("[OK] SizingTool.jsx saved");

// Delete this script
try {
  fs.unlinkSync(path.join(ROOT, "v10-pro-features.js"));
  console.log("[DEL] v10-pro-features.js");
} catch (e) {}

console.log("\n=== DONE ===");
console.log("");
console.log("✓ PDF generation (real PDF with PSM header)");
console.log("✓ Excel/CSV export");
console.log("✓ Server-side scenario storage (API + JSON)");
console.log("✓ Wizard 3-step mode for beginners");
console.log("");
console.log("Now restart server:");
console.log("  1. Ctrl+C");
console.log("  2. Remove-Item -Recurse -Force .next");
console.log("  3. npm run dev");