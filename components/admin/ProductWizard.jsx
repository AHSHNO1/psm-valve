"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Type, Languages, Target, ListChecks, Eye, Save, ArrowRight, ArrowLeft,
  Plus, X, Trash2, Loader2, CheckCircle2, AlertTriangle, Info, UploadCloud, Image as ImageIcon,
  Sparkles
} from "lucide-react";
import { GUIDELINES } from "@/lib/upload-guidelines";
import { categories } from "@/lib/categories";

const LANGS = [
  { code: "fa", label: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ru", label: "Русский", flag: "🇷🇺", dir: "ltr" }
];

const STEPS = [
  { id: 1, title: "اطلاعات پایه", sub: "نام، دسته، تصویر", icon: Package, color: "#0078D4" },
  { id: 2, title: "توضیحات چندزبانه", sub: "فارسی، انگلیسی، عربی، روسی", icon: Languages, color: "#107C10" },
  { id: 3, title: "کاربردها و ویژگی‌ها", sub: "نقاط قوت محصول", icon: ListChecks, color: "#F7630C" },
  { id: 4, title: "مشخصات فنی", sub: "جدول کلید-مقدار", icon: Target, color: "#8764B8" },
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

export default function ProductWizard({ initial, isNew = false }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [activeLang, setActiveLang] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [product, setProduct] = useState(function() {
    if (initial) {
      return {
        slug: initial.slug || "",
        series: initial.series || "",
        categoryId: initial.categoryId || "control-valves",
        image: initial.image || "",
        name: ensureML(initial.name),
        short: ensureML(initial.short),
        applications: ensureArrML(initial.applications),
        features: ensureArrML(initial.features),
        specs: Array.isArray(initial.specs) ? initial.specs : []
      };
    }
    return {
      slug: "",
      series: "",
      categoryId: "control-valves",
      image: "",
      name: emptyML(),
      short: emptyML(),
      applications: emptyArrML(),
      features: emptyArrML(),
      specs: []
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

  function addArrItem(key, lang, value) {
    if (!value || !value.trim()) return;
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      if (!clone[key][lang]) clone[key][lang] = [];
      clone[key][lang].push(value.trim());
      return clone;
    });
  }

  function removeArrItem(key, lang, idx) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone[key][lang].splice(idx, 1);
      return clone;
    });
  }

  function addSpec() {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.specs.push({ key: emptyML(), value: emptyML() });
      return clone;
    });
  }

  function updateSpec(idx, side, lang, value) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      if (!clone.specs[idx][side]) clone.specs[idx][side] = emptyML();
      clone.specs[idx][side][lang] = value;
      return clone;
    });
  }

  function removeSpec(idx) {
    setProduct(function(prev) {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.specs.splice(idx, 1);
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

    setBusy(true);
    try {
      const url = isNew ? "/api/products" : "/api/products/" + product.slug;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
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

  return (
    <div className="space-y-6">
      {msg.text && (
        <div
          className="p-4 rounded-xl flex items-center gap-3 text-sm font-black metro-in sticky top-20 z-20"
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

      <div className="wiz-steps">
        {STEPS.map(function(s, i) {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div className={"wiz-line" + (isDone || isActive ? " wiz-line-done" : "")} />}
              <button
                type="button"
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

      <div className="wiz-card">
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
              addArrItem={addArrItem}
              removeArrItem={removeArrItem}
              activeLang={activeLang}
              setActiveLang={setActiveLang}
            />
          )}
          {step === 4 && (
            <Step4
              product={product}
              addSpec={addSpec}
              updateSpec={updateSpec}
              removeSpec={removeSpec}
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

        {step < 5 && (
          <button type="button" onClick={next} className="big-btn big-btn-primary">
            مرحله بعد <ArrowLeft size={18} />
          </button>
        )}
        {step === 5 && (
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
function Step1({ product, updateField, isNew }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef(null);
  const guide = GUIDELINES.productImage;

  async function upload(file) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) updateField("image", data.url);
      else setUploadError(data.error || "خطای آپلود");
    } catch (e) {
      setUploadError("خطای شبکه");
    }
    setUploading(false);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <div className="big-field">
          <div className="big-field-label">
            نامک <span className="big-field-label-req">*</span>
            <Info size={14} style={{ color: "var(--m-text-muted)" }} />
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
          <div className="big-field-hint">شناسه محصول برای مشتریان — مثل PSM-BCV</div>
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
            {categories.map(function(c) {
              return <option key={c.id} value={c.id}>{c.name.fa}</option>;
            })}
          </select>
        </div>
      </div>

      <div>
        <div className="big-field-label" style={{ marginBottom: "12px" }}>
          تصویر محصول
        </div>

        <div
          className="rounded-xl p-3 mb-3 text-xs space-y-1"
          style={{ background: "#FEF9E7", border: "1px solid #F5C518" }}
        >
          <div className="font-black" style={{ color: "#B8850A" }}>
            راهنمای آپلود — {guide.label}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: "#5C6370" }}>
            <div>📐 ابعاد: {guide.dimensions}</div>
            <div>📦 حجم: {guide.maxSize}</div>
            <div>🎨 فرمت: {guide.formats}</div>
            <div>📊 نسبت: {guide.ratio}</div>
          </div>
        </div>

        {product.image ? (
          <div className="relative rounded-xl overflow-hidden group"
            style={{ border: "2px solid #A7F3D0", background: "#ECFDF5" }}>
            <img src={product.image} alt="" className="w-full aspect-square object-contain" />
            <button
              type="button"
              onClick={function() { updateField("image", ""); }}
              className="absolute top-3 left-3 w-10 h-10 rounded-lg grid place-items-center"
              style={{ background: "rgba(232, 17, 35, 0.9)", color: "#FFFFFF" }}
            >
              <X size={16} />
            </button>
            <div
              className="absolute bottom-0 inset-x-0 px-4 py-2 text-xs font-black text-white flex items-center gap-2"
              style={{ background: "linear-gradient(to top, rgba(16, 124, 16, 0.9), transparent)" }}
            >
              <CheckCircle2 size={14} /> آپلود شد
            </div>
          </div>
        ) : (
          <div
            onClick={function() { inputRef.current && inputRef.current.click(); }}
            onDragOver={function(e) { e.preventDefault(); setDragging(true); }}
            onDragLeave={function() { setDragging(false); }}
            onDrop={function(e) {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files && e.dataTransfer.files[0];
              if (f) upload(f);
            }}
            className={"big-dropzone" + (dragging ? " big-dropzone-active" : "")}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={function(e) { upload(e.target.files && e.target.files[0]); }}
            />
            {uploading ? (
              <div>
                <div
                  className="w-20 h-20 rounded-2xl mx-auto grid place-items-center mb-4"
                  style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}
                >
                  <Loader2 size={36} className="animate-spin text-white" />
                </div>
                <div className="font-black text-base mb-1">در حال آپلود...</div>
                <div className="text-xs" style={{ color: "var(--m-text-muted)" }}>لطفاً صبر کنید</div>
              </div>
            ) : (
              <div>
                <div className="big-dropzone-icon">
                  <UploadCloud size={40} />
                </div>
                <div className="font-black text-lg mb-2">تصویر را اینجا رها کنید</div>
                <div className="text-sm mb-3" style={{ color: "var(--m-text-muted)" }}>
                  یا کلیک کنید تا فایل انتخاب شود
                </div>
                <div className="text-xs font-bold" style={{ color: "var(--m-text-soft)" }}>
                  {guide.formats} · حداکثر {guide.maxSize}
                </div>
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <div
            className="mt-3 flex items-center gap-2 text-xs p-3 rounded-lg"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
          >
            <AlertTriangle size={14} /> {uploadError}
          </div>
        )}
      </div>
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
          ۲ تا ۳ جمله که در کارت محصول نمایش داده می‌شود
        </div>
        <textarea
          dir={currentLang.dir}
          value={product.short[activeLang] || ""}
          onChange={function(e) { updateML("short", activeLang, e.target.value); }}
          rows={5}
          className="big-input"
        />
      </div>

      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(0, 120, 212, 0.06)", border: "1px solid rgba(0, 120, 212, 0.2)" }}
      >
        <Sparkles size={20} style={{ color: "#0078D4", flexShrink: 0, marginTop: "2px" }} />
        <div className="text-sm" style={{ color: "var(--m-text-soft)" }}>
          <strong style={{ color: "var(--m-text)" }}>نکته:</strong> هر ۴ زبان را کامل کنید تا سایت شما در جستجوی گوگل بهتر دیده شود.
        </div>
      </div>
    </div>
  );
}

// ================================================================
// STEP 3 - Applications & Features
// ================================================================
function Step3({ product, addArrItem, removeArrItem, activeLang, setActiveLang }) {
  const [appInput, setAppInput] = useState("");
  const [featInput, setFeatInput] = useState("");
  const currentLang = LANGS.find(function(l) { return l.code === activeLang; }) || LANGS[0];

  function handleAppKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addArrItem("applications", activeLang, appInput);
      setAppInput("");
    }
  }
  function handleFeatKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addArrItem("features", activeLang, featInput);
      setFeatInput("");
    }
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

      <div className="big-field">
        <div className="big-field-label">کاربردهای کلیدی در {currentLang.label}</div>
        <div className="big-field-hint">
          مثل: پالایشگاه، پتروشیمی، نیروگاه — بعد از تایپ Enter بزنید
        </div>
        <div className="chip-input-wrap">
          {(product.applications[activeLang] || []).map(function(item, idx) {
            return (
              <span key={idx} className="chip-item">
                {item}
                <button
                  type="button"
                  onClick={function() { removeArrItem("applications", activeLang, idx); }}
                  className="chip-item-remove"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <input
            type="text"
            dir={currentLang.dir}
            value={appInput}
            onChange={function(e) { setAppInput(e.target.value); }}
            onKeyDown={handleAppKey}
            placeholder="تایپ کنید و Enter بزنید..."
            className="chip-input-inner"
          />
        </div>
      </div>

      <div className="big-field">
        <div className="big-field-label">ویژگی‌ها و مزایا در {currentLang.label}</div>
        <div className="big-field-hint">
          مثل: طراحی مطابق IEC 60534، پوشش HVOF، قابلیت Fail-Safe
        </div>
        <div className="chip-input-wrap">
          {(product.features[activeLang] || []).map(function(item, idx) {
            return (
              <span key={idx} className="chip-item" style={{ background: "linear-gradient(135deg, #1B8F1B, #0A5F0A)" }}>
                {item}
                <button
                  type="button"
                  onClick={function() { removeArrItem("features", activeLang, idx); }}
                  className="chip-item-remove"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <input
            type="text"
            dir={currentLang.dir}
            value={featInput}
            onChange={function(e) { setFeatInput(e.target.value); }}
            onKeyDown={handleFeatKey}
            placeholder="تایپ کنید و Enter بزنید..."
            className="chip-input-inner"
          />
        </div>
      </div>
    </div>
  );
}

// ================================================================
// STEP 4 - Specs
// ================================================================
function Step4({ product, addSpec, updateSpec, removeSpec, activeLang, setActiveLang }) {
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

      <div className="flex items-start gap-3 rounded-xl p-4 mb-5"
        style={{ background: "rgba(135, 100, 184, 0.06)", border: "1px solid rgba(135, 100, 184, 0.25)" }}>
        <Info size={20} style={{ color: "#8764B8", flexShrink: 0, marginTop: "2px" }} />
        <div className="text-sm" style={{ color: "var(--m-text-soft)" }}>
          جدول کلید-مقدار بسازید. مثل «سایز» → «1 تا 24 اینچ». در هر زبان می‌توانید جداگانه پر کنید.
        </div>
      </div>

      {product.specs.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: "#F8F9FB", border: "2px dashed var(--m-border-strong)" }}
        >
          <Target size={48} style={{ color: "var(--m-text-muted)", margin: "0 auto 12px" }} />
          <div className="font-black text-lg mb-2">هنوز مشخصه‌ای اضافه نشده</div>
          <div className="text-sm mb-6" style={{ color: "var(--m-text-muted)" }}>
            اولین مشخصه فنی محصول را اضافه کنید
          </div>
          <button type="button" onClick={addSpec} className="big-btn big-btn-primary">
            <Plus size={18} /> افزودن اولین مشخصه
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3 px-3">
            <div className="text-xs font-black" style={{ color: "var(--m-text-muted)" }}>عنوان</div>
            <div className="text-xs font-black" style={{ color: "var(--m-text-muted)" }}>مقدار</div>
          </div>
          {product.specs.map(function(s, idx) {
            return (
              <div key={idx} className="spec-row">
                <input
                  type="text"
                  dir={currentLang.dir}
                  value={(s.key && s.key[activeLang]) || ""}
                  onChange={function(e) { updateSpec(idx, "key", activeLang, e.target.value); }}
                  placeholder="مثل: سایز"
                  className="big-input"
                  style={{ padding: "12px 14px", fontSize: "14px" }}
                />
                <input
                  type="text"
                  dir={currentLang.dir}
                  value={(s.value && s.value[activeLang]) || ""}
                  onChange={function(e) { updateSpec(idx, "value", activeLang, e.target.value); }}
                  placeholder="مثل: 1 تا 24 اینچ"
                  className="big-input"
                  style={{ padding: "12px 14px", fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={function() { removeSpec(idx); }}
                  className="w-11 h-11 rounded-xl grid place-items-center transition"
                  style={{ background: "rgba(232, 17, 35, 0.1)", color: "#E81123" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addSpec}
            className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-4"
            style={{ background: "#F8F9FB", border: "2px dashed var(--m-border-strong)", color: "var(--m-text-soft)" }}
          >
            <Plus size={16} /> افزودن مشخصه جدید
          </button>
        </div>
      )}
    </div>
  );
}

// ================================================================
// STEP 5 - Preview
// ================================================================
function Step5({ product, activeLang, setActiveLang }) {
  const name = product.name[activeLang] || product.name.fa || "";
  const short = product.short[activeLang] || product.short.fa || "";
  const apps = product.applications[activeLang] || [];
  const feats = product.features[activeLang] || [];
  const specs = product.specs.filter(function(s) {
    return s.key && (s.key[activeLang] || s.key.fa);
  });

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

      <div className="rounded-xl p-4 flex items-start gap-3 mb-6"
        style={{ background: "rgba(16, 124, 16, 0.06)", border: "1px solid rgba(16, 124, 16, 0.25)" }}>
        <Eye size={20} style={{ color: "#107C10", flexShrink: 0, marginTop: "2px" }} />
        <div className="text-sm" style={{ color: "var(--m-text-soft)" }}>
          این پیش‌نمایش نحوه نمایش محصول در سایت است. برای ویرایش هر بخش، روی شماره‌ی مرحله در بالا کلیک کنید.
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "2px solid var(--m-border)", boxShadow: "0 8px 32px rgba(20, 22, 27, 0.08)" }}>
        <div className="grid md:grid-cols-2">
          <div className="p-6" style={{ background: "#F8F9FB", borderLeft: "1px solid var(--m-border)" }}>
            {product.image ? (
              <img src={product.image} alt="" className="w-full aspect-square object-contain rounded-xl" />
            ) : (
              <div className="w-full aspect-square rounded-xl grid place-items-center"
                style={{ background: "#FFFFFF", border: "2px dashed var(--m-border-strong)" }}>
                <ImageIcon size={60} style={{ color: "var(--m-text-muted)" }} />
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="inline-block px-3 py-1 rounded-md text-xs font-black mb-3"
              style={{ background: "rgba(201, 149, 13, 0.15)", color: "#B8850A" }}>
              {product.series || "PSM-XXX"}
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ color: "var(--m-text)" }}>
              {name || "—"}
            </h2>
            <p className="text-sm leading-7 mb-5" style={{ color: "var(--m-text-soft)" }}>
              {short || "توضیح کوتاه محصول..."}
            </p>

            {apps.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-black mb-2" style={{ color: "var(--m-text-muted)" }}>کاربردها</div>
                <div className="flex flex-wrap gap-1.5">
                  {apps.map(function(a, i) {
                    return (
                      <span key={i} className="px-2 py-1 rounded-md text-[11px] font-bold"
                        style={{ background: "#F1F3F5", color: "var(--m-text-soft)" }}>
                        {a}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {feats.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-black mb-2" style={{ color: "var(--m-text-muted)" }}>ویژگی‌ها</div>
                <div className="space-y-1.5">
                  {feats.slice(0, 5).map(function(f, i) {
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--m-text-soft)" }}>
                        <CheckCircle2 size={14} style={{ color: "#107C10", flexShrink: 0, marginTop: "2px" }} />
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {specs.length > 0 && (
              <div>
                <div className="text-xs font-black mb-2" style={{ color: "var(--m-text-muted)" }}>
                  مشخصات ({specs.length})
                </div>
                <div className="text-xs rounded-lg overflow-hidden" style={{ border: "1px solid var(--m-border)" }}>
                  {specs.slice(0, 4).map(function(s, i) {
                    const k = s.key[activeLang] || s.key.fa;
                    const v = s.value[activeLang] || s.value.fa;
                    return (
                      <div key={i} className="flex justify-between px-3 py-2 gap-2"
                        style={{ background: i % 2 === 0 ? "transparent" : "#F8F9FB", borderBottom: i < Math.min(specs.length, 4) - 1 ? "1px solid var(--m-border)" : "none" }}>
                        <span style={{ color: "var(--m-text-muted)" }}>{k}</span>
                        <span className="font-bold" style={{ color: "var(--m-text)" }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
                {specs.length > 4 && (
                  <div className="text-[10px] mt-1" style={{ color: "var(--m-text-muted)" }}>
                    و {specs.length - 4} مشخصه دیگر...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
