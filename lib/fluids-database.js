// ============================================================
// FLUIDS DATABASE
// ν = گرانروی سینماتیکی (cSt) برآوردی در ~۲۰ درجهٔ سلیسیوس
// مقادیر مهندسی تقریبی هستند؛ برای دقت بالا جدول سازنده را ببینید
// ============================================================

export const FLUID_CATEGORIES = [
  { id: "all", icon: "🌐", names: { fa: "همه", en: "All", ar: "الكل", ru: "Все" } },
  { id: "water", icon: "💧", names: { fa: "آب", en: "Water", ar: "ماء", ru: "Вода" } },
  { id: "oil", icon: "🛢️", names: { fa: "روغن", en: "Oil & Fuel", ar: "زيت", ru: "Нефть" } },
  { id: "chemical", icon: "⚗️", names: { fa: "شیمیایی", en: "Chemical", ar: "كيميائي", ru: "Химия" } },
  { id: "gas", icon: "💨", names: { fa: "گاز", en: "Gas", ar: "غاز", ru: "Газ" } },
  { id: "refrigerant", icon: "❄️", names: { fa: "مبرد", en: "Refrigerant", ar: "مبرد", ru: "Хладагент" } },
  { id: "steam", icon: "♨️", names: { fa: "بخار", en: "Steam", ar: "بخار", ru: "Пар" } }
];

