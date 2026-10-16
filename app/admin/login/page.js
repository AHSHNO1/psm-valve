"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) {
        router.push(data.role === "author" ? "/admin/author" : "/admin");
        router.refresh();
      } else {
        setError(data.error || "خطا");
      }
    } catch {
      setError("خطای شبکه");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative metro tiles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 right-10 w-40 h-40 metro-blue rounded-md" />
        <div className="absolute top-32 right-56 w-24 h-24 metro-amber rounded-md" />
        <div className="absolute bottom-20 left-10 w-32 h-32 metro-purple rounded-md" />
        <div className="absolute bottom-40 left-48 w-20 h-20 metro-green rounded-md" />
        <div className="absolute top-1/3 left-1/3 w-16 h-16 metro-gold rounded-md" />
        <div className="absolute bottom-1/4 right-1/3 w-28 h-28 metro-red rounded-md" />
      </div>

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-lg p-8 lg:p-10 metro-in"
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid rgba(20, 22, 27, 0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(20, 22, 27, 0.15)"
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-lg mx-auto grid place-items-center mb-4"
            style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", boxShadow: "0 8px 24px rgba(201, 149, 13, 0.4)" }}
          >
            <ShieldCheck size={36} style={{ color: "#FFFFFF" }} />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--m-text)" }}>ورود به پنل</h1>
          <p className="text-sm" style={{ color: "var(--m-text-muted)" }}>
            پترو سازه میهن
          </p>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-black mb-2 block" style={{ color: "var(--m-text-soft)" }}>
            نام کاربری
          </span>
          <div className="relative">
            <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--m-text-muted)" }} />
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoComplete="username"
              className="metro-input"
              style={{ paddingRight: "44px" }}
            />
          </div>
        </label>

        <label className="block mb-6">
          <span className="text-xs font-black mb-2 block" style={{ color: "var(--m-text-soft)" }}>
            رمز عبور
          </span>
          <div className="relative">
            <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--m-text-muted)" }} />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
              className="metro-input"
              style={{ paddingRight: "44px" }}
            />
          </div>
        </label>

        {error && (
          <div
            className="flex items-center gap-2 text-sm p-3 rounded-md mb-4"
            style={{ background: "rgba(232, 17, 35, 0.10)", border: "1px solid #E81123", color: "#C40E1C" }}
          >
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="metro-btn metro-btn-gold w-full"
          style={{ padding: "14px", fontSize: "15px" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> در حال ورود...
            </>
          ) : (
            "ورود"
          )}
        </button>

      </form>
    </div>
  );
}
