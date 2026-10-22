"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Layout, Save } from "lucide-react";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { FormSection, FormGrid, Field, LocaleTabs, ADMIN_LANGUAGES } from "./EditorPanel";
import { useUnsavedChanges, isDirty } from "./useUnsavedChanges";

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

const LONG_TEXT_FIELDS = /footer\.(desc|rights|knowledgeType|designCredit|hoursValue)/i;

function normalizeSettings(value) {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    header: { ...DEFAULT_SETTINGS.header, ...value?.header },
    footer: { ...DEFAULT_SETTINGS.footer, ...value?.footer }
  };
}

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
  const [savedTranslations, setSavedTranslations] = useState(initialTranslations);
  const [settings, setSettings] = useState(() => normalizeSettings(initialSettings));
  const [savedSettings, setSavedSettings] = useState(() => normalizeSettings(initialSettings));
  const [language, setLanguage] = useState("fa");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const currentLanguage = ADMIN_LANGUAGES.find((item) => item.code === language) || ADMIN_LANGUAGES[0];
  const dirty = isDirty(translations, savedTranslations) || isDirty(settings, savedSettings);
  useUnsavedChanges(dirty);

  const languageFilled = {};
  ADMIN_LANGUAGES.forEach(function (item) {
    languageFilled[item.code] = Object.keys(translations?.[item.code] || {}).length > 0;
  });

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
      setSavedTranslations(result.translations);
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
      const nextSettings = normalizeSettings(result.settings);
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
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
        {dirty && <span className="chip chip-gold">تغییرات ذخیره‌نشده</span>}
      </div>

      {message && (
        <div className="msg anim-in" role="status" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
          <Check size={16} /> {message}
        </div>
      )}

      <EditorPanel
        title="پیش‌نمایش چیدمان"
        subtitle="نمای ساده از ترتیب و نمایش اجزای هدر و فوتر."
        icon={<Eye size={17} />}
      >
        <div style={{ border: "1px solid #D1D5DB", borderRadius: 12, overflow: "hidden", background: "#F8FAFC" }}>
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
      </EditorPanel>

      <EditorPanel
        title="چیدمان و اجزای قابل‌نمایش"
        subtitle="ارتفاع هدر، منوی اصلی و بخش‌های فوتر را تنظیم کنید."
        icon={<Layout size={17} />}
      >
        <div className="site-chrome-columns">
          <FormSection title="هدر" description="ساختار و اجزای نوار بالای سایت.">
            <FormGrid>
              <Field label="ارتفاع هدر">
                <select value={settings.header.layout} onChange={(event) => updateSettings("header", "layout", event.target.value)} className="form-input">
                  <option value="standard">استاندارد</option>
                  <option value="compact">فشرده</option>
                </select>
              </Field>
              <Field label="تراز منوی اصلی">
                <select value={settings.header.navAlignment} onChange={(event) => updateSettings("header", "navAlignment", event.target.value)} className="form-input">
                  <option value="center">وسط</option>
                  <option value="start">ابتدای نوار</option>
                </select>
              </Field>
            </FormGrid>
            <div className="site-chrome-toggles">
              <Toggle label="نمایش شعار کنار لوگو" checked={settings.header.showTagline} onChange={(value) => updateSettings("header", "showTagline", value)} />
              <Toggle label="نمایش جستجو" checked={settings.header.showSearch} onChange={(value) => updateSettings("header", "showSearch", value)} />
              <Toggle label="نمایش تغییر پوسته" checked={settings.header.showTheme} onChange={(value) => updateSettings("header", "showTheme", value)} />
              <Toggle label="نمایش انتخاب زبان" checked={settings.header.showLocale} onChange={(value) => updateSettings("header", "showLocale", value)} />
            </div>
            <div className="site-chrome-subtitle">نمایش لینک‌های منو</div>
            <div className="site-chrome-toggles">
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
          </FormSection>

          <FormSection title="فوتر" description="الگوی چیدمان و بخش‌های پایین سایت.">
            <FormGrid>
              <Field label="الگوی چیدمان">
                <select value={settings.footer.layout} onChange={(event) => updateSettings("footer", "layout", event.target.value)} className="form-input">
                  <option value="balanced">چهارستونه متعادل</option>
                  <option value="brand-focus">تأکید بر معرفی شرکت</option>
                  <option value="compact">فشرده</option>
                </select>
              </Field>
            </FormGrid>
            <div className="site-chrome-toggles">
              <Toggle label="معرفی شرکت" checked={settings.footer.showBrand} onChange={(value) => updateSettings("footer", "showBrand", value)} />
              <Toggle label="دسترسی سریع" checked={settings.footer.showLinks} onChange={(value) => updateSettings("footer", "showLinks", value)} />
              <Toggle label="اطلاعات تماس" checked={settings.footer.showContact} onChange={(value) => updateSettings("footer", "showContact", value)} />
              <Toggle label="شبکه‌های اجتماعی" checked={settings.footer.showSocial} onChange={(value) => updateSettings("footer", "showSocial", value)} />
              <Toggle label="نوار حقوق و اعتبار" checked={settings.footer.showBottom} onChange={(value) => updateSettings("footer", "showBottom", value)} />
            </div>
          </FormSection>
        </div>

        <FormSection
          title="دسته‌بندی‌های منوی محصولات"
          description="عنوان هر دسته در زبان فعال را تغییر دهید، ترتیب نمایش را جابه‌جا کنید یا آن را از منوی هدر مخفی کنید."
        >
          <LocaleTabs lang={language} onChange={setLanguage} filled={languageFilled} hint="" />
          <div className="site-chrome-categories">
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
                <div key={categoryId} className="site-chrome-category">
                  <div className="site-chrome-order">
                    <button type="button" disabled={index === 0} onClick={() => moveCategory(categoryId, -1)}
                      className="site-chrome-order-btn" aria-label="انتقال دسته به بالا">
                      <ChevronUp size={15} />
                    </button>
                    <button type="button" disabled={index === settings.header.categoryOrder.length - 1}
                      onClick={() => moveCategory(categoryId, 1)}
                      className="site-chrome-order-btn" aria-label="انتقال دسته به پایین">
                      <ChevronDown size={15} />
                    </button>
                  </div>
                  <input type="text" value={categoryLabel} dir={currentLanguage.dir}
                    onChange={(event) => updateCategoryName(categoryId, event.target.value)}
                    className="form-input site-chrome-category-input" aria-label={`نام دسته ${category.name.fa}`} />
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
            {settings.header.categoryOrder.length === 0 && (
              <p className="text-soft" style={{ fontSize: 12, margin: 0 }}>دسته‌بندی محصولی برای نمایش در منو وجود ندارد.</p>
            )}
          </div>
        </FormSection>

        <div className="save-bar">
          <button className="btn-add" type="button" disabled={Boolean(busy)} onClick={saveLayout}>
            <Save size={16} /> {busy === "layout" ? "در حال ذخیره..." : "ذخیرهٔ چیدمان"}
          </button>
        </div>
      </EditorPanel>

      <EditorPanel
        title="متن‌های هدر و فوتر"
        subtitle="برای هر زبان، متن همان زبان را وارد کنید."
        icon={<Layout size={17} />}
      >
        <LocaleTabs lang={language} onChange={setLanguage} filled={languageFilled} hint="زبان موردنظر را انتخاب کنید." />
        {["header", "footer"].map((section) => (
          <FormSection key={section} title={section === "header" ? "متن‌های هدر" : "متن‌های فوتر"}>
            <FormGrid>
              {TEXT_FIELDS[section].map(([path, label]) => {
                const value = readPath(translations[language], path);
                const isLong = LONG_TEXT_FIELDS.test(path);
                return (
                  <Field key={path} label={label} wide={isLong}>
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
                  </Field>
                );
              })}
            </FormGrid>
          </FormSection>
        ))}
        <div className="save-bar">
          <button className="btn-add" type="button" disabled={Boolean(busy)} onClick={saveTexts}>
            <Save size={16} /> {busy === "texts" ? "در حال ذخیره..." : "ذخیرهٔ متن‌ها"}
          </button>
        </div>
      </EditorPanel>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="site-chrome-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
