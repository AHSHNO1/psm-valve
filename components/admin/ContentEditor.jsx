"use client";
import { useState } from "react";
import { Save, Loader2, CheckCircle2, AlertTriangle, FileText, Type } from "lucide-react";

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
    icon: Type,
    color: "#1478C9",
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
    title: "بخش CTA پایین صفحه",
    icon: Type,
    color: "#1B8F1B",
    fields: [
      { key: "title", label: "عنوان" },
      { key: "desc", label: "توضیح", multiline: true },
      { key: "button", label: "دکمه" }
    ]
  },
  {
    id: "certificates",
    title: "بخش گواهینامه‌ها",
    icon: Type,
    color: "#6380F0",
    fields: [
      { key: "title", label: "عنوان" },
      { key: "subtitle", label: "زیرعنوان" }
    ]
  }
];

export default function ContentEditor({ initial }) {
  const [content, setContent] = useState(initial || {});
  const [section, setSection] = useState("hero");
  const [lang, setLang] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ type: "success", text: "✓ محتوا ذخیره شد" });
        setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
      } else setMsg({ type: "error", text: "خطا" });
    } catch (e) { setMsg({ type: "error", text: "خطای شبکه" }); }
    setBusy(false);
  }

  const SectionIcon = currentSection.icon;

  return (
    <div className="space-y-6">
      {msg.text && (
        <div className="p-3 rounded-lg flex items-center gap-2 text-sm font-black metro-in"
          style={{
            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: "1px solid " + (msg.type === "success" ? "#A7F3D0" : "#FECACA"),
            color: msg.type === "success" ? "#065F46" : "#991B1B"
          }}>
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(function(s) {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={function() { setSection(s.id); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition"
              style={{
                background: active ? s.color : "#FFFFFF",
                color: active ? "#FFFFFF" : "var(--m-text-soft)",
                border: "1px solid " + (active ? s.color : "var(--m-border)"),
                boxShadow: active ? "0 4px 14px " + s.color + "40" : "none"
              }}
            >
              <s.icon size={14} />
              {s.title}
            </button>
          );
        })}
      </div>

      <div className="metro-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: currentSection.color + "18", color: currentSection.color }}>
            <SectionIcon size={20} />
          </div>
          <div className="font-black text-lg" style={{ color: "var(--m-text)" }}>
            {currentSection.title}
          </div>
        </div>

        <div className="lang-tabs" style={{ marginBottom: "20px" }}>
          {LANGS.map(function(l) {
            return (
              <button key={l.code} type="button" onClick={function() { setLang(l.code); }}
                className={"lang-tab" + (lang === l.code ? " lang-tab-active" : "")}>
                {l.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {currentSection.fields.map(function(f) {
            const val = getValue(section, f.key);
            return (
              <div key={f.key}>
                <label className="big-field-label">{f.label}</label>
                {f.multiline ? (
                  <textarea
                    rows={3}
                    value={val}
                    onChange={function(e) { setValue(section, f.key, e.target.value); }}
                    className="big-input"
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={function(e) { setValue(section, f.key, e.target.value); }}
                    className="big-input"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-4 metro-card p-4 flex gap-3">
        <button type="button" onClick={save} disabled={busy} className="big-btn big-btn-green" style={{ flex: 1 }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          ذخیره تغییرات
        </button>
      </div>
    </div>
  );
}
