"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Droplets, Wind, Flame, Check, X, Calculator } from "lucide-react";

const FLUID_OPTIONS = [
  { id: "liquid", icon: Droplets, color: "#0078D4",
    fa: { title: "مایع", desc: "آب، روغن، اسید، سوخت" },
    en: { title: "Liquid", desc: "Water, oil, acid, fuel" } },
  { id: "gas", icon: Wind, color: "#F7630C",
    fa: { title: "گاز", desc: "گاز طبیعی، هوا" },
    en: { title: "Gas", desc: "Natural gas, air" } },
  { id: "steam", icon: Flame, color: "#E81123",
    fa: { title: "بخار", desc: "بخار اشباع، فوق گرم" },
    en: { title: "Steam", desc: "Saturated, superheated" } }
];

const PRESET_LIQUIDS = [
  { id: "water", icon: "💧", fa: "آب", en: "Water", Pv: 0.0317, Pc: 221, Gf: 1.0 },
  { id: "oil", icon: "🛢", fa: "روغن", en: "Oil", Pv: 0.01, Pc: 22, Gf: 0.85 },
  { id: "gasoline", icon: "⛽", fa: "بنزین", en: "Gasoline", Pv: 0.65, Pc: 32, Gf: 0.75 },
  { id: "condensate", icon: "💦", fa: "کاندنس", en: "Condensate", Pv: 0.5, Pc: 42, Gf: 0.7 }
];

