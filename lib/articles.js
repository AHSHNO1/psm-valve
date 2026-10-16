import { readJSON, writeJSON } from "@/lib/db";

export const articles = [
  {
    slug: "ball-valve-overview",
    title: {
      fa: "بررسی جامع شیرهای توپی",
      en: "A Comprehensive Guide to Ball Valves",
      ar: "دليل شامل للصمامات الكروية",
      ru: "Подробный обзор шаровых клапанов"
    },
    excerpt: {
      fa: "شیرهای توپی از پرکاربردترین شیرهای صنعتی در صنایع نفت، گاز، پتروشیمی، آب و فرایند هستند؛ مکانیزم ساده، آب‌بندی مؤثر و عملکرد سریع، آن‌ها را به گزینه‌ای رایج در طراحی صنعتی تبدیل کرده است.",
      en: "Ball valves are widely used in oil, gas, petrochemical, water and process industries. Their simple mechanism, effective sealing and quick operation make them a common choice in industrial design.",
      ar: "تُستخدم الصمامات الكروية على نطاق واسع في قطاعات النفط والغاز والبتروكيماويات والمياه والعمليات الصناعية. وتجعلها آليتها البسيطة وإحكامها الفعال وسرعة تشغيلها خياراً شائعاً في التصميم الصناعي.",
      ru: "Шаровые клапаны широко применяются в нефтегазовой, нефтехимической, водной и технологической отраслях. Простая конструкция, надежное уплотнение и быстрое срабатывание делают их распространенным выбором в промышленности."
    },
    category: {
      fa: "شیرهای صنعتی",
      en: "Industrial valves",
      ar: "الصمامات الصناعية",
      ru: "Промышленная арматура"
    },
    date: {
      fa: "۱۴۰۵/۰۳/۲۶",
      en: "Jun 16, 2026",
      ar: "16 يونيو 2026",
      ru: "16 июня 2026"
    },
    readMinutes: 6,
    pdfUrl: "/documents/articles/ball-valves.pdf"
  },
  {
    slug: "hp-hvof-thermal-spray",
    title: {
      fa: "معرفی روش پاشش حرارتی ترمال اسپری HP-HVOF",
      en: "Introduction to HP-HVOF Thermal Spray",
      ar: "مقدمة عن الرش الحراري HP-HVOF",
      ru: "Термическое напыление HP-HVOF"
    },
    excerpt: {
      fa: "روش HP-HVOF با استفاده از اکسیژن و سوخت پرفشار و پرسرعت، از روش‌های پیشرفتهٔ مهندسی سطح برای ایجاد پوشش‌های مقاوم در برابر سایش، خوردگی و حرارت است.",
      en: "HP-HVOF uses high-pressure, high-velocity oxygen-fuel combustion to apply protective coatings and is an advanced surface-engineering method for resistance to wear, corrosion and heat.",
      ar: "تستخدم تقنية HP-HVOF احتراق الأكسجين والوقود بضغط وسرعة مرتفعين، وهي طريقة متقدمة لهندسة الأسطح وتطبيق الطلاءات المقاومة للتآكل والاهتراء والحرارة.",
      ru: "HP-HVOF использует высокоскоростное сгорание кислорода и топлива под высоким давлением. Это передовой метод обработки поверхности для нанесения покрытий, устойчивых к износу, коррозии и нагреву."
    },
    category: {
      fa: "پوشش‌دهی",
      en: "Coating",
      ar: "الطلاء",
      ru: "Покрытия"
    },
    date: {
      fa: "۱۴۰۵/۰۳/۲۶",
      en: "Jun 16, 2026",
      ar: "16 يونيو 2026",
      ru: "16 июня 2026"
    },
    readMinutes: 5,
    pdfUrl: "/documents/articles/hp-hvof-thermal-spray.pdf"
  },
  {
    slug: "control-valve-sizing-requirements",
    title: {
      fa: "سایزینگ شیرهای کنترلی و الزامات آن",
      en: "Control Valve Sizing and Its Requirements",
      ar: "تحديد مقاس صمامات التحكم ومتطلباته",
      ru: "Подбор размера регулирующего клапана и требования"
    },
    excerpt: {
      fa: "انتخاب نادرست سایز شیر کنترلی می‌تواند کنترل جریان را در بازشدگی‌های کم ناپایدار کند یا مانع تأمین دبی موردنیاز فرایند شود؛ سایزینگ دقیق بخش مهمی از طراحی پایپینگ و ابزار دقیق است.",
      en: "Incorrect control valve sizing can make flow unstable at low openings or prevent the required process flow. Accurate sizing is an important part of piping and instrumentation design.",
      ar: "قد يؤدي اختيار مقاس غير مناسب لصمام التحكم إلى عدم استقرار التدفق عند الفتحات المنخفضة أو عدم تلبية معدل التدفق المطلوب للعملية. ويُعد تحديد المقاس بدقة جزءاً مهماً من تصميم الأنابيب والأجهزة.",
      ru: "Неправильный подбор размера регулирующего клапана может привести к нестабильному потоку при малом открытии или не обеспечить требуемый расход. Точный расчет важен для проектирования трубопроводов и КИП."
    },
    category: {
      fa: "سایزینگ",
      en: "Sizing",
      ar: "تحديد المقاس",
      ru: "Подбор размера"
    },
    date: {
      fa: "۱۴۰۵/۰۳/۲۶",
      en: "Jun 16, 2026",
      ar: "16 يونيو 2026",
      ru: "16 июня 2026"
    },
    readMinutes: 5,
    pdfUrl: "/documents/articles/control-valve-sizing.pdf"
  },
  {
    slug: "valve-sizing-guide",
    title: "راهنمای جامع سایزینگ شیر کنترلی بر اساس IEC 60534",
    excerpt: "آموزش گام‌به‌گام محاسبه Cv، انتخاب سایز مناسب و جلوگیری از کاویتاسیون در شیرهای کنترلی.",
    category: "سایزینگ",
    date: "1404/05/15",
    readTime: "12 دقیقه",
    active: false
  },
  {
    slug: "cavitation-flashing",
    title: "کاویتاسیون و فلاشینگ در شیرهای کنترلی: علل و راهکارها",
    excerpt: "بررسی پدیده کاویتاسیون، تأثیر آن بر عمر شیر و روش‌های پیشگیری از آن.",
    category: "نگهداری",
    date: "1404/04/28",
    readTime: "10 دقیقه",
    active: false
  },
  {
    slug: "hvf-coating-benefits",
    title: "پوشش HVOF: انقلابی در افزایش عمر شیرهای صنعتی",
    excerpt: "چگونه پوشش کاربید تنگستن به روش HVOF عمر شیرهای صنعتی را تا 5 برابر افزایش می‌دهد.",
    category: "پوشش‌دهی",
    date: "1404/04/10",
    readTime: "8 دقیقه",
    active: false
  },
  {
    slug: "material-selection",
    title: "انتخاب متریال مناسب برای بدنه و تریم شیر",
    excerpt: "مقایسه فولاد کربنی، استیل 316، Duplex و آلیاژهای خاص بر اساس شرایط سرویس.",
    category: "متریال",
    date: "1404/03/22",
    readTime: "9 دقیقه",
    active: false
  },
  {
    slug: "actuator-selection",
    title: "راهنمای انتخاب آبند پنوماتیک و الکتریکی",
    excerpt: "معیارهای انتخاب آبند بر اساس گشتاور، سرعت پاسخ و شرایط محیطی.",
    category: "آبند",
    date: "1404/03/08",
    readTime: "7 دقیقه",
    active: false
  },
  {
    slug: "valve-maintenance",
    title: "برنامه نگهداری پیشگیرانه شیرهای کنترلی",
    excerpt: "چک‌لیست جامع بازرسی دوره‌ای، تعمیر و کالیبراسیون شیرهای کنترلی.",
    category: "نگهداری",
    date: "1404/02/20",
    readTime: "11 دقیقه",
    active: false
  }
];

export function getArticles() {
  return readJSON("articles.json", articles) || articles;
}

export function saveArticles(list) {
  writeJSON("articles.json", list);
  return list;
}

export function getArticle(slug) {
  return getArticles().find((a) => a.slug === slug);
}