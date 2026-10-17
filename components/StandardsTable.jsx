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

// ---------------------------------------------------------------
// ANSI/FCI 70-2-2006 — Control Valve Seat Leakage
// ---------------------------------------------------------------
const FCI_CLASSES = [
  { id: "I",   malKey: "fciI",   mediumKey: "fciMediumNone", pressureKey: "fciPressureNone" },
  { id: "II",  mal: "0.5%",      mediumKey: "fciMediumAW",   pressureKey: "fciPressureLow" },
  { id: "III", mal: "0.1%",      mediumKey: "fciMediumAW",   pressureKey: "fciPressureLow" },
  { id: "IV",  mal: "0.01%",     mediumKey: "fciMediumAW",   pressureKey: "fciPressureLow" },
  { id: "V",   malKey: "fciV",   mediumKey: "fciMediumWater", pressureKey: "fciPressureMax" },
  { id: "VI",  malKey: "fciVI",  mediumKey: "fciMediumAir",  pressureKey: "fciPressure50" }
];

// Class VI allowable leakage: nominal seat diameter → mL/min air at 50 psig.
const FCI_CLASS_VI_DATA = [
  { mm: "< 25", inch: '< 1"',   ml: "0.15", bubbles: 1 },
  { mm: "38",   inch: '1.5"',   ml: "0.30", bubbles: 2 },
  { mm: "51",   inch: '2"',     ml: "0.45", bubbles: 3 },
  { mm: "64",   inch: '2.5"',   ml: "0.60", bubbles: 4 },
  { mm: "76",   inch: '3"',     ml: "0.90", bubbles: 6 },
  { mm: "102",  inch: '4"',     ml: "1.70", bubbles: 11 },
  { mm: "152",  inch: '6"',     ml: "4.00", bubbles: 27 },
  { mm: "203",  inch: '8"',     ml: "6.75", bubbles: 45 },
  { mm: "250",  inch: '10"',    ml: "11.1", bubbles: "—" },
  { mm: "300",  inch: '12"',    ml: "16.0", bubbles: "—" },
  { mm: "350",  inch: '14"',    ml: "21.6", bubbles: "—" },
  { mm: "400",  inch: '16"',    ml: "28.4", bubbles: "—" }
];

// ISA-75.01.01 symbols used by the sizing engine (harmonised with IEC 60534-2-1).
const ISA_SYMBOLS = [
  { sym: "Cv",     unit: "US gpm @ 1 psi",  fa: "ضریب جریان آمریکایی (مبنای محاسبه)", en: "US flow coefficient (calculation basis)" },
  { sym: "Kv",     unit: "m³/h @ 1 bar",    fa: "ضریب جریان متریک؛ Kv ≈ Cv / 1.156", en: "Metric flow coefficient; Kv ≈ Cv / 1.156" },
  { sym: "P1, P2", unit: "bar abs",         fa: "فشار مطلق ورودی و خروجی", en: "Absolute inlet and outlet pressure" },
  { sym: "FL",     unit: "—",               fa: "ضریب بازیابی فشار شیر (۰.۸–۰.۹)", en: "Valve pressure recovery factor (0.8–0.9)" },
  { sym: "Ff",     unit: "—",               fa: "ضریب فشار بحرانی مایع = 0.96 − 0.28√(Pv/Pc)", en: "Liquid critical pressure ratio = 0.96 − 0.28√(Pv/Pc)" },
  { sym: "FF",     unit: "—",               fa: "نسبت فشار بحرانی ترم؛ مبنای تشخیص کاویتاسیون", en: "Critical pressure ratio factor; cavitation basis" },
  { sym: "xT",     unit: "—",               fa: "ضریب افت فشار بحرانی گاز (۰.۶–۰.۸)", en: "Gas choked pressure drop ratio (0.6–0.8)" },
  { sym: "Fk",     unit: "—",               fa: "نسبت گرمای ویژه = k / 1.4", en: "Specific heat ratio factor = k / 1.4" },
  { sym: "Y",      unit: "—",               fa: "ضریب انبساط گاز = 1 − x/(3·Fk·xT)", en: "Gas expansion factor = 1 − x/(3·Fk·xT)" },
  { sym: "Z",      unit: "—",               fa: "ضریب تراکم‌پذیری گاز (گاز ایده‌آل = ۱)", en: "Gas compressibility factor (ideal = 1)" },
  { sym: "σ",      unit: "—",               fa: "شاخص کاویتاسیون = (P1 − Pv)/ΔP", en: "Cavitation index = (P1 − Pv)/ΔP" }
];

