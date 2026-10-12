export const categories = [
  {
    id: "control-valves",
    name: { fa: "شیرهای کنترلی", en: "Control Valves", ar: "صمامات التحكم", ru: "Регулирующие клапаны" },
    desc: {
      fa: "کنترل دقیق جریان سیال در فرآیندهای حیاتی صنعتی",
      en: "Precision flow control for critical industrial processes",
      ar: "تحكم دقيق في تدفق السوائل للعمليات الصناعية الحرجة",
      ru: "Точное управление потоком для критических промышленных процессов"
    },
    icon: "Gauge",
    products: [
      { slug: "ball-control-valve", series: "PSM-BCV", name: { fa: "شیر کنترلی توپی", en: "Ball Control Valve" }, short: { fa: "کنترل دقیق با توپی سنگ‌زنی شده", en: "Precision control with ground ball" } },
      { slug: "segmented-ball-valve", series: "PSM-SBV", name: { fa: "شیر کنترلی سگمنتی", en: "Segmented Ball Valve" }, short: { fa: "کنترل دقیق در دبی بالا", en: "Precise control at high flow" } },
      { slug: "globe-valve", series: "PSM-GLV", name: { fa: "شیر کنترلی گلوب", en: "Globe Control Valve" }, short: { fa: "کنترل پیوسته با دقت بالا", en: "Continuous precise control" } }
    ]
  },
  {
    id: "ball-valves",
    name: { fa: "شیرهای توپی", en: "Ball Valves", ar: "الصمامات الكروية", ru: "Шаровые клапаны" },
    desc: {
      fa: "طراحی و ساخت شیرهای توپی در انواع مختلف",
      en: "Design and manufacture of various ball valve types",
      ar: "تصميم وتصنيع أنواع مختلفة من الصمامات الكروية",
      ru: "Проектирование и производство различных типов шаровых клапанов"
    },
    icon: "Circle",
    products: [
      { slug: "trunnion-ball", series: "PSM-TBV", name: { fa: "توپی ترونیون", en: "Trunnion Ball Valve" }, short: { fa: "مناسب خطوط فشار قوی", en: "For high pressure lines" } },
      { slug: "floating-ball", series: "PSM-FBV", name: { fa: "توپی شناور", en: "Floating Ball Valve" }, short: { fa: "طراحی ساده و اقتصادی", en: "Simple and economical design" } },
      { slug: "top-entry-ball", series: "PSM-TEB", name: { fa: "توپی ورودی از بالا", en: "Top Entry Ball Valve" }, short: { fa: "تعمیر آسان بدون جداسازی", en: "Easy in-line maintenance" } }
    ]
  },
  {
    id: "butterfly-valves",
    name: { fa: "شیرهای پروانه‌ای", en: "Butterfly Valves", ar: "صمامات الفراشة", ru: "Дисковые затворы" },
    desc: {
      fa: "شیرهای پروانه‌ای برای کاربردهای عمومی و خاص",
      en: "Butterfly valves for general and special applications",
      ar: "صمامات الفراشة للتطبيقات العامة والخاصة",
      ru: "Дисковые затворы для общих и специальных применений"
    },
    icon: "Sun",
    products: [
      { slug: "wafer-butterfly", series: "PSM-WBF", name: { fa: "پروانه‌ای ویفر", en: "Wafer Butterfly Valve" }, short: { fa: "نصب ساده بین فلنج‌ها", en: "Simple wafer installation" } },
      { slug: "lug-butterfly", series: "PSM-LBF", name: { fa: "پروانه‌ای لوگ", en: "Lug Butterfly Valve" }, short: { fa: "قابلیت جداسازی یک طرفه", en: "Single-side isolation" } },
      { slug: "double-offset", series: "PSM-DOB", name: { fa: "پروانه‌ای دو خارج از مرکز", en: "Double Offset Butterfly" }, short: { fa: "نشتی صفر در فشار بالا", en: "Zero leakage at high pressure" } }
    ]
  },
  {
    id: "gate-valves",
    name: { fa: "شیرهای دروازه‌ای", en: "Gate Valves", ar: "صمامات البوابة", ru: "Задвижки" },
    desc: {
      fa: "شیرهای دروازه‌ای برای قطع و وصل جریان",
      en: "Gate valves for on/off flow isolation",
      ar: "صمامات البوابة لعزل التدفق",
      ru: "Задвижки для отсечения потока"
    },
    icon: "Square",
    products: [
      { slug: "wedge-gate", series: "PSM-WGV", name: { fa: "دروازه‌ای گوه‌ای", en: "Wedge Gate Valve" }, short: { fa: "آب‌بندی مطمئن", en: "Reliable sealing" } },
      { slug: "parallel-gate", series: "PSM-PGV", name: { fa: "دروازه‌ای موازی", en: "Parallel Gate Valve" }, short: { fa: "افت فشار کم", en: "Low pressure drop" } }
    ]
  },
  {
    id: "globe-valves",
    name: { fa: "شیرهای گلوب", en: "Globe Valves", ar: "الصمامات الكروية", ru: "Клапаны" },
    desc: {
      fa: "کنترل جریان با دقت بالا",
      en: "High precision flow control",
      ar: "تحكم دقيق في التدفق",
      ru: "Высокоточное управление потоком"
    },
    icon: "Circle",
    products: [
      { slug: "straight-globe", series: "PSM-SGL", name: { fa: "گلوب مستقیم", en: "Straight Globe Valve" }, short: { fa: "طراحی متداول و کارآمد", en: "Standard efficient design" } },
      { slug: "angle-globe", series: "PSM-AGL", name: { fa: "گلوب زاویه‌ای", en: "Angle Globe Valve" }, short: { fa: "مناسب تغییر مسیر جریان", en: "For flow direction change" } }
    ]
  },
  {
    id: "check-valves",
    name: { fa: "شیرهای یکطرفه", en: "Check Valves", ar: "صمامات عدم الرجوع", ru: "Обратные клапаны" },
    desc: {
      fa: "جلوگیری از بازگشت جریان",
      en: "Preventing reverse flow",
      ar: "منع التدفق العكسي",
      ru: "Предотвращение обратного потока"
    },
    icon: "ArrowRight",
    products: [
      { slug: "swing-check", series: "PSM-SWC", name: { fa: "یکطرفه سوئینگ", en: "Swing Check Valve" }, short: { fa: "عملکرد ساده و مطمئن", en: "Simple reliable operation" } },
      { slug: "dual-plate-check", series: "PSM-DPC", name: { fa: "یکطرفه دو صفحه", en: "Dual Plate Check" }, short: { fa: "ابعاد فشرده", en: "Compact design" } }
    ]
  },
  {
    id: "plug-valves",
    name: { fa: "شیرهای پلاگ", en: "Plug Valves", ar: "صمامات السدادة", ru: "Пробковые клапаны" },
    desc: {
      fa: "شیرهای پلاگ برای سرویس‌های خاص",
      en: "Plug valves for special services",
      ar: "صمامات السدادة للخدمات الخاصة",
      ru: "Пробковые клапаны для специальных применений"
    },
    icon: "Cylinder",
    products: [
      { slug: "lubricated-plug", series: "PSM-LPV", name: { fa: "پلاگ روغن‌کاری‌شده", en: "Lubricated Plug" }, short: { fa: "آب‌بندی عالی", en: "Excellent sealing" } },
      { slug: "sleeved-plug", series: "PSM-SPV", name: { fa: "پلاگ آستین‌دار", en: "Sleeved Plug" }, short: { fa: "بدون نیاز به روغن‌کاری", en: "No lubrication needed" } }
    ]
  },
  {
    id: "diaphragm-valves",
    name: { fa: "شیرهای دیافراگمی", en: "Diaphragm Valves", ar: "صمامات الحجاب الحاجز", ru: "Диафрагмовые клапаны" },
    desc: {
      fa: "مناسب سیالات خورنده و دوغاب",
      en: "For corrosive fluids and slurries",
      ar: "للمواد المسببة للتآكل والطين",
      ru: "Для агрессивных сред и суспензий"
    },
    icon: "Circle",
    products: [
      { slug: "weir-diaphragm", series: "PSM-WDV", name: { fa: "دیافراگمی وییر", en: "Weir Diaphragm" }, short: { fa: "کنترل دقیق جریان", en: "Precise flow control" } },
      { slug: "straight-through-diaphragm", series: "PSM-STD", name: { fa: "دیافراگمی مستقیم", en: "Straight Through" }, short: { fa: "افت فشار کم", en: "Low pressure drop" } }
    ]
  },
  {
    id: "needle-valves",
    name: { fa: "شیرهای سوزنی", en: "Needle Valves", ar: "صمامات الإبرة", ru: "Игольчатые клапаны" },
    desc: {
      fa: "کنترل دقیق جریان‌های کم",
      en: "Precise low-flow control",
      ar: "تحكم دقيق في التدفقات المنخفضة",
      ru: "Точное управление малыми потоками"
    },
    icon: "Minus",
    products: [
      { slug: "instrument-needle", series: "PSM-INV", name: { fa: "سوزنی ابزار دقیق", en: "Instrument Needle" }, short: { fa: "برای سیستم‌های ابزار دقیق", en: "For instrumentation systems" } },
      { slug: "high-pressure-needle", series: "PSM-HPN", name: { fa: "سوزنی فشار بالا", en: "High Pressure Needle" }, short: { fa: "مقاوم در فشارهای بالا", en: "High pressure resistant" } }
    ]
  },
  {
    id: "safety-valves",
    name: { fa: "شیرهای اطمینان", en: "Safety Relief Valves", ar: "صمامات الأمان", ru: "Предохранительные клапаны" },
    desc: {
      fa: "حفاظت از تجهیزات در فشار اضافی",
      en: "Equipment protection against overpressure",
      ar: "حماية المعدات من الضغط الزائد",
      ru: "Защита оборудования от избыточного давления"
    },
    icon: "ShieldAlert",
    products: [
      { slug: "spring-safety", series: "PSM-SSV", name: { fa: "اطمینان فنری", en: "Spring Loaded Safety" }, short: { fa: "طراحی کلاسیک و مطمئن", en: "Classic reliable design" } },
      { slug: "pilot-safety", series: "PSM-PSV", name: { fa: "اطمینان پیلوت‌دار", en: "Pilot Operated Safety" }, short: { fa: "دقت بالا در فشار بازشدگی", en: "High set pressure accuracy" } }
    ]
  },
  {
    id: "cryogenic-valves",
    name: { fa: "شیرهای کرایوژنیک", en: "Cryogenic Valves", ar: "صمامات التبريد العميق", ru: "Криогенные клапаны" },
    desc: {
      fa: "طراحی ویژه برای دمای تا منفی ۱۹۶ درجه",
      en: "Special design for temperatures down to -196°C",
      ar: "تصميم خاص لدرجات حرارة تصل إلى -196 درجة",
      ru: "Специальная конструкция для температур до -196°C"
    },
    icon: "Snowflake",
    products: [
      { slug: "cryogenic-valve", series: "PSM-CRV", name: { fa: "شیر کرایوژنیک توپی", en: "Cryogenic Ball Valve" }, short: { fa: "تست cryogenic طبق استاندارد", en: "Standard cryogenic testing" } },
      { slug: "cryogenic-gate", series: "PSM-CRG", name: { fa: "دروازه‌ای کرایوژنیک", en: "Cryogenic Gate Valve" }, short: { fa: "مناسب LNG", en: "Suitable for LNG" } }
    ]
  },
  {
    id: "hvf-services",
    name: { fa: "خدمات HVOF", en: "HVOF Services", ar: "خدمات HVOF", ru: "Услуги HVOF" },
    desc: {
      fa: "پوشش‌دهی کاربید تنگستن با فرآیند HVOF",
      en: "Tungsten carbide coating with HVOF process",
      ar: "طلاء كربيد التنغستن بعملية HVOF",
      ru: "Покрытие карбидом вольфрама методом HVOF"
    },
    icon: "Flame",
    products: [
      { slug: "hvf-coated-valve", series: "PSM-HVF", name: { fa: "شیر با پوشش HVOF", en: "HVOF Coated Valve" }, short: { fa: "افزایش عمر تا ۵ برابر", en: "Up to 5x longer life" } },
      { slug: "hvf-coating-service", series: "PSM-HVS", name: { fa: "خدمات پوشش‌دهی", en: "HVOF Coating Service" }, short: { fa: "اعمال روی انواع سطوح", en: "Applied to various surfaces" } }
    ]
  }
];

export function getCategory(id) {
  return categories.find((c) => c.id === id);
}

export function getAllProducts() {
  return categories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, categoryId: cat.id, category: cat }))
  );
}

export function getProductBySlug(slug) {
  for (const cat of categories) {
    const p = cat.products.find((pr) => pr.slug === slug);
    if (p) return { ...p, categoryId: cat.id, category: cat };
  }
  return null;
}
