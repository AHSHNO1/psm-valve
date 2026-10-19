"use client";
import { velocityFromSI } from "@/lib/unit-system";

// ============================================================
// PROFESSIONAL PDF DATASHEET — PSM Valve (English Only)
// With chart image + 3 candidate sizes + watermark
// ============================================================
export async function generateSizingPDF({
  result, form, fluid, locale = "fa",
  selectedFluidName, candidates, chartImage,
  units = null, mw = null
}) {
  if (!result || result.error) return;

  // واحدهای نمایشی (در نبود آنها SI)
  const u = Object.assign(
    {
      flow: fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m³/h" : "Nm³/h"),
      pressure: "bar",
      temp: "°C",
      velocity: "m/s"
    },
    units || {}
  );
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
    ["Inlet Pressure (P1)", form.P1, u.pressure],
    ["Outlet Pressure (P2)", form.P2, u.pressure],
    ["Pressure Drop (ΔP)", (form.P1 - form.P2).toFixed(2), u.pressure]
  ];
  if (fluid === "liquid") {
    inputsTable.push(["Liquid SG (Gf)", form.Gf, "—"]);
    inputsTable.push(["Vapor Pressure (Pv)", form.Pv, u.pressure]);
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
  if (velocityDisplay != null) metricsRows.push(["Velocity", `${velocityDisplay} ${u.velocity}`]);
  if (result.noise) metricsRows.push(["Noise Level", `${result.noise} dB`]);
  if (result.sigma) metricsRows.push(["Sigma (σ)", String(result.sigma)]);
  if (result.cavitationRisk) metricsRows.push(["Cavitation Risk", result.cavitationRisk]);
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

  if (result.velocity > 5) {
    tips.push(`Velocity ${result.velocity} m/s — may cause erosion. Consider larger size.`);
  }
  if (result.noise > 85) {
    tips.push(`Noise ${result.noise} dB — use noise-reduction trim.`);
  }
  if (result.choked) {
    tips.push("Choked flow detected — larger size or reduced ΔP required.");
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

    doc.text(String(row[0]), margin + 3, y + 5);
    doc.text(String(row[1]), margin + colW[0] + 3, y + 5);
    doc.text(String(row[2]), margin + colW[0] + colW[1] + 3, y + 5);

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
    doc.text(String(row[0]), x + 3, rowY + 5);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(row[1]), x + colW - 3, rowY + 5, { align: "right" });
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