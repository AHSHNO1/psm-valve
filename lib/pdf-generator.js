"use client";
import { velocityFromSI } from "@/lib/unit-system";
import { velocityExceedsGuide } from "@/lib/sizing-advanced";

// ============================================================
// PROFESSIONAL PDF DATASHEET — PSM Valve (English Only)
// With chart image + 3 candidate sizes + watermark
// ============================================================

// فونت‌های standard در jsPDF فقط WinAnsi را می‌شناسند؛ حروف یونانی/ریاضیِ متن
// موتور در PDF خراب چاپ می‌شوند، پس در چاپ به معادل ASCII تبدیل می‌شوند.
const PDF_ASCII_MAP = {
  "≈": "~", "≥": ">=", "≤": "<=", "⇒": "=>", "↔": "<->", "→": "->",
  "Δ": "d", "δ": "d", "∫": "int", "ω": "omega", "Ω": "Ohm", "η": "eta",
  "β": "beta", "ρ": "rho", "μ": "u", "σ": "sigma", "τ": "tau", "π": "pi",
  "✓": "[OK]", "✗": "[X]", "\u00A0": " "
};
function pdfAscii(value) {
  return String(value == null ? "" : value).replace(/[^\x20-\x7E—–…·°±×÷²³]/g, (c) => (PDF_ASCII_MAP[c] != null ? PDF_ASCII_MAP[c] : ""));
}

