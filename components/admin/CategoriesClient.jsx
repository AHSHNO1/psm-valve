"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame, Package, Layers, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, Save, Eye, EyeOff, ExternalLink, X, AlertTriangle,
  Check, Search, Loader2
} from "lucide-react";
import { CATEGORY_ICON_NAMES, CATALOG_LOCALES } from "@/lib/category-utils";

const ICONS = {
  Gauge, Circle, Sun, Square, ArrowRight, Cylinder, Minus,
  ShieldAlert, Snowflake, Flame, Package
};

const LANGS = [
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" }
];

const BLANK_LOCALIZED = CATALOG_LOCALES.reduce((out, locale) => {
  out[locale] = "";
  return out;
}, {});

function localized(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value.fa || value.en || "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function blankCategory(parentId) {
  return {
    id: "",
    name: { ...BLANK_LOCALIZED },
    desc: { ...BLANK_LOCALIZED },
    icon: "Package",
    parentId: parentId || "",
    hidden: false
  };
}

function categoryProducts(products, categories, categoryId) {
  const ids = new Set([categoryId]);
  categories.filter((category) => category.parentId === categoryId)
    .forEach((category) => ids.add(category.id));
  return (products || []).filter((product) => ids.has(product.categoryId));
}

export default function CategoriesClient({ initialCatalog, products = [] }) {
  const [catalog, setCatalog] = useState(initialCatalog || { header: {}, categories: [] });
  const [savedSnapshot, setSavedSnapshot] = useState(function() {
    return JSON.stringify(initialCatalog || {});
  });
  const [lang, setLang] = useState("fa");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(function() {
    const first = (initialCatalog?.categories || []).find((category) => !category.parentId);
    return first ? { [first.id]: true } : {};
  });
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const categories = catalog.categories || [];
  const header = catalog.header || {};
  const dirty = JSON.stringify(catalog) !== savedSnapshot;

  const roots = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const stats = useMemo(() => ({
    roots: roots.length,
    children: categories.length - roots.length,
    products: products.length,
    hidden: categories.filter((category) => category.hidden).length
  }), [categories, products.length, roots.length]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRoots = normalizedQuery
    ? roots.filter((root) => {
      if (localized(root.name).toLowerCase().includes(normalizedQuery)) return true;
      if (root.id.includes(normalizedQuery)) return true;
      return categories.some((child) =>
        child.parentId === root.id &&
        (localized(child.name).toLowerCase().includes(normalizedQuery) || child.id.includes(normalizedQuery))
      );
    })
    : roots;

  useEffect(function() {
    function onBeforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return function() { window.removeEventListener("beforeunload", onBeforeUnload); };
  }, [dirty]);

  useEffect(function() {
    function onKey(event) {
      if (event.key === "Escape") setDraft(null);
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, []);

  function notify(text, type) {
    setMsg({ type: type || "success", text });
    window.setTimeout(function() { setMsg({ type: "", text: "" }); }, 3200);
  }

  function updateHeader(field, value) {
    setCatalog(function(current) {
      const currentHeader = current.header || {};
      const fieldValue = Object.assign({}, currentHeader[field] || BLANK_LOCALIZED);
      fieldValue[lang] = value;
      return {
        ...current,
        header: { ...currentHeader, [field]: fieldValue }
      };
    });
  }

  function openNew(parentId) {
    setDraft({ ...blankCategory(parentId), isNew: true });
  }

  function openEdit(category) {
    setDraft({ ...clone(category), isNew: false });
  }

  function updateDraftName(value) {
    setDraft(function(current) {
      return { ...current, name: { ...current.name, [lang]: value } };
    });
  }

  function updateDraftDesc(value) {
    setDraft(function(current) {
      return { ...current, desc: { ...current.desc, [lang]: value } };
    });
  }

  function commitDraft() {
    if (!draft) return;
    const id = String(draft.id || "").trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      notify("شناسه دسته باید با حروف کوچک انگلیسی، عدد و خط تیره نوشته شود.", "error");
      return;
    }
    if (!draft.name.fa.trim() && !draft.name.en.trim()) {
      notify("نام دسته را وارد کنید.", "error");
      return;
    }
    const duplicate = categories.some((category) => category.id === id && (!draft.isNew ? category.id !== draft.id : true));
    if (duplicate) {
      notify("این شناسه قبلاً برای دسته دیگری استفاده شده است.", "error");
      return;
    }
    const nextCategory = {
      id,
      name: { ...BLANK_LOCALIZED, ...draft.name },
      desc: { ...BLANK_LOCALIZED, ...draft.desc },
      icon: CATEGORY_ICON_NAMES.includes(draft.icon) ? draft.icon : "Package",
      parentId: draft.parentId || "",
      hidden: Boolean(draft.hidden)
    };
    setCatalog(function(current) {
      const list = (current.categories || []).slice();
      if (draft.isNew) {
        list.push(nextCategory);
      } else {
        const index = list.findIndex((category) => category.id === draft.id);
        if (index === -1) list.push(nextCategory);
        else list[index] = nextCategory;
      }
      return { ...current, categories: list };
    });
    setDraft(null);
    notify(draft.isNew ? "دسته به لیست اضافه شد؛ برای ثبت نهایی ذخیره کنید." : "تغییرات دسته اعمال شد؛ برای ثبت نهایی ذخیره کنید.");
  }

  function removeCategory(category) {
    const affected = categoryProducts(products, categories, category.id);
    if (affected.length > 0) {
      notify("این دسته یا زیرمجموعه‌های آن محصول دارند؛ ابتدا محصولات را جابه‌جا کنید.", "error");
      return;
    }
    const children = categories.filter((item) => item.parentId === category.id);
    const message = children.length
      ? `دسته «${localized(category.name)}» و ${children.length} زیرمجموعه آن حذف شوند؟`
      : `دسته «${localized(category.name)}» حذف شود؟`;
    if (!window.confirm(message)) return;
    const ids = new Set([category.id, ...children.map((child) => child.id)]);
    setCatalog(function(current) {
      return {
        ...current,
        categories: current.categories.filter((item) => !ids.has(item.id))
      };
    });
    notify("دسته از لیست حذف شد؛ برای ثبت نهایی ذخیره کنید.");
  }

  function moveCategory(category, direction) {
    setCatalog(function(current) {
      const list = (current.categories || []).slice();
      const siblings = list.filter((item) => item.parentId === category.parentId);
      const index = siblings.findIndex((item) => item.id === category.id);
      const target = siblings[index + direction];
      if (!target) return current;
      const a = list.findIndex((item) => item.id === category.id);
      const b = list.findIndex((item) => item.id === target.id);
      [list[a], list[b]] = [list[b], list[a]];
      return { ...current, categories: list };
    });
  }

  async function saveAll() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, categories })
      });
      const data = await response.json().catch(function() { return {}; });
      if (!response.ok || !data.ok || !data.catalog) {
        notify(data.error || "ذخیره دسته‌بندی‌ها ناموفق بود.", "error");
        return;
      }
      setCatalog(data.catalog);
      setSavedSnapshot(JSON.stringify(data.catalog));
      notify("دسته‌بندی‌ها و هدر صفحه محصولات ذخیره شد.");
    } catch (error) {
      console.error("Unable to save categories:", error);
      notify("خطای شبکه در ذخیره دسته‌بندی‌ها.", "error");
    } finally {
      setBusy(false);
    }
  }

  const headerPreview = {
    badge: localized(header.badge || {}) || "کاتالوگ محصولات",
    title1: localized(header.title1 || {}) || "محصولات",
    title2: localized(header.title2 || {}) || "صنعتی",
    description: localized(header.description || {})
  };

  return (
    <div className="taxonomy-shell">
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
            <Layers size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">دسته‌بندی‌ها و سری محصولات</div>
            <div className="page-header-sub">
              {stats.roots} دسته اصلی · {stats.children} زیرمجموعه · {stats.products} محصول
            </div>
          </div>
        </div>
        <div className="taxonomy-head-actions">
          <Link href="/fa/products" target="_blank" className="btn-cancel">
            <ExternalLink size={14} /> مشاهده صفحه محصولات
          </Link>
          <Link href="/admin/products" className="btn-cancel">
            <Package size={14} /> لیست محصولات
          </Link>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")} role="status">
          {msg.type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
          {msg.text}
        </div>
      )}

      <section className="taxonomy-panel" aria-labelledby="catalog-header-title">
        <div className="taxonomy-panel-head">
          <div>
            <h2 id="catalog-header-title">هدر صفحه محصولات</h2>
            <p>عنوان، برچسب و توضیح بالای صفحه محصولات. هر فیلد خالی باشد، متن پیش‌فرض سایت نمایش داده می‌شود.</p>
          </div>
          <div className="taxonomy-langs">
            {LANGS.map(function(item) {
              return (
                <button key={item.code} type="button" onClick={function() { setLang(item.code); }}
                  className={"taxonomy-lang" + (lang === item.code ? " taxonomy-lang-active" : "")}>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="taxonomy-form-grid">
          <label className="taxonomy-field">
            <span>برچسب بالای عنوان</span>
            <input className="form-input" dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
              value={(header.badge || BLANK_LOCALIZED)[lang] || ""}
              placeholder="کاتالوگ محصولات"
              onChange={function(event) { updateHeader("badge", event.target.value); }} />
          </label>
          <label className="taxonomy-field">
            <span>بخش اول عنوان</span>
            <input className="form-input" dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
              value={(header.title1 || BLANK_LOCALIZED)[lang] || ""}
              placeholder="محصولات"
              onChange={function(event) { updateHeader("title1", event.target.value); }} />
          </label>
          <label className="taxonomy-field">
            <span>بخش دوم عنوان (طلایی)</span>
            <input className="form-input" dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
              value={(header.title2 || BLANK_LOCALIZED)[lang] || ""}
              placeholder="صنعتی"
              onChange={function(event) { updateHeader("title2", event.target.value); }} />
          </label>
          <label className="taxonomy-field taxonomy-field-wide">
            <span>توضیح زیر عنوان</span>
            <textarea className="form-input" rows={3} dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
              value={(header.description || BLANK_LOCALIZED)[lang] || ""}
              placeholder="اختیاری — در صورت خالی بودن، آمار دسته‌ها و محصولات نمایش داده می‌شود."
              onChange={function(event) { updateHeader("description", event.target.value); }} />
          </label>
        </div>

        <div className="taxonomy-preview">
          <span className="taxonomy-preview-label">پیش‌نمایش تقریبی</span>
          <div className="taxonomy-preview-card">
            <span className="taxonomy-preview-badge">{headerPreview.badge}</span>
            <strong>{headerPreview.title1} <em>{headerPreview.title2}</em></strong>
            <small>{headerPreview.description || `${stats.roots} دسته · ${stats.products} محصول`}</small>
          </div>
        </div>
      </section>

      <section className="taxonomy-panel" aria-labelledby="taxonomy-list-title">
        <div className="taxonomy-panel-head taxonomy-panel-head-wrap">
          <div>
            <h2 id="taxonomy-list-title">دسته‌ها، زیرمجموعه‌ها و سری‌ها</h2>
            <p>ترتیب، نام، توضیح، آیکون و نمایش هر دسته را مدیریت کنید. سری هر محصول از طریق ویرایش همان محصول تغییر می‌کند.</p>
          </div>
          <div className="taxonomy-tools">
            <label className="taxonomy-search">
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={function(event) { setQuery(event.target.value); }}
                placeholder="جستجوی دسته یا زیرمجموعه" aria-label="جستجوی دسته" />
            </label>
            <button type="button" className="btn-add" onClick={function() { openNew(""); }}>
              <Plus size={15} /> دسته اصلی جدید
            </button>
          </div>
        </div>

        {visibleRoots.length === 0 ? (
          <div className="taxonomy-empty">
            <Layers size={30} />
            <strong>دسته‌ای پیدا نشد</strong>
            <span>عبارت جستجو را تغییر دهید یا دسته اصلی جدید بسازید.</span>
          </div>
        ) : (
          <div className="taxonomy-list">
            {visibleRoots.map(function(root, rootIndex) {
              const RootIcon = ICONS[root.icon] || Package;
              const children = categories.filter((category) => category.parentId === root.id);
              const rootProducts = categoryProducts(products, categories, root.id);
              const open = Boolean(expanded[root.id]);
              return (
                <article key={root.id} className={"taxonomy-card" + (root.hidden ? " taxonomy-card-hidden" : "")}>
                  <div className="taxonomy-card-head">
                    <span className="taxonomy-icon"><RootIcon size={20} /></span>
                    <button type="button" className="taxonomy-main" onClick={function() { setExpanded(function(current) { return { ...current, [root.id]: !current[root.id] }; }); }}
                      aria-expanded={open}>
                      <span className="taxonomy-title-row">
                        <strong>{localized(root.name)}</strong>
                        {root.hidden && <span className="taxonomy-pill taxonomy-pill-muted"><EyeOff size={11} /> مخفی</span>}
                        <span className="taxonomy-pill">{children.length} سری/زیرمجموعه</span>
                        <span className="taxonomy-pill">{rootProducts.length} محصول</span>
                      </span>
                      <span className="taxonomy-desc">{localized(root.desc) || "بدون توضیح"}</span>
                      <span className="taxonomy-id" dir="ltr">{root.id}</span>
                    </button>
                    <div className="taxonomy-actions">
                      <button type="button" className="taxonomy-icon-btn" onClick={function() { moveCategory(root, -1); }}
                        disabled={rootIndex === 0} aria-label="انتقال به بالا" title="انتقال به بالا">
                        <ChevronUp size={15} />
                      </button>
                      <button type="button" className="taxonomy-icon-btn" onClick={function() { moveCategory(root, 1); }}
                        disabled={rootIndex === visibleRoots.length - 1} aria-label="انتقال به پایین" title="انتقال به پایین">
                        <ChevronDown size={15} />
                      </button>
                      <button type="button" className="taxonomy-icon-btn" onClick={function() { setCatalog(function(current) {
                        return {
                          ...current,
                          categories: current.categories.map(function(category) {
                            return category.id === root.id ? { ...category, hidden: !category.hidden } : category;
                          })
                        };
                      }); }} aria-label={root.hidden ? "نمایش دسته" : "مخفی کردن دسته"} title={root.hidden ? "نمایش دسته" : "مخفی کردن دسته"}>
                        {root.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button type="button" className="taxonomy-icon-btn" onClick={function() { openNew(root.id); }}
                        aria-label="افزودن زیرمجموعه" title="افزودن زیرمجموعه/سری">
                        <Plus size={15} />
                      </button>
                      <button type="button" className="taxonomy-icon-btn" onClick={function() { openEdit(root); }}
                        aria-label="ویرایش دسته" title="ویرایش دسته">
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="taxonomy-icon-btn taxonomy-icon-btn-danger" onClick={function() { removeCategory(root); }}
                        aria-label="حذف دسته" title="حذف دسته">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="taxonomy-card-body">
                      <div className="taxonomy-subhead">
                        <span>زیرمجموعه‌ها و سری‌ها</span>
                        <button type="button" onClick={function() { openNew(root.id); }} className="taxonomy-text-btn">
                          <Plus size={13} /> افزودن زیرمجموعه
                        </button>
                      </div>
                      {children.length > 0 ? (
                        <div className="taxonomy-children">
                          {children.map(function(child, childIndex) {
                            const ChildIcon = ICONS[child.icon] || Package;
                            const childProducts = categoryProducts(products, categories, child.id);
                            return (
                              <div key={child.id} className={"taxonomy-child" + (child.hidden ? " taxonomy-child-hidden" : "")}>
                                <span className="taxonomy-child-icon"><ChildIcon size={16} /></span>
                                <div className="taxonomy-child-main">
                                  <div className="taxonomy-title-row">
                                    <strong>{localized(child.name)}</strong>
                                    {child.hidden && <span className="taxonomy-pill taxonomy-pill-muted"><EyeOff size={10} /> مخفی</span>}
                                    <span className="taxonomy-pill">{childProducts.length} محصول</span>
                                  </div>
                                  <span className="taxonomy-desc">{localized(child.desc) || "بدون توضیح"}</span>
                                </div>
                                <div className="taxonomy-actions">
                                  <button type="button" className="taxonomy-icon-btn" onClick={function() { moveCategory(child, -1); }}
                                    disabled={childIndex === 0} aria-label="انتقال زیرمجموعه به بالا"><ChevronUp size={14} /></button>
                                  <button type="button" className="taxonomy-icon-btn" onClick={function() { moveCategory(child, 1); }}
                                    disabled={childIndex === children.length - 1} aria-label="انتقال زیرمجموعه به پایین"><ChevronDown size={14} /></button>
                                  <button type="button" className="taxonomy-icon-btn" onClick={function() { openEdit(child); }}
                                    aria-label="ویرایش زیرمجموعه"><Pencil size={14} /></button>
                                  <button type="button" className="taxonomy-icon-btn taxonomy-icon-btn-danger" onClick={function() { removeCategory(child); }}
                                    aria-label="حذف زیرمجموعه"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="taxonomy-hint">برای این دسته زیرمجموعه‌ای ثبت نشده است.</p>
                      )}

                      <div className="taxonomy-subhead taxonomy-subhead-products">
                        <span>سری‌های محصول این دسته</span>
                        <Link href="/admin/products" className="taxonomy-text-btn">
                          مدیریت محصولات <ArrowRight size={13} />
                        </Link>
                      </div>
                      {rootProducts.length > 0 ? (
                        <div className="taxonomy-series">
                          {rootProducts.map(function(product) {
                            return (
                              <Link key={product.slug} href={"/admin/products/" + product.slug} className="taxonomy-series-item">
                                <span className="taxonomy-series-code" dir="ltr">{product.series || "—"}</span>
                                <span className="taxonomy-series-name">{localized(product.name)}</span>
                                <Pencil size={13} />
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="taxonomy-hint">هنوز محصولی به این دسته یا زیرمجموعه‌های آن تخصیص داده نشده است.</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="taxonomy-savebar">
        <span className={dirty ? "taxonomy-dirty" : "taxonomy-clean"}>
          {busy ? <Loader2 size={14} className="taxonomy-spin" /> : dirty ? <AlertTriangle size={14} /> : <Check size={14} />}
          {busy ? "در حال ذخیره..." : dirty ? "تغییرات ذخیره نشده دارید" : "همه تغییرات ذخیره شده است"}
        </span>
        <button type="button" className="btn-add" onClick={saveAll} disabled={busy || !dirty}>
          {busy ? <Loader2 size={15} className="taxonomy-spin" /> : <Save size={15} />}
          ذخیره تغییرات
        </button>
      </div>

      {draft && (
        <div className="taxonomy-modal-overlay" role="presentation" onMouseDown={function(event) {
          if (event.target === event.currentTarget) setDraft(null);
        }}>
          <div className="taxonomy-modal" role="dialog" aria-modal="true" aria-labelledby="taxonomy-modal-title">
            <div className="taxonomy-modal-head">
              <div>
                <h3 id="taxonomy-modal-title">{draft.isNew ? (draft.parentId ? "افزودن زیرمجموعه / سری" : "افزودن دسته اصلی") : "ویرایش دسته"}</h3>
                <p>{draft.parentId ? "این زیرمجموعه در صفحه محصولات زیر دسته والد نمایش داده می‌شود." : "دسته اصلی در هدر و فیلترهای صفحه محصولات نمایش داده می‌شود."}</p>
              </div>
              <button type="button" className="taxonomy-icon-btn" onClick={function() { setDraft(null); }} aria-label="بستن">
                <X size={17} />
              </button>
            </div>

            <div className="taxonomy-modal-body">
              <div className="taxonomy-langs taxonomy-langs-block">
                {LANGS.map(function(item) {
                  return (
                    <button key={item.code} type="button" onClick={function() { setLang(item.code); }}
                      className={"taxonomy-lang" + (lang === item.code ? " taxonomy-lang-active" : "")}>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="taxonomy-form-grid">
                <label className="taxonomy-field">
                  <span>نام دسته ({LANGS.find(function(item) { return item.code === lang; })?.label})</span>
                  <input className="form-input" dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
                    value={draft.name[lang] || ""}
                    onChange={function(event) { updateDraftName(event.target.value); }} />
                </label>
                <label className="taxonomy-field">
                  <span>شناسه (slug) <em className="taxonomy-req">*</em></span>
                  <input className="form-input" dir="ltr" value={draft.id} disabled={!draft.isNew}
                    placeholder="control-valves"
                    onChange={function(event) { setDraft({ ...draft, id: event.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() }); }} />
                  <small>در آدرس صفحه استفاده می‌شود و بعد از ساخت قابل تغییر نیست.</small>
                </label>
                <label className="taxonomy-field taxonomy-field-wide">
                  <span>توضیح ({LANGS.find(function(item) { return item.code === lang; })?.label})</span>
                  <textarea className="form-input" rows={2} dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
                    value={draft.desc[lang] || ""}
                    onChange={function(event) { updateDraftDesc(event.target.value); }} />
                </label>
                <label className="taxonomy-field">
                  <span>دسته والد</span>
                  <select className="form-input" value={draft.parentId || ""} disabled={!draft.isNew}
                    onChange={function(event) { setDraft({ ...draft, parentId: event.target.value }); }}>
                    <option value="">— دسته اصلی —</option>
                    {roots.filter(function(root) { return root.id !== draft.id; }).map(function(root) {
                      return <option key={root.id} value={root.id}>{localized(root.name)}</option>;
                    })}
                  </select>
                </label>
                <div className="taxonomy-field">
                  <span>آیکون دسته</span>
                  <div className="taxonomy-icon-grid">
                    {CATEGORY_ICON_NAMES.map(function(iconName) {
                      const IconComponent = ICONS[iconName] || Package;
                      return (
                        <button key={iconName} type="button"
                          className={"taxonomy-icon-choice" + (draft.icon === iconName ? " taxonomy-icon-choice-active" : "")}
                          onClick={function() { setDraft({ ...draft, icon: iconName }); }}
                          aria-label={iconName} title={iconName}>
                          <IconComponent size={17} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="taxonomy-switch taxonomy-field-wide">
                  <input type="checkbox" checked={draft.hidden} onChange={function(event) { setDraft({ ...draft, hidden: event.target.checked }); }} />
                  <span className="taxonomy-switch-track" aria-hidden="true"><span /></span>
                  <span>
                    <strong>مخفی کردن دسته در صفحه محصولات</strong>
                    <small>محصولات این دسته و لینک مستقیم آن‌ها حذف نمی‌شوند؛ فقط از فهرست عمومی پنهان می‌شوند.</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="taxonomy-modal-foot">
              <span className="taxonomy-hint">تغییرات پس از بستن این پنجره در لیست باقی می‌ماند؛ برای ثبت نهایی «ذخیره تغییرات» را بزنید.</span>
              <div className="taxonomy-head-actions">
                <button type="button" className="btn-cancel" onClick={function() { setDraft(null); }}>انصراف</button>
                <button type="button" className="btn-add" onClick={commitDraft}>
                  <Check size={15} /> {draft.isNew ? "افزودن به لیست" : "اعمال تغییر"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .taxonomy-shell { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }
        .taxonomy-head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .taxonomy-head-actions .btn-cancel { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }

        .taxonomy-panel {
          background: #FFFFFF;
          border: 1px solid #D9DEE5;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(26, 29, 33, 0.04);
          padding: 20px;
        }
        .taxonomy-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .taxonomy-panel-head-wrap { flex-wrap: wrap; }
        .taxonomy-panel-head h2 { margin: 0; color: #1A1D21; font-size: 15px; font-weight: 950; }
        .taxonomy-panel-head p { margin: 5px 0 0; max-width: 700px; color: #7A8290; font-size: 11.5px; font-weight: 600; line-height: 1.9; }

        .taxonomy-langs { display: inline-flex; flex-wrap: wrap; gap: 3px; padding: 3px; border: 1px solid #E2E6EB; border-radius: 10px; background: #F6F7F9; }
        .taxonomy-lang { padding: 7px 12px; border: 0; border-radius: 7px; background: transparent; color: #7A8290; font-family: inherit; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.15s; }
        .taxonomy-lang:hover { color: #1A1D21; }
        .taxonomy-lang-active { background: #FFFFFF; color: #8A6508; box-shadow: 0 1px 4px rgba(26, 29, 33, 0.1); }
        .taxonomy-langs-block { margin-bottom: 14px; }

        .taxonomy-form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .taxonomy-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .taxonomy-field > span { color: #4B5160; font-size: 11px; font-weight: 850; }
        .taxonomy-field > small { color: #8B93A1; font-size: 10px; font-weight: 600; line-height: 1.7; }
        .taxonomy-field-wide { grid-column: 1 / -1; }
        .taxonomy-req { color: #E81123; font-style: normal; }

        .taxonomy-preview { margin-top: 16px; padding: 12px; border: 1px dashed #D8DEE6; border-radius: 12px; background: #FAFBFC; }
        .taxonomy-preview-label { display: block; margin-bottom: 8px; color: #8B93A1; font-size: 9.5px; font-weight: 900; letter-spacing: 0.04em; }
        .taxonomy-preview-card { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 16px; border-radius: 10px; background: radial-gradient(circle at top, rgba(224, 168, 26, 0.1), transparent 65%), #FFFFFF; text-align: center; }
        .taxonomy-preview-badge { padding: 4px 10px; border-radius: 999px; background: #FFF7E0; color: #8A6508; font-size: 9px; font-weight: 900; }
        .taxonomy-preview-card strong { color: #1A1D21; font-size: 18px; font-weight: 950; }
        .taxonomy-preview-card em { color: #B8850A; font-style: normal; }
        .taxonomy-preview-card small { color: #7A8290; font-size: 10.5px; font-weight: 600; }

        .taxonomy-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .taxonomy-search { display: flex; align-items: center; gap: 7px; min-width: 210px; padding: 0 10px; border: 1px solid #D1D5DB; border-radius: 9px; background: #FFFFFF; color: #8B93A1; }
        .taxonomy-search:focus-within { border-color: #C9950D; box-shadow: 0 0 0 3px rgba(201, 149, 13, 0.12); }
        .taxonomy-search input { width: 100%; min-width: 0; padding: 10px 0; border: 0; outline: 0; background: transparent; color: #1A1D21; font-family: inherit; font-size: 11px; }

        .taxonomy-list { display: flex; flex-direction: column; gap: 10px; }
        .taxonomy-card { border: 1px solid #E1E5EA; border-radius: 13px; background: #FFFFFF; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s; }
        .taxonomy-card:hover { border-color: #CBD3DC; box-shadow: 0 5px 18px rgba(26, 29, 33, 0.05); }
        .taxonomy-card-hidden { background: #FAFBFC; opacity: 0.82; }
        .taxonomy-card-head { display: flex; align-items: flex-start; gap: 11px; padding: 13px; }
        .taxonomy-icon { display: grid; width: 40px; height: 40px; flex: 0 0 40px; place-items: center; border-radius: 11px; background: linear-gradient(135deg, #FFF8E6, #FFEDB8); color: #A87B0A; }
        .taxonomy-main { flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; text-align: start; cursor: pointer; font-family: inherit; }
        .taxonomy-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .taxonomy-title-row strong { color: #1A1D21; font-size: 12.5px; font-weight: 900; }
        .taxonomy-pill { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 6px; background: #F1F3F6; color: #5C6472; font-size: 9px; font-weight: 800; }
        .taxonomy-pill-muted { background: #F3F4F6; color: #8B93A1; }
        .taxonomy-desc { display: block; margin-top: 3px; color: #7A8290; font-size: 10.5px; font-weight: 600; line-height: 1.7; }
        .taxonomy-id { display: inline-block; margin-top: 4px; color: #A1A8B3; font-family: monospace; font-size: 9.5px; }
        .taxonomy-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; }
        .taxonomy-icon-btn { display: inline-grid; width: 29px; height: 29px; place-items: center; border: 1px solid #E1E5EA; border-radius: 7px; background: #FFFFFF; color: #667080; cursor: pointer; transition: all 0.14s; }
        .taxonomy-icon-btn:hover:not(:disabled) { border-color: #C9950D; color: #8A6508; background: #FFFCF3; }
        .taxonomy-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .taxonomy-icon-btn-danger:hover:not(:disabled) { border-color: #F3B6BC; color: #D21C2E; background: #FFF5F6; }

        .taxonomy-card-body { padding: 0 13px 13px 64px; }
        .taxonomy-subhead { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 0 8px; border-top: 1px solid #EEF1F4; color: #4B5160; font-size: 10px; font-weight: 900; }
        .taxonomy-subhead-products { margin-top: 6px; }
        .taxonomy-text-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: transparent; color: #A87B0A; font-family: inherit; font-size: 10px; font-weight: 900; text-decoration: none; cursor: pointer; }
        .taxonomy-text-btn:hover { text-decoration: underline; }
        .taxonomy-children { display: flex; flex-direction: column; gap: 5px; }
        .taxonomy-child { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: 1px solid #EEF1F4; border-radius: 9px; background: #FAFBFC; }
        .taxonomy-child-hidden { opacity: 0.7; }
        .taxonomy-child-icon { display: grid; width: 29px; height: 29px; flex: 0 0 29px; place-items: center; border-radius: 8px; background: #FFFFFF; color: #A87B0A; border: 1px solid #E7EBEF; }
        .taxonomy-child-main { flex: 1; min-width: 0; }
        .taxonomy-hint { margin: 6px 0; color: #8B93A1; font-size: 10.5px; font-weight: 600; }

        .taxonomy-series { display: flex; flex-wrap: wrap; gap: 6px; }
        .taxonomy-series-item { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 5px 8px; border: 1px solid #E7EBEF; border-radius: 8px; background: #FFFFFF; color: #667080; font-size: 10px; font-weight: 700; text-decoration: none; transition: all 0.14s; }
        .taxonomy-series-item:hover { border-color: #C9950D; color: #8A6508; background: #FFFCF3; }
        .taxonomy-series-code { padding: 2px 5px; border-radius: 4px; background: #FFF5D6; color: #8A6508; font-family: monospace; font-size: 9px; font-weight: 900; }
        .taxonomy-series-name { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .taxonomy-empty { display: grid; justify-items: center; gap: 6px; padding: 38px 16px; color: #8B93A1; text-align: center; }
        .taxonomy-empty strong { color: #1A1D21; font-size: 13px; }
        .taxonomy-empty span { font-size: 11px; font-weight: 600; }

        .taxonomy-savebar { position: sticky; bottom: 12px; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border: 1px solid #D9DEE5; border-radius: 13px; background: rgba(255, 255, 255, 0.94); box-shadow: 0 10px 30px rgba(26, 29, 33, 0.12); backdrop-filter: blur(10px); }
        .taxonomy-savebar > span { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 850; }
        .taxonomy-dirty { color: #A05C00; }
        .taxonomy-clean { color: #2E7D5B; }
        .taxonomy-spin { animation: taxonomySpin 0.9s linear infinite; }
        @keyframes taxonomySpin { to { transform: rotate(360deg); } }

        .taxonomy-modal-overlay { position: fixed; inset: 0; z-index: 900; display: grid; place-items: center; padding: 18px; background: rgba(15, 18, 22, 0.52); backdrop-filter: blur(3px); }
        .taxonomy-modal { width: min(760px, 100%); max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #D9DEE5; border-radius: 16px; background: #FFFFFF; box-shadow: 0 24px 70px rgba(15, 18, 22, 0.28); }
        .taxonomy-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 17px 20px; border-bottom: 1px solid #EEF1F4; }
        .taxonomy-modal-head h3 { margin: 0; color: #1A1D21; font-size: 15px; font-weight: 950; }
        .taxonomy-modal-head p { margin: 4px 0 0; color: #7A8290; font-size: 10.5px; font-weight: 600; }
        .taxonomy-modal-body { padding: 18px 20px; overflow-y: auto; }
        .taxonomy-modal-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 20px; border-top: 1px solid #EEF1F4; background: #FAFBFC; }
        .taxonomy-modal-foot .taxonomy-hint { margin: 0; max-width: 360px; }
        .taxonomy-modal-foot .btn-cancel { text-decoration: none; }

        .taxonomy-icon-grid { display: flex; flex-wrap: wrap; gap: 5px; }
        .taxonomy-icon-choice { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #E1E5EA; border-radius: 8px; background: #FFFFFF; color: #667080; cursor: pointer; transition: all 0.14s; }
        .taxonomy-icon-choice:hover { border-color: #C9950D; color: #A87B0A; }
        .taxonomy-icon-choice-active { border-color: #C9950D; background: #FFF7E0; color: #8A6508; box-shadow: 0 0 0 2px rgba(201, 149, 13, 0.15); }

        .taxonomy-switch { display: flex; align-items: flex-start; gap: 9px; cursor: pointer; }
        .taxonomy-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
        .taxonomy-switch-track { position: relative; width: 36px; height: 20px; flex: 0 0 36px; margin-top: 1px; border-radius: 999px; background: #D5DAE1; transition: background 0.16s; }
        .taxonomy-switch-track span { position: absolute; top: 3px; inset-inline-start: 3px; width: 14px; height: 14px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 0.16s; }
        .taxonomy-switch input:checked + .taxonomy-switch-track { background: #C9950D; }
        .taxonomy-switch input:checked + .taxonomy-switch-track span { transform: translateX(16px); }
        .taxonomy-switch strong { display: block; color: #1A1D21; font-size: 11px; font-weight: 850; }
        .taxonomy-switch small { display: block; margin-top: 2px; color: #8B93A1; font-size: 10px; font-weight: 600; line-height: 1.7; }

        @media (max-width: 900px) {
          .taxonomy-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .taxonomy-panel-head { flex-direction: column; }
          .taxonomy-card-body { padding-inline-start: 13px; }
        }
        @media (max-width: 640px) {
          .taxonomy-form-grid { grid-template-columns: 1fr; }
          .taxonomy-panel { padding: 14px; }
          .taxonomy-card-head { flex-wrap: wrap; }
          .taxonomy-card-head .taxonomy-actions { width: 100%; padding-inline-start: 51px; }
          .taxonomy-tools { width: 100%; }
          .taxonomy-search { flex: 1; }
          .taxonomy-savebar { flex-direction: column; align-items: stretch; }
          .taxonomy-savebar .btn-add { justify-content: center; }
          .taxonomy-modal-foot { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}