export default function SizingWizard({ onComplete, onClose, locale }) {
  const [step, setStep] = useState(1);
  const [fluid, setFluid] = useState(null);
  const [preset, setPreset] = useState(null);
  const [data, setData] = useState({
    Q: 100, P1: 10, P2: 6, T: 25, Pv: 0.5, Pc: 221, Gf: 1, W: 500, Gg: 0.65
  });

  const L = {
    fa: {
      title: "راهنمای سایزینگ گام‌به‌گام",
      subtitle: "در ۳ مرحله ساده به نتیجه برسید",
      step1: "نوع سیال",
      step2: "شرایط کاری",
      step3: "خلاصه و محاسبه",
      next: "مرحله بعد",
      back: "مرحله قبل",
      finish: "محاسبه کن",
      cancel: "انصراف",
      chooseLiquid: "سیال نمونه را انتخاب کنید",
      flow: "دبی",
      p1: "فشار ورودی",
      p2: "فشار خروجی",
      temp: "دما",
      pv: "فشار بخار",
      summary: "خلاصه ورودی‌ها",
      gasInfo: "برای گاز طبیعی Gg=0.65 و برای هوا Gg=1.0",
      steamInfo: "برای بخار، دبی جرمی (kg/h) وارد کنید"
    },
    en: {
      title: "Step-by-Step Sizing Wizard",
      subtitle: "Get results in 3 simple steps",
      step1: "Fluid Type",
      step2: "Conditions",
      step3: "Summary",
      next: "Next",
      back: "Back",
      finish: "Calculate",
      cancel: "Cancel",
      chooseLiquid: "Choose a liquid preset",
      flow: "Flow",
      p1: "Inlet Pressure",
      p2: "Outlet Pressure",
      temp: "Temperature",
      pv: "Vapor Pressure",
      summary: "Summary",
      gasInfo: "For natural gas Gg=0.65, for air Gg=1.0",
      steamInfo: "For steam, enter mass flow in kg/h"
    },
    ar: {
      title: "معالج تحديد الحجم",
      subtitle: "احصل على النتائج في 3 خطوات",
      step1: "نوع السائل",
      step2: "الظروف",
      step3: "الملخص",
      next: "التالي",
      back: "السابق",
      finish: "احسب",
      cancel: "إلغاء",
      chooseLiquid: "اختر سائل جاهز",
      flow: "التدفق",
      p1: "الضغط الداخل",
      p2: "الضغط الخارج",
      temp: "الحرارة",
      pv: "ضغط البخار",
      summary: "الملخص",
      gasInfo: "للغاز الطبيعي Gg=0.65",
      steamInfo: "للبخار أدخل kg/h"
    },
    ru: {
      title: "Пошаговый подбор",
      subtitle: "Результат в 3 шага",
      step1: "Тип жидкости",
      step2: "Условия",
      step3: "Итог",
      next: "Далее",
      back: "Назад",
      finish: "Рассчитать",
      cancel: "Отмена",
      chooseLiquid: "Выберите пресет",
      flow: "Расход",
      p1: "Давление P1",
      p2: "Давление P2",
      temp: "Температура",
      pv: "Давление паров",
      summary: "Итог",
      gasInfo: "Для газа Gg=0.65",
      steamInfo: "Для пара введите kg/h"
    }
  }[locale] || {};

  const steps = [
    { id: 1, label: L.step1 },
    { id: 2, label: L.step2 },
    { id: 3, label: L.step3 }
  ];

  function selectFluid(id) {
    setFluid(id);
    setPreset(null);
    if (id !== "liquid") setPreset({ id: "default" });
  }

  function selectPreset(p) {
    setPreset(p);
    setData(function(prev) {
      return Object.assign({}, prev, { Pv: p.Pv, Pc: p.Pc, Gf: p.Gf });
    });
  }

  function canNext() {
    if (step === 1) return fluid && preset;
    if (step === 2) return data.Q > 0 && data.P1 > 0 && data.P2 > 0 && data.P1 > data.P2;
    return true;
  }

  function next() {
    if (!canNext()) return;
    if (step < 3) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function finish() {
    onComplete({
      fluid: fluid,
      form: Object.assign({}, data, { Z: 1, k: 1.4, xT: 0.7, FL: 0.9 })
    });
  }

  function update(k, v) {
    setData(Object.assign({}, data, { [k]: parseFloat(v) || 0 }));
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(20, 22, 27, 0.7)",
      backdropFilter: "blur(8px)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }} onClick={onClose}>
      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
        }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>
              ✨ {L.title}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>
              {L.subtitle}
            </div>
          </div>
          <button onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "grid", placeItems: "center",
              color: "var(--text)"
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div style={{
          padding: "16px 24px",
          background: "var(--bg-soft)",
          borderBottom: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {steps.map(function(s, i) {
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    display: "grid", placeItems: "center",
                    background: isDone || isActive
                      ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                      : "var(--bg-card)",
                    border: isDone || isActive ? "none" : "1px solid var(--border)",
                    color: isDone || isActive ? "#FFFFFF" : "var(--text-muted)",
                    fontSize: 12, fontWeight: 900,
                    boxShadow: isActive ? "0 4px 12px rgba(201, 149, 13, 0.35)" : "none",
                    flexShrink: 0
                  }}>
                    {isDone ? <Check size={14} /> : s.id}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 900,
                    color: isActive ? "var(--text)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: isDone ? "#E0A81A" : "var(--border)",
                      borderRadius: 1,
                      marginInlineStart: 8
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, minHeight: 280 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1 */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.step1}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                    {FLUID_OPTIONS.map(function(f) {
                      const Icon = f.icon;
                      const active = fluid === f.id;
                      const t = f[locale] || f.en;
                      return (
                        <button key={f.id} onClick={function() { selectFluid(f.id); }}
                          style={{
                            padding: 16,
                            borderRadius: 14,
                            border: "2px solid " + (active ? f.color : "var(--border)"),
                            background: active ? f.color + "10" : "#FFFFFF",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "center",
                            transition: "all 0.2s",
                            position: "relative"
                          }}>
                          {active && (
                            <div style={{
                              position: "absolute",
                              top: 8, insetInlineEnd: 8,
                              width: 20, height: 20,
                              borderRadius: "50%",
                              background: f.color,
                              display: "grid", placeItems: "center",
                              color: "#FFFFFF"
                            }}>
                              <Check size={12} />
                            </div>
                          )}
                          <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            margin: "0 auto 10px",
                            display: "grid", placeItems: "center",
                            background: f.color + "15",
                            color: f.color
                          }}>
                            <Icon size={24} />
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.5 }}>
                            {t.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {fluid === "liquid" && (
                    <>
                      <div style={{
                        fontSize: 11.5, fontWeight: 900,
                        color: "var(--text-muted)",
                        marginBottom: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        {L.chooseLiquid}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {PRESET_LIQUIDS.map(function(p) {
                          const active = preset && preset.id === p.id;
                          return (
                            <button key={p.id} onClick={function() { selectPreset(p); }}
                              style={{
                                padding: 12,
                                borderRadius: 12,
                                border: "1.5px solid " + (active ? "#E0A81A" : "var(--border)"),
                                background: active ? "rgba(201, 149, 13, 0.08)" : "#FFFFFF",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "center",
                                transition: "all 0.15s"
                              }}>
                              <div style={{ fontSize: 24, marginBottom: 6 }}>{p.icon}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--text)" }}>
                                {locale === "fa" ? p.fa : p.en}
                              </div>
                              <div style={{
                                fontSize: 9.5,
                                color: "var(--text-muted)",
                                fontWeight: 700,
                                marginTop: 3,
                                fontFamily: "monospace"
                              }}>
                                Gf {p.Gf}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {fluid === "gas" && (
                    <div style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(247, 99, 12, 0.06)",
                      border: "1px solid rgba(247, 99, 12, 0.25)",
                      fontSize: 12,
                      color: "#CA5010",
                      fontWeight: 700,
                      lineHeight: 1.7
                    }}>
                      ℹ️ {L.gasInfo}
                    </div>
                  )}

                  {fluid === "steam" && (
                    <div style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(232, 17, 35, 0.06)",
                      border: "1px solid rgba(232, 17, 35, 0.25)",
                      fontSize: 12,
                      color: "#C40E1C",
                      fontWeight: 700,
                      lineHeight: 1.7
                    }}>
                      ⚠️ {L.steamInfo}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.step2}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {fluid === "steam" ? (
                      <WizardField label={L.flow} unit="kg/h" value={data.W} onChange={function(v) { update("W", v); }} />
                    ) : (
                      <WizardField
                        label={L.flow}
                        unit={fluid === "liquid" ? "m³/h" : "Nm³/h"}
                        value={data.Q}
                        onChange={function(v) { update("Q", v); }}
                      />
                    )}
                    <WizardField label={L.p1} unit="bar" value={data.P1} onChange={function(v) { update("P1", v); }} />
                    <WizardField label={L.p2} unit="bar" value={data.P2} onChange={function(v) { update("P2", v); }} />

                    {fluid === "liquid" && (
                      <WizardField label={L.pv} unit="bar" value={data.Pv} onChange={function(v) { update("Pv", v); }} />
                    )}
                    {fluid !== "liquid" && (
                      <WizardField label={L.temp} unit="°C" value={data.T} onChange={function(v) { update("T", v); }} />
                    )}
                    {fluid === "gas" && (
                      <WizardField label="Gg" unit="—" value={data.Gg || 0.65} onChange={function(v) { update("Gg", v); }} />
                    )}
                  </div>

                  {data.P1 && data.P2 && data.P1 <= data.P2 && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(232, 17, 35, 0.08)",
                      border: "1px solid rgba(232, 17, 35, 0.3)",
                      color: "#E81123",
                      fontSize: 12,
                      fontWeight: 800
                    }}>
                      ⚠️ فشار ورودی باید بیشتر از فشار خروجی باشد
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>
                    {L.summary}
                  </div>

                  <div style={{
                    padding: 16,
                    borderRadius: 14,
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)"
                  }}>
                    <SummaryRow
                      label={L.step1}
                      value={fluid === "liquid" ? (locale === "fa" ? "مایع" : "Liquid") : fluid === "gas" ? (locale === "fa" ? "گاز" : "Gas") : (locale === "fa" ? "بخار" : "Steam")}
                    />
                    {preset && preset.id !== "default" && (
                      <SummaryRow
                        label={L.chooseLiquid}
                        value={locale === "fa" ? preset.fa : preset.en}
                      />
                    )}
                    {fluid === "steam" ? (
                      <SummaryRow label={L.flow} value={data.W + " kg/h"} />
                    ) : (
                      <SummaryRow
                        label={L.flow}
                        value={data.Q + (fluid === "liquid" ? " m³/h" : " Nm³/h")}
                      />
                    )}
                    <SummaryRow label={L.p1} value={data.P1 + " bar"} />
                    <SummaryRow label={L.p2} value={data.P2 + " bar"} />
                    {fluid === "liquid" && <SummaryRow label={L.pv} value={data.Pv + " bar"} />}
                    {fluid !== "liquid" && <SummaryRow label={L.temp} value={data.T + " °C"} />}
                    {fluid === "gas" && <SummaryRow label="Gg" value={String(data.Gg || 0.65)} />}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 10,
          background: "var(--bg-soft)"
        }}>
          {step > 1 && (
            <button onClick={back}
              style={{
                padding: "12px 20px",
                borderRadius: 11,
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
              <ArrowRight size={14} /> {L.back}
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button onClick={onClose}
            style={{
              padding: "12px 20px",
              borderRadius: 11,
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 900,
              color: "var(--text-muted)"
            }}>
            {L.cancel}
          </button>

          {step < 3 ? (
            <button onClick={next}
              disabled={!canNext()}
              style={{
                padding: "12px 24px",
                borderRadius: 11,
                border: "none",
                cursor: canNext() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                background: canNext()
                  ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                  : "var(--bg-soft)",
                color: canNext() ? "#FFFFFF" : "var(--text-muted)",
                boxShadow: canNext() ? "0 6px 16px rgba(201, 149, 13, 0.35)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: canNext() ? 1 : 0.5
              }}>
              {L.next} <ArrowLeft size={14} />
            </button>
          ) : (
            <button onClick={finish}
              style={{
                padding: "12px 24px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 900,
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
              <Calculator size={14} /> {L.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardField({ label, unit, value, onChange }) {
  return (
    <div>
      <label style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 900,
        color: "var(--text-muted)",
        marginBottom: 6
      }}>
        <span>{label}</span>
        <span style={{
          fontFamily: "monospace",
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 5,
          background: "var(--bg-soft)"
        }}>
          {unit}
        </span>
      </label>
      <input
        type="number"
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "2px solid var(--border)",
          background: "var(--bg-soft)",
          color: "var(--text)",
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: 700,
          transition: "all 0.15s"
        }}
        onFocus={function(e) {
          e.target.style.borderColor = "#E0A81A";
          e.target.style.background = "#FFFFFF";
        }}
        onBlur={function(e) {
          e.target.style.borderColor = "var(--border)";
          e.target.style.background = "var(--bg-soft)";
        }}
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 900,
        color: "var(--text)",
        fontFamily: "monospace",
        direction: "ltr"
      }}>{value}</span>
    </div>
  );
}
