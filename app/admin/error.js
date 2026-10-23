"use client";

// ============================================================
// ERROR BOUNDARY — پنل مدیریت
// بهجای صفحهٔ سفید، خطا با پیام خوانا و دکمهٔ تلاش مجدد نشان داده میشود.
// ============================================================

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          padding: 32,
          borderRadius: 16,
          border: "1px solid rgba(128,128,128,.35)",
          background: "rgba(128,128,128,.06)"
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
        <h1 style={{ fontSize: 20, margin: "0 0 6px" }}>خطا در پنل مدیریت</h1>
        <p style={{ opacity: 0.75, margin: "0 0 6px" }}>
          این بخش به‌درستی بارگذاری نشد. اطلاعات ذخیره‌شدهٔ شما تغییر نکرده است.
        </p>
        <p style={{ opacity: 0.55, margin: "0 0 20px", fontSize: 13 }} dir="ltr">
          Something went wrong in the admin panel. Saved data is unaffected.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              background: "#F5C518",
              color: "#1F2124",
              border: 0,
              borderRadius: 10,
              padding: "9px 22px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            تلاش مجدد
          </button>
          <Link
            href="/admin"
            style={{
              border: "1px solid rgba(128,128,128,.5)",
              borderRadius: 10,
              padding: "9px 22px",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    </div>
  );
}
