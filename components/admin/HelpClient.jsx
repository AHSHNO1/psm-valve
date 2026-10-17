"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";

const SECTIONS = [
  {
    id: "quickstart",
    icon: "sparkles",
    color: "#0078D4",
    title: "شروع سریع",
    content: "steps",
    steps: [
      { t: "محصولات", d: "برای افزودن یا ویرایش محصول به بخش «محصولات» بروید" },
      { t: "خدمات", d: "خدمات خود را در «خدمات» مدیریت کنید" },
      { t: "اخبار", d: "برای افزودن خبر جدید به «اخبار» بروید" },
      { t: "مدیا", d: "آپلود تصویر، ویدئو و کاتالوگ در «مدیا»" },
      { t: "تنظیمات", d: "اطلاعات تماس و آدرس در «تنظیمات»" }
    ]
  },
  {
    id: "uploads",
    icon: "upload",
    color: "#C9950D",
    title: "راهنمای آپلود فایل",
    content: "table",
    rows: [
      { label: "لوگوی اصلی", size: "300×80", max: "100KB", format: "PNG / SVG" },
      { label: "لوگوی روشن", size: "300×80", max: "100KB", format: "PNG شفاف" },
      { label: "فاویکون", size: "64×64", max: "50KB", format: "PNG / ICO" },
      { label: "تصویر محصول", size: "800×800", max: "200KB", format: "JPG / WebP / PNG" },
      { label: "تصویر گالری", size: "1200×900", max: "300KB", format: "JPG / WebP" },
      { label: "لوگوی همراهان", size: "400×200", max: "100KB", format: "PNG / SVG" },
      { label: "تصویر خبر", size: "1200×675", max: "200KB", format: "JPG / WebP" },
      { label: "تصویر اسلایدر", size: "1920×800", max: "500KB", format: "JPG / WebP" },
      { label: "عکس مدیرعامل", size: "800×1000", max: "300KB", format: "JPG / WebP" },
      { label: "گواهینامه", size: "300×300", max: "150KB", format: "PNG شفاف" },
      { label: "ویدئو فایل", size: "—", max: "50MB", format: "MP4 / WebM" },
      { label: "کاتالوگ", size: "—", max: "10MB", format: "PDF" }
    ]
  },
  {
    id: "tips",
    icon: "info",
    color: "#107C10",
    title: "نکات مهم",
    content: "tips",
    tips: [
      { title: "ویدئوهای بزرگ", text: "ویدئوهای بیش از ۵۰ مگابایت را در یوتیوب یا آپارات بگذارید و لینک را وارد کنید" },
      { title: "چند زبانه", text: "محتوای هر ۴ زبان (فارسی، انگلیسی، عربی، روسی) را کامل کنید تا سایت بهتر در گوگل دیده شود" },
      { title: "نامک محصول", text: "فقط حروف انگلیسی کوچک، اعداد و خط تیره — مثل: ball-control-valve" },
      { title: "پشتیبان‌گیری", text: "پوشه data/ را هر چند وقت یک‌بار بکاپ بگیرید تا اطلاعات حفظ شود" }
    ]
  },
  {
    id: "shortcuts",
    icon: "check",
    color: "#8764B8",
    title: "میانبرهای کیبورد",
    content: "shortcuts",
    shortcuts: [
      { key: "Ctrl + K", action: "باز کردن اعلان‌ها" },
      { key: "Escape", action: "بستن پنل‌ها و منوها" },
      { key: "Ctrl + S", action: "ذخیره فرم فعال" }
    ]
  },
  {
    id: "faq",
    icon: "alert",
    color: "#F7630C",
    title: "سوالات متداول",
    content: "faq",
    faqs: [
      { q: "چرا تغییرات در سایت اعمال نمی‌شود؟", a: "پس از پیام موفقیت، صفحهٔ سایت را دوباره بارگذاری کنید و زبان درست را بررسی کنید. اگر تغییر دیده نشد، اتصال سرور و دسترسی نوشتن پوشهٔ data را بررسی کنید." },
      { q: "رمز عبور را فراموش کردم", a: "اگر هنوز به پنل دسترسی دارید، از بخش امنیت رمز را تغییر دهید. در صورت فراموشی کامل، از مدیر سرور بخواهید با روش امن بازیابی دسترسی را انجام دهد؛ رمز را مستقیماً در فایل‌های داده ویرایش نکنید." },
      { q: "فایل آپلود نمی‌شود", a: "حجم و فرمت فایل را با جدول راهنما چک کنید. برای ویدئوهای بزرگ از لینک یوتیوب استفاده کنید." },
      { q: "چطور محصول را از سایت حذف کنم؟", a: "از دکمه قرمز حذف در لیست محصولات استفاده کنید، یا محصول را غیرفعال کنید." }
    ]
  }
];

