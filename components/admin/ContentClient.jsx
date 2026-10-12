"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

const SECTIONS = [
  {
    id: "hero",
    title: "بخش هدر (Hero)",
    icon: "sparkles",
    color: "#0078D4",
    fields: [
      { key: "badge", label: "برچسب بالا" },
      { key: "title1", label: "عنوان خط اول" },
      { key: "title2", label: "عنوان خط دوم (طلایی)" },
      { key: "title3", label: "عنوان خط سوم" },
      { key: "desc", label: "توضیح", multiline: true },
      { key: "cta1", label: "دکمه اول" },
      { key: "cta2", label: "دکمه دوم" }
    ]
  },
  {
    id: "cta",
    title: "بخش CTA پایین",
    icon: "arrowLeft",
    color: "#107C10",
    fields: [
      { key: "title", label: "عنوان" },
      { key: "desc", label: "توضیح", multiline: true },
      { key: "button", label: "دکمه" }
    ]
  },
  {
    id: "certificates",
    title: "بخش گواهینامه‌ها",
    icon: "award",
    color: "#4F6BED",
    fields: [
      { key: "title", label: "عنوان" },
      { key: "subtitle", label: "زیرعنوان" }
    ]
  }
];

export default function ContentClient({ initial }) {
  const [content, setContent] = useState(initial || {});
  const [section, setSection] = useState("hero");
  const [lang, setLang] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  const currentSection = SECTIONS.find(function(s) { return s.id === section; });

  function getValue(secId, fieldKey) {
    const sec = content[secId] || {};
    const field = sec[fieldKey];
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang] || "";
  }

  function setValue(secId, fieldKey, value) {
    setContent(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      if (!clone[secId]) clone[secId] = {};
      const existing = clone[secId][fieldKey];
      if (existing && typeof existing === "object") {
        clone[secId][fieldKey][lang] = value;
      } else {
        clone[secId][fieldKey] = { fa: "", en: "", ar: "", ru: "" };
        clone[secId][fieldKey][lang] = value;
      }
      return clone;
    });
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (data.ok) notify("ذخیره شد");
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #8764B8, #6B4C9C)" }}>
            <Icon name="file" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">متن‌های سایت</div>
            <div className="page-header-sub">ویرایش متن بخش‌های اصلی در ۴ زبان</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {/* Section tabs */}
      <div className="tabs anim-in">
        {SECTIONS.map(function(s) {
          return (
            <button key={s.id} onClick={function() { setSection(s.id); }}
              className={"tab" + (section === s.id ? " tab-active" : "")}>
              <Icon name={s.icon} size={13} />
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Language tabs */}
      <div className="tabs anim-in">
        {LANGS.map(function(l) {
          return (
            <button key={l.code} onClick={function() { setLang(l.code); }}
              className={"tab" + (lang === l.code ? " tab-active" : "")}>
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div className="anim-in" style={{
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 12,
        padding: 16
      }}>
        {currentSection.fields.map(function(f) {
          const val = getValue(section, f.key);
          return (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label className="form-label">{f.label}</label>
              {f.multiline ? (
                <textarea rows={3} value={val}
                  onChange={function(e) { setValue(section, f.key, e.target.value); }}
                  className="form-input" />
              ) : (
                <input type="text" value={val}
                  onChange={function(e) { setValue(section, f.key, e.target.value); }}
                  className="form-input" />
              )}
            </div>
          );
        })}
      </div>

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </div>
  );
}
