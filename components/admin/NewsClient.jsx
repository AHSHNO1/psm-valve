"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { EditBtn, DeleteBtn, ToggleBtn, SaveBtn, CancelBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import GalleryUploader from "./GalleryUploader";
import EditorPanel, { ADMIN_LANGUAGES, FormSection, FormGrid, Field, LocaleTabs, languageDir } from "./EditorPanel";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function pick(obj) {
  if (!obj) return "—";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "—";
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function blank() {
  const suffix = Date.now().toString(36);
  return {
    id: "news-" + suffix,
    slug: "news-" + suffix,
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
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isNew = Boolean(draft) && !items.some(function(item) { return item.id === draft.id; });

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
    setDraft(blank());
  }

  function edit(item) {
    setDraft(copy(item));
  }

  function clone(item) {
    const next = copy(item);
    next.id = "news-" + Date.now().toString(36);
    next.slug = item.slug ? item.slug + "-copy" : "";
    next.title.fa = (next.title.fa || "") + " (کپی)";
    setDraft(next);
  }

  function cancel() {
    setDraft(null);
  }

  function remove(id) {
    if (!confirm("این خبر حذف شود؟")) return;
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

      {draft && (
        <EditorPanel
          title={isNew ? "خبر جدید" : "ویرایش خبر"}
          subtitle={pick(draft.title) !== "—" ? pick(draft.title) : "عنوان و متن خبر را در زبان‌های سایت وارد کنید"}
          icon={<Icon name="newspaper" />}
          badge={<span className={"chip " + (isNew ? "chip-gold" : "chip-teal")}>{isNew ? "ذخیره‌نشده" : "در حال ویرایش"}</span>}
          onClose={cancel}
        >
          <NewsForm
            news={draft}
            update={update}
            busy={busy}
            onSave={saveDraft}
            onCancel={cancel}
          />
        </EditorPanel>
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
            const isEditing = draft !== null && draft.id === n.id;
            const gallery = galleryOf(n);
            const thumb = n.image || gallery[0];
            return (
              <div key={n.id} className="anim-in" style={{ animationDelay: (i * 30) + "ms" }}>
                <div className={"row" + (isEditing ? " row-editing" : "")}>
                  <div className="row-thumb">
                    {thumb ? <img src={thumb} alt="" /> : <Icon name="newspaper" size={20} />}
                  </div>

                  <div className="row-body">
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="chip chip-teal">{pick(n.category)}</span>
                      {isEditing && <span className="chip chip-gold">در حال ویرایش</span>}
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
                    <EditBtn onClick={function() { if (isEditing) cancel(); else edit(n); }} />
                    <button type="button" onClick={function() { clone(n); }} className="act-btn" title="کپی" aria-label="کپی خبر" style={{ background: "#F1F3F6", borderColor: "#D1D5DB", color: "#4B5160" }}>
                      +
                    </button>
                    <DeleteBtn onClick={function() { remove(n.id); }} />
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

function NewsForm({ news, update, onSave, onCancel, busy }) {
  const [lang, setLang] = useState("fa");
  const currentDir = languageDir(lang);
  const currentLabel = ADMIN_LANGUAGES.find(function(item) { return item.code === lang; })?.label || "فارسی";
  const gallery = galleryOf(news);
  const filled = {};
  ADMIN_LANGUAGES.forEach(function(item) {
    filled[item.code] = Boolean(
      news.title?.[item.code] || news.excerpt?.[item.code] || news.content?.[item.code]
    );
  });

  function upd(field, val) {
    const newField = Object.assign({}, news[field]);
    newField[lang] = val;
    const patch = {};
    patch[field] = newField;
    update(news.id, patch);
  }

  return (
    <div>
      <FormSection
        title="متن خبر"
        description="عنوان، خلاصه و متن کامل را برای هر زبان جداگانه وارد کنید."
      >
        <LocaleTabs lang={lang} onChange={setLang} filled={filled} />

        <FormGrid>
          <Field label="عنوان خبر" required>
            <input type="text" dir={currentDir} value={news.title?.[lang] || ""}
              onChange={function(e) { upd("title", e.target.value); }} className="form-input"
              placeholder="عنوان کوتاه و گویا" />
          </Field>

          <Field label="دسته‌بندی">
            <input type="text" dir={currentDir} value={news.category?.[lang] || ""}
              onChange={function(e) { upd("category", e.target.value); }} className="form-input"
              placeholder="مثلاً اخبار شرکت" />
          </Field>

          <Field label="خلاصه خبر" wide>
            <textarea rows={2} dir={currentDir} value={news.excerpt?.[lang] || ""}
              onChange={function(e) { upd("excerpt", e.target.value); }} className="form-input"
              placeholder="خلاصه‌ای که در فهرست اخبار نمایش داده می‌شود" />
          </Field>

          <Field
            label={"متن کامل خبر · " + currentLabel}
            wide
            hint={"هر خط خالی، پاراگراف جدید می‌سازد. متن به‌صورت امن و بدون HTML نمایش داده می‌شود. · " + (news.content?.[lang] || "").length.toLocaleString("fa-IR") + " کاراکتر"}
          >
            <textarea
              rows={9}
              dir={currentDir}
              value={news.content?.[lang] || ""}
              onChange={function(e) { upd("content", e.target.value); }}
              className="form-input"
              placeholder="متن خبر را در یک یا چند پاراگراف بنویسید."
              style={{ lineHeight: 2, minHeight: 190 }}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="نشانی و تصویر کاور"
        description="نامک در آدرس صفحه خبر استفاده می‌شود؛ تصویر کاور در فهرست و بالای خبر دیده می‌شود."
      >
        <FormGrid>
          <Field label="نامک (slug)" hint={"آدرس صفحه: /fa/news/" + (news.slug || "…")}>
            <input type="text" dir="ltr" value={news.slug || ""}
              onChange={function(e) { update(news.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }); }}
              className="form-input" placeholder="company-news-title" />
          </Field>

          <Field label="تاریخ">
            <input type="text" dir="auto" value={news.date || ""}
              onChange={function(e) { update(news.id, { date: e.target.value }); }}
              className="form-input" />
          </Field>

          <Field as="div" label="تصویر کاور خبر" wide>
            <UploadDropzone
              type="images"
              guidelineKey="newsImage"
              value={news.image || ""}
              onChange={function(url) { update(news.id, { image: url }); }}
              label=""
              accept="image/*"
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="گالری تصاویر خبر"
        description="تصاویر بیشتر خبر را اضافه کنید و یکی را به‌عنوان کاور انتخاب کنید."
      >
        <GalleryUploader
          images={gallery}
          cover={news.image || ""}
          onChange={function(next) { update(news.id, { gallery: next }); }}
          onCoverChange={function(url) { update(news.id, { image: url }); }}
        />
      </FormSection>

      <div className="save-bar">
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
