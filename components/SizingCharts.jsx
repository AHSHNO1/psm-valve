"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, TrendingUp, Gauge, Target, Zap, Activity, BookOpen, Star, Award
} from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function inherentCv(x, type) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (type === "linear") return x;
  if (type === "equal") {
    const R = 50;
    const val = Math.pow(R, x - 1);
    return (val - 1 / R) / (1 - 1 / R);
  }
  if (type === "quick") return Math.sqrt(x);
  return x;
}

export function ValveCharacteristicChart({ result, form, locale = "fa" }) {
  const data = useMemo(() => {
    if (!result || !result.size) return null;
    const openings = Array.from({ length: 21 }, (_, i) => i * 5);
    const recChar = result.recommendedCharacteristic || "equal";

    const curves = [
      { type: "linear", name: locale === "fa" ? "خطی" : "Linear", color: "#9CA3AF", width: 1.8 },
      { type: "equal", name: locale === "fa" ? "درصد مساوی" : "Equal %", color: "#9CA3AF", width: 1.8 },
      { type: "quick", name: locale === "fa" ? "سریع‌بازشو" : "Quick", color: "#9CA3AF", width: 1.8 }
    ];
    curves.forEach(c => {
      if (c.type === recChar) { c.color = "#E0A81A"; c.width = 3.5; }
    });

    const series = curves.map(c => ({
      name: c.name,
      data: openings.map(o => [o, +(inherentCv(o / 100, c.type) * 100).toFixed(1)])
    }));

    if (result.openingPercent) {
      series.push({
        name: locale === "fa" ? "نقطه کار" : "Operating",
        data: [[result.openingPercent, +((inherentCv(result.openingPercent / 100, recChar) * 100).toFixed(1))]],
        type: "scatter"
      });
    }

    return {
      series,
      options: {
        chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 600 } },
        stroke: { curve: "smooth", width: curves.map(c => c.width).concat([0]) },
        markers: { size: [0, 0, 0, 11], strokeWidth: [0, 0, 0, 3], strokeColors: "#FFFFFF" },
        xaxis: {
          title: { text: locale === "fa" ? "درصد بازشدگی (%)" : "Opening (%)", style: { fontSize: "11px", fontWeight: 800 } },
          min: 0, max: 100, tickAmount: 4,
          labels: { style: { fontSize: "10px", fontWeight: 700 } }
        },
        yaxis: {
          title: { text: locale === "fa" ? "قابلیت جریان (%)" : "Flow Capability (%)", style: { fontSize: "11px", fontWeight: 800 } },
          min: 0, max: 100, labels: { style: { fontSize: "10px", fontWeight: 700 } }
        },
        colors: curves.map(c => c.color).concat(["#E81123"]),
        legend: { show: false },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 3 },
        annotations: {
          xaxis: [{
            x: 20, x2: 80,
            fillColor: "#10B98108",
            borderColor: "#10B98130",
            label: {
              text: locale === "fa" ? "محدوده بهینه ۲۰٪ – ۸۰٪" : "Optimal 20%–80%",
              style: { background: "#10B981", color: "#FFFFFF", fontSize: "9.5px", fontWeight: 900, padding: { left: 8, right: 8, top: 3, bottom: 3 } },
              orientation: "horizontal"
            }
          }]
        },
        tooltip: { shared: true, intersect: false, y: { formatter: v => v.toFixed(1) + "%" } }
      }
    };
  }, [result, form, locale]);

  if (!data) return null;

  const recChar = result.recommendedCharacteristic || "equal";
  const recName = recChar === "equal"
    ? (locale === "fa" ? "درصد مساوی" : "Equal %")
    : recChar === "linear"
    ? (locale === "fa" ? "خطی" : "Linear")
    : (locale === "fa" ? "سریع‌بازشو" : "Quick");

  return (
    <div className="card-glass" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, #E0A81A, #B8850A)",
          color: "#FFFFFF"
        }}>
          <Target size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
            {locale === "fa" ? "مشخصه جریان شیر" : "Valve Flow Characteristic"}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>
            {locale === "fa" ? `پیشنهاد: ${recName}` : `Recommended: ${recName}`}
          </div>
        </div>
      </div>

      <Chart options={data.options} series={data.series} type="line" height={300} />

      <div style={{
        marginTop: 12, padding: "10px 14px", borderRadius: 10,
        background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
        border: "1px solid rgba(16,185,129,0.25)",
        fontSize: 11.5, fontWeight: 700, color: "var(--text-soft)", lineHeight: 1.6
      }}>
        💡 {locale === "fa"
          ? "نقطه کاری بهینه در محدوده ۲۰٪ – ۸۰٪ بازشدگی است."
          : "Optimal operating point is between 20% – 80% opening."}
      </div>
    </div>
  );
}

