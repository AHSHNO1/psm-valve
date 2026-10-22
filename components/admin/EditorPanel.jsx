"use client";

import { X } from "lucide-react";

export const ADMIN_LANGUAGES = [
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" }
];

export function languageDir(code) {
  return ADMIN_LANGUAGES.find((item) => item.code === code)?.dir || "rtl";
}

export default function EditorPanel({ title, subtitle, icon, badge, onClose, children, className = "" }) {
  return (
    <section className={"editor-panel anim-in " + className} aria-label={title || "ویرایش"}>
      <header className="editor-panel-head">
        <div className="editor-panel-heading">
          {icon && <span className="editor-panel-icon" aria-hidden="true">{icon}</span>}
          <div className="editor-panel-heading-text">
            <h3 className="editor-panel-title">{title || "ویرایش"}</h3>
            {subtitle && <p className="editor-panel-sub">{subtitle}</p>}
          </div>
        </div>
        <div className="editor-panel-head-actions">
          {badge}
          {onClose && (
            <button type="button" className="editor-close" onClick={onClose} aria-label="بستن ویرایش" title="بستن">
              <X size={15} />
            </button>
          )}
        </div>
      </header>
      <div className="editor-panel-body">{children}</div>
    </section>
  );
}

export function FormSection({ title, description, icon, actions, children }) {
  return (
    <section className="form-section">
      {(title || description || actions) && (
        <header className="form-section-head">
          {icon && <span className="form-section-icon" aria-hidden="true">{icon}</span>}
          <div className="form-section-heading">
            {title && <h4 className="form-section-title">{title}</h4>}
            {description && <p className="form-section-desc">{description}</p>}
          </div>
          {actions && <div className="form-section-actions">{actions}</div>}
        </header>
      )}
      <div className="form-section-body">{children}</div>
    </section>
  );
}

export function FormGrid({ children, className = "" }) {
  return <div className={"form-grid " + className}>{children}</div>;
}

export function Field({ label, hint, required, wide, as: Tag = "label", children, className = "", ...rest }) {
  return (
    <Tag className={"form-field" + (wide ? " form-field-wide" : "") + (className ? " " + className : "")} {...rest}>
      {label && (
        <span className="form-field-label">
          {label}
          {required && <em className="form-field-req" aria-hidden="true">*</em>}
        </span>
      )}
      {children}
      {hint && <span className="form-field-hint">{hint}</span>}
    </Tag>
  );
}

export function LocaleTabs({ lang, onChange, filled, hint = "برای هر زبان، محتوای همان زبان را وارد کنید." }) {
  return (
    <div className="editor-locale-bar">
      <div className="tabs editor-locale-tabs" role="group" aria-label="انتخاب زبان ویرایش">
        {ADMIN_LANGUAGES.map((item) => {
          const isFilled = Boolean(filled && filled[item.code]);
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={lang === item.code}
              title={isFilled ? item.label + " — تکمیل شده" : item.label + " — خالی"}
              onClick={() => onChange(item.code)}
              className={"tab" + (lang === item.code ? " tab-active" : "")}
            >
              {item.label}
              <span className={"locale-dot" + (isFilled ? " locale-dot-filled" : "")} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {hint && <span className="editor-locale-hint">{hint}</span>}
    </div>
  );
}