// IEC 60534-2-1 — همان فیزیک، با ضریب متریک Kv و ثابت‌های SI.
const IEC_SYMBOLS = [
  { sym: "Kv",      unit: "m³/h @ 1 bar",  fa: "ضریب جریان متریک؛ مبنای محاسبه در نسخهٔ IEC", en: "Metric flow coefficient; the calculation basis in the IEC edition" },
  { sym: "C",       unit: "—",             fa: "ضریب جریان عمومی استاندارد؛ Cv و Kv حالت‌های خاص آن‌اند", en: "Generic standard flow coefficient; Cv and Kv are specific cases" },
  { sym: "N1…N9",   unit: "—",             fa: "ثابت‌های عددی جدول استاندارد برای SI و US (لوله، گاز، رینولدز)", en: "Numeric constants (standard tables) for SI and US units" },
  { sym: "FL",      unit: "—",             fa: "ضریب بازیابی فشار شیر", en: "Valve pressure recovery factor" },
  { sym: "FF",      unit: "—",             fa: "نسبت فشار بحرانی ترم = 0.96 − 0.28√(Pv/Pc)", en: "Critical pressure ratio factor = 0.96 − 0.28√(Pv/Pc)" },
  { sym: "xT",      unit: "—",             fa: "ضریب افت فشار بحرانی گاز", en: "Gas choked pressure drop ratio" },
  { sym: "Fk",      unit: "—",             fa: "نسبت گرمای ویژه = k / 1.4", en: "Specific heat ratio factor = k / 1.4" },
  { sym: "Y",       unit: "—",             fa: "ضریب انبساط گاز", en: "Gas expansion factor" },
  { sym: "Z",       unit: "—",             fa: "ضریب تراکم‌پذیری گاز", en: "Gas compressibility factor" },
  { sym: "Fp",      unit: "—",             fa: "ضریب هندسهٔ اتصالات (کاهنده/لوله) — بخش ۲-۱", en: "Piping geometry factor (reducers/pipe) — Part 2-1" },
  { sym: "FR",      unit: "—",             fa: "ضریب عدد رینولدز برای جریان ویسکوز — بخش ۲-۱", en: "Reynolds number factor for viscous flow — Part 2-1" }
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

function DataTable({ headers, rows, accent, wrap }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border)" }}>
      <table style={{
        width: "100%",
        minWidth: wrap ? 520 : headers.length >= 5 ? 780 : headers.length === 3 ? 600 : 0,
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
                      textAlign: wrap && j === row.length - 1 && row.length > 1 ? "start" : "center",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: wrap ? "normal" : "nowrap",
                      lineHeight: wrap ? 1.7 : 1.4,
                      fontWeight: j === 0 ? 900 : 700,
                      color: j === 0 ? accent : "var(--text)",
                      borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                      fontSize: 12,
                      direction: j === 1 ? "ltr" : undefined
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

const VALID_TABS = ["dn", "pressure", "cv", "temp", "testPressure", "testDuration", "leakage", "fci", "material", "isa", "iec"];

export default function StandardsTable({ locale, initialTab }) {
  const [tab, setTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : "dn");

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
      materialNote: "این‌ها مثال‌های گروه‌بندی خانواده‌ای هستند و فهرست کامل گروه‌های متریال ASME B16.34 نیستند. گروه/زیرگروه دقیق گرید ASTM/ASME، شکل محصول و ویرایش استاندارد را کنترل کنید؛ سپس ریتینگ فشار-دما و سازگاری خوردگی را بررسی کنید.",
      fciTab: "نشتی شیر کنترل (FCI 70-2)",
      isaTab: "مرجع سایزینگ (ISA-75.01.01)",
      fciHeaders: ["کلاس", "حداکثر نشتی مجاز (MAL)", "سیال تست", "فشار تست"],
      fciI: "تعیین نشده — بدون تست اجباری",
      fciV: "۵×۱۰⁻⁴ ml/min آب به ازای هر اینچ قطر نشیمن و هر psi اختلاف فشار",
      fciVI: "بر اساس قطر اسمی نشیمن — جدول زیر",
      fciMediumNone: "—",
      fciMediumAW: "هوا یا آب، ۱۰–۵۰ °C",
      fciMediumWater: "آب، ۱۰–۵۰ °C",
      fciMediumAir: "هوا، ۱۰–۵۰ °C",
      fciPressureNone: "—",
      fciPressureLow: "کمتر از ۴۵–۶۰ psig یا حداکثر اختلاف فشار کاری",
      fciPressureMax: "حداکثر فشار کاری، نه بیش از ریتینگ ANSI",
      fciPressure50: "کمتر از ۵۰ psig یا حداکثر فشار روی پلاگ",
      fciClassVIHeaders: ["قطر اسمی نشیمن (mm)", "قطر (inch)", "حداکثر نشتی (ml/min)", "حباب در دقیقه"],
      fciNote: "ANSI/FCI 70-2-2006 کلاس‌های نشتی شیر کنترل و روش تست را تعیین می‌کند. کلاس IV حد متعارف شیرهای کنترل فلزی و کلاس VI برای نشیمن الاستومری «حباب‌بند» است. انتخاب کلاس، تابع الزام فرآیند و مشخصات خرید است؛ این جدول مرجع سریع است و جایگزین نسخهٔ رسمی استاندارد نیست.",
      isaHeaders: ["نماد", "واحد", "توضیح"],
      isaNote: "سایزینگ این ابزار بر پایهٔ معادلات ISA-75.01.01 (هم‌راستا با IEC 60534-2-1) است: Cv = Q·√(Gf/ΔP) برای مایع با سقف ΔP بحرانی، و Cv = Q/(416.3·P1·Y)·√(Gg·T·Z/x) برای گاز. Fp در صورت وارد کردن DN لوله اعمال می‌شود (با فرض کاهندهٔ ناگهانی)؛ عدد رینولدز (FR) و هندسهٔ تیغه لحاظ نشده و نتیجه تخمین مهندسی است.",
      iecTab: "IEC 60534-2-1",
      iecNote: "IEC 60534-2-1 نسخهٔ بین‌المللی همان معادلات است و با ISA-75.01.01 هم‌ارز فنی محسوب می‌شود؛ دو استاندارد هم را کامل می‌کنند. تفاوت اصلی در واحدها و ضریب است: IEC از Kv (m³/h در ۱ bar) و ثابت‌های SI استفاده می‌کند و ISA از Cv (gpm در 1 psi) و ثابت‌های US. تبدیل: Cv ≈ 1.156 Kv. هر دو برای دقت بیشتر ضریب هندسهٔ اتصالات (Fp) و ضریب رینولدز (FR) را تعریف می‌کنند؛ این ابزار Fp را در صورت وارد کردن DN لوله اعمال می‌کند، اما FR را نه."
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
      materialNote: "These are family-level examples, not a complete ASME B16.34 material-group listing. Confirm the exact group/subgroup for the specified ASTM/ASME grade, product form, and edition, then check its pressure-temperature rating and corrosion compatibility.",
      fciTab: "Control Valve Leakage (FCI 70-2)",
      isaTab: "Sizing Reference (ISA-75.01.01)",
      fciHeaders: ["Class", "Maximum allowable leakage (MAL)", "Test medium", "Test pressure"],
      fciI: "Not specified — no test required",
      fciV: "5×10⁻⁴ ml/min of water per inch of seat diameter per psi differential",
      fciVI: "Based on nominal seat diameter — table below",
      fciMediumNone: "—",
      fciMediumAW: "Air or water, 10–50 °C",
      fciMediumWater: "Water, 10–50 °C",
      fciMediumAir: "Air, 10–50 °C",
      fciPressureNone: "—",
      fciPressureLow: "Lower of 45–60 psig or maximum operating differential",
      fciPressureMax: "Maximum service pressure, not exceeding ANSI rating",
      fciPressure50: "Lower of 50 psig or maximum pressure across the plug",
      fciClassVIHeaders: ["Nominal seat diameter (mm)", "Diameter (inch)", "Max leakage (ml/min)", "Bubbles per minute"],
      fciNote: "ANSI/FCI 70-2-2006 defines control valve leakage classes and test procedures. Class IV is the usual limit for metal-seated control valves and Class VI is bubble-tight for resilient seats. The required class comes from the process and the purchase specification; this table is a quick reference, not a substitute for the official standard.",
      isaHeaders: ["Symbol", "Unit", "Meaning"],
      isaNote: "This tool follows the ISA-75.01.01 equations (harmonised with IEC 60534-2-1): Cv = Q·√(Gf/ΔP) for liquids with the critical ΔP limit, and Cv = Q/(416.3·P1·Y)·√(Gg·T·Z/x) for gases. The piping geometry factor (Fp) is applied when a pipe DN is entered (abrupt reducers assumed); Reynolds number (FR) and trim geometry are not included, so results are an engineering estimate.",
      iecTab: "IEC 60534-2-1",
      iecNote: "IEC 60534-2-1 is the international edition of the same equations and is technically equivalent to ISA-75.01.01; the two standards complete each other. The main difference is the unit system and coefficient: IEC uses Kv (m³/h at 1 bar) with SI constants, ISA uses Cv (gpm at 1 psi) with US constants. Conversion: Cv ≈ 1.156 Kv. Both define a piping geometry factor (Fp) and a Reynolds number factor (FR) for higher accuracy; this tool applies Fp when a pipe DN is entered, but not FR."
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
      materialNote: "هذه أمثلة على مستوى عائلة المواد وليست قائمة كاملة لمجموعات ASME B16.34. تحقق من المجموعة/المجموعة الفرعية الدقيقة لدرجة ASTM/ASME وشكل المنتج والإصدار، ثم تحقق من تصنيف الضغط والحرارة والتوافق مع التآكل.",
      fciTab: "تسرب صمام التحكم (FCI 70-2)",
      isaTab: "مرجع تحديد الحجم (ISA-75.01.01)",
      fciHeaders: ["الفئة", "أقصى تسرب مسموح (MAL)", "وسط الاختبار", "ضغط الاختبار"],
      fciI: "غير محدد — لا اختبار إلزامي",
      fciV: "٥×١٠⁻⁴ مل/دقيقة ماء لكل بوصة من قطر المقعد ولكل psi فرق ضغط",
      fciVI: "حسب القطر الاسمي للمقعد — الجدول أدناه",
      fciMediumNone: "—",
      fciMediumAW: "هواء أو ماء، ١٠–٥٠ °م",
      fciMediumWater: "ماء، ١٠–٥٠ °م",
      fciMediumAir: "هواء، ١٠–٥٠ °م",
      fciPressureNone: "—",
      fciPressureLow: "الأقل بين ٤٥–٦٠ psig أو أقصى فرق ضغط تشغيلي",
      fciPressureMax: "أقصى ضغط خدمة، دون تجاوز تصنيف ANSI",
      fciPressure50: "الأقل بين ٥٠ psig أو أقصى ضغط على السدادة",
      fciClassVIHeaders: ["القطر الاسمي (mm)", "القطر (inch)", "أقصى تسرب (ml/min)", "فقاعات/دقيقة"],
      fciNote: "يحدد ANSI/FCI 70-2-2006 فئات تسرب صمام التحكم وإجراءات الاختبار. الفئة IV هي الحد المتعارف عليه للصمامات المعدنية والفئة VI للمقاعد المرنة. الفئة المطلوبة تأتي من العملية ومواصفات الشراء؛ هذا الجدول مرجع سريع وليس بديلاً عن النسخة الرسمية.",
      isaHeaders: ["الرمز", "الوحدة", "المعنى"],
      isaNote: "تعتمد الأداة معادلات ISA-75.01.01 (المتوافقة مع IEC 60534-2-1): Cv = Q·√(Gf/ΔP) للسوائل مع حد ΔP الحرج، وCv = Q/(416.3·P1·Y)·√(Gg·T·Z/x) للغازات. يُطبَّق معامل هندسة التوصيلات (Fp) عند إدخال قطر الأنبوب DN (بافتراض مخفضات مفاجئة)؛ ولا يُؤخذ رقم رينولدز (FR) في الحساب.",
      iecTab: "IEC 60534-2-1",
      iecNote: "IEC 60534-2-1 هو الإصدار الدولي للمعادلات نفسها ويعادل تقنيًا ISA-75.01.01؛ المعياران يكملان بعضهما. الفرق الأساسي في الوحدات والمعامل: IEC يستخدم Kv (m³/h عند 1 bar) وثوابت SI، بينما يستخدم ISA الرمز Cv (gpm عند 1 psi) وثوابت US. التحويل: Cv ≈ 1.156 Kv. يحدد المعياران معامل هندسة التوصيلات (Fp) ومعامل رينولدز (FR) لدقة أعلى؛ تطبّق الأداة Fp عند إدخال DN الأنبوب، لكن ليس FR."
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
      materialNote: "Это примеры на уровне семейства, а не полный перечень групп материалов ASME B16.34. Проверьте точную группу/подгруппу марки ASTM/ASME, форму изделия и редакцию, затем рейтинг давления-температуры и коррозионную совместимость.",
      fciTab: "Утечка клапана (FCI 70-2)",
      isaTab: "Справочник подбора (ISA-75.01.01)",
      fciHeaders: ["Класс", "Макс. допустимая утечка (MAL)", "Среда испытания", "Давление испытания"],
      fciI: "Не задано — испытание не требуется",
      fciV: "5×10⁻⁴ мл/мин воды на дюйм диаметра седла на psi перепада",
      fciVI: "По номинальному диаметру седла — таблица ниже",
      fciMediumNone: "—",
      fciMediumAW: "Воздух или вода, 10–50 °C",
      fciMediumWater: "Вода, 10–50 °C",
      fciMediumAir: "Воздух, 10–50 °C",
      fciPressureNone: "—",
      fciPressureLow: "Меньшее из 45–60 psig или максимальный рабочий перепад",
      fciPressureMax: "Максимальное рабочее давление, не выше рейтинга ANSI",
      fciPressure50: "Меньшее из 50 psig или максимальное давление на затворе",
      fciClassVIHeaders: ["Номинальный диаметр (mm)", "Диаметр (inch)", "Макс. утечка (ml/min)", "Пузырьков/мин"],
      fciNote: "ANSI/FCI 70-2-2006 определяет классы утечки регулирующих клапанов и методы испытаний. Класс IV — обычный предел для металлических седел, класс VI — для эластомерных. Требуемый класс задаётся процессом и спецификацией закупки; таблица справочная.",
      isaHeaders: ["Символ", "Единица", "Значение"],
      isaNote: "Инструмент использует уравнения ISA-75.01.01 (согласованы с IEC 60534-2-1): Cv = Q·√(Gf/ΔP) для жидкости с критическим ΔP и Cv = Q/(416.3·P1·Y)·√(Gg·T·Z/x) для газа. Fp применяется при указании DN трубы (предполагаются внезапные переходы); число Рейнольдса (FR) и геометрия затвора не учитываются.",
      iecTab: "IEC 60534-2-1",
      iecNote: "IEC 60534-2-1 — международная редакция тех же уравнений, технически эквивалентная ISA-75.01.01; стандарты дополняют друг друга. Основное различие — единицы и коэффициент: IEC использует Kv (m³/h при 1 bar) и константы SI, ISA — Cv (gpm при 1 psi) и константы US. Перевод: Cv ≈ 1.156 Kv. Оба стандарта определяют коэффициент геометрии трубопровода (Fp) и коэффициент Рейнольдса (FR) для повышенной точности; инструмент применяет Fp при указании DN трубы, но не FR."
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
    { id: "fci", label: L.fciTab, accent: "#B91C1C" },
    { id: "material", label: L.materialTab, accent: "#059669" },
    { id: "isa", label: L.isaTab, accent: "#0EA5E9" },
    { id: "iec", label: L.iecTab, accent: "#6366F1" }
  ];

  const RATED = {
    fa: "از ظرفیت نامی",
    en: "of rated capacity",
    ar: "من السعة المقننة",
    ru: "номинальной пропускной способности"
  };
  const ratedLabel = RATED[locale] || RATED.en;

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
  } else if (tab === "fci") {
    const classRows = FCI_CLASSES.map(function(c) {
      return [
        "Class " + c.id,
        c.mal ? c.mal + " " + ratedLabel : L[c.malKey],
        L[c.mediumKey],
        L[c.pressureKey]
      ];
    });
    tableContent = (
      <>
        <DataTable headers={L.fciHeaders} accent={currentTab.accent} rows={classRows} wrap />
        <h3 className="standards-subtitle">ANSI/FCI 70-2 — Class VI ({L.fciClassVIHeaders[0]})</h3>
        <DataTable
          headers={L.fciClassVIHeaders}
          accent={currentTab.accent}
          rows={FCI_CLASS_VI_DATA.map(function(d) { return [d.mm, d.inch, d.ml, d.bubbles]; })}
        />
        <p className="standards-reference-note">{L.fciNote}</p>
      </>
    );
  } else if (tab === "isa") {
    tableContent = (
      <>
        <DataTable
          headers={L.isaHeaders}
          accent={currentTab.accent}
          rows={ISA_SYMBOLS.map(function(s) { return [s.sym, s.unit, s[locale] || s.en]; })}
          wrap
        />
        <p className="standards-reference-note">{L.isaNote}</p>
      </>
    );
  } else if (tab === "iec") {
    tableContent = (
      <>
        <DataTable
          headers={L.isaHeaders}
          accent={currentTab.accent}
          rows={IEC_SYMBOLS.map(function(s) { return [s.sym, s.unit, s[locale] || s.en]; })}
          wrap
        />
        <p className="standards-reference-note">{L.iecNote}</p>
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
        .standards-subtitle {
          margin: 18px 2px 8px;
          font-size: 12px;
          font-weight: 900;
          color: var(--text-soft);
          letter-spacing: 0.01em;
        }
      `}</style>
    </section>
  );
}