export async function generateSizingPDF({
  result, form, fluid, locale = "fa",
  selectedFluidName, candidates, chartImage,
  units = null, mw = null, formSI = null, catalogMatch = null
}) {
  if (!result || result.error) return;

  // سرویس‌های تخصصی دیتاشیت خودشان را دارند (شیر اطمینان / دسوپرهیتر / دو‌فازی)
  if (result.mode === "psv" || result.mode === "desuper" || result.mode === "twoPhase") {
    return generateServicePDF({ result, formSI, fluid, selectedFluidName });
  }

  // واحدهای نمایشی (در نبود آنها SI)
  const u = Object.assign(
    {
      flow: fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m³/h" : "Nm³/h"),
      pressure: "bar",
      temp: "°C",
      velocity: "m/s",
      field: {}
    },
    units || {}
  );
  // هر فیلد ورودی ممکن است واحد مستقل خودش را داشته باشد
  const uf = (f, fallback) => u.field[f] || fallback;
  const velocityDisplay = result.velocity ? +velocityFromSI(result.velocity, u.velocity).toFixed(2) : null;

  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;

  // ============================================================
  // WATERMARK
  // ============================================================
  function addWatermark(d) {
    try {
      if (d.GState) {
        d.setGState(new d.GState({ opacity: 0.06 }));
      }
      d.setTextColor(180, 180, 180);
      d.setFontSize(110);
      d.setFont("helvetica", "bold");
      d.text("PSM", pageW / 2, pageH / 2 + 15, { align: "center", angle: 30 });
      d.setFontSize(16);
      d.setFont("helvetica", "normal");
      d.text("VALVE", pageW / 2, pageH / 2 + 32, { align: "center", angle: 30 });
      d.setFontSize(9);
      d.text("Petro Sazeh Mihan", pageW / 2, pageH / 2 + 43, { align: "center", angle: 30 });
      if (d.GState) {
        d.setGState(new d.GState({ opacity: 1 }));
      }
    } catch (e) {
      d.setTextColor(240, 240, 240);
      d.setFontSize(110);
      d.setFont("helvetica", "bold");
      d.text("PSM", pageW / 2, pageH / 2 + 15, { align: "center", angle: 30 });
    }
  }

  // ============ HEADER ============
  doc.setFillColor(15, 17, 20);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setFillColor(224, 168, 26);
  doc.rect(0, 36, pageW, 1.5, "F");

  doc.setFillColor(224, 168, 26);
  doc.roundedRect(margin, 8, 20, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PSM", margin + 10, 21, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PSM VALVE", margin + 26, 15);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Petro Sazeh Mihan — PSM Valve", margin + 26, 21);
  doc.text("www.psmvalve.com", margin + 26, 26);

  doc.setTextColor(224, 168, 26);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("CONTROL VALVE SIZING REPORT", pageW - margin, 15, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  const now = new Date();
  doc.text(`Date: ${now.toLocaleDateString("en-GB")}`, pageW - margin, 21, { align: "right" });
  doc.text(`Report No: PSM-SZ-${Date.now().toString().slice(-8)}`, pageW - margin, 26, { align: "right" });

  let y = 48;

  // ============ HERO RESULT ============
  doc.setFillColor(224, 168, 26);
  doc.roundedRect(margin, y, 58, 34, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CV FACTOR", margin + 29, y + 9, { align: "center" });
  doc.setFontSize(24);
  doc.text(String(result.Cv), margin + 29, y + 24, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Kv ${result.Kv}`, margin + 29, y + 30, { align: "center" });

  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin + 62, y, 55, 34, 4, 4, "F");
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 62, y, 55, 34, 4, 4, "S");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(result.capacityExceeded ? "LARGEST LISTED SIZE" : "PRELIMINARY SIZE", margin + 89.5, y + 9, { align: "center" });
  doc.setTextColor(184, 133, 10);
  doc.setFontSize(24);
  doc.text(String(result.size.size), margin + 89.5, y + 24, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${result.size.dn}  ·  ${result.size.nps}`, margin + 89.5, y + 30, { align: "center" });

  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin + 121, y, 59, 34, 4, 4, "F");
  doc.roundedRect(margin + 121, y, 59, 34, 4, 4, "S");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("VALVE OPENING", margin + 150.5, y + 9, { align: "center" });
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(24);
  doc.text(`${result.openingPercent}%`, margin + 150.5, y + 24, { align: "center" });

  let opStatus = "Optimal opening";
  let opColor = [16, 185, 129];
  if (result.openingPercent < 20) { opStatus = "Low — smaller size"; opColor = [245, 158, 11]; }
  else if (result.openingPercent > 80) { opStatus = "High — larger size"; opColor = [245, 158, 11]; }
  doc.setTextColor(opColor[0], opColor[1], opColor[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(opStatus, margin + 150.5, y + 30, { align: "center" });

  y += 44;

  // ============ 1. INPUT PARAMETERS ============
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "1. INPUT PARAMETERS");

  const inputsTable = [
    ["Parameter", "Value", "Unit"],
    ["Fluid Type", selectedFluidName || fluid.toUpperCase(), "—"],
    [
      "Flow Rate",
      fluid === "steam" ? form.W : form.Q,
      u.flow
    ],
    ["Inlet Pressure (P1)", form.P1, uf("P1", u.pressure)],
    ["Outlet Pressure (P2)", form.P2, uf("P2", u.pressure)],
    ["Pressure Drop (ΔP)", u.dp != null ? u.dp : +(form.P1 - form.P2).toFixed(2), u.dpUnit || u.pressure]
  ];
  if (fluid === "liquid") {
    inputsTable.push(["Liquid SG (Gf)", form.Gf, uf("Gf", "—")]);
    inputsTable.push(["Vapor Pressure (Pv)", form.Pv, uf("Pv", u.pressure)]);
    if (form.nu != null) inputsTable.push(["Viscosity (ν)", form.nu, uf("nu", "cSt")]);
  }
  if (fluid === "gas") {
    inputsTable.push(["Gas SG (Gg)", form.Gg, "—"]);
    if (mw != null) inputsTable.push(["Molecular Weight (MW)", mw, "kg/kmol"]);
    inputsTable.push(["Compressibility (Z)", form.Z, "—"]);
    inputsTable.push(["Specific Heat (k)", form.k, "—"]);
  }
  if (fluid !== "liquid") {
    inputsTable.push(["Temperature", form.T, u.temp]);
  }
  y = drawTable(doc, y, margin, inputsTable);

  y += 6;

  // ============ 2. PERFORMANCE METRICS ============
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "2. PERFORMANCE METRICS");

  const metricsRows = [];
  if (result.marginPct > 0) metricsRows.push(["Design Margin", `+${result.marginPct}% (Cv ${result.rawCv ?? "-"} → ${result.Cv})`]);
  if (result.CvMin != null) metricsRows.push(["Cv @ Min Flow", `${result.CvMin} (opening ~${result.openingMin}%)`]);
  if (velocityDisplay != null) metricsRows.push(["Velocity", `${velocityDisplay} ${u.velocity}`]);
  if (result.mach != null) metricsRows.push(["Body Mach", `${result.mach} (guide < 0.3)`]);
  if (result.noise) metricsRows.push(["Noise Level", `≈${result.noise} dB (indicative — not IEC 60534-8-3)`]);
  if (result.sigma) metricsRows.push(["Sigma (σ)", String(result.sigma)]);
  if (result.Rev != null) metricsRows.push(["Valve Reynolds (Rev)", String(result.Rev)]);
  if (result.FR != null) metricsRows.push(["Viscosity Factor (FR)", String(result.FR)]);
  if (result.FF != null) metricsRows.push(["Liquid Critical Pressure Ratio Factor (FF)", String(result.FF)]);
  if (result.Fp != null) metricsRows.push(["Piping Geometry Factor (Fp)", String(result.Fp)]);
  if (result.dPmax != null) metricsRows.push(["Max Effective dP (choked)", result.dPmax + " bar"]);
  if (fluid === "liquid") metricsRows.push(["Flashing (P2 < Pv)", result.flashing ? "YES — flashing service" : "No"]);
  if (result.cavitationLevel && !result.flashing) metricsRows.push(["Cavitation Risk", result.cavitationLevel]);
  if (result.steamBasis) {
    metricsRows.push(["Steam Basis", result.steamBasis === "superheated"
      ? `Superheated (+${result.superheatC} °C above Tsat ${result.saturationTempC} °C)`
      : "Saturated steam (IEC steam form)"]);
  }
  // لت‌داون: بررسی ایستگاه (ISA RP75.23) بخشی از نتیجهٔ سایزینگ است، نه یادداشت
  const ld = result.letdown;
  if (ld) {
    if (ld.stages != null) {
      metricsRows.push(["Letdown reduction stages", ld.stagesRecommended != null && ld.stagesRecommended !== ld.stages
        ? `${ld.stages} (recommended ${ld.stagesRecommended})` : String(ld.stages)]);
    }
    if (ld.governingStage != null) metricsRows.push(["Governing stage", String(ld.governingStage)]);
    if (ld.outletTempC != null) metricsRows.push(["Letdown outlet temperature", `${ld.outletTempC} degC`]);
    if (ld.outletMach != null) {
      metricsRows.push(["Trim-exit Mach", `${ld.outletMach}${ld.pressureRatio != null ? ` (r ${ld.pressureRatio})` : ""} (guide < 0.5)`]);
    }
    if (ld.kineticEnergyKwM2 != null) {
      metricsRows.push(["Outlet kinetic energy", `${ld.kineticEnergyKwM2} kW/m2${ld.kineticEnergyRatio != null ? ` (${ld.kineticEnergyRatio}x of the 480 kW/m2 guideline)` : ""}`]);
    }
  }
  // سرچشمهٔ دادهٔ سایز انتخابی — دیتاشیت باید بگوید عدد کاتالوگ است یا برآورد
  if (catalogMatch) {
    const src = catalogMatch.source || "catalog";
    if (src === "estimated") {
      const err = Number.isFinite(catalogMatch.errorPct) ? Math.round(catalogMatch.errorPct) : 45;
      metricsRows.push(["Cv data source", `Engineering estimate (+/-${err}% back-test, confidence ${catalogMatch.confidence || "low"})`]);
      metricsRows.push(["Estimate caveat", "Not manufacturer data - fitted from the Cv scaling law of the measured series"]);
    } else {
      metricsRows.push(["Cv data source", src === "admin" ? "Admin draft table" : "Measured catalogue data"]);
    }
  }
  metricsRows.push(["Choked Flow", result.choked ? "Yes" : "No"]);
  if (result.capacityExceeded) {
    metricsRows.push(["Capacity Warning", "Required Cv exceeds the largest listed valve size"]);
  }

  y = drawKeyValueList(doc, y, margin, pageW - margin * 2, metricsRows);

  y += 8;

  // ============ 3. VALVE CHARACTERISTIC CHART ============
  if (y > pageH - 100) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "3. VALVE CHARACTERISTIC CHART");

  if (chartImage) {
    try {
      // Image dims: max width = pageW - 2*margin, keep aspect
      const maxW = pageW - margin * 2;
      const imgW = maxW;
      const imgH = imgW * 0.55; // approx aspect of the chart

      // Check if fits, else new page
      if (y + imgH > pageH - 30) {
        doc.addPage();
        y = 20;
      }

      doc.addImage(chartImage, "PNG", margin, y, imgW, imgH, undefined, "FAST");
      y += imgH + 6;
    } catch (e) {
      console.error("Chart image insert failed:", e);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Chart image unavailable", margin, y + 5);
      y += 12;
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Chart image unavailable", margin, y + 5);
    y += 12;
  }

  y += 4;

  // ============ 4. SUGGESTED VALVE SIZES (3 candidates) ============
  if (y > pageH - 100) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "4. SUGGESTED VALVE SIZES");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Three candidate sizes around your operating point:", margin, y + 4);
  y += 10;

  if (candidates && candidates.length > 0) {
    y = drawCandidatesGrid(doc, y, margin, pageW - margin * 2, candidates);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("No candidates available", margin, y + 5);
    y += 12;
  }

  y += 6;

  // ============ 5. ENGINEERING RECOMMENDATIONS ============
  if (y > pageH - 80) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "5. ENGINEERING RECOMMENDATIONS");

  const tips = [];
  if (result.openingPercent >= 20 && result.openingPercent <= 80) {
    tips.push("Opening is within optimal range (20%–80%) — best balance of control and efficiency.");
  } else if (result.openingPercent < 20) {
    tips.push("Opening is LOW — consider a smaller valve size.");
  } else {
    tips.push("Opening is HIGH — consider a larger valve size.");
  }

  if (result.size && result.Cv) {
    const headroom = Math.round(((result.size.cv - result.Cv) / result.Cv) * 100);
    if (headroom > 0) {
      tips.push(`Can handle up to ${headroom}% additional flow at the same size.`);
    }
  }

  if (velocityExceedsGuide({ fluidType: result.fluidType || result.fluid, velocity: result.velocity, mach: result.mach })) {
    tips.push(`Velocity ${result.velocity} m/s${result.mach != null ? ` (Ma ${result.mach})` : ""} exceeds the sizing guideline — may cause erosion or noise; consider a larger size or multi-stage trim.`);
  }
  if (result.noise > 85) {
    tips.push(`Noise ≈${result.noise} dB (indicative estimate) — consider noise-reduction trim.`);
  }
  if (result.choked) {
    tips.push("Choked flow detected — larger size or reduced ΔP required.");
  }
  if (result.flashing) {
    tips.push("Flashing service: outlet pressure is below vapour pressure (P2 < Pv) — use flashing trim and hardened materials.");
  }
  if (result.Rev != null && result.Rev < 10000) {
    tips.push(`Laminar/transition flow (Rev ≈ ${result.Rev}, FR ≈ ${result.FR}) — Cv corrected for viscosity; verify with vendor.`);
  }
  if (result.steamBasis === "superheated") {
    tips.push(`Superheated steam: Cv density-corrected by ×${result.steamCorrection} vs saturated basis (Tsat ≈ ${result.saturationTempC} °C).`);
  }

  const recChar = result.recommendedCharacteristic || "equal";
  const recCharName = recChar === "equal" ? "Equal Percentage"
    : recChar === "linear" ? "Linear"
    : "Quick Opening";
  tips.push(`Recommended valve characteristic: ${recCharName}.`);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  tips.forEach(tip => {
    if (y > pageH - 30) {
      doc.addPage();
      y = 20;
    }
    const lines = doc.splitTextToSize("•  " + tip, pageW - margin * 2 - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 5 + 2;
  });

  y += 4;

  // ============ 6. MATERIAL SELECTION ============
  if (y > pageH - 60) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "6. MATERIAL SELECTION — ENGINEERING REVIEW REQUIRED");

  const materialNotice = "The available inputs are insufficient to recommend valve body, trim, or seal materials. Confirm material compatibility using process chemistry, corrosion data, pressure class, temperature, and manufacturer guidance.";
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const materialLines = doc.splitTextToSize(materialNotice, pageW - margin * 2 - 10);
  const materialNoticeHeight = Math.max(22, materialLines.length * 4 + 10);
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(margin, y, pageW - margin * 2, materialNoticeHeight, 3, 3, "F");
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, pageW - margin * 2, materialNoticeHeight, 3, 3, "S");
  doc.setTextColor(124, 45, 18);
  doc.text(materialLines, margin + 5, y + 8);

  // ============================================================
  // WATERMARK + FOOTER ON ALL PAGES
  // ============================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    addWatermark(doc);

    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 15, pageW, 15, "F");
    doc.setFillColor(224, 168, 26);
    doc.rect(0, pageH - 15, pageW, 0.8, "F");

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Petro Sazeh Mihan — PSM Valve", margin, pageH - 9);
    doc.text("www.psmvalve.com", margin, pageH - 5);

    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 9, { align: "right" });
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      "Preliminary estimate only. Verify calculations and materials with engineering before procurement.",
      pageW - margin,
      pageH - 5,
      { align: "right" }
    );
  }

  const fileName = `PSM-Sizing-Report-${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
}

// ============================================================
// SERVICE DATASHEET — PSV (API 520 / API 526) و ایستگاه دسوپرهیتر
// خروجی انگلیسی است (مثل گزارش شیر کنترل) و اعداد از نسخهٔ SI موتور
// گرفته میشوند تا واحد هیچ‌وقت دو بار تبدیل نشود.
// ============================================================
async function generateServicePDF({ result, formSI, fluid, selectedFluidName }) {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const isPsv = result.mode === "psv";
  const isTp = result.mode === "twoPhase";
  const fs = Object.assign({}, formSI || {}, result.formSI || {});
  const orifice = result.requiredOrifice || {};
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : (d == null ? "—" : d));
  const pct = (v, digits) => (Number.isFinite(Number(v)) ? (Number(v) * 100).toFixed(digits == null ? 1 : digits) + " %" : "—");

  // ============ HEADER ============
  doc.setFillColor(15, 17, 20);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setFillColor(224, 168, 26);
  doc.rect(0, 36, pageW, 1.5, "F");
  doc.setFillColor(224, 168, 26);
  doc.roundedRect(margin, 8, 20, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PSM", margin + 10, 21, { align: "center" });
  doc.setFontSize(14);
  doc.text("PSM VALVE", margin + 26, 15);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Petro Sazeh Mihan — PSM Valve", margin + 26, 21);
  doc.text("www.psmvalve.com", margin + 26, 26);
  doc.setTextColor(224, 168, 26);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text(isPsv ? "PRESSURE RELIEF VALVE SIZING REPORT"
    : isTp ? "TWO-PHASE FLASHING VALVE SIZING REPORT"
      : "DESUPERHEATER STATION REPORT",
    pageW - margin, 15, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(isPsv ? "API RP 520 Part I / API 526 — preliminary, not ASME-certified"
    : isTp ? "Leung omega / HEM / HNE — preliminary, not an IEC 60534 two-phase validation"
      : "Adiabatic mixing basis — preliminary, nozzle and trim to be confirmed by the vendor", pageW - margin, 21, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, pageW - margin, 26, { align: "right" });
  doc.text(`Report No: PSM-${isPsv ? "PSV" : isTp ? "TPV" : "DSH"}-${Date.now().toString().slice(-8)}`, pageW - margin, 31, { align: "right" });

  let y = 48;

  // ============ HERO ============
  const MODEL_NAME_EN = { omega: "omega (Leung)", hem: "HEM", hne: "HNE", additive: "additive (crude)" };
  const tpName = (m) => MODEL_NAME_EN[m] || String(m || "—");
  const hero = isPsv
    ? [
      { label: "API 526 ORIFICE", value: String(orifice.letter || "—"), sub: (orifice.designations || []).join(" / ") + (orifice.dn ? "  ·  " + orifice.dn.inlet + " x " + orifice.dn.outlet : "") },
      { label: "REQUIRED AREA", value: n(result.areaCm2) + " cm2", sub: n(result.areaMm2) + " mm2  ·  " + n(result.areaIn2) + " in2" },
      { label: "ORIFICE CAPACITY", value: n(result.capacityKgH) + " kg/h", sub: "orifice utilisation " + pct(result.utilisation) }
    ]
    : isTp ? [
      { label: "REQUIRED Cv (" + tpName(result.model) + ")", value: n(result.Cv), sub: "Kv " + n(result.Kv) + "  ·  area " + n(result.areaMm2) + " mm2" },
      { label: "VALVE SIZE", value: String((result.size && result.size.size) || "—"), sub: ((result.size && result.size.dn) || "—") + "  ·  opening " + n(result.openingPercent) + " %" },
      { label: "THROAT MASS FLUX", value: n(result.massFlux) + " kg/m2.s", sub: "throat " + n(result.throatPressureBar) + " bar  ·  eta_c " + n(result.criticalPressureRatio) }
    ]
      : [
      { label: "SPRAY WATER FLOW", value: n(result.waterFlowKgH) + " kg/h", sub: n(result.waterFlowLMin) + " L/min" },
      { label: "WATER / STEAM RATIO", value: pct(result.waterToSteamRatio), sub: `duty ${n(result.dutyKW)} kW` },
      { label: "INJECTION VALVE Cv", value: n(result.waterCv), sub: result.waterValveSize ? "smallest body DN" + result.waterValveSize : "not sized" }
    ];
  const boxW = (pageW - margin * 2 - 8) / 3;
  hero.forEach((h, i) => {
    const x = margin + i * (boxW + 4);
    doc.setFillColor(i === 0 ? 224 : 248, i === 0 ? 168 : 249, i === 0 ? 26 : 250);
    doc.roundedRect(x, y, boxW, 30, 4, 4, "F");
    doc.setTextColor(...(i === 0 ? [255, 255, 255] : [120, 120, 120]));
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(pdfAscii(h.label), x + boxW / 2, y + 8, { align: "center" });
    doc.setTextColor(...(i === 0 ? [255, 255, 255] : [184, 133, 10]));
    doc.setFontSize(i === 0 ? 18 : 15);
    doc.text(pdfAscii(h.value), x + boxW / 2, y + 19, { align: "center" });
    doc.setTextColor(...(i === 0 ? [255, 255, 255] : [120, 120, 120]));
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(pdfAscii(String(h.sub).slice(0, 44)), x + boxW / 2, y + 26, { align: "center" });
  });
  y += 38;

  // ============ 1. INPUT PARAMETERS ============
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "1. INPUT PARAMETERS");
  const inputs = [["Parameter", "Value", "Unit"], ["Fluid", (selectedFluidName || fluid || "—").toUpperCase(), "—"]];
  if (isPsv) {
    if (fluid === "liquid") inputs.push(["Relief flow (liquid)", n(fs.Q), "m3/h"]);
    else inputs.push(["Relief load W", n(fs.W), "kg/h"]);
    if (fs.setP != null) inputs.push(["Set pressure (gauge)", n(fs.setP), "bar g"]);
    inputs.push(["Allowable overpressure", n(fs.overpressurePct, 10), "%"]);
    inputs.push(["Relieving pressure P1", n(result.P1RelievingBar), "bar abs"]);
    inputs.push(["Backpressure P2", n(result.P2Bar), "bar abs"]);
    if (fluid === "liquid") {
      inputs.push(["Relative density G", n(fs.Gf), "—"]);
    } else {
      if (fluid === "steam") {
        inputs.push(["Steam basis", "M = 18.015, k = 1.31", "engine default"]);
      } else {
        inputs.push(["Molar mass M", n(fs.MW), "kg/kmol"]);
        inputs.push(["Isentropic exponent k", n(fs.k), "—"]);
        inputs.push(["Compressibility Z", n(fs.Z, 1), "—"]);
      }
      inputs.push(["Relieving temperature T", n(fs.T), "degC"]);
    }
    if (fs.inletLossPct != null) inputs.push(["Inlet non-recoverable loss", n(fs.inletLossPct), "% of set"]);
    inputs.push(["Valve type", fs.balanced ? "Balanced bellows" : "Conventional spring", "—"]);
  } else if (isTp) {
    const gfTp = Number(fs.Gf);
    inputs.push(["Total mass flow W", n(fs.W), "kg/h"]);
    inputs.push(["Inlet vapour mass fraction x", n(fs.qualityPct, 0), "%"]);
    inputs.push(["Inlet pressure P1", n(fs.P1), "bar abs"]);
    inputs.push(["Outlet pressure P2", n(fs.P2), "bar abs"]);
    inputs.push(["Pressure drop dP", +((Number(fs.P1) || 0) - (Number(fs.P2) || 0)).toFixed(3), "bar"]);
    inputs.push(["Liquid density rhoL", Number.isFinite(gfTp) && gfTp > 0 ? +(gfTp * 999).toFixed(1) : "—", "kg/m3"]);
    inputs.push(["Vapour density rhoG", n(result.vapourDensityKgM3), "kg/m3"]);
    inputs.push(["Vapour density source", pdfAscii(result.vapourSource || "—"), "—"]);
    inputs.push(["Vapour pressure Pv", n(fs.Pv), "bar abs"]);
    if (fs.Pc != null) inputs.push(["Critical pressure Pc", n(fs.Pc), "bar abs"]);
    inputs.push(["Inlet temperature T", n(fs.T), "degC"]);
    inputs.push(["Molar mass M", fs.MW == null ? "empty (steam table)" : n(fs.MW), fs.MW == null ? "—" : "kg/kmol"]);
    if (fs.k != null) inputs.push(["Isentropic exponent k", n(fs.k), "—"]);
    if (fs.Z != null) inputs.push(["Compressibility Z", n(fs.Z), "—"]);
    if (fs.N != null) inputs.push(["Non-equilibrium factor N", n(fs.N), "—"]);
    // مقدار واقعی استفاده‌شده در موتور؛ خالی بودن فیلد یعنی پیش‌فرض موتور (Kd = ۱)
    inputs.push(["Discharge coefficient Kd", `${n(result.Kd != null ? result.Kd : fs.tpKd, 1)}${fs.tpKd == null ? " (engine default)" : ""}`, "—"]);
    inputs.push(["FL / xT (single-phase refs)", `${n(fs.FL, "—")} / ${n(fs.xT, "—")}`, "—"]);
    inputs.push(["Two-phase model", tpName(result.model), "—"]);
  } else {
    inputs.push(["Steam flow", n(fs.W), "kg/h"]);
    inputs.push(["Station pressure P1", n(fs.P1), "bar abs"]);
    inputs.push(["Inlet steam temperature", n(fs.T), "degC"]);
    inputs.push(["Target outlet temperature", n(fs.T2), "degC"]);
    inputs.push(["Water supply pressure", n(fs.waterP), "bar abs"]);
    inputs.push(["Water temperature", n(fs.waterT, 25), "degC"]);
    if (fs.supplyP != null) inputs.push(["Steam supply (upstream) pressure", n(fs.supplyP), "bar abs"]);
    if (fs.dvP != null) inputs.push(["Nozzle (atomising) dP", n(fs.dvP), "bar"]);
  }
  y = drawTable(doc, y, margin, inputs);
  y += 6;

  // ============ 2. CALCULATED RESULTS ============
  if (y > pageH - 110) { doc.addPage(); y = 20; }
  y = sectionHeader(doc, y, margin, pageW - margin * 2, "2. CALCULATED RESULTS");
  const metrics = [];
  if (isPsv) {
    metrics.push(["Equation used", result.equation || "—"]);
    metrics.push(["Flow regime", `${result.flowRegime || "—"} · critical ratio ${n(result.criticalRatio)}`]);
    metrics.push(["Backpressure ratio P2/P1", n(result.backpressureRatio)]);
    metrics.push(["Kd / Kb / Kc", `${n(result.Kd)} / ${n(result.Kb)} / ${n(result.Kc)}`]);
    if (result.C != null) metrics.push(["Capacity coefficient C", n(result.C)]);
    if (result.F2 != null) metrics.push(["Subcritical factor F2", n(result.F2)]);
    metrics.push(["Selected orifice", `${orifice.letter || "—"} — ${n(orifice.areaCm2)} cm2 (${n(orifice.areaMm2)} mm2)`]);
    metrics.push(["Orifice capacity", `${n(result.capacityKgH)} kg/h`]);
    metrics.push(["Area utilisation", pct(result.utilisation)]);
    metrics.push(["Equivalent Cv / Kv (cross-check)", `${n(result.equivalentCv)} / ${n(result.equivalentKv)}`]);
  } else if (isTp) {
    const no = (v) => (v == null ? "not computed" : v);
    metrics.push(["Required Cv / Kv", `${n(result.Cv)} / ${n(result.Kv)}`]);
    metrics.push(["Effective flow area", `${n(result.areaMm2)} mm2 (${n(result.Cv)} Cv x 0.441 cm2/Cv)`]);
    metrics.push(["Valve size / opening", `${(result.size && result.size.size) || "—"} · ${n(result.openingPercent)} %`]);
    if (result.capacityExceeded) metrics.push(["Capacity limit", "above the largest listed trim — engineering review required"]);
    metrics.push(["Throat mass flux G", `${n(result.massFlux)} kg/(m2.s)`]);
    metrics.push(["omega parameter", result.omega == null ? `n/a for ${tpName(result.model)}` : n(result.omega)]);
    metrics.push(["Throat pressure / eta_c", `${n(result.throatPressureBar)} bar / ${n(result.criticalPressureRatio)}`]);
    metrics.push(["Flow regime", result.choked ? "choked (critical) at the throat" : "not choked — outlet pressure governs"]);
    metrics.push(["Flash onset pressure", `${n(result.saturationPressureBar)} bar`]);
    metrics.push(["Outlet quality x2", result.outletQuality == null ? "not computed (property range)" : pct(result.outletQuality)]);
    metrics.push(["Outlet temperature", result.outletTempC == null ? "not computed (property range)" : `${n(result.outletTempC)} degC`]);
    metrics.push(["Mixture density in / out", `${no(result.inletDensity)} / ${no(result.outletDensity)} kg/m3`]);
    metrics.push(["Volumetric flow at conditions", `${n(result.qActualM3h)} m3/h`]);
    metrics.push(["Outlet mixture velocity", result.outletVelocityMps == null ? "not computed (property range)" : `${n(result.outletVelocityMps)} m/s`]);
    metrics.push(["Throat residence time", no(result.residenceTimeMs) + (result.residenceTimeMs == null ? "" : " ms")]);
    metrics.push(["Property source", `${result.propertySource === "iapws-if97" ? "IAPWS-IF97 steam table" : "Clausius-Clapeyron (anchored at Pv)"}`]);
    if (result.twoPhase && result.twoPhase.minCv != null) {
      metrics.push(["Cv spread of the models", `${result.twoPhase.minCv} … ${result.twoPhase.maxCv} (${(result.twoPhase.maxCv / result.twoPhase.minCv).toFixed(2)}x)`]);
    }
  } else {
    metrics.push(["Saturation temperature at P1", `${n(result.saturationTempC)} degC`]);
    metrics.push(["Inlet superheat", `+${n(result.superheatInC)} K`]);
    metrics.push(["Outlet superheat", `+${n(result.superheatOutC)} K`]);
    metrics.push(["Superheat removed", `${n(result.superheatRemovedC)} K`]);
    metrics.push(["Saturation margin", `${n(result.saturationMarginC)} K`]);
    metrics.push(["Thermal duty", `${n(result.dutyKW)} kW`]);
    metrics.push(["Spray water", `${n(result.waterFlowKgH)} kg/h = ${n(result.waterFlowLMin)} L/min`]);
    metrics.push(["Water-to-steam ratio", `${(n(result.waterToSteamRatio) * 100).toFixed(2)} %`]);
    metrics.push(["Atomising dP (guideline)", `${n(result.atomizingDPBar)} bar`]);
    metrics.push(["Water valve dP", `${n(result.waterValveDPBar)} bar`]);
    if (result.waterCv != null) metrics.push(["Injection valve Cv / Kv", `${n(result.waterCv)} / ${n(result.waterKv)}`]);
    if (result.steamCv != null) metrics.push(["Steam supply valve Cv", n(result.steamCv)]);
  }
  y = drawKeyValueList(doc, y, margin, pageW - margin * 2, metrics);
  y += 8;

  let sec = 2;
  // ============ 3. MODEL COMPARISON (دو‌فازی) ============
  const modelRows = (result.twoPhase && result.twoPhase.rows) || [];
  if (isTp && modelRows.length > 0) {
    if (y > pageH - 80) { doc.addPage(); y = 20; }
    sec += 1;
    y = sectionHeader(doc, y, margin, pageW - margin * 2, `${sec}. TWO-PHASE MODEL COMPARISON`);
    y = drawModelComparisonTable(doc, y, margin, modelRows, result.model);
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const spreadNote = doc.splitTextToSize(
      "Two-phase sizing is genuinely uncertain: the models disagree because flashing capacity depends on vapour-generation"
      + " lag, geometry and slip, none of which a single correlation captures. State the selected model in the order and"
      + " confirm the trim with the valve manufacturer.", pageW - margin * 2);
    doc.text(spreadNote, margin, y + 1);
    y += spreadNote.length * 3.8 + 6;
  }

  // ============ WARNINGS ============
  const warns = result.warnings || [];
  if (warns.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = 20; }
    sec += 1;
    y = sectionHeader(doc, y, margin, pageW - margin * 2, `${sec}. ENGINEERING WARNINGS`);
    warns.forEach((w) => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      const color = w.type === "danger" ? [232, 17, 35] : w.type === "warning" ? [245, 158, 11] : [120, 120, 120];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(pdfAscii(`${w.type === "danger" ? "!!" : w.type === "warning" ? "!" : "i"}  ${w.engineText || w.text || w.key}`), pageW - margin * 2 - 4);
      doc.text(lines, margin + 2, y + 4);
      y += lines.length * 4.4 + 2.5;
    });
    y += 3;
  }

  // ============ ENGINE NOTES ============
  // موتور دو‌فازی یادداشت‌ها را فارسی می‌سازد؛ برای چاپ از نسخهٔ انگلیسی استفاده می‌شود
  const notes = (isTp ? result.notesEn : result.notes) || [];
  if (notes.length > 0) {
    if (y > pageH - 55) { doc.addPage(); y = 20; }
    sec += 1;
    y = sectionHeader(doc, y, margin, pageW - margin * 2, `${sec}. ASSUMPTIONS / ENGINE NOTES`);
    notes.forEach((note) => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(pdfAscii("-  " + note), pageW - margin * 2 - 4);
      doc.text(lines, margin + 2, y + 4);
      y += lines.length * 4.4 + 2.5;
    });
  }

  // ============ FOOTER ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 15, pageW, 15, "F");
    doc.setFillColor(224, 168, 26);
    doc.rect(0, pageH - 15, pageW, 0.8, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Petro Sazeh Mihan — PSM Valve", margin, pageH - 9);
    doc.text("www.psmvalve.com", margin, pageH - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 9, { align: "right" });
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      isPsv
        ? "Preliminary API 520 form only. Final selection must use the ASME-certified stamped capacity and the manufacturer Kd/Kb curves."
        : isTp
          ? "Preliminary two-phase estimate (homogeneous, no-slip). Not an IEC 60534 validation: flashing/erosion trim, outlet velocity and vendor capacity curves govern the final selection."
          : "Preliminary adiabatic-mixing estimate. Spray nozzle, atomising dP and trim must be confirmed by the desuperheater vendor.",
      pageW - margin,
      pageH - 5,
      { align: "right" }
    );
  }

  const fileName = `PSM-${isPsv ? "PSV" : isTp ? "TwoPhase" : "Desuperheater"}-Report-${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
}

