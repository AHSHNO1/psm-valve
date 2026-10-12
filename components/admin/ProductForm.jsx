"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, X, Plus, Trash2, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Info
} from "lucide-react";
import UploadDropzone from "./UploadDropzone";
import { categories } from "@/lib/categories";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

function ensureObj(val) {
  if (typeof val === "object" && val !== null) return val;
  return { fa: val || "", en: val || "", ar: val || "", ru: val || "" };
}

function ensureArr(val) {
  if (Array.isArray(val)) return val;
  return [];
}

export default function ProductForm({ initial, isNew = false }) {
  const router = useRouter();
  const [product, setProduct] = useState(() => {
    if (initial) {
      return {
        ...initial,
        name: ensureObj(initial.name),
        short: ensureObj(initial.short),
        applications: LANGS.reduce((acc, l) => {
          acc[l.code] = initial.applications?.[l.code] || [];
          return acc;
        }, {}),
        features: LANGS.reduce((acc, l) => {
          acc[l.code] = initial.features?.[l.code] || [];
          return acc;
        }, {}),
        specs: Array.isArray(initial.specs) ? initial.specs : []
      };
    }
    return {
      slug: "",
      series: "",
      categoryId: "control-valves",
      image: "",
      name: { fa: "", en: "", ar: "", ru: "" },
      short: { fa: "", en: "", ar: "", ru: "" },
      applications: { fa: [], en: [], ar: [], ru: [] },
      features: { fa: [], en: [], ar: [], ru: [] },
      specs: []
    };
  });

  const [activeLang, setActiveLang] = useState("fa");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const updateField = (path, value) => {
    const clone = JSON.parse(JSON.stringify(product));
    const keys = path.split(".");
    let cur = clone;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = value;
    setProduct(clone);
  };

  const updateMultiLang = (field, lang, value) => {
    const clone = JSON.parse(JSON.stringify(product));
    if (!clone[field]) clone[field] = {};
    clone[field][lang] = value;
    setProduct(clone);
  };

  const addArrayItem = (field, lang) => {
    const clone = JSON.parse(JSON.stringify(product));
    if (!clone[field]) clone[field] = {};
    if (!clone[field][lang]) clone[field][lang] = [];
    clone[field][lang].push("");
    setProduct(clone);
  };

  const updateArrayItem = (field, lang, idx, value) => {
    const clone = JSON.parse(JSON.stringify(product));
    clone[field][lang][idx] = value;
    setProduct(clone);
  };

  const removeArrayItem = (field, lang, idx) => {
    const clone = JSON.parse(JSON.stringify(product));
    clone[field][lang].splice(idx, 1);
    setProduct(clone);
  };

  const addSpec = () => {
    const clone = JSON.parse(JSON.stringify(product));
    clone.specs.push({ key: { fa: "", en: "", ar: "", ru: "" }, value: { fa: "", en: "", ar: "", ru: "" } });
    setProduct(clone);
  };

  const updateSpec = (idx, side, lang, value) => {
    const clone = JSON.parse(JSON.stringify(product));
    clone.specs[idx][side][lang] = value;
    setProduct(clone);
  };

  const removeSpec = (idx) => {
    const clone = JSON.parse(JSON.stringify(product));
    clone.specs.splice(idx, 1);
    setProduct(clone);
  };

  const save = async () => {
    setMsg({ type: "", text: "" });

    if (!product.slug.trim()) {
      setMsg({ type: "error", text: "نامک (slug) الزامی است" });
      return;
    }
    if (!product.series.trim()) {
      setMsg({ type: "error", text: "کد سری الزامی است" });
      return;
    }
    if (!product.name.fa.trim() || !product.name.en.trim()) {
      setMsg({ type: "error", text: "نام محصول در فارسی و انگلیسی الزامی است" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/products" : `/api/products/${product.slug}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ type: "success", text: "✓ ذخیره شد" });
        setTimeout(() => router.push("/admin/products"), 800);
      } else {
        setMsg({ type: "error", text: data.error || "خطا" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {msg.text && (
        <div
          className="flex items-center gap-2 text-sm p-3 rounded-xl sticky top-2 z-10"
          style={{
            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: msg.type === "success" ? "1px solid #A7F3D0" : "1px solid #FECACA",
            color: msg.type === "success" ? "#065F46" : "#991B1B"
          }}
        >
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Basic info */}
      <Section title="اطلاعات پایه" icon="1">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="نامک (slug) *"
            hint="فقط حروف انگلیسی، اعداد و خط تیره — مثل: ball-control-valve"
            dir="ltr"
            value={product.slug}
            onChange={(e) => updateField("slug", e.target.value.replace(/[^a-z0-9-]/g, ""))}
            disabled={!isNew}
          />
          <Input
            label="کد سری *"
            hint="مثل: PSM-BCV"
            dir="ltr"
            value={product.series}
            onChange={(e) => updateField("series", e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label className="block">
            <span className="text-xs font-bold mb-1.5 block" style={{ color: "#3D4451" }}>دسته‌بندی *</span>
            <select
              value={product.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
              style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name.fa}</option>
              ))}
            </select>
          </label>
        </div>

        <UploadDropzone
          type="images"
          guidelineKey="productImage"
          value={product.image || ""}
          onChange={(url) => updateField("image", url)}
          label="تصویر محصول"
          accept="image/*"
        />
      </Section>

      {/* Multilingual content */}
      <Section title="نام و توضیحات (چندزبانه)" icon="2">
        <div className="flex gap-1 p-1 rounded-xl mb-4 overflow-x-auto" style={{ background: "#F1F3F5" }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setActiveLang(l.code)}
              className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition"
              style={{
                background: activeLang === l.code ? "#FFFFFF" : "transparent",
                color: activeLang === l.code ? "#1A1D21" : "#5C6370",
                boxShadow: activeLang === l.code ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <Input
          label="نام محصول"
          hint={activeLang === "fa" || activeLang === "en" ? "الزامی برای این زبان" : ""}
          value={product.name[activeLang] || ""}
          onChange={(e) => updateMultiLang("name", activeLang, e.target.value)}
          dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
        />

        <label className="block mt-4">
          <span className="text-xs font-bold mb-1.5 block" style={{ color: "#3D4451" }}>توضیح کوتاه</span>
          <textarea
            value={product.short[activeLang] || ""}
            onChange={(e) => updateMultiLang("short", activeLang, e.target.value)}
            rows={3}
            dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
            className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
            style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
          />
        </label>
      </Section>

      {/* Applications */}
      <Section title="کاربردها" icon="3">
        <p className="text-xs mb-3" style={{ color: "#5C6370" }}>
          صنایعی که این محصول در آن‌ها استفاده می‌شود
        </p>
        <ListEditor
          items={product.applications[activeLang] || []}
          onAdd={() => addArrayItem("applications", activeLang)}
          onUpdate={(idx, val) => updateArrayItem("applications", activeLang, idx, val)}
          onRemove={(idx) => removeArrayItem("applications", activeLang, idx)}
          placeholder="مثل: پالایشگاه"
          dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
        />
      </Section>

      {/* Features */}
      <Section title="ویژگی‌ها و مزایا" icon="4">
        <p className="text-xs mb-3" style={{ color: "#5C6370" }}>
          نقاط قوت و ویژگی‌های کلیدی محصول
        </p>
        <ListEditor
          items={product.features[activeLang] || []}
          onAdd={() => addArrayItem("features", activeLang)}
          onUpdate={(idx, val) => updateArrayItem("features", activeLang, idx, val)}
          onRemove={(idx) => removeArrayItem("features", activeLang, idx)}
          placeholder="مثل: طراحی مطابق IEC 60534"
          dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
        />
      </Section>

      {/* Specs */}
      <Section title="مشخصات فنی" icon="5">
        <p className="text-xs mb-3" style={{ color: "#5C6370" }}>
          جدول ویژگی‌های فنی (کلید-مقدار)
        </p>
        <div className="space-y-3">
          {product.specs.map((s, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "#F8F9FA", border: "1px solid rgba(26, 29, 33, 0.1)" }}>
              <div className="grid sm:grid-cols-2 gap-2 mb-2">
                <input
                  value={s.key?.[activeLang] || ""}
                  onChange={(e) => updateSpec(i, "key", activeLang, e.target.value)}
                  placeholder="عنوان (مثل: سایز)"
                  dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.15)" }}
                />
                <input
                  value={s.value?.[activeLang] || ""}
                  onChange={(e) => updateSpec(i, "value", activeLang, e.target.value)}
                  placeholder="مقدار (مثل: 1 تا 24 اینچ)"
                  dir={activeLang === "fa" || activeLang === "ar" ? "rtl" : "ltr"}
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.15)" }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSpec(i)}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: "#DC2626" }}
              >
                <Trash2 size={12} /> حذف این ردیف
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSpec}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: "#F1F3F5", border: "2px dashed rgba(26, 29, 33, 0.2)", color: "#5C6370" }}
          >
            <Plus size={16} /> افزودن مشخصه
          </button>
        </div>
      </Section>

      {/* Actions */}
      <div className="sticky bottom-4 flex gap-3 rounded-2xl p-4 shadow-xl"
        style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.15)" }}>
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transition"
          style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          ذخیره محصول
        </button>
        <button
          onClick={() => router.push("/admin/products")}
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
        >
          انصراف
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.12)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg grid place-items-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}>
            {icon}
          </div>
          <span className="font-black text-base">{title}</span>
        </div>
        <ChevronDown size={18} className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(26, 29, 33, 0.08)" }}>
          <div className="pt-4 space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function Input({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-bold mb-1.5 block" style={{ color: "#3D4451" }}>{label}</span>
      {hint && <div className="text-[11px] mb-1 flex items-center gap-1" style={{ color: "#9CA3AF" }}><Info size={10} /> {hint}</div>}
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30 disabled:opacity-60"
        style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
      />
    </label>
  );
}

function ListEditor({ items, onAdd, onUpdate, onRemove, placeholder, dir }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            placeholder={placeholder}
            dir={dir}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
            style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="w-11 rounded-xl grid place-items-center shrink-0"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: "#F1F3F5", border: "2px dashed rgba(26, 29, 33, 0.2)", color: "#5C6370" }}
      >
        <Plus size={14} /> افزودن
      </button>
    </div>
  );
}
