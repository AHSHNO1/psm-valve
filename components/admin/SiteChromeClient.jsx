"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Layout, Save } from "lucide-react";
import ContentStudioNav from "./ContentStudioNav";

const LANGUAGES = [
  { id: "fa", label: "فارسی", dir: "rtl" },
  { id: "en", label: "English", dir: "ltr" },
  { id: "ar", label: "العربية", dir: "rtl" },
  { id: "ru", label: "Русский", dir: "ltr" }
];

const TEXT_FIELDS = {
  header: [
    ["common.company", "نام شرکت"],
    ["common.tagline", "شعار کوتاه"],
    ["nav.home", "خانه"],
    ["nav.about", "درباره ما"],
    ["nav.sizing", "سایزینگ"],
    ["nav.products", "محصولات"],
    ["nav.services", "خدمات"],
    ["nav.partners", "همراهان"],
    ["nav.media", "رسانه"],
    ["nav.contact", "تماس"],
    ["nav.allProducts", "لینک همه محصولات"]
  ],
  footer: [
    ["footer.desc", "معرفی کوتاه شرکت"],
    ["footer.quickLinks", "عنوان دسترسی سریع"],
    ["footer.contact", "عنوان اطلاعات تماس"],
    ["footer.rights", "متن حقوق نشر"],
    ["footer.phone", "عنوان تلفن"],
    ["footer.mobile", "عنوان همراه"],
    ["footer.fax", "عنوان فکس"],
    ["footer.email", "عنوان ایمیل"],
    ["footer.hours", "عنوان ساعات کاری"],
    ["footer.hoursValue", "ساعات کاری"],
    ["footer.hoursClosed", "روز تعطیل"],
    ["footer.postal", "عنوان کدپستی"],
    ["footer.socialIntl", "عنوان شبکه‌های بین‌المللی"],
    ["footer.socialIran", "عنوان پیام‌رسان‌های ایرانی"],
    ["footer.socialTitle", "عنوان شبکه‌های اجتماعی"],
    ["footer.knowledge", "نشان دانش‌بنیان"],
    ["footer.knowledgeType", "نوع دانش‌بنیان"],
    ["footer.designCredit", "متن اعتبار طراحی"],
    ["footer.itDepartment", "نام واحد فناوری اطلاعات"],
    ["footer.itEmail", "ایمیل واحد فناوری اطلاعات"]
  ]
};

const NAV_ITEMS = [
  ["home", "خانه"],
  ["about", "درباره ما"],
  ["sizing", "سایزینگ"],
  ["products", "محصولات"],
  ["services", "خدمات"],
  ["partners", "همراهان"],
  ["media", "رسانه"],
  ["contact", "تماس"]
];

const DEFAULT_SETTINGS = {
  header: {
    layout: "standard",
    navAlignment: "center",
    showTagline: true,
    showSearch: true,
    showTheme: true,
    showLocale: true,
    hiddenNavItems: [],
    categoryOrder: [],
    hiddenCategoryIds: [],
    categoryNames: {}
  },
  footer: {
    layout: "balanced",
    showBrand: true,
    showLinks: true,
    showContact: true,
    showSocial: true,
    showBottom: true
  }
};

function readPath(source, path) {
  return path.split(".").reduce((value, part) => value?.[part], source) || "";
}

function updatePath(source, path, value) {
  const clone = structuredClone(source);
  const parts = path.split(".");
  let current = clone;
  for (const part of parts.slice(0, -1)) current = current[part];
  current[parts[parts.length - 1]] = value;
  return clone;
}

