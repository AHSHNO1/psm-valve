"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
  UserRound
} from "lucide-react";

// ============================================================
// فرم ورود پنل + جریان بازیابی دسترسی:
// «فراموشی رمز» لینک یک‌بارمصرف بازنشانی به ایمیل ثبتشده میفرستد و
// بازکردن /admin/login?reset=<token> فرم انتخاب رمز جدید را نشان میدهد.
// ============================================================

export default function AdminLoginForm({ resetToken = "" }) {
  const router = useRouter();
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        router.push(data.role === "author" ? "/admin/author" : "/admin");
        router.refresh();
      } else {
        setError(data.error || "ورود انجام نشد. اطلاعات واردشده را بررسی کنید.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const submitRecover = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setMode("sent");
      } else {
        setError(data.error || "درخواست بازیابی انجام نشد.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (newPassword.length < 12) {
      setError("رمز عبور باید حداقل ۱۲ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setMode("done");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "بازنشانی رمز انجام نشد.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page" dir="rtl">
      <div className="admin-login-frame">
        <section className="admin-login-form-panel" aria-labelledby="admin-login-title">
          <div className="admin-login-mobile-brand" aria-label="PSM Valve">
            <span className="admin-login-mark">PSM</span>
            <span className="admin-login-mobile-name">PETRO SAZEH MIHAN</span>
          </div>

          <div className="admin-login-form-content">
            <div className="admin-login-eyebrow">
              <span className="admin-login-eyebrow-dot" />
              دسترسی امن مدیران
            </div>

            {mode === "login" && (
              <>
                <h1 id="admin-login-title">خوش آمدید</h1>
                <p className="admin-login-description">برای ورود به پنل مدیریت، اطلاعات حساب خود را وارد کنید.</p>

                <form onSubmit={submitLogin} className="admin-login-form">
                  <label className="admin-login-label" htmlFor="admin-username">نام کاربری</label>
                  <div className="admin-login-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                      id="admin-username"
                      type="text"
                      value={form.username}
                      onChange={(event) => setForm({ ...form, username: event.target.value })}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                      autoFocus
                      placeholder="نام کاربری خود را وارد کنید"
                    />
                  </div>

                  <label className="admin-login-label" htmlFor="admin-password">رمز عبور</label>
                  <div className="admin-login-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      autoComplete="current-password"
                      required
                      placeholder="رمز عبور خود را وارد کنید"
                    />
                    <button
                      type="button"
                      className="admin-login-password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {error && (
                    <div className="admin-login-error" role="alert">
                      <AlertTriangle size={17} aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" className="admin-login-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="admin-login-spinner" />
                        در حال بررسی اطلاعات...
                      </>
                    ) : (
                      <>
                        ورود به پنل
                        <ArrowLeft size={18} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-login-forgot"
                    onClick={() => switchMode("recover")}
                  >
                    <KeyRound size={14} aria-hidden="true" />
                    نام کاربری یا رمز عبور را فراموش کردهاید؟
                  </button>
                </form>
              </>
            )}

            {mode === "recover" && (
              <>
                <h1 id="admin-login-title">بازیابی دسترسی</h1>
                <p className="admin-login-description">
                  ایمیل ثبتشدهٔ مدیر را وارد کنید؛ لینک بازنشانی رمز و نام کاربری برایتان ارسال میشود.
                </p>

                <form onSubmit={submitRecover} className="admin-login-form">
                  <label className="admin-login-label" htmlFor="admin-recover-email">ایمیل</label>
                  <div className="admin-login-input-wrap" dir="ltr">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="admin-recover-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                      autoFocus
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <div className="admin-login-error" role="alert">
                      <AlertTriangle size={17} aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" className="admin-login-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="admin-login-spinner" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        ارسال لینک بازیابی
                        <Mail size={18} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <button type="button" className="admin-login-forgot" onClick={() => switchMode("login")}>
                    <ArrowRight size={14} aria-hidden="true" />
                    بازگشت به ورود
                  </button>
                </form>
              </>
            )}

            {mode === "sent" && (
              <>
                <h1 id="admin-login-title">بررسی کنید ایمیلتان را</h1>
                <p className="admin-login-description">
                  اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی ارسال شده است.
                </p>
                <div className="admin-login-note" role="status">
                  <MailCheck size={17} aria-hidden="true" />
                  <span>
                    لینک بازنشانی تا ۱۵ دقیقه معتبر است و فقط یک بار قابل استفاده است.
                    اگر ایمیل را نمیبینید، پوشهٔ Spam یا Junk را هم بررسی کنید.
                  </span>
                </div>
                <div className="admin-login-alt-actions">
                  <button type="button" className="admin-login-forgot" onClick={() => switchMode("login")}>
                    <ArrowRight size={14} aria-hidden="true" />
                    بازگشت به ورود
                  </button>
                  <button type="button" className="admin-login-forgot" onClick={() => switchMode("recover")}>
                    ارسال دوباره
                  </button>
                </div>
              </>
            )}

            {mode === "reset" && (
              <>
                <h1 id="admin-login-title">رمز جدید</h1>
                <p className="admin-login-description">رمز عبور تازهٔ خود را انتخاب کنید.</p>

                <form onSubmit={submitReset} className="admin-login-form">
                  <label className="admin-login-label" htmlFor="admin-new-password">رمز عبور جدید</label>
                  <div className="admin-login-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="admin-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      autoFocus
                      placeholder="حداقل ۱۲ کاراکتر"
                    />
                    <button
                      type="button"
                      className="admin-login-password-toggle"
                      onClick={() => setShowNewPassword((visible) => !visible)}
                      aria-label={showNewPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                      aria-pressed={showNewPassword}
                    >
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className="admin-login-field-hint">رمز عبور باید حداقل ۱۲ کاراکتر باشد.</p>

                  <label className="admin-login-label" htmlFor="admin-confirm-password">تکرار رمز جدید</label>
                  <div className="admin-login-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="admin-confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      placeholder="تکرار رمز عبور جدید"
                    />
                  </div>

                  {error && (
                    <div className="admin-login-error" role="alert">
                      <AlertTriangle size={17} aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" className="admin-login-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="admin-login-spinner" />
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        ثبت رمز جدید
                        <KeyRound size={18} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {mode === "done" && (
              <>
                <h1 id="admin-login-title">رمز بازنشانی شد</h1>
                <p className="admin-login-description">حالا میتوانید با رمز جدید وارد پنل شوید.</p>
                <div className="admin-login-note" role="status">
                  <CircleCheck size={17} aria-hidden="true" />
                  <span>رمز عبور با موفقیت تغییر کرد. لینک بازیابی نیز باطل شده است.</span>
                </div>
                <button
                  type="button"
                  className="admin-login-submit"
                  style={{ marginTop: 18 }}
                  onClick={() => switchMode("login")}
                >
                  ورود به پنل
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
              </>
            )}

            <div className="admin-login-secure-note">
              <ShieldCheck size={16} aria-hidden="true" />
              اتصال شما با محافظت احراز هویت امن شده است.
            </div>
          </div>

          <footer className="admin-login-credit">
            طراحی و توسعه توسط <strong>دپارتمان فناوری اطلاعات (IT)</strong>
            <span>پترو سازه میهن</span>
          </footer>
        </section>

        <aside className="admin-login-brand-panel" aria-label="معرفی پترو سازه میهن">
          <div className="admin-login-brand-grid" aria-hidden="true" />
          <div className="admin-login-orbit admin-login-orbit-one" aria-hidden="true" />
          <div className="admin-login-orbit admin-login-orbit-two" aria-hidden="true" />
          <div className="admin-login-brand-content">
            <div className="admin-login-brand-lockup">
              <span className="admin-login-mark admin-login-mark-large">PSM</span>
              <div>
                <div className="admin-login-brand-name">PETRO SAZEH MIHAN</div>
                <div className="admin-login-brand-caption">INDUSTRIAL CONTROL VALVES</div>
              </div>
            </div>

            <div className="admin-login-brand-copy">
              <span className="admin-login-brand-kicker">پنل مدیریت محتوا</span>
              <h2>مدیریت یکپارچه،<br /><span>برای مهندسی دقیق‌تر.</span></h2>
              <p>محتوا، محصولات و ارتباط با مشتریان را از یک فضای امن و متمرکز مدیریت کنید.</p>
            </div>

            <div className="admin-login-brand-status">
              <span className="admin-login-status-icon"><ShieldCheck size={19} /></span>
              <span>
                <strong>فضای مدیریتی امن</strong>
                <small>دسترسی فقط برای کاربران مجاز</small>
              </span>
              <span className="admin-login-status-dot" aria-label="فعال" />
            </div>
          </div>
          <div className="admin-login-brand-footer">
            <span>PSM VALVE</span>
            <span>ENGINEERED FOR INDUSTRY</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
