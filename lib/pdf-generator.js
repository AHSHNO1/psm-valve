// Generate professional PDF with watermark

export async function generatePDF(options) {
  const { element, filename, locale } = options;
  if (typeof window === "undefined") return;

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "A4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // ============ WATERMARK FUNCTION ============
  function addWatermark(doc) {
    // Use a temporary canvas to make a rotated watermark image
    const wmCanvas = document.createElement("canvas");
    const wmCtx = wmCanvas.getContext("2d");
    wmCanvas.width = 1200;
    wmCanvas.height = 900;

    // transparent background
    wmCtx.clearRect(0, 0, 1200, 900);

    // Draw watermark text diagonally
    wmCtx.save();
    wmCtx.translate(600, 450);
    wmCtx.rotate(-Math.PI / 6); // -30 degrees

    wmCtx.font = "bold 64px Arial, Helvetica, sans-serif";
    wmCtx.fillStyle = "rgba(201, 149, 13, 0.10)"; // very light gold
    wmCtx.textAlign = "center";
    wmCtx.textBaseline = "middle";

    wmCtx.fillText("PETRO SAZEH MIHAN", 0, -40);
    wmCtx.font = "bold 44px Arial, Helvetica, sans-serif";
    wmCtx.fillStyle = "rgba(201, 149, 13, 0.08)";
    wmCtx.fillText("IT DEPARTMENT", 0, 40);

    wmCtx.restore();

    // Second diagonal watermark (opposite direction, lower)
    wmCtx.save();
    wmCtx.translate(600, 450);
    wmCtx.rotate(Math.PI / 6); // +30 degrees
    wmCtx.font = "bold 40px Arial, Helvetica, sans-serif";
    wmCtx.fillStyle = "rgba(150, 150, 150, 0.06)";
    wmCtx.textAlign = "center";
    wmCtx.textBaseline = "middle";
    wmCtx.fillText("www.psmvalve.com", 0, 0);
    wmCtx.restore();

    const wmData = wmCanvas.toDataURL("image/png");
    const wmWidth = pageWidth;
    const wmHeight = (wmCanvas.height * wmWidth) / wmCanvas.width;
    const wmY = (pageHeight - wmHeight) / 2;

    doc.addImage(wmData, "PNG", 0, wmY, wmWidth, wmHeight, "wm", "NONE", 0);

    // Small centered logo overlay
    doc.setTextColor(201, 149, 13);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PSM VALVE", pageWidth / 2, pageHeight / 2 + 3, { align: "center" });
  }

  // Add watermark to page 1
  addWatermark(pdf);

  // ============ HEADER BAR ============
  function addHeader(doc) {
    doc.setFillColor(201, 149, 13);
    doc.rect(0, 0, pageWidth, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PSM VALVE", margin, 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Petro Sazeh Mihan", margin, 16);

    const dateStr = new Date().toLocaleDateString("en-GB");
    doc.text(dateStr, pageWidth - margin - 30, 10);
    doc.text("Valve Sizing Report", pageWidth - margin - 30, 16);
  }

  addHeader(pdf);

  // ============ BODY IMAGE ============
  const startY = 28;
  const availableHeight = pageHeight - startY - 20;

  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, "PNG", margin, startY, contentWidth, imgHeight);
  } else {
    // Multi-page
    let remaining = imgHeight;
    let positionPx = 0;
    let currentY = startY;
    let firstPage = true;

    while (remaining > 0) {
      const chunkMM = Math.min(remaining, availableHeight);
      const chunkPx = (chunkMM * canvas.width) / contentWidth;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = chunkPx;
      const pageCtx = pageCanvas.getContext("2d");
      pageCtx.drawImage(
        canvas,
        0, positionPx, canvas.width, chunkPx,
        0, 0, canvas.width, chunkPx
      );

      const pageImgData = pageCanvas.toDataURL("image/png");

      if (!firstPage) {
        pdf.addPage();
        addWatermark(pdf);
        addHeader(pdf);
      }

      pdf.addImage(pageImgData, "PNG", margin, currentY, contentWidth, chunkMM);

      positionPx += chunkPx;
      remaining -= chunkMM;
      currentY = margin;
      firstPage = false;
    }
  }

  // ============ FOOTER ============
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "www.psmvalve.com  |  info@psmvalve.com  |  Arak, Iran  |  IT Department",
      pageWidth / 2, pageHeight - 10, { align: "center" }
    );
    pdf.text(
      "Page " + i + " / " + totalPages,
      pageWidth - margin, pageHeight - 10, { align: "right" }
    );
  }

  pdf.save(filename || "PSM-Sizing-Report.pdf");
}

export async function generateCSV(options) {
  const { result, form, fluid } = options;
  if (typeof window === "undefined") return;

  const rows = [
    ["PSM VALVE — Petro Sazeh Mihan"],
    ["IT Department"],
    [""],
    ["Parameter", "Value", "Unit"],
    ["Fluid Type", fluid, ""],
    ["Flow Rate (Q)", form.Q, fluid === "steam" ? "kg/h" : (fluid === "liquid" ? "m3/h" : "Nm3/h")],
    ["Relative Density", fluid === "liquid" ? form.Gf : form.Gg, ""],
    ["Inlet Pressure P1", form.P1, "bar"],
    ["Outlet Pressure P2", form.P2, "bar"],
    ["Vapor Pressure Pv", form.Pv || "-", "bar"],
    ["Temperature T", form.T || "-", "C"],
    [""],
    ["RESULTS"],
    ["Cv Coefficient", result.Cv, ""],
    ["Kv Coefficient", result.Kv, ""],
    ["Valve Size", result.size.size, ""],
    ["DN", result.size.dn, ""],
    ["NPS", result.size.nps, ""],
    ["Opening %", result.openingPercent + "%", ""],
    ["Velocity", result.velocity || "-", "m/s"],
    ["Noise", result.noise || "-", "dB"],
    ["Cavitation Risk", result.cavitationRisk || "-", ""],
    ["Choked Flow", result.choked ? "Yes" : "No", ""],
    [""],
    ["Generated by PSM Valve Sizing Tool"],
    ["www.psmvalve.com"]
  ];

  const csv = rows.map(function(r) {
    return r.map(function(c) {
      const s = String(c == null ? "" : c);
      if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(",");
  }).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "PSM-Sizing-Report-" + Date.now() + ".csv";
  link.click();
  URL.revokeObjectURL(url);
}