// جدول مقایسهٔ مدل‌ها — پنج ستون (drawTable سه‌ستونه است)
function drawModelComparisonTable(doc, y, margin, rows, selectedModel) {
  const pageW = 210;
  const tableW = pageW - margin * 2;
  const weights = [0.22, 0.16, 0.16, 0.16, 0.30];
  const cols = ["Model", "Cv", "Ratio to omega", "Size", "Regime"];
  const rowH = 7;
  const xAt = (idx) => margin + weights.slice(0, idx).reduce((a, b) => a + b * tableW, 0);

  cols.forEach((title, idx) => {
    doc.setFillColor(224, 168, 26);
    doc.rect(xAt(idx), y, weights[idx] * tableW, rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, xAt(idx) + 2, y + 5);
  });
  y += rowH;

  rows.forEach((row, idx) => {
    const shade = idx % 2 === 0 ? 252 : 246;
    const isSel = row.model === selectedModel;
    weights.forEach((wgt, c) => {
      doc.setFillColor(isSel ? 255 : shade, isSel ? 251 : shade, isSel ? 240 : shade);
      doc.rect(xAt(c), y, wgt * tableW, rowH, "F");
    });
    const values = [
      row.model === "omega" ? "omega (Leung)" : row.model === "additive" ? "additive (crude)" : String(row.model).toUpperCase(),
      row.error ? "not computed" : String(row.Cv),
      row.error ? "—" : (row.ratioVsOmega != null ? row.ratioVsOmega + "x" : "—"),
      row.error ? "—" : (row.size || "—"),
      row.error ? pdfAscii(row.error).slice(0, 40) : (row.choked ? "choked" : "not choked")
    ];
    doc.setFontSize(8);
    doc.setFont("helvetica", isSel ? "bold" : "normal");
    values.forEach((v, c) => {
      doc.setTextColor(c === 0 && isSel ? 184 : 30, c === 0 && isSel ? 133 : 30, c === 0 && isSel ? 10 : 30);
      doc.text(pdfAscii(v), xAt(c) + 2, y + 5);
    });
    y += rowH;
  });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.rect(margin, y - rows.length * rowH - rowH, tableW, (rows.length + 1) * rowH);
  return y + 2;
}

