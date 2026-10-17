"use client";
import { useMemo, useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";
import UploadDropzone from "./UploadDropzone";
import ContentStudioNav from "./ContentStudioNav";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

const FIELD_LABELS = {
  home: "صفحه اصلی",
  hero: "بخش آغازین سایت",
  cta: "فراخوان تماس",
  certificates: "گواهی‌نامه‌ها",
  ceo: "مدیرعامل",
  companyHistory: "تاریخچه شرکت",
  process: "فرایند کاری",
  whyUs: "مزیت‌های ما",
  faq: "سوالات متداول",
  contactGuide: "راهنمای صفحه تماس",
  aboutStats: "آمار صفحه درباره ما",
  processPage: "صفحه فرآیند",
  whyUsPage: "صفحه مزیت‌ها",
  partnersPage: "صفحه همراهان",
  units: "دپارتمان‌ها",
  projects: "پروژه‌ها",
  badge: "نشان",
  title: "عنوان",
  title1: "عنوان اول",
  title2: "عنوان دوم",
  title3: "عنوان سوم",
  subtitle: "زیرعنوان",
  desc: "توضیحات",
  bio: "معرفی",
  message: "پیام",
  name: "نام",
  role: "سمت",
  button: "متن دکمه",
  steps: "مراحل",
  features: "ویژگی‌ها",
  photo: "تصویر",
  image: "تصویر",
  foundedYear: "سال آغاز فعالیت",
  departments: "تعداد دپارتمان",
  coating: "توانمندی پوشش‌دهی",
  classification: "رده دانش‌بنیان"
};

function isLocalized(value) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    LANGS.some((language) => Object.prototype.hasOwnProperty.call(value, language.code)) &&
    Object.keys(value).every((key) => LANGS.some((language) => language.code === key)) &&
    Object.values(value).every((item) => typeof item === "string" || Array.isArray(item));
}

function isImageField(parts) {
  const fieldName = parts.filter((part) => !LANGS.some((language) => language.code === part)).pop();
  return /^(photo|image)$/i.test(fieldName || "");
}

function collectFields(value, locale, parts = [], result = [], shared = true) {
  if (typeof value === "string") {
    const path = parts.join(".");
    if (!/(^|\.)(url|slug|num|code|color|id)$/i.test(path)) {
      result.push({ path, value, shared, image: isImageField(parts) });
    }
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFields(item, locale, [...parts, String(index)], result, shared));
    return result;
  }
  if (!value || typeof value !== "object") return result;

  if (isLocalized(value)) {
    if (typeof value[locale] === "string") {
      result.push({
        path: [...parts, locale].join("."),
        value: value[locale],
        shared: false,
        image: isImageField(parts)
      });
    } else if (Array.isArray(value[locale])) {
      value[locale].forEach((item, index) =>
        collectFields(item, locale, [...parts, locale, String(index)], result, false)
      );
    }

    return result;
  }
  Object.entries(value).forEach(([key, child]) => collectFields(child, locale, [...parts, key], result, shared));
  return result;
}

function getLabel(path) {
  return path.split(".").filter((part) => !LANGS.some((language) => language.code === part)).map((part) => {
    if (/^\d+$/.test(part)) return `ردیف ${Number(part) + 1}`;
    return FIELD_LABELS[part] || part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  }).join(" / ");
}

function updateAtPath(source, path, value) {
  const clone = JSON.parse(JSON.stringify(source));
  const parts = path.split(".");
  let current = clone;
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]];
  current[parts[parts.length - 1]] = value;
  return clone;
}

function isLongText(path, value) {
  return value.length > 120 || /desc|subtitle|bio|message/i.test(path);
}

export default function ContentClient({ initial }) {
  const [content, setContent] = useState(initial || {});
  const [lang, setLang] = useState("fa");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fields = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return collectFields(content, lang).filter((field) => {
      if (field.shared && lang !== "fa") return false;
      return !normalizedQuery ||
        getLabel(field.path).toLocaleLowerCase().includes(normalizedQuery) ||
        field.value.toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [content, lang, query]);

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3500);
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ذخیرهٔ محتوای سایت ناموفق بود");
      setContent(data.content);
      notify("محتوای سایت ذخیره شد");
    } catch (error) {
      notify(error.message || "ارتباط با سرور برقرار نشد؛ تغییرات ذخیره نشد", true);
    } finally {
      setBusy(false);
    }
  }

  const groups = fields.reduce((result, field) => {
    const section = field.path.split(".")[0] || "سایر";
    if (!result[section]) result[section] = [];
    result[section].push(field);
    return result;
  }, {});

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #8764B8, #6B4C9C)" }}>
            <Icon name="file" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">متن‌ها و تصاویر سایت</div>
            <div className="page-header-sub">متن‌ها و عکس‌های بخش‌های مختلف سایت را در چهار زبان جستجو و ویرایش کنید</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")} role="status">
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      <div className="tabs anim-in" role="group" aria-label="زبان محتوا">
        {LANGS.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => setLang(language.code)}
            aria-pressed={lang === language.code}
            className={"tab" + (lang === language.code ? " tab-active" : "")}
          >
            {language.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="form-label" htmlFor="content-search">جستجو در متن‌ها و مسیر بخش‌ها</label>
        <input
          id="content-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="form-input"
          placeholder="مثلاً مدیرعامل، فرایند یا توضیحات..."
        />
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="empty" role="status">
          <div className="empty-title">متنی مطابق جستجو پیدا نشد</div>
        </div>
      ) : (
        Object.entries(groups).map(([section, sectionFields]) => (
          <section
            key={section}
            aria-label={section}
            className="anim-in"
            style={{ background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: 12, padding: 16, marginBottom: 14 }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 900, margin: "0 0 14px", color: "#1A1D21" }}>
              {FIELD_LABELS[section] || section} <span style={{ color: "#7A8290", fontWeight: 600 }}>({sectionFields.length})</span>
            </h2>
            {sectionFields.map((field) => (
              <div key={field.path} style={{ marginBottom: 14 }}>
                {!field.image && (
                  <label className="form-label" htmlFor={"content-" + field.path}>
                    {getLabel(field.path)}
                    {field.shared && <span style={{ marginInlineStart: 6, color: "#7A8290" }}>· مشترک</span>}
                  </label>
                )}
                {field.image ? (
                  <div className="content-image-field">
                    <UploadDropzone
                      type="images"
                      guidelineKey={field.path.startsWith("hero.") ? "heroImage" : "galleryImage"}
                      value={field.value}
                      onChange={(value) => setContent((current) => updateAtPath(current, field.path, value))}
                      label={getLabel(field.path)}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    />
                  </div>
                ) : isLongText(field.path, field.value) ? (
                  <textarea
                    id={"content-" + field.path}
                    rows={4}
                    value={field.value}
                    onChange={(event) => setContent((current) => updateAtPath(current, field.path, event.target.value))}
                    className="form-input"
                  />
                ) : (
                  <input
                    id={"content-" + field.path}
                    type="text"
                    value={field.value}
                    onChange={(event) => setContent((current) => updateAtPath(current, field.path, event.target.value))}
                    className="form-input"
                  />
                )}
              </div>
            ))}
          </section>
        ))
      )}

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </div>
  );
}