// ============================================================
// TIPS & STANDARDS — with FULL standards tables
// ============================================================
export function TipsAndStandards({ result, form, locale = "fa" }) {
  const [tab, setTab] = useState("tips");

  const tips = useMemo(() => {
    if (!result) return [];
    const t = [];

    if (result.openingPercent >= 20 && result.openingPercent <= 80) {
      t.push({
        icon: CheckCircle2, color: "#10B981",
        title: locale === "fa" ? "بازشدگی بهینه" : "Optimal Opening",
        desc: locale === "fa"
          ? "نقطه کاری در محدوده بهینه است. بهترین تعادل کنترل و راندمان."
          : "Operating point is optimal. Best control/efficiency balance."
      });
    } else if (result.openingPercent < 20) {
      t.push({
        icon: AlertTriangle, color: "#F59E0B",
        title: locale === "fa" ? "بازشدگی کم" : "Low Opening",
        desc: locale === "fa"
          ? `بازشدگی ${result.openingPercent}٪ — سایز کوچکتر انتخاب کنید.`
          : `Opening ${result.openingPercent}% — consider smaller size.`
      });
    } else {
      t.push({
        icon: AlertTriangle, color: "#F59E0B",
        title: locale === "fa" ? "بازشدگی بالا" : "High Opening",
        desc: locale === "fa"
          ? `بازشدگی ${result.openingPercent}٪ — سایز بزرگتر انتخاب کنید.`
          : `Opening ${result.openingPercent}% — consider larger size.`
      });
    }

    if (result.size && result.Cv) {
      const headroom = Math.round(((result.size.cv - result.Cv) / result.Cv) * 100);
      if (headroom > 0) {
        t.push({
          icon: TrendingUp, color: "#0078D4",
          title: locale === "fa" ? `افزایش دبی تا ${headroom}٪` : `Flow increase up to ${headroom}%`,
          desc: locale === "fa"
            ? `با ${headroom}٪ افزایش دبی، هنوز در محدوده ایمن کار می‌کنید.`
            : `Up to ${headroom}% more flow while staying safe.`
        });
      }
    }

    if (result.velocity && result.velocity > 5) {
      t.push({
        icon: Zap, color: "#F59E0B",
        title: locale === "fa" ? "سرعت بالا" : "High Velocity",
        desc: locale === "fa"
          ? `سرعت ${result.velocity} m/s — سایز بزرگتر توصیه می‌شود.`
          : `Velocity ${result.velocity} m/s — larger size recommended.`
      });
    }

    if (result.noise && result.noise > 85) {
      t.push({
        icon: Gauge, color: "#E81123",
        title: locale === "fa" ? "نویز بالا" : "High Noise",
        desc: locale === "fa"
          ? `نویز ${result.noise} dB — از تریم کاهش نویز استفاده کنید.`
          : `Noise ${result.noise} dB — use noise-reduction trim.`
      });
    }

    if (result.choked) {
      t.push({
        icon: AlertTriangle, color: "#E81123",
        title: locale === "fa" ? "جریان Choked" : "Choked Flow",
        desc: locale === "fa"
          ? "جریان بحرانی — سایز بزرگتر یا کاهش ΔP."
          : "Choked flow — larger size or reduce ΔP."
      });
    }
    return t;
  }, [result, locale]);

  // Full standards data
  const STANDARDS_DN = [
    { dn: "DN15", nps: '1/2"', cv: 15 },
    { dn: "DN20", nps: '3/4"', cv: 28 },
    { dn: "DN25", nps: '1"', cv: 45 },
    { dn: "DN40", nps: '1-1/2"', cv: 90 },
    { dn: "DN50", nps: '2"', cv: 150 },
    { dn: "DN80", nps: '3"', cv: 320 },
    { dn: "DN100", nps: '4"', cv: 550 },
    { dn: "DN150", nps: '6"', cv: 1250 },
    { dn: "DN200", nps: '8"', cv: 2200 },
    { dn: "DN250", nps: '10"', cv: 3400 },
    { dn: "DN300", nps: '12"', cv: 4800 },
    { dn: "DN350", nps: '14"', cv: 6300 },
    { dn: "DN400", nps: '16"', cv: 8000 },
    { dn: "DN500", nps: '20"', cv: 12500 },
    { dn: "DN600", nps: '24"', cv: 18000 }
  ];

  const STANDARDS_ANSI = [
    { ansi: "150", pn: "PN20", bar: 19.6 },
    { ansi: "300", pn: "PN50", bar: 51.1 },
    { ansi: "600", pn: "PN100", bar: 102.1 },
    { ansi: "900", pn: "PN150", bar: 153.2 },
    { ansi: "1500", pn: "PN250", bar: 255.3 },
    { ansi: "2500", pn: "PN420", bar: 425.5 }
  ];

  const L = {
    fa: {
      tipsTitle: "توصیه‌ها", standardsTitle: "استانداردها",
      dnTitle: "سایز استاندارد شیر — DN / NPS / Cv",
      ansiTitle: "کلاس فشاری ANSI / PN",
      recommended: "پیشنهاد",
      emptyTitle: "توصیه‌ها و استانداردها",
      emptyDesc: "پس از محاسبه، این بخش فعال می‌شود",
      emptyHint: "دکمه محاسبه را در فرم بزنید",
      colSize: "سایز", colNps: "NPS", colCv: "Cv",
      colAnsi: "ANSI", colPn: "PN", colBar: "فشار (bar)"
    },
    en: {
      tipsTitle: "Tips", standardsTitle: "Standards",
      dnTitle: "Valve Size Standards — DN / NPS / Cv",
      ansiTitle: "ANSI / PN Pressure Class",
      recommended: "Recommended",
      emptyTitle: "Tips & Standards",
      emptyDesc: "This section activates after calculation",
      emptyHint: "Press the Calculate button in the form",
      colSize: "Size", colNps: "NPS", colCv: "Cv",
      colAnsi: "ANSI", colPn: "PN", colBar: "Pressure (bar)"
    },
    ar: {
      tipsTitle: "نصائح", standardsTitle: "المعايير",
      dnTitle: "الأحجام القياسية", ansiTitle: "فئة الضغط",
      recommended: "موصى به",
      emptyTitle: "نصائح ومعايير", emptyDesc: "بعد الحساب",
      emptyHint: "اضغط احسب",
      colSize: "الحجم", colNps: "NPS", colCv: "Cv",
      colAnsi: "ANSI", colPn: "PN", colBar: "الضغط"
    },
    ru: {
      tipsTitle: "Советы", standardsTitle: "Стандарты",
      dnTitle: "Стандартные размеры", ansiTitle: "Класс ANSI / PN",
      recommended: "Рекомендуется",
      emptyTitle: "Советы и стандарты", emptyDesc: "После расчета",
      emptyHint: "Нажмите Рассчитать",
      colSize: "Размер", colNps: "NPS", colCv: "Cv",
      colAnsi: "ANSI", colPn: "PN", colBar: "Давление"
    }
  }[locale] || {};

  if (!result || result.error) {
    return (
      <div className="card-glass" style={{
        padding: "24px 20px", textAlign: "center",
        background: "linear-gradient(135deg, rgba(201, 149, 13, 0.03), rgba(201, 149, 13, 0.01))",
        border: "2px dashed rgba(201, 149, 13, 0.25)"
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, margin: "0 auto 12px",
          display: "grid", placeItems: "center",
          background: "rgba(201, 149, 13, 0.12)", color: "#B8850A"
        }}>
          <BookOpen size={22} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
          {L.emptyTitle}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>
          {L.emptyDesc}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, opacity: 0.7 }}>
          {L.emptyHint}
        </div>
      </div>
    );
  }

  const recDn = result.size?.dn;

  return (
    <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
      {/* Tabs */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: "var(--bg-soft)", padding: 5, gap: 4
      }}>
        <button onClick={() => setTab("tips")} style={{
          padding: "11px 8px", borderRadius: 10, border: "none",
          cursor: "pointer", fontFamily: "inherit",
          fontSize: 12.5, fontWeight: 900,
          background: tab === "tips" ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
          color: tab === "tips" ? "#FFFFFF" : "var(--text-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: tab === "tips" ? "0 4px 12px rgba(201,149,13,0.30)" : "none",
          transition: "all 0.2s"
        }}>
          💡 {L.tipsTitle}
          {tips.length > 0 && (
            <span style={{
              padding: "1px 7px", borderRadius: 10,
              background: tab === "tips" ? "rgba(255,255,255,0.30)" : "var(--gold)",
              color: "#FFFFFF",
              fontSize: 9.5, fontWeight: 900
            }}>{tips.length}</span>
          )}
        </button>
        <button onClick={() => setTab("standards")} style={{
          padding: "11px 8px", borderRadius: 10, border: "none",
          cursor: "pointer", fontFamily: "inherit",
          fontSize: 12.5, fontWeight: 900,
          background: tab === "standards" ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
          color: tab === "standards" ? "#FFFFFF" : "var(--text-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: tab === "standards" ? "0 4px 12px rgba(201,149,13,0.30)" : "none",
          transition: "all 0.2s"
        }}>
          📊 {L.standardsTitle}
        </button>
      </div>

      {/* Tips */}
      {tab === "tips" && (
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          {tips.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 11.5, fontWeight: 600 }}>
              {locale === "fa" ? "توصیه‌ای وجود ندارد" : "No tips"}
            </div>
          ) : tips.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px", borderRadius: 11,
                  background: t.color + "08",
                  border: "1px solid " + t.color + "30"
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  display: "grid", placeItems: "center",
                  background: t.color + "15", color: t.color,
                  flexShrink: 0
                }}>
                  <Icon size={15} strokeWidth={2.4} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: t.color, marginBottom: 3 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-soft)", lineHeight: 1.55 }}>
                    {t.desc}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Standards — FULL TABLE */}
      {tab === "standards" && (
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {/* DN Table */}
          <div style={{
            padding: "10px 14px",
            fontSize: 11, fontWeight: 900, color: "var(--text)",
            background: "linear-gradient(135deg, rgba(224,168,26,0.08), rgba(184,133,10,0.02))",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 6,
            position: "sticky", top: 0, zIndex: 2
          }}>
            <Award size={13} color="var(--gold)" />
            {L.dnTitle}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)" }}>
                {[L.colSize, L.colNps, L.colCv].map((h, i) => (
                  <th key={i} style={{
                    padding: "9px 14px", textAlign: "center",
                    fontSize: 10, fontWeight: 900,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--border)"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDARDS_DN.map((d, i) => {
                const isRec = recDn === d.dn;
                return (
                  <tr key={i} style={{
                    background: isRec
                      ? "linear-gradient(135deg, rgba(224,168,26,0.12), rgba(184,133,10,0.04))"
                      : (i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)")
                  }}>
                    <td style={{
                      padding: "8px 14px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 900,
                      color: isRec ? "#B8850A" : "var(--text)",
                      position: "relative",
                      direction: "ltr"
                    }}>
                      {isRec && (
                        <Star
                          size={11}
                          fill="#E0A81A"
                          color="#E0A81A"
                          style={{ marginInlineEnd: 5, verticalAlign: "middle" }}
                        />
                      )}
                      {d.dn}
                    </td>
                    <td style={{
                      padding: "8px 14px", textAlign: "center",
                      fontFamily: "monospace",
                      color: isRec ? "#B8850A" : "var(--text-soft)",
                      direction: "ltr"
                    }}>
                      {d.nps}
                    </td>
                    <td style={{
                      padding: "8px 14px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 700,
                      color: isRec ? "#B8850A" : "var(--text)",
                      direction: "ltr"
                    }}>
                      {d.cv}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ANSI Table */}
          <div style={{
            padding: "10px 14px",
            fontSize: 11, fontWeight: 900, color: "var(--text)",
            background: "linear-gradient(135deg, rgba(0,120,212,0.08), rgba(0,120,212,0.02))",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 6,
            position: "sticky", top: 0, zIndex: 2
          }}>
            <Gauge size={13} color="#0078D4" />
            {L.ansiTitle}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)" }}>
                {[L.colAnsi, L.colPn, L.colBar].map((h, i) => (
                  <th key={i} style={{
                    padding: "9px 14px", textAlign: "center",
                    fontSize: 10, fontWeight: 900,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--border)"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDARDS_ANSI.map((d, i) => (
                <tr key={i} style={{
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)"
                }}>
                  <td style={{
                    padding: "8px 14px", textAlign: "center",
                    fontFamily: "monospace", fontWeight: 900,
                    color: "#0078D4", direction: "ltr"
                  }}>
                    Class {d.ansi}
                  </td>
                  <td style={{
                    padding: "8px 14px", textAlign: "center",
                    fontFamily: "monospace",
                    color: "var(--text-soft)",
                    direction: "ltr"
                  }}>
                    {d.pn}
                  </td>
                  <td style={{
                    padding: "8px 14px", textAlign: "center",
                    fontFamily: "monospace", fontWeight: 700,
                    color: "var(--text)",
                    direction: "ltr"
                  }}>
                    {d.bar}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ALTERNATIVE SIZES
// ============================================================
export function AlternativeSizes({ result, locale = "fa" }) {
  if (!result || !result.Cv) return null;
  const sizes = [
    { size: '0.5"', dn: "DN15", cv: 15 }, { size: '0.75"', dn: "DN20", cv: 28 },
    { size: '1"', dn: "DN25", cv: 45 }, { size: '1.5"', dn: "DN40", cv: 90 },
    { size: '2"', dn: "DN50", cv: 150 }, { size: '3"', dn: "DN80", cv: 320 },
    { size: '4"', dn: "DN100", cv: 550 }, { size: '6"', dn: "DN150", cv: 1250 }
  ];
  const required = result.Cv;
  const filtered = sizes.filter(s => s.cv >= required * 0.5 && s.cv <= required * 4);

  return (
    <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 900, color: "var(--text)"
      }}>
        <Activity size={14} color="var(--gold)" />
        {locale === "fa" ? "مقایسه سایزهای جایگزین" : "Alternative Sizes"}
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-soft)", zIndex: 1 }}>
            <tr>
              {(locale === "fa"
                ? ["سایز", "DN", "Cv", "بازشدگی", ""]
                : ["Size", "DN", "Cv", "Opening", ""]
              ).map((h, i) => (
                <th key={i} style={{
                  padding: "8px 10px", textAlign: "center",
                  fontSize: 10, fontWeight: 900, color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const opening = Math.round((required / s.cv) * 100);
              const isRecommended = result.size && result.size.size === s.size;
              const optimal = opening >= 20 && opening <= 80;
              return (
                <tr key={i} style={{
                  background: isRecommended ? "linear-gradient(135deg, rgba(224,168,26,0.08), rgba(184,133,10,0.02))" : (i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)")
                }}>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 900, fontFamily: "monospace", color: isRecommended ? "#B8850A" : "var(--text)" }}>{s.size}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", color: "var(--text-soft)" }}>{s.dn}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{s.cv}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", fontWeight: 900, color: optimal ? "#10B981" : "#F59E0B" }}>{opening}%</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    {isRecommended ? (
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 9.5, fontWeight: 900, background: "#E0A81A", color: "#FFFFFF" }}>
                        {locale === "fa" ? "پیشنهاد" : "Best"}
                      </span>
                    ) : optimal ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981" }}>✓</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// INSTALLED CHART
// ============================================================
export function InstalledChart({ result, form, locale = "fa" }) {
  const data = useMemo(() => {
    if (!result || !result.size || !form) return null;
    const cvMax = result.size.cv;
    const Gf = form.Gf || 1;
    const P1 = form.P1 || 10;
    const P2 = form.P2 || 6;
    const dP_total = P1 - P2;
    if (dP_total <= 0) return null;

    const N = 0.3;
    const dP_valve_max = N * dP_total;
    const Q_max = cvMax * Math.sqrt(dP_valve_max / Gf);
    const k_sys = ((1 - N) * dP_total) / (Q_max * Q_max);
    const charType = result.recommendedCharacteristic || "equal";

    const openings = Array.from({ length: 21 }, (_, i) => i * 5);
    const installed = openings.map(o => {
      const x = o / 100;
      const cv_x = cvMax * inherentCv(x, charType);
      let Q = cv_x * Math.sqrt(dP_total / Gf);
      for (let i = 0; i < 6; i++) {
        const dP_sys = k_sys * Q * Q;
        const dP_v = Math.max(0.001, dP_total - dP_sys);
        Q = cv_x * Math.sqrt(dP_v / Gf);
      }
      return [o, +Q.toFixed(2)];
    });

    const systemCurve = openings.map(o => [o, +((o / 100) * Q_max).toFixed(2)]);
    const opPoint = result.openingPercent ? [[result.openingPercent, form.Q]] : [];

    return {
      series: [
        { name: locale === "fa" ? "شیر نصب‌شده" : "Installed", data: installed },
        { name: locale === "fa" ? "منحنی سیستم" : "System", data: systemCurve },
        ...(opPoint.length ? [{ name: locale === "fa" ? "نقطه کار" : "Operating", data: opPoint, type: "scatter" }] : [])
      ],
      options: {
        chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: [2.5, 1.5, 0], dashArray: [0, 5, 0] },
        markers: { size: [0, 0, 9], strokeWidth: [0, 0, 2], strokeColors: "#FFFFFF" },
        xaxis: { title: { text: locale === "fa" ? "درصد بازشدگی (%)" : "Opening (%)" }, min: 0, max: 100, tickAmount: 10 },
        yaxis: { title: { text: "Q (m³/h)" } },
        colors: ["#E0A81A", "#9CA3AF", "#E81123"],
        legend: { position: "top", fontSize: "11px", fontWeight: 700 },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 3 }
      }
    };
  }, [result, form, locale]);

  if (!data) return null;

  return (
    <div className="card-glass" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
        📊 {locale === "fa" ? "مشخصه نصب‌شده (Installed)" : "Installed Characteristic"}
      </div>
      <Chart options={data.options} series={data.series} type="line" height={270} />
    </div>
  );
}

// ============================================================
// DELTA-P CHART
// ============================================================
export function DeltaPChart({ result, form, locale = "fa" }) {
  const data = useMemo(() => {
    if (!result || !result.Cv || !form) return null;
    const Gf = form.Gf || 1;
    const P1 = form.P1 || 10;
    const cv = result.Cv;
    const Ff = form.Pc ? (0.96 - 0.28 * Math.sqrt(Math.max(0, form.Pv || 0) / form.Pc)) : 0.95;
    const FL = form.FL || 0.9;
    const dPmax = FL * FL * (P1 - Ff * (form.Pv || 0));

    const deltaPs = Array.from({ length: 30 }, (_, i) => +((i + 1) * 0.5).toFixed(1))
      .filter(dp => dp <= P1 * 0.99);

    const curve = deltaPs.map(dp => {
      const dPeff = Math.min(dp, dPmax);
      return [dp, +(cv * Math.sqrt(dPeff / Gf)).toFixed(2)];
    });

    const dP_actual = P1 - (form.P2 || 0);
    const opPoint = dP_actual > 0 ? [[+dP_actual.toFixed(2), form.Q]] : [];

    return {
      series: [
        { name: "Q vs ΔP", data: curve },
        ...(opPoint.length ? [{ name: locale === "fa" ? "نقطه کار" : "Operating", data: opPoint, type: "scatter" }] : [])
      ],
      options: {
        chart: { type: "line", toolbar: { show: false } },
        stroke: { curve: "smooth", width: [2.5, 0] },
        markers: { size: [0, 9], strokeWidth: [0, 2], strokeColors: "#FFFFFF" },
        xaxis: { title: { text: "ΔP (bar)" }, type: "numeric" },
        yaxis: { title: { text: "Q (m³/h)" } },
        colors: ["#0078D4", "#E81123"],
        annotations: {
          xaxis: [{
            x: +dPmax.toFixed(2),
            borderColor: "#E81123",
            strokeDashArray: 4,
            label: { text: "Choked", style: { background: "#E81123", color: "#FFFFFF", fontSize: "10px", fontWeight: 900 } }
          }]
        },
        legend: { position: "top", fontSize: "11px", fontWeight: 700 },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 3 }
      }
    };
  }, [result, form, locale]);

  if (!data) return null;

  return (
    <div className="card-glass" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
        📉 {locale === "fa" ? "دبی در برابر افت فشار" : "Flow vs Pressure Drop"}
      </div>
      <Chart options={data.options} series={data.series} type="line" height={250} />
    </div>
  );
}