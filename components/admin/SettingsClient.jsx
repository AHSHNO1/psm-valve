"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";

export default function SettingsClient({ initial }) {
  const [form, setForm] = useState({
    siteName: (initial && initial.siteName) || "",
    tagline: (initial && initial.tagline) || "",
    phone: (initial && initial.phone) || "",
    phone2: (initial && initial.phone2) || "",
    mobile: (initial && initial.mobile) || "",
    fax: (initial && initial.fax) || "",
    email: (initial && initial.email) || "",
    address: (initial && initial.address) || "",
    siteUrl: (initial && initial.siteUrl) || "",
    workingHours: (initial && initial.workingHours) || "",
    mapLat: (initial && initial.mapLat) || "34.0917",
    mapLng: (initial && initial.mapLng) || "49.6892"
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  function update(k, v) {
    setForm(Object.assign({}, form, { [k]: v }));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) notify("تنظیمات ذخیره شد");
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
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
            <Icon name="settings" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">تنظیمات سایت</div>
            <div className="page-header-sub">اطلاعات پایه و تماس</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {/* Section: Brand identity */}
      <SectionCard icon="palette" color="#C9950D" title="هویت برند">
        <Field label="نام شرکت" value={form.siteName} onChange={function(v) { update("siteName", v); }} />
        <Field label="شعار (Tagline)" value={form.tagline} onChange={function(v) { update("tagline", v); }} />
        <Field label="آدرس سایت" value={form.siteUrl} onChange={function(v) { update("siteUrl", v); }} dir="ltr" placeholder="https://psmvalve.com" />
      </SectionCard>

      {/* Section: Contact */}
      <SectionCard icon="mail" color="#0078D4" title="راه‌های تماس">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Field label="تلفن ۱" value={form.phone} onChange={function(v) { update("phone", v); }} dir="ltr" />
          <Field label="تلفن ۲" value={form.phone2} onChange={function(v) { update("phone2", v); }} dir="ltr" />
          <Field label="موبایل" value={form.mobile} onChange={function(v) { update("mobile", v); }} dir="ltr" />
          <Field label="فکس" value={form.fax} onChange={function(v) { update("fax", v); }} dir="ltr" />
          <Field label="ایمیل" value={form.email} onChange={function(v) { update("email", v); }} dir="ltr" />
        </div>
        <Field label="ساعات کاری" value={form.workingHours} onChange={function(v) { update("workingHours", v); }} />
      </SectionCard>

      {/* Section: Address */}
      <SectionCard icon="building" color="#107C10" title="آدرس">
        <Field label="آدرس کامل" value={form.address} onChange={function(v) { update("address", v); }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="عرض جغرافیایی (Lat)" value={form.mapLat} onChange={function(v) { update("mapLat", v); }} dir="ltr" />
          <Field label="طول جغرافیایی (Lng)" value={form.mapLng} onChange={function(v) { update("mapLng", v); }} dir="ltr" />
        </div>
      </SectionCard>

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </div>
  );
}

function SectionCard({ icon, color, title, children }) {
  return (
    <div className="anim-in" style={{
      background: "#FFFFFF",
      border: "1px solid #D1D5DB",
      borderRadius: 12,
      padding: 16,
      marginBottom: 14
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        paddingBottom: 12, marginBottom: 14,
        borderBottom: "1px solid #E5E7EB"
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, " + color + ", " + color + "cc)",
          color: "#FFFFFF", flexShrink: 0
        }}>
          <Icon name={icon} size={17} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#1A1D21" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, dir, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="form-label">{label}</label>
      <input
        type="text"
        dir={dir}
        value={value}
        onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}