export default function HelpClient() {
  const [openSection, setOpenSection] = useState("quickstart");

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #8764B8, #6B4C9C)" }}>
            <Icon name="help" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">راهنما</div>
            <div className="page-header-sub">آموزش استفاده از پنل مدیریت</div>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12
      }}>
        {SECTIONS.map(function(s, i) {
          const isOpen = openSection === s.id;
          return (
            <div
              key={s.id}
              className="anim-in"
              style={{
                animationDelay: (i * 40) + "ms",
                background: "#FFFFFF",
                border: isOpen ? "1px solid " + s.color : "1px solid #D1D5DB",
                borderRadius: 12,
                overflow: "hidden"
              }}
            >
              <button
                onClick={function() { setOpenSection(isOpen ? null : s.id); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "right",
                  fontFamily: "inherit"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  display: "grid", placeItems: "center",
                  background: "linear-gradient(135deg, " + s.color + ", " + s.color + "cc)",
                  color: "#FFFFFF",
                  flexShrink: 0
                }}>
                  <Icon name={s.icon} size={18} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 900, color: "#1A1D21" }}>
                  {s.title}
                </div>
                <div style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                  color: "#7A8290"
                }}>
                  <Icon name="arrowLeft" size={16} />
                </div>
              </button>

              {isOpen && (
                <div className="anim-in" style={{
                  padding: "0 16px 16px",
                  borderTop: "1px solid #E5E7EB",
                  paddingTop: 16
                }}>
                  {s.content === "steps" && (
                    <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {s.steps.map(function(step, j) {
                        return (
                          <li key={j} style={{
                            display: "flex", gap: 10, alignItems: "flex-start",
                            padding: "8px 0",
                            borderBottom: j < s.steps.length - 1 ? "1px solid #F4F5F7" : "none"
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 7,
                              display: "grid", placeItems: "center",
                              background: "#F4F5F7",
                              color: "#4B5160",
                              fontWeight: 900, fontSize: 11, flexShrink: 0
                            }}>
                              {j + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#1A1D21", marginBottom: 2 }}>
                                {step.t}
                              </div>
                              <div style={{ fontSize: 11.5, color: "#7A8290", fontWeight: 600, lineHeight: 1.6 }}>
                                {step.d}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {s.content === "table" && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                        <thead>
                          <tr style={{ background: "#F4F5F7" }}>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 900, color: "#4B5160", borderRadius: "8px 0 0 8px" }}>نوع</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 900, color: "#4B5160" }}>ابعاد</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 900, color: "#4B5160" }}>حجم</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 900, color: "#4B5160", borderRadius: "0 8px 8px 0" }}>فرمت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map(function(r, j) {
                            return (
                              <tr key={j} style={{ borderBottom: "1px solid #F4F5F7" }}>
                                <td style={{ padding: "8px 10px", fontWeight: 800, color: "#1A1D21" }}>{r.label}</td>
                                <td style={{ padding: "8px 10px", color: "#4B5160", fontFamily: "monospace", fontSize: 11 }}>{r.size}</td>
                                <td style={{ padding: "8px 10px", color: "#4B5160", fontFamily: "monospace", fontSize: 11 }}>{r.max}</td>
                                <td style={{ padding: "8px 10px", color: "#7A8290", fontSize: 10.5 }}>{r.format}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {s.content === "tips" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      {s.tips.map(function(t, j) {
                        return (
                          <div key={j} style={{
                            padding: 10,
                            background: "#F4F5F7",
                            borderRadius: 9,
                            borderInlineStart: "3px solid " + s.color
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#1A1D21", marginBottom: 3 }}>
                              {t.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#4B5160", fontWeight: 600, lineHeight: 1.6 }}>
                              {t.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {s.content === "shortcuts" && (
                    <div style={{ display: "grid", gap: 6 }}>
                      {s.shortcuts.map(function(sc, j) {
                        return (
                          <div key={j} style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            background: "#F4F5F7",
                            borderRadius: 9,
                            gap: 10
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D21" }}>{sc.action}</span>
                            <span style={{
                              fontFamily: "monospace",
                              fontSize: 11,
                              fontWeight: 900,
                              background: "#FFFFFF",
                              padding: "4px 10px",
                              borderRadius: 7,
                              border: "1px solid #D1D5DB",
                              color: "#4B5160",
                              direction: "ltr"
                            }}>
                              {sc.key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {s.content === "faq" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      {s.faqs.map(function(f, j) {
                        return (
                          <details key={j} style={{
                            background: "#F4F5F7",
                            borderRadius: 9,
                            padding: "10px 12px"
                          }}>
                            <summary style={{
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 900,
                              color: "#1A1D21",
                              listStyle: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 8
                            }}>
                              <Icon name="info" size={14} />
                              {f.q}
                            </summary>
                            <div style={{
                              fontSize: 11.5,
                              color: "#4B5160",
                              fontWeight: 600,
                              lineHeight: 1.7,
                              marginTop: 8,
                              paddingInlineStart: 22
                            }}>
                              {f.a}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="anim-in" style={{
        marginTop: 20,
        padding: 16,
        background: "linear-gradient(135deg, #FFF9E6, #FEF3C7)",
        border: "1px solid #E0A81A",
        borderRadius: 12
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, #E0A81A, #B8850A)",
            color: "#FFFFFF", flexShrink: 0
          }}>
            <Icon name="mail" size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#1A1D21", marginBottom: 2 }}>
              نیاز به کمک بیشتری دارید؟
            </div>
            <div style={{ fontSize: 11.5, color: "#8A6508", fontWeight: 700 }}>
              با پشتیبانی فنی از طریق بخش «تماس با ما» در سایت در ارتباط باشید
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
