"use client";

// ============================================================
// LIGHTWEIGHT ANALYTICS WRAPPER
// Supports: Google Analytics (gtag), Plausible, dev console
// ============================================================

function safeTrack(eventName, params = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, params);
      return;
    } catch (e) {}
  }

  if (typeof window.plausible === "function") {
    try {
      window.plausible(eventName, { props: params });
      return;
    } catch (e) {}
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", eventName, params);
  }
}

export const track = {
  calculationDone: (params) => safeTrack("sizing_calculated", params),
  fluidPicked: (params) => safeTrack("sizing_fluid_picked", params),
  presetUsed: (params) => safeTrack("sizing_preset_used", params),
  reportOpened: () => safeTrack("sizing_report_opened"),
  pdfDownloaded: (params) => safeTrack("sizing_pdf_downloaded", params),
  csvDownloaded: () => safeTrack("sizing_csv_downloaded"),
  screenshotTaken: () => safeTrack("sizing_screenshot_taken"),
  compared: () => safeTrack("sizing_compare_opened"),
  wizardOpened: () => safeTrack("sizing_wizard_opened"),
  scenarioSaved: () => safeTrack("sizing_scenario_saved"),
  quoteRequested: (params) => safeTrack("sizing_quote_requested", params),
  unitToggled: (system) => safeTrack("sizing_unit_toggled", { system }),
  productViewed: (params) => safeTrack("sizing_product_viewed", params)
};