import { getMessages } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getProducts } from "@/lib/product-store";
import { getNews, getServices } from "@/lib/content";
import Link from "next/link";

function Ico({ name, size }) {
  const s = size || 18;
  const icons = {
    package: <><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    newspaper: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9a2 2 0 0 1 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const messages = getMessages();
  const products = getProducts();
  const media = getMedia();
  const services = getServices();
  const news = getNews();

  const unread = messages.filter(function(m) { return !m.read; }).length;
  const mediaCount = (media.videos?.length || 0) + (media.catalogs?.length || 0) + (media.gallery?.length || 0);

  const stats = [
    { href: "/admin/products", label: "محصولات", value: products.length, icon: "package", color: "#C9950D" },
    { href: "/admin/services", label: "خدمات", value: services.length, icon: "cog", color: "#F7630C" },
    { href: "/admin/news", label: "اخبار", value: news.length, icon: "newspaper", color: "#00A896" },
    { href: "/admin/media", label: "مدیا", value: mediaCount, icon: "image", color: "#107C10" },
    { href: "/admin/messages", label: "پیام‌ها", value: messages.length, icon: "mail", color: "#F59E0B", badge: unread },
    { href: "/admin/products/new", label: "افزودن", value: "+", icon: "plus", color: "#4F6BED", isAction: true }
  ];

  return (
    <div>
      {/* Compact welcome row */}
      <div className="anim-in" style={{
        background: "linear-gradient(135deg, #FFF9E6 0%, #FEF3C7 100%)",
        border: "1px solid #E0A81A",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#1A1D21" }}>
            سلام 👋
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8A6508", marginTop: 2 }}>
            {products.length} محصول · {services.length} خدمت · {mediaCount} مدیا
            {unread > 0 ? " · " + unread + " پیام جدید" : ""}
          </div>
        </div>
        <Link href="/fa" target="_blank" className="btn-add" style={{ fontSize: 12, padding: "7px 14px" }}>
          <Ico name="palette" size={13} /> مشاهده سایت
        </Link>
      </div>

      {/* Compact stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10,
        marginBottom: 20
      }}>
        {stats.map(function(s, i) {
          return (
            <Link
              key={i}
              href={s.href}
              className="anim-in"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.15s",
                animationDelay: (i * 30) + "ms"
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                display: "grid", placeItems: "center",
                background: "linear-gradient(135deg, " + s.color + ", " + s.color + "cc)",
                color: "#FFFFFF",
                flexShrink: 0
              }}>
                <Ico name={s.icon} size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1A1D21", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8290", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
              {s.badge > 0 ? (
                <span style={{
                  position: "absolute",
                  top: 8, insetInlineEnd: 8,
                  minWidth: 18, height: 18, padding: "0 5px",
                  borderRadius: 9,
                  background: "#E81123", color: "#FFFFFF",
                  fontSize: 10, fontWeight: 900,
                  display: "grid", placeItems: "center"
                }}>
                  {s.badge > 9 ? "9+" : s.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Recent messages — compact */}
      <div className="anim-in" style={{ animationDelay: "300ms" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: "#1A1D21", margin: 0 }}>
            آخرین پیام‌ها
          </h2>
          <Link href="/admin/messages" style={{ fontSize: 11, fontWeight: 900, color: "#8A6508", textDecoration: "none" }}>
            همه پیام‌ها ←
          </Link>
        </div>

        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Ico name="mail" size={28} />
            </div>
            <div className="empty-title">هنوز پیامی دریافت نشده</div>
            <div className="empty-desc">پیام‌های فرم تماس اینجا نمایش داده می‌شوند</div>
          </div>
        ) : (
          <div>
            {messages.slice(0, 5).map(function(m, i) {
              return (
                <Link
                  key={m.id}
                  href="/admin/messages"
                  className="row"
                  style={{
                    textDecoration: "none",
                    animationDelay: (i * 20) + "ms"
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: m.read ? "#D1D5DB" : "#E81123",
                    flexShrink: 0
                  }} />
                  <div className="row-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="row-title" style={{ margin: 0, flex: "0 1 auto" }}>
                        {m.name}
                      </span>
                      {!m.read && <span className="chip chip-red">جدید</span>}
                    </div>
                    <div className="row-meta" style={{ marginTop: 4 }}>
                      {(m.message || "").substring(0, 60)}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7A8290", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {new Date(m.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
