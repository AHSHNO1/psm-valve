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
    id: "news-" + Date.now().toString(36),
    slug: "",
    title: { fa: "", en: "", ar: "", ru: "" },
    excerpt: { fa: "", en: "", ar: "", ru: "" },
    content: { fa: "", en: "", ar: "", ru: "" },
    category: { fa: "اخبار شرکت", en: "Company News", ar: "أخبار الشركة", ru: "Новости" },
    image: "",
    date: new Date().toLocaleDateString("fa-IR"),
    active: true,
    order: 99
  };
}

export default function NewsClient({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    setBusy(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: list })
      });
      const data = await res.json();
      if (data.ok) {
        setItems(list.map((item) => ({
          ...item,
          status: item.active === false
            ? (item.status === "pending" ? "pending" : "draft")
            : "published"
        })));
        notify("ذخیره شد", false);
      }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
    setBusy(false);
  }

  function add() {
    const n = blank();
    setItems(items.concat([n]));
    setEditing(n.id);
  }

  function remove(id) {
    if (!confirm("این خبر حذف شود؟")) return;
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
            <Icon name="newspaper" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">اخبار</div>
            <div className="page-header-sub">{items.length} خبر منتشر شده</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> افزودن خبر
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} />
          {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="newspaper" size={30} /></div>
          <div className="empty-title">هنوز خبری اضافه نشده</div>
          <div className="empty-desc">اخبار شرکت را از اینجا اضافه کنید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین خبر
          </button>
        </div>
      ) : (
        <div>
          {items.map(function(n, i) {
            const isEditing = editing === n.id;
            return (
              <div key={n.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="row">
                  <div className="row-thumb">
                    {n.image ? <img src={n.image} alt="" /> : <Icon name="newspaper" size={20} />}
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-teal">{pick(n.category)}</span>
                      {n.active !== false ? (
                        <span className="chip chip-green"><Icon name="check" /> فعال</span>
                      ) : (
                        <span className="chip chip-gray">غیرفعال</span>
                      )}
                      {n.status === "pending" && <span className="chip chip-teal">در انتظار تأیید مدیر</span>}
                    </div>
                    <div className="row-title">{pick(n.title)}</div>
                    <div className="row-meta">
                      <span><Icon name="calendar" size={11} /> {n.date || "—"}</span>
                      {n.slug && <span>· {n.slug}</span>}
                    </div>
                  </div>

                  <div className="row-actions">
                    <ToggleBtn active={n.active !== false} onClick={function() { toggle(n.id); }} />
                    <EditBtn onClick={function() { setEditing(isEditing ? null : n.id); }} />
                    <DeleteBtn onClick={function() { remove(n.id); }} />
                  </div>
                </div>

                {isEditing && (
                  <div className="anim-in" style={{
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 10,
                    marginTop: -4
                  }}>
                    <NewsForm
                      news={n}
                      update={update}
                      onSave={function() { save(items); setEditing(null); }}
                      onCancel={function() { setEditing(null); }}
                    />
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

function NewsForm({ news, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");

  function upd(field, val) {
    const newField = Object.assign({}, news[field]);
    newField[lang] = val;
    const patch = {};
    patch[field] = newField;
    update(news.id, patch);
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <div>
          <label className="form-label">عنوان</label>
          <input type="text" value={news.title[lang] || ""}
            onChange={function(e) { upd("title", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>خلاصه</label>
          <textarea rows={2} value={news.excerpt[lang] || ""}
            onChange={function(e) { upd("excerpt", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>دسته</label>
          <input type="text" value={news.category[lang] || ""}
            onChange={function(e) { upd("category", e.target.value); }} className="form-input" />
        </div>

        <div>
          <label className="form-label">نامک (slug)</label>
          <input type="text" dir="ltr" value={news.slug || ""}
            onChange={function(e) { update(news.id, { slug: e.target.value.replace(/[^a-z0-9-]/g, "") }); }}
            className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>تاریخ</label>
          <input type="text" value={news.date || ""}
            onChange={function(e) { update(news.id, { date: e.target.value }); }}
            className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>تصویر</label>
          <input type="text" dir="ltr" value={news.image || ""}
            onChange={function(e) { update(news.id, { image: e.target.value }); }}
            className="form-input" placeholder="آدرس تصویر" />
        </div>
      </div>

      <div className="save-bar">
        <SaveBtn onClick={onSave} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
