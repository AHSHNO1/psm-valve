"use client";
import { useState } from "react";

const DN_NPS_DATA = [
  { dn: "DN15",  nps: '1/2"',  mm: 15,  inch: 0.5 },
  { dn: "DN20",  nps: '3/4"',  mm: 20,  inch: 0.75 },
  { dn: "DN25",  nps: '1"',    mm: 25,  inch: 1 },
  { dn: "DN40",  nps: '1-1/2"',mm: 40,  inch: 1.5 },
  { dn: "DN50",  nps: '2"',    mm: 50,  inch: 2 },
  { dn: "DN80",  nps: '3"',    mm: 80,  inch: 3 },
  { dn: "DN100", nps: '4"',    mm: 100, inch: 4 },
  { dn: "DN150", nps: '6"',    mm: 150, inch: 6 },
  { dn: "DN200", nps: '8"',    mm: 200, inch: 8 },
  { dn: "DN250", nps: '10"',   mm: 250, inch: 10 },
  { dn: "DN300", nps: '12"',   mm: 300, inch: 12 },
  { dn: "DN350", nps: '14"',   mm: 350, inch: 14 },
  { dn: "DN400", nps: '16"',   mm: 400, inch: 16 },
  { dn: "DN450", nps: '18"',   mm: 450, inch: 18 },
  { dn: "DN500", nps: '20"',   mm: 500, inch: 20 },
  { dn: "DN600", nps: '24"',   mm: 600, inch: 24 }
];

const ANSI_PN_DATA = [
  { ansi: "150",  pn: "PN20",  bar: 19.6,  psi: 285 },
  { ansi: "300",  pn: "PN50",  bar: 51.1,  psi: 740 },
  { ansi: "400",  pn: "PN64",  bar: 68.9,  psi: 1000 },
  { ansi: "600",  pn: "PN100", bar: 102.1, psi: 1480 },
  { ansi: "900",  pn: "PN150", bar: 153.2, psi: 2220 },
  { ansi: "1500", pn: "PN250", bar: 255.3, psi: 3705 },
  { ansi: "2500", pn: "PN420", bar: 425.5, psi: 6170 }
];

const CV_KV_DATA = [
  { cv: 1,    kv: 0.86 },
  { cv: 10,   kv: 8.6 },
  { cv: 50,   kv: 43.3 },
  { cv: 100,  kv: 86.5 },
  { cv: 500,  kv: 432.5 },
  { cv: 1000, kv: 865.0 },
  { cv: 5000, kv: 4325.0 }
];

const TEMP_DATA = [
  { c: -196, f: -321, k: 77 },
  { c: -100, f: -148, k: 173 },
  { c: -46,  f: -51,  k: 227 },
  { c: -29,  f: -20,  k: 244 },
  { c: 0,    f: 32,   k: 273 },
  { c: 25,   f: 77,   k: 298 },
  { c: 100,  f: 212,  k: 373 },
  { c: 200,  f: 392,  k: 473 },
  { c: 425,  f: 797,  k: 698 },
  { c: 540,  f: 1004, k: 813 }
];

const TEST_PRESSURE_DATA = ANSI_PN_DATA
  .filter(function(d) { return d.ansi !== "400"; })
  .map(function(d) {
    return { class: d.ansi, ratingBar: d.bar, ratingPsi: d.psi };
  });

const TEST_DURATION_DATA = [
  { nps: '1/2"–2"', dn: "DN15–DN50", shell: 15, backseat: 15, leakage: 15 },
  { nps: '2 1/2"–6"', dn: "DN65–DN150", shell: 60, backseat: 15, leakage: 30 },
  { nps: '8"–12"', dn: "DN200–DN300", shell: 120, backseat: 30, leakage: 60 },
  { nps: '14" and larger', dn: "DN350 and larger", shell: 300, backseat: 30, leakage: 120 }
];

const MATERIAL_GROUP_DATA = [
  { group: "1.x" },
  { group: "2.x" },
  { group: "3.x" }
];

