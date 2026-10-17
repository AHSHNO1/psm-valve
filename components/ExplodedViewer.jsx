"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Circle, Cog, SlidersHorizontal, Sparkles, Wind } from "lucide-react";
import { useDictionary } from "./Providers";

const ExplodedValve = dynamic(() => import("./ExplodedValve"), {
  ssr: false,
  loading: () => <Loader />
});
const ExplodedBallValve = dynamic(() => import("./ExplodedBallValve"), {
  ssr: false,
  loading: () => <Loader />
});
const ExplodedHvofRobot = dynamic(() => import("./ExplodedHvofRobot"), {
  ssr: false,
  loading: () => <Loader />
});
const ExplodedButterflyValve = dynamic(() => import("./ExplodedButterflyValve"), {
  ssr: false,
  loading: () => <Loader />
});

function Loader() {
  const { locale } = useDictionary();
  const label = {
    fa: "در حال آماده‌سازی مدل سه‌بعدی…",
    en: "Preparing 3D model…",
    ar: "جارٍ تجهيز النموذج ثلاثي الأبعاد…",
    ru: "Подготовка 3D-модели…"
  }[locale] || "Preparing 3D model…";

  return (
    <div className="grid h-[440px] place-items-center text-sm font-bold sm:h-[520px]" style={{ color: "var(--text-muted)" }}>
      <span className="animate-pulse">{label}</span>
    </div>
  );
}

