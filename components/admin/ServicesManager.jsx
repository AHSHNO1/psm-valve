"use client";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertTriangle, Save, Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings, Eye, EyeOff } from "lucide-react";

const LANGS = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }
];

const ICONS = { Cog, Gauge, Wrench, Circle, Flame, Truck, Package, Settings };
const ICON_KEYS = ["Cog", "Gauge", "Wrench", "Circle", "Flame", "Truck", "Package", "Settings"];

function blankService() {
  return {
    slug: "service-" + Date.now().toString(36),
    icon: "Cog",
    name: { fa: "", en: "", ar: "", ru: "" },
    short: { fa: "", en: "", ar: "", ru: "" },
    active: true,
    order: 99
  };
}

export default function ServicesManager({ initial }) {
  const [items, setItems] = useState(initial || []);
  const [editing, setEditing] = useState(null);
  const [lang, setLang] = useState("fa");
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function save(list) {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: list })
      });
      const data = await res.json();
      if (data.ok) { setItems(list); notify("✓ ذخیره شد", false); }
      else notify("خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
  }

  function add() {
    const s = blankService();
    setItems(items.concat([s]));
    setEditing(s.slug);
  }

  function remove(idx) {
    if (!confirm("این خدمت حذف شود؟")) return;
    save(items.filter(function(_, i) { return i !== idx; }));
  }

  function toggleActive(idx) {
    const list = items.slice();
    list[idx] = Object.assign({}, list[idx], { active: !list[idx].active });
    save(list);
  }

  function update(idx, patch) {
    const list = items.slice();
    list[idx] = Object.assign({}, list[idx], patch);
    setItems(list);
  }

  return (
    <div className="space-y-6">
      {msg.text && (
        <div className="p-3 rounded-lg flex items-center gap-2 text-sm font-black metro-in"
          style={{
            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: "1px solid " + (msg.type === "success" ? "#A7F3D0" : "#FECACA"),
            color: msg.type === "success" ? "#065F46" : "#991B1B"
          }}>
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm" style={{ color: "var(--m-text-soft)" }}>
          {items.length} خدمت — در /fa/services نمایش داده می‌شوند
        </p>
        <button type="button" onClick={add} className="big-btn big-btn-primary" style={{ padding: "12px 20px", fontSize: "13px" }}>
          <Plus size={16} /> خدمت جدید
        </button>
      </div>

      <div className="lang-tabs">
        {LANGS.map(function(l) {
          return (
            <button key={l.code} type="button" onClick={function() { setLang(l.code); }}
              className={"lang-tab" + (lang === l.code ? " lang-tab-active" : "")}>
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(function(s, i) {
          const isEditing = editing === s.slug;
          const IconComp = ICONS[s.icon] || Cog;
          return (
            <div key={s.slug} className="metro-card p-5 metro-in" style={{ animationDelay: (i * 40) + "ms" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-lg grid place-items-center"
                  style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
                  <IconComp size={20} style={{ color: "#FFFFFF" }} />
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={function() { toggleActive(i); }}
                    className="w-7 h-7 rounded-md grid place-items-center"
                    style={{ background: s.active ? "rgba(16,124,16,0.15)" : "rgba(123,132,148,0.15)", color: s.active ? "#0A5F0A" : "var(--m-text-muted)" }}>
                    {s.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button type="button" onClick={function() { remove(i); }}
                    className="w-7 h-7 rounded-md grid place-items-center"
                    style={{ background: "rgba(232,17,35,0.1)", color: "#E81123" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input type="text" value={s.name[lang] || ""} onChange={function(e) { var p = {}; p.name = Object.assign({}, s.name); p.name[lang] = e.target.value; update(i, p); }}
                    placeholder="عنوان خدمت" className="big-input" style={{ padding: "10px 14px", fontSize: "13px" }} />
                  <textarea rows={2} value={s.short[lang] || ""} onChange={function(e) { var p = {}; p.short = Object.assign({}, s.short); p.short[lang] = e.target.value; }}
                    placeholder="توضیح کوتاه" className="big-input" style={{ padding: "10px 14px", fontSize: "12px" }} />
                  <div className="grid grid-cols-4 gap-1">
                    {ICON_KEYS.map(function(ic) {
                      const I = ICONS[ic];
                      return (
                        <button key={ic} type="button" onClick={function() { update(i, { icon: ic }); }}
                          className="aspect-square rounded-lg grid place-items-center transition"
                          style={{
                            background: s.icon === ic ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "var(--m-bg-2)",
                            color: s.icon === ic ? "#FFFFFF" : "var(--m-text-soft)"
                          }}>
                          <I size={16} />
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={function() { save(items); setEditing(null); }}
                    className="w-full py-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1"
                    style={{ background: "linear-gradient(135deg, #1B8F1B, #0A5F0A)", color: "#FFFFFF" }}>
                    <Save size={12} /> ذخیره
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-black text-sm mb-2 leading-tight" style={{ color: "var(--m-text)" }}>
                    {s.name[lang] || s.name.fa || "بدون عنوان"}
                  </div>
                  <p className="text-xs leading-5 line-clamp-3 mb-3" style={{ color: "var(--m-text-muted)" }}>
                    {s.short[lang] || s.short.fa || "—"}
                  </p>
                  <button type="button" onClick={function() { setEditing(s.slug); }}
                    className="w-full py-2 rounded-lg text-[11px] font-black"
                    style={{ background: "rgba(0, 120, 212, 0.12)", color: "#0078D4" }}>
                    ویرایش
                  </button>
                </>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-span-full metro-card p-12 text-center metro-in">
            <Cog size={40} style={{ color: "var(--m-text-muted)", margin: "0 auto 12px" }} />
            <p className="font-black mb-2" style={{ color: "var(--m-text)" }}>هنوز خدمتی اضافه نشده</p>
            <button type="button" onClick={add} className="big-btn big-btn-primary mt-3">
              <Plus size={16} /> افزودن اولین خدمت
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