export default function SiteChromeClient({ initialTranslations, initialSettings, categories = [] }) {
  const headerCategories = categories.filter((category) => !category.parentId);
  const [translations, setTranslations] = useState(initialTranslations);
  const [settings, setSettings] = useState({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
    header: { ...DEFAULT_SETTINGS.header, ...initialSettings?.header },
    footer: { ...DEFAULT_SETTINGS.footer, ...initialSettings?.footer }
  });
  const [language, setLanguage] = useState("fa");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const currentLanguage = LANGUAGES.find((item) => item.id === language) || LANGUAGES[0];

  function updateText(path, value) {
    setTranslations((previous) => ({
      ...previous,
      [language]: updatePath(previous[language], path, value)
    }));
  }

  function updateSettings(section, key, value) {
    setSettings((previous) => ({
      ...previous,
      [section]: { ...previous[section], [key]: value }
    }));
  }

  function updateCategoryName(categoryId, value) {
    updateSettings("header", "categoryNames", {
      ...settings.header.categoryNames,
      [categoryId]: {
        ...settings.header.categoryNames[categoryId],
        [language]: value
      }
    });
  }

  function moveCategory(categoryId, direction) {
    const order = [...settings.header.categoryOrder];
    const index = order.indexOf(categoryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    updateSettings("header", "categoryOrder", order);
  }

  async function saveTexts() {
    setBusy("texts");
    setMessage("");
    try {
      const response = await fetch("/api/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "ذخیرهٔ متن‌ها ناموفق بود");
      setTranslations(result.translations);
      setMessage("متن‌های هدر و فوتر ذخیره شد.");
    } catch (error) {
      setMessage(error.message || "ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy("");
    }
  }

  async function saveLayout() {
    setBusy("layout");
    setMessage("");
    try {
      const response = await fetch("/api/site-chrome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "ذخیرهٔ چیدمان ناموفق بود");
      setSettings(result.settings);
      setMessage("چیدمان هدر و فوتر ذخیره شد.");
    } catch (error) {
      setMessage(error.message || "ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <ContentStudioNav />
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
            <Layout size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">طراحی هدر و فوتر</div>
            <div className="page-header-sub">متن‌های چندزبانه، نمایش اجزا و چیدمان بخش‌های ثابت سایت را مدیریت کنید.</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="msg anim-in" role="status" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
          <Check size={16} /> {message}
        </div>
      )}

      <section className="anim-in" style={panelStyle}>
        <SectionTitle icon={<Eye size={17} />} title="پیش‌نمایش چیدمان" />
        <div style={{
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          overflow: "hidden",
          background: "#F8FAFC"
        }}>
          <div style={{
            minHeight: settings.header.layout === "compact" ? 46 : 60,
            display: "flex",
            alignItems: "center",
            justifyContent: settings.header.navAlignment === "center" ? "space-between" : "flex-start",
            gap: 18,
            padding: "10px 16px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            color: "#1A1D21"
          }}>
            <strong>{readPath(translations[language], "common.company")}</strong>
            {settings.header.showTagline && <small style={{ color: "#B8850A" }}>{readPath(translations[language], "common.tagline")}</small>}
            <span style={{ marginInlineStart: "auto", fontSize: 12, color: "#64748B" }}>
              {NAV_ITEMS.filter(([id]) => !settings.header.hiddenNavItems.includes(id))
                .map(([id]) => readPath(translations[language], "nav." + id)).join(" · ")}
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: settings.footer.layout === "brand-focus"
              ? "1.6fr repeat(3, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
            gap: settings.footer.layout === "compact" ? 6 : 12,
            padding: settings.footer.layout === "compact" ? 10 : 16,
            color: "#475569",
            fontSize: 11
          }}>
            {[
              ["showBrand", readPath(translations[language], "footer.desc")],
              ["showLinks", readPath(translations[language], "footer.quickLinks")],
              ["showContact", readPath(translations[language], "footer.contact")],
              ["showSocial", readPath(translations[language], "footer.socialTitle")]
            ].filter(([key]) => settings.footer[key]).map(([key, text]) => (
              <div key={key} style={{ minHeight: 48, padding: 10, borderRadius: 8, background: "#FFFFFF", border: "1px solid #E2E8F0" }}>{text}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="anim-in" style={panelStyle}>
        <SectionTitle title="چیدمان و اجزای قابل‌نمایش" />
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 style={subTitleStyle}>هدر</h3>
            <SelectField
              label="ارتفاع هدر"
              value={settings.header.layout}
              options={[["standard", "استاندارد"], ["compact", "فشرده"]]}
              onChange={(value) => updateSettings("header", "layout", value)}
            />
            <SelectField
              label="تراز منوی اصلی"
              value={settings.header.navAlignment}
              options={[["center", "وسط"], ["start", "ابتدای نوار"]]}
              onChange={(value) => updateSettings("header", "navAlignment", value)}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Toggle label="نمایش شعار کنار لوگو" checked={settings.header.showTagline} onChange={(value) => updateSettings("header", "showTagline", value)} />
              <Toggle label="نمایش جستجو" checked={settings.header.showSearch} onChange={(value) => updateSettings("header", "showSearch", value)} />
              <Toggle label="نمایش تغییر پوسته" checked={settings.header.showTheme} onChange={(value) => updateSettings("header", "showTheme", value)} />
              <Toggle label="نمایش انتخاب زبان" checked={settings.header.showLocale} onChange={(value) => updateSettings("header", "showLocale", value)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={subTitleStyle}>نمایش لینک‌های منو</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {NAV_ITEMS.map(([id, label]) => (
                  <Toggle
                    key={id}
                    label={label}
                    checked={!settings.header.hiddenNavItems.includes(id)}
                    onChange={(checked) => updateSettings(
                      "header",
                      "hiddenNavItems",
                      checked
                        ? settings.header.hiddenNavItems.filter((item) => item !== id)
                        : [...settings.header.hiddenNavItems, id]
                    )}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={subTitleStyle}>دسته‌بندی‌های منوی محصولات</div>
              <p className="text-xs mb-3" style={{ color: "#64748B" }}>
                عنوان هر دسته در زبان فعال را تغییر دهید، ترتیب نمایش را جابه‌جا کنید یا آن را از منوی هدر مخفی کنید.
              </p>
              <div className="tabs mb-3" role="group" aria-label="زبان نام دسته‌بندی">
                {LANGUAGES.map((item) => (
                  <button key={item.id} type="button" onClick={() => setLanguage(item.id)}
                    className={"tab" + (language === item.id ? " tab-active" : "")}
                    aria-pressed={language === item.id}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {settings.header.categoryOrder.map((categoryId, index) => {
                  const category = headerCategories.find((item) => item.id === categoryId);
                  if (!category) return null;
                  const hidden = settings.header.hiddenCategoryIds.includes(categoryId);
                  const categoryLabel =
                    settings.header.categoryNames[categoryId]?.[language] ||
                    category.name[language] ||
                    category.name.en ||
                    category.name.fa;
                  return (
                    <div key={categoryId} className="flex flex-wrap items-center gap-2 rounded-lg p-2"
                      style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveCategory(categoryId, -1)}
                          className="grid h-8 w-8 place-items-center rounded border disabled:opacity-40"
                          style={{ borderColor: "#CBD5E1", color: "#475569" }} aria-label="انتقال دسته به بالا">
                          <ChevronUp size={15} />
                        </button>
                        <button type="button" disabled={index === settings.header.categoryOrder.length - 1}
                          onClick={() => moveCategory(categoryId, 1)}
                          className="grid h-8 w-8 place-items-center rounded border disabled:opacity-40"
                          style={{ borderColor: "#CBD5E1", color: "#475569" }} aria-label="انتقال دسته به پایین">
                          <ChevronDown size={15} />
                        </button>
                      </div>
                      <input type="text" value={categoryLabel} dir={currentLanguage.dir}
                        onChange={(event) => updateCategoryName(categoryId, event.target.value)}
                        className="form-input min-w-[180px] flex-1" aria-label={`نام دسته ${category.name.fa}`} />
                      <Toggle
                        label={hidden ? "مخفی" : "نمایش"}
                        checked={!hidden}
                        onChange={(visible) => updateSettings(
                          "header",
                          "hiddenCategoryIds",
                          visible
                            ? settings.header.hiddenCategoryIds.filter((id) => id !== categoryId)
                            : [...settings.header.hiddenCategoryIds, categoryId]
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 style={subTitleStyle}>فوتر</h3>
            <SelectField
              label="الگوی چیدمان"
              value={settings.footer.layout}
              options={[
                ["balanced", "چهارستونه متعادل"],
                ["brand-focus", "تأکید بر معرفی شرکت"],
                ["compact", "فشرده"]
              ]}
              onChange={(value) => updateSettings("footer", "layout", value)}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Toggle label="معرفی شرکت" checked={settings.footer.showBrand} onChange={(value) => updateSettings("footer", "showBrand", value)} />
              <Toggle label="دسترسی سریع" checked={settings.footer.showLinks} onChange={(value) => updateSettings("footer", "showLinks", value)} />
              <Toggle label="اطلاعات تماس" checked={settings.footer.showContact} onChange={(value) => updateSettings("footer", "showContact", value)} />
              <Toggle label="شبکه‌های اجتماعی" checked={settings.footer.showSocial} onChange={(value) => updateSettings("footer", "showSocial", value)} />
              <Toggle label="نوار حقوق و اعتبار" checked={settings.footer.showBottom} onChange={(value) => updateSettings("footer", "showBottom", value)} />
            </div>
          </div>
        </div>
        <div className="save-bar">
          <button className="btn-add" type="button" disabled={Boolean(busy)} onClick={saveLayout}>
            <Save size={16} /> {busy === "layout" ? "در حال ذخیره..." : "ذخیرهٔ چیدمان"}
          </button>
        </div>
      </section>

      <section className="anim-in" style={panelStyle}>
        <SectionTitle title="متن‌های هدر و فوتر" />
        <div className="tabs" role="group" aria-label="زبان متن">
          {LANGUAGES.map((item) => (
            <button key={item.id} type="button" onClick={() => setLanguage(item.id)}
              className={"tab" + (language === item.id ? " tab-active" : "")} aria-pressed={language === item.id}>
              {item.label}
            </button>
          ))}
        </div>
        {["header", "footer"].map((section) => (
          <div key={section} className="grid md:grid-cols-2 gap-x-5">
            {TEXT_FIELDS[section].map(([path, label]) => {
              const value = readPath(translations[language], path);
              const isLong = value.length > 120;
              return (
                <label key={path} className="block mb-4">
                  <span className="form-label">{label} · {section === "header" ? "هدر" : "فوتر"}</span>
                  {isLong ? (
                    <textarea
                      rows={3}
                      value={value}
                      dir={currentLanguage.dir}
                      onChange={(event) => updateText(path, event.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      dir={currentLanguage.dir}
                      onChange={(event) => updateText(path, event.target.value)}
                      className="form-input"
                    />
                  )}
                </label>
              );
            })}
          </div>
        ))}
        <div className="save-bar">
          <button className="btn-add" type="button" disabled={Boolean(busy)} onClick={saveTexts}>
            <Save size={16} /> {busy === "texts" ? "در حال ذخیره..." : "ذخیرهٔ متن‌ها"}
          </button>
        </div>
      </section>
    </div>
  );
}

const panelStyle = {
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: 14,
  padding: 18,
  marginBottom: 16
};

const subTitleStyle = {
  margin: "0 0 12px",
  color: "#1A1D21",
  fontSize: 13,
  fontWeight: 900
};

function SectionTitle({ icon, title }) {
  return (
    <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px", fontSize: 15, fontWeight: 900, color: "#1A1D21" }}>
      {icon || <Layout size={17} />} {title}
    </h2>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block mb-4">
      <span className="form-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="form-input">
        {options.map(([option, title]) => <option key={option} value={option}>{title}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      minHeight: 40,
      padding: "8px 10px",
      border: "1px solid #E2E8F0",
      borderRadius: 9,
      color: "#334155",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
