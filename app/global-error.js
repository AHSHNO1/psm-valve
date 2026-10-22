"use client";

// ============================================================
// GLOBAL ERROR — آخرین خط دفاعی (جایگزین صفحهٔ سفید مرورگر)
// ============================================================

export default function GlobalError({ reset }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F1114",
          color: "#F1F3F5",
          fontFamily: "Vazirmatn, system-ui, sans-serif"
        }}
      >
        <main style={{ textAlign: "center", padding: 24, maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>مشکلی پیش آمد</h1>
          <p style={{ color: "#9CA3AF", margin: "0 0 20px" }}>
            Something went wrong while loading this page. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#F5C518",
              color: "#1F2124",
              border: 0,
              borderRadius: 10,
              padding: "10px 28px",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            تلاش مجدد / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
