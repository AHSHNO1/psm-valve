"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

const LANGUAGES = [
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" }
];

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
      <ContentStudioNav />

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
                      onSave={async function() {
                        if (await save(items)) setEditing(null);
                      }}
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [language, setLanguage] = useState("fa");
  const inputRef = useRef(null);
  const currentLanguage = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

  function updateLocalized(field, value) {
    const current = slide[field];
    const localized = current && typeof current === "object" && !Array.isArray(current)
      ? current
      : { fa: typeof current === "string" ? current : "", en: "", ar: "", ru: "" };
    update(slide.id, { [field]: { ...localized, [language]: value } });
  }

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        setUploadError(data.error || "بارگذاری تصویر انجام نشد.");
        return;
      }
      update(slide.id, { image: data.url });
    } catch (e) {
      setUploadError("خطای شبکه هنگام بارگذاری تصویر. دوباره تلاش کنید.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="slide-editor">
      <div className="slide-editor-heading">
        <div>
          <h3>محتوای اسلاید</h3>
          <p>عنوان، توضیح و دکمه را برای زبان‌های سایت ویرایش کنید.</p>
        </div>
        <span className="chip chip-blue">پیش‌نمایش زنده</span>
      </div>

      <div className="slide-editor-grid">
        <div className="slide-editor-fields">
          <div className="slide-language-tabs" role="tablist" aria-label="زبان متن اسلاید">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                role="tab"
                aria-selected={language === item.code}
                className={"slide-language-tab" + (language === item.code ? " slide-language-tab-active" : "")}
                onClick={() => setLanguage(item.code)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="form-label" htmlFor={"slide-title-" + slide.id}>تیتر اسلاید · {currentLanguage.label}</label>
          <input
            id={"slide-title-" + slide.id}
            type="text"
            dir={currentLanguage.dir}
            value={localizedValue(slide.title, language)}
            onChange={(event) => updateLocalized("title", event.target.value)}
            className="form-input"
            placeholder="تیتر اصلی که روی تصویر نمایش داده می‌شود"
          />

          <label className="form-label slide-editor-label" htmlFor={"slide-subtitle-" + slide.id}>
            توضیح زیر تیتر · {currentLanguage.label}
          </label>
          <textarea
            id={"slide-subtitle-" + slide.id}
            dir={currentLanguage.dir}
            value={localizedValue(slide.subtitle, language)}
            onChange={(event) => updateLocalized("subtitle", event.target.value)}
            className="form-input"
            rows={3}
            placeholder="توضیح کوتاهی که زیر تیتر اسلاید دیده می‌شود"
          />

          <div className="slide-editor-cta">
            <div>
              <label className="form-label" htmlFor={"slide-cta-" + slide.id}>متن دکمه · {currentLanguage.label}</label>
              <input
                id={"slide-cta-" + slide.id}
                type="text"
                dir={currentLanguage.dir}
                value={localizedValue(slide.ctaText, language)}
                onChange={(event) => updateLocalized("ctaText", event.target.value)}
                className="form-input"
                placeholder="مثلاً مشاهده محصولات"
              />
            </div>
            <div>
              <label className="form-label" htmlFor={"slide-cta-href-" + slide.id}>لینک دکمه</label>
              <input
                id={"slide-cta-href-" + slide.id}
                type="text"
                dir="ltr"
                value={slide.ctaHref || ""}
                onChange={(event) => update(slide.id, { ctaHref: event.target.value })}
                className="form-input"
                placeholder="/products"
              />
            </div>
          </div>
        </div>

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

      <div className="slide-image-editor">
        <label className="form-label">تصویر اسلاید</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={function(e) { upload(e.target.files[0]); }}
      />
      {slide.image ? (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #D1D5DB" }}>
          <img src={slide.image} alt="" style={{ width: "100%", display: "block", maxHeight: 360, objectFit: "contain", background: "#F4F5F7" }} />
        </div>
      ) : (
        <div style={{
          border: "2px dashed #D1D5DB",
          background: "#F4F5F7",
          borderRadius: 10,
          padding: 30,
          textAlign: "center"
        }}>
          <Icon name="image" size={28} />
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 8, color: "#4B5563" }}>
            هنوز تصویری برای این اسلاید انتخاب نشده است
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button
          type="button"
          className="btn-add"
          disabled={uploading}
          onClick={function() { inputRef.current && inputRef.current.click(); }}
        >
          <Icon name={uploading ? "loader" : "upload"} size={16} />
          {uploading ? "در حال بارگذاری..." : slide.image ? "تغییر تصویر" : "انتخاب تصویر"}
        </button>
        {slide.image && (
          <button
            type="button"
            className="act-btn act-btn-delete"
            disabled={uploading}
            onClick={function() { update(slide.id, { image: "" }); }}
          >
            <Icon name="x" size={16} /> حذف تصویر
          </button>
        )}
      </div>
      {uploadError && (
        <div role="alert" style={{ marginTop: 8, color: "#B91C1C", fontSize: 12 }}>
          {uploadError}
        </div>
      )}
      <div style={{ marginTop: 7, color: "#6B7280", fontSize: 11 }}>
        فرمت‌های مجاز: JPG، PNG، WebP و GIF؛ حداکثر حجم ۵۰ مگابایت.
      </div>
      </div>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