export const FLUIDS = [
  // ============ WATER ============
  { id: "water_fresh", cat: "water", type: "liquid", icon: "💧",
    names: { fa: "آب شیرین", en: "Fresh Water", ar: "ماء عذب", ru: "Пресная вода" },
    Gf: 1.0, Pv: 0.0317, Pc: 221.2, nu: 1.0 },
  { id: "water_sea", cat: "water", type: "liquid", icon: "🌊",
    names: { fa: "آب دریا", en: "Sea Water", ar: "ماء البحر", ru: "Морская вода" },
    Gf: 1.025, Pv: 0.0317, Pc: 221.2, nu: 1.05 },
  { id: "water_distilled", cat: "water", type: "liquid", icon: "💧",
    names: { fa: "آب مقطر", en: "Distilled Water", ar: "ماء مقطر", ru: "Дистиллированная" },
    Gf: 0.998, Pv: 0.0317, Pc: 221.2, nu: 1.0 },
  { id: "water_boiler", cat: "water", type: "liquid", icon: "🔥",
    names: { fa: "آب بویلر", en: "Boiler Feed Water", ar: "ماء المرجل", ru: "Питательная вода" },
    Gf: 1.0, Pv: 0.0317, Pc: 221.2, nu: 1.0 },
  { id: "water_cooling", cat: "water", type: "liquid", icon: "❄️",
    names: { fa: "آب خنک‌کننده", en: "Cooling Water", ar: "ماء التبريد", ru: "Охлаждающая вода" },
    Gf: 1.0, Pv: 0.0317, Pc: 221.2, nu: 1.0 },
  { id: "condensate", cat: "water", type: "liquid", icon: "💧",
    names: { fa: "کاندنس", en: "Condensate", ar: "مكثف", ru: "Конденсат" },
    Gf: 0.98, Pv: 0.0317, Pc: 221.2, nu: 1.0 },

  // ============ OIL ============
  { id: "oil_crude", cat: "oil", type: "liquid", icon: "🛢️",
    names: { fa: "نفت خام", en: "Crude Oil", ar: "نفط خام", ru: "Сырая нефть" },
    Gf: 0.87, Pv: 0.02, Pc: 22, nu: 30 },
  { id: "oil_diesel", cat: "oil", type: "liquid", icon: "⛽",
    names: { fa: "گازوئیل", en: "Diesel", ar: "ديزل", ru: "Дизель" },
    Gf: 0.84, Pv: 0.005, Pc: 22, nu: 4 },
  { id: "oil_gasoline", cat: "oil", type: "liquid", icon: "⛽",
    names: { fa: "بنزین", en: "Gasoline", ar: "بنزين", ru: "Бензин" },
    Gf: 0.74, Pv: 0.65, Pc: 32, nu: 0.6 },
  { id: "oil_kerosene", cat: "oil", type: "liquid", icon: "🛢️",
    names: { fa: "نفت سفید", en: "Kerosene", ar: "كيروسين", ru: "Керосин" },
    Gf: 0.82, Pv: 0.02, Pc: 24, nu: 2.4 },
  { id: "oil_lube", cat: "oil", type: "liquid", icon: "🛢️",
    names: { fa: "روغن روانکار", en: "Lubricating Oil", ar: "زيت التشحيم", ru: "Смазочное масло" },
    Gf: 0.9, Pv: 0.001, Pc: 22, nu: 150 },
  { id: "oil_fuel", cat: "oil", type: "liquid", icon: "🔥",
    names: { fa: "نفت کوره", en: "Fuel Oil", ar: "زيت الوقود", ru: "Мазут" },
    Gf: 0.95, Pv: 0.001, Pc: 22, nu: 400 },

  // ============ CHEMICAL ============
  { id: "chem_h2so4", cat: "chemical", type: "liquid", icon: "⚗️",
    names: { fa: "اسید سولفوریک ۹۸٪", en: "Sulfuric Acid 98%", ar: "حمض الكبريتيك", ru: "Серная кислота" },
    Gf: 1.84, Pv: 0.001, Pc: 62, nu: 13 },
  { id: "chem_hcl", cat: "chemical", type: "liquid", icon: "⚗️",
    names: { fa: "اسید کلریدریک ۳۰٪", en: "Hydrochloric Acid 30%", ar: "حمض الهيدروكلوريك", ru: "Соляная кислота" },
    Gf: 1.15, Pv: 0.02, Pc: 82, nu: 1.7 },
  { id: "chem_hno3", cat: "chemical", type: "liquid", icon: "⚗️",
    names: { fa: "اسید نیتریک ۶۸٪", en: "Nitric Acid 68%", ar: "حمض النيتريك", ru: "Азотная кислота" },
    Gf: 1.41, Pv: 0.01, Pc: 68, nu: 2.0 },
  { id: "chem_naoh", cat: "chemical", type: "liquid", icon: "⚗️",
    names: { fa: "سود سوزآور ۵۰٪", en: "Caustic Soda 50%", ar: "الصودا الكاوية", ru: "Едкий натр" },
    Gf: 1.52, Pv: 0.01, Pc: 190, nu: 9 },
  { id: "chem_ammonia_liq", cat: "chemical", type: "liquid", icon: "🧪",
    names: { fa: "آمونیاک مایع", en: "Liquid Ammonia", ar: "أمونيا سائلة", ru: "Жидкий аммиак" },
    Gf: 0.68, Pv: 10.2, Pc: 113, nu: 0.2 },
  { id: "chem_methanol", cat: "chemical", type: "liquid", icon: "🧪",
    names: { fa: "متانول", en: "Methanol", ar: "ميثانول", ru: "Метанول" },
    Gf: 0.79, Pv: 0.17, Pc: 81, nu: 0.7 },
  { id: "chem_ethanol", cat: "chemical", type: "liquid", icon: "🧪",
    names: { fa: "اتانول", en: "Ethanol", ar: "إيثانول", ru: "Этанол" },
    Gf: 0.79, Pv: 0.079, Pc: 61, nu: 1.4 },
  { id: "chem_glycol", cat: "chemical", type: "liquid", icon: "🧪",
    names: { fa: "اتیلن گلیکول", en: "Ethylene Glycol", ar: "جلايكول", ru: "Этиленгликоль" },
    Gf: 1.11, Pv: 0.008, Pc: 82, nu: 20 },

  // ============ GAS ============
  // MW = وزن مولکولی (g/mol) — ν گازها تقریبی و در فشار پایین (cSt)
  { id: "gas_air", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "هوا", en: "Air", ar: "هواء", ru: "Воздух" },
    Gg: 1.0, k: 1.4, Z: 1, MW: 28.96, nu: 15 },
  { id: "gas_natural", cat: "gas", type: "gas", icon: "🔥",
    names: { fa: "گاز طبیعی", en: "Natural Gas", ar: "غاز طبيعي", ru: "Природный газ" },
    Gg: 0.65, k: 1.3, Z: 1, MW: 18.82, nu: 16 },
  { id: "gas_methane", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "متان", en: "Methane", ar: "ميثان", ru: "Метан" },
    Gg: 0.55, k: 1.31, Z: 1, MW: 16.04, nu: 17 },
  { id: "gas_hydrogen", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "هیدروژن", en: "Hydrogen", ar: "هيدروجين", ru: "Водород" },
    Gg: 0.07, k: 1.41, Z: 1, MW: 2.02, nu: 105 },
  { id: "gas_nitrogen", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "نیتروژن", en: "Nitrogen", ar: "نيتروجين", ru: "Азот" },
    Gg: 0.97, k: 1.4, Z: 1, MW: 28.01, nu: 15 },
  { id: "gas_co2", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "دی‌اکسید کربن", en: "Carbon Dioxide", ar: "ثاني أكسيد الكربون", ru: "Углекислый газ" },
    Gg: 1.52, k: 1.29, Z: 1, MW: 44.01, nu: 8 },
  { id: "gas_ammonia", cat: "gas", type: "gas", icon: "💨",
    names: { fa: "آمونیاک گازی", en: "Ammonia Gas", ar: "أمونيا غازية", ru: "Аммиак газ" },
    Gg: 0.59, k: 1.31, Z: 1, MW: 17.03, nu: 14 },
  { id: "gas_chlorine", cat: "gas", type: "gas", icon: "☣️",
    names: { fa: "کلر", en: "Chlorine", ar: "كلور", ru: "Хлор" },
    Gg: 2.49, k: 1.34, Z: 1, MW: 70.9, nu: 4.5 },

  // ============ REFRIGERANT ============
  { id: "ref_r134a", cat: "refrigerant", type: "liquid", icon: "❄️",
    names: { fa: "R-134a", en: "R-134a", ar: "R-134a", ru: "R-134a" },
    Gf: 1.21, Pv: 6.7, Pc: 40.6, nu: 0.2 },
  { id: "ref_r22", cat: "refrigerant", type: "liquid", icon: "❄️",
    names: { fa: "R-22", en: "R-22", ar: "R-22", ru: "R-22" },
    Gf: 1.19, Pv: 10.4, Pc: 49.9, nu: 0.17 },
  { id: "ref_r410a", cat: "refrigerant", type: "liquid", icon: "❄️",
    names: { fa: "R-410A", en: "R-410A", ar: "R-410A", ru: "R-410A" },
    Gf: 1.06, Pv: 16.5, Pc: 49.0, nu: 0.15 },
  { id: "ref_r717", cat: "refrigerant", type: "liquid", icon: "❄️",
    names: { fa: "R-717 (آمونیاک)", en: "R-717 (Ammonia)", ar: "R-717", ru: "R-717" },
    Gf: 0.68, Pv: 10.2, Pc: 113, nu: 0.2 },

  // ============ STEAM ============
  { id: "steam_sat", cat: "steam", type: "steam", icon: "♨️",
    names: { fa: "بخار اشباع", en: "Saturated Steam", ar: "بخار مشبع", ru: "Насыщенный пар" },
    k: 1.3, nu: 25 },
  { id: "steam_super", cat: "steam", type: "steam", icon: "♨️",
    names: { fa: "بخار سوپرهیت", en: "Superheated Steam", ar: "بخار مسخن", ru: "Перегретый пар" },
    k: 1.3, nu: 30 }
];

