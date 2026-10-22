"use client";
import { useState, useEffect } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import { useToast, Toast } from "./useToast";

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

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
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
  // پیش‌نویسِ در حال ویرایش؛ تا زمان ذخیره، فهرست زنده تغییر نمی‌کند.
  const [draft, setDraft] = useState(null);
  const { notify, toast } = useToast();

  const isNew = draft !== null && !items.some(function (x) { return x.id === draft.id; });

  useEffect(function () {
    if (!draft) return undefined;
    function handler(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return function () { window.removeEventListener("beforeunload", handler); };
  }, [draft]);

  async function persist(list) {
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("ذخیره شد"); return true; }
      notify(data.error || "خطا در ذخیره", true);
      return false;
    } catch (e) {
      notify("خطای شبکه", true);
      return false;
    }
  }

  function add() { setDraft(blank()); }
  function edit(faq) { setDraft(deepCopy(faq)); }
  function cancel() { setDraft(null); }
  function updateDraft(patch) { setDraft(Object.assign({}, draft, patch)); }

  async function commitSave() {
    if (!draft) return;
    const exists = items.some(function (x) { return x.id === draft.id; });
    const nextList = exists
      ? items.map(function (x) { return x.id === draft.id ? draft : x; })
      : items.concat([draft]);
    const ok = await persist(nextList);
    if (ok) setDraft(null);
  }

  function remove(id) {
    if (!confirm("این سوال حذف شود؟")) return;
    if (draft && draft.id === id) setDraft(null);
    persist(items.filter(function (x) { return x.id !== id; }));
  }

  function toggle(id) {
    const list = items.map(function (x) { return x.id === id ? Object.assign({}, x, { active: !x.active }) : x; });
    persist(list);
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

      <Toast toast={toast} />

      {isNew && draft && (
        <div className="anim-in" style={{
          background: "#FFFFFF",
          border: "1px solid #00A896",
          borderRadius: 12,
          padding: 16,
          marginBottom: 10
        }}>
          <FaqForm faq={draft} update={updateDraft}
            onSave={commitSave}
            onCancel={cancel} />
        </div>
      )}

      {items.length === 0 && !isNew ? (
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
          {items.map(function (f, i) {
            const isEditing = draft !== null && draft.id === f.id;
            return (
              <div key={f.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="row">
                  <div className="row-thumb" style={{ borderRadius: "50%" }}>
                    <Icon name="help" size={18} />
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-teal">{pick(isEditing ? draft.category : f.category)}</span>
                      {(isEditing ? draft.active : f.active) !== false ? (
                        <span className="chip chip-green"><Icon name="check" /> فعال</span>
                      ) : (
                        <span className="chip chip-gray">غیرفعال</span>
                      )}
                    </div>
                    <div className="row-title">{pick(isEditing ? draft.question : f.question)}</div>
                    <div className="row-meta">{pick(isEditing ? draft.answer : f.answer).substring(0, 70)}...</div>
                  </div>

                  <div className="row-actions">
                    <ToggleBtn active={f.active !== false} onClick={function() { toggle(f.id); }} />
                    <EditBtn onClick={function() { if (isEditing) cancel(); else edit(f); }} />
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
                    <FaqForm faq={draft} update={updateDraft}
                      onSave={commitSave}
                      onCancel={cancel} />
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
    update(patch);
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
