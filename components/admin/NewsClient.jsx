"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import GalleryUploader from "./GalleryUploader";

const LANGS = [
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" }
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function blank() {
  return {
    id: "news-" + Date.now().toString(36),
    slug: "news-" + Date.now().toString(36),
    title: { fa: "", en: "", ar: "", ru: "" },
    excerpt: { fa: "", en: "", ar: "", ru: "" },
    content: { fa: "", en: "", ar: "", ru: "" },
    category: { fa: "اخبار شرکت", en: "Company News", ar: "أخبار الشركة", ru: "Новости" },
    image: "",
    gallery: [],
    date: new Date().toLocaleDateString("fa-IR"),
    active: true,
    order: 99
  };
}

function galleryOf(item) {
  return Array.isArray(item.gallery) ? item.gallery : [];
}

export default function NewsClient({ initial }) {
  const [items, setItems] = useState((initial || []).map(function(item) {
    return { ...item, gallery: galleryOf(item) };
  }));
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3500);
  }

  function validate(list) {
    const slugs = new Set();
    for (const item of list) {
      if (!item.slug || !SLUG_RE.test(item.slug)) {
        return "نامک (slug) خبر «" + pick(item.title) + "» معتبر نیست. فقط حروف کوچک انگلیسی، عدد و خط تیره مجاز است.";
      }
      if (slugs.has(item.slug)) return "نامک تکراری: " + item.slug;
      slugs.add(item.slug);
      if (!item.title?.fa?.trim() && !item.title?.en?.trim()) {
        return "عنوان فارسی یا انگلیسی خبر را وارد کنید.";
      }
      if (galleryOf(item).length > 24) {
        return "حداکثر ۲۴ تصویر برای هر خبر مجاز است.";
      }
    }
    return "";
  }

  async function save(list) {
    const validationError = validate(list);
    if (validationError) {
      notify(validationError, true);
      return false;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: list })
      });
      const data = await res.json().catch(function() { return {}; });
      if (res.ok && data.ok) {
        setItems(list.map((item) => ({
          ...item,
          gallery: galleryOf(item),
          status: item.active === false
            ? (item.status === "pending" ? "pending" : "draft")
            : "published"
        })));
        notify("خبر و گالری تصاویر ذخیره شد.");
        return true;
      }
      notify(data.error || "ذخیره خبر ناموفق بود.", true);
      return false;
    } catch (error) {
      notify("خطای شبکه در ذخیره خبر.", true);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function add() {
    const n = blank();
    setItems(items.concat([n]));
    setEditing(n.id);
  }

  function clone(n) {
    const c = {
      ...n,
      id: "news-" + Date.now().toString(36),
      slug: n.slug + "-copy",
      title: { ...n.title },
      excerpt: { ...n.excerpt },
      content: { ...n.content },
      category: { ...n.category },
      gallery: galleryOf(n).slice()
    };
    setItems(items.concat([c]));
    setEditing(c.id);
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
    setItems(function(current) {
      return current.map(function(x) { return x.id === id ? Object.assign({}, x, patch) : x; });
    });
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
            <div className="page-header-sub">{items.length} خبر · هر خبر با متن چندزبانه و گالری تصاویر</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> افزودن خبر
        </button>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")} role="status">
          <Icon name={msg.type === "success" ? "check" : "alert"} />
          {msg.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="newspaper" size={30} /></div>
          <div className="empty-title">هنوز خبری اضافه نشده</div>
          <div className="empty-desc">متن خبر و دست‌کم سه تصویر گالری را از اینجا ثبت کنید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین خبر
          </button>
        </div>
      ) : (
        <div>
          {items.map(function(n, i) {
            const isEditing = editing === n.id;
            const gallery = galleryOf(n);
            const thumb = n.image || gallery[0];
            return (
              <div key={n.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className="row">
                  <div className="row-thumb">
                    {thumb ? <img src={thumb} alt="" /> : <Icon name="newspaper" size={20} />}
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-teal">{pick(n.category)}</span>
                      {n.active !== false ? (
                        <span className="chip chip-green"><Icon name="check" /> فعال</span>
                      ) : (
                        <span className="chip chip-gray">غیرفعال</span>
                      )}
                      <span className={"chip " + (gallery.length >= 3 ? "chip-blue" : "chip-gold")}>
                        {gallery.length} تصویر گالری
                      </span>
                      {n.status === "pending" && <span className="chip chip-teal">در انتظار تأیید مدیر</span>}
                    </div>
                    <div className="row-title">{pick(n.title)}</div>
                    <div className="row-meta">
                      <span><Icon name="calendar" size={11} /> {n.date || "—"}</span>
                      {n.slug && <span>· {n.slug}</span>}
                      {n.content?.fa && <span>· {n.content.fa.length.toLocaleString("fa-IR")} کاراکتر متن</span>}
                    </div>
                  </div>

                  <div className="row-actions">
                    <ToggleBtn active={n.active !== false} onClick={function() { toggle(n.id); }} />
                    <EditBtn onClick={function() { setEditing(isEditing ? null : n.id); }} />
                    <button type="button" onClick={function() { clone(n); }} className="act-btn" title="کپی" aria-label="کپی خبر" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                      +
                    </button>
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
                      busy={busy}
                      onSave={async function() {
                        const ok = await save(items);
                        if (ok) setEditing(null);
                      }}
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

function NewsForm({ news, update, onSave, onCancel, busy }) {
  const [lang, setLang] = useState("fa");
  const currentDir = LANGS.find(function(item) { return item.code === lang; })?.dir || "rtl";
  const gallery = galleryOf(news);

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
          <label className="form-label">عنوان خبر</label>
          <input type="text" dir={currentDir} value={news.title[lang] || ""}
            onChange={function(e) { upd("title", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>خلاصه خبر</label>
          <textarea rows={2} dir={currentDir} value={news.excerpt[lang] || ""}
            onChange={function(e) { upd("excerpt", e.target.value); }} className="form-input" />

          <label className="form-label" style={{ marginTop: 12 }}>دسته‌بندی</label>
          <input type="text" dir={currentDir} value={news.category[lang] || ""}
            onChange={function(e) { upd("category", e.target.value); }} className="form-input" />
        </div>

        <div>
          <label className="form-label">نامک (slug)</label>
          <input type="text" dir="ltr" value={news.slug || ""}
            onChange={function(e) { update(news.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }); }}
            className="form-input" />
          <div className="form-hint">آدرس صفحه: /fa/news/{news.slug || "…"}</div>

          <label className="form-label" style={{ marginTop: 12 }}>تاریخ</label>
          <input type="text" dir="auto" value={news.date || ""}
            onChange={function(e) { update(news.id, { date: e.target.value }); }}
            className="form-input" />

          <div style={{ marginTop: 12 }}>
            <UploadDropzone
              type="images"
              value={news.image || ""}
              onChange={function(url) { update(news.id, { image: url }); }}
              label="تصویر کاور خبر"
              accept="image/*"
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="form-label">متن کامل خبر ({LANGS.find(function(item) { return item.code === lang; })?.label})</label>
        <textarea
          rows={9}
          dir={currentDir}
          value={news.content?.[lang] || ""}
          onChange={function(e) { upd("content", e.target.value); }}
          className="form-input"
          placeholder="متن خبر را در یک یا چند پاراگراف بنویسید. هر خط خالی، پاراگراف جدید می‌سازد."
          style={{ lineHeight: 2, minHeight: 190 }}
        />
        <div className="form-hint" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span>هر خط خالی، پاراگراف جدید ایجاد می‌کند. متن به‌صورت امن (بدون HTML) نمایش داده می‌شود.</span>
          <span>{(news.content?.[lang] || "").length.toLocaleString("fa-IR")} کاراکتر</span>
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #D1D5DB" }}>
        <GalleryUploader
          images={gallery}
          cover={news.image || ""}
          onChange={function(next) { update(news.id, { gallery: next }); }}
          onCoverChange={function(url) { update(news.id, { image: url }); }}
        />
      </div>

      <div className="save-bar" style={{ marginTop: 16 }}>
        <SaveBtn onClick={onSave} disabled={busy} />
        <CancelBtn onClick={onCancel} />
        {news.slug && (
          <a href={"/fa/news/" + news.slug} target="_blank" rel="noopener noreferrer"
            className="btn-cancel" style={{ textDecoration: "none" }}>
            پیش‌نمایش صفحه خبر
          </a>
        )}
      </div>
    </div>
  );
}
