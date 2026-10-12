"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function blank() {
  return {
    id: "cert-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    issuer: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    order: 99,
    active: true
  };
}

export default function CertificatesClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificates: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const c = blank();
    setItems(items.concat([c]));
    setEditing(c.id);
  }

  function remove(id) {
    if (!confirm("این گواهینامه حذف شود؟")) return;
    save(items.filter(function(x) { return x.id !== id; }));
  }

  function toggle(id) {
    const list = items.map(function(x) { return x.id === id ? Object.assign({}, x, { active: !x.active }) : x; });
    save(list);
  }

  function update(id, patch) {
    setItems(items.map(function(x) { return x.id === id ? Object.assign({}, x, patch) : x; }));
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #4F6BED, #3B52C4)" }}>
            <Icon name="award" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">گواهینامه‌ها</div>
            <div className="page-header-sub">{items.length} گواهینامه</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> گواهینامه جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="award" size={30} /></div>
          <div className="empty-title">هنوز گواهینامه‌ای اضافه نشده</div>
          <div className="empty-desc">گواهینامه‌ها در صفحه درباره ما و فوتر نمایش داده می‌شوند</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن گواهینامه
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(function(c, i) {
            const isEditing = editing === c.id;
            return (
              <div key={c.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="card-item">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 12,
                      display: "grid", placeItems: "center",
                      background: c.image ? "#F4F5F7" : "linear-gradient(135deg, #4F6BED, #3B52C4)",
                      color: "#FFFFFF", overflow: "hidden",
                      flexShrink: 0, border: "1px solid #D1D5DB"
                    }}>
                      {c.image ? (
                        <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <Icon name="award" size={24} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="card-item-title" style={{ marginBottom: 4 }}>
                        {pick(c.title)}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#7A8290" }}>
                        {pick(c.issuer)}
                      </div>
                    </div>
                  </div>

                  <div className="card-item-foot">
                    <ToggleBtn active={c.active !== false} onClick={function() { toggle(c.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { setEditing(isEditing ? null : c.id); }} />
                      <DeleteBtn onClick={function() { remove(c.id); }} />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="anim-in" style={{
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: 12,
                    padding: 14,
                    marginTop: 8
                  }}>
                    <CertForm cert={c} update={update}
                      onSave={function() { save(items); setEditing(null); }}
                      onCancel={function() { setEditing(null); }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CertForm({ cert, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function upd(field, val) {
    const nf = Object.assign({}, cert[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(cert.id, patch);
  }

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) update(cert.id, { image: data.url });
    } catch (e) {}
    setUploading(false);
  }

  return (
    <div>
      <div className="tabs">
        {LANGS.map(function(l) {
          return (
            <button key={l.code} type="button" onClick={function() { setLang(l.code); }}
              className={"tab" + (lang === l.code ? " tab-active" : "")}>
              {l.label}
            </button>
          );
        })}
      </div>

      <label className="form-label">عنوان</label>
      <input type="text" value={cert.title[lang] || ""}
        onChange={function(e) { upd("title", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>صادرکننده</label>
      <input type="text" value={cert.issuer[lang] || ""}
        onChange={function(e) { upd("issuer", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>تصویر (300×300)</label>
      {cert.image ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #D1D5DB", background: "#F4F5F7", padding: 12, textAlign: "center" }}>
          <img src={cert.image} alt="" style={{ maxHeight: 100, maxWidth: "100%" }} />
          <button type="button" onClick={function() { update(cert.id, { image: "" }); }}
            className="act-btn act-btn-delete"
            style={{ position: "absolute", top: 8, insetInlineStart: 8 }}>
            <Icon name="x" />
          </button>
        </div>
      ) : (
        <div onClick={function() { inputRef.current && inputRef.current.click(); }}
          style={{
            border: "2px dashed #D1D5DB", background: "#F4F5F7", borderRadius: 10,
            padding: 20, textAlign: "center", cursor: "pointer"
          }}>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={function(e) { upload(e.target.files[0]); }} />
          {uploading ? <Icon name="loader" size={20} /> : (
            <>
              <Icon name="upload" size={22} />
              <div style={{ fontSize: 11, fontWeight: 900, marginTop: 6, color: "#1A1D21" }}>کلیک کنید</div>
            </>
          )}
        </div>
      )}

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
