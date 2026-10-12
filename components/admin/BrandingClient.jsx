"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";

export default function BrandingClient({ initial }) {
  const [form, setForm] = useState({
    logo: (initial && initial.logo) || "",
    logoLight: (initial && initial.logoLight) || "",
    favicon: (initial && initial.favicon) || "",
    primaryColor: (initial && initial.primaryColor) || "#D4A017",
    secondaryColor: (initial && initial.secondaryColor) || "#C0C0C0",
    socialLinks: (initial && initial.socialLinks) || {}
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  function update(patch) {
    setForm(Object.assign({}, form, patch));
  }

  function updateSocial(key, val) {
    update({ socialLinks: Object.assign({}, form.socialLinks, { [key]: val }) });
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) notify("تنظیمات برند ذخیره شد");
      else notify("خطا در ذخیره", true);
    } catch (e) {
      notify("خطای شبکه", true);
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #B4009E, #8A007A)" }}>
            <Icon name="palette" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">هویت برند</div>
            <div className="page-header-sub">لوگو، رنگ‌ها و شبکه‌های اجتماعی</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12
      }}>
        <UploadTile
          label="لوگوی اصلی"
          hint="300×80 پیکسل · PNG یا SVG"
          value={form.logo}
          onChange={function(url) { update({ logo: url }); }}
          onClear={function() { update({ logo: "" }); }}
        />

        <UploadTile
          label="لوگوی روشن (پس‌زمینه تیره)"
          hint="300×80 پیکسل · PNG شفاف سفید"
          value={form.logoLight}
          onChange={function(url) { update({ logoLight: url }); }}
          onClear={function() { update({ logoLight: "" }); }}
        />

        <UploadTile
          label="فاویکون"
          hint="64×64 پیکسل · PNG یا ICO"
          value={form.favicon}
          onChange={function(url) { update({ favicon: url }); }}
          onClear={function() { update({ favicon: "" }); }}
        />

        <ColorTile
          label="رنگ اصلی"
          value={form.primaryColor}
          onChange={function(v) { update({ primaryColor: v }); }}
        />

        <ColorTile
          label="رنگ ثانویه"
          value={form.secondaryColor}
          onChange={function(v) { update({ secondaryColor: v }); }}
        />
      </div>

      <div style={{ marginTop: 20 }} className="anim-in">
        <h3 style={{
          fontSize: 14, fontWeight: 900, color: "#1A1D21",
          marginBottom: 10, display: "flex", alignItems: "center", gap: 6
        }}>
          <Icon name="globe" size={16} /> شبکه‌های اجتماعی
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 10
        }}>
          <SocialField label="اینستاگرام" value={form.socialLinks.instagram || ""} onChange={function(v) { updateSocial("instagram", v); }} placeholder="https://instagram.com/..." />
          <SocialField label="لینکدین" value={form.socialLinks.linkedin || ""} onChange={function(v) { updateSocial("linkedin", v); }} placeholder="https://linkedin.com/..." />
          <SocialField label="تلگرام" value={form.socialLinks.telegram || ""} onChange={function(v) { updateSocial("telegram", v); }} placeholder="https://t.me/..." />
          <SocialField label="واتساپ" value={form.socialLinks.whatsapp || ""} onChange={function(v) { updateSocial("whatsapp", v); }} placeholder="https://wa.me/..." />
          <SocialField label="یوتیوب" value={form.socialLinks.youtube || ""} onChange={function(v) { updateSocial("youtube", v); }} placeholder="https://youtube.com/..." />
          <SocialField label="آپارات" value={form.socialLinks.aparat || ""} onChange={function(v) { updateSocial("aparat", v); }} placeholder="https://aparat.com/..." />
          <SocialField label="بله" value={form.socialLinks.bale || ""} onChange={function(v) { updateSocial("bale", v); }} placeholder="https://ble.ir/..." />
          <SocialField label="روبیکا" value={form.socialLinks.rubika || ""} onChange={function(v) { updateSocial("rubika", v); }} placeholder="https://rubika.ir/..." />
          <SocialField label="ایتا" value={form.socialLinks.eitaa || ""} onChange={function(v) { updateSocial("eitaa", v); }} placeholder="https://eitaa.com/..." />
        </div>
      </div>

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </div>
  );
}

function UploadTile({ label, hint, value, onChange, onClear }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) onChange(data.url);
    } catch (e) {}
    setUploading(false);
  }

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #D1D5DB",
      borderRadius: 12,
      padding: 14
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#1A1D21" }}>{label}</div>
        {value && (
          <button type="button" onClick={onClear} className="act-btn act-btn-delete" title="حذف">
            <Icon name="trash" />
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#7A8290", marginBottom: 10 }}>{hint}</div>

      {value ? (
        <div style={{
          background: "#F4F5F7",
          border: "1px solid #D1D5DB",
          borderRadius: 10,
          padding: 16,
          textAlign: "center"
        }}>
          <img src={value} alt="" style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }} />
        </div>
      ) : (
        <div
          onClick={function() { inputRef.current && inputRef.current.click(); }}
          onDragOver={function(e) { e.preventDefault(); setDragging(true); }}
          onDragLeave={function() { setDragging(false); }}
          onDrop={function(e) {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
          }}
          style={{
            background: dragging ? "#FFF9E6" : "#F4F5F7",
            border: "2px dashed " + (dragging ? "#C9950D" : "#D1D5DB"),
            borderRadius: 10,
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={function(e) { upload(e.target.files[0]); }} />
          {uploading ? (
            <Icon name="loader" size={24} />
          ) : (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                margin: "0 auto 8px",
                display: "grid", placeItems: "center",
                background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                color: "#FFFFFF"
              }}>
                <Icon name="upload" size={20} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#1A1D21" }}>کلیک کنید یا فایل را رها کنید</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ColorTile({ label, value, onChange }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #D1D5DB",
      borderRadius: 12,
      padding: 14
    }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#1A1D21", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value} onChange={function(e) { onChange(e.target.value); }}
          style={{ width: 52, height: 44, borderRadius: 10, cursor: "pointer", border: "1px solid #D1D5DB", padding: 2 }} />
        <input type="text" dir="ltr" value={value} onChange={function(e) { onChange(e.target.value); }}
          className="form-input" style={{ flex: 1, fontFamily: "monospace" }} />
      </div>
    </div>
  );
}

function SocialField({ label, value, onChange, placeholder }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #D1D5DB",
      borderRadius: 12,
      padding: 12
    }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#1A1D21", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="text"
        dir="ltr"
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
        className="form-input"
        style={{ fontSize: 12 }}
      />
    </div>
  );
}
