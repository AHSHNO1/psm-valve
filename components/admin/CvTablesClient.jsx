"use client";
import { useMemo, useRef, useState } from "react";
import { DeleteBtn, SaveBtn } from "./Actions";
import { Icon } from "./AdminIcons";
import ContentStudioNav from "./ContentStudioNav";
import { useUnsavedChanges, confirmDiscard, isDirty } from "./useUnsavedChanges";
import {
  DN_RE,
  SERIES_RE,
  STATUS_LABEL,
  STATUS_TONE,
  catalogRowsFor,
  coverageSummary,
  exportTables,
  groupSeries,
  normalizeDn,
  normalizeRow,
  parseCvLines,
  validateRows
} from "@/lib/cv-admin-utils";

// ============================================================
// صفحهٔ «جدول Cv سایزینگ» پنل ادمین
//  • پوشش واقعی داده (کاتالوگ + جدول دست‌نویس) روی سری‌های مؤثر در سایزینگ
//  • کارت جداگانه برای هر سری (محصولات هم‌سری یک‌جا) + فیلتر و جست‌وجو
//  • ویرایشگر با اعتبارسنجی زنده و دکمه‌های سریع سایزهای کاتالوگ
//  • ورود گروهی از اکسل (سری، DN، Cv) و خروجی/ورود JSON
// ============================================================

const CARD = { border: "1px solid #E5E7EB", borderRadius: 12, background: "#FFFFFF" };
// بنچ سرچشمهٔ داده: برآورد مهندسی هرگز نباید مثل دادهٔ اندازه‌گیری‌شده خوانده شود
const estimateChip = {
  padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 900,
  background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A"
};
const measuredChip = {
  padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 900,
  background: "#DCFCE7", color: "#065F46", border: "1px solid #BBF7D0"
};
const INPUT = {
  padding: "7px 9px",
  borderRadius: 7,
  border: "1px solid #E5E7EB",
  fontFamily: "monospace",
  fontSize: 11.5
};

function smallBtn(extra) {
  return Object.assign(
    {
      padding: "7px 11px",
      borderRadius: 8,
      border: "1px solid #E5E7EB",
      background: "#FFFFFF",
      color: "#334155",
      fontSize: 11,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    extra || {}
  );
}

function Pill({ tone, children }) {
  const palette = STATUS_TONE[tone] || STATUS_TONE.none;
  return (
    <span
      style={{
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 9.5,
        fontWeight: 900,
        whiteSpace: "nowrap",
        background: palette.bg,
        color: palette.fg,
        border: "1px solid " + palette.border
      }}
    >
      {children}
    </span>
  );
}

function nameOf(product) {
  const name = product && product.name;
  if (!name) return (product && product.slug) || "";
  return name.fa || name.en || (product && product.slug) || "";
}

function dateText(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
  } catch (error) {
    return String(value);
  }
}

/** کارت پوشش داده: چند سری واقعاً دادهٔ Cv دارند و کدام‌ها نه */
function CoverageCard({ summary, onExport, onCopy }) {
  const done = summary.total - summary.withoutData;
  const tone = summary.total === 0 ? "none" : summary.withoutData === 0 ? "both" : done > 0 ? "admin" : "none";

  return (
    <div style={Object.assign({}, CARD, { marginTop: 14, padding: "14px 16px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <b style={{ fontSize: 12.5, color: "#1A1D21" }}>پوشش دادهٔ Cv</b>
        <Pill tone={tone}>{summary.percent}٪</Pill>
        <span style={{ fontSize: 11, color: "#6B7280" }}>
          {summary.total} سری مؤثر در سایزینگ · {done} سری داده دارند
        </span>
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
          <button type="button" onClick={onExport} style={smallBtn()}>
            خروجی JSON
          </button>
          <button type="button" onClick={onCopy} style={smallBtn()}>
            کپی JSON
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, height: 8, borderRadius: 20, background: "#F1F5F9", overflow: "hidden" }}>
        <div
          style={{
            width: summary.percent + "%",
            height: "100%",
            background: "linear-gradient(90deg, #E0A81A, #B8850A)",
            transition: "width .25s ease"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 11, color: "#334155" }}>
        <span>
          کاتالوگ (با منحنی): <b>{summary.withCatalog}</b> سری
        </span>
        <span>
          جدول دست‌نویس: <b>{summary.withAdmin}</b> سری
        </span>
        <span style={{ color: summary.withoutData ? "#991B1B" : "#065F46", fontWeight: 800 }}>
          بدون داده: {summary.withoutData} سری
        </span>
        {summary.other > 0 && (
          <span style={{ color: "#6B7280" }}>
            خارج از سایزینگ: <b>{summary.other}</b> سری
          </span>
        )}
      </div>

      {summary.missing.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#991B1B", lineHeight: 2 }}>
          سری‌های بدون داده (سایزینگ برای این‌ها «Cv عمومی» نشان می‌دهد) — با «ورود گروهی از اکسل» می‌توانید همه را یک‌جا وارد
          کنید:{" "}
          <span dir="ltr" style={{ fontFamily: "monospace" }}>
            {summary.missing.join(" · ")}
          </span>
        </div>
      )}
    </div>
  );
}

