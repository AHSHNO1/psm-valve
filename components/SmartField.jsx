"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const VALIDATORS = {
  Q: function(v, form, fluid) {
    if (v <= 0) return { type: "error", msg: "دبی باید بیشتر از صفر باشد" };
    if (v > 100000) return { type: "warn", msg: "دبی خیلی بالا — بررسی کنید" };
    return null;
  },
  P1: function(v, form) {
    if (v <= 0) return { type: "error", msg: "فشار باید مثبت باشد" };
    if (form.P2 && v <= form.P2) return { type: "error", msg: "P1 باید از P2 بیشتر باشد" };
    return null;
  },
  P2: function(v, form) {
    if (v < 0) return { type: "error", msg: "فشار نمی‌تواند منفی باشد" };
    if (form.P1 && v >= form.P1) return { type: "error", msg: "P2 باید از P1 کمتر باشد" };
    return null;
  },
  Pv: function(v, form) {
    if (v < 0) return { type: "error", msg: "فشار بخار منفی نامعتبر" };
    if (form.P1 && v >= form.P1) return { type: "warn", msg: "Pv باید خیلی کمتر از P1 باشد" };
    return null;
  },
  Pc: function(v) {
    if (v <= 0) return { type: "error", msg: "Pc باید مثبت باشد" };
    if (v < 10) return { type: "warn", msg: "Pc خیلی کم — بررسی کنید" };
    return null;
  },
  T: function(v) {
    if (v < -273) return { type: "error", msg: "دما زیر صفر مطلق" };
    if (v > 1000) return { type: "warn", msg: "دما بسیار بالا — بررسی متریال" };
    return null;
  },
  Gf: function(v) {
    if (v <= 0) return { type: "error", msg: "چگالی باید مثبت باشد" };
    if (v > 20) return { type: "warn", msg: "چگالی غیرعادی — بررسی کنید" };
    return null;
  },
  Gg: function(v) {
    if (v <= 0) return { type: "error", msg: "چگالی گاز باید مثبت باشد" };
    if (v > 5) return { type: "warn", msg: "چگالی گاز خیلی بالا" };
    return null;
  }
};

export default function SmartField({
  label,
  unit,
  value,
  onChange,
  form,
  fluid,
  step,
  fieldKey,
  hint
}) {
  const [validation, setValidation] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(function() {
    const validator = VALIDATORS[fieldKey];
    if (!validator) { setValidation(null); return; }
    const r = validator(value, form, fluid);
    setValidation(r);
  }, [value, form, fluid, fieldKey]);

  const hasError = validation && validation.type === "error";
  const hasWarn = validation && validation.type === "warn";
  const hasSuccess = touched && !hasError && !hasWarn && value > 0;

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
        gap: 6
      }}>
        <label style={{
          fontSize: 12,
          fontWeight: 900,
          color: hasError ? "#E81123" : "var(--text)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "color 0.15s"
        }}>
          {label}
          {hasSuccess && (
            <CheckCircle2 size={11} style={{ color: "#10B981" }} />
          )}
        </label>
        {unit && (
          <span style={{
            fontSize: 10.5,
            color: "#B8850A",
            fontFamily: "monospace",
            fontWeight: 900,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(201, 149, 13, 0.10)",
            border: "1px solid rgba(201, 149, 13, 0.25)"
          }}>
            {unit}
          </span>
        )}
      </div>

      <input
        type="number"
        step={step || 1}
        value={value}
        onChange={onChange}
        onBlur={function() { setTouched(true); }}
        style={{
          width: "100%",
          padding: "11px 12px",
          borderRadius: 10,
          border: "2px solid " + (
            hasError ? "#E81123" :
            hasWarn ? "#F59E0B" :
            hasSuccess ? "#10B981" : "var(--border)"
          ),
          background: hasError
            ? "rgba(232, 17, 35, 0.04)"
            : hasWarn
            ? "rgba(245, 158, 11, 0.04)"
            : hasSuccess
            ? "rgba(16, 185, 129, 0.03)"
            : "var(--bg-soft)",
          color: "var(--text)",
          fontFamily: "monospace",
          fontSize: 14.5,
          fontWeight: 700,
          transition: "all 0.15s"
        }}
        onFocus={function(e) {
          e.target.style.borderColor = hasError ? "#E81123" : "#E0A81A";
          e.target.style.background = "#FFFFFF";
          e.target.style.boxShadow = "0 0 0 3px " + (hasError ? "rgba(232, 17, 35, 0.12)" : "rgba(201, 149, 13, 0.12)");
        }}
      />

      {/* Live validation message */}
      {validation && touched && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginTop: 5,
          fontSize: 11.5,
          fontWeight: 700,
          color: hasError ? "#E81123" : "#D97706",
          lineHeight: 1.5,
          padding: "4px 8px",
          borderRadius: 6,
          background: hasError
            ? "rgba(232, 17, 35, 0.06)"
            : "rgba(245, 158, 11, 0.06)"
        }}>
          {hasError ? <AlertTriangle size={12} /> : <Info size={12} />}
          {validation.msg}
        </div>
      )}

      {/* Hint */}
      {!validation && hint && (
        <div style={{
          marginTop: 5,
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 600,
          lineHeight: 1.6
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
