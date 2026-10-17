"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, HelpCircle, Lightbulb, ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, Gauge, Droplets, Flame, Wind, Calculator } from "lucide-react";

const TIPS = {
  fa: [
    { icon: Gauge, color: "#10B981", title: "بازشدگی بهینه", text: "برای کنترل پایدار، بازشدگی باید بین ۲۰ تا ۸۰ درصد باشد" },
    { icon: AlertTriangle, color: "#F59E0B", title: "کاویتاسیون", text: "افت فشار زیاد باعث کاویتاسیون و سایش می‌شود" },
    { icon: Droplets, color: "#0078D4", title: "متریال خورنده", text: "برای سیالات خورنده از CF8M یا بالاتر استفاده کنید" },
    { icon: Flame, color: "#E81123", title: "سرویس کرایوژنیک", text: "زیر منفی ۲۹ درجه، نیاز به طراحی کرایوژنیک است" },
    { icon: Wind, color: "#7C3AED", title: "فشار بحرانی Pc", text: "برای گاز، مقدار Pc باید دقیق وارد شود" },
    { icon: CheckCircle2, color: "#059669", title: "Kv و Cv", text: "Kv = Cv ÷ ۱.۱۵۶ — هر دو در نتایج نمایش داده می‌شوند" }
  ],
  en: [
    { icon: Gauge, color: "#10B981", title: "Optimal Opening", text: "For stable control, opening should be 20-80%" },
    { icon: AlertTriangle, color: "#F59E0B", title: "Cavitation", text: "Excessive pressure drop causes cavitation and wear" },
    { icon: Droplets, color: "#0078D4", title: "Corrosive Fluids", text: "Use CF8M or higher for corrosive fluids" },
    { icon: Flame, color: "#E81123", title: "Cryogenic Service", text: "Below -29°C requires cryogenic design" },
    { icon: Wind, color: "#7C3AED", title: "Critical Pc", text: "For gas, Pc must be entered accurately" },
    { icon: CheckCircle2, color: "#059669", title: "Kv vs Cv", text: "Kv = Cv ÷ 1.156 — both shown in results" }
  ],
  ar: [
    { icon: Gauge, color: "#10B981", title: "الفتح الأمثل", text: "للتحكم المستقر، 20-80%" },
    { icon: AlertTriangle, color: "#F59E0B", title: "التجويف", text: "انخفاض الضغط المفرط يسبب التجويف" },
    { icon: Droplets, color: "#0078D4", title: "السوائل المتآكلة", text: "استخدم CF8M أو أعلى" },
    { icon: Flame, color: "#E81123", title: "التبريد العميق", text: "تحت -29 درجة" },
    { icon: Wind, color: "#7C3AED", title: "الضغط الحرج", text: "يجب إدخال Pc بدقة" },
    { icon: CheckCircle2, color: "#059669", title: "Kv و Cv", text: "Kv = Cv ÷ 1.156" }
  ],
  ru: [
    { icon: Gauge, color: "#10B981", title: "Оптимум", text: "Открытие 20-80%" },
    { icon: AlertTriangle, color: "#F59E0B", title: "Кавитация", text: "Избыточный перепад давления" },
    { icon: Droplets, color: "#0078D4", title: "Агрессивные среды", text: "Используйте CF8M+" },
    { icon: Flame, color: "#E81123", title: "Криогеника", text: "Ниже -29°C" },
    { icon: Wind, color: "#7C3AED", title: "Критическое Pc", text: "Точное значение" },
    { icon: CheckCircle2, color: "#059669", title: "Kv и Cv", text: "Kv = Cv ÷ 1.156" }
  ]
};

const FORMULAS = {
  fa: [
    { name: "مایع", formula: "Cv = Q·√(Gf/ΔP)", color: "#0078D4" },
    { name: "گاز", formula: "Cv = Q/(22.7·P1)·√(Gg·T·Z/x)", color: "#F7630C" },
    { name: "بخار", formula: "Cv = W/(2.1·√(ΔP·(P1+P2)))", color: "#E81123" },
    { name: "تبدیل", formula: "Kv = Cv / 1.156", color: "#10B981" }
  ],
  en: [
    { name: "Liquid", formula: "Cv = Q·√(Gf/ΔP)", color: "#0078D4" },
    { name: "Gas", formula: "Cv = Q/(22.7·P1)·√(Gg·T·Z/x)", color: "#F7630C" },
    { name: "Steam", formula: "Cv = W/(2.1·√(ΔP·(P1+P2)))", color: "#E81123" },
    { name: "Convert", formula: "Kv = Cv / 1.156", color: "#10B981" }
  ],
  ar: [
    { name: "سائل", formula: "Cv = Q·√(Gf/ΔP)", color: "#0078D4" },
    { name: "غاز", formula: "Cv = Q/(22.7·P1)·√(Gg·T·Z/x)", color: "#F7630C" },
    { name: "بخار", formula: "Cv = W/(2.1·√(ΔP·(P1+P2)))", color: "#E81123" },
    { name: "تحويل", formula: "Kv = Cv / 1.156", color: "#10B981" }
  ],
  ru: [
    { name: "Жидкость", formula: "Cv = Q·√(Gf/ΔP)", color: "#0078D4" },
    { name: "Газ", formula: "Cv = Q/(22.7·P1)·√(Gg·T·Z/x)", color: "#F7630C" },
    { name: "Пар", formula: "Cv = W/(2.1·√(ΔP·(P1+P2)))", color: "#E81123" },
    { name: "Конверсия", formula: "Kv = Cv / 1.156", color: "#10B981" }
  ]
};

