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
    id: "proj-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    client: { fa: "", en: "", ar: "", ru: "" },
    industry: { fa: "", en: "", ar: "", ru: "" },
    description: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    year: "",
    order: 99,
    active: true
  };
}

export default function ProjectsClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: list })
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
    if (!confirm("این پروژه حذف شود؟")) return;
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
            <Icon name="package" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">پروژه‌های موفق</div>
            <div className="page-header-sub">{items.length} پروژه</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> پروژه جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="package" size={30} /></div>
          <div className="empty-title">هنوز پروژه‌ای اضافه نشده</div>
          <div className="empty-desc">پروژه‌های موفق خود را اضافه کنید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین پروژه
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
                    aspectRatio: "16/10",
                    borderRadius: 10,
                    background: p.image ? "#F4F5F7" : "linear-gradient(135deg, #4F6BED20, #3B52C410)",
                    border: "1px solid #D1D5DB",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center"
                  }}>
                    {p.image ? (
                      <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="package" size={28} />
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                    {p.industry && pick(p.industry) !== "—" && (
                      <span className="chip chip-blue">{pick(p.industry)}</span>
                    )}
                    {p.year && <span className="chip chip-gray">{p.year}</span>}
                  </div>

                  <div className="card-item-title">{pick(p.title)}</div>
                  <div className="card-item-desc">{pick(p.description)}</div>

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
                    <ProjectForm project={p} update={update}
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

function ProjectForm({ project, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function upd(field, val) {
    const nf = Object.assign({}, project[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(project.id, patch);
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
      if (data.ok) update(project.id, { image: data.url });
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

      <label className="form-label">عنوان پروژه</label>
      <input type="text" value={project.title[lang] || ""}
        onChange={function(e) { upd("title", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>مشتری</label>
      <input type="text" value={project.client[lang] || ""}
        onChange={function(e) { upd("client", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>صنعت</label>
      <input type="text" value={project.industry[lang] || ""}
        onChange={function(e) { upd("industry", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>توضیحات</label>
      <textarea rows={3} value={project.description[lang] || ""}
        onChange={function(e) { upd("description", e.target.value); }} className="form-input" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <div>
          <label className="form-label">سال</label>
          <input type="text" value={project.year || ""}
            onChange={function(e) { update(project.id, { year: e.target.value }); }} className="form-input" />
        </div>
        <div>
          <label className="form-label">تصویر پروژه</label>
          {project.image ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <img src={project.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid #D1D5DB" }} />
              <button type="button" onClick={function() { update(project.id, { image: "" }); }}
                className="act-btn act-btn-delete">
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
