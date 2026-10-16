"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function Ico({ name, size }) {
  const s = size || 16;
  const icons = {
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    package: <><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.bell}
    </svg>
  );
}

const TYPE_META = {
  message: { color: "#F59E0B", icon: "mail", label: "پیام" },
  review: { color: "#4F6BED", icon: "clock", label: "بررسی محتوا" },
  media: { color: "#107C10", icon: "image", label: "تصویر" },
  video: { color: "#8764B8", icon: "package", label: "ویدئو" },
  catalog: { color: "#4F6BED", icon: "file", label: "کاتالوگ" },
  product: { color: "#C9950D", icon: "package", label: "محصول" }
};

export default function NotificationsPanel({ open, onClose, items, unreadCount, error = "" }) {
  const [filter, setFilter] = useState("all");

  useEffect(function() {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const unreadItems = (items || []).filter(function(i) { return i.unread; });
  const filtered = filter === "unread" ? unreadItems : (items || []);

  return (
    <>
      <div className="admin-overlay" onClick={onClose} />

      <aside style={{
        position: "fixed",
        top: 0,
        insetInlineEnd: 0,
        height: "100%",
        width: "100%",
        maxWidth: 420,
        background: "#FFFFFF",
        boxShadow: "-12px 0 40px rgba(26, 29, 33, 0.15)",
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        animation: "slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "16px 18px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, #E0A81A, #B8850A)",
            color: "#FFFFFF",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(201, 149, 13, 0.25)"
          }}>
            <Ico name="bell" size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1A1D21", lineHeight: 1.2 }}>
              اعلان‌ها
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7A8290", marginTop: 3 }}>
              {unreadCount > 0 ? unreadCount + " مورد خوانده‌نشده" : "همه خوانده‌شده"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="act-btn"
            title="بستن"
            style={{ width: 36, height: 36 }}
          >
            <Ico name="close" size={16} />
          </button>
        </div>

        {error && (
          <div role="status" style={{ padding: "10px 18px", color: "#991B1B", background: "#FEF2F2", fontSize: 12, fontWeight: 700 }}>
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #F4F5F7", flexShrink: 0 }}>
          <div className="tabs" style={{ margin: 0 }}>
            <button
              onClick={function() { setFilter("all"); }}
              className={"tab" + (filter === "all" ? " tab-active" : "")}
            >
              همه
              <span className="tab-badge">{(items || []).length}</span>
            </button>
            <button
              onClick={function() { setFilter("unread"); }}
              className={"tab" + (filter === "unread" ? " tab-active" : "")}
            >
              خوانده‌نشده
              <span className="tab-badge">{unreadCount}</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: "50px 20px",
              textAlign: "center"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                margin: "0 auto 14px",
                display: "grid", placeItems: "center",
                background: "#F4F5F7",
                color: "#7A8290"
              }}>
                <Ico name="inbox" size={28} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1A1D21", marginBottom: 4 }}>
                اعلانی موجود نیست
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7A8290", lineHeight: 1.6 }}>
                فعالیت‌های جدید اینجا نمایش داده می‌شوند
              </div>
            </div>
          ) : (
            <div>
              {filtered.map(function(item, i) {
                const meta = TYPE_META[item.type] || TYPE_META.message;
                return (
                  <Link
                    key={item.id}
                    href={item.href || "/admin"}
                    onClick={onClose}
                    className="anim-in"
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 12,
                      marginBottom: 8,
                      background: item.unread ? "#FFFBF0" : "#FFFFFF",
                      border: "1px solid " + (item.unread ? "#F5C518" : "#E5E7EB"),
                      borderRadius: 12,
                      textDecoration: "none",
                      transition: "all 0.15s",
                      animationDelay: (i * 25) + "ms",
                      alignItems: "flex-start"
                    }}
                    onMouseEnter={function(e) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 18px rgba(26, 29, 33, 0.08)";
                    }}
                    onMouseLeave={function(e) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 11,
                      display: "grid", placeItems: "center",
                      background: meta.color + "15",
                      color: meta.color,
                      flexShrink: 0
                    }}>
                      <Ico name={meta.icon} size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                        flexWrap: "wrap"
                      }}>
                        <span className="chip chip-gray" style={{
                          background: meta.color + "15",
                          color: meta.color
                        }}>
                          {meta.label}
                        </span>
                        {item.unread && (
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#E81123",
                            boxShadow: "0 0 0 3px rgba(232, 17, 35, 0.15)"
                          }} />
                        )}
                      </div>

                      <div style={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: "#1A1D21",
                        marginBottom: 3,
                        lineHeight: 1.35,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.title || "بدون عنوان"}
                      </div>

                      {item.description && (
                        <div style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#7A8290",
                          lineHeight: 1.5,
                          marginBottom: 6,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {item.description}
                        </div>
                      )}

                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#A5ADB8",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <Ico name="clock" size={10} />
                        {item.time || "همین حالا"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid #E5E7EB",
          flexShrink: 0,
          background: "#FAFBFC"
        }}>
          <Link
            href="/admin/messages"
            onClick={onClose}
            className="btn-add"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "10px",
              fontSize: 12
            }}
          >
            <Ico name="mail" size={14} />
            مشاهده همه پیام‌ها
          </Link>
        </div>
      </aside>
    </>
  );
}
