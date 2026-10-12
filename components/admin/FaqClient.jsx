"use client";
import { useState } from "react";
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
    id: "faq-" + Date.now().toString(36),
    category: { fa: "عمومی", en: "General", ar: "عام", ru: "Общее" },
    question: { fa: "", en: "", ar: "", ru: "" },
    answer: { fa: "", en: "", ar: "", ru: "" },
    order: 99,
    active: true
  };
}

export default function FaqClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const f = blank();
    setItems(items.concat([f]));
    setEditing(f.id);
  }

  function remove(id) {
    if (!confirm("این سوال حذف شود؟")) return;
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
            <Icon name="help" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">سوالات متداول</div>
            <div className="page-header-sub">{items.length} سوال</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> سوال جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="help" size={30} /></div>
          <div className="empty-title">هنوز سوالی اضافه نشده</div>
          <div className="empty-desc">سوالات متداول مشتریان را اضافه کنید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین سوال
          </button>
        </div>
      ) : (
        <div>
          {items.map(function(f, i) {
            const isEditing = editing === f.id;
            return (
              <div key={f.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="row">
                  <div className="row-thumb" style={{ borderRadius: "50%" }}>
                    <Icon name="help" size={18} />
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-teal">{pick(f.category)}</span>
                      {f.active !== false ? (
                        <span className="chip chip-green"><Icon name="check" /> فعال</span>
                      ) : (
                        <span className="chip chip-gray">غیرفعال</span>
                      )}
                    </div>
                    <div className="row-title">{pick(f.question)}</div>
                    <div className="row-meta">{pick(f.answer).substring(0, 70)}...</div>
                  </div>

                  <div className="row-actions">
                    <ToggleBtn active={f.active !== false} onClick={function() { toggle(f.id); }} />
                    <EditBtn onClick={function() { setEditing(isEditing ? null : f.id); }} />
                    <DeleteBtn onClick={function() { remove(f.id); }} />
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
                    <FaqForm faq={f} update={update}
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

function FaqForm({ faq, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");

  function upd(field, val) {
    const nf = Object.assign({}, faq[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(faq.id, patch);
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

      <label className="form-label">دسته</label>
      <input type="text" value={faq.category[lang] || ""}
        onChange={function(e) { upd("category", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>سوال</label>
      <input type="text" value={faq.question[lang] || ""}
        onChange={function(e) { upd("question", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>پاسخ</label>
      <textarea rows={4} value={faq.answer[lang] || ""}
        onChange={function(e) { upd("answer", e.target.value); }} className="form-input" />

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
