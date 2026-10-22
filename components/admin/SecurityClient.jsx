"use client";
import { useEffect, useState } from "react";
import { Icon } from "./AdminIcons";
import { useToast, Toast } from "./useToast";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { FormSection, FormGrid, Field } from "./EditorPanel";
import { useUnsavedChanges } from "./useUnsavedChanges";

// چک‌لیست امنیتی از وضعیت واقعیِ سرور ساخته می‌شود (فقط boolean).
function buildChecks(status) {
  const configured = Boolean(status);
  return [
    { label: "کلید JWT (JWT_SECRET) تنظیم شده", active: configured && status.jwtSecretConfigured },
    { label: "رمز مدیر با hash قوی ذخیره شده", active: configured && status.adminCredentialConfigured },
    { label: "اعتبارهای ضامنِ توسعه غیرفعال است", active: configured && status.insecureDevCredentialsAllowed === false },
    { label: "کوکی امن (Secure در پروداکشن)", active: configured && status.cookieSecure },
    { label: "محافظت از مسیر /admin (middleware)", active: configured && status.middlewareGuardsAdmin },
    { label: "آپلود امن با محدودیت نرخ", active: configured && status.uploadGuarded },
    { label: "نقش نویسنده با دسترسی محدود", active: configured && status.authorRoleRestricted }
  ];
}

function tokenMeta(status) {
  if (!status || status.tokenAgeDays === null || status.tokenAgeDays === undefined) return null;
  const age = Math.round(Number(status.tokenAgeDays) * 10) / 10;
  const remaining = Math.round(Number(status.tokenExpiresInDays ?? 0) * 10) / 10;
  return "توکن فعلی: " + age + " روز از صدور، " + remaining + " روز تا انقضا";
}

export default function SecurityClient() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const { notify, toast } = useToast();
  const hasInput = Boolean(form.currentPassword || form.newPassword || form.confirm);
  useUnsavedChanges(hasInput);

  useEffect(function () {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (data) { if (active && data && data.ok) setStatus(data.status); })
      .catch(function () { if (active) notify("دریافت وضعیت امنیتی ناموفق بود", true); });
    return function () { active = false; };
  }, [notify]);

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      notify("رمز جدید و تأیید آن یکسان نیستند", true);
      return;
    }
    if (form.newPassword.length < 12) {
      notify("رمز جدید باید حداقل ۱۲ کاراکتر و حداکثر ۷۲ بایت باشد", true);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        notify("رمز عبور با موفقیت تغییر کرد");
        setForm({ currentPassword: "", newPassword: "", confirm: "" });
      } else notify(data.error || "خطا", true);
    } catch (error) {
      notify("ارتباط با سرور برقرار نشد؛ رمز تغییر نکرد", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #E81123, #B80818)" }}>
            <Icon name="lock" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">امنیت</div>
            <div className="page-header-sub">تغییر رمز و وضعیت امنیتی حساب مدیر</div>
          </div>
        </div>
        {hasInput && <span className="chip chip-gold">فرم تکمیل نشده</span>}
      </div>

      <Toast toast={toast} />

      <EditorPanel
        title="تغییر رمز عبور"
        subtitle="از رمز منحصربه‌فرد و طولانی استفاده کنید؛ حداقل ۱۲ کاراکتر و حداکثر ۷۲ بایت."
        icon={<Icon name="lock" size={17} />}
      >
        <form onSubmit={submit}>
          <FormSection>
            <FormGrid>
              <Field label="رمز عبور فعلی" wide>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={function (e) { setForm(Object.assign({}, form, { currentPassword: e.target.value })); }}
                  className="form-input"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="رمز عبور جدید">
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={function (e) { setForm(Object.assign({}, form, { newPassword: e.target.value })); }}
                  className="form-input"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                />
              </Field>
              <Field label="تکرار رمز جدید">
                <input
                  type="password"
                  value={form.confirm}
                  onChange={function (e) { setForm(Object.assign({}, form, { confirm: e.target.value })); }}
                  className="form-input"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                />
              </Field>
            </FormGrid>
          </FormSection>
          <div className="save-bar">
            <button type="submit" disabled={busy} className="btn-add" style={{ justifyContent: "center" }}>
              <Icon name="save" /> {busy ? "در حال ذخیره..." : "تغییر رمز"}
            </button>
          </div>
        </form>
      </EditorPanel>

      <EditorPanel
        title="وضعیت امنیتی"
        subtitle="این موارد از تنظیمات واقعی سرور خوانده می‌شوند."
        icon={<Icon name="check" size={17} />}
        badge={<span className="chip chip-green">پایش زنده</span>}
      >
        <div className="security-checks">
          {buildChecks(status).map(function (c, i) {
            return (
              <div key={i} className="security-check">
                <span className="security-check-label">{c.label}</span>
                <span className={"chip " + (c.active ? "chip-green" : "chip-gray")}>
                  {c.active ? "فعال" : (status ? "غیرفعال" : "—")}
                </span>
              </div>
            );
          })}
        </div>

        {tokenMeta(status) && (
          <div className="security-token-note">{tokenMeta(status)}</div>
        )}

        <div className="wizard-note" style={{ marginTop: 14 }}>
          <Icon name="info" size={16} />
          <div>
            <strong>نکات امنیتی:</strong> از رمز منحصربه‌فرد و طولانی استفاده کنید، آن را با کسی به اشتراک نگذارید و پس از کار از پنل خارج شوید. برای راه‌اندازی اولیه، متغیرهای امن محیطی را تنظیم کنید.
          </div>
        </div>
      </EditorPanel>
    </div>
  );
}
