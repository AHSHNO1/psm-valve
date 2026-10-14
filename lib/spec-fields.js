// Fixed technical-spec fields shared by the public product page and the admin wizard.
// Each product stores values in `product.spec[field.id] = { fa, en, ar, ru }`.
export const SPEC_FIELDS = [
  {
    id: "size",
    label: { fa: "سایز", en: "Size", ar: "المقاس", ru: "Размер" },
    hint: { fa: "مثل: 1 تا 24 اینچ", en: "e.g. 1 to 24 inch", ar: "مثال: من 1 إلى 24 بوصة", ru: "напр. от 1 до 24 дюймов" }
  },
  {
    id: "pressureClass",
    label: { fa: "کلاس فشار", en: "Pressure Class", ar: "فئة الضغط", ru: "Класс давления" },
    hint: { fa: "مثل: ANSI 150 / 300 / 600", en: "e.g. ANSI 150 / 300 / 600", ar: "مثال: ANSI 150 / 300 / 600", ru: "напр. ANSI 150 / 300 / 600" }
  },
  {
    id: "temperature",
    label: { fa: "دمای کاری", en: "Temperature Range", ar: "نطاق الحرارة", ru: "Температурный диапазон" },
    hint: { fa: "مثل: -29 تا 425 درجه سانتیگراد", en: "e.g. -29 to 425 °C", ar: "مثال: -29 إلى 425 °م", ru: "напр. от -29 до 425 °C" }
  },
  {
    id: "bodyMaterial",
    label: { fa: "جنس بدنه", en: "Body Material", ar: "مادة الجسم", ru: "Материал корпуса" },
    hint: { fa: "مثل: فولاد WCB / CF8M", en: "e.g. WCB / CF8M", ar: "مثال: WCB / CF8M", ru: "напр. WCB / CF8M" }
  },
  {
    id: "trimMaterial",
    label: { fa: "جنس قطعات داخلی", en: "Trim Material", ar: "مادة الأجزاء الداخلية", ru: "Материал внутренних деталей" },
    hint: { fa: "مثل: استیل 316 / استلایت", en: "e.g. SS316 / Stellite", ar: "مثال: SS316 / Stellite", ru: "напр. SS316 / Stellite" }
  },
  {
    id: "connection",
    label: { fa: "نوع اتصال", en: "End Connection", ar: "نوع الوصلة", ru: "Тип присоединения" },
    hint: { fa: "مثل: فلنجی / جوشی / وافری", en: "e.g. Flanged / Welded / Wafer", ar: "مثال: مشفّ / ملحوم", ru: "напр. фланцевое / сварное" }
  },
  {
    id: "standard",
    label: { fa: "استاندارد طراحی", en: "Design Standard", ar: "معيار التصميم", ru: "Стандарт проектирования" },
    hint: { fa: "مثل: API 598 / ISO 5208", en: "e.g. API 598 / ISO 5208", ar: "مثال: API 598 / ISO 5208", ru: "напр. API 598 / ISO 5208" }
  },
  {
    id: "industries",
    label: { fa: "صنایع و مشتریان", en: "Industries & Customers", ar: "الصناعات والعملاء", ru: "Отрасли и заказчики" },
    hint: { fa: "مثل: نفت و گاز، نیروگاه", en: "e.g. Oil & gas, power plants", ar: "مثال: النفط والغاز، محطات الطاقة", ru: "напр. нефтегаз, энергетика" }
  }
];

export const SPEC_PENDING = { fa: "به‌زودی", en: "Coming soon", ar: "قريباً", ru: "Скоро" };
