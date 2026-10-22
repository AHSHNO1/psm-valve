"use client";
import { useState } from "react";
import { Droplets, Wind, Flame, ArrowLeft, ArrowRight, Check, X, Sparkles } from "lucide-react";

const STEPS = ["fluid", "conditions", "performance", "confirm"];

export default function SizingWizard({ locale = "fa", form, fluid, setForm, setFluid, onCalculate, onCancel }) {
  const [step, setStep] = useState(0);
  const [wizFluid, setWizFluid] = useState(fluid || "liquid");
  const [wizForm, setWizForm] = useState(form);

  const isFa = locale === "fa";

  const L = {
    fa: {
      title: "حالت ساده — قدم‌به‌قدم",
      cancel: "انصراف",
      next: "بعدی",
      back: "قبلی",
      finish: "محاسبه و نمایش نتیجه",
      step1Title: "چه سیالی را می‌خواهید سایز کنید؟",
      step1Desc: "نوع سیال را انتخاب کنید",
      step2Title: "شرایط کاری",
      step2Desc: "دما و فشارهای کاری",
      step3Title: "عملکرد مورد نیاز",
      step3Desc: "دبی و مشخصات سیال",
      step4Title: "بررسی نهایی",
      step4Desc: "اطلاعات را یک بار دیگر چک کنید",
      liquid: "مایع", gas: "گاز", steam: "بخار",
      liquidDesc: "آب، روغن، بنزین، اسید …",
      gasDesc: "هوا، گاز طبیعی، هیدروژن …",
      steamDesc: "بخار اشباع یا سوپرهیت",
      Q: "دبی مورد نیاز",
      W: "دبی بخار (kg/h)",
      P1: "فشار ورودی",
      P2: "فشار خروجی",
      T: "دمای سیال",
      Gf: "چگالی نسبی",
      Gg: "چگالی گاز",
      Pv: "فشار بخار",
      review: "بررسی اطلاعات",
      continueBtn: "ادامه",
      summary: "خلاصه اطلاعات"
    },
    en: {
      title: "Simple Mode — Step by Step",
      cancel: "Cancel",
      next: "Next",
      back: "Back",
      finish: "Calculate & Show Result",
      step1Title: "What fluid do you want to size?",
      step1Desc: "Choose the fluid type",
      step2Title: "Operating Conditions",
      step2Desc: "Temperature and pressures",
      step3Title: "Performance Required",
      step3Desc: "Flow rate and fluid data",
      step4Title: "Final Review",
      step4Desc: "Check the info once more",
      liquid: "Liquid", gas: "Gas", steam: "Steam",
      liquidDesc: "Water, oil, gasoline, acid …",
      gasDesc: "Air, natural gas, hydrogen …",
      steamDesc: "Saturated or superheated steam",
      Q: "Required flow rate",
      W: "Steam flow (kg/h)",
      P1: "Inlet pressure",
      P2: "Outlet pressure",
      T: "Fluid temperature",
      Gf: "Specific gravity",
      Gg: "Gas specific gravity",
      Pv: "Vapor pressure",
      review: "Review",
      continueBtn: "Continue",
      summary: "Summary"
    },
    ar: {
      title: "الوضع البسيط", cancel: "إلغاء", next: "التالي", back: "السابق", finish: "احسب",
      step1Title: "ما هو السائل؟", step1Desc: "اختر النوع", step2Title: "ظروف التشغيل", step2Desc: "الحرارة والضغط",
      step3Title: "الأداء المطلوب", step3Desc: "التدفق والخصائص", step4Title: "المراجعة", step4Desc: "تحقق",
      liquid: "سائل", gas: "غاز", steam: "بخار",
      liquidDesc: "ماء، زيت …", gasDesc: "هواء، غاز …", steamDesc: "بخار",
      Q: "التدفق", W: "تدفق البخار", P1: "الدخول", P2: "الخروج", T: "الحرارة",
      Gf: "الكثافة", Gg: "كثافة الغاز", Pv: "ضغط البخار",
      review: "مراجعة", continueBtn: "متابعة", summary: "الملخص"
    },
    ru: {
      title: "Простой режим", cancel: "Отмена", next: "Далее", back: "Назад", finish: "Рассчитать",
      step1Title: "Какую среду?", step1Desc: "Выберите тип", step2Title: "Условия", step2Desc: "Т и давление",
      step3Title: "Требования", step3Desc: "Расход и свойства", step4Title: "Проверка", step4Desc: "Проверьте",
      liquid: "Жидкость", gas: "Газ", steam: "Пар",
      liquidDesc: "Вода, масло …", gasDesc: "Воздух, газ …", steamDesc: "Пар",
      Q: "Расход", W: "Расход пара", P1: "Вход", P2: "Выход", T: "Температура",
      Gf: "Плотность", Gg: "Плотность газа", Pv: "Давление паров",
      review: "Проверка", continueBtn: "Далее", summary: "Сводка"
    }
  }[locale] || {};

  function upd(k, v) {
    setWizForm({ ...wizForm, [k]: parseFloat(v) || 0 });
  }

  function handleFinish() {
    setFluid(wizFluid);
    setForm(wizForm);
    setTimeout(() => onCalculate(), 50);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="card-glass" style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="var(--gold)" />
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{L.title}</span>
        </div>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 800, fontFamily: "inherit"
        }}>
          <X size={12} /> {L.cancel}
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)" }}>
            {isFa ? `قدم ${step + 1} از ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--gold)" }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? "linear-gradient(90deg, #E0A81A, #B8850A)" : "var(--bg-soft)",
              transition: "background 0.3s"
            }} />
          ))}
        </div>
      </div>

      {/* Step 1: Fluid */}
      {step === 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{L.step1Title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{L.step1Desc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { id: "liquid", icon: Droplets, title: L.liquid, desc: L.liquidDesc, color: "#0078D4" },
              { id: "gas", icon: Wind, title: L.gas, desc: L.gasDesc, color: "#F7630C" },
              { id: "steam", icon: Flame, title: L.steam, desc: L.steamDesc, color: "#E81123" }
            ].map(f => {
              const Icon = f.icon;
              const active = wizFluid === f.id;
              return (
                <button key={f.id} onClick={() => setWizFluid(f.id)}
                  style={{
                    padding: 18, borderRadius: 14,
                    background: active ? "linear-gradient(135deg, " + f.color + ", " + f.color + "cc)" : "#FFFFFF",
                    border: "2px solid " + (active ? "transparent" : "var(--border)"),
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    color: active ? "#FFFFFF" : "var(--text)",
                    boxShadow: active ? "0 12px 28px " + f.color + "50" : "none",
                    transition: "all 0.2s"
                  }}>
                  <Icon size={28} />
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{f.title}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, lineHeight: 1.5, textAlign: "center",
                    color: active ? "rgba(255,255,255,0.85)" : "var(--text-muted)"
                  }}>{f.desc}</div>
                  {active && (
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "var(--bg-card)", color: f.color,
                      display: "grid", placeItems: "center"
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Conditions */}
      {step === 1 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{L.step2Title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{L.step2Desc}</p>
          <div style={{ display: "grid", gap: 14 }}>
            <WizField label={L.P1} value={wizForm.P1} onChange={v => upd("P1", v)} unit="bar" />
            <WizField label={L.P2} value={wizForm.P2} onChange={v => upd("P2", v)} unit="bar" />
            {wizFluid !== "liquid" && <WizField label={L.T} value={wizForm.T} onChange={v => upd("T", v)} unit="°C" />}
            {wizFluid === "liquid" && <WizField label={L.Pv} value={wizForm.Pv} onChange={v => upd("Pv", v)} unit="bar" step={0.01} />}
          </div>
        </div>
      )}

      {/* Step 3: Performance */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{L.step3Title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{L.step3Desc}</p>
          <div style={{ display: "grid", gap: 14 }}>
            {wizFluid === "steam"
              ? <WizField label={L.W} value={wizForm.W} onChange={v => upd("W", v)} unit="kg/h" />
              : <WizField label={L.Q} value={wizForm.Q} onChange={v => upd("Q", v)} unit={wizFluid === "liquid" ? "m³/h" : "Nm³/h"} />}
            {wizFluid === "liquid" && <WizField label={L.Gf} value={wizForm.Gf} onChange={v => upd("Gf", v)} step={0.01} />}
            {wizFluid === "gas" && <WizField label={L.Gg} value={wizForm.Gg} onChange={v => upd("Gg", v)} step={0.01} />}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{L.step4Title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{L.step4Desc}</p>
          <div style={{
            padding: 16, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(224,168,26,0.05), rgba(184,133,10,0.02))",
            border: "1px solid rgba(224,168,26,0.25)"
          }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--gold)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {L.summary}
            </div>
            <ReviewRow label={isFa ? "سیال" : "Fluid"} value={wizFluid === "liquid" ? L.liquid : wizFluid === "gas" ? L.gas : L.steam} />
            {wizFluid === "steam" ? (
              <ReviewRow label={L.W} value={`${wizForm.W} kg/h`} />
            ) : (
              <ReviewRow label={L.Q} value={`${wizForm.Q} ${wizFluid === "liquid" ? "m³/h" : "Nm³/h"}`} />
            )}
            <ReviewRow label={L.P1} value={`${wizForm.P1} bar`} />
            <ReviewRow label={L.P2} value={`${wizForm.P2} bar`} />
            <ReviewRow label="ΔP" value={`${(wizForm.P1 - wizForm.P2).toFixed(2)} bar`} />
            {wizFluid !== "liquid" && <ReviewRow label={L.T} value={`${wizForm.T} °C`} />}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{
            padding: "12px 20px", borderRadius: 10,
            background: "var(--bg-soft)", border: "1px solid var(--border)",
            cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, fontWeight: 900, color: "var(--text-soft)",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <ArrowRight size={14} /> {L.back}
          </button>
        )}
        <button
          onClick={step < STEPS.length - 1 ? () => setStep(step + 1) : handleFinish}
          className="btn-gold justify-center"
          style={{ flex: 1, padding: "12px", fontSize: 13.5 }}>
          {step < STEPS.length - 1 ? (
            <>{L.next} <ArrowLeft size={14} /></>
          ) : (
            <><Check size={16} /> {L.finish}</>
          )}
        </button>
      </div>
    </div>
  );
}

function WizField({ label, value, onChange, unit, step }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{label}</span>
        {unit && (
          <span style={{
            fontSize: 10, fontFamily: "monospace", fontWeight: 700,
            padding: "2px 7px", borderRadius: 5,
            background: "var(--bg-soft)", color: "var(--text-muted)"
          }}>{unit}</span>
        )}
      </div>
      <input
        type="number"
        step={step || 1}
        value={value == null ? "" : value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          border: "1.5px solid var(--border)", background: "var(--bg-soft)",
          color: "var(--text)", fontFamily: "monospace",
          fontSize: 15, fontWeight: 700
        }}
        onFocus={e => {
          e.target.style.borderColor = "#E0A81A";
          e.target.style.background = "#FFFFFF";
          e.target.style.boxShadow = "0 0 0 3px rgba(201, 149, 13, 0.12)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.background = "var(--bg-soft)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "8px 0", borderBottom: "1px dashed var(--border)"
    }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text)", fontFamily: "monospace", direction: "ltr" }}>{value}</span>
    </div>
  );
}