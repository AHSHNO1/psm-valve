function categoryProduct(slug, series, fa, en) {
  return { slug, series, name: { fa, en }, short: { fa: "", en: "" } };
}

export const categories = [
  {
    id: "control-valves",
    name: {
      fa: "شیرهای گلوب کنترلی رفت‌وبرگشتی",
      en: "Control Reciprocating Globe Valves",
      ar: "صمامات غلوب التحكم الترددية",
      ru: "Поступательные регулирующие клапаны"
    },
    desc: {
      fa: "سری‌های ۵۱۰۰۰، ۳۱۰۰۰ و ۳۸۰۰۰ شیرهای گلوب کنترلی",
      en: "Control reciprocating globe valve series 51000, 31000 and 38000",
      ar: "صمامات غلوب التحكم الترددية من سلاسل 51000 و31000 و38000",
      ru: "Регулирующие возвратно-поступательные глобусные клапаны серий 51000, 31000 и 38000"
    },
    icon: "Gauge",
    products: [
      categoryProduct("spherical-globe-51000", "51000", "شیر کنترلی گلوب رفت‌وبرگشتی (سری ۵۱۰۰۰)", "Control Reciprocating Globe Valve (51000 Series)"),
      categoryProduct("rotary-plug-31000", "31000", "شیر کنترلی گلوب رفت‌وبرگشتی (سری ۳۱۰۰۰)", "Control Reciprocating Globe Valve (31000 Series)"),
      categoryProduct("globe-control-38000", "38000", "شیر کنترلی گلوب رفت‌وبرگشتی (سری ۳۸۰۰۰)", "Control Reciprocating Globe Valve (38000 Series)")
    ]
  },
  {
    id: "ball-valves",
    name: {
      fa: "شیرهای توپی عمومی و کنترلی",
      en: "General & Control Ball Valves",
      ar: "الصمامات الكروية العامة والتحكم",
      ru: "Шаровые клапаны общего назначения и регулирующие"
    },
    desc: {
      fa: "شیرهای توپی عمومی سری ۳۵۰۰۰ و کنترلی سری‌های ۴۶۰۰۰ و ۴۵۰۰۰",
      en: "General ball valve series 35000 and control series 46000 and 45000",
      ar: "الصمام الكروي العام من سلسلة 35000 وصمامات التحكم من سلسلتي 46000 و45000",
      ru: "Шаровой клапан общего назначения серии 35000 и регулирующие клапаны серий 46000 и 45000"
    },
    icon: "Circle",
    products: [
      categoryProduct("general-ball-35000", "35000", "شیر توپی عمومی (سری ۳۵۰۰۰)", "General Ball Valve (35000 Series)"),
      categoryProduct("ball-valve-46000", "46000", "شیر توپی کنترلی (سری‌های ۴۶۰۰۰ و ۴۵۰۰۰)", "Control Ball Valve (46000 & 45000 Series)"),
      categoryProduct("ball-control-45000", "45000", "شیر توپی کنترلی (سری‌های ۴۶۰۰۰ و ۴۵۰۰۰)", "Control Ball Valve (46000 & 45000 Series)")
    ]
  },
  {
    id: "butterfly-valves",
    name: {
      fa: "شیرهای پروانه‌ای عمومی و کنترلی",
      en: "General & Control Butterfly Valves",
      ar: "صمامات الفراشة العامة والتحكم",
      ru: "Запорные и регулирующие дисковые затворы"
    },
    desc: {
      fa: "شیرهای پروانه‌ای عمومی و کنترلی سری‌های ۵۳۰۰۰ و ۴۳۰۰۰",
      en: "General and control butterfly valve series 53000 and 43000",
      ar: "صمامات الفراشة العامة والتحكم من سلسلتي 53000 و43000",
      ru: "Дисковые затворы общего назначения и регулирующие серий 53000 и 43000"
    },
    icon: "Circle",
    products: [
      categoryProduct("butterfly-control-53000", "53000", "شیر پروانه‌ای عمومی و کنترلی (سری‌های ۵۳۰۰۰ و ۴۳۰۰۰)", "General & Control Butterfly Valve (53000 & 43000 Series)"),
      categoryProduct("butterfly-control-43000", "43000", "شیر پروانه‌ای عمومی و کنترلی (سری‌های ۵۳۰۰۰ و ۴۳۰۰۰)", "General & Control Butterfly Valve (53000 & 43000 Series)")
    ]
  },
  {
    id: "rotary-globe-valves",
    name: {
      fa: "شیرهای گلوب چرخشی",
      en: "Rotary Globe Valves",
      ar: "صمامات غلوب دوارة",
      ru: "Поворотные глобусные клапаны"
    },
    desc: {
      fa: "شیر گلوب چرخشی سری ۶۲۰۰۰",
      en: "Rotary globe valve series 62000",
      ar: "صمام الغلوب الدوار من سلسلة 62000",
      ru: "Поворотный глобусный клапан серии 62000"
    },
    icon: "Gauge",
    products: [
      categoryProduct("rotary-globe-62000", "62000", "شیر گلوب چرخشی (سری ۶۲۰۰۰)", "Rotary Globe Valve (62000 Series)")
    ]
  },
  {
    id: "high-temp-valves",
    name: {
      fa: "شیرهای دمای بالا",
      en: "High Temperature Valves",
      ar: "صمامات درجات الحرارة العالية",
      ru: "Клапаны для высоких температур"
    },
    desc: {
      fa: "شیرهای لت‌داون و دی‌سوپرهیتر دمای بالا",
      en: "High-temperature letdown and desuperheater valves",
      ar: "صمامات خفض الضغط ونزع التحميص لدرجات الحرارة العالية",
      ru: "Высокотемпературные клапаны сброса давления и пароохладители"
    },
    icon: "Flame",
    products: [
      categoryProduct("letdown-66000", "66000", "شیر لت‌داون دمای بالا (سری ۶۶۰۰۰)", "Let Down High Temperature Valve (66000 Series)"),
      categoryProduct("desuperheater-65000", "65000", "شیر دی‌سوپرهیتر دمای بالا (سری ۶۵۰۰۰)", "Desuperheater High Temperature Valve (65000 Series)")
    ]
  },
  {
    id: "piston-valves",
    name: {
      fa: "شیرهای پیستونی",
      en: "Piston Valves",
      ar: "الصمامات المكبسية",
      ru: "Поршневые клапаны"
    },
    desc: {
      fa: "شیر پیستونی سری ۱۰۰۰۰",
      en: "Piston valve series 10000",
      ar: "الصمام المكبسي من سلسلة 10000",
      ru: "Поршневой клапан серии 10000"
    },
    icon: "Cylinder",
    products: [
      categoryProduct("piston-valve-10000", "10000", "شیر پیستونی (سری ۱۰۰۰۰)", "Piston Valve (10000 Series)")
    ]
  },
  {
    id: "safety-valves",
    name: {
      fa: "شیرهای ایمنی",
      en: "Safety Valves",
      ar: "صمامات الأمان",
      ru: "Предохранительные клапаны"
    },
    desc: {
      fa: "شیر ایمنی سری ۵۷۰۰۰",
      en: "Safety valve series 57000",
      ar: "صمام الأمان من سلسلة 57000",
      ru: "Предохранительный клапан серии 57000"
    },
    icon: "ShieldAlert",
    products: [
      categoryProduct("safety-valve-57000", "57000", "شیر ایمنی (سری ۵۷۰۰۰)", "Safety Valve (57000 Series)")
    ]
  },
  {
    id: "pneumatic-actuators",
    name: {
      fa: "عملگرهای پنوماتیکی",
      en: "Pneumatic Actuators",
      ar: "المشغلات الهوائية",
      ru: "Пневматические приводы"
    },
    desc: {
      fa: "عملگرهای پنوماتیکی سری‌های ۹۷ / ۹۸ و ۶۲ / ۶۳",
      en: "Pneumatic actuator series 97 / 98 and 62 / 63",
      ar: "المشغلات الهوائية من سلاسل 97 / 98 و62 / 63",
      ru: "Пневматические приводы серий 97 / 98 и 62 / 63"
    },
    icon: "Package",
    products: [
      categoryProduct(
        "pneumatic-actuators-97-98-62-63",
        "97 / 98 – 62 / 63",
        "عملگرهای پنوماتیکی (سری‌های ۹۷ / ۹۸ – ۶۲ / ۶۳)",
        "Pneumatic Actuators (97 / 98 – 62 / 63 Series)"
      )
    ]
  },
  {
    id: "pressure-regulating-valves",
    name: {
      fa: "شیرهای تنظیم فشار (سری ۷۰۰۰۰)",
      en: "Pressure Regulating Valves (70000 Series)",
      ar: "صمامات تنظيم الضغط (سلسلة 70000)",
      ru: "Регуляторы давления (серия 70000)"
    },
    desc: {
      fa: "حفظ، کاهش و تخلیه فشار برای شرایط عملیاتی ایمن",
      en: "Pressure sustaining, reducing and relief for safe operation",
      ar: "حفظ الضغط وخفضه والتنفيس لظروف تشغيل آمنة",
      ru: "Поддержание, редуцирование и сброс давления для безопасной эксплуатации"
    },
    icon: "ShieldAlert",
    products: [
      { slug: "pressure-regulator-70000-a", series: "70000", name: { fa: "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع A", en: "Pressure Regulating Valve (70000 Series) Type A" }, short: { fa: "شیرهای تثبیت، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } },
      { slug: "pressure-regulator-70000-b", series: "70000", name: { fa: "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع B", en: "Pressure Regulating Valve (70000 Series) Type B" }, short: { fa: "تثبیت و کاهش فشار", en: "Pressure sustaining and pressure reducing" } },
      { slug: "pressure-regulator-70000-cd", series: "70000", name: { fa: "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع‌های C و D", en: "Pressure Regulating Valve (70000 Series) Types C & D" }, short: { fa: "شیرهای تثبیت، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } },
      { slug: "pressure-regulator-70000-e", series: "70000", name: { fa: "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع E", en: "Pressure Regulating Valve (70000 Series) Type E" }, short: { fa: "شیرهای تثبیت، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } },
      { slug: "pressure-regulator-70000-f", series: "70000", name: { fa: "شیر تنظیم فشار (سری ۷۰۰۰۰)، نوع F", en: "Pressure Regulating Valve (70000 Series) Type F" }, short: { fa: "", en: "" } }
    ]
  },
  {
    id: "recirculation-valves",
    name: {
      fa: "شیرهای گردش مجدد پمپ (سری ۹۰۰۰۰)",
      en: "Pump Recirculation Valves (90000 Series)",
      ar: "صمامات إعادة تدوير المضخة (سلسلة 90000)",
      ru: "Клапаны рециркуляции насоса (серия 90000)"
    },
    desc: {
      fa: "محافظت از پمپ‌های گریز از مرکز هنگام کار در بار کم",
      en: "Protection of centrifugal pumps at low load",
      ar: "حماية المضخات الطاردة المركزية عند الأحمال المنخفضة",
      ru: "Защита центробежных насосов при низких нагрузках"
    },
    icon: "Cylinder",
    products: [
      { slug: "arc-valve-90000", series: "90000", name: { fa: "شیر قوسی (سری ۹۰۰۰۰) نوع A و B", en: "Arc Valve (90000 Series) Types A & B" }, short: { fa: "گردش خودکار سیال برای محافظت پمپ", en: "Automatic fluid recirculation to protect the pump" } }
    ]
  },
  {
    id: "control-valve-instrumentation",
    name: {
      fa: "تجهیزات ابزار دقیق کنترل ولو",
      en: "Control Valve Instrumentation Equipment",
      ar: "معدات أدوات القياس والتحكم لصمامات التحكم",
      ru: "КИПиА для регулирующих клапанов"
    },
    desc: {
      fa: "تجهیزات ابزار دقیق و جانبی مورد استفاده در سامانه‌های کنترل ولو",
      en: "Instrumentation and accessories used with control valve systems",
      ar: "معدات وأدوات مساعدة تستخدم مع أنظمة صمامات التحكم",
      ru: "КИПиА и принадлежности, используемые в системах регулирующих клапанов"
    },
    icon: "Gauge",
    children: ["control-valve-positioners", "control-valve-hook-up"],
    products: []
  },
  {
    id: "control-valve-positioners",
    parentId: "control-valve-instrumentation",
    name: {
      fa: "پوزیشنرها",
      en: "Positioners",
      ar: "أجهزة تحديد الموضع",
      ru: "Позиционеры"
    },
    desc: {
      fa: "پوزیشنرهای مورد استفاده در سامانه‌های کنترل ولو",
      en: "Positioners used in control valve systems",
      ar: "أجهزة تحديد الموضع المستخدمة في أنظمة صمامات التحكم",
      ru: "Позиционеры, используемые в системах регулирующих клапанов"
    },
    icon: "Gauge",
    products: []
  },
  {
    id: "control-valve-hook-up",
    parentId: "control-valve-instrumentation",
    name: {
      fa: "هوک‌آپ",
      en: "Hook-up",
      ar: "مجموعات التوصيل",
      ru: "Монтажные комплекты"
    },
    desc: {
      fa: "تجهیزات و مجموعه‌های هوک‌آپ ابزار دقیق برای کنترل ولو",
      en: "Instrumentation hook-up assemblies and accessories for control valves",
      ar: "مجموعات توصيلات أدوات القياس والتحكم لصمامات التحكم",
      ru: "Монтажные комплекты КИПиА для регулирующих клапанов"
    },
    icon: "Package",
    products: []
  }
];

export function getCategory(id) {
  return categories.find((c) => c.id === id);
}

export function getCategoryLabel(category, locale = "fa") {
  if (!category) return "";
  const name = category.name[locale] || category.name.en || category.name.fa || "";
  if (!category.parentId) return name;
  const parent = getCategory(category.parentId);
  if (!parent) return name;
  const parentName = parent.name[locale] || parent.name.fa || parent.name.en || "";
  return `${parentName} / ${name}`;
}

export function isProductCategory(id) {
  const category = getCategory(id);
  return Boolean(category && !category.children);
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
