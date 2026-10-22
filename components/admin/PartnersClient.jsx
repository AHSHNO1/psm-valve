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
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some(function(item) { return item.id === draft.id; });

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
      if (!res.ok || !data.ok) {
        notify(data.error || "ذخیرهٔ همراهان ناموفق بود", true);
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

  function edit(partner) {
    setDraft(copy(partner));
  }

  function clone(partner) {
    const next = copy(partner);
    next.id = "p-" + Date.now().toString(36);
    next.name.fa = (next.name.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این شریک حذف شود؟")) return;
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

      {draft && (
        <EditorPanel
          title={isNew ? "شریک جدید" : "ویرایش شریک"}
          subtitle={pick(draft.name) !== "—" ? pick(draft.name) : "نام، لینک و لوگوی شریک تجاری را وارد کنید"}
          icon={<Icon name="building" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <PartnerForm partner={draft} update={update} onSave={saveDraft} onCancel={cancel} />
        </EditorPanel>
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
            const isEditing = draft !== null && draft.id === p.id;
            return (
              <div key={p.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className={"card-item" + (isEditing ? " card-item-editing" : "")}>
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

                  {isEditing && <span className="chip chip-gold" style={{ alignSelf: "center" }}>در حال ویرایش</span>}

                  <div className="card-item-foot">
                    <ToggleBtn active={p.active !== false} onClick={function() { toggle(p.id); }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <EditBtn onClick={function() { if (isEditing) cancel(); else edit(p); }} />
                      <button type="button" onClick={function() { clone(p); }} className="act-btn" title="کپی" aria-label="کپی شریک" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
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

function PartnerForm({ partner, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(partner.name?.[item.code]);
  });

  function updName(val) {
    const nf = Object.assign({}, partner.name);
    nf[lang] = val;
    update(partner.id, { name: nf });
  }

  return (
    <div>
      <FormSection
        title="نام و لینک"
        description="نام شریک تجاری را برای هر زبان وارد کنید و در صورت وجود، نشانی وب‌سایت را ثبت کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="نام شریک" required>
            <input type="text" dir={currentDir} value={partner.name?.[lang] || ""}
              onChange={function(e) { updName(e.target.value); }} className="form-input"
              placeholder="نام شرکت" />
          </Field>

          <Field label="لینک وب‌سایت" hint="اختیاری — با https:// شروع شود">
            <input type="text" dir="ltr" value={partner.url || ""}
              onChange={function(e) { update(partner.id, { url: e.target.value }); }} className="form-input"
              placeholder="https://example.com" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="لوگوی شریک"
        description="لوگو با پس‌زمینه شفاف نمایش بهتری در صفحه اصلی دارد."
      >
        <UploadDropzone
          type="images"
          guidelineKey="partnerLogo"
          value={partner.logo || ""}
          onChange={function(url) { update(partner.id, { logo: url }); }}
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