// ============================================================
// پیش‌فرض‌های نوع سیال — هر نوع سیال از سیال نمایندهٔ همان دسته
// استفاده می‌شود وقتی کاربر فقط نوع سیال را عوض می‌کند (نه سیال خاص)
// ============================================================
const TYPE_REFERENCE = { liquid: "water_fresh", gas: "gas_natural", steam: "steam_sat" };

export function fluidTypeDefaults(type) {
  const refId = TYPE_REFERENCE[type];
  const ref = FLUIDS.find(f => f.id === refId);
  if (!ref) return {};
  if (type === "gas") {
    return { Gg: ref.Gg, MW: ref.MW, k: ref.k, Z: ref.Z };
  }
  if (type === "steam") {
    return { k: ref.k };
  }
  return { Gf: ref.Gf, Pv: ref.Pv, Pc: ref.Pc, nu: ref.nu };
}

export function searchFluids(query, category = "all", locale = "fa") {
  const q = (query || "").toLowerCase().trim();
  return FLUIDS.filter(f => {
    if (category !== "all" && f.cat !== category) return false;
    if (!q) return true;
    const name = f.names[locale] || f.names.en;
    return (
      name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      (f.names.en || "").toLowerCase().includes(q) ||
      (f.names.fa || "").includes(q)
    );
  });
}
