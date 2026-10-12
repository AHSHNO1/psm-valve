"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";

const SECURITY_CHECKS = [
  { label: "احراز هویت JWT", active: true },
  { label: "کوکی HttpOnly", active: true },
  { label: "انقضای توکن ۷ روز", active: true },
  { label: "محافظت از مسیر /admin", active: true },
  { label: "آپلود امن با محدودیت", active: true },
  { label: "نقش‌های کاربری چندگانه", active: false }
];

export default function SecurityClient() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      notify("رمز جدید و تأیید آن یکسان نیستند", true);
      return;
    }
    if (form.newPassword.length < 6) {
      notify("رمز جدید باید حداقل ۶ کاراکتر باشد", true);
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
      if (data.ok) {
        notify("رمز عبور با موفقیت تغییر کرد");
        setForm({ currentPassword: "", newPassword: "", confirm: "" });
      } else notify(data.error || "خطا", true);
    } catch (e) { notify("خطای شبکه", true); }
    setBusy(false);
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
                <label className="form-label">رمز عبور فعلی</label>
                <input type="password" value={form.currentPassword}
                  onChange={function(e) { setForm(Object.assign({}, form, { currentPassword: e.target.value })); }}
                  className="form-input" required />
              </div>
              <div>
                <label className="form-label">رمز عبور جدید (حداقل ۶ کاراکتر)</label>
                <input type="password" value={form.newPassword}
                  onChange={function(e) { setForm(Object.assign({}, form, { newPassword: e.target.value })); }}
                  className="form-input" required minLength={6} />
              </div>
              <div>
                <label className="form-label">تکرار رمز جدید</label>
                <input type="password" value={form.confirm}
                  onChange={function(e) { setForm(Object.assign({}, form, { confirm: e.target.value })); }}
                  className="form-input" required />
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
            {SECURITY_CHECKS.map(function(c, i) {
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
                    {c.active ? "فعال" : "غیرفعال"}
                  </span>
                </div>
              );
            })}
          </div>

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
                <strong>نکات امنیتی:</strong> از رمزهای پیچیده استفاده کنید، رمز را با کسی به اشتراک نگذارید، و پس از کار از پنل خارج شوید. در صورت فراموشی رمز، فایل <code style={{ background: "rgba(255,255,255,0.6)", padding: "1px 5px", borderRadius: 4 }}>data/admin.json</code> را ویرایش کنید.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
