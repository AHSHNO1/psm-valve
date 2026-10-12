"use client";
import { useState, useRef } from "react";
import { Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Save, Building2, Eye, EyeOff, ExternalLink } from "lucide-react";

function blankPartner() {
  return {
    id: "p-" + Date.now().toString(36),
    name: { fa: "", en: "", ar: "", ru: "" },
    logo: "",
    url: "",
    active: true,
    order: 99
  };
}

export default function PartnersManager({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partners: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("✓ ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const p = blankPartner();
    setItems([...items, p]);
    setEditing(p.id);
  }

  function remove(idx) {
    if (!confirm("این شریک حذف شود؟")) return;
    save(items.filter(function(_, i) { return i !== idx; }));
  }

  function toggleActive(idx) {
    const list = [...items];
    list[idx].active = !list[idx].active;
    save(list);
  }

  function update(id, patch) {
    setItems(items.map(function(p) { return p.id === id ? { ...p, ...patch } : p; }));
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
          {items.length} شریک تجاری — در صفحه «همراهان» و فوتر نمایش داده می‌شوند
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> شریک جدید
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(function(p, i) {
          return (
            <div key={p.id} className="metro-card p-4 metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="aspect-square rounded-lg grid place-items-center mb-3 overflow-hidden"
                style={{ background: "#F8F9FB", border: "1px solid var(--m-border)" }}>
                {p.logo ? (
                  <img src={p.logo} alt="" className="w-full h-full object-contain p-3" />
                ) : (
                  <Building2 size={32} style={{ color: "var(--m-text-muted)" }} />
                )}
              </div>
              <div className="font-black text-xs truncate mb-1" style={{ color: "var(--m-text)" }}>
                {p.name.fa || p.name.en || "بدون نام"}
              </div>
              <div className="flex gap-1 mt-2">
                <button type="button" onClick={function() { toggleActive(i); }}
                  className="flex-1 h-7 rounded-md grid place-items-center"
                  style={{ background: p.active ? "rgba(16,124,16,0.15)" : "rgba(123,132,148,0.15)", color: p.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                  {p.active ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button type="button" onClick={function() { setEditing(editing === p.id ? null : p.id); }}
                  className="flex-1 h-7 rounded-md grid place-items-center text-[10px] font-black"
                  style={{ background: "rgba(0, 120, 212, 0.12)", color: "#0078D4" }}>
                  {editing === p.id ? "×" : "✎"}
                </button>
                <button type="button" onClick={function() { remove(i); }}
                  className="flex-1 h-7 rounded-md grid place-items-center"
                  style={{ background: "rgba(232,17,35,0.1)", color: "#E81123" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <PartnerEditor
          partner={items.find(function(p) { return p.id === editing; })}
          update={update}
          onSave={function() { save(items); setEditing(null); }}
          onCancel={function() { setEditing(null); }}
        />
      )}
    </div>
  );
}

function PartnerEditor({ partner, update, onSave, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  if (!partner) return null;

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) update(partner.id, { logo: data.url });
    } catch (e) {}
    setUploading(false);
  }

  function updName(lang, val) {
    update(partner.id, { name: { ...partner.name, [lang]: val } });
  }

  return (
    <div className="metro-card p-6 space-y-5 metro-in">
      <h3 className="font-black text-lg" style={{ color: "var(--m-text)" }}>ویرایش شریک تجاری</h3>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="big-field-label">نام (فارسی)</div>
          <input type="text" value={partner.name.fa || ""} onChange={function(e) { updName("fa", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>نام (انگلیسی)</div>
          <input type="text" dir="ltr" value={partner.name.en || ""} onChange={function(e) { updName("en", e.target.value); }} className="big-input" />

          <div className="big-field-label" style={{ marginTop: "12px" }}>لینک وب‌سایت</div>
          <input type="text" dir="ltr" value={partner.url || ""} onChange={function(e) { update(partner.id, { url: e.target.value }); }} className="big-input" />
        </div>

        <div>
          <div className="big-field-label">لوگو (400×200 توصیه‌شده، PNG شفاف)</div>
          {partner.logo ? (
            <div className="relative rounded-xl overflow-hidden bg-white p-4" style={{ aspectRatio: "2/1" }}>
              <img src={partner.logo} alt="" className="w-full h-full object-contain" />
              <button type="button" onClick={function() { update(partner.id, { logo: "" }); }}
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