/** کارت دادهٔ مرجع کاتالوگ (فقط‌خواندنی) */
function CatalogCard({ catalog }) {
  const [open, setOpen] = useState(true);
  if (!catalog || !catalog.stats || !(catalog.stats.trims > 0)) return null;

  return (
    <div style={Object.assign({}, CARD, { marginTop: 12, padding: "14px 16px", background: "#F8FAFC", borderColor: "#E2E8F0" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <b style={{ fontSize: 12.5, color: "#334155" }}>دادهٔ مرجع کاتالوگ (فقط‌خواندنی)</b>
        <span style={{ fontSize: 11, color: "#64748B" }}>
          {catalog.stats.series} سری · {catalog.stats.sizes} سایز · {catalog.stats.trims} ترم
          {catalog.source && catalog.source.file ? " — از " + catalog.source.file + " (شیت " + catalog.source.sheet + ")" : ""}
        </span>
        <button type="button" onClick={() => setOpen(!open)} style={smallBtn({ marginInlineStart: "auto" })}>
          {open ? "بستن جزئیات" : "نمایش جزئیات"}
        </button>
      </div>

      {open && (
        <>
          <ul style={{ margin: "8px 0 0", paddingInlineStart: 18, fontSize: 11.5, color: "#334155", lineHeight: 2 }}>
            {catalog.series.map(function (entry) {
              const estimated = entry.provenance === "estimated";
              const chars = entry.byCharacteristic || {};
              return (
                <li key={entry.series} dir="auto">
                  <b dir="ltr">سری {entry.series}</b>
                  {" "}{estimated
                    ? <span style={estimateChip}>برآورد{entry.errorPct != null ? " ±" + Math.round(entry.errorPct) + "٪" : ""}</span>
                    : <span style={measuredChip}>اندازه‌گیری‌شده</span>}
                  {" — "}{entry.sizes.length} سایز · {entry.trims} ترم
                  {entry.cvMin != null ? " · Cv از " + entry.cvMin + " تا " + entry.cvMax : ""}
                  {" · "}
                  {Object.keys(chars).map(function (kind) {
                    return kind + " " + chars[kind];
                  }).join(" · ")}
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: 8, fontSize: 11, color: "#64748B", lineHeight: 2 }}>
            این داده در پنل ویرایش نمی‌شود. اگر برای یک DN مقداری ذخیره کنید، همان DN از جدول دست‌نویس شما خوانده می‌شود و
            منحنی مشخصهٔ آن سایز در سایزینگ کنار گذاشته می‌شود (محاسبه با فرض خطی).
            {catalog.estimatedCount > 0 && (
              <>
                <br />
                <b style={{ color: "#92400E" }}>{catalog.estimatedCount} سری با برآورد مهندسی</b> — این جدول‌ها از قانون
                مقیاس‌پذیری Cv روی سری‌های اندازه‌گیری‌شده ساخته شده‌اند، نه آزمون کارخانه. برای جایگزینی، Cv واقعی را
                در همان سری ذخیره کنید: دادهٔ شما جای برآورد را می‌گیرد.
              </>
            )}
          </div>

          {catalog.refused && catalog.refused.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 11, fontWeight: 800, color: "#64748B", cursor: "pointer" }}>
                چرا {catalog.refused.length} سری هیچ Cv (اندازه‌گیری‌شده یا برآورد) ندارند؟
              </summary>
              <ul style={{ margin: "6px 0 0", paddingInlineStart: 18, fontSize: 11, color: "#64748B", lineHeight: 2 }}>
                {catalog.refused.map(function (row) {
                  return <li key={row.series} dir="auto"><b dir="ltr">{row.series}</b> — {(row.reasons || []).join(" ")}</li>;
                })}
              </ul>
            </details>
          )}
        </>
      )}

      {catalog.repairedValues > 0 && (
        <div style={{ marginTop: 8, color: "#92400E", fontWeight: 800, fontSize: 11 }}>
          ⚠ {catalog.repairedValues} مقدار تایپی در منبع با درون‌یابی اصلاح شد (فهرست در بخش repairs فایل کاتالوگ).
        </div>
      )}
    </div>
  );
}

/** راهنمای گام‌به‌گام */
function GuideCard() {
  return (
    <div style={Object.assign({}, CARD, { marginTop: 12, padding: "14px 16px", background: "#F8FAFC", borderColor: "#E2E8F0" })}>
      <div style={{ fontWeight: 900, marginBottom: 4, fontSize: 12.5, color: "#334155" }}>راهنمای گام‌به‌گام</div>
      <ol style={{ margin: 0, paddingInlineStart: 18, fontSize: 11.5, color: "#334155", lineHeight: 2 }}>
        <li>
          Cv را از کاتالوگ سازنده بردارید — مقدار <b>۱۰۰٪ بازشدگی</b> و ترم <b>خطی</b>.
        </li>
        <li>
          سری‌هایی که در کارتشان برچسب <b>«کاتالوگ (با منحنی)»</b> دارند دادهٔ کامل با منحنی مشخصهٔ ذاتی دارند؛ نیازی به ورود
          دستی نیست. فقط اگر مقدار کاتالوگ را اصلاح می‌کنید، همان DN را ذخیره کنید.
        </li>
        <li>
          سایزها را به شکل <code dir="ltr">DN50, 45</code> وارد کنید (DN و Cv) یا از چیپس‌های کاتالوگ همان سری استفاده کنید.
        </li>
        <li>
          برای چند سری یک‌جا، «ورود گروهی از اکسل» را باز کنید و خطوط <code dir="ltr">51000, DN50, 45</code> را از اکسل
          بچسبانید و «ذخیرهٔ همه» بزنید.
        </li>
        <li>«ذخیره» بلافاصله اثر می‌کند؛ صفحهٔ سایزینگ بدون بیلد از همین داده استفاده می‌کند.</li>
        <li>
          سری‌های <b>بدون داده</b> سایزینگ را خراب نمی‌کنند: برای آن‌ها جدول عمومی با برچسب «Cv عمومی» استفاده می‌شود.
        </li>
      </ol>
      <div style={{ marginTop: 6, fontSize: 11, color: "#64748B", lineHeight: 2 }}>
        تعریف Cv: دبی آب بر حسب gpm در ۶۰°F با افت فشار ۱ psi؛ بدون تبدیل واحد و مطابق کاتالوگ وارد شود. این جدول فقط Cv را
        نگه می‌دارد؛ محدودهٔ فشار/دما، متریال، ترم و کلاس نشتی جداگانه باید بررسی شود.
      </div>
    </div>
  );
}

/** پنل ورود گروهی از اکسل و ورود فایل JSON */
function BulkPanel({ open, onToggle, text, onText, defaultSeries, onDefaultSeries, busy, preview, onApply, onFile }) {
  const fileRef = useRef(null);
  const ids = Object.keys(preview.groups);

  return (
    <div style={Object.assign({}, CARD, { marginTop: 12, padding: "14px 16px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <b style={{ fontSize: 12.5, color: "#1A1D21" }}>ورود گروهی از اکسل</b>
        <span style={{ fontSize: 11, color: "#6B7280" }}>
          چند سری را یک‌جا وارد یا به‌روزرسانی کنید (ستون‌ها با «ویرگول» یا «Tab» جدا شوند)
        </span>
        <button type="button" onClick={onToggle} style={smallBtn({ marginInlineStart: "auto" })}>
          {open ? "بستن" : "باز کردن"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 11, color: "#475569" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              سری پیش‌فرض (برای خطوط دو ستونی):
              <input
                dir="ltr"
                value={defaultSeries}
                onChange={(event) => onDefaultSeries(event.target.value)}
                placeholder="51000"
                style={Object.assign({}, INPUT, { width: 90 })}
              />
            </label>
            <span>نمونه: </span>
            <code dir="ltr" style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 6 }}>
              51000, DN50, 45
            </code>
            <code dir="ltr" style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 6 }}>
              46000&#9;DN80&#9;120
            </code>
          </div>

          <textarea
            dir="ltr"
            value={text}
            onChange={(event) => onText(event.target.value)}
            rows={7}
            placeholder={"51000, DN50, 45\n51000, DN80, 90\n46000, DN50, 120"}
            style={Object.assign({}, INPUT, {
              width: "100%",
              marginTop: 8,
              fontSize: 12,
              lineHeight: 1.9,
              resize: "vertical",
              background: "#FCFCFD"
            })}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 8, fontSize: 11 }}>
            <span style={{ color: ids.length ? "#065F46" : "#6B7280", fontWeight: 800 }}>
              {ids.length ? ids.length + " سری · " + preview.rows + " سایز معتبر" : "ردیف معتبری تشخیص داده نشد"}
            </span>
            {preview.errors.length > 0 && (
              <span style={{ color: "#991B1B", fontWeight: 800 }}>{preview.errors.length} خط نامعتبر (نادیده گرفته می‌شود)</span>
            )}
            <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  const file = event.target.files && event.target.files[0];
                  if (file) onFile(file);
                  event.target.value = "";
                }}
                style={{ display: "none" }}
              />
              <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={smallBtn()} disabled={busy}>
                ورود فایل JSON
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={busy || !ids.length}
                style={smallBtn({
                  background: "#1A1D21",
                  color: "#FFFFFF",
                  borderColor: "#1A1D21",
                  opacity: busy || !ids.length ? 0.5 : 1
                })}
              >
                {busy ? "در حال ذخیره…" : "ذخیرهٔ همه (" + ids.length + " سری)"}
              </button>
            </div>
          </div>

          {ids.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingInlineStart: 18, fontSize: 11, color: "#334155", lineHeight: 2 }}>
              {ids.slice(0, 8).map(function (id) {
                return (
                  <li key={id} dir="auto">
                    <b dir="ltr">سری {id}</b> — {preview.groups[id].length} سایز
                  </li>
                );
              })}
            </ul>
          )}

          {preview.errors.slice(0, 4).map(function (problem) {
            return (
              <div key={problem.line} style={{ marginTop: 6, fontSize: 11, color: "#991B1B" }}>
                خط {problem.line}: {problem.reason}
                {problem.text ? " — " : ""}
                <span dir="ltr" style={{ fontFamily: "monospace" }}>
                  {problem.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** کارت یک سری: سربرگ همیشه دیده می‌شود، ویرایشگر فقط در حالت باز */
function SeriesCard({ info, open, editor }) {
  const tone = STATUS_TONE[info.status] ? info.status : "none";
  const first = info.products[0];
  const extra = info.products.length - 1;
  const range = info.sizeRanges.join(" · ");

  return (
    <div
      style={Object.assign({}, CARD, {
        padding: "12px 14px",
        borderColor: open ? "#E0A81A" : "#E5E7EB",
        boxShadow: open ? "0 0 0 3px rgba(224,168,26,.12)" : "none"
      })}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => editor.onToggle(info.series)}
          disabled={!info.valid}
          style={smallBtn({
            background: open ? "#1A1D21" : "#FFFFFF",
            color: open ? "#FFFFFF" : "#334155",
            borderColor: open ? "#1A1D21" : "#E5E7EB",
            opacity: info.valid ? 1 : 0.45,
            cursor: info.valid ? "pointer" : "not-allowed"
          })}
        >
          {open ? "بستن" : info.adminCount > 0 ? "ویرایش" : info.catalog ? "بازنویسی" : "افزودن داده"}
        </button>

        <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 140 }}>
          <span dir="auto" style={{ fontSize: 12.5, fontWeight: 900, color: "#1A1D21" }}>
            {first ? nameOf(first) : ""}
          </span>
          <span dir="ltr" style={{ fontSize: 10.5, color: "#6B7280", fontFamily: "monospace" }}>
            سری {info.series}
          </span>
        </span>

        {extra > 0 && (
          <span
            dir="auto"
            style={{ fontSize: 10, fontWeight: 800, color: "#475569", background: "#F1F5F9", padding: "2px 8px", borderRadius: 20 }}
          >
            + {extra} محصول هم‌سری
          </span>
        )}

        {range && (
          <span style={{ fontSize: 10.5, color: "#475569", maxWidth: 260 }} title={range}>
            سایز: {range.length > 54 ? range.slice(0, 54) + "…" : range}
          </span>
        )}

        <div style={{ marginInlineStart: "auto", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {info.inSizing && info.catalog && (
            <span dir="ltr" style={{ fontSize: 10, fontFamily: "monospace", color: info.catalog.provenance === "estimated" ? "#92400E" : "#1D4ED8" }}>
              {info.catalog.provenance === "estimated" ? "برآورد" : "کاتالوگ"} {info.catalog.sizes.length} سایز · Cv تا {info.catalog.sizes.reduce(function (max, size) {
                return size.cvMax != null && size.cvMax > max ? size.cvMax : max;
              }, 0)}
            </span>
          )}
          {info.adminCount > 0 && (
            <span dir="ltr" style={{ fontSize: 10, fontFamily: "monospace", color: "#9A3412" }}>
              دست‌نویس {info.adminCount} سایز
            </span>
          )}
          {!info.inSizing && <Pill tone="invalid">خارج از سایزینگ</Pill>}
          <Pill tone={tone}>{STATUS_LABEL[info.status]}</Pill>
        </div>
      </div>

      {!info.valid && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#991B1B", lineHeight: 2 }}>
          شناسهٔ <span dir="ltr" style={{ fontFamily: "monospace" }}>{info.series}</span> با قاعدهٔ سرور سازگار نیست (فقط
          حرف/رقم و <span dir="ltr">/ . -</span> تا ۲۴ کاراکتر). این سری قابل ذخیره نیست و در سایزینگ هم استفاده نمی‌شود.
        </div>
      )}

      {open && editor.rows && <SeriesEditor info={info} editor={editor} />}
    </div>
  );
}

/** ویرایشگر یک سری: جدول DN/Cv، چیپس‌های کاتالوگ، چسباندن سریع و ذخیرهٔ زنده */
function SeriesEditor({ info, editor }) {
  const check = editor.check;
  const catalog = info.catalog;

  return (
    <div style={{ marginTop: 10, borderTop: "1px dashed #E5E7EB", paddingTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <SaveBtn onClick={editor.save} disabled={!check.ok} busy={editor.saving} />
        <button type="button" onClick={editor.addRow} style={smallBtn()}>
          + افزودن سایز
        </button>
        {catalog && (
          <button type="button" onClick={editor.loadCatalog} style={smallBtn()} disabled={editor.saving || editor.deleting}>
            بارگذاری {catalog.sizes.length} سایز از {catalog.provenance === "estimated" ? "برآورد (به‌جای دادهٔ اندازه‌گیری‌شده)" : "کاتالوگ"}
          </button>
        )}
        {info.adminCount > 0 && <DeleteBtn onClick={editor.remove} title="حذف جدول این سری" />}
        <span style={{ fontSize: 10.5, color: "#6B7280", marginInlineStart: "auto" }}>
          {editor.rows.length} سایز در فرم
          {editor.updatedAt ? " · آخرین ذخیره: " + dateText(editor.updatedAt) : " · تا حالا ذخیره نشده"}
        </span>
      </div>

      {!check.ok && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#991B1B", lineHeight: 2 }}>
          {check.messages.slice(0, 3).map(function (message, index) {
            return <div key={index}>• {message}</div>;
          })}
          {check.messages.length > 3 && <div>• …</div>}
        </div>
      )}

      {catalog && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10.5, color: "#64748B" }}>سایزهای کاتالوگ (کلیک = افزودن/به‌روزرسانی):</span>
          {catalog.sizes.map(function (size) {
            return (
              <button
                key={size.dn}
                type="button"
                dir="ltr"
                onClick={() => editor.useSize(size.dn, size.cvMax)}
                title={"Cv بیشینهٔ کاتالوگ: " + size.cvMax}
                style={smallBtn({ padding: "4px 8px", fontSize: 10, fontFamily: "monospace" })}
              >
                {size.dn} · {size.cvMax}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
        {editor.rows.map(function (row, index) {
          const error = check.rowErrors[index];
          const border = error ? "#FCA5A5" : "#E5E7EB";
          return (
            <div key={index} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: "#94A3B8", width: 18, textAlign: "center" }}>{index + 1}</span>
              <input
                dir="ltr"
                value={row.dn}
                onChange={(event) => editor.setCell(index, { dn: event.target.value })}
                placeholder="DN50"
                style={Object.assign({}, INPUT, { width: 96, borderColor: border })}
              />
              <input
                dir="ltr"
                value={row.cv}
                onChange={(event) => editor.setCell(index, { cv: event.target.value })}
                placeholder="45"
                style={Object.assign({}, INPUT, { width: 110, borderColor: border })}
              />
              {error && <span style={{ fontSize: 10.5, color: "#991B1B", fontWeight: 800 }}>{error}</span>}
              <button
                type="button"
                onClick={() => editor.removeRow(index)}
                title="حذف این سایز"
                style={smallBtn({ marginInlineStart: "auto", padding: "4px 9px" })}
              >
                ✕
              </button>
            </div>
          );
        })}
        {editor.rows.length === 0 && (
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            هنوز سایزی اضافه نشده — «افزودن سایز» بزنید یا از سایزهای کاتالوگ بالا انتخاب کنید.
          </span>
        )}
      </div>

      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 11, fontWeight: 800, color: "#334155", cursor: "pointer" }}>
          چسباندن سریع سایزها (کپی از اکسل)
        </summary>
        <div style={{ marginTop: 8 }}>
          <textarea
            dir="ltr"
            rows={4}
            value={editor.pasteText}
            onChange={(event) => editor.setPasteText(event.target.value)}
            placeholder={"DN50, 45\nDN80, 90"}
            style={Object.assign({}, INPUT, { width: "100%", fontSize: 12, lineHeight: 1.9, resize: "vertical" })}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 6, fontSize: 10.5 }}>
            <span style={{ color: editor.paste.preview.length ? "#065F46" : "#6B7280", fontWeight: 800 }}>
              {editor.paste.preview.length
                ? editor.paste.preview.length + " سایز خوانده شد (DN تکراری: آخری برنده است)"
                : "منتظر ورود…"}
            </span>
            {editor.paste.errors.length > 0 && (
              <span style={{ color: "#991B1B" }}>{editor.paste.errors.length} خط نامعتبر</span>
            )}
            {editor.paste.otherSeries > 0 && (
              <span style={{ color: "#92400E" }}>{editor.paste.otherSeries} خط مربوط به سری دیگر (نادیده گرفته می‌شود)</span>
            )}
            <button
              type="button"
              onClick={editor.applyPaste}
              disabled={!editor.paste.preview.length}
              style={smallBtn({ marginInlineStart: "auto", opacity: editor.paste.preview.length ? 1 : 0.5 })}
            >
              افزودن به فرم
            </button>
          </div>
          {editor.paste.errors.slice(0, 3).map(function (problem) {
            return (
              <div key={problem.line} style={{ marginTop: 6, fontSize: 10.5, color: "#991B1B" }}>
                خط {problem.line}: {problem.reason}{" "}
                <span dir="ltr" style={{ fontFamily: "monospace" }}>
                  {problem.text}
                </span>
              </div>
            );
          })}
        </div>
      </details>

      <div style={{ marginTop: 10, fontSize: 10.5, color: "#64748B", lineHeight: 2 }}>
        {catalog
          ? "این سری دادهٔ کاتالوگی دارد؛ هر DN که اینجا ذخیره کنید فقط همان DN را در سایزینگ بازنویسی می‌کند (منحنی مشخصهٔ آن سایز کنار گذاشته و با فرض خطی حساب می‌شود)."
          : "برای این سری دادهٔ Cv کاتالوگی ثبت نشده؛ تا وقتی سایزی ذخیره نکنید، سایزینگ برای آن «Cv عمومی» نشان می‌دهد."}
      </div>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "missing", label: "بدون داده" },
  { id: "catalog", label: "با کاتالوگ" },
  { id: "admin", label: "جدول دست‌نویس" },
  { id: "sizing", label: "فعال در سایزینگ" }
];

export default function CvTablesClient({ products = [], initial = {}, catalog = null }) {
  const [tables, setTables] = useState(() => (initial && typeof initial === "object" ? initial : {}));
  const [rows, setRows] = useState([]);
  const [openSeries, setOpenSeries] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showGuide, setShowGuide] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSeries, setBulkSeries] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busySeries, setBusySeries] = useState("");
  const [message, setMessage] = useState({ tone: "", text: "" });

  const messageId = useRef(0);

  /** دادهٔ مشتق‌شده: کاتالوگ → نگاشت سری، لیست سری‌ها، پوشش، اعتبارسنجی زنده */
  const catalogBySeries = useMemo(() => {
    const map = {};
    const list = catalog && Array.isArray(catalog.series) ? catalog.series : [];
    list.forEach(function (entry) {
      if (entry && entry.series) map[entry.series] = entry;
    });
    return map;
  }, [catalog]);

  const list = useMemo(() => groupSeries(products, tables, catalogBySeries), [products, tables, catalogBySeries]);
  const summary = useMemo(() => coverageSummary(list), [list]);
  const check = useMemo(() => validateRows(rows), [rows]);
  const bulkPreview = useMemo(() => parseCvLines(bulkText, bulkSeries), [bulkText, bulkSeries]);

  const paste = useMemo(() => {
    if (!openSeries) return { preview: [], errors: [], otherSeries: 0 };
    const parsed = parseCvLines(pasteText, openSeries);
    const others = Object.keys(parsed.groups).filter(function (id) {
      return id !== openSeries;
    });
    return {
      preview: parsed.groups[openSeries] || [],
      errors: parsed.errors,
      otherSeries: others.length
    };
  }, [pasteText, openSeries]);

  const savedRows = useMemo(() => {
    if (!openSeries) return [];
    const table = tables[openSeries];
    return (table && Array.isArray(table.sizes) ? table.sizes : []).map(normalizeRow);
  }, [tables, openSeries]);

  const dirty = Boolean(openSeries) && isDirty(rows, savedRows);
  useUnsavedChanges(dirty);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return list.filter(function (item) {
      if (filter === "missing" && item.status !== "none" && item.status !== "invalid") return false;
      if (filter === "catalog" && !item.catalog) return false;
      if (filter === "admin" && item.adminCount === 0) return false;
      if (filter === "sizing" && !item.inSizing) return false;
      if (!needle) return true;
      if (item.series.toLowerCase().indexOf(needle) !== -1) return true;
      return item.products.some(function (product) {
        const name = product.name ? String(product.name.fa || "") + " " + String(product.name.en || "") : "";
        return name.toLowerCase().indexOf(needle) !== -1;
      });
    });
  }, [list, filter, query]);

  function notify(text, tone) {
    messageId.current += 1;
    const id = messageId.current;
    setMessage({ tone: tone || "success", text: text });
    window.setTimeout(function () {
      if (messageId.current === id) setMessage({ tone: "", text: "" });
    }, 6000);
  }

  /** گرفتن نسخهٔ تازهٔ جدول‌ها از سرور (updatedAt هم هم‌زمان هم‌سان می‌شود) */
  async function refreshTables() {
    try {
      const response = await fetch("/api/cv-tables", { cache: "no-store" });
      const data = await response.json().catch(function () {
        return {};
      });
      if (data && data.ok && data.series) setTables(data.series);
    } catch (error) {
      /* بی‌صدا: نمایش قدیمی می‌ماند ولی ذخیره انجام شده است */
    }
  }

  function toggleSeries(series) {
    if (openSeries === series) {
      if (!confirmDiscard(dirty)) return;
      setOpenSeries(null);
      setRows([]);
      setPasteText("");
      return;
    }
    if (!confirmDiscard(dirty)) return;
    setOpenSeries(series);
    setPasteText("");
    setMessage({ tone: "", text: "" });
    const table = tables[series];
    setRows((table && Array.isArray(table.sizes) ? table.sizes : []).map(normalizeRow));
  }

  function setCell(index, patch) {
    setRows(function (current) {
      return current.map(function (row, position) {
        return position === index ? Object.assign({}, row, patch) : row;
      });
    });
  }

  function addRow() {
    setRows(function (current) {
      return current.concat([{ dn: "", cv: "" }]);
    });
  }

  function removeRow(index) {
    setRows(function (current) {
      return current.filter(function (row, position) {
        return position !== index;
      });
    });
  }

  /** افزودن/به‌روزرسانی یک سایز از چیپس کاتالوگ */
  function useSize(dn, cv) {
    const key = normalizeDn(dn);
    const value = cv == null ? "" : String(cv);
    setRows(function (current) {
      const index = current.findIndex(function (row) {
        return normalizeDn(row.dn) === key;
      });
      if (index === -1) return current.concat([{ dn: key, cv: value }]);
      return current.map(function (row, position) {
        return position === index ? Object.assign({}, row, { cv: value }) : row;
      });
    });
  }

  function applyPaste() {
    const incoming = paste.preview;
    if (!incoming.length) return;
    setRows(function (current) {
      const map = new Map();
      current.forEach(function (row) {
        if (row.dn) map.set(normalizeDn(row.dn), row);
      });
      incoming.forEach(function (row) {
        map.set(normalizeDn(row.dn), { dn: normalizeDn(row.dn), cv: row.cv });
      });
      return Array.from(map.values());
    });
    setPasteText("");
    notify(incoming.length + " سایز به فرم اضافه شد — با «ذخیره» نهایی کنید.");
  }

  /** ذخیرهٔ سری باز؛ اعتبارسنجی محلی دقیقاً مثل سرور است */
  async function save() {
    if (!openSeries) return;
    const fresh = validateRows(rows);
    if (!fresh.ok) {
      notify(fresh.messages.join(" "), "error");
      return;
    }
    const sizes = rows.map(function (row) {
      return { dn: normalizeDn(row.dn), cv: Number(row.cv) };
    });

    setBusySeries(openSeries);
    try {
      const response = await fetch("/api/cv-tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series: openSeries, sizes: sizes })
      });
      const data = await response.json().catch(function () {
        return {};
      });
      if (!response.ok || !data.ok) {
        notify((data.errors || ["ذخیره نشد."]).join(" "), "error");
        return;
      }
      setTables(function (current) {
        return Object.assign({}, current, {
          [openSeries]: { sizes: data.sizes || sizes, updatedAt: new Date().toISOString() }
        });
      });
      setRows((data.sizes || sizes).map(normalizeRow));
      notify("سری " + openSeries + " ذخیره شد (" + sizes.length + " سایز) — سایزینگ از همین حالا از آن استفاده می‌کند.");
      refreshTables();
    } catch (error) {
      notify("خطای شبکه در ذخیره؛ اتصال را بررسی کنید.", "error");
    } finally {
      setBusySeries("");
    }
  }

  /** حذف جدول یک سری (بازگشت به دادهٔ کاتالوگ یا جدول عمومی) */
  async function remove() {
    if (!openSeries) return;
    if (!window.confirm("جدول سری " + openSeries + " حذف شود؟")) return;

    setBusySeries(openSeries);
    try {
      const response = await fetch("/api/cv-tables?series=" + encodeURIComponent(openSeries), { method: "DELETE" });
      const data = await response.json().catch(function () {
        return {};
      });
      if (!response.ok || !data.ok) {
        notify((data.errors || ["حذف نشد."]).join(" "), "error");
        return;
      }
      setTables(function (current) {
        const next = Object.assign({}, current);
        delete next[openSeries];
        return next;
      });
      setRows([]);
      notify(
        "جدول سری " + openSeries + " حذف شد" + (catalogBySeries[openSeries] ? " — سایزینگ به دادهٔ کاتالوگ برمی‌گردد." : ".")
      );
    } catch (error) {
      notify("خطای شبکه در حذف.", "error");
    } finally {
      setBusySeries("");
    }
  }

  /** پر کردن فرم از سایزهای کاتالوگ همان سری */
  function loadCatalog() {
    const entry = openSeries ? catalogBySeries[openSeries] : null;
    if (!entry) return;
    const filled = catalogRowsFor(entry);
    if (!filled.length) {
      notify("برای این سری سایزی در کاتالوگ نیست.", "error");
      return;
    }
    setRows(filled);
    notify(filled.length + " سایز از کاتالوگ در فرم گذاشته شد — بررسی کنید و «ذخیره» را بزنید.");
  }

  /** ذخیرهٔ گروهی: هر سری یک PUT جدا می‌گیرد (همان مسیر دکمهٔ «ذخیره») */
  async function saveGroups(groups, label) {
    const ids = Object.keys(groups || {});
    if (!ids.length) {
      notify("ردیف معتبری برای ذخیره پیدا نشد.", "error");
      return;
    }

    setBulkBusy(true);
    const failed = [];
    let saved = 0;

    for (const id of ids) {
      const sizes = groups[id].map(function (row) {
        return { dn: normalizeDn(row.dn), cv: Number(row.cv) };
      });
      try {
        const response = await fetch("/api/cv-tables", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ series: id, sizes: sizes })
        });
        const data = await response.json().catch(function () {
          return {};
        });
        if (!response.ok || !data.ok) {
          failed.push(id + ": " + (data.errors || ["ذخیره نشد."]).join(" "));
          continue;
        }
        saved += 1;
      } catch (error) {
        failed.push(id + ": خطای شبکه");
      }
    }

    setBulkBusy(false);
    await refreshTables();

    if (failed.length) {
      notify(saved + " از " + ids.length + " سری " + label + " · خطا: " + failed.slice(0, 3).join(" | "), "error");
    } else {
      notify(saved + " سری " + label + " — سایزینگ از همین حالا از این داده استفاده می‌کند.");
    }
  }

  /** «ذخیرهٔ همه» برای متن چسبانده‌شده از اکسل */
  function applyBulk() {
    const ids = Object.keys(bulkPreview.groups);
    if (!ids.length) {
      notify("هیچ ردیف معتبری برای ذخیره پیدا نشد.", "error");
      return;
    }
    const note = bulkPreview.errors.length ? " (" + bulkPreview.errors.length + " خط نامعتبر نادیده گرفته می‌شود)" : "";
    const dirtyNote = dirty ? " تغییرات ذخیره‌نشدهٔ سری باز هم دور ریخته می‌شود." : "";
    if (!window.confirm(ids.length + " سری با " + bulkPreview.rows + " سایز ذخیره شود؟" + note + dirtyNote)) return;

    setOpenSeries(null);
    setRows([]);
    setBulkText("");
    saveGroups(bulkPreview.groups, "ذخیره شد");
  }

  /** ورود فایل JSON (خروجی همین صفحه یا فایل valve-cv-tables.json) */
  async function importFile(file) {
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch (error) {
      notify("فایل JSON خوانده نشد.", "error");
      return;
    }

    const source = payload && payload.series ? payload.series : payload;
    if (!source || typeof source !== "object") {
      notify("ساختار فایل JSON مورد انتظار نیست.", "error");
      return;
    }

    const groups = {};
    let skipped = 0;
    Object.keys(source).forEach(function (rawId) {
      const id = String(rawId).trim();
      if (!SERIES_RE.test(id)) {
        skipped += 1;
        return;
      }
      const value = source[rawId];
      const list = Array.isArray(value) ? value : value && Array.isArray(value.sizes) ? value.sizes : [];
      const fileRows = list.map(normalizeRow).filter(function (row) {
        return DN_RE.test(row.dn) && Number(row.cv) > 0;
      });
      if (!fileRows.length) {
        skipped += 1;
        return;
      }
      groups[id] = fileRows;
    });

    const ids = Object.keys(groups);
    if (!ids.length) {
      notify("در فایل، سری معتبری با سایز پیدا نشد.", "error");
      return;
    }
    const note = skipped ? " (" + skipped + " سری نادیده گرفته شد)" : "";
    if (!window.confirm(ids.length + " سری از فایل " + file.name + " وارد شود؟" + note)) return;
    saveGroups(groups, "از فایل وارد شد");
  }

  /** خروجی JSON برای پشتیبان‌گیری/انتقال بین محیط‌ها */
  function downloadJson() {
    const payload = exportTables(tables);
    const count = Object.keys(payload.series).length;
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "valve-cv-tables.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify("فایل valve-cv-tables.json با " + count + " سری ساخته شد.");
    } catch (error) {
      notify("ساخت فایل ممکن نشد؛ از «کپی JSON» استفاده کنید.", "error");
    }
  }

  async function copyJson() {
    const text = JSON.stringify(exportTables(tables), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      notify("JSON جدول‌ها در کلیپ‌بورد کپی شد.");
    } catch (error) {
      notify("کپی خودکار ممکن نشد (دسترسی کلیپ‌بورد بسته است).", "error");
    }
  }

  const openItem = list.find(function (item) {
    return item.series === openSeries;
  }) || null;

  const editor = {
    onToggle: toggleSeries,
    rows: openSeries ? rows : null,
    check: check,
    paste: paste,
    pasteText: pasteText,
    setPasteText: setPasteText,
    setCell: setCell,
    addRow: addRow,
    removeRow: removeRow,
    useSize: useSize,
    applyPaste: applyPaste,
    loadCatalog: loadCatalog,
    save: save,
    remove: remove,
    saving: Boolean(openSeries) && busySeries === openSeries,
    deleting: Boolean(openSeries) && busySeries === openSeries,
    updatedAt: openItem ? openItem.updatedAt : null
  };

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #0F766E, #115E59)" }}>
            <Icon name="table" size={22} />
          </div>
          <div>
            <div className="page-header-title">جدول Cv سایزینگ</div>
            <div className="page-header-sub">
              پوشش داده، ورود گروهی از اکسل و ویرایش Cv هر سری — سایزینگ بدون بیلد از همین داده استفاده می‌کند.
            </div>
          </div>
        </div>
        {dirty && <span className="chip chip-gold">تغییرات ذخیره‌نشده</span>}
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="btn-add"
          style={showGuide ? { background: "#1A1D21", boxShadow: "none" } : { background: "#FFFFFF", color: "#8A6508", borderColor: "#E7D9B0", boxShadow: "none" }}
        >
          <Icon name={showGuide ? "x" : "info"} size={15} /> {showGuide ? "بستن راهنما" : "راهنما"}
        </button>
      </div>

      <CoverageCard summary={summary} onExport={downloadJson} onCopy={copyJson} />
      {showGuide && <GuideCard />}
      <CatalogCard catalog={catalog} />

      {message.text && (
        <div
          role="status"
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 11.5,
            fontWeight: 800,
            lineHeight: 2,
            background: message.tone === "error" ? "#FEF2F2" : "#ECFDF5",
            color: message.tone === "error" ? "#991B1B" : "#065F46",
            border: "1px solid " + (message.tone === "error" ? "#FECACA" : "#A7F3D0")
          }}
        >
          {message.text}
        </div>
      )}

      <BulkPanel
        open={bulkOpen}
        onToggle={() => setBulkOpen(!bulkOpen)}
        text={bulkText}
        onText={setBulkText}
        defaultSeries={bulkSeries}
        onDefaultSeries={setBulkSeries}
        busy={bulkBusy}
        preview={bulkPreview}
        onApply={applyBulk}
        onFile={importFile}
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
        <input
          dir="auto"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی سری یا نام محصول…"
          style={Object.assign({}, INPUT, { fontFamily: "inherit", fontSize: 11.5, width: 210 })}
        />
        {FILTERS.map(function (item) {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              style={smallBtn(active ? { background: "#1A1D21", color: "#FFFFFF", borderColor: "#1A1D21" } : null)}
            >
              {item.label}
            </button>
          );
        })}
        <span style={{ fontSize: 10.5, color: "#6B7280", marginInlineStart: "auto" }}>
          {filtered.length} از {list.length} سری
          {summary.withoutData > 0 ? " · " + summary.withoutData + " سری بدون داده" : ""}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {filtered.map(function (item) {
          return <SeriesCard key={item.series} info={item} open={openSeries === item.series} editor={editor} />;
        })}
      </div>

      {filtered.length === 0 && (
        <div
          style={Object.assign({}, CARD, {
            marginTop: 10,
            padding: "18px 16px",
            fontSize: 11.5,
            color: "#6B7280",
            textAlign: "center"
          })}
        >
          سری‌ای با این فیلتر پیدا نشد — فیلتر «همه» را بزنید یا عبارت جست‌وجو را پاک کنید.
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 10.5, color: "#94A3B8", lineHeight: 2 }}>
        داده در فایل <span dir="ltr" style={{ fontFamily: "monospace" }}>data/valve-cv-tables.json</span> ذخیره می‌شود؛ برای
        انتقال بین محیط‌ها از «خروجی JSON» و «ورود فایل JSON» استفاده کنید.
      </div>
    </div>
  );
}