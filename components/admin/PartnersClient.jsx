"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function blank() {
  return {
    id: "p-" + Date.now().toString(36),
    name: { fa: "", en: "", ar: "", ru: "" },
    logo: "",
    url: "",
    order: 99,
    active: true
  };
}

export default function PartnersClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
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
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const p = blank();
    setItems(items.concat([p]));
    setEditing(p.id);
  }

  function remove(id) {
    if (!confirm("این شریک حذف شود؟")) return;
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
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #00A896, #007A6D)" }}>
            <Icon name="building" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">همراهان</div>
            <div className="page-header-sub">{items.length} شریک تجاری</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> شریک جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="building" size={30} /></div>
          <div className="empty-title">هنوز شریکی اضافه نشده</div>
          <div className="empty-desc">لوگوی شرکای تجاری در صفحه اصلی نمایش داده می‌شود</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین شریک
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(function(p, i) {
            const isEditing = editing === p.id;
            return (
              <div key={p.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="card-item">
                  <div style={{
                    aspectRatio: "2/1",
                    borderRadius: 10,
                    background: "#F4F5F7",
                    border: "1px solid #D1D5DB",
                    display: "grid",
                    placeItems: "center",
                    padding: 10,
                    overflow: "hidden"
                  }}>
                    {p.logo ? (
                      <img src={p.logo} alt="" style={{ maxWidth: "100%", maxHeight: 60, objectFit: "contain" }} />
                    ) : (
                      <Icon name="building" size={28} />
                    )}
                  </div>

                  <div className="card-item-title" style={{ textAlign: "center" }}>
                    {pick(p.name)}
                  </div>

                  <div className="card-item-foot">
                    <ToggleBtn active={p.active !== false} onClick={function() { toggle(p.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { setEditing(isEditing ? null : p.id); }} />
                      <DeleteBtn onClick={function() { remove(p.id); }} />
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
                    <PartnerForm partner={p} update={update}
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

function PartnerForm({ partner, update, onSave, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function updName(lang, val) {
    const nf = Object.assign({}, partner.name);
    nf[lang] = val;
    update(partner.id, { name: nf });
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
      if (data.ok) update(partner.id, { logo: data.url });
    } catch (e) {}
    setUploading(false);
  }

  return (
    <div>
      <label className="form-label">نام (فارسی)</label>
      <input type="text" value={partner.name.fa || ""}
        onChange={function(e) { updName("fa", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>نام (انگلیسی)</label>
      <input type="text" dir="ltr" value={partner.name.en || ""}
        onChange={function(e) { updName("en", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>لینک وب‌سایت</label>
      <input type="text" dir="ltr" value={partner.url || ""}
        onChange={function(e) { update(partner.id, { url: e.target.value }); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>لوگو (400×200)</label>
      {partner.logo ? (
        <div style={{ position: "relative", background: "#F4F5F7", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid #D1D5DB" }}>
          <img src={partner.logo} alt="" style={{ maxHeight: 60 }} />
          <button type="button" onClick={function() { update(partner.id, { logo: "" }); }}
            className="act-btn act-btn-delete"
            style={{ position: "absolute", top: 6, insetInlineStart: 6 }}>
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
          {uploading ? <Icon name="loader" size={20} /> : <Icon name="upload" size={22} />}
        </div>
      )}

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
