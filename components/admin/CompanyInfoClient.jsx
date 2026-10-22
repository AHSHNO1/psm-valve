"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Mail, MessageCircle, Plus, Trash2 } from "lucide-react";
import { SaveBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";

const LANGUAGES = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

const inputStyle = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #D1D5DB",
  borderRadius: 9,
  padding: "9px 12px",
  color: "#1A1D21",
  background: "#FFFFFF"
};

function setAtPath(source, path, value) {
  const next = JSON.parse(JSON.stringify(source));
  const parts = path.split(".");
  let current = next;
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]];
  current[parts[parts.length - 1]] = value;
  return next;
}

function Field({ label, value, onChange, type = "text", hint }) {
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <span className="form-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
        dir={type === "email" || type === "tel" || type === "url" ? "ltr" : undefined}
      />
      {hint && <small style={{ color: "#667085" }}>{hint}</small>}
    </label>
  );
}

function Section({ title, description, icon: Icon, children }) {
  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: 12, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Icon size={19} color="#7354A6" />
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1A1D21" }}>{title}</h2>
          {description && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#667085" }}>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function CompanyInfoClient({ initial }) {
  const [company, setCompany] = useState(initial);
  const [locale, setLocale] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  function update(path, value) {
    setCompany((current) => setAtPath(current, path, value));
  }

  function notify(text, type) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/company-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ذخیره اطلاعات ناموفق بود");
      setCompany(data.company);
      notify("اطلاعات تماس و شرکت ذخیره شد", "success");
    } catch (error) {
      notify(error.message || "ارتباط با سرور برقرار نشد؛ اطلاعات ذخیره نشد", "error");
    } finally {
      setBusy(false);
    }
  }

  const addressFields = [
    { path: "address.office", label: "آدرس دفتر مرکزی" },
    { path: "address.factory", label: "آدرس کارخانه" }
  ];

  return (
    <div>
      <ContentStudioNav />
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #7354A6, #52377D)" }}>
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">اطلاعات شرکت و تماس</div>
            <div className="page-header-sub">یک منبع مشترک برای اطلاعات تماس فوتر و صفحه تماس سایت</div>
          </div>
        </div>
        <SaveBtn onClick={save} busy={busy} />
      </div>

      {message.text && (
        <div className={"msg anim-in " + (message.type === "success" ? "msg-success" : "msg-error")} role="status">
          {message.text}
        </div>
      )}

      <div className="tabs anim-in" role="group" aria-label="زبان آدرس‌ها">
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => setLocale(language.code)}
            aria-pressed={locale === language.code}
            className={"tab" + (locale === language.code ? " tab-active" : "")}
          >
            {language.label}
          </button>
        ))}
      </div>

      <Section title="آدرس‌ها و موقعیت" description="آدرس‌ها در فوتر و صفحه تماس، متناسب با زبان انتخابی نمایش داده می‌شوند." icon={MapPin}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {addressFields.map(({ path, label }) => (
            <Field key={path} label={label} value={company[path.split(".")[0]][path.split(".")[1]][locale]}
              onChange={(value) => update(`${path}.${locale}`, value)} />
          ))}
          <Field label="کدپستی" value={company.address.postalCode} onChange={(value) => update("address.postalCode", value)} />
          <Field label="عرض جغرافیایی کارخانه" value={company.address.factoryCoordinates.latitude}
            onChange={(value) => update("address.factoryCoordinates.latitude", value)} hint="برای نمایش موقعیت دقیق روی نقشه" />
          <Field label="طول جغرافیایی کارخانه" value={company.address.factoryCoordinates.longitude}
            onChange={(value) => update("address.factoryCoordinates.longitude", value)} hint="برای نمایش موقعیت دقیق روی نقشه" />
        </div>
      </Section>

      <Section title="تلفن‌ها، ایمیل و فکس" description="این مقادیر در فوتر و صفحه تماس به‌صورت همگام استفاده می‌شوند." icon={Phone}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Field label="تلفن دفتر" type="tel" value={company.phone.office} onChange={(value) => update("phone.office", value)} />
          <Field label="تلفن کارخانه" type="tel" value={company.phone.factory} onChange={(value) => update("phone.factory", value)} />
          <Field label="تلفن دوم" type="tel" value={company.phone.secondary} onChange={(value) => update("phone.secondary", value)} hint="در فوتر، کنار تلفن نمایش داده می‌شود" />
          <Field label="فکس دفتر" type="tel" value={company.fax.office} onChange={(value) => update("fax.office", value)} />
          <Field label="فکس کارخانه" type="tel" value={company.fax.factory} onChange={(value) => update("fax.factory", value)} />
          <Field label="ایمیل اصلی" type="email" value={company.email.primary} onChange={(value) => update("email.primary", value)} />
          <Field label="ایمیل دوم" type="email" value={company.email.secondary} onChange={(value) => update("email.secondary", value)} />
        </div>
        <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
          <strong style={{ fontSize: 13 }}>شماره‌های همراه</strong>
          {company.phone.mobile.map((number, index) => (
            <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="tel" value={number} onChange={(event) => update(`phone.mobile.${index}`, event.target.value)} style={inputStyle} dir="ltr" aria-label={`شماره همراه ${index + 1}`} />
              <button type="button" className="act-btn act-btn-delete" title="حذف شماره" aria-label="حذف شماره همراه"
                onClick={() => setCompany((current) => ({ ...current, phone: { ...current.phone, mobile: current.phone.mobile.filter((_, i) => i !== index) } }))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {company.phone.mobile.length < 10 && (
            <button type="button" className="btn-outline" style={{ width: "fit-content" }}
              onClick={() => setCompany((current) => ({ ...current, phone: { ...current.phone, mobile: [...current.phone.mobile, ""] } }))}>
              <Plus size={15} /> افزودن شماره همراه
            </button>
          )}
        </div>
      </Section>

      <Section title="شناسه پیام‌رسان‌ها" description="نام کاربری نمایش‌داده‌شده در صفحه تماس." icon={MessageCircle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {Object.entries(company.messengers).map(([key, value]) => (
            <Field key={key} label={{ bale: "بله", rubika: "روبیکا", eita: "ایتا" }[key]}
              value={value} onChange={(next) => update(`messengers.${key}`, next)} />
          ))}
        </div>
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 24 }}>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </div>
  );
}
