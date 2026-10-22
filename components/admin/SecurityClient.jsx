"use client";
import { useEffect, useState } from "react";
import { Icon } from "./AdminIcons";
import { useToast, Toast } from "./useToast";

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
  return "توکن فعلی: " + status.tokenAgeDays + " روز از صدور، " +
    (status.tokenExpiresInDays ?? 0) + " روز تا انقضا";
}

export default function SecurityClient() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const { notify, toast } = useToast();

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
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #E81123, #B80818)" }}>
            <Icon name="lock" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">امنیت</div>
            <div className="page-header-sub">تغییر رمز و وضعیت امنیتی</div>
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12
      }}>
        {/* Password change form */}
        <div className="anim-in" style={{
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          padding: 16,
          gridColumn: "span 2"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingBottom: 12, marginBottom: 14,
            borderBottom: "1px solid #E5E7EB"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #E81123, #B80818)",
              color: "#FFFFFF"
            }}>
              <Icon name="lock" size={17} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#1A1D21" }}>
              تغییر رمز عبور
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label" htmlFor="current-password">رمز عبور فعلی</label>
                <input type="password" value={form.currentPassword}
                  onChange={function(e) { setForm(Object.assign({}, form, { currentPassword: e.target.value })); }}
                  className="form-input" id="current-password" autoComplete="current-password" required />
              </div>
              <div>
                <label className="form-label" htmlFor="new-password">رمز عبور جدید (حداقل ۱۲ کاراکتر، حداکثر ۷۲ بایت)</label>
                <input type="password" value={form.newPassword}
                  onChange={function(e) { setForm(Object.assign({}, form, { newPassword: e.target.value })); }}
                  className="form-input" id="new-password" autoComplete="new-password" required minLength={12} maxLength={72} />
              </div>
              <div>
                <label className="form-label" htmlFor="confirm-password">تکرار رمز جدید</label>
                <input type="password" value={form.confirm}
                  onChange={function(e) { setForm(Object.assign({}, form, { confirm: e.target.value })); }}
                  className="form-input" id="confirm-password" autoComplete="new-password" required minLength={12} maxLength={72} />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-add" style={{ width: "100%", justifyContent: "center", padding: "11px" }}>
              <Icon name="save" /> {busy ? "در حال ذخیره..." : "تغییر رمز"}
            </button>
          </form>
        </div>

        {/* Security status */}
        <div className="anim-in" style={{
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          padding: 16,
          gridColumn: "span 2"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingBottom: 12, marginBottom: 14,
            borderBottom: "1px solid #E5E7EB"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #107C10, #0A5F0A)",
              color: "#FFFFFF"
            }}>
              <Icon name="check" size={17} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#1A1D21" }}>
              وضعیت امنیتی
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8
          }}>
            {buildChecks(status).map(function(c, i) {
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#F4F5F7",
                  borderRadius: 9,
                  gap: 8
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D21" }}>{c.label}</span>
                  <span className={"chip " + (c.active ? "chip-green" : "chip-gray")}>
                    {c.active ? "فعال" : (status ? "غیرفعال" : "—")}
                  </span>
                </div>
              );
            })}
          </div>

          {tokenMeta(status) && (
            <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "#4A5568" }}>
              {tokenMeta(status)}
            </div>
          )}

          <div style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "#FFF9E6",
            border: "1px solid #E0A81A"
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Icon name="info" size={16} />
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8A6508", lineHeight: 1.7 }}>
                <strong>نکات امنیتی:</strong> از رمز منحصربه‌فرد و طولانی استفاده کنید، آن را با کسی به اشتراک نگذارید و پس از کار از پنل خارج شوید. برای راه‌اندازی اولیه، متغیرهای امن محیطی را تنظیم کنید.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
