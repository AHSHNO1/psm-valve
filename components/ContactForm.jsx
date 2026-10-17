"use client";
import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useDictionary } from "./Providers";

export default function ContactForm() {
  const { t, locale } = useDictionary();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [captcha, setCaptcha] = useState(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(function() {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = async function(preserveError) {
    setCaptcha(null);
    setCaptchaToken("");
    setCaptchaInput("");
    if (!preserveError) setCaptchaError(false);
    try {
      const response = await fetch("/api/contact/challenge", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Security check unavailable");
      setCaptcha(data.challenge);
      setCaptchaToken(data.challenge.token);
      setError("");
      if (status === "error") setStatus("idle");
    } catch (reason) {
      setStatus("error");
      setError(reason.message);
    }
  };

  const update = function(k) {
    return function(e) { setForm(Object.assign({}, form, { [k]: e.target.value })); };
  };

  const submit = async function(e) {
    e.preventDefault();
    setError("");
    setCaptchaError(false);

    // Validate captcha
    if (!captcha || !captchaToken || !captchaInput.trim()) {
      setCaptchaError(true);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({}, form, {
          captchaToken: captchaToken,
          captchaInput: captchaInput
        }))
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", message: "", website: "" });
        setCaptchaInput("");
      } else {
        if (data.code === "invalid_challenge") {
          setStatus("idle");
          setCaptchaError(true);
          refreshCaptcha(true);
          return;
        }
        setStatus("error");
        setError(data.code === "rate_limited" ? LL.rateLimited : (data.error || "Error"));
      }
    } catch (err) {
      setStatus("error");
      setError("Network error");
    }
  };

  const L = {
    fa: {
      captchaLabel: "تأیید امنیتی — حاصل عبارت زیر را وارد کنید",
      captchaPlaceholder: "پاسخ را وارد کنید",
      captchaWrong: "پاسخ نادرست است. لطفاً دوباره تلاش کنید.",
      rateLimited: "تعداد ارسال‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.",
      refresh: "تغییر تصویر"
    },
    en: {
      captchaLabel: "Security check — solve the equation below",
      captchaPlaceholder: "Enter answer",
      captchaWrong: "Wrong answer. Please try again.",
      rateLimited: "Too many messages. Please try again later.",
      refresh: "Refresh"
    },
    ar: {
      captchaLabel: "التحقق الأمني — حل المعادلة أدناه",
      captchaPlaceholder: "أدخل الإجابة",
      captchaWrong: "إجابة خاطئة. حاول مرة أخرى.",
      rateLimited: "طلبات كثيرة. حاول مرة أخرى لاحقاً.",
      refresh: "تحديث"
    },
    ru: {
      captchaLabel: "Проверка безопасности — решите уравнение ниже",
      captchaPlaceholder: "Введите ответ",
      captchaWrong: "Неверный ответ. Попробуйте снова.",
      rateLimited: "Слишком много сообщений. Попробуйте позже.",
      refresh: "Обновить"
    }
  };
  const LL = L[locale] || L.en;

  if (status === "success") {
    return (
      <div className="card-glass p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto grid place-items-center mb-4"
          style={{ background: "var(--glow)", color: "var(--gold)" }}>
          <CheckCircle2 size={32} />
        </div>
        <h3 className="font-black text-lg mb-2" style={{ color: "var(--text)" }}>
          {t.contact && t.contact.successTitle || "پیام شما ارسال شد"}
        </h3>
        <p className="text-sm" style={{ color: "var(--text-soft)" }}>
          {t.contact && t.contact.successDesc || "به‌زودی با شما تماس خواهیم گرفت."}
        </p>
        <button
          onClick={function() {
            setStatus("idle");
            refreshCaptcha();
          }}
          className="btn-outline mt-6 text-sm"
        >
          {t.contact && t.contact.sendAnother || "ارسال پیام جدید"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-glass p-6 sm:p-8 space-y-5">
      <h3 className="font-black text-lg mb-2" style={{ color: "var(--gold)" }}>
        {t.common.sendMessage}
      </h3>

      <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off"
            value={form.website} onChange={update("website")} />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold mb-2 block" style={{ color: "var(--text-soft)" }}>
          {t.contact.name} *
        </span>
        <input
          required
          type="text"
          value={form.name}
          onChange={update("name")}
          className="input-field"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold mb-2 block" style={{ color: "var(--text-soft)" }}>
            {t.contact.email} *
          </span>
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            className="input-field"
            dir="ltr"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold mb-2 block" style={{ color: "var(--text-soft)" }}>
            {t.contact.phone}
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            className="input-field"
            dir="ltr"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold mb-2 block" style={{ color: "var(--text-soft)" }}>
          {t.contact.message} *
        </span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={update("message")}
          className="input-field resize-none"
        />
      </label>

      {/* Captcha */}
      <div className="rounded-xl p-4"
        style={{
          background: captchaError ? "rgba(232, 17, 35, 0.08)" : "var(--bg-soft)",
          border: "1px solid " + (captchaError ? "#E81123" : "var(--border)")
        }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} style={{ color: "var(--gold)" }} />
          <span className="text-xs font-black" style={{ color: "var(--text-soft)" }}>
            {LL.captchaLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Captcha question */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg select-none"
            style={{
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF",
              minWidth: "120px",
              justifyContent: "center"
            }}>
            <span className="text-lg font-black tracking-wider"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {captcha ? captcha.a + " " + captcha.op + " " + captcha.b : "?"}
            </span>
            <span className="text-lg font-black">= ?</span>
          </div>

          {/* Answer input */}
          <input
            type="number"
            required
            value={captchaInput}
            onChange={function(e) { setCaptchaInput(e.target.value); setCaptchaError(false); }}
            placeholder={LL.captchaPlaceholder}
            className="input-field flex-1"
            disabled={!captchaToken}
            style={{ padding: "12px 14px" }}
          />

          {/* Refresh */}
          <button
            type="button"
            onClick={refreshCaptcha}
            aria-label={LL.refresh}
            title={LL.refresh}
            className="w-11 h-11 rounded-xl grid place-items-center transition-all hover:scale-105"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-soft)" }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {captchaError && (
          <div className="flex items-center gap-1.5 text-xs mt-2 font-bold"
            style={{ color: "#E81123" }}>
            <AlertTriangle size={12} /> {LL.captchaWrong}
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !captchaToken}
        className="btn-gold w-full justify-center disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t.contact && t.contact.sending || "در حال ارسال..."}
          </>
        ) : (
          <>
            <Send size={18} /> {t.contact.send}
          </>
        )}
      </button>
    </form>
  );
}
