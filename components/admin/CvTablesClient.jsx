"use client";
import { useMemo, useState } from "react";
import { SaveBtn } from "./Actions";

const DN_RE = /^DN\d{2,4}$/;

function sizeRangeText(spec) {
  if (!spec || !spec.en) return "بازهٔ سایز ثبت نشده";
  return spec.en;
}

function normalizeRow(row) {
  return {
    dn: String(row?.dn || "").toUpperCase().replace(/\s+/g, ""),
    cv: row?.cv === "" || row?.cv == null ? "" : String(row.cv)
  };
}

export default function CvTablesClient({ products = [], initial = {} }) {
  const [tables, setTables] = useState(initial || {});
  const [openSeries, setOpenSeries] = useState(null);
  const [rows, setRows] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const filledCount = useMemo(
    () => Object.values(tables).filter((t) => Array.isArray(t?.sizes) && t.sizes.length > 0).length,
    [tables]
  );

  function notify(text, isError) {
    setMessage({ type: isError ? "error" : "success", text });
    if (!isError) setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  }

  function openEditor(series) {
    if (openSeries === series) {
      setOpenSeries(null);
      return;
    }
    setOpenSeries(series);
    setRows((tables[series]?.sizes || []).map(normalizeRow));
    setPasteText("");
    setMessage({ type: "", text: "" });
  }

  function updateRow(index, field, value) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((current) => current.concat([{ dn: "", cv: "" }]));
  }

  function removeRow(index) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function applyPaste() {
    const lines = pasteText.split(/\r?\n/);
    const parsed = [];
    const errors = [];

    lines.forEach((line, index) => {
      const text = line.trim();
      if (!text) return;
      const match = text.match(/^(DN\s*\d{2,4})\s*[,;:=\t ]\s*([0-9]+(?:\.[0-9]+)?)$/i);
      if (!match) {
        errors.push(`خط ${index + 1}: «${text}»`);
        return;
      }
      parsed.push({
        dn: match[1].replace(/\s+/g, "").toUpperCase(),
        cv: match[2]
      });
    });

    if (parsed.length === 0) {
      notify("هیچ ردیف معتبری پیدا نشد. قالب درست: DN50, 45", true);
      return;
    }

    setRows((current) => {
      const byDn = new Map(current.map((row) => [row.dn, row]));
      parsed.forEach((row) => byDn.set(row.dn, row));
      return Array.from(byDn.values());
    });
    setPasteText("");
    notify(
      `${parsed.length} ردیف اضافه شد` + (errors.length ? ` — ${errors.length} خط خوانده نشد` : ""),
      errors.length > 0
    );
  }

  function validateRows() {
    if (rows.length === 0) return "دست‌کم یک سایز لازم است.";
    const seen = new Set();
    for (const row of rows) {
      if (!DN_RE.test(row.dn)) return `قطر «${row.dn || "خالی"}» معتبر نیست؛ نمونهٔ درست: DN50`;
      const cv = Number(row.cv);
      if (!Number.isFinite(cv) || cv <= 0) return `Cv برای ${row.dn} باید عددی مثبت باشد.`;
      if (seen.has(row.dn)) return `${row.dn} تکراری است.`;
      seen.add(row.dn);
    }
    return "";
  }

  async function saveSeries(series) {
    const problem = validateRows();
    if (problem) {
      notify(problem, true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cv-tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          series,
          sizes: rows.map((row) => ({ dn: row.dn, cv: Number(row.cv) }))
        })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        notify((data.errors && data.errors.join(" ")) || "ذخیره نشد.", true);
        return;
      }

      setTables((current) => ({
        ...current,
        [series]: { sizes: data.sizes, updatedAt: new Date().toISOString() }
      }));
      setRows(data.sizes.map(normalizeRow));
      notify(`جدول سری ${series} ذخیره شد — سایزینگ از همین حالا از آن استفاده می‌کند.`);
    } catch {
      notify("خطای شبکه در ذخیره.", true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSeries(series) {
    if (!confirm(`جدول Cv سری ${series} حذف شود؟`)) return;
    try {
      const res = await fetch(`/api/cv-tables?series=${encodeURIComponent(series)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify((data.errors && data.errors.join(" ")) || "حذف نشد.", true);
        return;
      }
      setTables((current) => {
        const next = { ...current };
        delete next[series];
        return next;
      });
      setRows([]);
      setOpenSeries(null);
      notify("جدول حذف شد؛ سایزینگ به جدول عمومی برمی‌گردد.");
    } catch {
      notify("خطای شبکه در حذف.", true);
    }
  }

  return (
    <div style={{ padding: "20px 22px", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1A1D21", margin: 0 }}>جدول Cv محصولات</h1>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "6px 0 0", lineHeight: 1.8 }}>
            Cv کاتالوگی هر سری را اینجا وارد کنید تا سایزینگ به‌جای جدول عمومی، از محصول واقعی شما سایز پیشنهاد بدهد.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          style={{
            padding: "8px 12px", borderRadius: 9, border: "1px solid #E5E7EB",
            background: showGuide ? "#FFF9E6" : "#FFFFFF", color: "#8A6508",
            fontSize: 11, fontWeight: 800, cursor: "pointer"
          }}
        >
          {showGuide ? "بستن راهنما" : "راهنمای ورود داده"}
        </button>
      </div>

      <div style={{
        marginTop: 14, padding: "10px 14px", borderRadius: 10,
        background: filledCount > 0 ? "#ECFDF5" : "#FFF9E6",
        border: `1px solid ${filledCount > 0 ? "#A7F3D0" : "#FDE68A"}`,
        fontSize: 11.5, fontWeight: 700,
        color: filledCount > 0 ? "#065F46" : "#92400E"
      }}>
        وضعیت: {filledCount} از {products.length} سری جدول Cv دارد.
        {filledCount === 0 && " تا وقتی جدولی وارد نشود، سایزینگ از جدول عمومی استفاده می‌کند."}
      </div>

      {showGuide && (
        <div style={{
          marginTop: 12, padding: "14px 16px", borderRadius: 12,
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          fontSize: 11.5, color: "#334155", lineHeight: 2
        }}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>راهنمای گام‌به‌گام</div>
          <ol style={{ margin: 0, paddingInlineStart: 18 }}>
            <li>Cv را از کاتالوگ سازنده بردارید — مقدار <b>۱۰۰٪ بازشدگی</b> و ترم <b>خطی</b>.</li>
            <li>برای هر سری، سایزها را به شکل <code dir="ltr">DN50, 45</code> وارد کنید (DN و Cv).</li>
            <li>می‌توانید چند خط را یک‌جا در کادر «چسباندن» بریزید و «افزودن» بزنید.</li>
            <li>«ذخیره» را بزنید؛ همین لحظه صفحهٔ سایزینگ از این اعداد استفاده می‌کند.</li>
            <li>سری‌های خالی مشکلی ندارند: سایزینگ برای آن‌ها جدول عمومی را با برچسب «Cv عمومی» نشان می‌دهد.</li>
            <li>اگر فقط بخشی از سایزها را دارید، همان‌ها را وارد کنید؛ سایزینگ کوچک‌ترین Cv بزرگ‌تر یا مساوی Cv محاسبه‌شده را برمی‌دارد.</li>
          </ol>
          <div style={{ marginTop: 6, color: "#64748B" }}>
            تعریف Cv: دبی آب بر حسب gpm در ۶۰°F با افت فشار ۱ psi. برای همین Cv باید بدون تبدیل واحد و مطابق کاتالوگ وارد شود.
          </div>
        </div>
      )}

      {message.text && (
        <div role="status" style={{
          marginTop: 12, padding: "9px 13px", borderRadius: 9,
          background: message.type === "error" ? "#FEF2F2" : "#ECFDF5",
          border: `1px solid ${message.type === "error" ? "#FECACA" : "#A7F3D0"}`,
          color: message.type === "error" ? "#991B1B" : "#065F46",
          fontSize: 11.5, fontWeight: 800
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {products.map((product) => {
          const table = tables[product.series];
          const count = table?.sizes?.length || 0;
          const isOpen = openSeries === product.series;
          return (
            <div key={product.slug} style={{
              border: "1px solid #E5E7EB", borderRadius: 12, background: "#FFFFFF",
              overflow: "hidden"
            }}>
              <button
                type="button"
                onClick={() => openEditor(product.series)}
                aria-expanded={isOpen}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "start", fontFamily: "inherit"
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#1A1D21" }}>
                    {product.name?.fa || product.name?.en}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#6B7280", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span dir="ltr" style={{ fontFamily: "monospace" }}>سری {product.series}</span>
                    <span>·</span>
                    <span dir="ltr">{sizeRangeText(product.size)}</span>
                  </div>
                </div>
                <span style={{
                  padding: "3px 9px", borderRadius: 20, fontSize: 9.5, fontWeight: 900,
                  background: count > 0 ? "#ECFDF5" : "#F3F4F6",
                  color: count > 0 ? "#065F46" : "#6B7280",
                  whiteSpace: "nowrap"
                }}>
                  {count > 0 ? `${count} سایز` : "ثبت نشده"}
                </span>
                <span style={{ color: "#9CA3AF", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}>
                  ▾
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ overflowX: "auto", marginTop: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC" }}>
                          <th style={{ padding: "7px 10px", textAlign: "start", color: "#64748B", fontWeight: 800 }}>قطر (DN)</th>
                          <th style={{ padding: "7px 10px", textAlign: "start", color: "#64748B", fontWeight: 800 }}>Cv در ۱۰۰٪</th>
                          <th style={{ padding: "7px 10px", width: 44 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={index} style={{ borderTop: "1px solid #F1F5F9" }}>
                            <td style={{ padding: 6 }}>
                              <input
                                value={row.dn}
                                onChange={(e) => updateRow(index, "dn", e.target.value)}
                                placeholder="DN50"
                                dir="ltr"
                                style={{ width: 120, padding: "7px 9px", borderRadius: 7, border: "1px solid #E5E7EB", fontFamily: "monospace", fontSize: 11.5 }}
                              />
                            </td>
                            <td style={{ padding: 6 }}>
                              <input
                                value={row.cv}
                                onChange={(e) => updateRow(index, "cv", e.target.value)}
                                placeholder="45"
                                inputMode="decimal"
                                dir="ltr"
                                style={{ width: 140, padding: "7px 9px", borderRadius: 7, border: "1px solid #E5E7EB", fontFamily: "monospace", fontSize: 11.5 }}
                              />
                            </td>
                            <td style={{ padding: 6, textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => removeRow(index)}
                                aria-label={`حذف ${row.dn || "ردیف"}`}
                                style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", fontSize: 13 }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ padding: "12px 10px", color: "#94A3B8", fontSize: 11 }}>
                              هنوز سایزی وارد نشده است.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={addRow}
                      style={{ padding: "7px 11px", borderRadius: 8, border: "1px dashed #CBD5E1", background: "#FFFFFF", fontSize: 11, fontWeight: 800, cursor: "pointer", color: "#334155" }}
                    >
                      + افزودن سایز
                    </button>
                    <SaveBtn onClick={() => saveSeries(product.series)} busy={saving} />
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={() => deleteSeries(product.series)}
                        style={{ padding: "7px 11px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                      >
                        حذف جدول این سری
                      </button>
                    )}
                  </div>

                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#475569" }}>
                      چسباندن چند سایز یک‌جا (DN50, 45 در هر خط)
                    </summary>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={5}
                      dir="ltr"
                      placeholder={"DN50, 45\nDN80, 90\nDN100, 150"}
                      style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 9, border: "1px solid #E5E7EB", fontFamily: "monospace", fontSize: 11.5, resize: "vertical" }}
                    />
                    <button
                      type="button"
                      onClick={applyPaste}
                      style={{ marginTop: 6, padding: "7px 11px", borderRadius: 8, border: "none", background: "#1A1D21", color: "#FFFFFF", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                    >
                      افزودن به جدول
                    </button>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
