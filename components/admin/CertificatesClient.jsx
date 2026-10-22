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
    id: "cert-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    issuer: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    order: 99,
    active: true
  };
}

export default function CertificatesClient({ initial }) {
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
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificates: list })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیره گواهینامه ناموفق بود", true);
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

  function edit(cert) {
    setDraft(copy(cert));
  }

  function clone(cert) {
    const next = copy(cert);
    next.id = "cert-" + Date.now().toString(36);
    next.title.fa = (next.title.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این گواهینامه حذف شود؟")) return;
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
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #4F6BED, #3B52C4)" }}>
            <Icon name="award" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">گواهینامه‌ها</div>
            <div className="page-header-sub">{items.length} گواهینامه</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> گواهینامه جدید
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {draft && (
        <EditorPanel
          title={isNew ? "گواهینامه جدید" : "ویرایش گواهینامه"}
          subtitle={pick(draft.title) !== "—" ? pick(draft.title) : "عنوان، صادرکننده و تصویر گواهینامه را وارد کنید"}
          icon={<Icon name="award" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <CertForm cert={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="award" size={30} /></div>
          <div className="empty-title">هنوز گواهینامه‌ای اضافه نشده</div>
          <div className="empty-desc">گواهینامه‌ها در صفحه درباره ما و فوتر نمایش داده می‌شوند</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن گواهینامه
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map(function(c, i) {
            const isEditing = draft !== null && draft.id === c.id;
            return (
              <div key={c.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className={"card-item" + (isEditing ? " card-item-editing" : "")}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 12,
                      display: "grid", placeItems: "center",
                      background: c.image ? "#F4F5F7" : "linear-gradient(135deg, #4F6BED, #3B52C4)",
                      color: "#FFFFFF", overflow: "hidden",
                      flexShrink: 0, border: "1px solid #D1D5DB"
                    }}>
                      {c.image ? (
                        <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <Icon name="award" size={24} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="card-item-title" style={{ marginBottom: 4 }}>
                        {pick(c.title)}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#7A8290" }}>
                        {pick(c.issuer)}
                      </div>
                    </div>
                    {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
                  </div>

                  <div className="card-item-foot">
                    <ToggleBtn active={c.active !== false} onClick={function() { toggle(c.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { if (isEditing) cancel(); else edit(c); }} />
                      <button type="button" onClick={function() { clone(c); }} className="act-btn" title="کپی" aria-label="کپی گواهینامه" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                        <Icon name="plus" size={14} />
                      </button>
                      <DeleteBtn onClick={function() { remove(c.id); }} />
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

function CertForm({ cert, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(cert.title?.[item.code] || cert.issuer?.[item.code]);
  });

  function upd(field, val) {
    const nf = Object.assign({}, cert[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(cert.id, patch);
  }

  return (
    <div>
      <FormSection
        title="متن گواهینامه"
        description="عنوان گواهینامه و نام صادرکننده را برای هر زبان وارد کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="عنوان گواهینامه" required>
            <input type="text" dir={currentDir} value={cert.title?.[lang] || ""}
              onChange={function(e) { upd("title", e.target.value); }} className="form-input"
              placeholder="مثلاً ISO 9001:2015" />
          </Field>

          <Field label="صادرکننده">
            <input type="text" dir={currentDir} value={cert.issuer?.[lang] || ""}
              onChange={function(e) { upd("issuer", e.target.value); }} className="form-input"
              placeholder="نام سازمان صادرکننده" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="تصویر گواهینامه"
        description="تصویر اسکن‌شده گواهینامه را بارگذاری کنید."
      >
        <UploadDropzone
          type="images"
          guidelineKey="certificateImage"
          value={cert.image || ""}
          onChange={function(url) { update(cert.id, { image: url }); }}
          label=""
          accept="image/*"
        />
      </FormSection>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
