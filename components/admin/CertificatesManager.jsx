"use client";
import { useState, useRef } from "react";
import { Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Save, Award, Eye, EyeOff } from "lucide-react";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function blankCert() {
  return {
    id: "cert-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    issuer: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    order: 99,
    active: true
  };
}

export default function CertificatesManager({ initial }) {
  const [certs, setCerts] = useState(initial || []);
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
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificates: list })
      });
      const data = await res.json();
      if (data.ok) { setCerts(list); notify("✓ ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
    setBusy(false);
  }

  function add() {
    const c = blankCert();
    setCerts([...certs, c]);
    setEditing(c.id);
  }

  function remove(idx) {
    if (!confirm("این گواهینامه حذف شود؟")) return;
    save(certs.filter(function(_, i) { return i !== idx; }));
  }

  function toggleActive(idx) {
    const list = [...certs];
    list[idx].active = !list[idx].active;
    save(list);
  }

  function updateCert(id, patch) {
    setCerts(certs.map(function(c) { return c.id === id ? { ...c, ...patch } : c; }));
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
          {certs.length} گواهینامه — در فوتر و صفحه اصلی نمایش داده می‌شوند
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> گواهینامه جدید
        </button>
      </div>

      <div className="cert-grid">
        {certs.map(function(c, i) {
          const isEditing = editing === c.id;
          return (
            <div key={c.id} className="cert-card metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="absolute top-2 right-2 flex gap-1 opacity-70 hover:opacity-100">
                <button type="button" onClick={function() { toggleActive(i); }}
                  className="w-7 h-7 rounded-md grid place-items-center"
                  style={{ background: c.active ? "rgba(16,124,16,0.15)" : "rgba(123,132,148,0.15)", color: c.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                  {c.active ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button type="button" onClick={function() { remove(i); }}
                  className="w-7 h-7 rounded-md grid place-items-center"
                  style={{ background: "rgba(232,17,35,0.1)", color: "#E81123" }}>
                  <Trash2 size={12} />
                </button>
              </div>

              {c.image ? (
                <img src={c.image} alt="" className="cert-card-image" />
              ) : (
                <div className="cert-card-badge">
                  <Award size={24} />
                </div>
              )}
              <div className="cert-card-title">{c.title.fa || c.title.en || "بدون عنوان"}</div>
              <div className="cert-card-issuer">{c.issuer.fa || c.issuer.en || "—"}</div>

              <button
                type="button"
                onClick={function() { setEditing(isEditing ? null : c.id); }}
                className="mt-3 text-[10px] font-black px-3 py-1 rounded-md"
                style={{ background: "rgba(0, 120, 212, 0.12)", color: "#0078D4" }}
              >
                {isEditing ? "بستن" : "ویرایش"}
              </button>
            </div>
          );
        })}

        {certs.length === 0 && (
          <div className="col-span-full metro-card p-12 text-center metro-in">
            <p className="font-black mb-2" style={{ color: "var(--m-text)" }}>هنوز گواهینامه‌ای اضافه نشده</p>
            <button type="button" onClick={add} className="big-btn big-btn-primary mt-3">
              <Plus size={16} /> افزودن گواهینامه
            </button>
          </div>
        )}
      </div>

      {editing && (
        <CertEditor
          cert={certs.find(function(c) { return c.id === editing; })}
          updateCert={updateCert}
          onSave={function() { save(certs); setEditing(null); }}
          onCancel={function() { setEditing(null); }}
        />
      )}
    </div>
  );
}

function CertEditor({ cert, updateCert, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  if (!cert) return null;

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) updateCert(cert.id, { image: data.url });
    } catch (e) {}
    setUploading(false);
  }

  function upd(field, val) {
    updateCert(cert.id, { [field]: { ...cert[field], [lang]: val } });
  }

  return (
    <div className="metro-card p-5 space-y-4 metro-in">
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="big-field-label">عنوان گواهینامه</div>
          <input type="text" value={cert.title[lang] || ""} onChange={function(e) { upd("title", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>صادرکننده / توضیح</div>
          <input type="text" value={cert.issuer[lang] || ""} onChange={function(e) { upd("issuer", e.target.value); }} className="big-input" />
        </div>

        <div>
          <div className="big-field-label">تصویر گواهینامه (300×300 توصیه‌شده)</div>
          {cert.image ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
              <img src={cert.image} alt="" className="w-full h-full object-contain bg-white" />
              <button type="button" onClick={function() { updateCert(cert.id, { image: "" }); }}
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
                  <div className="text-xs font-black">کلیک کنید</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onSave} className="big-btn big-btn-green" style={{ flex: 1, padding: "12px" }}>
          <Save size={16} /> ذخیره
        </button>
        <button type="button" onClick={onCancel} className="big-btn big-btn-ghost" style={{ padding: "12px 20px" }}>
          بستن
        </button>
      </div>
    </div>
  );
}
