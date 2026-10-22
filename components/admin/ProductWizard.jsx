"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Type, Languages, Target, ListChecks, Eye, Save, ArrowRight, ArrowLeft,
  Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, Info,
  Sparkles
} from "lucide-react";
import { getCategoryLabel } from "@/lib/category-utils";
import { SPEC_FIELDS } from "@/lib/spec-fields";
import ProductTechnicalSpecifications from "@/components/ProductTechnicalSpecifications";
import UploadDropzone from "./UploadDropzone";
import { FormSection, FormGrid, Field } from "./EditorPanel";

const LANGS = [
  { code: "fa", label: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ru", label: "Русский", flag: "🇷🇺", dir: "ltr" }
];

const STEPS = [
  { id: 1, title: "اطلاعات پایه", sub: "نام، دسته و دو تصویر", icon: Package, color: "#0078D4" },
  { id: 2, title: "توضیحات چندزبانه", sub: "فارسی، انگلیسی، عربی، روسی", icon: Languages, color: "#107C10" },
  { id: 3, title: "محتوای فنی", sub: "کاربرد، ویژگی، آپشن و مشتری", icon: ListChecks, color: "#F7630C" },
  { id: 4, title: "مشخصات فنی", sub: "افزودن ردیف‌های دلخواه", icon: Target, color: "#8764B8" },
  { id: 5, title: "پیش‌نمایش و انتشار", sub: "بازبینی نهایی", icon: Eye, color: "#E0A81A" }
];

function emptyML() {
  return { fa: "", en: "", ar: "", ru: "" };
}

function emptyArrML() {
  return { fa: [], en: [], ar: [], ru: [] };
}

function ensureML(val) {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return { fa: val.fa || "", en: val.en || "", ar: val.ar || "", ru: val.ru || "" };
  }
  if (typeof val === "string") return { fa: val, en: val, ar: val, ru: val };
  return emptyML();
}

function ensureArrML(val) {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return {
      fa: Array.isArray(val.fa) ? val.fa : [],
      en: Array.isArray(val.en) ? val.en : [],
      ar: Array.isArray(val.ar) ? val.ar : [],
      ru: Array.isArray(val.ru) ? val.ru : []
    };
  }
  return emptyArrML();
}

function ensureSpec(val) {
  const out = {};
  SPEC_FIELDS.forEach(function(f) {
    out[f.id] = ensureML(val && val[f.id]);
  });
  return out;
}

function ensureSpecifications(val, legacySpec) {
  if (Array.isArray(val) && val.length > 0) {
    return val.map(function(row, index) {
      return {
        id: row.id || "specification-" + index,
        label: ensureML(row.label),
        value: ensureML(row.value)
      };
    });
  }
  return SPEC_FIELDS
    .map(function(field) {
      return {
        id: field.id,
        label: ensureML(field.label),
        value: ensureML(legacySpec && legacySpec[field.id])
      };
    })
    .filter(function(row) { return Object.values(row.value).some(Boolean); });
}