// ============================================================
// HELPERS
// ============================================================
function sectionHeader(doc, y, x, width, title) {
  doc.setFillColor(15, 17, 20);
  doc.roundedRect(x, y, width, 8, 2, 2, "F");
  doc.setFillColor(224, 168, 26);
  doc.rect(x, y, 2.5, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), x + 6, y + 5.5);
  return y + 12;
}

function drawTable(doc, y, margin, rows) {
  const pageW = 210;
  const tableW = pageW - margin * 2;
  const colW = [tableW * 0.50, tableW * 0.30, tableW * 0.20];
  const rowH = 7;

  rows.forEach((row, idx) => {
    const isHeader = idx === 0;

    if (isHeader) {
      doc.setFillColor(224, 168, 26);
      doc.rect(margin, y, tableW, rowH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
    } else {
      const shade = idx % 2 === 0 ? 245 : 252;
      doc.setFillColor(shade, shade, shade);
      doc.rect(margin, y, tableW, rowH, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
    }

    doc.text(pdfAscii(row[0]), margin + 3, y + 5);
    doc.text(pdfAscii(row[1]), margin + colW[0] + 3, y + 5);
    doc.text(pdfAscii(row[2]), margin + colW[0] + colW[1] + 3, y + 5);

    y += rowH;
  });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.rect(margin, y - rows.length * rowH, tableW, rows.length * rowH);

  return y;
}

function drawKeyValueList(doc, y, margin, width, rows) {
  const rowH = 7;
  const half = Math.ceil(rows.length / 2);
  const colW = width / 2;
  const startY = y;

  rows.forEach((row, i) => {
    const col = i < half ? 0 : 1;
    const rowIdx = i < half ? i : i - half;
    const x = margin + col * colW;
    const rowY = startY + rowIdx * rowH;

    const shade = rowIdx % 2 === 0 ? 248 : 255;
    doc.setFillColor(shade, shade, shade);
    doc.rect(x, rowY, colW, rowH, "F");

    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(pdfAscii(row[0]), x + 3, rowY + 5);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(pdfAscii(row[1]), x + colW - 3, rowY + 5, { align: "right" });
  });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.rect(margin, startY, width, half * rowH);

  return startY + half * rowH;
}

// ============================================================
// 3 candidate sizes — box grid
// ============================================================
function drawCandidatesGrid(doc, y, margin, width, candidates) {
  const n = candidates.length;
  const gap = 4;
  const boxW = (width - gap * (n - 1)) / n;
  const boxH = 46;
  const startY = y;

  candidates.forEach((c, i) => {
    const x = margin + i * (boxW + gap);

    const isRec = c.isRecommended;

    // Box background
    if (isRec) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(224, 168, 26);
      doc.setLineWidth(0.8);
    } else {
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, startY, boxW, boxH, 3, 3, "F");
    doc.roundedRect(x, startY, boxW, boxH, 3, 3, "S");

    // Top gold strip for recommended
    if (isRec) {
      doc.setFillColor(224, 168, 26);
      doc.rect(x, startY, boxW, 1.5, "F");
    }

    // Size title
    doc.setTextColor(isRec ? 184 : 30, isRec ? 133 : 30, isRec ? 10 : 30);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(String(c.size.size), x + boxW / 2, startY + 11, { align: "center" });

    // DN
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(String(c.size.dn), x + boxW / 2, startY + 16, { align: "center" });

    // Divider
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(x + 4, startY + 19, x + boxW - 4, startY + 19);

    // Cv
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("Cv", x + 4, startY + 25);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(c.size.cv), x + boxW - 4, startY + 25, { align: "right" });

    // Opening
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Opening", x + 4, startY + 31);

    let oColor = [16, 185, 129];
    if (c.opening < 20 || c.opening > 80) oColor = [245, 158, 11];
    if (c.opening < 10 || c.opening > 100) oColor = [232, 17, 35];
    doc.setTextColor(oColor[0], oColor[1], oColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${c.opening}%`, x + boxW - 4, startY + 31, { align: "right" });

    // Verdict pill
    const verdictText = String(c.verdict).slice(0, 14);
    const vW = boxW - 8;
    doc.setFillColor(oColor[0], oColor[1], oColor[2]);
    doc.roundedRect(x + 4, startY + 35, vW, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(verdictText, x + boxW / 2, startY + 39.7, { align: "center" });

    // Recommended star
    if (isRec) {
      doc.setTextColor(224, 168, 26);
      doc.setFontSize(10);
      doc.text("★", x + 4, startY + 8);
    }
  });

  return startY + boxH + 4;
}