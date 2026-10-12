// ============================================================
// PSM PRODUCTS — PREVIEW DATA
// ⚠️ این داده‌ها نمونه است. بعداً با محصولات واقعی جایگزین کن.
// ============================================================

export const PSM_PRODUCTS_PREVIEW = [
  {
    id: "psm-1000",
    series: "PSM-1000",
    type: { fa: "شیر گلوب کنترلی", en: "Globe Control Valve", ar: "صمام كروي", ru: "Регулирующий клапан" },
    color: "#0078D4",
    image: "/products/psm-1000.jpg",
    sizes: [
      { dn: "DN25", nps: '1"', cv: 12 },
      { dn: "DN40", nps: '1-1/2"', cv: 25 },
      { dn: "DN50", nps: '2"', cv: 45 },
      { dn: "DN80", nps: '3"', cv: 90 },
      { dn: "DN100", nps: '4"', cv: 150 },
      { dn: "DN150", nps: '6"', cv: 320 },
      { dn: "DN200", nps: '8"', cv: 550 }
    ],
    materials: ["WCB", "CF8M", "CF3M"],
    pressure: "PN16 – PN40",
    tempRange: [-29, 425],
    trim: ["Linear", "Equal %"],
    tags: { fa: ["کاربرد عمومی", "دقت بالا", "تعمیر آسان"], en: ["General service", "High accuracy", "Easy maintenance"] }
  },
  {
    id: "psm-2000",
    series: "PSM-2000",
    type: { fa: "شیر کنترلی Cage-Guided", en: "Cage-Guided Control Valve", ar: "صمام موجه", ru: "Клетьевой клапан" },
    color: "#7C3AED",
    image: "/products/psm-2000.jpg",
    sizes: [
      { dn: "DN25", nps: '1"', cv: 14 },
      { dn: "DN40", nps: '1-1/2"', cv: 30 },
      { dn: "DN50", nps: '2"', cv: 55 },
      { dn: "DN80", nps: '3"', cv: 110 },
      { dn: "DN100", nps: '4"', cv: 190 },
      { dn: "DN150", nps: '6"', cv: 410 },
      { dn: "DN200", nps: '8"', cv: 700 },
      { dn: "DN250", nps: '10"', cv: 1100 }
    ],
    materials: ["WCB", "CF8M", "CF3M", "Duplex"],
    pressure: "PN16 – PN100",
    tempRange: [-46, 540],
    trim: ["Linear", "Equal %", "Anti-cavitation"],
    tags: { fa: ["ضد کاویتاسیون", "دبی بالا", "تعادل فشار"], en: ["Anti-cavitation", "High flow", "Pressure balanced"] }
  },
  {
    id: "psm-3000",
    series: "PSM-3000",
    type: { fa: "شیر پروانه‌ای کنترلی", en: "Butterfly Control Valve", ar: "صمام فراشة", ru: "Дисковый клапан" },
    color: "#059669",
    image: "/products/psm-3000.jpg",
    sizes: [
      { dn: "DN50", nps: '2"', cv: 100 },
      { dn: "DN80", nps: '3"', cv: 220 },
      { dn: "DN100", nps: '4"', cv: 400 },
      { dn: "DN150", nps: '6"', cv: 850 },
      { dn: "DN200", nps: '8"', cv: 1500 },
      { dn: "DN300", nps: '12"', cv: 3200 },
      { dn: "DN400", nps: '16"', cv: 5500 },
      { dn: "DN600", nps: '24"', cv: 12000 }
    ],
    materials: ["CF8M", "CF3M", "Duplex", "Al-Bronze"],
    pressure: "PN10 – PN25",
    tempRange: [-29, 200],
    trim: ["Linear", "Equal %"],
    tags: { fa: ["دبی بسیار بالا", "فضای کم", "اقتصادی"], en: ["Very high flow", "Compact", "Economical"] }
  },
  {
    id: "psm-4000",
    series: "PSM-4000",
    type: { fa: "شیر کنترلی زاویه‌ای", en: "Angle Control Valve", ar: "صمام زاوي", ru: "Угловой клапан" },
    color: "#DC2626",
    image: "/products/psm-4000.jpg",
    sizes: [
      { dn: "DN25", nps: '1"', cv: 10 },
      { dn: "DN40", nps: '1-1/2"', cv: 22 },
      { dn: "DN50", nps: '2"', cv: 40 },
      { dn: "DN80", nps: '3"', cv: 85 },
      { dn: "DN100", nps: '4"', cv: 160 },
      { dn: "DN150", nps: '6"', cv: 380 }
    ],
    materials: ["WCB", "CF8M", "Hastelloy"],
    pressure: "PN40 – PN160",
    tempRange: [-29, 540],
    trim: ["Linear", "Equal %", "Anti-cavitation", "Anti-noise"],
    tags: { fa: ["مواد دوغابی", "ضد سایش", "فشار بالا"], en: ["Slurry service", "Abrasion resistant", "High pressure"] }
  }
];

// ============================================================
// SUGGESTION ENGINE
// ============================================================
export function suggestProducts(requiredCv, form, locale = "fa") {
  if (!requiredCv || requiredCv <= 0) return [];

  const suggestions = [];

  PSM_PRODUCTS_PREVIEW.forEach(product => {
    // Find the smallest size whose Cv >= requiredCv * 1.15 (safety)
    const targetCv = requiredCv * 1.15;
    const matchedSize = product.sizes.find(s => s.cv >= targetCv);

    if (matchedSize) {
      const openingPercent = Math.round((requiredCv / matchedSize.cv) * 100);
      suggestions.push({
        product,
        matchedSize,
        openingPercent,
        totalSizes: product.sizes.length,
        allSizes: product.sizes
      });
    }
  });

  // Sort by best opening (closer to ~50-60% = best)
  suggestions.sort((a, b) => {
    const diffA = Math.abs(a.openingPercent - 55);
    const diffB = Math.abs(b.openingPercent - 55);
    return diffA - diffB;
  });

  return suggestions.slice(0, 3);
}

// ============================================================
// Export metadata
// ============================================================
export const PRODUCTS_META = {
  isPreview: true,
  message: {
    fa: "⚠️ این محصولات نمونه هستند. برای اطلاعات دقیق با ما تماس بگیرید.",
    en: "⚠️ Sample products. Contact us for exact specifications.",
    ar: "⚠️ منتجات تجريبية. اتصل بنا للتفاصيل.",
    ru: "⚠️ Образцы продуктов. Свяжитесь с нами для деталей."
  }
};