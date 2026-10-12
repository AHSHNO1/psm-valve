"use client";
import { useState, useRef } from "react";
import { Save, Loader2, CheckCircle2, AlertTriangle, UploadCloud, X, Palette, Instagram, Linkedin, Send, Phone, Image as ImageIcon } from "lucide-react";

export default function BrandingManager({ initial }) {
  const [branding, setBranding] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState({});

  function update(patch) {
    setBranding({ ...branding, ...patch });
  }

  function updateSocial(key, val) {
    update({ socialLinks: { ...branding.socialLinks, [key]: val } });
  }

  async function upload(field, file, type) {
    if (!file) return;
    setUploading({ ...uploading, [field]: true });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type || "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) update({ [field]: data.url });
    } catch (e) {}
    setUploading({ ...uploading, [field]: false });
  }

  async function save() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding)
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ type: "success", text: "✓ ذخیره شد" });
        setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
      } else setMsg({ type: "error", text: "خطا" });
    } catch (e) { setMsg({ type: "error", text: "خطای شبکه" }); }
    setBusy(false);
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

      <div className="grid md:grid-cols-2 gap-5">
        <UploadField
          label="لوگوی اصلی"
          hint="300×80 پیکسل · PNG شفاف"
          value={branding.logo}
          onChange={function(url) { update({ logo: url }); }}
          onClear={function() { update({ logo: "" }); }}
          upload={function(f) { upload("logo", f); }}
          uploading={uploading.logo}
          aspect="4/1"
        />

        <UploadField
          label="لوگوی روشن (برای پس‌زمینه تیره)"
          hint="300×80 پیکسل · PNG شفاف سفید"
          value={branding.logoLight}
          onChange={function(url) { update({ logoLight: url }); }}
          onClear={function() { update({ logoLight: "" }); }}
          upload={function(f) { upload("logoLight", f); }}
          uploading={uploading.logoLight}
          aspect="4/1"
        />

        <UploadField
          label="فاویکون"
          hint="64×64 پیکسل · PNG یا ICO"
          value={branding.favicon}
          onChange={function(url) { update({ favicon: url }); }}
          onClear={function() { update({ favicon: "" }); }}
          upload={function(f) { upload("favicon", f); }}
          uploading={uploading.favicon}
          aspect="1"
        />

        <div className="metro-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} style={{ color: "#B8850A" }} />
            <span className="font-black text-sm" style={{ color: "var(--m-text)" }}>رنگ‌های برند</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="big-field-label">رنگ اصلی</div>
              <div className="flex gap-2">
                <input type="color" value={branding.primaryColor || "#D4A017"}
                  onChange={function(e) { update({ primaryColor: e.target.value }); }}
                  className="w-14 h-12 rounded-lg cursor-pointer border-0" />
                <input type="text" dir="ltr" value={branding.primaryColor || "#D4A017"}
                  onChange={function(e) { update({ primaryColor: e.target.value }); }}
                  className="big-input" style={{ flex: 1 }} />
              </div>
            </div>
            <div>
              <div className="big-field-label">رنگ ثانویه</div>
              <div className="flex gap-2">
                <input type="color" value={branding.secondaryColor || "#C0C0C0"}
                  onChange={function(e) { update({ secondaryColor: e.target.value }); }}
                  className="w-14 h-12 rounded-lg cursor-pointer border-0" />
                <input type="text" dir="ltr" value={branding.secondaryColor || "#C0C0C0"}
                  onChange={function(e) { update({ secondaryColor: e.target.value }); }}
                  className="big-input" style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metro-card p-5">
        <div className="font-black text-sm mb-4" style={{ color: "var(--m-text)" }}>شبکه‌های اجتماعی</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <SocialField icon={Instagram} label="اینستاگرام" value={branding.socialLinks?.instagram || ""} onChange={function(v) { updateSocial("instagram", v); }} />
          <SocialField icon={Linkedin} label="لینکدین" value={branding.socialLinks?.linkedin || ""} onChange={function(v) { updateSocial("linkedin", v); }} />
          <SocialField icon={Send} label="تلگرام" value={branding.socialLinks?.telegram || ""} onChange={function(v) { updateSocial("telegram", v); }} />
          <SocialField icon={Phone} label="واتساپ" value={branding.socialLinks?.whatsapp || ""} onChange={function(v) { updateSocial("whatsapp", v); }} />
        </div>
      </div>

      <div className="sticky bottom-4 metro-card p-4 flex gap-3">
        <button type="button" onClick={save} disabled={busy} className="big-btn big-btn-green" style={{ flex: 1 }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          ذخیره تغییرات
        </button>
      </div>
    </div>
  );
}

function UploadField({ label, hint, value, onClear, upload, uploading, aspect }) {
  const inputRef = useRef(null);
  return (
    <div className="metro-card p-5">
      <div className="big-field-label">{label}</div>
      <div className="big-field-hint">{hint}</div>
      {value ? (
        <div className="relative rounded-xl overflow-hidden mt-2"
          style={{ background: "#F8F9FB", border: "2px solid #A7F3D0", aspectRatio: aspect === "1" ? "1" : "auto", padding: aspect === "1" ? "0" : "12px" }}>
          <img src={value} alt="" className={aspect === "1" ? "w-full h-full object-contain" : "w-full h-20 object-contain"} />
          <button type="button" onClick={onClear}
            className="absolute top-2 left-2 w-8 h-8 rounded-lg grid place-items-center"
            style={{ background: "rgba(232,17,35,0.9)", color: "#FFFFFF" }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <div onClick={function() { inputRef.current && inputRef.current.click(); }}
          className="big-dropzone mt-2" style={{ padding: "24px 16px" }}>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={function(e) { upload(e.target.files && e.target.files[0]); }} />
          {uploading ? (
            <Loader2 size={28} className="animate-spin mx-auto" style={{ color: "#E0A81A" }} />
          ) : (
            <>
              <UploadCloud size={28} style={{ color: "#B8850A", margin: "0 auto 6px" }} />
              <div className="text-[11px] font-black">کلیک کنید</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SocialField({ icon: Icon, label, value, onChange }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: "var(--m-text-soft)" }} />
        <span className="text-xs font-black" style={{ color: "var(--m-text-soft)" }}>{label}</span>
      </div>
      <input type="text" dir="ltr" value={value} onChange={function(e) { onChange(e.target.value); }}
        placeholder={"https://" + label.toLowerCase() + ".com/..."}
        className="big-input" style={{ fontSize: "13px", padding: "10px 14px" }} />
    </div>
  );
}