function DataTable({ headers, rows, accent }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border)" }}>
      <table style={{
        width: "100%",
        minWidth: headers.length >= 5 ? 780 : headers.length === 3 ? 600 : 0,
        borderCollapse: "collapse",
        fontSize: 12.5
      }}>
        <thead>
          <tr style={{ background: accent + "12" }}>
            {headers.map(function(h, i) {
              return (
                <th key={i} style={{
                  padding: "10px 14px",
                  textAlign: "center",
                  fontWeight: 900,
                  color: accent,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border)"
                }}>{h}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(function(row, i) {
            return (
              <tr key={i} style={{
                background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-soft)"
              }}>
                {row.map(function(cell, j) {
                  return (
                    <td key={j} style={{
                      padding: "9px 14px",
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                      fontWeight: j === 0 ? 900 : 700,
                      color: j === 0 ? accent : "var(--text)",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                      fontSize: 12,
                      direction: "ltr"
                    }}>{cell}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StandardsTable({ locale }) {
  const [tab, setTab] = useState("dn");

  const L = {
    fa: {
      title: "جدول استانداردهای مهندسی",
      subtitle: "مرجع سریع برای تبدیل واحدها و استانداردهای صنعتی",
      dnTab: "قطر (DN ↔ NPS)",
      pressureTab: "فشار (ANSI ↔ PN)",
      cvTab: "ضریب جریان (Cv ↔ Kv)",
      tempTab: "دما (°C ↔ °F ↔ K)",
      dnHeaders: ["DN (mm)", "NPS (inch)", "mm", "inch"],
      pressureHeaders: ["ANSI Class", "PN", "bar", "psi"],
      cvHeaders: ["Cv", "Kv"],
      tempHeaders: ["°C", "°F", "K"],
      testPressureTab: "فشار تست شیر",
      testDurationTab: "زمان تست",
      leakageTab: "نشتی مجاز",
      materialTab: "گروه متریال",
      testPressureHeaders: ["کلاس فشاری", "فشار نامی در 38°C (bar)", "Shell Test (bar)", "Shell Test (psi)", "High-Pressure Closure (bar)", "High-Pressure Closure (psi)"],
      testDurationHeaders: ["سایز شیر (NPS)", "سایز اسمی (DN)", "Shell Test (s)", "Backseat Test (s)", "Closure / Leakage Test (s)"],
      leakageHeaders: ["نوع نشیمن / شیر", "حداکثر نشتی مجاز در تست مایع"],
      materialHeaders: ["گروه خانواده در ASME B16.34", "خانواده متریال", "نمونه گریدها", "کاربرد اولیه"],
      leakageRows: [
        ["شیر قطع‌و‌وصل با سیت نرم / الاستومری", "بدون نشتی قابل مشاهده"],
        ["شیر قطع‌و‌وصل با سیت فلزی (تست مایع)", "۱۰ قطره در دقیقه × NPS (اینچ)"],
        ["شیر یک‌طرفه با سیت فلزی (تست مایع)", "۴۰ قطره در دقیقه × NPS (اینچ)"]
      ],
      materialFamilies: ["فولادهای کربنی و کم‌آلیاژ", "فولادهای زنگ‌نزن", "آلیاژهای پرآلیاژ و پایه‌نیکل"],
      materialExamples: ["A105، A216 WCB/WCC، A350 LF2، A217 WC6/WC9، A182 F11/F22", "A182 F304/F316/F321، A351 CF8/CF8M/CF8C، گریدهای داپلکس", "گریدهای پرآلیاژ و پایه‌نیکل ASTM/ASME مندرج در ویرایش مربوط B16.34"],
      materialUses: ["سرویس عمومی؛ دما و فشار مجاز را برای گرید دقیق بررسی کنید.", "سرویس خورنده یا نیازمند مقاومت خوردگی؛ سازگاری با سیال را ارزیابی کنید.", "سرویس‌های خورنده یا دمایی خاص؛ انتخاب بر اساس داده‌های خوردگی و ریتینگ."],
      pressureNote: "فشارهای تست از ضرایب حداقل API 598 و فشار نامی گروه 1.1 در ASME B16.34 در دمای 38°C محاسبه شده‌اند. فشار نامی با گروه متریال و دما تغییر می‌کند؛ پیش از تست، ویرایش استاندارد، سیال تست و روش سازنده را بررسی کنید.",
      durationNote: "مدت‌های حداقل API 598 برای مرجع سریع هستند. تست قابل اعمال و مدت آن به نوع شیر، سایز و مشخصات خرید بستگی دارد.",
      leakageNote: "حد مجاز نشتی در API 598 به طراحی شیر، سایز، سیال و روش تست وابسته است. مقادیر بالا برای نشتی سیت نرم و تست مایع سیت فلزی، مرجع سریع‌اند و جایگزین استاندارد جاری یا کلاس پذیرش مشخص‌شده نیستند.",
      materialNote: "این‌ها مثال‌های گروه‌بندی خانواده‌ای هستند و فهرست کامل گروه‌های متریال ASME B16.34 نیستند. گروه/زیرگروه دقیق گرید ASTM/ASME، شکل محصول و ویرایش استاندارد را کنترل کنید؛ سپس ریتینگ فشار-دما و سازگاری خوردگی را بررسی کنید."
    },
    en: {
      title: "Engineering Standards Tables",
      subtitle: "Quick reference for unit conversion and industrial standards",
      dnTab: "Diameter (DN ↔ NPS)",
      pressureTab: "Pressure (ANSI ↔ PN)",
      cvTab: "Flow Coefficient (Cv ↔ Kv)",
      tempTab: "Temperature (°C ↔ °F ↔ K)",
      dnHeaders: ["DN (mm)", "NPS (inch)", "mm", "inch"],
      pressureHeaders: ["ANSI Class", "PN", "bar", "psi"],
      cvHeaders: ["Cv", "Kv"],
      tempHeaders: ["°C", "°F", "K"],
      testPressureTab: "Valve Test Pressure",
      testDurationTab: "Test Duration",
      leakageTab: "Permissible Leakage",
      materialTab: "Material Groups",
      testPressureHeaders: ["Pressure Class", "Rated at 38°C (bar)", "Shell Test (bar)", "Shell Test (psi)", "High-Pressure Closure (bar)", "High-Pressure Closure (psi)"],
      testDurationHeaders: ["Valve size (NPS)", "Nominal size (DN)", "Shell Test (s)", "Backseat Test (s)", "Closure / Leakage Test (s)"],
      leakageHeaders: ["Seat / valve type", "Maximum allowable leakage during liquid test"],
      materialHeaders: ["ASME B16.34 family group", "Material family", "Representative grades", "Typical selection guidance"],
      leakageRows: [
        ["Soft / resilient-seated isolation valve", "No visible leakage"],
        ["Metal-seated isolation valve (liquid test)", "10 drops/min × NPS (inches)"],
        ["Metal-seated check valve (liquid test)", "40 drops/min × NPS (inches)"]
      ],
      materialFamilies: ["Carbon and low-alloy steels", "Stainless steels", "High-alloy and nickel-base materials"],
      materialExamples: ["A105, A216 WCB/WCC, A350 LF2, A217 WC6/WC9, A182 F11/F22", "A182 F304/F316/F321, A351 CF8/CF8M/CF8C, duplex grades", "ASTM/ASME high-alloy and nickel-base grades listed in the applicable B16.34 edition"],
      materialUses: ["General service; verify the rating for the exact grade.", "Corrosive service or enhanced corrosion resistance; check fluid compatibility.", "Special corrosive or temperature service; select against corrosion and rating data."],
      pressureNote: "Test pressures are calculated from API 598 minimum multipliers and the ASME B16.34 Group 1.1 rating at 38°C. Ratings vary by material group and temperature; verify the applicable edition, test medium, and manufacturer procedure before testing.",
      durationNote: "API 598 minimum durations are quick-reference values. The applicable test and duration depend on valve type, size, and the governing purchase specification.",
      leakageNote: "API 598 leakage limits depend on valve design, size, test medium, and test method. The soft-seat and metal-seat liquid-test rates above are a quick reference, not a substitute for the current standard or specified acceptance class.",
      materialNote: "These are family-level examples, not a complete ASME B16.34 material-group listing. Confirm the exact group/subgroup for the specified ASTM/ASME grade, product form, and edition, then check its pressure-temperature rating and corrosion compatibility."
    },
    ar: {
      title: "جداول المعايير الهندسية",
      subtitle: "مرجع سريع لتحويل الوحدات",
      dnTab: "القطر",
      pressureTab: "الضغط",
      cvTab: "Cv ↔ Kv",
      tempTab: "الحرارة",
      dnHeaders: ["DN", "NPS", "mm", "inch"],
      pressureHeaders: ["ANSI", "PN", "bar", "psi"],
      cvHeaders: ["Cv", "Kv"],
      tempHeaders: ["°C", "°F", "K"],
      testPressureTab: "ضغط اختبار الصمام",
      testDurationTab: "مدة الاختبار",
      leakageTab: "التسرب المسموح",
      materialTab: "مجموعات المواد",
      testPressureHeaders: ["فئة الضغط", "الضغط الاسمي عند 38°C (bar)", "اختبار الجسم (bar)", "اختبار الجسم (psi)", "اختبار الإغلاق عالي الضغط (bar)", "اختبار الإغلاق عالي الضغط (psi)"],
      testDurationHeaders: ["حجم الصمام (NPS)", "الحجم الاسمي (DN)", "اختبار الجسم (ث)", "اختبار الغطاء الخلفي (ث)", "اختبار الإغلاق / التسرب (ث)"],
      leakageHeaders: ["نوع المقعد / الصمام", "أقصى تسرب مسموح في اختبار السائل"],
      materialHeaders: ["مجموعة العائلة وفق ASME B16.34", "عائلة المواد", "درجات نموذجية", "إرشاد اختيار أولي"],
      leakageRows: [
        ["صمام عزل بمقعد لين / مرن", "لا يوجد تسرب مرئي"],
        ["صمام عزل بمقعد معدني (اختبار سائل)", "10 قطرات/دقيقة × NPS (بوصة)"],
        ["صمام عدم رجوع بمقعد معدني (اختبار سائل)", "40 قطرة/دقيقة × NPS (بوصة)"]
      ],
      materialFamilies: ["الفولاذ الكربوني ومنخفض السبائك", "الفولاذ المقاوم للصدأ", "السبائك العالية وسبائك النيكل"],
      materialExamples: ["A105، A216 WCB/WCC، A350 LF2، A217 WC6/WC9، A182 F11/F22", "A182 F304/F316/F321، A351 CF8/CF8M/CF8C، درجات دوبلكس", "درجات ASTM/ASME عالية السبائك والنيكل المدرجة في إصدار B16.34 المعمول به"],
      materialUses: ["خدمة عامة؛ تحقق من التصنيف للدرجة المحددة.", "خدمة تآكل أو حاجة لمقاومة أعلى؛ تحقق من توافق المائع.", "خدمات تآكل أو حرارة خاصة؛ اختر وفق بيانات التآكل والتصنيف."],
      pressureNote: "ضغوط الاختبار محسوبة من معاملات الحد الأدنى في API 598 وتصنيف مجموعة 1.1 في ASME B16.34 عند 38°C. يتغير التصنيف حسب مجموعة المواد ودرجة الحرارة؛ تحقق من الإصدار ووسط الاختبار وإجراء الشركة المصنعة قبل الاختبار.",
      durationNote: "المدد الدنيا وفق API 598 مرجع سريع. يعتمد الاختبار والمدة المطبقان على نوع الصمام والحجم ومواصفات الشراء.",
      leakageNote: "تعتمد حدود التسرب في API 598 على تصميم الصمام والحجم ووسط الاختبار وطريقته. القيم أعلاه للمقعد اللين واختبار السائل للمقعد المعدني مرجعية وليست بديلاً عن الإصدار الحالي أو فئة القبول المحددة.",
      materialNote: "هذه أمثلة على مستوى عائلة المواد وليست قائمة كاملة لمجموعات ASME B16.34. تحقق من المجموعة/المجموعة الفرعية الدقيقة لدرجة ASTM/ASME وشكل المنتج والإصدار، ثم تحقق من تصنيف الضغط والحرارة والتوافق مع التآكل."
    },
    ru: {
      title: "Инженерные стандарты",
      subtitle: "Быстрый справочник",
      dnTab: "Диаметр",
      pressureTab: "Давление",
      cvTab: "Cv ↔ Kv",
      tempTab: "Температура",
      dnHeaders: ["DN", "NPS", "mm", "inch"],
      pressureHeaders: ["ANSI", "PN", "bar", "psi"],
      cvHeaders: ["Cv", "Kv"],
      tempHeaders: ["°C", "°F", "K"],
      testPressureTab: "Испытательное давление",
      testDurationTab: "Длительность испытаний",
      leakageTab: "Допустимая утечка",
      materialTab: "Группы материалов",
      testPressureHeaders: ["Класс давления", "Номинал при 38°C (bar)", "Испытание корпуса (bar)", "Испытание корпуса (psi)", "Закрытие при высоком давлении (bar)", "Закрытие при высоком давлении (psi)"],
      testDurationHeaders: ["Размер клапана (NPS)", "Номинальный размер (DN)", "Корпус (с)", "Заднее уплотнение (с)", "Закрытие / утечка (с)"],
      leakageHeaders: ["Тип седла / клапана", "Максимальная утечка при испытании жидкостью"],
      materialHeaders: ["Семейная группа ASME B16.34", "Семейство материалов", "Типовые марки", "Начальная рекомендация"],
      leakageRows: [
        ["Запорный клапан с мягким / эластичным седлом", "Видимая утечка не допускается"],
        ["Клапан с металлическим седлом (испытание жидкостью)", "10 капель/мин × NPS (дюймы)"],
        ["Обратный клапан с металлическим седлом (испытание жидкостью)", "40 капель/мин × NPS (дюймы)"]
      ],
      materialFamilies: ["Углеродистые и низколегированные стали", "Нержавеющие стали", "Высоколегированные и никелевые сплавы"],
      materialExamples: ["A105, A216 WCB/WCC, A350 LF2, A217 WC6/WC9, A182 F11/F22", "A182 F304/F316/F321, A351 CF8/CF8M/CF8C, дуплексные марки", "Марки ASTM/ASME высоколегированных и никелевых сплавов из применимой редакции B16.34"],
      materialUses: ["Общие условия; проверьте рейтинг конкретной марки.", "Коррозионная среда или повышенная стойкость; проверьте совместимость.", "Особые коррозионные или температурные условия; выбор по данным стойкости и рейтинга."],
      pressureNote: "Испытательные давления рассчитаны по минимальным коэффициентам API 598 и рейтингу группы 1.1 ASME B16.34 при 38°C. Рейтинг зависит от группы материала и температуры; перед испытанием проверьте применимую редакцию, среду и процедуру изготовителя.",
      durationNote: "Минимальная длительность по API 598 приведена для справки. Применимые испытания и время зависят от типа клапана, размера и спецификации закупки.",
      leakageNote: "Допустимая утечка по API 598 зависит от конструкции клапана, размера, среды и метода испытания. Значения для мягкого седла и испытания металлического седла жидкостью — справочные, не заменяют актуальный стандарт или заданный класс приемки.",
      materialNote: "Это примеры на уровне семейства, а не полный перечень групп материалов ASME B16.34. Проверьте точную группу/подгруппу марки ASTM/ASME, форму изделия и редакцию, затем рейтинг давления-температуры и коррозионную совместимость."
    }
  }[locale] || {};

  const tabs = [
    { id: "dn", label: L.dnTab, accent: "#E0A81A" },
    { id: "pressure", label: L.pressureTab, accent: "#0078D4" },
    { id: "cv", label: L.cvTab, accent: "#10B981" },
    { id: "temp", label: L.tempTab, accent: "#F7630C" },
    { id: "testPressure", label: L.testPressureTab, accent: "#DC2626" },
    { id: "testDuration", label: L.testDurationTab, accent: "#7C3AED" },
    { id: "leakage", label: L.leakageTab, accent: "#0891B2" },
    { id: "material", label: L.materialTab, accent: "#059669" }
  ];

  const currentTab = tabs.find(function(t) { return t.id === tab; }) || tabs[0];

  let tableContent = null;
  if (tab === "dn") {
    tableContent = (
      <DataTable
        headers={L.dnHeaders}
        accent={currentTab.accent}
        rows={DN_NPS_DATA.map(function(d) { return [d.dn, d.nps, d.mm, d.inch]; })}
      />
    );
  } else if (tab === "pressure") {
    tableContent = (
      <DataTable
        headers={L.pressureHeaders}
        accent={currentTab.accent}
        rows={ANSI_PN_DATA.map(function(d) { return ["Class " + d.ansi, d.pn, d.bar, d.psi]; })}
      />
    );
  } else if (tab === "cv") {
    tableContent = (
      <DataTable
        headers={L.cvHeaders}
        accent={currentTab.accent}
        rows={CV_KV_DATA.map(function(d) { return [d.cv, d.kv]; })}
      />
    );
  } else if (tab === "temp") {
    tableContent = (
      <DataTable
        headers={L.tempHeaders}
        accent={currentTab.accent}
        rows={TEMP_DATA.map(function(d) { return [d.c, d.f, d.k]; })}
      />
    );
  } else if (tab === "testPressure") {
    tableContent = (
      <>
        <DataTable
          headers={L.testPressureHeaders}
          accent={currentTab.accent}
          rows={TEST_PRESSURE_DATA.map(function(d) {
            return [
              "Class " + d.class,
              d.ratingBar,
              (d.ratingBar * 1.5).toFixed(1),
              Math.round(d.ratingPsi * 1.5),
              (d.ratingBar * 1.1).toFixed(1),
              Math.round(d.ratingPsi * 1.1)
            ];
          })}
        />
        <p className="standards-reference-note">{L.pressureNote}</p>
      </>
    );
  } else if (tab === "testDuration") {
    tableContent = (
      <>
        <DataTable
          headers={L.testDurationHeaders}
          accent={currentTab.accent}
          rows={TEST_DURATION_DATA.map(function(d) {
            return [d.nps, d.dn, d.shell, d.backseat, d.leakage];
          })}
        />
        <p className="standards-reference-note">{L.durationNote}</p>
      </>
    );
  } else if (tab === "leakage") {
    tableContent = (
      <>
        <DataTable
          headers={L.leakageHeaders}
          accent={currentTab.accent}
          rows={L.leakageRows}
        />
        <p className="standards-reference-note">{L.leakageNote}</p>
      </>
    );
  } else if (tab === "material") {
    tableContent = (
      <>
        <DataTable
          headers={L.materialHeaders}
          accent={currentTab.accent}
          rows={MATERIAL_GROUP_DATA.map(function(d, index) {
            return [d.group, L.materialFamilies[index], L.materialExamples[index], L.materialUses[index]];
          })}
        />
        <p className="standards-reference-note">{L.materialNote}</p>
      </>
    );
  }

  return (
    <section className="container-x py-8 sm:py-12" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-3xl font-black" style={{ color: "var(--text)" }}>
          <span className="heading-grad">{L.title}</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
          {L.subtitle}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
        gap: 6,
        marginBottom: 18,
        padding: 4,
        background: "var(--bg-soft)",
        borderRadius: 12,
        border: "1px solid var(--border)"
      }}>
        {tabs.map(function(t) {
          const active = tab === t.id;
          return (
            <button key={t.id} type="button" aria-pressed={active} onClick={function() { setTab(t.id); }}
              style={{
                padding: "10px 12px", borderRadius: 9, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 900,
                background: active ? "linear-gradient(135deg, " + t.accent + ", " + t.accent + "cc)" : "transparent",
                color: active ? "#FFFFFF" : "var(--text-soft)",
                boxShadow: active ? "0 4px 12px " + t.accent + "40" : "none",
                transition: "all 0.18s"
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tableContent}
      <style jsx global>{`
        .standards-reference-note {
          margin: 12px 2px 0;
          padding: 11px 13px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-soft);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.8;
        }
      `}</style>
    </section>
  );
}