export default function SizingQuickPanel({ locale }) {
  const [tab, setTab] = useState("tips");
  const tips = TIPS[locale] || TIPS.en;
  const formulas = FORMULAS[locale] || FORMULAS.en;

  const L = {
    fa: { tips: "نکات کاربردی", formulas: "فرمول‌ها", links: "دسترسی سریع",
      standards: "جدول استانداردها", faq: "سوالات متداول", contact: "درخواست مشاوره" },
    en: { tips: "Practical Tips", formulas: "Formulas", links: "Quick Links",
      standards: "Standards Tables", faq: "FAQ", contact: "Request Consultation" },
    ar: { tips: "نصائح", formulas: "الصيغ", links: "روابط",
      standards: "الجداول", faq: "الأسئلة", contact: "استشارة" },
    ru: { tips: "Советы", formulas: "Формулы", links: "Ссылки",
      standards: "Стандарты", faq: "FAQ", contact: "Консультация" }
  }[locale] || {};

  const tabs = [
    { id: "tips", label: L.tips, icon: <Lightbulb size={12} /> },
    { id: "formulas", label: L.formulas, icon: <BookOpen size={12} /> },
    { id: "links", label: L.links, icon: <HelpCircle size={12} /> }
  ];

  return (
    <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
      {/* Tab bar — horizontal pills */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 4,
        padding: 8,
        background: "var(--bg-soft)",
        borderBottom: "1px solid var(--border)"
      }}>
        {tabs.map(function(t) {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={function() { setTab(t.id); }}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 900,
                background: active
                  ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                  : "transparent",
                color: active ? "#FFFFFF" : "var(--text-soft)",
                boxShadow: active ? "0 3px 10px rgba(201, 149, 13, 0.25)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "all 0.15s"
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
        {tab === "tips" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8
          }}>
            {tips.map(function(tip, i) {
              const Icon = tip.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: tip.color + "08",
                    border: "1px solid " + tip.color + "25",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    display: "grid", placeItems: "center",
                    background: tip.color + "18",
                    color: tip.color,
                    flexShrink: 0
                  }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 900,
                      color: "var(--text)", lineHeight: 1.3,
                      marginBottom: 3
                    }}>
                      {tip.title}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: "var(--text-soft)",
                      fontWeight: 600,
                      lineHeight: 1.5
                    }}>
                      {tip.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "formulas" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8
          }}>
            {formulas.map(function(f, i) {
              return (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: "1px solid " + f.color + "40"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 6
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: f.color
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 900,
                      color: f.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {f.name}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--text)",
                    direction: "ltr",
                    textAlign: "right",
                    lineHeight: 1.5,
                    wordBreak: "break-word"
                  }}>
                    {f.formula}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "links" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8
          }}>
            <QuickCard href={"/" + locale + "/standards"} label={L.standards} icon="📊" color="#0078D4" />
            <QuickCard href={"/" + locale + "/faq"} label={L.faq} icon="❓" color="#7C3AED" />
            <QuickCard href={"/" + locale + "/contact"} label={L.contact} icon="💬" color="#10B981" />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ href, label, icon, color }) {
  return (
    <Link
      href={href}
      style={{
        padding: "14px 10px",
        borderRadius: 11,
        background: "var(--bg-card)",
        border: "1.5px solid " + color + "30",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s",
        textAlign: "center"
      }}
      onMouseEnter={function(e) {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.background = color + "08";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={function(e) {
        e.currentTarget.style.borderColor = color + "30";
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        display: "grid", placeItems: "center",
        background: color + "15",
        fontSize: 20
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 900,
        color: "var(--text)",
        lineHeight: 1.3
      }}>
        {label}
      </div>
      <ArrowLeft size={12} style={{ color: color, transform: "rotate(180deg)" }} />
    </Link>
  );
}
