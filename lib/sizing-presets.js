// Ready-to-use sizing scenarios

// پریست‌های ایستگاه دی‌سوپرهیتر: هر سه فیلد لازم (T2، waterP و دمای آب) را
// کامل می‌کنند تا با یک کلیک «محاسبه» قابل اجرا باشد. اعداد نمونهٔ خطوط
// بخار کم‌فشار/متوسط/پرفشار هستند، نه حد طراحی.
export const DESUPER_PRESETS = [
  {
    id: "desuper-lp",
    icon: "🌡️",
    color: "#00A896",
    name: {
      fa: "بخار کم‌فشار ۴ bar",
      en: "Low-pressure steam 4 bar",
      ar: "بخار منخفض الضغط ٤ bar",
      ru: "Пар низкого давления 4 bar"
    },
    desc: {
      fa: "۳٬۰۰۰ kg/h · ۲۲۰ → ۱۷۰ °C · آب ۷ bar",
      en: "3,000 kg/h · 220 → 170 °C · water 7 bar",
      ar: "٣٬٠٠٠ kg/h · ٢٢٠ → ١٧٠ °C · ماء ٧ bar",
      ru: "3 000 kg/h · 220 → 170 °C · вода 7 bar"
    },
    fluid: "steam",
    values: {
      W: 3000, P1: 4, T: 220, T2: 170,
      waterP: 7, waterT: 25, waterGf: 1, supplyP: 6
    }
  },
  {
    id: "desuper-mp",
    icon: "♨️",
    color: "#E81123",
    name: {
      fa: "بخار متوسط ۱۲ bar",
      en: "Medium-pressure steam 12 bar",
      ar: "بخار متوسط الضغط ١٢ bar",
      ru: "Пар среднего давления 12 bar"
    },
    desc: {
      fa: "۱۰٬۰۰۰ kg/h · ۳۰۰ → ۲۳۰ °C · آب ۱۸ bar",
      en: "10,000 kg/h · 300 → 230 °C · water 18 bar",
      ar: "١٠٬٠٠٠ kg/h · ٣٠٠ → ٢٣٠ °C · ماء ١٨ bar",
      ru: "10 000 kg/h · 300 → 230 °C · вода 18 bar"
    },
    fluid: "steam",
    values: {
      W: 10000, P1: 12, T: 300, T2: 230,
      waterP: 18, waterT: 25, waterGf: 1, supplyP: 16
    }
  },
  {
    id: "desuper-hp",
    icon: "🔥",
    color: "#F7630C",
    name: {
      fa: "بخار پرفشار ۳۵ bar",
      en: "High-pressure steam 35 bar",
      ar: "بخار عالي الضغط ٣٥ bar",
      ru: "Пар высокого давления 35 bar"
    },
    desc: {
      fa: "۲۵٬۰۰۰ kg/h · ۴۰۰ → ۳۳۰ °C · آب تغذیه ۵۵ bar",
      en: "25,000 kg/h · 400 → 330 °C · feedwater 55 bar",
      ar: "٢٥٬٠٠٠ kg/h · ٤٠٠ → ٣٣٠ °C · ماء تغذية ٥٥ bar",
      ru: "25 000 kg/h · 400 → 330 °C · питательная вода 55 bar"
    },
    fluid: "steam",
    values: {
      W: 25000, P1: 35, T: 400, T2: 330,
      waterP: 55, waterT: 105, waterGf: 1, supplyP: 40
    }
  }
];

export const PRESET_SCENARIOS = [
  {
    id: "water-transmission",
    icon: "💧",
    color: "#0078D4",
    name: {
      fa: "خط انتقال آب",
      en: "Water Transmission",
      ar: "نقل المياه",
      ru: "Водопровод"
    },
    desc: {
      fa: "پمپاژ آب صنعتی در خط لوله DN100",
      en: "Industrial water pumping in DN100 line",
      ar: "ضخ المياه الصناعية",
      ru: "Перекачка воды DN100"
    },
    fluid: "liquid",
    values: {
      Q: 50,
      Gf: 1.0,
      P1: 10,
      P2: 6,
      Pv: 0.0317,
      Pc: 221,
      FL: 0.9,
      nu: 1
    }
  },
  {
    id: "natural-gas",
    icon: "🔥",
    color: "#F7630C",
    name: {
      fa: "خط گاز طبیعی",
      en: "Natural Gas Line",
      ar: "خط الغاز الطبيعي",
      ru: "Газовая линия"
    },
    desc: {
      fa: "کاهش فشار گاز طبیعی در ایستگاه CGS",
      en: "Natural gas pressure reduction at CGS station",
      ar: "تخفيض ضغط الغاز الطبيعي",
      ru: "Редукция давления газа"
    },
    fluid: "gas",
    values: {
      Q: 1000,
      Gg: 0.65,
      P1: 20,
      P2: 10,
      T: 25,
      Z: 1,
      k: 1.3,
      xT: 0.7
    }
  },
  {
    id: "steam-line",
    icon: "♨️",
    color: "#E81123",
    name: {
      fa: "خط بخار اشباع",
      en: "Saturated Steam Line",
      ar: "خط البخار المشبع",
      ru: "Линия пара"
    },
    desc: {
      fa: "کنترل بخار اشباع در دیگ بخار",
      en: "Saturated steam control in boiler",
      ar: "التحكم بالبخار في الغلاية",
      ru: "Регулирование пара в котле"
    },
    fluid: "steam",
    values: {
      W: 500,
      P1: 12,
      P2: 6,
      T: 190
    }
  },
  {
    id: "cooling-water",
    icon: "❄️",
    color: "#00A896",
    name: {
      fa: "آب خنک‌کننده",
      en: "Cooling Water",
      ar: "مياه التبريد",
      ru: "Охлаждающая вода"
    },
    desc: {
      fa: "سیستم خنک‌کننده برج در پالایشگاه",
      en: "Cooling tower system in refinery",
      ar: "نظام برج التبريد",
      ru: "Система охлаждения"
    },
    fluid: "liquid",
    values: {
      Q: 30,
      Gf: 1.0,
      P1: 5,
      P2: 3,
      Pv: 0.0317,
      Pc: 221,
      FL: 0.9,
      nu: 1
    }
  }
];

// ================================================================
// Local storage helpers for saved scenarios
// ================================================================
const STORAGE_KEY = "psm_sizing_scenarios";

export function loadScenarios() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveScenario(scenario) {
  if (typeof window === "undefined") return [];
  try {
    const list = loadScenarios();
    list.push(scenario);
    const trimmed = list.slice(-10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    return [];
  }
}

export function removeScenario(id) {
  if (typeof window === "undefined") return [];
  try {
    const list = loadScenarios().filter(function(s) { return s.id !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
}

export function clearScenarios() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