export default function ProductWizard({ initial, categories = [], isNew = false, initialStep = 1 }) {
  const router = useRouter();
  const stepsRef = useRef(null);
  const [step, setStep] = useState(initialStep === 2 ? 2 : 1);
  const [activeLang, setActiveLang] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [product, setProduct] = useState(function() {
    if (initial) {
      return {
        slug: initial.slug || "",
        series: initial.series || "",
        categoryId: initial.categoryId || categories.find(function(c) { return !c.children.length; })?.id || "control-valves",
        image: initial.image || "",
        image2: initial.image2 || "",
        name: ensureML(initial.name),
        short: ensureML(initial.short),
        description: ensureML(initial.description),
        applications: ensureArrML(initial.applications),
        features: ensureArrML(initial.features),
        options: ensureArrML(initial.options),
        clients: ensureArrML(initial.clients),
        spec: ensureSpec(initial.spec),
        specifications: ensureSpecifications(initial.specifications, initial.spec)
      };
    }
    return {
      slug: "",
      series: "",
      categoryId: categories.find(function(c) { return !c.children.length; })?.id || "control-valves",
      image: "",
      image2: "",
      name: emptyML(),
      short: emptyML(),
      description: emptyML(),
      applications: emptyArrML(),
      features: emptyArrML(),
      options: emptyArrML(),
      clients: emptyArrML(),
      spec: ensureSpec(null),
      specifications: []
    };
  });

  function updateField(key, value) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone[key] = value;
      return clone;
    });
  }

  function updateML(key, lang, value) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone[key][lang] = value;
      return clone;
    });
  }

  function updateArrayList(key, lang, value) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone[key][lang] = value.split(/\r?\n/);
      return clone;
    });
  }

  function updateSpecification(specificationId, field, lang, value) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.specifications = clone.specifications.map(function(row) {
        if (row.id !== specificationId) return row;
        return { ...row, [field]: { ...row[field], [lang]: value } };
      });
      if (field === "value" && SPEC_FIELDS.some(function(item) { return item.id === specificationId; })) {
        clone.spec[specificationId][lang] = value;
      }
      return clone;
    });
  }

  function addSpecification() {
    const id = "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    setProduct(function(prev) {
      return {
        ...prev,
        specifications: [...prev.specifications, { id: id, label: emptyML(), value: emptyML() }]
      };
    });
  }

  function removeSpecification(specificationId) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.specifications = clone.specifications.filter(function(row) { return row.id !== specificationId; });
      if (SPEC_FIELDS.some(function(item) { return item.id === specificationId; })) {
        clone.spec[specificationId] = emptyML();
      }
      return clone;
    });
  }

  function canProceed(s) {
    if (s === 1) {
      return product.slug.trim() && product.series.trim() && product.categoryId;
    }
    if (s === 2) {
      return product.name.fa.trim() && product.name.en.trim();
    }
    return true;
  }

  function next() {
    if (!canProceed(step)) {
      setMsg({ type: "error", text: "لطفاً فیلدهای الزامی این مرحله را کامل کنید" });
      setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
      return;
    }
    setStep(function(s) { return Math.min(5, s + 1); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prev() {
    setStep(function(s) { return Math.max(1, s - 1); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setMsg({ type: "", text: "" });
    if (!product.slug.trim() || !product.series.trim()) {
      setMsg({ type: "error", text: "نامک و کد سری الزامی است" });
      setStep(1);
      return;
    }
    if (!product.name.fa.trim() || !product.name.en.trim()) {
      setMsg({ type: "error", text: "نام فارسی و انگلیسی الزامی است" });
      setStep(2);
      return;
    }

    const payload = JSON.parse(JSON.stringify(product));
    ["applications", "features", "options", "clients"].forEach(function(field) {
      Object.keys(payload[field]).forEach(function(lang) {
        payload[field][lang] = payload[field][lang]
          .map(function(item) { return item.trim(); })
          .filter(Boolean);
      });
    });

    setBusy(true);
    try {
      const url = isNew ? "/api/products" : "/api/products/" + product.slug;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ type: "success", text: "✓ محصول با موفقیت ذخیره شد" });
        setTimeout(function() { router.push("/admin/products"); }, 900);
      } else {
        setMsg({ type: "error", text: data.error || "خطا در ذخیره" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message || "خطای شبکه" });
    }
    setBusy(false);
  }

  const StepIcon = STEPS[step - 1].icon;
  const stepColor = STEPS[step - 1].color;

  useEffect(function() {
    const active = stepsRef.current && stepsRef.current.querySelector(".wiz-step-active");
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [step]);

  return (
    <div className="product-wizard">
      {msg.text && (
        <div
          className="wizard-msg"
          role="status"
          aria-live="polite"
          style={{
            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: "2px solid " + (msg.type === "success" ? "#A7F3D0" : "#FECACA"),
            color: msg.type === "success" ? "#065F46" : "#991B1B",
            boxShadow: "0 8px 24px rgba(20, 22, 27, 0.1)"
          }}
        >
          {msg.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="wiz-steps" ref={stepsRef} role="group" aria-label="مراحل ویرایش محصول">
        {STEPS.map(function(s, i) {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div className={"wiz-line" + (isDone || isActive ? " wiz-line-done" : "")} />}
              <button
                type="button"
                aria-label={s.title + " — مرحله " + s.id}
                aria-current={isActive ? "step" : undefined}
                onClick={function() { setStep(s.id); }}
                className={"wiz-step" + (isActive ? " wiz-step-active" : "") + (isDone ? " wiz-step-done" : "")}
              >
                <div className="wiz-step-num">
                  {isDone ? <CheckCircle2 size={22} /> : s.id}
                </div>
                <div className="wiz-step-label">
                  <div className="wiz-step-title">{s.title}</div>
                  <div className="wiz-step-sub">{s.sub}</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="wiz-card" role="region" aria-label={STEPS[step - 1].title}>
        <div className="wiz-card-header">
          <div className="wiz-card-icon" style={{ background: stepColor + "18", color: stepColor }}>
            <StepIcon size={26} />
          </div>
          <div>
            <div className="wiz-card-title">{STEPS[step - 1].title}</div>
            <div className="wiz-card-sub">مرحله {step} از ۵ — {STEPS[step - 1].sub}</div>
          </div>
        </div>

        <div className="wiz-card-body">
          {step === 1 && (
            <Step1
              product={product}
              updateField={updateField}
              isNew={isNew}
              categories={categories}
            />
          )}
          {step === 2 && (
            <Step2
              product={product}
              updateML={updateML}
              activeLang={activeLang}
              setActiveLang={setActiveLang}
            />
          )}
          {step === 3 && (
            <Step3
              product={product}
              updateArrayList={updateArrayList}
              activeLang={activeLang}
              setActiveLang={setActiveLang}
            />
          )}
          {step === 4 && (
            <Step4
              product={product}
              updateSpecification={updateSpecification}
              addSpecification={addSpecification}
              removeSpecification={removeSpecification}
              activeLang={activeLang}
              setActiveLang={setActiveLang}
            />
          )}
          {step === 5 && (
            <Step5 product={product} activeLang={activeLang} setActiveLang={setActiveLang} />
          )}
        </div>
      </div>

      <div className="wiz-nav">
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          className="big-btn big-btn-ghost"
        >
          <ArrowRight size={18} /> مرحله قبل
        </button>

        <div style={{ flex: 1 }} />

        {!isNew && (
          <button type="button" onClick={save} disabled={busy} className="big-btn big-btn-green">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            ذخیره تغییرات
          </button>
        )}
        {step < 5 && (
          <button type="button" onClick={next} className="big-btn big-btn-primary">
            مرحله بعد <ArrowLeft size={18} />
          </button>
        )}
        {isNew && step === 5 && (
          <button type="button" onClick={save} disabled={busy} className="big-btn big-btn-green">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            ذخیره و انتشار
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// STEP 1 - Basic info
// ================================================================
function Step1({ product, updateField, isNew, categories = [] }) {
  return (
    <div className="wizard-two-col">
      <div>
        <div className="big-field">
          <div className="big-field-label">
            نامک <span className="big-field-label-req">*</span>
            <Info size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="big-field-hint">فقط حروف انگلیسی کوچک، اعداد و خط تیره — مثل ball-control-valve</div>
          <input
            type="text"
            dir="ltr"
            value={product.slug}
            onChange={function(e) { updateField("slug", e.target.value.replace(/[^a-z0-9-]/g, "")); }}
            disabled={!isNew}
            placeholder="ball-control-valve"
            className="big-input"
          />
        </div>

        <div className="big-field">
          <div className="big-field-label">
            کد سری <span className="big-field-label-req">*</span>
          </div>
          <div className="big-field-hint">کد یا شماره سری محصول؛ ارقام فارسی و انگلیسی قابل ورود هستند.</div>
          <input
            type="text"
            dir="ltr"
            value={product.series}
            onChange={function(e) { updateField("series", e.target.value.toUpperCase()); }}
            placeholder="PSM-BCV"
            className="big-input"
          />
        </div>

        <div className="big-field">
          <div className="big-field-label">دسته‌بندی <span className="big-field-label-req">*</span></div>
          <div className="big-field-hint">گروه اصلی محصول در کاتالوگ</div>
          <select
            value={product.categoryId}
            onChange={function(e) { updateField("categoryId", e.target.value); }}
            className="big-input"
          >
            {categories.filter(function(c) { return !c.children.length && !c.hidden; }).map(function(c) {
              return <option key={c.id} value={c.id}>{getCategoryLabel(c, "fa", categories)}</option>;
            })}
          </select>
        </div>
      </div>

      <FormSection title="تصاویر محصول" description="تصویر اصلی و تصویر تکمیلی محصول">
        <FormGrid>
          <Field as="div" label="تصویر اصلی محصول" required>
            <UploadDropzone
              type="images"
              guidelineKey="productImage"
              value={product.image || ""}
              onChange={function(url) { updateField("image", url); }}
              accept="image/*"
              label=""
            />
          </Field>
          <Field as="div" label="تصویر دوم محصول" hint="برای نمایش نمای جانبی، جزئیات یا تصویر تکمیلی.">
            <UploadDropzone
              type="images"
              guidelineKey="productImage"
              value={product.image2 || ""}
              onChange={function(url) { updateField("image2", url); }}
              accept="image/*"
              label=""
            />
          </Field>
        </FormGrid>
      </FormSection>
    </div>
  );
}

// ================================================================
// STEP 2 - Multilingual name & description
// ================================================================
function Step2({ product, updateML, activeLang, setActiveLang }) {
  const currentLang = LANGS.find(function(l) { return l.code === activeLang; }) || LANGS[0];

  return (
    <div>
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button
              key={l.code}
              type="button"
              onClick={function() { setActiveLang(l.code); }}
              className={"lang-tab" + (activeLang === l.code ? " lang-tab-active" : "")}
            >
              <span className="lang-tab-flag">{l.flag}</span>
              {l.label}
              {product.name[l.code] && product.name[l.code].trim() ? (
                <CheckCircle2 size={14} style={{ color: "#107C10" }} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="big-field">
        <div className="big-field-label">
          نام محصول در {currentLang.label}
          {(activeLang === "fa" || activeLang === "en") && <span className="big-field-label-req">*</span>}
        </div>
        <input
          type="text"
          dir={currentLang.dir}
          value={product.name[activeLang] || ""}
          onChange={function(e) { updateML("name", activeLang, e.target.value); }}
          placeholder={activeLang === "fa" ? "مثل: شیر کنترلی توپی" : activeLang === "en" ? "e.g. Ball Control Valve" : ""}
          className="big-input"
          style={{ fontSize: "17px", padding: "18px 20px" }}
        />
      </div>

      <div className="big-field">
        <div className="big-field-label">توضیح کوتاه در {currentLang.label}</div>
        <div className="big-field-hint">
          خلاصه‌ای که در فهرست و کارت محصول نمایش داده می‌شود
        </div>
        <textarea
          dir={currentLang.dir}
          value={product.short[activeLang] || ""}
          onChange={function(e) { updateML("short", activeLang, e.target.value); }}
          rows={5}
          className="big-input"
        />
      </div>

      <div className="big-field">
        <div className="big-field-label">معرفی کامل محصول در {currentLang.label}</div>
        <div className="big-field-hint">
          این متن در ابتدای برگهٔ مشخصات فنی محصول نمایش داده می‌شود.
        </div>
        <textarea
          dir={currentLang.dir}
          value={product.description[activeLang] || ""}
          onChange={function(e) { updateML("description", activeLang, e.target.value); }}
          rows={6}
          className="big-input"
        />
      </div>

      <div
        className="wizard-note"
        style={{ background: "rgba(0, 120, 212, 0.06)", border: "1px solid rgba(0, 120, 212, 0.2)" }}
      >
        <Sparkles size={20} style={{ color: "#0078D4" }} />
        <div style={{ color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>نکته:</strong> هر ۴ زبان را کامل کنید تا سایت شما در جستجوی گوگل بهتر دیده شود.
        </div>
      </div>
    </div>
  );
}

// ================================================================
// STEP 3 - Applications & Features
// ================================================================
function Step3({ product, updateArrayList, activeLang, setActiveLang }) {
  const currentLang = LANGS.find(function(l) { return l.code === activeLang; }) || LANGS[0];

  function renderItemField(field, title, hint) {
    const items = product[field]?.[activeLang] || [];
    return (
      <label className="big-field" key={field}>
        <span className="big-field-label">{title} در {currentLang.label}</span>
        <div className="big-field-hint">{hint}</div>
        <textarea
            rows={Math.min(6, Math.max(3, items.length + 1))}
            dir={currentLang.dir}
            value={items.join("\n")}
            onChange={function(e) { updateArrayList(field, activeLang, e.target.value); }}
            placeholder="هر مورد را در یک خط بنویسید یا فهرست را اینجا جای‌گذاری کنید"
            className="big-input big-list-input"
          />
        <span className="big-field-hint">{items.filter(function(item) { return item.trim(); }).length} مورد · هر خط یک مورد</span>
      </label>
    );
  }

  return (
    <div>
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button
              key={l.code}
              type="button"
              onClick={function() { setActiveLang(l.code); }}
              className={"lang-tab" + (activeLang === l.code ? " lang-tab-active" : "")}
            >
              <span className="lang-tab-flag">{l.flag}</span>
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="product-list-editor-tip">
        <Info size={17} />
        <span>برای افزودن یا ویرایش موارد، کافی است متن را در کادر بنویسید؛ هر خط جداگانه در صفحهٔ محصول نمایش داده می‌شود. می‌توانید فهرست را مستقیم از فایل اکسل یا متن کپی کنید.</span>
      </div>

      {renderItemField("applications", "کاربردهای کلیدی", "مثل: پالایشگاه، پتروشیمی و نیروگاه")}
      {renderItemField("features", "ویژگی‌ها و مزایا", "مثل: طراحی مطابق IEC 60534، پوشش HVOF و قابلیت Fail-Safe")}
      {renderItemField("options", "آپشن‌ها", "موارد قابل انتخاب یا پیکربندی برای این محصول")}
      {renderItemField("clients", "مشتریان", "نام مشتریان مرتبط با این محصول")}
    </div>
  );
}

// ================================================================
// STEP 4 - Specs (fixed fields, shared with the public product page)
// ================================================================
function Step4({ product, updateSpecification, addSpecification, removeSpecification, activeLang, setActiveLang }) {
  const currentLang = LANGS.find(function(l) { return l.code === activeLang; }) || LANGS[0];

  return (
    <div>
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button
              key={l.code}
              type="button"
              onClick={function() { setActiveLang(l.code); }}
              className={"lang-tab" + (activeLang === l.code ? " lang-tab-active" : "")}
            >
              <span className="lang-tab-flag">{l.flag}</span>
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="wizard-note" style={{ marginBottom: 20, background: "rgba(135, 100, 184, 0.06)", border: "1px solid rgba(135, 100, 184, 0.25)" }}>
        <Info size={20} style={{ color: "#8764B8" }} />
        <div style={{ color: "var(--text-soft)" }}>
          برای هر ردیف، عنوان و مقدار مشخصه را در زبان فعال وارد کنید. می‌توانید هر تعداد مشخصه با عنوان دلخواه اضافه کنید.
        </div>
      </div>

      <div className="wizard-spec-list">
        {product.specifications.map(function(specification) {
          const label = specification.label[activeLang] || "";
          const value = specification.value[activeLang] || "";
          return (
            <div key={specification.id} className="wizard-spec-row">
              <label className="wizard-spec-field">
                <span className="wizard-spec-label">عنوان مشخصه · {currentLang.label}</span>
                <input
                  type="text"
                  dir={currentLang.dir}
                  value={label}
                  onChange={function(e) { updateSpecification(specification.id, "label", activeLang, e.target.value); }}
                  placeholder="مثلاً: نوع اتصال"
                  className="big-input"
                  style={{ padding: "12px 14px", fontSize: "14px" }}
                />
              </label>
              <label className="wizard-spec-field">
                <span className="wizard-spec-label">مقدار · {currentLang.label}</span>
                <input
                  type="text"
                  dir={currentLang.dir}
                  value={value}
                  onChange={function(e) { updateSpecification(specification.id, "value", activeLang, e.target.value); }}
                  placeholder="مثلاً: فلنجی، جوشی یا رزوه‌ای"
                  className="big-input"
                  style={{ padding: "12px 14px", fontSize: "14px" }}
                />
              </label>
              <button type="button" onClick={function() { removeSpecification(specification.id); }}
                className="wizard-spec-delete"
                aria-label="حذف مشخصه" title="حذف مشخصه">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addSpecification} className="btn-add" style={{ marginTop: 16 }}>
        <Plus size={16} /> افزودن مشخصه
      </button>
    </div>
  );
}

// ================================================================
// STEP 5 - Preview
// ================================================================
function PreviewGallery({ images, name, noImage }) {
  const available = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const activeImage = available[index] || available[0];

  if (!activeImage) {
    return <div className="wizard-preview-empty">{noImage}</div>;
  }

  return (
    <div className="wizard-preview-gallery">
      <div className="wizard-preview-stage">
        <img src={activeImage} alt={name || ""} />
      </div>
      {available.length > 1 && (
        <div className="wizard-preview-thumbs" role="group" aria-label={name || "تصاویر محصول"}>
          {available.map(function(image, imageIndex) {
            return (
              <button
                key={image}
                type="button"
                onClick={function() { setIndex(imageIndex); }}
                aria-pressed={index === imageIndex}
                className={"wizard-preview-thumb" + (index === imageIndex ? " wizard-preview-thumb-active" : "")}
              >
                <img src={image} alt="" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Step5({ product, activeLang, setActiveLang }) {
  const name = product.name[activeLang] || product.name.fa || "";
  const short = product.short[activeLang] || product.short.fa || "";
  const visibleItems = function(field) {
    return (product[field][activeLang] || [])
      .map(function(item) { return item.trim(); })
      .filter(Boolean);
  };
  const apps = visibleItems("applications");
  const feats = visibleItems("features");
  const options = visibleItems("options");
  const clients = visibleItems("clients");
  const specs = product.specifications
    .map(function(specification) {
      return {
        id: specification.id,
        label: specification.label[activeLang] || specification.label.fa || "",
        value: specification.value[activeLang] || specification.value.fa || ""
      };
    })
    .filter(function(specification) { return specification.label && specification.value; });

  return (
    <div>
      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button
              key={l.code}
              type="button"
              onClick={function() { setActiveLang(l.code); }}
              className={"lang-tab" + (activeLang === l.code ? " lang-tab-active" : "")}
            >
              <span className="lang-tab-flag">{l.flag}</span>
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="wizard-note" style={{ marginBottom: 20, background: "rgba(16, 124, 16, 0.06)", border: "1px solid rgba(16, 124, 16, 0.25)" }}>
        <Eye size={20} style={{ color: "#107C10" }} />
        <div style={{ color: "var(--text-soft)" }}>
          این پیش‌نمایش نحوه نمایش محصول در سایت است. برای ویرایش هر بخش، روی شماره‌ی مرحله در بالا کلیک کنید.
        </div>
      </div>

      <div className="wizard-preview-grid">
        <div>
          <PreviewGallery images={[product.image, product.image2]} name={name} noImage="تصویری انتخاب نشده است" />
        </div>
        <ProductTechnicalSpecifications
          title={name || "—"}
          series={product.series || ""}
          description={product.description[activeLang] || product.description.fa || short}
          features={feats}
          options={options}
          specifications={specs.map(function(spec) {
            return { id: spec.key, label: spec.key, value: spec.value };
          })}
          applications={apps}
          clients={clients}
          language={activeLang}
        />
        </div>
    </div>
  );
}
