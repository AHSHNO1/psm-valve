"use client";
import { useMemo, useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

const SECTION_LABELS = {
  common: "متن‌های عمومی",
  nav: "منوی سایت",
  hero: "بخش آغازین",
  products: "محصولات",
  services: "خدمات",
  contact: "تماس",
  footer: "پاورقی",
  sizing: "ابزار سایزینگ",
  about: "درباره ما",
  faq: "سوالات متداول",
  guide: "راهنمای تماس",
  cta: "دعوت به اقدام",
  stats: "آمار",
  exploded: "نمای انفجاری",
  media: "رسانه",
  search: "جستجو",
  unitsPage: "صفحه دپارتمان‌ها"
};

function flattenStrings(value, parts = [], result = []) {
  if (typeof value === "string") {
    result.push({ path: parts.join("."), value });
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenStrings(item, [...parts, String(index)], result));
    return result;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => flattenStrings(child, [...parts, key], result));
  }
  return result;
}

function updateAtPath(source, path, value) {
  const clone = JSON.parse(JSON.stringify(source));
  const parts = path.split(".");
  let current = clone;
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]];
  current[parts[parts.length - 1]] = value;
  return clone;
}

function formatPath(path) {
  return path.split(".").map((part) =>
    /^\d+$/.test(part)
      ? `ردیف ${Number(part) + 1}`
      : SECTION_LABELS[part] || part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ")
  ).join(" / ");
}

function isLongText(path, value) {
  return value.length > 120 || /desc|subtitle|message|placeholder|label/i.test(path);
}

export default function TranslationsClient({ initial }) {
  const [translations, setTranslations] = useState(initial || {});
  const [lang, setLang] = useState("fa");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const current = translations[lang] || {};

  const fields = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return flattenStrings(current).filter((field) => !normalizedQuery ||
      formatPath(field.path).toLocaleLowerCase().includes(normalizedQuery) ||
      field.value.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [current, query]);

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3500);
  }

  function updateValue(path, value) {
    setTranslations((previous) => ({
      ...previous,
      [lang]: updateAtPath(previous[lang], path, value)
    }));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ذخیرهٔ ترجمه‌ها ناموفق بود");
      setTranslations(data.translations);
      notify("ترجمه‌ها ذخیره شدند؛ برای مشاهده در سایت، صفحه را دوباره بارگذاری کنید");
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
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #3674C8, #23519A)" }}>
            <Icon name="globe" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">ترجمه‌های سایت</div>
            <div className="page-header-sub">ویرایش متن‌های ثابت رابط سایت؛ ترجمه‌ها پس از ذخیره در صفحات و اطلاعات متا استفاده می‌شوند</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")} role="status">
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      <div className="tabs anim-in" role="group" aria-label="زبان ترجمه">
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
        <label className="form-label" htmlFor="translation-search">جستجو در کلیدها و متن ترجمه</label>
        <input
          id="translation-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="form-input"
          placeholder="عبارت یا نام بخش..."
        />
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="empty" role="status">
          <div className="empty-title">ترجمه‌ای مطابق جستجو پیدا نشد</div>
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
              {formatPath(section)} <span style={{ color: "#7A8290", fontWeight: 600 }}>({sectionFields.length})</span>
            </h2>
            {sectionFields.map((field) => (
              <div key={field.path} style={{ marginBottom: 14 }}>
                <label className="form-label" htmlFor={"translation-" + field.path}>{formatPath(field.path)}</label>
                {isLongText(field.path, field.value) ? (
                  <textarea
                    id={"translation-" + field.path}
                    rows={4}
                    value={field.value}
                    onChange={(event) => updateValue(field.path, event.target.value)}
                    className="form-input"
                  />
                ) : (
                  <input
                    id={"translation-" + field.path}
                    type="text"
                    value={field.value}
                    onChange={(event) => updateValue(field.path, event.target.value)}
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
