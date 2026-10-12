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
    id: "test-" + Date.now().toString(36),
    name: { fa: "", en: "", ar: "", ru: "" },
    role: { fa: "", en: "", ar: "", ru: "" },
    text: { fa: "", en: "", ar: "", ru: "" },
    rating: 5,
    image: "",
    order: 99,
    active: true
  };
}

export default function TestimonialsClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
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
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const t = blank();
    setItems(items.concat([t]));
    setEditing(t.id);
  }

  function remove(id) {
    if (!confirm("این نظر حذف شود؟")) return;
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
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            <Icon name="star" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">نظرات مشتریان</div>
            <div className="page-header-sub">{items.length} نظر</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> نظر جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="star" size={30} /></div>
          <div className="empty-title">هنوز نظری اضافه نشده</div>
          <div className="empty-desc">نظرات مشتریان در صفحه اصلی نمایش داده می‌شوند</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین نظر
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(function(t, i) {
            const isEditing = editing === t.id;
            return (
              <div key={t.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="card-item">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      display: "grid", placeItems: "center",
                      background: t.image ? "#F4F5F7" : "linear-gradient(135deg, #F59E0B, #D97706)",
                      color: "#FFFFFF", overflow: "hidden",
                      flexShrink: 0, fontSize: 16, fontWeight: 900
                    }}>
                      {t.image ? <img src={t.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (pick(t.name).charAt(0))}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#1A1D21", marginBottom: 2 }}>
                        {pick(t.name)}
                      </div>
                      <div style={{ fontSize: 11, color: "#7A8290", fontWeight: 600 }}>
                        {pick(t.role)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map(function(n) {
                        return (
                          <span key={n} style={{
                            color: n <= (t.rating || 5) ? "#F5C518" : "#D1D5DB",
                            fontSize: 12
                          }}>★</span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-item-desc" style={{
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {pick(t.text)}
                  </div>

                  <div className="card-item-foot">
                    <ToggleBtn active={t.active !== false} onClick={function() { toggle(t.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { setEditing(isEditing ? null : t.id); }} />
                      <DeleteBtn onClick={function() { remove(t.id); }} />
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
                    <TestForm test={t} update={update}
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

function TestForm({ test, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function upd(field, val) {
    const nf = Object.assign({}, test[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(test.id, patch);
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
      if (data.ok) update(test.id, { image: data.url });
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

      <label className="form-label">نام</label>
      <input type="text" value={test.name[lang] || ""}
        onChange={function(e) { upd("name", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>سمت</label>
      <input type="text" value={test.role[lang] || ""}
        onChange={function(e) { upd("role", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>متن نظر</label>
      <textarea rows={3} value={test.text[lang] || ""}
        onChange={function(e) { upd("text", e.target.value); }} className="form-input" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <div>
          <label className="form-label">امتیاز</label>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map(function(n) {
              return (
                <button key={n} type="button" onClick={function() { update(test.id, { rating: n }); }}
                  className="act-btn"
                  style={{
                    background: n <= test.rating ? "rgba(245, 197, 24, 0.15)" : "#F1F3F6",
                    borderColor: n <= test.rating ? "#F5C518" : "#D1D5DB",
                    color: n <= test.rating ? "#D97706" : "#7A8290",
                    fontSize: 16
                  }}>
                  ★
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="form-label">تصویر</label>
          {test.image ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <img src={test.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid #D1D5DB" }} />
              <button type="button" onClick={function() { update(test.id, { image: "" }); }} className="act-btn act-btn-delete">
                <Icon name="x" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={function() { inputRef.current && inputRef.current.click(); }}
              className="act-btn act-btn-gold" style={{ width: "auto", padding: "0 12px", gap: 6 }}>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={function(e) { upload(e.target.files[0]); }} />
              {uploading ? <Icon name="loader" /> : <Icon name="upload" />}
              <span style={{ fontSize: 11, fontWeight: 900 }}>آپلود</span>
            </button>
          )}
        </div>
      </div>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