const COPY = {
  fa: {
    badge: "نمای انفجاری تعاملی",
    titleStart: "اجزای",
    titleEnd: "مهندسی",
    subtitle: "مدل را انتخاب کنید، اجزا را بررسی کنید و نمای انفجاری را با اسلایدر کنترل کنید.",
    inspect: "ساختار محصول",
    interaction: "بکشید: چرخش · کلیک: انتخاب قطعه · اسلایدر: انفجار",
    note: "مدل‌ها شماتیک هستند؛ آرایش قطعات ممکن است با مدل و سفارش واقعی تفاوت داشته باشد.",
    items: {
      globe: {
        label: "شیر کنترلی گلوب",
        title: "شیر کنترلی گلوب",
        desc: "بدنه، کلاهک، قفسه، پلاگ، ساقه و اکچویتور؛ اجزای اصلی یک شیر کنترلی گلوب.",
        accent: "#F5C518",
        icon: Cog,
        features: ["بدنه و کلاهک", "قفسه و پلاگ", "ساقه شیر", "اکچویتور"],
        stats: [["عملکرد", "کنترل جریان"], ["تریم", "پلاگ و قفسه"], ["حرکت", "خطی"]]
      },
      ball: {
        label: "شیر توپی",
        title: "شیر توپی",
        desc: "بدنه، توپ دارای مجرای عبور، نشیمن‌گاه‌ها، ساقه و اتصال‌های انتهایی.",
        accent: "#C0C0C0",
        icon: Circle,
        features: ["بدنه و اتصالات", "توپ با مجرای عبور", "حلقه‌های نشیمن", "ساقه و اتصال"],
        stats: [["عملکرد", "قطع و وصل"], ["عنصر اصلی", "توپ سوراخ‌دار"], ["حرکت", "چرخشی"]]
      },
      kuka: {
        label: "ربات KUKA",
        title: "ربات صنعتی KUKA",
        desc: "پایه، محورها، بازوی مفصلی، مچ و تورچ HVOF در یک آرایش شماتیک.",
        accent: "#E4A900",
        icon: Bot,
        features: ["پایه و محورها", "شانه و بازوی اصلی", "آرنج و مچ", "تورچ و نازل"],
        stats: [["فرآیند", "پوشش‌دهی HVOF"], ["حرکت", "مفصلی"], ["ابزار", "تورچ"]]
      },
      butterfly: {
        label: "شیر پروانه‌ای",
        title: "شیر پروانه‌ای",
        desc: "بدنه ویفری، دیسک، لاینر، ساقه و اکچویتور را بررسی کنید؛ زاویه دیسک را هم تغییر دهید.",
        accent: "#62A8B5",
        icon: Wind,
        features: ["بدنه ویفری", "دیسک چرخان", "لاینر / نشیمن‌گاه", "ساقه و اکچویتور"],
        stats: [["عملکرد", "قطع و وصل"], ["حرکت", "چرخشی"], ["جزء اصلی", "دیسک"]]
      }
    }
  },
  en: {
    badge: "Interactive exploded view",
    titleStart: "Engineering",
    titleEnd: "in detail",
    subtitle: "Choose a model, inspect its components and control the exploded view with the slider.",
    inspect: "Product structure",
    interaction: "Drag: rotate · Click: select part · Slider: explode",
    note: "Illustrative models only. Component arrangement may vary by product model and specification.",
    items: {
      globe: {
        label: "Globe control valve",
        title: "Globe control valve",
        desc: "Explore the main components: body, bonnet, cage, plug, stem and actuator.",
        accent: "#F5C518",
        icon: Cog,
        features: ["Body & bonnet", "Cage & plug", "Valve stem", "Actuator"],
        stats: [["Function", "Flow control"], ["Trim", "Plug & cage"], ["Motion", "Linear"]]
      },
      ball: {
        label: "Ball valve",
        title: "Ball valve",
        desc: "Explore the body, ported ball, seat rings, stem and end connections.",
        accent: "#C0C0C0",
        icon: Circle,
        features: ["Body & connections", "Ported ball", "Seat rings", "Stem & connection"],
        stats: [["Function", "On / off"], ["Closure", "Ported ball"], ["Motion", "Rotary"]]
      },
      kuka: {
        label: "KUKA robot",
        title: "KUKA industrial robot",
        desc: "A schematic view of the base, axes, articulated arm, wrist and HVOF torch.",
        accent: "#E4A900",
        icon: Bot,
        features: ["Base & axes", "Shoulder & upper arm", "Elbow & wrist", "Torch & nozzle"],
        stats: [["Process", "HVOF coating"], ["Motion", "Articulated"], ["Tooling", "Torch"]]
      },
      butterfly: {
        label: "Butterfly valve",
        title: "Butterfly valve",
        desc: "Inspect the wafer body, disc, liner, stem and actuator. Adjust the disc angle to see its operating motion.",
        accent: "#62A8B5",
        icon: Wind,
        features: ["Wafer body", "Rotating disc", "Liner / seat", "Stem & actuator"],
        stats: [["Function", "Isolation"], ["Motion", "Rotary"], ["Main element", "Disc"]]
      }
    }
  },
  ar: {
    badge: "عرض تفجيري تفاعلي",
    titleStart: "المكونات",
    titleEnd: "الهندسية",
    subtitle: "اختر نموذجاً، واستكشف مكوناته، وتحكم في العرض التفجيري باستخدام شريط التمرير.",
    inspect: "بنية المنتج",
    interaction: "اسحب: تدوير · انقر: تحديد جزء · شريط التمرير: تفجير",
    note: "النماذج توضيحية؛ قد يختلف ترتيب المكونات حسب طراز المنتج ومواصفاته.",
    items: {
      globe: {
        label: "صمام تحكم غلوب",
        title: "صمام تحكم غلوب",
        desc: "استكشف المكونات الرئيسية: الجسم والغطاء والقفص والسدادة والساق والمشغل.",
        accent: "#F5C518",
        icon: Cog,
        features: ["الجسم والغطاء", "القفص والسدادة", "ساق الصمام", "المشغل"],
        stats: [["الوظيفة", "التحكم بالتدفق"], ["الأجزاء الداخلية", "السدادة والقفص"], ["الحركة", "خطية"]]
      },
      ball: {
        label: "صمام كروي",
        title: "صمام كروي",
        desc: "استكشف الجسم والكرة المثقوبة وحلقات المقعد والساق ووصلات الأطراف.",
        accent: "#C0C0C0",
        icon: Circle,
        features: ["الجسم والوصلات", "كرة ذات ممر", "حلقات المقعد", "الساق والوصلات"],
        stats: [["الوظيفة", "فتح / إغلاق"], ["عنصر الإغلاق", "كرة مثقوبة"], ["الحركة", "دورانية"]]
      },
      kuka: {
        label: "روبوت KUKA",
        title: "روبوت KUKA صناعي",
        desc: "عرض تخطيطي للقاعدة والمحاور والذراع المفصلي والمعصم وشعلة HVOF.",
        accent: "#E4A900",
        icon: Bot,
        features: ["القاعدة والمحاور", "الكتف والذراع العلوي", "المرفق والمعصم", "الشعلة والفوهة"],
        stats: [["العملية", "طلاء HVOF"], ["الحركة", "مفصلية"], ["الأداة", "الشعلة"]]
      },
      butterfly: {
        label: "صمام فراشة",
        title: "صمام فراشة",
        desc: "استكشف الجسم والقرص والبطانة والساق والمشغل، وغيّر زاوية القرص لمعاينة حركته.",
        accent: "#62A8B5",
        icon: Wind,
        features: ["جسم ويفر", "قرص دوار", "بطانة / مقعد", "ساق ومشغل"],
        stats: [["الوظيفة", "العزل"], ["الحركة", "دورانية"], ["العنصر الرئيسي", "القرص"]]
      }
    }
  },
  ru: {
    badge: "Интерактивный разнесённый вид",
    titleStart: "Инженерия",
    titleEnd: "в деталях",
    subtitle: "Выберите модель, изучите её компоненты и настройте разнесение с помощью ползунка.",
    inspect: "Структура изделия",
    interaction: "Перетаскивание: вращение · щелчок: выбор детали · ползунок: разнесение",
    note: "Модели схематичны; расположение деталей зависит от модели и спецификации изделия.",
    items: {
      globe: {
        label: "Регулирующий клапан Globe",
        title: "Регулирующий клапан Globe",
        desc: "Основные компоненты: корпус, крышка, клетка, плунжер, шток и привод.",
        accent: "#F5C518",
        icon: Cog,
        features: ["Корпус и крышка", "Клетка и плунжер", "Шток клапана", "Привод"],
        stats: [["Назначение", "Контроль потока"], ["Внутренние детали", "Плунжер и клетка"], ["Движение", "Линейное"]]
      },
      ball: {
        label: "Шаровой клапан",
        title: "Шаровой клапан",
        desc: "Рассмотрите корпус, шар с проходным отверстием, седла, шток и концевые соединения.",
        accent: "#C0C0C0",
        icon: Circle,
        features: ["Корпус и соединения", "Шар с проходом", "Кольца седла", "Шток и соединение"],
        stats: [["Назначение", "Вкл. / выкл."], ["Запорный элемент", "Шар с отверстием"], ["Движение", "Вращательное"]]
      },
      kuka: {
        label: "Робот KUKA",
        title: "Промышленный робот KUKA",
        desc: "Схема основания, осей, шарнирной руки, запястья и горелки HVOF.",
        accent: "#E4A900",
        icon: Bot,
        features: ["Основание и оси", "Плечо и верхняя рука", "Локоть и запястье", "Горелка и сопло"],
        stats: [["Процесс", "Покрытие HVOF"], ["Движение", "Шарнирное"], ["Инструмент", "Горелка"]]
      },
      butterfly: {
        label: "Дисковый затвор",
        title: "Дисковый затвор",
        desc: "Изучите корпус wafer, диск, вкладыш, шток и привод; изменяйте угол диска, чтобы увидеть его движение.",
        accent: "#62A8B5",
        icon: Wind,
        features: ["Корпус wafer", "Поворотный диск", "Вкладыш / седло", "Шток и привод"],
        stats: [["Назначение", "Изоляция"], ["Движение", "Вращательное"], ["Главный элемент", "Диск"]]
      }
    }
  }
};

