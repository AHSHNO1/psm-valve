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

function DataTable({ headers, rows, accent }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
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
                background: i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)"
              }}>
                {row.map(function(cell, j) {
                  return (
                    <td key={j} style={{
                      padding: "9px 14px",
                      textAlign: "center",
                      fontFamily: "monospace",
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
      tempHeaders: ["°C", "°F", "K"]
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
      tempHeaders: ["°C", "°F", "K"]
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
      tempHeaders: ["°C", "°F", "K"]
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
      tempHeaders: ["°C", "°F", "K"]
    }
  }[locale] || {};

  const tabs = [
    { id: "dn", label: L.dnTab, accent: "#E0A81A" },
    { id: "pressure", label: L.pressureTab, accent: "#0078D4" },
    { id: "cv", label: L.cvTab, accent: "#10B981" },
    { id: "temp", label: L.tempTab, accent: "#F7630C" }
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
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
            <button key={t.id} onClick={function() { setTab(t.id); }}
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
    </section>
  );
}
