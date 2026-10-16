"use client";

import { useEffect, useState } from "react";
import { Icon } from "./AdminIcons";

const locales = [
  { id: "fa", label: "فارسی" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
  { id: "ru", label: "Русский" }
];

const blankLocalized = () => ({ fa: "", en: "", ar: "", ru: "" });
const blankForm = () => ({
  id: "",
  type: "article",
  slug: "",
  title: blankLocalized(),
  excerpt: blankLocalized(),
  category: blankLocalized(),
  text: blankLocalized()
});

export default function AuthorWorkspace() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [locale, setLocale] = useState("fa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadItems() {
    const response = await fetch("/api/author/content", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "بارگذاری محتوا ناموفق بود");
    setItems([
      ...data.articles.map((item) => ({ ...item, type: "article", text: item.body || {} })),
      ...data.news.map((item) => ({ ...item, type: "news", text: item.content || {} }))
    ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
  }

  useEffect(() => {
    loadItems()
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  function updateLocalized(field, value) {
    setForm((current) => ({
      ...current,
      [field]: { ...current[field], [locale]: value }
    }));
  }

  function edit(item) {
    setForm({
      id: item.id,
      type: item.type,
      slug: item.slug || "",
      title: item.title || blankLocalized(),
      excerpt: item.excerpt || blankLocalized(),
      category: item.category || blankLocalized(),
      text: item.text || blankLocalized()
    });
    setLocale("fa");
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const item = {
        id: form.id || undefined,
        slug: form.slug.trim().toLowerCase(),
        title: form.title,
        excerpt: form.excerpt,
        category: form.category,
        [form.type === "article" ? "body" : "content"]: form.text
      };
      const response = await fetch("/api/author/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, item })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ذخیرهٔ پیش‌نویس ناموفق بود");
      await loadItems();
      setForm(blankForm());
      setNotice("پیش‌نویس برای بررسی مدیر ثبت شد؛ انتشار فقط توسط مدیر انجام می‌شود.");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #8764B8, #5F3A91)" }}>
            <Icon name="file" size={22} />
          </div>
          <div>
            <h1 className="page-header-title">فضای نویسنده</h1>
            <p className="page-header-sub">پیش‌نویس مقاله و خبر بسازید؛ انتشار پس از تأیید مدیر انجام می‌شود.</p>
          </div>
        </div>
      </div>

      {error && <div className="msg msg-error" role="alert">{error}</div>}
      {notice && <div className="msg msg-success" role="status">{notice}</div>}

      <form onSubmit={submit} className="card-item anim-in" style={{ marginBottom: 18 }}>
        <h2 className="font-bold mb-4">{form.id ? "ویرایش پیش‌نویس" : "پیش‌نویس جدید"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <label>
            <span className="form-label">نوع محتوا</span>
            <select className="form-input" value={form.type} disabled={Boolean(form.id)}
              onChange={(event) => setForm({ ...blankForm(), type: event.target.value })}>
              <option value="article">مقاله</option>
              <option value="news">خبر</option>
            </select>
          </label>
          <label>
            <span className="form-label">نامک انگلیسی</span>
            <input className="form-input" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              maxLength={100} value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>
        </div>

        <div className="tabs" role="tablist" aria-label="زبان محتوا" style={{ margin: "16px 0" }}>
          {locales.map((item) => (
            <button key={item.id} type="button" className={"tab" + (locale === item.id ? " tab-active" : "")}
              role="tab" aria-selected={locale === item.id} onClick={() => setLocale(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label>
            <span className="form-label">عنوان ({locales.find((item) => item.id === locale).label})</span>
            <input className="form-input" required maxLength={180} value={form.title[locale] || ""}
              onChange={(event) => updateLocalized("title", event.target.value)} />
          </label>
          <label>
            <span className="form-label">خلاصه</span>
            <textarea className="form-input" rows={3} required maxLength={2000}
              value={form.excerpt[locale] || ""}
              onChange={(event) => updateLocalized("excerpt", event.target.value)} />
          </label>
          <label>
            <span className="form-label">دسته‌بندی</span>
            <input className="form-input" maxLength={100} value={form.category[locale] || ""}
              onChange={(event) => updateLocalized("category", event.target.value)} />
          </label>
          <label>
            <span className="form-label">متن کامل</span>
            <textarea className="form-input" rows={9} maxLength={100000}
              value={form.text[locale] || ""}
              onChange={(event) => updateLocalized("text", event.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn-add" type="submit" disabled={saving}>
            <Icon name="save" /> {saving ? "در حال ذخیره..." : "ارسال برای بررسی"}
          </button>
          {form.id && <button className="btn-secondary" type="button" onClick={() => setForm(blankForm())}>لغو ویرایش</button>}
        </div>
      </form>

      <div className="card-item anim-in">
        <h2 className="font-bold mb-4">محتوای من</h2>
        {loading ? <p>در حال بارگذاری...</p> : items.length === 0 ? (
          <p className="text-sm">هنوز محتوایی ثبت نکرده‌اید.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((item) => (
              <div key={item.type + item.id} className="row">
                <div className="row-body">
                  <div className="row-title">{item.title?.fa || item.title?.en || item.slug}</div>
                  <div className="row-meta">
                    {item.type === "article" ? "مقاله" : "خبر"} · {item.status === "published" ? "منتشر شده" : "در انتظار بررسی"}
                  </div>
                </div>
                {item.status !== "published" && (
                  <button className="btn-secondary" type="button" onClick={() => edit(item)}>ویرایش</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
