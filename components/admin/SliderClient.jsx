"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { ADMIN_LANGUAGES, FormSection, Field, LocaleTabs } from "./EditorPanel";
import { useUnsavedChanges, confirmDiscard, isDirty } from "./useUnsavedChanges";

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function localizedValue(value, language) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[language] || value.fa || value.en || "";
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
  const [draft, setDraft] = useState(null);
  const [draftBase, setDraftBase] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [dragIndex, setDragIndex] = useState(-1);
  const [dropIndex, setDropIndex] = useState(-1);

  const isNew = Boolean(draft) && !items.some(function(item) { return item.id === draft.id; });
  const draftDirty = Boolean(draft) && isDirty(draft, draftBase);
  useUnsavedChanges(draftDirty);

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
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیره‌سازی اسلایدر ناموفق بود", true);
        return false;
      }
      setItems(list);
      notify("ذخیره شد");
      return true;
    } catch (e) {
      notify("خطای شبکه هنگام ذخیره اسلایدر", true);
      return false;
    }
  }

  function add() {
    if (!confirmDiscard(draftDirty)) return;
    const next = blank();
    setDraft(next);
    setDraftBase(copy(next));
  }

  function edit(slide) {
    if (draft && draft.id === slide.id) return;
    if (!confirmDiscard(draftDirty)) return;
    setDraft(copy(slide));
    setDraftBase(copy(slide));
  }

  function cancel() {
    if (!confirmDiscard(draftDirty)) return;
    setDraft(null);
    setDraftBase(null);
  }

  function remove(id) {
    if (!confirm("این اسلاید حذف شود؟")) return;
    if (draft && draft.id === id) {
      setDraft(null);
      setDraftBase(null);
    }
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
    setDraft(function(current) {
      return current && current.id === id ? Object.assign({}, current, patch) : current;
    });
  }

  function handleDragStart(event, index) {
    setDragIndex(index);
    setDropIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(event, index) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropIndex !== index) setDropIndex(index);
  }

  function handleDrop(event, index) {
    event.preventDefault();
    const from = dragIndex >= 0 ? dragIndex : Number(event.dataTransfer.getData("text/plain"));
    setDragIndex(-1);
    setDropIndex(-1);
    if (!Number.isInteger(from) || from < 0 || from === index || from >= items.length) return;
    const list = items.slice();
    const moved = list.splice(from, 1)[0];
    list.splice(index, 0, moved);
    save(list);
  }

  function handleDragEnd() {
    setDragIndex(-1);
    setDropIndex(-1);
  }

  async function saveDraft() {
    if (!draft) return;
    const exists = items.some(function(item) { return item.id === draft.id; });
    const list = exists
      ? items.map(function(item) { return item.id === draft.id ? draft : item; })
      : items.concat([draft]);
    const ok = await save(list);
    if (ok) {
      setDraft(null);
      setDraftBase(null);
    }
  }

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
            <Icon name="sparkles" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">اسلایدر صفحه اصلی</div>
            <div className="page-header-sub">{items.length} اسلاید · برای جابه‌جایی، ردیف را بکشید یا از دکمه‌های فلش استفاده کنید</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> اسلاید جدید
        </button>
      </div>

      {draftDirty && (
        <div className="msg anim-in" role="status" style={{ background: "#FFF9E6", color: "#8A6508" }}>
          <Icon name="alert" /> تغییرات این اسلاید هنوز ذخیره نشده است.
        </div>
      )}

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {draft && (
        <EditorPanel
          title={isNew ? "اسلاید جدید" : "ویرایش اسلاید"}
          subtitle={pick(draft.title) !== "—" ? pick(draft.title) : "تیتر، توضیح، دکمه و تصویر اسلاید را تنظیم کنید"}
          icon={<Icon name="sparkles" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <SlideForm slide={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
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
            const isEditing = draft !== null && draft.id === s.id;
            const dropClass = dropIndex === i && dragIndex !== i ? " row-drop-target" : "";
            return (
              <div key={s.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div
                  className={"row" + (isEditing ? " row-editing" : "") + (dragIndex === i ? " row-dragging" : "") + dropClass}
                  draggable
                  onDragStart={function(event) { handleDragStart(event, i); }}
                  onDragOver={function(event) { handleDragOver(event, i); }}
                  onDrop={function(event) { handleDrop(event, i); }}
                  onDragEnd={handleDragEnd}
                >
                  <span className="row-drag-handle" title="برای جابه‌جایی بکشید" aria-hidden="true">
                    <Icon name="menu" size={14} />
                  </span>
                  <div className="row-thumb" style={{ width: 80, height: 52, borderRadius: 9 }}>
                    {s.image ? <img src={s.image} alt="" draggable={false} /> : <Icon name="image" size={20} />}
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-blue">اسلاید {i + 1}</span>
                      {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
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
                      disabled={i === 0} title="بالا" aria-label="انتقال به بالا" style={{ opacity: i === 0 ? 0.35 : 1 }}>
                      <Icon name="arrowLeft" size={14} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button className="act-btn act-btn-gold" onClick={function() { move(s.id, 1); }}
                      disabled={i === items.length - 1} title="پایین" aria-label="انتقال به پایین"
                      style={{ opacity: i === items.length - 1 ? 0.35 : 1 }}>
                      <Icon name="arrowLeft" size={14} style={{ transform: "rotate(-90deg)" }} />
                    </button>
                    <ToggleBtn active={s.active !== false} onClick={function() { toggle(s.id); }} />
                    <EditBtn onClick={function() { if (isEditing) cancel(); else edit(s); }} />
                    <DeleteBtn onClick={function() { remove(s.id); }} />
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

function SlideForm({ slide, update, onSave, onCancel }) {
  const [language, setLanguage] = useState("fa");
  const currentLanguage = ADMIN_LANGUAGES.find((item) => item.code === language) || ADMIN_LANGUAGES[0];
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(
      localizedValue(slide.title, item.code) || localizedValue(slide.subtitle, item.code)
    );
  });

  function updateLocalized(field, value) {
    const current = slide[field];
    const localized = current && typeof current === "object" && !Array.isArray(current)
      ? current
      : { fa: typeof current === "string" ? current : "", en: "", ar: "", ru: "" };
    update(slide.id, { [field]: { ...localized, [language]: value } });
  }

  return (
    <div className="slide-editor">
      <div className="slide-editor-grid">
        <FormSection
          title="متن اسلاید"
          description="تیتر، توضیح و دکمه را برای هر زبان ویرایش کنید."
        >
          <LocaleTabs lang={language} onChange={setLanguage} filled={filled} hint="" />

          <Field label={"تیتر اسلاید · " + currentLanguage.label}>
            <input
              type="text"
              dir={currentLanguage.dir}
              value={localizedValue(slide.title, language)}
              onChange={(event) => updateLocalized("title", event.target.value)}
              className="form-input"
              placeholder="تیتر اصلی که روی تصویر نمایش داده می‌شود"
            />
          </Field>

          <Field label={"توضیح زیر تیتر · " + currentLanguage.label} className="slide-editor-label">
            <textarea
              dir={currentLanguage.dir}
              value={localizedValue(slide.subtitle, language)}
              onChange={(event) => updateLocalized("subtitle", event.target.value)}
              className="form-input"
              rows={3}
              placeholder="توضیح کوتاهی که زیر تیتر اسلاید دیده می‌شود"
            />
          </Field>

          <div className="slide-editor-cta">
            <Field label={"متن دکمه · " + currentLanguage.label}>
              <input
                type="text"
                dir={currentLanguage.dir}
                value={localizedValue(slide.ctaText, language)}
                onChange={(event) => updateLocalized("ctaText", event.target.value)}
                className="form-input"
                placeholder="مثلاً مشاهده محصولات"
              />
            </Field>
            <Field label="لینک دکمه">
              <input
                type="text"
                dir="ltr"
                value={slide.ctaHref || ""}
                onChange={(event) => update(slide.id, { ctaHref: event.target.value })}
                className="form-input"
                placeholder="/products"
              />
            </Field>
          </div>
        </FormSection>

        <div className="slide-editor-preview" dir={currentLanguage.dir}>
          {slide.image && <img src={slide.image} alt="" className="slide-preview-image" />}
          <div className="slide-preview-shade" />
          <div className="slide-preview-copy">
            <span>پیش‌نمایش اسلاید · {currentLanguage.label}</span>
            <strong>{localizedValue(slide.title, language) || "تیتر اسلاید شما"}</strong>
            <p>{localizedValue(slide.subtitle, language) || "توضیحات اسلاید در این قسمت نمایش داده می‌شود."}</p>
            {localizedValue(slide.ctaText, language) && (
              <span className="slide-preview-button">{localizedValue(slide.ctaText, language)}</span>
            )}
          </div>
        </div>
      </div>

      <FormSection
        title="تصویر اسلاید"
        description="تصویر با کیفیت و سبک، سرعت بارگذاری صفحه اصلی را حفظ می‌کند."
      >
        <UploadDropzone
          type="images"
          guidelineKey="heroImage"
          value={slide.image || ""}
          onChange={(url) => update(slide.id, { image: url })}
          label=""
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
      </FormSection>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
