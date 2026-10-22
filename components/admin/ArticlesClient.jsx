"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import EditorPanel, { ADMIN_LANGUAGES, FormSection, FormGrid, Field, LocaleTabs, languageDir } from "./EditorPanel";

function pick(value) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.fa || value.en || "—";
}

function articleKey(article) {
  return article.id || article.slug;
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function blankArticle() {
  const suffix = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  return {
    id: "new-" + suffix,
    slug: "article-" + suffix,
    title: { fa: "", en: "", ar: "", ru: "" },
    excerpt: { fa: "", en: "", ar: "", ru: "" },
    body: { fa: "", en: "", ar: "", ru: "" },
    category: { fa: "", en: "", ar: "", ru: "" },
    date: { fa: "", en: "", ar: "", ru: "" },
    readMinutes: 1,
    pdfUrl: "",
    image: "",
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
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some((article) => articleKey(article) === articleKey(draft));

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
    setDraft(blankArticle());
  }

  function edit(article) {
    setDraft(copy(article));
  }

  function clone(article) {
    const next = copy(article);
    next.id = "new-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    next.slug = "article-" + Date.now().toString(36);
    next.title.fa = (next.title.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function update(slug, patch) {
    setDraft((current) =>
      current && articleKey(current) === slug ? { ...current, ...patch } : current
    );
  }

  async function remove(slug) {
    if (!confirm("این مقاله حذف شود؟")) return;
    if (draft && draft.slug === slug) setDraft(null);
    const next = items.filter((article) => article.slug !== slug);
    await save(next);
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
    if (!draft) return;
    const exists = items.some((article) => articleKey(article) === articleKey(draft));
    const list = exists
      ? items.map((article) => articleKey(article) === articleKey(draft) ? draft : article)
      : items.concat([draft]);
    if (await save(list)) setDraft(null);
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

      {draft && (
        <EditorPanel
          title={isNew ? "مقالهٔ جدید" : "ویرایش مقاله"}
          subtitle={pick(draft.title) !== "—" ? pick(draft.title) : "عنوان، متن، فایل PDF و تصویر مقاله را وارد کنید"}
          icon={<Icon name="file" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <ArticleForm
            article={draft}
            articleId={articleKey(draft)}
            update={update}
            onSave={saveEditor}
            onCancel={cancel}
          />
        </EditorPanel>
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
            const isEditing = draft !== null && articleKey(draft) === articleKey(article);
            return (
              <div key={articleKey(article)} className="anim-in">
                <div className={"card-item" + (isEditing ? " card-item-editing" : "")}>
                  <div className="card-item-title">{pick(article.title)}</div>
                  <div className="card-item-desc">{pick(article.excerpt)}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span className="chip chip-gray">{article.slug || "شناسه تعیین نشده"}</span>
                    {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
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
                      <EditBtn onClick={() => { if (isEditing) cancel(); else edit(article); }} />
                      <button type="button" onClick={() => clone(article)} className="act-btn" title="کپی" aria-label="کپی مقاله" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                        +
                      </button>
                      {article.slug && <DeleteBtn onClick={() => remove(article.slug)} />}
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

function ArticleForm({ article, articleId, update, onCancel, onSave }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const currentLabel = ADMIN_LANGUAGES.find((item) => item.code === lang)?.label || "فارسی";
  const filled = {};
  ADMIN_LANGUAGES.forEach((item) => {
    filled[item.code] = Boolean(article.title?.[item.code] || article.body?.[item.code]);
  });

  function updateLocalized(field, value) {
    const existing = article[field];
    const localized = typeof existing === "object" && existing ? { ...existing } : {};
    if (typeof existing === "string" && existing) localized.fa = existing;
    localized[lang] = value;
    update(articleId, { [field]: localized });
  }

  function val(field) {
    if (typeof article[field] === "string") return lang === "fa" ? article[field] : "";
    return article[field]?.[lang] || "";
  }

  return (
    <div>
      <FormSection
        title="متن مقاله"
        description="عنوان، دسته‌بندی، تاریخ، خلاصه و متن کامل را برای هر زبان وارد کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="عنوان مقاله" required>
            <input type="text" dir={currentDir} value={val("title")}
              onChange={(event) => updateLocalized("title", event.target.value)}
              className="form-input" placeholder="عنوان مقاله" />
          </Field>

          <Field label="دسته‌بندی">
            <input type="text" dir={currentDir} value={val("category")}
              onChange={(event) => updateLocalized("category", event.target.value)}
              className="form-input" placeholder="مثلاً دانش فنی" />
          </Field>

          <Field label="تاریخ">
            <input type="text" dir="auto" value={val("date")}
              onChange={(event) => updateLocalized("date", event.target.value)}
              className="form-input" placeholder="۱۴۰۴/۰۱/۰۱" />
          </Field>

          <Field label="زمان مطالعه (دقیقه)">
            <input
              type="number"
              min="1"
              value={article.readMinutes || ""}
              onChange={(event) => update(articleId, { readMinutes: Number(event.target.value) || "" })}
              className="form-input"
            />
          </Field>

          <Field label="خلاصه مقاله" wide>
            <textarea rows={3} dir={currentDir} value={val("excerpt")}
              onChange={(event) => updateLocalized("excerpt", event.target.value)}
              className="form-input" placeholder="خلاصه‌ای که در فهرست مقاله‌ها نمایش داده می‌شود" />
          </Field>

          <Field
            label={"متن کامل مقاله · " + currentLabel}
            wide
            hint={(article.body?.[lang] || "").length.toLocaleString("fa-IR") + " کاراکتر"}
          >
            <textarea rows={8} dir={currentDir} value={val("body")}
              onChange={(event) => updateLocalized("body", event.target.value)}
              className="form-input" style={{ lineHeight: 2, minHeight: 180 }} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="نشانی، فایل و تصویر"
        description="نامک در آدرس صفحه استفاده می‌شود. فایل PDF و تصویر مقاله اختیاری است."
      >
        <FormGrid>
          <Field label="شناسهٔ انگلیسی (slug)" hint={"آدرس صفحه: /fa/articles/" + (article.slug || "…")}>
            <input
              type="text"
              dir="ltr"
              value={article.slug || ""}
              onChange={(event) => update(articleId, { slug: event.target.value })}
              className="form-input"
              placeholder="example-article"
            />
          </Field>

          <Field as="div" label="فایل PDF مقاله" wide>
            <UploadDropzone
              type="catalogs"
              guidelineKey="catalog"
              value={article.pdfUrl || ""}
              onChange={(url) => update(articleId, { pdfUrl: url })}
              label=""
              accept="application/pdf,.pdf"
              hint="PDF · حداکثر ۱۰ مگابایت"
            />
          </Field>

          <Field as="div" label="تصویر مقاله" wide>
            <UploadDropzone
              type="images"
              guidelineKey="newsImage"
              value={article.image || ""}
              onChange={(url) => update(articleId, { image: url })}
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
