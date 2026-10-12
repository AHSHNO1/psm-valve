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

function blank() {
  return {
    slug: "service-" + Date.now().toString(36),
    icon: "Cog",
    name: { fa: "", en: "", ar: "", ru: "" },
    short: { fa: "", en: "", ar: "", ru: "" },
    active: true,
    order: 99
  };
}

export default function ServicesClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
      if (data.ok) { setItems(list); notify("ذخیره شد"); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const s = blank();
    setItems(items.concat([s]));
    setEditing(s.slug);
  }

  function remove(id) {
    if (!confirm("این خدمت حذف شود؟")) return;
    save(items.filter(function(x) { return x.slug !== id; }));
  }

  function toggle(id) {
    const list = items.map(function(x) { return x.slug === id ? Object.assign({}, x, { active: !x.active }) : x; });
    save(list);
  }

  function update(slug, patch) {
    setItems(items.map(function(x) { return x.slug === slug ? Object.assign({}, x, patch) : x; }));
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

      <div className="card-grid">
        {items.map(function(s, i) {
          const isFeatured = s.slug === "hvf-coating" || s.slug === "lop-test";
          const isEditing = editing === s.slug;
          const iconName = ICON_MAP[s.icon] || "cog";

          return (
            <div key={s.slug} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
              <div className={"card-item" + (isFeatured ? " card-item-featured" : "")}>
                <div className="card-item-head">
                  <div className="card-item-icon" style={{
                    background: isFeatured
                      ? "linear-gradient(135deg, #E0A81A, #B8850A)"
                      : "linear-gradient(135deg, #F7630C, #CA5010)"
                  }}>
                    <Icon name={iconName} size={18} />
                  </div>
                  {isFeatured && <span className="chip chip-gold"><Icon name="sparkles" /> ویژه</span>}
                </div>

                <div className="card-item-title">{pick(s.name)}</div>
                <div className="card-item-desc">{pick(s.short)}</div>

                <div className="card-item-foot">
                  <ToggleBtn active={s.active !== false} onClick={function() { toggle(s.slug); }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <EditBtn onClick={function() { setEditing(isEditing ? null : s.slug); }} />
                    <DeleteBtn onClick={function() { remove(s.slug); }} />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="anim-in" style={{
                  background: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 8
                }}>
                  <ServiceForm service={s} update={update}
                    onSave={function() { save(items); setEditing(null); }}
                    onCancel={function() { setEditing(null); }} />
                </div>
              )}
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

  function upd(field, val) {
    const nf = Object.assign({}, service[field]);
    nf[lang] = val;
    const patch = {};
    patch[field] = nf;
    update(service.slug, patch);
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

      <label className="form-label">عنوان</label>
      <input type="text" value={service.name[lang] || ""}
        onChange={function(e) { upd("name", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>توضیح کوتاه</label>
      <textarea rows={2} value={service.short[lang] || ""}
        onChange={function(e) { upd("short", e.target.value); }} className="form-input" />

      <label className="form-label" style={{ marginTop: 10 }}>آیکون</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ICON_OPTIONS.map(function(ic) {
          return (
            <button key={ic} type="button" onClick={function() { update(service.slug, { icon: ic }); }}
              className={"act-btn" + (service.icon === ic ? " act-btn-gold" : "")}
              style={service.icon !== ic ? { background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" } : {}}
              title={ic}>
              <Icon name={ICON_MAP[ic]} />
            </button>
          );
        })}
      </div>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
