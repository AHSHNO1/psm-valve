"use client";
import { useState } from "react";
import { Save, Loader2, CheckCircle2, AlertTriangle, Shield, KeyRound, Check } from "lucide-react";

export default function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (form.newPassword !== form.confirm) {
      setMsg({ type: "error", text: "رمز جدید و تأیید آن یکسان نیستند" });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ type: "error", text: "رمز جدید باید حداقل ۶ کاراکتر باشد" });
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
    });
    const data = await res.json();
    if (data.ok) {
      setMsg({ type: "success", text: "✓ رمز عبور با موفقیت تغییر کرد" });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      setMsg({ type: "error", text: data.error || "خطا" });
    }
    setBusy(false);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <form onSubmit={submit} className="lg:col-span-2 metro-card p-6 lg:p-8 metro-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-md grid place-items-center" style={{ background: "linear-gradient(135deg, #EE2435, #B80818)" }}>
            <KeyRound size={24} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <h2 className="font-black text-lg" style={{ color: "var(--m-text)" }}>تغییر رمز عبور</h2>
            <p className="text-xs" style={{ color: "var(--m-text-muted)" }}>
              برای امنیت، هر چند وقت یک‌بار رمز را تغییر دهید
            </p>
          </div>
        </div>

        {msg.text && (
          <div
            className="p-3 rounded-md mb-4 text-sm font-black flex items-center gap-2"
            style={{
              background: msg.type === "success" ? "rgba(16, 124, 16, 0.12)" : "rgba(232, 17, 35, 0.10)",
              border: "1px solid " + (msg.type === "success" ? "#107C10" : "#E81123"),
              color: msg.type === "success" ? "#0A5F0A" : "#C40E1C"
            }}
          >
            {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
          <Field label="رمز عبور فعلی" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          <Field label="رمز عبور جدید" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          <Field label="تکرار رمز جدید" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </div>

        <button type="submit" disabled={busy} className="metro-btn metro-btn-gold w-full mt-6">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          تغییر رمز
        </button>
      </form>

      <div className="space-y-3">
        <div className="rounded-md p-5 metro-in"
          style={{ background: "rgba(0, 120, 212, 0.08)", border: "1px solid rgba(0, 120, 212, 0.25)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={22} style={{ color: "#0078D4" }} />
            <span className="font-black text-sm" style={{ color: "var(--m-text)" }}>وضعیت امنیت</span>
          </div>
          <ul className="space-y-2">
            <Item label="JWT Auth" active />
            <Item label="HttpOnly Cookie" active />
            <Item label="انقضا ۷ روز" active />
            <Item label="مسیر /admin محافظت‌شده" active />
          </ul>
        </div>

        <div className="rounded-md p-5 metro-in" style={{ background: "rgba(255, 185, 0, 0.10)", border: "1px solid rgba(255, 185, 0, 0.35)" }}>
          <div className="font-black text-sm mb-2" style={{ color: "var(--m-text)" }}>نکات امنیتی</div>
          <ul className="text-xs leading-6 space-y-1" style={{ color: "var(--m-text-soft)" }}>
            <li>• از رمزهای پیچیده استفاده کنید</li>
            <li>• رمز را با کسی به اشتراک نگذارید</li>
            <li>• پس از کار، خارج شوید</li>
          </ul>
        </div>
      </div>
    </div>
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

function Item({ label, active }) {
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5" style={{ color: "var(--m-text-soft)" }}>
        {active && <Check size={12} style={{ color: "#107C10" }} />} {label}
      </span>
      <span
        className="text-[10px] px-2 py-0.5 rounded font-black"
        style={{
          background: active ? "rgba(16, 124, 16, 0.15)" : "rgba(232, 17, 35, 0.15)",
          color: active ? "#0A5F0A" : "#C40E1C"
        }}
      >
        {active ? "فعال" : "غیرفعال"}
      </span>
    </li>
  );
}
