"use client";

import { ClipboardList } from "lucide-react";

const LABELS = {
  fa: {
    series: "سری",
    features: "ویژگی‌ها",
    options: "آپشن‌ها",
    generalData: "مشخصات فنی",
    applications: "کاربردها",
    clients: "برخی از مشتریان ما",
    empty: "اطلاعات فنی این محصول به‌زودی تکمیل می‌شود."
  },
  en: {
    series: "Series",
    features: "Features",
    options: "Options",
    generalData: "General Data",
    applications: "Applications",
    clients: "Some of Our Clients",
    empty: "Technical information for this product will be added soon."
  },
  ar: {
    series: "سلسلة",
    features: "الميزات",
    options: "الخيارات",
    generalData: "البيانات العامة",
    applications: "التطبيقات",
    clients: "بعض عملائنا",
    empty: "سيتم استكمال المعلومات الفنية لهذا المنتج قريباً."
  },
  ru: {
    series: "Серия",
    features: "Особенности",
    options: "Опции",
    generalData: "Общие данные",
    applications: "Применение",
    clients: "Некоторые наши клиенты",
    empty: "Техническая информация об этом продукте скоро появится."
  }
};

function Section({ title, children }) {
  return (
    <section className="psm-spec__section">
      <h2 className="psm-spec__section-title">{title}</h2>
      {children}
    </section>
  );
}

function normalizeDigits(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit) % 10)
  );
}

