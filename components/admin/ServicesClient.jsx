"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import EditorPanel, { ADMIN_LANGUAGES, FormSection, FormGrid, Field, LocaleTabs, languageDir } from "./EditorPanel";

const ICON_OPTIONS = ["Cog", "Gauge", "Wrench", "Circle", "Flame", "Truck", "Package", "Settings"];

const ICON_MAP = {
  Cog: "cog", Gauge: "settings", Wrench: "settings", Circle: "refresh",
  Flame: "flame", Truck: "package", Package: "package", Settings: "settings"
};

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
    slug: "service-" + Date.now().toString(36),
    icon: "Cog",
    image: "",
    name: { fa: "", en: "", ar: "", ru: "" },
    short: { fa: "", en: "", ar: "", ru: "" },
    active: true,
    order: 99
  };
}

export default function ServicesClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some(function(item) { return item.slug === draft.slug; });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: list })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیره خدمت ناموفق بود", true);
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

  function edit(service) {
    setDraft(copy(service));
  }

  function clone(service) {
    const next = copy(service);
    next.slug = "service-" + Date.now().toString(36);
    next.name.fa = (next.name.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این خدمت حذف شود؟")) return;
    if (draft && draft.slug === id) setDraft(null);
    save(items.filter(function(x) { return x.slug !== id; }));
  }

  function toggle(id) {
    const list = items.map(function(x) { return x.slug === id ? Object.assign({}, x, { active: !x.active }) : x; });
    save(list);
  }

  function update(slug, patch) {
    setDraft(function(current) {
      return current && current.slug === slug ? Object.assign({}, current, patch) : current;
    });
  }

  async function saveDraft() {
    if (!draft) return;
    const exists = items.some(function(item) { return item.slug === draft.slug; });
    const list = exists
      ? items.map(function(item) { return item.slug === draft.slug ? draft : item; })
      : items.concat([draft]);
    const ok = await save(list);
    if (ok) setDraft(null);
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #F7630C, #CA5010)" }}>
            <Icon name="cog" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">خدمات</div>
            <div className="page-header-sub">{items.length} خدمت</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> افزودن خدمت
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {draft && (
        <EditorPanel
          title={isNew ? "خدمت جدید" : "ویرایش خدمت"}
          subtitle={pick(draft.name) !== "—" ? pick(draft.name) : "عنوان و توضیح خدمت را در زبان‌های سایت وارد کنید"}
          icon={<Icon name="cog" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <ServiceForm service={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
      )}

      <div className="card-grid">
        {items.map(function(s, i) {
          const isFeatured = s.slug === "hvf-coating" || s.slug === "lop-test";
          const isEditing = draft !== null && draft.slug === s.slug;
          const iconName = ICON_MAP[s.icon] || "cog";

          return (
            <div key={s.slug} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
              <div className={"card-item" + (isFeatured ? " card-item-featured" : "") + (isEditing ? " card-item-editing" : "")}>
                <div className="card-item-head">
                  {s.image && <img src={s.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, marginLeft: 8 }} />}
                  <div className="card-item-icon" style={{
                    background: isFeatured
                      ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                      : "linear-gradient(135deg, #F7630C, #CA5010)"
                  }}>
                    <Icon name={iconName} size={18} />
                  </div>
                  {isFeatured && <span className="chip chip-gold"><Icon name="sparkles" /> ویژه</span>}
                  {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
                </div>

                <div className="card-item-title">{pick(s.name)}</div>
                <div className="card-item-desc">{pick(s.short)}</div>

                <div className="card-item-foot">
                  <ToggleBtn active={s.active !== false} onClick={function() { toggle(s.slug); }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <EditBtn onClick={function() { if (isEditing) cancel(); else edit(s); }} />
                    <button type="button" onClick={function() { clone(s); }} className="act-btn" title="کپی" aria-label="کپی خدمت" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                      <Icon name="plus" size={14} />
                    </button>
                    <DeleteBtn onClick={function() { remove(s.slug); }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="empty anim-in" style={{ gridColumn: "1 / -1" }}>
            <div className="empty-icon"><Icon name="cog" size={30} /></div>
            <div className="empty-title">هنوز خدمتی اضافه نشده</div>
            <div className="empty-desc">خدمات شرکت را از اینجا اضافه کنید</div>
            <button onClick={add} className="btn-add">
              <Icon name="plus" /> افزودن اولین خدمت
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceForm({ service, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(service.name?.[item.code] || service.short?.[item.code]);
  });

  function upd(field, val) {
    const nf = Object.assign({}, service[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(service.slug, patch);
  }

  return (
    <div>
      <FormSection
        title="متن خدمت"
        description="عنوان و توضیح کوتاه کارت خدمت را برای هر زبان ویرایش کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="عنوان خدمت" required>
            <input type="text" dir={currentDir} value={service.name?.[lang] || ""}
              onChange={function(e) { upd("name", e.target.value); }} className="form-input"
              placeholder="مثلاً پوشش HVOF" />
          </Field>

          <Field label="توضیح کوتاه" wide>
            <textarea rows={3} dir={currentDir} value={service.short?.[lang] || ""}
              onChange={function(e) { upd("short", e.target.value); }} className="form-input"
              placeholder="توضیح یک تا دو خطی که روی کارت خدمت نمایش داده می‌شود" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="ظاهر کارت"
        description="آیکون و تصویر شاخص خدمت را انتخاب کنید."
      >
        <FormGrid>
          <Field as="div" label="آیکون خدمت" wide>
            <div className="choice-grid">
              {ICON_OPTIONS.map(function(ic) {
                const active = service.icon === ic;
                return (
                  <button key={ic} type="button" onClick={function() { update(service.slug, { icon: ic }); }}
                    className={"choice-btn" + (active ? " choice-btn-active" : "")}
                    title={ic} aria-label={"آیکون " + ic} aria-pressed={active}>
                    <Icon name={ICON_MAP[ic]} />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field as="div" label="تصویر شاخص خدمت" wide>
            <UploadDropzone
              type="images"
              guidelineKey="productImage"
              value={service.image || ""}
              onChange={function(url) { update(service.slug, { image: url }); }}
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
