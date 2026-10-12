"use client";
import { useState, useRef } from "react";
import { Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Save, Newspaper, Eye, EyeOff } from "lucide-react";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function blankNews() {
  return {
    id: "news-" + Date.now().toString(36),
    slug: "",
    title: { fa: "", en: "", ar: "", ru: "" },
    excerpt: { fa: "", en: "", ar: "", ru: "" },
    content: { fa: "", en: "", ar: "", ru: "" },
    category: { fa: "اخبار شرکت", en: "Company News", ar: "أخبار الشركة", ru: "Новости компании" },
    image: "",
    date: new Date().toLocaleDateString("fa-IR"),
    active: true,
    order: 99
  };
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function NewsManager({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("✓ ذخیره شد", false); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const n = blankNews();
    const list = items.concat([n]);
    setItems(list);
    setEditing(n.id);
  }

  function remove(idx) {
    if (!confirm("این خبر حذف شود؟")) return;
    save(items.filter(function(_, i) { return i !== idx; }));
  }

  function toggleActive(idx) {
    const list = items.slice();
    list[idx] = Object.assign({}, list[idx], { active: !list[idx].active });
    save(list);
  }

  function update(id, patch) {
    setItems(items.map(function(n) { return n.id === id ? Object.assign({}, n, patch) : n; }));
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
          {items.length} خبر — در صفحه /media?tab=news نمایش داده می‌شوند
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> خبر جدید
        </button>
      </div>

      <div className="space-y-3">
        {items.map(function(n, i) {
          const isEditing = editing === n.id;
          return (
            <div key={n.id} className="metro-card overflow-hidden metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "var(--m-bg-2)", border: "1px solid var(--m-border)" }}>
                  {n.image ? (
                    <img src={n.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Newspaper size={24} style={{ color: "var(--m-text-muted)" }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black mb-1" style={{ color: "#B8850A" }}>
                    {(n.category && (n.category.fa || n.category.en)) || "—"}
                  </div>
                  <div className="font-black text-sm truncate" style={{ color: "var(--m-text)" }}>
                    {(n.title && (n.title.fa || n.title.en)) || "بدون عنوان"}
                  </div>
                  <div className="text-[11px] truncate mt-1" style={{ color: "var(--m-text-muted)" }}>
                    {n.date || "—"} · {n.slug || "بدون نامک"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={function() { toggleActive(i); }}
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: n.active ? "rgba(16,124,16,0.15)" : "rgba(123,132,148,0.15)", color: n.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                    {n.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button type="button" onClick={function() { setEditing(isEditing ? null : n.id); }}
                    className="h-8 px-3 rounded-lg text-[11px] font-black"
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
                <NewsEditor
                  news={n}
                  update={update}
                  onSave={function() { save(items); setEditing(null); }}
                  onCancel={function() { setEditing(null); }}
                />
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="metro-card p-12 text-center metro-in">
            <Newspaper size={40} style={{ color: "var(--m-text-muted)", margin: "0 auto 12px" }} />
            <p className="font-black mb-2" style={{ color: "var(--m-text)" }}>هنوز خبری اضافه نشده</p>
            <button type="button" onClick={add} className="big-btn big-btn-primary mt-3">
              <Plus size={16} /> افزودن اولین خبر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsEditor({ news, update, onSave, onCancel }) {
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
      if (data.ok) update(news.id, { image: data.url });
    } catch (e) {}
    setUploading(false);
  }

  function upd(field, val) {
    const newField = Object.assign({}, news[field]);
    newField[lang] = val;
    const patch = {};
    patch[field] = newField;
    update(news.id, patch);
  }

  return (
    <div className="p-5 space-y-4" style={{ borderTop: "1px solid var(--m-border)", background: "#FAFBFC" }}>
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
          <div className="big-field-label">عنوان</div>
          <input type="text" value={news.title[lang] || ""} onChange={function(e) { upd("title", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>خلاصه</div>
          <textarea rows={2} value={news.excerpt[lang] || ""} onChange={function(e) { upd("excerpt", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>متن کامل</div>
          <textarea rows={5} value={news.content[lang] || ""} onChange={function(e) { upd("content", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>دسته‌بندی</div>
          <input type="text" value={news.category[lang] || ""} onChange={function(e) { upd("category", e.target.value); }} className="big-input" />
        </div>

        <div>
          <div className="big-field-label">نامک (slug)</div>
          <input type="text" dir="ltr" value={news.slug || ""} onChange={function(e) { update(news.id, { slug: e.target.value.replace(/[^a-z0-9-]/g, "") }); }} className="big-input" />
          {!news.slug && news.title.en && (
            <button type="button" onClick={function() { update(news.id, { slug: slugify(news.title.en) }); }}
              className="text-xs font-black mt-2" style={{ color: "#0078D4" }}>
              تولید خودکار از عنوان انگلیسی
            </button>
          )}

          <div className="big-field-label" style={{ marginTop: "12px" }}>تاریخ</div>
          <input type="text" value={news.date || ""} onChange={function(e) { update(news.id, { date: e.target.value }); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>تصویر خبر</div>
          {news.image ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={news.image} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={function() { update(news.id, { image: "" }); }}
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
                  <div className="text-xs font-black">کلیک کنید (1200×675 توصیه‌شده)</div>
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
