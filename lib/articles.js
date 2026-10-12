export const articles = [
  {
    slug: "valve-sizing-guide",
    title: "راهنمای جامع سایزینگ شیر کنترلی بر اساس IEC 60534",
    excerpt: "آموزش گام‌به‌گام محاسبه Cv، انتخاب سایز مناسب و جلوگیری از کاویتاسیون در شیرهای کنترلی.",
    category: "سایزینگ",
    date: "1404/05/15",
    readTime: "12 دقیقه"
  },
  {
    slug: "cavitation-flashing",
    title: "کاویتاسیون و فلاشینگ در شیرهای کنترلی: علل و راهکارها",
    excerpt: "بررسی پدیده کاویتاسیون، تأثیر آن بر عمر شیر و روش‌های پیشگیری از آن.",
    category: "نگهداری",
    date: "1404/04/28",
    readTime: "10 دقیقه"
  },
  {
    slug: "hvf-coating-benefits",
    title: "پوشش HVOF: انقلابی در افزایش عمر شیرهای صنعتی",
    excerpt: "چگونه پوشش کاربید تنگستن به روش HVOF عمر شیرهای صنعتی را تا 5 برابر افزایش می‌دهد.",
    category: "پوشش‌دهی",
    date: "1404/04/10",
    readTime: "8 دقیقه"
  },
  {
    slug: "material-selection",
    title: "انتخاب متریال مناسب برای بدنه و تریم شیر",
    excerpt: "مقایسه فولاد کربنی، استیل 316، Duplex و آلیاژهای خاص بر اساس شرایط سرویس.",
    category: "متریال",
    date: "1404/03/22",
    readTime: "9 دقیقه"
  },
  {
    slug: "actuator-selection",
    title: "راهنمای انتخاب آبند پنوماتیک و الکتریکی",
    excerpt: "معیارهای انتخاب آبند بر اساس گشتاور، سرعت پاسخ و شرایط محیطی.",
    category: "آبند",
    date: "1404/03/08",
    readTime: "7 دقیقه"
  },
  {
    slug: "valve-maintenance",
    title: "برنامه نگهداری پیشگیرانه شیرهای کنترلی",
    excerpt: "چک‌لیست جامع بازرسی دوره‌ای، تعمیر و کالیبراسیون شیرهای کنترلی.",
    category: "نگهداری",
    date: "1404/02/20",
    readTime: "11 دقیقه"
  }
];

export function getArticle(slug) {
  return articles.find((a) => a.slug === slug);
}