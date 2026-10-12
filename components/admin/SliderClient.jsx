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

export default function SliderClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/sliders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sliders: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const s = blank();
    setItems(items.concat([s]));
    setEditing(s.id);
  }

  function remove(id) {
    if (!confirm("این اسلاید حذف شود؟")) return;
    save(items.filter(function(x) { return x.id !== id; }));
  }

  function toggle(id) {
    const list = items.map(function(x) { return x.id === id ? Object.assign({}, x, { active: !x.active }) : x; });
    save(list);
  }

  function move(id, dir) {
    const idx = items.findIndex(function(x) { return x.id === id; });
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const list = items.slice();
    const tmp = list[idx];
    list[idx] = list[target];
    list[target] = tmp;
    save(list);
  }

  function update(id, patch) {
    setItems(items.map(function(x) { return x.id === id ? Object.assign({}, x, patch) : x; }));
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
            <Icon name="sparkles" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">اسلایدر صفحه اصلی</div>
            <div className="page-header-sub">{items.length} اسلاید</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> اسلاید جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="sparkles" size={30} /></div>
          <div className="empty-title">هنوز اسلایدی اضافه نشده</div>
          <div className="empty-desc">اولین اسلاید صفحه اصلی را بسازید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین اسلاید
          </button>
        </div>
      ) : (
        <div>
          {items.map(function(s, i) {
            const isEditing = editing === s.id;
            return (
              <div key={s.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="row">
                  <div className="row-thumb" style={{ width: 80, height: 52, borderRadius: 9 }}>
                    {s.image ? <img src={s.image} alt="" /> : <Icon name="image" size={20} />}
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-blue">اسلاید {i + 1}</span>
                      {s.active !== false ? (
                        <span className="chip chip-green"><Icon name="check" /> فعال</span>
                      ) : (
                        <span className="chip chip-gray">غیرفعال</span>
                      )}
                    </div>
                    <div className="row-title">{pick(s.title)}</div>
                    <div className="row-meta">{pick(s.subtitle)}</div>
                  </div>

                  <div className="row-actions">
                    <button className="act-btn act-btn-gold" onClick={function() { move(s.id, -1); }}
                      disabled={i === 0} title="بالا" style={{ opacity: i === 0 ? 0.35 : 1 }}>
                      <Icon name="arrowLeft" size={14} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button className="act-btn act-btn-gold" onClick={function() { move(s.id, 1); }}
                      disabled={i === items.length - 1} title="پایین"
                      style={{ opacity: i === items.length - 1 ? 0.35 : 1 }}>
                      <Icon name="arrowLeft" size={14} style={{ transform: "rotate(-90deg)" }} />
                    </button>
                    <ToggleBtn active={s.active !== false} onClick={function() { toggle(s.id); }} />
                    <EditBtn onClick={function() { setEditing(isEditing ? null : s.id); }} />
                    <DeleteBtn onClick={function() { remove(s.id); }} />
                  </div>
                </div>

                {isEditing && (
                  <div className="anim-in" style={{
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: -4,
                    marginBottom: 10
                  }}>
                    <SlideForm slide={s} update={update}
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

function SlideForm({ slide, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function upd(field, val) {
    const nf = Object.assign({}, slide[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(slide.id, patch);
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
      if (data.ok) update(slide.id, { image: data.url });
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div>
          <label className="form-label">عنوان</label>
          <input type="text" value={slide.title[lang] || ""}
            onChange={function(e) { upd("title", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 10 }}>زیرعنوان</label>
          <input type="text" value={slide.subtitle[lang] || ""}
            onChange={function(e) { upd("subtitle", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 10 }}>متن دکمه</label>
          <input type="text" value={slide.ctaText[lang] || ""}
            onChange={function(e) { upd("ctaText", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 10 }}>لینک دکمه</label>
          <input type="text" dir="ltr" value={slide.ctaHref || ""}
            onChange={function(e) { update(slide.id, { ctaHref: e.target.value }); }} className="form-input" />
        </div>

        <div>
          <label className="form-label">تصویر اسلاید</label>
          {slide.image ? (
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #D1D5DB" }}>
              <img src={slide.image} alt="" style={{ width: "100%", display: "block" }} />
              <button type="button" onClick={function() { update(slide.id, { image: "" }); }}
                className="act-btn act-btn-delete"
                style={{ position: "absolute", top: 8, insetInlineStart: 8 }}>
                <Icon name="x" />
              </button>
            </div>
          ) : (
            <div onClick={function() { inputRef.current && inputRef.current.click(); }}
              style={{
                border: "2px dashed #D1D5DB",
                background: "#F4F5F7",
                borderRadius: 10,
                padding: 30,
                textAlign: "center",
                cursor: "pointer"
              }}>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={function(e) { upload(e.target.files[0]); }} />
              {uploading ? <Icon name="loader" size={22} /> : (
                <>
                  <Icon name="upload" size={28} />
                  <div style={{ fontSize: 12, fontWeight: 900, marginTop: 8, color: "#1A1D21" }}>
                    کلیک کنید (1920×800)
                  </div>
                </>
              )}
            </div>
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
