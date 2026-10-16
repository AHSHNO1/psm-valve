// ============================================================
// LOADING SKELETON — ابزار سایزینگ (سنگینترین صفحهٔ سایت)
// فقط برای همین سگمنت تعریف شده تا وضعیت ۴۰۴ صفحات دیگر
// (محصولات، مقالات، خدمات) خراب نشود.
// ============================================================

export default function SizingLoading() {
  return (
    <section className="container-x py-10 sm:py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری ابزار سایزینگ...</span>

      {/* سربرگ صفحه */}
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 96, height: 26, borderRadius: 999, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: "min(420px, 72%)", height: 40, borderRadius: 12, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: "min(560px, 90%)", height: 16, borderRadius: 8 }} />
      </div>

      {/* پنل محاسبه + نتایج */}
      <div className="skeleton-grid">
        {Array.from({ length: 3 }).map(function (_, i) {
          return (
            <div key={i} className="card-glass skeleton-card">
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 18 }} />
              <div className="skeleton" style={{ width: "70%", height: 18, borderRadius: 8, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: "100%", height: 12, borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "88%", height: 12, borderRadius: 6 }} />
            </div>
          );
        })}
      </div>
    </section>
  );
}