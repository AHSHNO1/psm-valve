"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Mail, MessageCircle, Plus, Trash2 } from "lucide-react";
import { SaveBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { FormSection, FormGrid, Field, LocaleTabs, languageDir } from "./EditorPanel";
import { useUnsavedChanges, isDirty } from "./useUnsavedChanges";

const LANGUAGES = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function setAtPath(source, path, value) {
  const next = JSON.parse(JSON.stringify(source));
  const parts = path.split(".");
  let current = next;
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]];
  current[parts[parts.length - 1]] = value;
  return next;
}

function ContactInput({ value, onChange, type = "text", dir, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="form-input"
      dir={dir || (["email", "tel", "url"].includes(type) ? "ltr" : undefined)}
      {...rest}
    />
  );
}

export default function CompanyInfoClient({ initial }) {
  const [company, setCompany] = useState(initial);
  const [savedCompany, setSavedCompany] = useState(initial);
  const [locale, setLocale] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const dirty = isDirty(company, savedCompany);
  useUnsavedChanges(dirty);

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
      setSavedCompany(data.company);
      notify("اطلاعات تماس و شرکت ذخیره شد", "success");
    } catch (error) {
      notify(error.message || "ارتباط با سرور برقرار نشد؛ اطلاعات ذخیره نشد", "error");
    } finally {
      setBusy(false);
    }
  }

  const addressFields = [
    { key: "office", label: "آدرس دفتر مرکزی" },
    { key: "factory", label: "آدرس کارخانه" }
  ];
  const filled = {};
  LANGUAGES.forEach((language) => {
    filled[language.code] = Boolean(
      company.address.office[language.code] || company.address.factory[language.code]
    );
  });
  const currentDir = languageDir(locale);

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
        {dirty && <span className="chip chip-gold">تغییرات ذخیره‌نشده</span>}
      </div>

      {message.text && (
        <div className={"msg anim-in " + (message.type === "success" ? "msg-success" : "msg-error")} role="status">
          {message.text}
        </div>
      )}

      <EditorPanel
        title="آدرس‌ها و موقعیت"
        subtitle="آدرس‌ها در فوتر و صفحه تماس، متناسب با زبان انتخابی نمایش داده می‌شوند."
        icon={<MapPin size={17} />}
      >
        <LocaleTabs lang={locale} onChange={setLocale} filled={filled} hint="زبان آدرس‌ها را انتخاب کنید." />
        <FormSection>
          <FormGrid>
            {addressFields.map(({ key, label }) => (
              <Field key={key} label={label} wide>
                <input
                  type="text"
                  value={company.address[key][locale] || ""}
                  onChange={(event) => update(`address.${key}.${locale}`, event.target.value)}
                  className="form-input"
                  dir={currentDir}
                />
              </Field>
            ))}
            <Field label="کدپستی">
              <ContactInput value={company.address.postalCode} onChange={(value) => update("address.postalCode", value)} />
            </Field>
            <Field label="عرض جغرافیایی کارخانه" hint="برای نمایش موقعیت دقیق روی نقشه">
              <ContactInput value={company.address.factoryCoordinates.latitude}
                onChange={(value) => update("address.factoryCoordinates.latitude", value)} />
            </Field>
            <Field label="طول جغرافیایی کارخانه" hint="برای نمایش موقعیت دقیق روی نقشه">
              <ContactInput value={company.address.factoryCoordinates.longitude}
                onChange={(value) => update("address.factoryCoordinates.longitude", value)} />
            </Field>
          </FormGrid>
        </FormSection>
      </EditorPanel>

      <EditorPanel
        title="تلفن‌ها، ایمیل و فکس"
        subtitle="این مقادیر در فوتر و صفحه تماس به‌صورت همگام استفاده می‌شوند."
        icon={<Phone size={17} />}
      >
        <FormSection>
          <FormGrid>
            <Field label="تلفن دفتر">
              <ContactInput type="tel" value={company.phone.office} onChange={(value) => update("phone.office", value)} />
            </Field>
            <Field label="تلفن کارخانه">
              <ContactInput type="tel" value={company.phone.factory} onChange={(value) => update("phone.factory", value)} />
            </Field>
            <Field label="تلفن دوم" hint="در فوتر، کنار تلفن نمایش داده می‌شود">
              <ContactInput type="tel" value={company.phone.secondary} onChange={(value) => update("phone.secondary", value)} />
            </Field>
            <Field label="فکس دفتر">
              <ContactInput type="tel" value={company.fax.office} onChange={(value) => update("fax.office", value)} />
            </Field>
            <Field label="فکس کارخانه">
              <ContactInput type="tel" value={company.fax.factory} onChange={(value) => update("fax.factory", value)} />
            </Field>
            <Field label="ایمیل اصلی">
              <ContactInput type="email" value={company.email.primary} onChange={(value) => update("email.primary", value)} />
            </Field>
            <Field label="ایمیل دوم">
              <ContactInput type="email" value={company.email.secondary} onChange={(value) => update("email.secondary", value)} />
            </Field>
          </FormGrid>

          <div className="company-mobile-block">
            <span className="form-field-label">شماره‌های همراه</span>
            <div className="company-mobile-list">
              {company.phone.mobile.map((number, index) => (
                <div key={index} className="company-mobile-row">
                  <input
                    type="tel"
                    value={number}
                    onChange={(event) => update(`phone.mobile.${index}`, event.target.value)}
                    className="form-input"
                    dir="ltr"
                    aria-label={`شماره همراه ${index + 1}`}
                  />
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
          </div>
        </FormSection>
      </EditorPanel>

      <EditorPanel
        title="شناسه پیام‌رسان‌ها"
        subtitle="نام کاربری نمایش‌داده‌شده در صفحه تماس."
        icon={<MessageCircle size={17} />}
      >
        <FormSection>
          <FormGrid>
            {Object.entries(company.messengers).map(([key, value]) => (
              <Field key={key} label={{ bale: "بله", rubika: "روبیکا", eita: "ایتا" }[key]}>
                <ContactInput value={value} onChange={(next) => update(`messengers.${key}`, next)} />
              </Field>
            ))}
          </FormGrid>
        </FormSection>
      </EditorPanel>

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
        <span className="text-soft" style={{ fontSize: 12, fontWeight: 700 }}>
          <Mail size={13} aria-hidden="true" /> اطلاعات پس از ذخیره در فوتر و صفحه تماس به‌روز می‌شود.
        </span>
      </div>
    </div>
  );
}
