"use client";

import { useEffect, useState } from "react";
import { Icon } from "./AdminIcons";
import { useToast, Toast } from "./useToast";

const initialForm = { name: "", username: "", password: "" };

export default function UsersClient() {
  const [authors, setAuthors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify, toast, dismiss } = useToast();

  async function loadAuthors() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "دریافت کاربران ناموفق بود");
    setAuthors(data.authors);
  }

  useEffect(() => {
    loadAuthors()
      .catch((error) => notify(error.message, true))
      .finally(() => setLoading(false));
  }, [notify]);

  async function createAuthor(event) {
    event.preventDefault();
    setSaving(true);
    dismiss();
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ساخت حساب ناموفق بود");
      setAuthors((current) => [data.author, ...current]);
      setForm(initialForm);
      notify("حساب نویسنده ساخته شد. رمز اولیه را امن به او تحویل دهید.");
    } catch (error) {
      notify(error.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAuthor(author) {
    dismiss();
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: author.id, active: author.active === false })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "به‌روزرسانی ناموفق بود");
      setAuthors((current) =>
        current.map((item) => item.id === author.id ? { ...item, active: author.active === false } : item)
      );
    } catch (error) {
      notify(error.message, true);
    }
  }

  return (
    <section>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #4F6BED, #3147A8)" }}>
            <Icon name="user" size={22} />
          </div>
          <div>
            <h1 className="page-header-title">حساب‌های نویسنده</h1>
            <p className="page-header-sub">دسترسی محدود برای تهیهٔ پیش‌نویس خبر و مقاله</p>
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      <form onSubmit={createAuthor} className="card-item anim-in" style={{ marginBottom: 18 }}>
        <h2 className="font-bold mb-4">افزودن نویسنده</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <label>
            <span className="form-label">نام نمایشی</span>
            <input className="form-input" required minLength={2} maxLength={100} value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            <span className="form-label">نام کاربری</span>
            <input className="form-input" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+"
              autoComplete="off" dir="ltr" value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </label>
          <label>
            <span className="form-label">رمز موقت (حداقل ۱۲ نویسه)</span>
            <input className="form-input" type="password" required minLength={12} maxLength={200}
              autoComplete="new-password" value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
        </div>
        <button className="btn-add mt-4" type="submit" disabled={saving}>
          <Icon name="plus" /> {saving ? "در حال ساخت..." : "ساخت حساب"}
        </button>
      </form>

      <div className="card-item anim-in">
        <h2 className="font-bold mb-4">نویسندگان ({authors.length})</h2>
        {loading ? <p>در حال بارگذاری...</p> : authors.length === 0 ? (
          <p className="text-sm">هنوز حساب نویسنده‌ای ایجاد نشده است.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {authors.map((author) => (
              <div key={author.id} className="row">
                <div className="row-body">
                  <div className="row-title">{author.name}</div>
                  <div className="row-meta" dir="ltr">{author.username}</div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => toggleAuthor(author)}>
                  {author.active === false ? "فعال‌سازی" : "تعلیق دسترسی"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
