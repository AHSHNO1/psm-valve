"use client";
import { useState, useRef } from "react";
import { Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Save, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function blankSlider() {
  return {
    id: "slide-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    subtitle: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    ctaText: { fa: "", en: "", ar: "", ru: "" },
    ctaHref: "/products",
    order: 99,
    active: true
  };
}

export default function SliderManager({ initial }) {
  const [sliders, setSliders] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    setBusy(true);
    try {
      const res = await fetch("/api/sliders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sliders: list })
      });
      const data = await res.json();
      if (data.ok) {
        setSliders(list);
        notify("✓ ذخیره شد");
      } else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
    setBusy(false);
  }

  function move(idx, dir) {
    const list = [...sliders];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    save(list);
  }

  function toggleActive(idx) {
    const list = [...sliders];
    list[idx].active = !list[idx].active;
    save(list);
  }

  function remove(idx) {
    if (!confirm("این اسلاید حذف شود؟")) return;
    const list = sliders.filter(function(_, i) { return i !== idx; });
    save(list);
  }

  function add() {
    const s = blankSlider();
    setSliders([...sliders, s]);
    setEditing(s.id);
  }

  function updateSlide(id, patch) {
    setSliders(sliders.map(function(s) { return s.id === id ? { ...s, ...patch } : s; }));
  }

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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm" style={{ color: "var(--m-text-soft)" }}>
          {sliders.length} اسلاید — با فلش‌ها ترتیب را تغییر دهید
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> اسلاید جدید
        </button>
      </div>

      <div className="space-y-3">
        {sliders.map(function(s, i) {
          const isEditing = editing === s.id;
          return (
            <div key={s.id} className="metro-card overflow-hidden metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="p-4 flex items-center gap-4">
                <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "#F1F3F5", border: "1px solid var(--m-border)" }}>
                  {s.image ? (
                    <img src={s.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[10px] font-black"
                      style={{ color: "var(--m-text-muted)" }}>بدون تصویر</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate" style={{ color: "var(--m-text)" }}>
                    {s.title.fa || s.title.en || "بدون عنوان"}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "var(--m-text-muted)" }}>
                    {s.subtitle.fa || s.subtitle.en || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={function() { move(i, -1); }} disabled={i === 0}
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: "var(--m-bg-2)", opacity: i === 0 ? 0.3 : 1 }}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={function() { move(i, 1); }} disabled={i === sliders.length - 1}
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: "var(--m-bg-2)", opacity: i === sliders.length - 1 ? 0.3 : 1 }}>
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={function() { toggleActive(i); }}
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: s.active ? "rgba(16, 124, 16, 0.15)" : "rgba(123, 132, 148, 0.15)", color: s.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                    {s.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button type="button" onClick={function() { setEditing(isEditing ? null : s.id); }}
                    className="w-8 h-8 rounded-lg grid place-items-center font-black text-[10px]"
                    style={{ background: "rgba(0, 120, 212, 0.15)", color: "#0078D4" }}>
                    {isEditing ? "بستن" : "ویرایش"}
                  </button>
                  <button type="button" onClick={function() { remove(i); }}
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: "rgba(232, 17, 35, 0.1)", color: "#E81123" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <SlideEditor
                  slide={s}
                  updateSlide={updateSlide}
                  onSave={function() { save(sliders); setEditing(null); }}
                  onCancel={function() { setEditing(null); }}
                />
              )}
            </div>
          );
        })}

        {sliders.length === 0 && (
          <div className="metro-card p-12 text-center metro-in">
            <p className="font-black mb-2" style={{ color: "var(--m-text)" }}>هنوز اسلایدی اضافه نشده</p>
            <p className="text-xs mb-4" style={{ color: "var(--m-text-muted)" }}>اولین اسلاید صفحه اصلی را بسازید</p>
            <button type="button" onClick={add} className="big-btn big-btn-primary">
              <Plus size={16} /> افزودن اولین اسلاید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SlideEditor({ slide, updateSlide, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) updateSlide(slide.id, { image: data.url });
    } catch (e) {}
    setUploading(false);
  }

  function upd(field, val) {
    const clone = { ...slide[field], [lang]: val };
    updateSlide(slide.id, { [field]: clone });
  }

  return (
    <div className="p-5 space-y-4" style={{ borderTop: "1px solid var(--m-border)", background: "#FAFBFC" }}>
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button
              key={l.code}
              type="button"
              onClick={function() { setLang(l.code); }}
              className={"lang-tab" + (lang === l.code ? " lang-tab-active" : "")}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="big-field-label">عنوان اسلاید</div>
          <input
            type="text"
            value={slide.title[lang] || ""}
            onChange={function(e) { upd("title", e.target.value); }}
            className="big-input"
          />

          <div className="big-field-label" style={{ marginTop: "12px" }}>زیرعنوان</div>
          <input
            type="text"
            value={slide.subtitle[lang] || ""}
            onChange={function(e) { upd("subtitle", e.target.value); }}
            className="big-input"
          />

          <div className="big-field-label" style={{ marginTop: "12px" }}>متن دکمه</div>
          <input
            type="text"
            value={slide.ctaText[lang] || ""}
            onChange={function(e) { upd("ctaText", e.target.value); }}
            className="big-input"
          />

          <div className="big-field-label" style={{ marginTop: "12px" }}>لینک دکمه</div>
          <input
            type="text"
            dir="ltr"
            value={slide.ctaHref || ""}
            onChange={function(e) { updateSlide(slide.id, { ctaHref: e.target.value }); }}
            className="big-input"
          />
        </div>

        <div>
          <div className="big-field-label">تصویر اسلاید (1920×800 توصیه‌شده)</div>
          {slide.image ? (
            <div className="slider-thumb relative">
              <img src={slide.image} alt="" />
              <button
                type="button"
                onClick={function() { updateSlide(slide.id, { image: "" }); }}
                className="absolute top-2 left-2 w-8 h-8 rounded-lg grid place-items-center"
                style={{ background: "rgba(232, 17, 35, 0.9)", color: "#FFFFFF" }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={function() { inputRef.current && inputRef.current.click(); }}
              className="big-dropzone"
              style={{ padding: "32px 20px" }}
            >
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={function(e) { upload(e.target.files && e.target.files[0]); }} />
              {uploading ? (
                <Loader2 size={32} className="animate-spin mx-auto" style={{ color: "#E0A81A" }} />
              ) : (
                <>
                  <UploadCloud size={32} style={{ color: "#B8850A", margin: "0 auto 8px" }} />
                  <div className="text-xs font-black">کلیک یا رها کنید</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onSave} className="big-btn big-btn-green" style={{ flex: 1, padding: "12px" }}>
          <Save size={16} /> ذخیره این اسلاید
        </button>
        <button type="button" onClick={onCancel} className="big-btn big-btn-ghost" style={{ padding: "12px 20px" }}>
          بستن
        </button>
      </div>
    </div>
  );
}
