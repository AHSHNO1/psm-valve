export const services = [
  {
    slug: "special-valve-design",
    icon: "Cog",
    name: { fa: "طراحی و ساخت شیرآلات خاص", en: "Special Valve Design & Manufacture" },
    short: { fa: "طراحی و ساخت شیرآلات خاص مانند شیرهای دیسوپرهیتر و شیرهای تخلیه", en: "Design and manufacture of special valves such as desuperheater and drain valves" }
  },
  {
    slug: "lop-test",
    image: "/images/services/lop-test.png",
    icon: "Gauge",
    name: { fa: "تست حلقه شیر کنترل", en: "Control Valve Loop Test" },
    short: { fa: "میز تست ویژه و انحصاری شیر کنترل (سایز ۱ تا ۲۴ اینچ، کلاس ۱۵۰ تا ۲۵۰۰)", en: "Exclusive control valve loop test bench (1 to 24 inch, class 150 to 2500)" }
  },
  {
    slug: "valve-pattern-making",
    image: "/images/services/valve-pattern-making.png",
    icon: "Settings",
    name: { fa: "الگوسازی شیر", en: "Valve Pattern Making" },
    short: { fa: "الگوسازی حرفهای با تکیه بر تجربه، نرمافزارهای پیشرفته و دانش فنی متخصصان", en: "Professional pattern making based on experience, advanced software and expert engineering" }
  },
  {
    slug: "hvf-coating",
    image: "/images/services/hvf-coating.png",
    icon: "Flame",
    name: { fa: "پوششدهی HVOF", en: "HVOF Coating" },
    short: { fa: "پوشش به روش HVOF، یکی از محبوبترین فناوریهای پاشش حرارتی با کیفیت برتر", en: "HVOF thermal spray coating, one of the most popular thermal spray technologies with superior quality" }
  },
  {
    slug: "lapped-ball-valves",
    image: "/images/services/lapped-ball-valves.png",
    icon: "Circle",
    name: { fa: "سنگزنی و لپزنی شیرهای توپی", en: "Lapped Ball Valves" },
    short: { fa: "سنگزنی و لپزنی انواع شیرهای صنعتی با صافی ۰٫۲ میکرون و دقت کروی ۲ میکرون در ابعاد ۱/۲ تا ۳۲ اینچ", en: "Grinding and lapping of industrial valves with 0.2 micron finish and 2 micron sphericity, sizes 1/2 to 32 inch" }
  },
  {
    slug: "reverse-engineering",
    image: "/images/services/reverse-engineering.png",
    icon: "Settings",
    name: { fa: "مهندسی معکوس", en: "Reverse Engineering" },
    short: { fa: "بازطراحی شیر از روی محصول موجود با انطباق با آخرین بازنگری استانداردها", en: "Re-creating valve designs from existing products in line with the latest standard revisions" }
  },
  {
    slug: "valve-repair",
    icon: "Wrench",
    name: { fa: "تعمیرات تخصصی شیرآلات", en: "Specialized Valve Repair" },
    short: { fa: "تعمیر انواع شیرآلات از جمله شیرهای کنترلی، شیرهای باز/بست و شیرهای توپی", en: "Repair of all valve types including control, gate and ball valves" }
  },
  {
    slug: "standard-valve-testing",
    icon: "Gauge",
    name: { fa: "تست استاندارد شیرآلات", en: "Standard Valve Testing" },
    short: { fa: "۵ میز تست هیدرواستاتیک و نشتی (۱/۲ تا ۳۲ اینچ) و تست ظرفیت (۱ تا ۲۴ اینچ)", en: "5 hydrostatic and leakage test benches (1/2 to 32 inch) and capacity testing (1 to 24 inch)" }
  }
];

export function getService(slug) {
  return services.find((s) => s.slug === slug);
}
