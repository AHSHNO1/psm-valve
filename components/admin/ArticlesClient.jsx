"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function pick(value) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.fa || value.en || "—";
}

function articleKey(article) {
  return article.id || article.slug;
}

function blankArticle() {
  return {
    id: "new-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
    slug: "",
    title: { fa: "", en: "", ar: "", ru: "" },
    excerpt: { fa: "", en: "", ar: "", ru: "" },
    body: { fa: "", en: "", ar: "", ru: "" },
    category: { fa: "", en: "", ar: "", ru: "" },
    date: { fa: "", en: "", ar: "", ru: "" },
    readMinutes: 1,
    pdfUrl: "",
    active: true
  };
}

export default function ArticlesClient({ initial }) {
  const [items, setItems] = useState(() =>
    (initial || []).map((article) => ({
      ...article,
      id: article.id || "article-" + article.slug
    }))
  );
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMessage({ type: isError ? "error" : "success", text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  }

  async function save(list) {
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: list })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        notify(result.error || "ذخیرهٔ مقاله ناموفق بود", true);
        return false;
      }
      setItems(list.map((article) => ({
        ...article,
        status: article.active === false
          ? (article.status === "pending" ? "pending" : "draft")
          : "published"
      })));
      notify("مقاله‌ها ذخیره شدند");
      return true;
    } catch {
      notify("ارتباط با سرور برقرار نشد؛ تغییرات ذخیره نشد", true);
      return false;
    }
  }

  function add() {
    const article = blankArticle();
    setItems((current) => [...current, article]);
    setEditing(articleKey(article));
  }

  function update(slug, patch) {
    setItems((current) =>
      current.map((article) =>
        articleKey(article) === slug ? { ...article, ...patch } : article
      )
    );
  }

  async function remove(slug) {
    if (!confirm("این مقاله حذف شود؟")) return;
    const next = items.filter((article) => article.slug !== slug);
    if (await save(next)) setEditing(null);
  }

  async function toggle(slug) {
    const next = items.map((article) =>
      article.slug === slug
        ? { ...article, active: article.active === false }
        : article
    );
    await save(next);
  }

  async function saveEditor() {
    if (await save(items)) setEditing(null);
  }

  function cancelEditor(article) {
    if (!article.slug) {
      const key = articleKey(article);
      setItems((current) => current.filter((item) => articleKey(item) !== key));
    }
    setEditing(null);
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div
            className="page-header-icon"
            style={{ background: "linear-gradient(135deg, #8764B8, #5F3A91)" }}
          >
            <Icon name="file" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">مقاله‌ها</div>
            <div className="page-header-sub">{items.length} مقاله</div>
          </div>
        </div>
        <button onClick={add} className="btn-add">
          <Icon name="plus" /> مقالهٔ جدید
        </button>
      </div>

      {message.text && (
        <div className={"msg anim-in " + (message.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={message.type === "success" ? "check" : "alert"} /> {message.text}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="file" size={30} /></div>
          <div className="empty-title">هنوز مقاله‌ای ثبت نشده</div>
          <div className="empty-desc">مقاله‌ها و فایل PDF آن‌ها را از همین پنل مدیریت کنید</div>
          <button onClick={add} className="btn-add">
            <Icon name="plus" /> افزودن اولین مقاله
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((article) => {
            const isEditing = editing === articleKey(article);
            return (
              <div key={articleKey(article)} className="anim-in">
                <div className="card-item">
                  <div className="card-item-title">{pick(article.title)}</div>
                  <div className="card-item-desc">{pick(article.excerpt)}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span className="chip chip-gray">{article.slug || "شناسه تعیین نشده"}</span>
                    {article.status === "pending" && <span className="chip chip-teal">در انتظار تأیید مدیر</span>}
                    {article.pdfUrl && <span className="chip chip-blue">PDF پیوست شده</span>}
                  </div>
                  <div className="card-item-foot">
                    <ToggleBtn active={article.active !== false} onClick={() => toggle(article.slug)} />
                    <div style={{ display: "flex", gap: 6 }}>
                      {article.slug && (
                        <Link href={"/fa/articles/" + article.slug} target="_blank" className="act-btn act-btn-gold" aria-label="پیش‌نمایش">
                          <Icon name="external" />
                        </Link>
                      )}
                      <EditBtn onClick={() => setEditing(isEditing ? null : articleKey(article))} />
                      {article.slug && <DeleteBtn onClick={() => remove(article.slug)} />}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div
                    className="anim-in"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #D1D5DB",
                      borderRadius: 12,
                      padding: 14,
                      marginTop: 8
                    }}
                  >
                    <ArticleForm
                      article={article}
                      articleId={articleKey(article)}
                      update={update}
                      onSave={saveEditor}
                      onCancel={() => cancelEditor(article)}
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

function ArticleForm({ article, articleId, update, onSave, onCancel }) {
  const [lang, setLang] = useState("fa");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef(null);

  function updateLocalized(field, value) {
    const existing = article[field];
    const localized = typeof existing === "object" && existing ? { ...existing } : {};
    if (typeof existing === "string" && existing) localized.fa = existing;
    localized[lang] = value;
    update(articleId, { [field]: localized });
  }

  async function upload(file) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "catalogs");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setUploadError(result.error || "آپلود PDF ناموفق بود");
        return;
      }
      update(articleId, { pdfUrl: result.url });
    } catch {
      setUploadError("ارتباط با سرور برقرار نشد؛ فایل آپلود نشد");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="form-label">شناسهٔ انگلیسی مقاله (بدون فاصله)</label>
      <input
        type="text"
        dir="ltr"
        value={article.slug || ""}
        onChange={(event) => update(articleId, { slug: event.target.value })}
        className="form-input"
        placeholder="example-article"
      />

      <div className="tabs" style={{ marginTop: 12 }}>
        {LANGS.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLang(item.code)}
            className={"tab" + (lang === item.code ? " tab-active" : "")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {[
        ["title", "عنوان"],
        ["category", "دسته‌بندی"],
        ["date", "تاریخ"],
        ["excerpt", "خلاصه"],
        ["body", "متن کامل"]
      ].map(([field, label]) => (
        <div key={field}>
          <label className="form-label" style={{ marginTop: 10 }}>{label}</label>
          {field === "excerpt" || field === "body" ? (
            <textarea
              rows={field === "body" ? 8 : 3}
              value={article[field]?.[lang] || (typeof article[field] === "string" && lang === "fa" ? article[field] : "")}
              onChange={(event) => updateLocalized(field, event.target.value)}
              className="form-input"
            />
          ) : (
            <input
              type="text"
              value={article[field]?.[lang] || (typeof article[field] === "string" && lang === "fa" ? article[field] : "")}
              onChange={(event) => updateLocalized(field, event.target.value)}
              className="form-input"
            />
          )}
        </div>
      ))}

      <label className="form-label" style={{ marginTop: 10 }}>زمان مطالعه (دقیقه)</label>
      <input
        type="number"
        min="1"
        value={article.readMinutes || ""}
        onChange={(event) => update(articleId, { readMinutes: Number(event.target.value) || "" })}
        className="form-input"
      />

      <label className="form-label" style={{ marginTop: 10 }}>فایل PDF محلی</label>
      {article.pdfUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <a href={article.pdfUrl} target="_blank" rel="noreferrer" className="form-input" dir="ltr">
            {article.pdfUrl}
          </a>
          <button type="button" onClick={() => update(articleId, { pdfUrl: "" })} className="act-btn act-btn-delete">
            <Icon name="x" />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => upload(event.target.files?.[0])}
            className="form-input"
          />
          {uploading && <div className="form-label">در حال آپلود فایل…</div>}
        </div>
      )}
      {uploadError && <div className="msg msg-error" style={{ marginTop: 8 }}>{uploadError}</div>}

      <div className="save-bar">
        <SaveBtn onClick={onSave} busy={uploading} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
