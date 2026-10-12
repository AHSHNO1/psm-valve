"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DN_NPS = [
  { dn: "DN15", nps: '1/2"', cv: 15 },
  { dn: "DN25", nps: '1"', cv: 45 },
  { dn: "DN50", nps: '2"', cv: 150 },
  { dn: "DN80", nps: '3"', cv: 320 },
  { dn: "DN100", nps: '4"', cv: 550 },
  { dn: "DN150", nps: '6"', cv: 1250 },
  { dn: "DN200", nps: '8"', cv: 2200 },
  { dn: "DN300", nps: '12"', cv: 4800 }
];

const ANSI_PN = [
  { ansi: "150", pn: "PN20", bar: 19.6 },
  { ansi: "300", pn: "PN50", bar: 51.1 },
  { ansi: "600", pn: "PN100", bar: 102.1 },
  { ansi: "900", pn: "PN150", bar: 153.2 },
  { ansi: "1500", pn: "PN250", bar: 255.3 },
  { ansi: "2500", pn: "PN420", bar: 425.5 }
];

export default function StandardsStrip({ locale }) {
  const [tab, setTab] = useState("dn");

  const L = {
    fa: {
      title: "جدول استانداردها",
      dn: "قطر و Cv",
      pressure: "فشار ANSI/PN",
      all: "مشاهده همه",
      dnCol: "DN",
      npsCol: "NPS",
      cvCol: "Cv",
      ansiCol: "ANSI",
      pnCol: "PN",
      barCol: "bar"
    },
    en: {
      title: "Standards Reference",
      dn: "Diameter & Cv",
      pressure: "Pressure ANSI/PN",
      all: "View All",
      dnCol: "DN",
      npsCol: "NPS",
      cvCol: "Cv",
      ansiCol: "ANSI",
      pnCol: "PN",
      barCol: "bar"
    },
    ar: {
      title: "المرجع القياسي",
      dn: "القطر و Cv",
      pressure: "الضغط",
      all: "عرض الكل",
      dnCol: "DN", npsCol: "NPS", cvCol: "Cv",
      ansiCol: "ANSI", pnCol: "PN", barCol: "bar"
    },
    ru: {
      title: "Справочник стандартов",
      dn: "Диаметр и Cv",
      pressure: "Давление",
      all: "Все",
      dnCol: "DN", npsCol: "NPS", cvCol: "Cv",
      ansiCol: "ANSI", pnCol: "PN", barCol: "bar"
    }
  }[locale] || {};

  const tabs = [
    { id: "dn", label: L.dn },
    { id: "pressure", label: L.pressure }
  ];

  return (
    <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 900,
          color: "var(--text)"
        }}>
          <span style={{ fontSize: 14 }}>📊</span>
          {L.title}
        </div>
        <div style={{
          display: "flex",
          gap: 4,
          padding: 3,
          background: "var(--bg-soft)",
          borderRadius: 8,
          border: "1px solid var(--border)"
        }}>
          {tabs.map(function(t) {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 10.5,
                  fontWeight: 900,
                  background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
                  color: active ? "#FFFFFF" : "var(--text-soft)",
                  transition: "all 0.15s"
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 200, overflow: "auto" }}>
        {tab === "dn" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead style={{
              position: "sticky", top: 0,
              background: "var(--bg-soft)",
              zIndex: 1
            }}>
              <tr>
                {[L.dnCol, L.npsCol, L.cvCol].map(function(h, i) {
                  return (
                    <th key={i} style={{
                      padding: "8px 12px",
                      textAlign: "center",
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--border)"
                    }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {DN_NPS.map(function(d, i) {
                return (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)"
                  }}>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 900,
                      color: "#B8850A"
                    }}>{d.dn}</td>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 800,
                      color: "var(--text)"
                    }}>{d.nps}</td>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 800,
                      color: "var(--text)"
                    }}>{d.cv}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "pressure" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead style={{
              position: "sticky", top: 0,
              background: "var(--bg-soft)",
              zIndex: 1
            }}>
              <tr>
                {[L.ansiCol, L.pnCol, L.barCol].map(function(h, i) {
                  return (
                    <th key={i} style={{
                      padding: "8px 12px",
                      textAlign: "center",
                      fontWeight: 900,
                      color: "var(--text-muted)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--border)"
                    }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ANSI_PN.map(function(d, i) {
                return (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? "#FFFFFF" : "var(--bg-soft)"
                  }}>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 900,
                      color: "#0078D4"
                    }}>Class {d.ansi}</td>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 800,
                      color: "var(--text)"
                    }}>{d.pn}</td>
                    <td style={{
                      padding: "7px 12px", textAlign: "center",
                      fontFamily: "monospace", fontWeight: 800,
                      color: "var(--text)"
                    }}>{d.bar}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer link */}
      <Link href={"/" + locale + "/standards"}
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-soft)",
          textDecoration: "none",
          fontSize: 11,
          fontWeight: 900,
          color: "var(--gold)"
        }}>
        {L.all}
        <ArrowLeft size={12} />
      </Link>
    </div>
  );
}
