"use client";
import { useState } from "react";
import { Save, Loader2, CheckCircle2, Building2, Phone, Mail, MapPin } from "lucide-react";

export default function SettingsForm({ initial }) {
  const [form, setForm] = useState({
    siteName: initial.siteName || "",
    tagline: initial.tagline || "",
    phone: initial.phone || "",
    email: initial.email || "",
    address: initial.address || ""
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.ok) {
      setMsg("✓ تنظیمات ذخیره شد");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("خطا در ذخیره");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {msg && (
        <div
          className="rounded-md p-4 flex items-center gap-2 text-sm font-black metro-in"
          style={{ background: "rgba(16, 124, 16, 0.12)", border: "1px solid #107C10", color: "#0A5F0A" }}
        >
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      <div className="metro-in">
        <h2 className="metro-section-title">اطلاعات شرکت</h2>
        <div className="metro-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md grid place-items-center" style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)" }}>
              <Building2 size={22} style={{ color: "#FFFFFF" }} />
            </div>
            <div>
              <div className="font-black" style={{ color: "var(--m-text)" }}>هویت برند</div>
              <div className="text-xs" style={{ color: "var(--m-text-muted)" }}>نام و شعار شرکت در سایت</div>
            </div>
          </div>
          <Field label="نام شرکت" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
          <Field label="شعار (Tagline)" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
      </div>

      <div className="metro-in" style={{ animationDelay: "80ms" }}>
        <h2 className="metro-section-title">راه‌های تماس</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-md p-5" style={{ background: "rgba(0, 120, 212, 0.08)", border: "1px solid rgba(0, 120, 212, 0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Phone size={18} style={{ color: "#0078D4" }} />
              <span className="font-black text-sm" style={{ color: "var(--m-text)" }}>تلفن</span>
            </div>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              dir="ltr"
              className="metro-input"
            />
          </div>

          <div className="rounded-md p-5" style={{ background: "rgba(0, 183, 195, 0.08)", border: "1px solid rgba(0, 183, 195, 0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Mail size={18} style={{ color: "#008A93" }} />
              <span className="font-black text-sm" style={{ color: "var(--m-text)" }}>ایمیل</span>
            </div>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              dir="ltr"
              className="metro-input"
            />
          </div>
        </div>
      </div>

      <div className="metro-in" style={{ animationDelay: "160ms" }}>
        <h2 className="metro-section-title">آدرس</h2>
        <div className="rounded-md p-6" style={{ background: "rgba(16, 124, 16, 0.08)", border: "1px solid rgba(16, 124, 16, 0.25)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} style={{ color: "#107C10" }} />
            <span className="font-black text-sm" style={{ color: "var(--m-text)" }}>آدرس کامل</span>
          </div>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="metro-input"
          />
        </div>
      </div>

      <div className="sticky bottom-4 rounded-md p-4 flex gap-3 metro-in"
        style={{ background: "#FFFFFF", border: "1px solid var(--m-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.12)" }}>
        <button type="submit" disabled={busy} className="metro-btn metro-btn-gold flex-1">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          ذخیره تغییرات
        </button>
      </div>
    </form>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-black mb-1.5 block" style={{ color: "var(--m-text-soft)" }}>{label}</span>
      <input {...props} className="metro-input" />
    </label>
  );
}