export default function ProductTechnicalSpecifications({
  title,
  series,
  description,
  features = [],
  options = [],
  specifications = [],
  applications = [],
  clients = [],
  emptyMessage,
  language = "en"
}) {
  const locale = LABELS[language] ? language : "en";
  const labels = LABELS[locale];
  const rtl = locale === "fa" || locale === "ar";
  const seriesNumber = normalizeDigits(series || "").match(/\d+/g)?.join("") || "";
  const titleNumbers = normalizeDigits(title || "").replace(/\D/g, "");
  const shouldAppendSeries = Boolean(series && (!seriesNumber || !titleNumbers.includes(seriesNumber)));
  const formattedSeries = locale === "en"
    ? `${series} ${labels.series}`
    : `${labels.series} ${series}`;
  const sections = [
    { id: "features", label: labels.features, rows: features, type: "list" },
    { id: "options", label: labels.options, rows: options, type: "list" },
    { id: "specifications", label: labels.generalData, rows: specifications, type: "specifications" },
    { id: "applications", label: labels.applications, rows: applications, type: "list" },
    { id: "clients", label: labels.clients, rows: clients, type: "clients" }
  ].filter((section) => section.rows.length > 0);

  return (
    <article className="psm-spec" dir={rtl ? "rtl" : "ltr"} lang={locale}>
      <header className="psm-spec__header">
        <div className="psm-spec__eyebrow">
          <span className="psm-spec__eyebrow-mark" />
          PSM {labels.series}
          {series && <span className="psm-spec__series">{series}</span>}
        </div>
        <h1 className="psm-spec__title">{title}</h1>
        {shouldAppendSeries && <p className="psm-spec__series-note">{formattedSeries}</p>}
        <div className="psm-spec__accent" aria-hidden="true" />
        {description && <p className="psm-spec__description">{description}</p>}
      </header>

      <div className="psm-spec__sections">
        {sections.map((section) => (
          <Section key={section.id} title={section.label}>
            <div className="psm-spec__section-inner">
              {section.type === "specifications" ? (
                <dl className="psm-spec__rows psm-spec__data">
                  {section.rows.map((row, rowIndex) => (
                    <div className="psm-spec__data-row" key={`${row.id}-${rowIndex}`}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : section.type === "clients" ? (
                <div className="psm-spec__clients">
                  {section.rows.map((item, rowIndex) => <span key={`${rowIndex}-${item}`}>{item}</span>)}
                </div>
              ) : (
                <div className="psm-spec__rows">
                  {section.rows.map((item, rowIndex) => (
                    <div className="psm-spec__row" key={`${rowIndex}-${item}`}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        ))}
      </div>
      {sections.length === 0 && (
        <div className="psm-spec__empty" role="status">
          <span className="psm-spec__empty-icon"><ClipboardList size={18} /></span>
          <span>{emptyMessage || labels.empty}</span>
        </div>
      )}

      <style jsx global>{`
        .psm-spec {
          --psm-surface: var(--bg-card, #fff);
          --psm-surface-soft: var(--bg-soft, #eef2f6);
          --psm-text: var(--text, #1a1d21);
          --psm-muted: var(--text-soft, #3d4451);
          --psm-border: var(--border, rgba(26, 29, 33, 0.15));
          --psm-accent: var(--gold, #b8860b);
          width: 100%;
          margin: 0 auto;
          padding: 0;
          color: var(--psm-text);
          font-size: 14px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }
        .psm-spec *, .psm-spec *::before, .psm-spec *::after { box-sizing: border-box; }
        .psm-spec__header {
          margin-bottom: 22px;
          padding: 4px 2px 18px;
          border-bottom: 1px solid var(--psm-border);
        }
        .psm-spec__eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: var(--psm-accent);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .psm-spec__eyebrow-mark {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
          background: var(--psm-accent);
          box-shadow: 0 0 0 4px var(--glow, rgba(184, 134, 11, 0.15));
        }
        .psm-spec__series {
          padding: 3px 9px;
          border: 1px solid var(--psm-border);
          border-radius: 999px;
          background: var(--psm-surface-soft);
          color: var(--psm-text);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: none;
        }
        .psm-spec__title {
          margin: 0;
          color: var(--psm-text);
          font-size: clamp(23px, 2.6vw, 34px);
          font-weight: 900;
          line-height: 1.45;
        }
        .psm-spec__series-note { margin: 3px 0 0; color: var(--psm-accent); font-size: 13px; font-weight: 800; }
        .psm-spec__accent {
          width: 58px;
          height: 3px;
          margin: 13px 0;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--psm-accent), var(--gold-light, #f5c518));
        }
        .psm-spec__description { margin: 0; color: var(--psm-muted); font-size: 14px; line-height: 1.95; white-space: pre-line; }
        .psm-spec__sections { display: grid; gap: 14px; }
        .psm-spec__empty {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px dashed var(--psm-border);
          border-radius: 12px;
          background: var(--psm-surface);
          color: var(--psm-muted);
          font-size: 12px;
          font-weight: 700;
        }
        .psm-spec__empty-icon {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          place-items: center;
          border-radius: 10px;
          background: var(--glow, rgba(184, 134, 11, 0.12));
          color: var(--psm-accent);
        }
        .psm-spec__section {
          margin: 0;
          overflow: hidden;
          border: 1px solid var(--psm-border);
          border-radius: 14px;
          background: var(--psm-surface);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(4, 10, 18, 0.08));
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }
        .psm-spec__section:hover {
          border-color: var(--gold, #b8860b);
          box-shadow: var(--shadow-md, 0 4px 14px rgba(0, 0, 0, 0.1));
          transform: translateY(-1px);
        }
        .psm-spec__section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          padding: 12px 15px;
          border-bottom: 1px solid var(--psm-border);
          background: linear-gradient(100deg, var(--glow, rgba(184, 134, 11, 0.11)), transparent 75%);
          color: var(--psm-text);
          font-size: 13px;
          font-weight: 900;
          line-height: 1.5;
        }
        .psm-spec__section-title::before {
          width: 3px;
          height: 17px;
          flex: 0 0 3px;
          border-radius: 99px;
          background: var(--psm-accent);
          content: "";
        }
        .psm-spec[dir="rtl"] .psm-spec__section-title::before { order: 1; }
        .psm-spec__section-inner { padding: 4px 10px; }
        .psm-spec__rows { margin: 0; padding: 0; }
        .psm-spec__row, .psm-spec__data-row {
          min-height: 38px;
          margin: 0;
          padding: 8px 10px;
          border-bottom: 1px solid var(--psm-border);
          border-radius: 7px;
          overflow-wrap: anywhere;
          color: var(--psm-muted);
          transition: background-color 140ms ease, color 140ms ease;
        }
        .psm-spec__row:last-child, .psm-spec__data-row:last-child { border-bottom: 0; }
        .psm-spec__row:nth-child(odd), .psm-spec__data-row:nth-child(odd) { background: var(--psm-surface-soft); }
        .psm-spec__row:nth-child(even), .psm-spec__data-row:nth-child(even) { background: transparent; }
        .psm-spec__row:hover, .psm-spec__data-row:hover { background: var(--glow, rgba(184, 134, 11, 0.12)); color: var(--psm-text); }
        .psm-spec__data-row { display: grid; grid-template-columns: minmax(100px, 32%) minmax(0, 1fr); gap: 14px; align-items: start; }
        .psm-spec__data-row dt { margin: 0; color: var(--psm-text); font-size: 12px; font-weight: 800; }
        .psm-spec__data-row dd { min-width: 0; margin: 0; color: var(--psm-muted); }
        .psm-spec[dir="rtl"] .psm-spec__data-row { grid-template-columns: minmax(0, 1fr) minmax(100px, 32%); }
        .psm-spec[dir="rtl"] .psm-spec__data-row dt { grid-column: 2; grid-row: 1; }
        .psm-spec[dir="rtl"] .psm-spec__data-row dd { grid-column: 1; grid-row: 1; }
        .psm-spec__clients { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 7px; }
        .psm-spec__clients span {
          padding: 9px 11px;
          border: 1px solid var(--psm-border);
          border-radius: 8px;
          background: var(--psm-surface-soft);
          color: var(--psm-muted);
          font-size: 12px;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .psm-spec { font-size: 13px; }
          .psm-spec__header { margin-bottom: 17px; padding-bottom: 14px; }
          .psm-spec__sections { gap: 11px; }
          .psm-spec__section-title { padding: 10px 12px; }
          .psm-spec__section-inner { padding: 4px 7px; }
          .psm-spec__data-row { grid-template-columns: minmax(85px, 36%) minmax(0, 1fr); gap: 9px; }
          .psm-spec[dir="rtl"] .psm-spec__data-row { grid-template-columns: minmax(0, 1fr) minmax(85px, 36%); }
        }
      `}</style>
    </article>
  );
}
