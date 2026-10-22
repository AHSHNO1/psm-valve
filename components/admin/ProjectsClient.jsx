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
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some(function(item) { return item.id === draft.id; });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    if (list.some((project) => !project.image)) {
      notify("برای ذخیره و انتشار هر پروژه، تصویر اختصاصی آن را بارگذاری کنید", true);
      return false;
    }
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: list })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیرهٔ پروژه ناموفق بود", true);
        return false;
      }
      setItems(list);
      notify("ذخیره شد");
      return true;
    } catch {
      notify("ارتباط با سرور برقرار نشد؛ تغییرات ذخیره نشد", true);
      return false;
    }
  }

  function add() {
    setDraft(blank());
  }

  function edit(project) {
    setDraft(copy(project));
  }

  function clone(project) {
    const next = copy(project);
    next.id = "proj-" + Date.now().toString(36);
    next.title.fa = (next.title.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این پروژه حذف شود؟")) return;
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
    if (!draft.image) {
      notify("برای هر پروژه بارگذاری تصویر الزامی است", true);
      return;
    }
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

      {draft && (
        <EditorPanel
          title={isNew ? "پروژه جدید" : "ویرایش پروژه"}
          subtitle={pick(draft.title) !== "—" ? pick(draft.title) : "مشخصات پروژه و تصویر آن را وارد کنید"}
          icon={<Icon name="package" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <ProjectForm project={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
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
            const isEditing = draft !== null && draft.id === p.id;
            return (
              <div key={p.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className={"card-item" + (isEditing ? " card-item-editing" : "")}>
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
                    {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
                  </div>

                  <div className="card-item-title">{pick(p.title)}</div>
                  <div className="card-item-desc">{pick(p.description)}</div>

                  <div className="card-item-foot">
                    <ToggleBtn active={p.active !== false} onClick={function() { toggle(p.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { if (isEditing) cancel(); else edit(p); }} />
                      <button type="button" onClick={function() { clone(p); }} className="act-btn" title="کپی" aria-label="کپی پروژه" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                        <Icon name="plus" size={14} />
                      </button>
                      <DeleteBtn onClick={function() { remove(p.id); }} />
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

function ProjectForm({ project, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(project.title?.[item.code] || project.description?.[item.code]);
  });

  function upd(field, val) {
    const nf = Object.assign({}, project[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(project.id, patch);
  }

  return (
    <div>
      <FormSection
        title="مشخصات پروژه"
        description="عنوان، مشتری، صنعت و توضیحات پروژه را برای هر زبان وارد کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="عنوان پروژه" required>
            <input type="text" dir={currentDir} value={project.title?.[lang] || ""}
              onChange={function(e) { upd("title", e.target.value); }} className="form-input"
              placeholder="نام پروژه" />
          </Field>

          <Field label="مشتری">
            <input type="text" dir={currentDir} value={project.client?.[lang] || ""}
              onChange={function(e) { upd("client", e.target.value); }} className="form-input"
              placeholder="نام کارفرما" />
          </Field>

          <Field label="صنعت">
            <input type="text" dir={currentDir} value={project.industry?.[lang] || ""}
              onChange={function(e) { upd("industry", e.target.value); }} className="form-input"
              placeholder="مثلاً نفت و گاز" />
          </Field>

          <Field label="توضیحات" wide>
            <textarea rows={3} dir={currentDir} value={project.description?.[lang] || ""}
              onChange={function(e) { upd("description", e.target.value); }} className="form-input"
              placeholder="خلاصه‌ای از دستاورد و جزئیات پروژه" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="انتشار و تصویر"
        description="سال اجرا را ثبت کنید و تصویر شاخص پروژه را بارگذاری کنید."
      >
        <FormGrid>
          <Field label="سال اجرا">
            <input type="text" dir="ltr" value={project.year || ""}
              onChange={function(e) { update(project.id, { year: e.target.value }); }} className="form-input"
              placeholder="1403" />
          </Field>

          <Field as="div" label="تصویر پروژه" wide>
            <UploadDropzone
              type="images"
              guidelineKey="projectImage"
              value={project.image || ""}
              onChange={function(url) { update(project.id, { image: url }); }}
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
