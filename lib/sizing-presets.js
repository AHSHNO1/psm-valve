// Ready-to-use sizing scenarios

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
      FL: 0.9
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
      FL: 0.9
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