export default function ExplodedViewer({ locale }) {
  const [tab, setTab] = useState("globe");
  const copy = COPY[locale] || COPY.en;
  const active = copy.items[tab];
  const Icon = active.icon;
  const tabOrder = ["globe", "ball", "butterfly", "kuka"];

  return (
    <section className="container-x py-10 sm:py-14">
      <header className="mb-6 text-center">
        <span className="chip"><Sparkles size={12} /> {copy.badge}</span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{copy.titleStart}</span>{" "}
          <span className="heading-gold">{copy.titleEnd}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: "var(--text-soft)" }}>
          {copy.subtitle}
        </p>
      </header>

      <div className="overflow-hidden rounded-[28px] border"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-md)" }}>
        <nav className="flex flex-wrap justify-center gap-2 border-b p-3 sm:justify-start sm:px-5"
          style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}
          aria-label={copy.badge}>
          {tabOrder.map((key) => {
            const item = copy.items[key];
            const TabIcon = item.icon;
            const selected = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={selected}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-all sm:px-4 sm:text-sm"
                style={{
                  background: selected ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
                  borderColor: selected ? "transparent" : "var(--border)",
                  color: selected ? "#17191D" : "var(--text-soft)",
                  boxShadow: selected ? "0 6px 16px rgba(201,149,13,.2)" : "none"
                }}
              >
                <TabIcon size={15} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            key={tab + "-details"}
            initial={{ opacity: 0, x: locale === "fa" || locale === "ar" ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
            className="flex flex-col justify-center p-5 sm:p-7 lg:p-8"
          >
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}>
              <Icon size={15} style={{ color: active.accent }} />
              {copy.inspect}
            </div>
            <h3 className="text-2xl font-black leading-tight sm:text-3xl" style={{ color: "var(--text)" }}>
              {active.title}
            </h3>
            <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--text-soft)" }}>
              {active.desc}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {active.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--text-soft)", background: "var(--bg-soft)" }}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: active.accent }} />
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {active.stats.map(([label, value]) => (
                <div key={label} className="rounded-xl border p-2.5 text-center"
                  style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
                  <div className="text-[9px] font-bold" style={{ color: "var(--text-muted)" }}>{label}</div>
                  <div className="mt-1 text-[11px] font-black leading-snug" style={{ color: "var(--text)" }}>{value}</div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-5" style={{ color: "var(--text-muted)" }}>
              {copy.note}
            </p>
          </motion.div>

          <div className="border-t lg:border-t-0 lg:border-s" style={{
            borderColor: "var(--border)",
            background: "radial-gradient(ellipse at 50% 42%, rgba(224,168,26,.11), transparent 58%), linear-gradient(145deg, var(--bg-soft), var(--bg-card))"
          }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
              style={{ borderColor: "var(--border)", background: "rgba(255,255,255,.025)" }}>
              <div className="flex items-center gap-2 text-xs font-black sm:text-sm" style={{ color: "var(--text)" }}>
                <SlidersHorizontal size={15} style={{ color: active.accent }} />
                {active.label}
              </div>
              <span className="text-[9px] font-semibold sm:text-[10px]" style={{ color: "var(--text-muted)" }}>
                {copy.interaction}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab + "-model"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "globe" && <ExplodedValve />}
                {tab === "ball" && <ExplodedBallValve />}
                {tab === "butterfly" && <ExplodedButterflyValve />}
                {tab === "kuka" && <ExplodedHvofRobot />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
