export const categories = [
  {
    id: "control-valves",
    name: { fa: "شیرهای کنترلی", en: "Control Valves" },
    desc: {
      fa: "شیرهای کنترلی با دقت بالا برای تنظیم جریان سیال",
      en: "High-precision control valves for fluid flow regulation"
    },
    icon: "Gauge",
    products: [
      { slug: "rotary-globe-62000", series: "62000", name: { fa: "شیر دوار گلوب 62000", en: "Rotary Globe Valve 62000" }, short: { fa: "ترکیب گلوب–چرخشی با دقت بالا", en: "Globe-rotary design with high accuracy" } },
      { slug: "butterfly-control-53000", series: "53000", name: { fa: "شیر کنترلی پروانهای 53000", en: "Butterfly Control Valve 53000" }, short: { fa: "کنترل و قطع و وصل گازها، مایعات و سیالات دارای ذرات", en: "Control and on/off for gas, liquid and slurry" } },
      { slug: "piston-valve-10000", series: "10000", name: { fa: "شیر پیستونی 10000", en: "Piston Valve 10000" }, short: { fa: "آببندی پیستونی–حلقهای بدون نشتی", en: "Leak-free piston and seal ring sealing" } },
      { slug: "globe-control-38000", series: "38000", name: { fa: "شیر کنترلی گلوب 38000", en: "Globe Control Valve 38000" }, short: { fa: "کنترل یکنواخت و پایدار جریان", en: "Smooth and stable flow control" } },
      { slug: "spherical-globe-51000", series: "51000", name: { fa: "شیر گلوب ولو کنترلی 51000", en: "Spherical Globe Control Valve 51000" }, short: { fa: "مناسب صنایع نفت، گاز، پتروشیمی و نیروگاه", en: "For oil, gas, petrochemical and power industries" } },
      { slug: "rotary-plug-31000", series: "31000", name: { fa: "شیر گلوب ولو کنترلی 31000", en: "Rotary Plug Control Valve 31000" }, short: { fa: "دقت بالا با آببندی مطمئن", en: "High accuracy with reliable sealing" } }
    ]
  },
  {
    id: "ball-valves",
    name: { fa: "شیرهای توپی", en: "Ball Valves" },
    desc: {
      fa: "شیرهای توپی کنترلی و قطع و وصل جریان",
      en: "Ball control and isolation valves"
    },
    icon: "Circle",
    products: [
      { slug: "ball-valve-46000", series: "46000", name: { fa: "شیر توپی کنترلی 46000", en: "Ball Control Valve 46000" }, short: { fa: "چرخش ۹۰ درجه برای سیالات تمیز، آلوده و خورنده", en: "90° quarter-turn for clean, dirty and corrosive fluids" } },
      { slug: "ball-control-45000", series: "45000", name: { fa: "شیر کنترل توپی 45000", en: "Ball Control Valve 45000" }, short: { fa: "دقت بالا در تنظیم دبی و فشار", en: "High accuracy in flow and pressure regulation" } }
    ]
  },
  {
    id: "high-temp-valves",
    name: { fa: "شیرهای کنترلی دمای بالا", en: "High-Temperature Control Valves" },
    desc: {
      fa: "کنترل فشار، دبی و دما در سرویسهای با انرژی بالا",
      en: "Pressure, flow and temperature control for high-energy services"
    },
    icon: "Flame",
    products: [
      { slug: "letdown-66000", series: "66000", name: { fa: "شیر کنترلی دما بالا لتدان 66000", en: "High-Temperature Letdown Control Valve 66000" }, short: { fa: "کنترل دقیق فشار و دبی در دمای بالا", en: "Precise pressure and flow control at high temperature" } },
      { slug: "desuperheater-65000", series: "65000", name: { fa: "شیر کنترلی دما بالا دیسوپرهیتر 65000", en: "High-Temperature Desuperheater Control Valve 65000" }, short: { fa: "تبدیل بخار اشباع به بخار خشک", en: "Converts saturated steam to dry steam" } }
    ]
  },
  {
    id: "pressure-regulating-valves",
    name: { fa: "شیرهای تنظیم فشار (سری 70000)", en: "Pressure Regulating Valves (70000 Series)" },
    desc: {
      fa: "حفظ، کاهش و تخلیه فشار برای شرایط عملیاتی ایمن",
      en: "Pressure sustaining, reducing and relief for safe operation"
    },
    icon: "ShieldAlert",
    products: [
      { slug: "pressure-regulator-70000-a", series: "70000", name: { fa: "شیر تنظیم کننده (سری 70000) نوع A", en: "Pressure Regulating Valve (70000 Series) Type A" }, short: { fa: "شیرهای حفظ، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } },
      { slug: "pressure-regulator-70000-b", series: "70000", name: { fa: "شیر تنظیم (سری 70000) نوع B", en: "Pressure Regulating Valve (70000 Series) Type B" }, short: { fa: "حفظ فشار و کاهنده فشار", en: "Pressure sustaining and pressure reducing" } },
      { slug: "pressure-regulator-70000-cd", series: "70000", name: { fa: "شیر تنظیم فشار (سری 70000) نوع C و D", en: "Pressure Regulating Valve (70000 Series) Types C & D" }, short: { fa: "شیرهای حفظ، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } },
      { slug: "pressure-regulator-70000-e", series: "70000", name: { fa: "شیر تنظیم (سری 70000) نوع E", en: "Pressure Regulating Valve (70000 Series) Type E" }, short: { fa: "شیرهای حفظ، کاهش و تخلیه فشار", en: "Pressure sustaining, reducing and relief" } }
    ]
  },
  {
    id: "recirculation-valves",
    name: { fa: "شیرهای گردش مجدد پمپ (سری 90000)", en: "Pump Recirculation Valves (90000 Series)" },
    desc: {
      fa: "محافظت پمپهای گریز از مرکز در بار کم",
      en: "Protection of centrifugal pumps at low load"
    },
    icon: "Cylinder",
    products: [
      { slug: "arc-valve-90000", series: "90000", name: { fa: "شیر قوسی (سری 90000) نوع A و B", en: "Arc Valve (90000 Series) Types A & B" }, short: { fa: "گردش خودکار سیال برای محافظت پمپ", en: "Automatic fluid recirculation to protect the pump" } }
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

