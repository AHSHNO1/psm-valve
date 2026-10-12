export const services = [
  {
    slug: "design-manufacturing",
    icon: "Cog",
    name: { fa: "طراحی و ساخت شیر", en: "Valve Design & Manufacturing", ar: "تصميم وتصنيع الصمامات", ru: "Проектирование и производство" },
    short: { fa: "طراحی و ساخت شیرهای کنترلی با استانداردهای جهانی", en: "Design and manufacture of control valves to global standards", ar: "تصميم وتصنيع صمامات التحكم وفق المعايير العالمية", ru: "Проектирование и производство регулирующих клапанов" }
  },
  {
    slug: "calibration",
    icon: "Gauge",
    name: { fa: "کالیبراسیون شیر", en: "Valve Calibration", ar: "معايرة الصمامات", ru: "Калибровка клапанов" },
    short: { fa: "کالیبراسیون دقیق شیرهای کنترلی در محل و کارخانه", en: "Precise on-site and factory calibration of control valves", ar: "معايرة دقيقة في الموقع والمصنع", ru: "Точная калибровка на месте и на заводе" }
  },
  {
    slug: "repair-refurbishment",
    icon: "Wrench",
    name: { fa: "تعمیر و بازسازی", en: "Repair & Refurbishment", ar: "الإصلاح والتجديد", ru: "Ремонт и восстановление" },
    short: { fa: "تعمیر و بازسازی کامل شیرهای کنترلی فرسوده", en: "Complete repair and refurbishment of worn control valves", ar: "إصلاح وتجديد كامل للصمامات المتآكلة", ru: "Полный ремонт и восстановление изношенных клапанов" }
  },
  {
    slug: "ball-grinding",
    icon: "Circle",
    name: { fa: "سنگ‌زنی توپی", en: "Ball Grinding", ar: "طحن الكرة", ru: "Шлифовка шара" },
    short: { fa: "سنگ‌زنی دقیق توپی شیرهای صنعتی با دقت میکرون", en: "Precision ball grinding with micron accuracy", ar: "طحن دقيق للكرة بدقة ميكرون", ru: "Точная шлифовка шара с микронной точностью" }
  },
  {
    slug: "hvf-coating",
    icon: "Flame",
    name: { fa: "پوشش‌دهی HVOF", en: "HVOF Coating", ar: "طلاء HVOF", ru: "Покрытие HVOF" },
    short: { fa: "پوشش کاربید تنگستن با فرآیند HVOF برای مقاومت سایشی", en: "Tungsten carbide HVOF coating for wear resistance", ar: "طلاء كربيد التنغستن لمقاومة التآكل", ru: "Покрытие карбидом вольфрама для износостойкости" }
  },
  {
    slug: "field-services",
    icon: "Truck",
    name: { fa: "خدمات در محل", en: "Field Services", ar: "الخدمات الميدانية", ru: "Выездные услуги" },
    short: { fa: "اعزام تیم فنی برای بازرسی، تعمیر و راه‌اندازی در محل", en: "Field team for inspection, repair and commissioning", ar: "فريق ميداني للفحص والإصلاح", ru: "Выездная команда для осмотра и ремонта" }
  }
];

export function getService(slug) {
  return services.find((s) => s.slug === slug);
}
