"use client";
import { useState, useRef } from "react";
import { Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Save, Star, Eye, EyeOff } from "lucide-react";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function blankTestimonial() {
  return {
    id: "test-" + Date.now().toString(36),
    name: { fa: "", en: "", ar: "", ru: "" },
    role: { fa: "", en: "", ar: "", ru: "" },
    text: { fa: "", en: "", ar: "", ru: "" },
    rating: 5,
    image: "",
    active: true,
    order: 99
  };
}

export default function TestimonialsManager({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonials: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("✓ ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const t = blankTestimonial();
    setItems([...items, t]);
    setEditing(t.id);
  }

  function remove(idx) {
    if (!confirm("این نظر حذف شود؟")) return;
    save(items.filter(function(_, i) { return i !== idx; }));
  }

  function toggleActive(idx) {
    const list = [...items];
    list[idx].active = !list[idx].active;
    save(list);
  }

  function update(id, patch) {
    setItems(items.map(function(t) { return t.id === id ? { ...t, ...patch } : t; }));
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
          {items.length} نظر مشتری — در صفحه اصلی نمایش داده می‌شوند
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> نظر جدید
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(function(t, i) {
          return (
            <div key={t.id} className="metro-card p-5 metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(function(n) {
                    return (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= t.rating ? "#F5C518" : "transparent"}
                        style={{ color: n <= t.rating ? "#F5C518" : "#CBD5E1" }}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={function() { toggleActive(i); }}
                    className="w-7 h-7 rounded-md grid place-items-center"
                    style={{ background: t.active ? "rgba(16,124,16,0.15)" : "rgba(123,132,148,0.15)", color: t.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                    {t.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button type="button" onClick={function() { remove(i); }}
                    className="w-7 h-7 rounded-md grid place-items-center"
                    style={{ background: "rgba(232,17,35,0.1)", color: "#E81123" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="text-sm leading-7 mb-4 line-clamp-4" style={{ color: "var(--m-text-soft)" }}>
                {t.text.fa || t.text.en || "—"}
              </p>

              <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--m-border)" }}>
                {t.image ? (
                  <img src={t.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full grid place-items-center"
                    style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
                    <span className="text-white font-black text-sm">
                      {(t.name.fa || t.name.en || "?").charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-black text-xs truncate" style={{ color: "var(--m-text)" }}>
                    {t.name.fa || t.name.en || "بدون نام"}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--m-text-muted)" }}>
                    {t.role.fa || t.role.en || "—"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={function() { setEditing(editing === t.id ? null : t.id); }}
                className="w-full mt-3 text-[11px] font-black py-2 rounded-md"
                style={{ background: "rgba(0, 120, 212, 0.12)", color: "#0078D4" }}
              >
                {editing === t.id ? "بستن" : "ویرایش"}
              </button>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-span-full metro-card p-12 text-center metro-in">
            <Star size={40} style={{ color: "var(--m-text-muted)", margin: "0 auto 12px" }} />
            <p className="font-black mb-2" style={{ color: "var(--m-text)" }}>هنوز نظری اضافه نشده</p>
            <button type="button" onClick={add} className="big-btn big-btn-primary mt-3">
              <Plus size={16} /> افزودن اولین نظر
            </button>
          </div>
        )}
      </div>

      {editing && (
        <TestimonialEditor
          testimonial={items.find(function(t) { return t.id === editing; })}
          update={update}
          onSave={function() { save(items); setEditing(null); }}
          onCancel={function() { setEditing(null); }}
        />
      )}
    </div>
  );
}

function TestimonialEditor({ testimonial, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  if (!testimonial) return null;

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) update(testimonial.id, { image: data.url });
    } catch (e) {}
    setUploading(false);
  }

  function upd(field, val) {
    update(testimonial.id, { [field]: { ...testimonial[field], [lang]: val } });
  }

  return (
    <div className="metro-card p-6 space-y-5 metro-in">
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button key={l.code} type="button" onClick={function() { setLang(l.code); }}
              className={"lang-tab" + (lang === l.code ? " lang-tab-active" : "")}>
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="big-field-label">نام مشتری</div>
          <input type="text" value={testimonial.name[lang] || ""} onChange={function(e) { upd("name", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>عنوان / سمت</div>
          <input type="text" value={testimonial.role[lang] || ""} onChange={function(e) { upd("role", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>متن نظر</div>
          <textarea rows={5} value={testimonial.text[lang] || ""} onChange={function(e) { upd("text", e.target.value); }} className="big-input" />
        </div>

        <div>
          <div className="big-field-label">امتیاز</div>
          <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map(function(n) {
              return (
                <button key={n} type="button"
                  onClick={function() { update(testimonial.id, { rating: n }); }}
                  className="w-10 h-10 rounded-md grid place-items-center"
                  style={{ background: n <= testimonial.rating ? "rgba(245, 197, 24, 0.2)" : "var(--m-bg-2)" }}>
                  <Star size={20} fill={n <= testimonial.rating ? "#F5C518" : "transparent"} style={{ color: n <= testimonial.rating ? "#F5C518" : "#CBD5E1" }} />
                </button>
              );
            })}
          </div>

          <div className="big-field-label">تصویر (اختیاری)</div>
          {testimonial.image ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
              <img src={testimonial.image} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={function() { update(testimonial.id, { image: "" }); }}
                className="absolute top-2 left-2 w-8 h-8 rounded-lg grid place-items-center"
                style={{ background: "rgba(232,17,35,0.9)", color: "#FFFFFF" }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div onClick={function() { inputRef.current && inputRef.current.click(); }}
              className="big-dropzone" style={{ padding: "32px 20px" }}>
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={function(e) { upload(e.target.files && e.target.files[0]); }} />
              {uploading ? (
                <Loader2 size={32} className="animate-spin mx-auto" style={{ color: "#E0A81A" }} />
              ) : (
                <>
                  <UploadCloud size={32} style={{ color: "#B8850A", margin: "0 auto 8px" }} />
                  <div className="text-xs font-black">کلیک کنید (300×300 توصیه‌شده)</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onSave} className="big-btn big-btn-green" style={{ flex: 1 }}>
          <Save size={16} /> ذخیره
        </button>
        <button type="button" onClick={onCancel} className="big-btn big-btn-ghost" style={{ padding: "12px 20px" }}>
          بستن
        </button>
      </div>
    </div>
  );
}
