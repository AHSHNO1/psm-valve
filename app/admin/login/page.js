"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
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
            <h1 id="admin-login-title">خوش آمدید</h1>
            <p className="admin-login-description">برای ورود به پنل مدیریت، اطلاعات حساب خود را وارد کنید.</p>

            <form onSubmit={submit} className="admin-login-form">
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
            </form>

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
