"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import EditorPanel, { ADMIN_LANGUAGES, FormSection, FormGrid, Field, LocaleTabs, languageDir } from "./EditorPanel";

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
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
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some(function(item) { return item.id === draft.id; });

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
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیره نظر ناموفق بود", true);
        return false;
      }
      setItems(list);
      notify("ذخیره شد");
      return true;
    } catch (e) {
      notify("خطای شبکه", true);
      return false;
    }
  }

  function add() {
    setDraft(blank());
  }

  function edit(test) {
    setDraft(copy(test));
  }

  function clone(test) {
    const next = copy(test);
    next.id = "test-" + Date.now().toString(36);
    next.name.fa = (next.name.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این نظر حذف شود؟")) return;
    if (draft && draft.id === id) setDraft(null);
    save(items.filter(function(x) { return x.id !== id; }));
  }

  function toggle(id) {
    const list = items.map(function(x) { return x.id === id ? Object.assign({}, x, { active: !x.active }) : x; });
    save(list);
  }

  function update(id, patch) {
    setDraft(function(current) {
      return current && current.id === id ? Object.assign({}, current, patch) : current;
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const exists = items.some(function(item) { return item.id === draft.id; });
    const list = exists
      ? items.map(function(item) { return item.id === draft.id ? draft : item; })
      : items.concat([draft]);
    const ok = await save(list);
    if (ok) setDraft(null);
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

      {draft && (
        <EditorPanel
          title={isNew ? "نظر جدید" : "ویرایش نظر"}
          subtitle={pick(draft.name) !== "—" ? pick(draft.name) : "نام، سمت و متن نظر مشتری را وارد کنید"}
          icon={<Icon name="star" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <TestForm test={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
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
            const isEditing = draft !== null && draft.id === t.id;
            return (
              <div key={t.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className={"card-item" + (isEditing ? " card-item-editing" : "")}>
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

                  {isEditing && <span className="chip chip-gold" style={{ alignSelf: "flex-start" }}>در حال ویرایش</span>}

                  <div className="card-item-desc" style={{
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {pick(t.text)}
                  </div>

                  <div className="card-item-foot">
                    <ToggleBtn active={t.active !== false} onClick={function() { toggle(t.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { if (isEditing) cancel(); else edit(t); }} />
                      <button type="button" onClick={function() { clone(t); }} className="act-btn" title="کپی" aria-label="کپی نظر" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                        <Icon name="plus" size={14} />
                      </button>
                      <DeleteBtn onClick={function() { remove(t.id); }} />
                    </div>
                  </div>
                </div>
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
  const currentDir = languageDir(lang);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(test.name?.[item.code] || test.text?.[item.code]);
  });

  function upd(field, val) {
    const nf = Object.assign({}, test[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(test.id, patch);
  }

  return (
    <div>
      <FormSection
        title="متن نظر"
        description="نام، سمت و متن نظر مشتری را برای هر زبان وارد کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="نام مشتری" required>
            <input type="text" dir={currentDir} value={test.name?.[lang] || ""}
              onChange={function(e) { upd("name", e.target.value); }} className="form-input" />
          </Field>

          <Field label="سمت / شرکت">
            <input type="text" dir={currentDir} value={test.role?.[lang] || ""}
              onChange={function(e) { upd("role", e.target.value); }} className="form-input" />
          </Field>

          <Field label="متن نظر" wide>
            <textarea rows={4} dir={currentDir} value={test.text?.[lang] || ""}
              onChange={function(e) { upd("text", e.target.value); }} className="form-input" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="امتیاز و تصویر"
        description="امتیاز نمایشی و تصویر مشتری را انتخاب کنید."
      >
        <FormGrid>
          <Field as="div" label="امتیاز">
            <div className="choice-grid" role="group" aria-label="امتیاز نظر">
              {[1, 2, 3, 4, 5].map(function(n) {
                const active = n <= (test.rating || 5);
                return (
                  <button key={n} type="button" onClick={function() { update(test.id, { rating: n }); }}
                    className={"choice-btn" + (active ? " choice-btn-active" : "")}
                    style={{ fontSize: 15, minWidth: 36 }}
                    aria-pressed={n === test.rating} aria-label={n + " ستاره"}>
                    ★
                  </button>
                );
              })}
            </div>
          </Field>

          <Field as="div" label="تصویر مشتری" wide>
            <UploadDropzone
              type="images"
              guidelineKey="testimonialImage"
              value={test.image || ""}
              onChange={function(url) { update(test.id, { image: url }); }}
              label=""
              accept="image/*"
            />
          </Field>
        </FormGrid>
      </FormSection>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
