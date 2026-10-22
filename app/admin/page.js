import { getMessages } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getProducts } from "@/lib/product-store";
import { getCategories } from "@/lib/category-store";
import { getArticles } from "@/lib/articles";
import { getNews, getServices } from "@/lib/content";
import Link from "next/link";

const ICONS = {
  package: <><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  newspaper: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9a2 2 0 0 1 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  sparkles: <><path d="M12 3l1.9 5.8L20 10.5l-5.8 1.9L12 18.3l-1.9-5.9L4.3 10.5l5.8-1.7L12 3z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
  checkout: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
};

function Ico({ name, size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || ICONS.settings}
    </svg>
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const messages = getMessages();
  const products = getProducts();
  const categories = getCategories();
  const media = getMedia();
  const services = getServices();
  const news = getNews();
  const articles = getArticles();

  const unread = messages.filter(function (m) { return !m.read; }).length;
  const pendingNews = news.filter(function (item) { return item.status === "pending"; }).length;
  const pendingArticles = articles.filter(function (item) { return item.status === "pending"; }).length;
  const mediaCount = (media.videos?.length || 0) + (media.catalogs?.length || 0) + (media.gallery?.length || 0);
  const pendingTotal = pendingNews + pendingArticles;

  const todayLabel = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const stats = [
    { href: "/admin/products", label: "محصولات", value: products.length, icon: "package", color: "#C9950D" },
    { href: "/admin/categories", label: "دسته و سری", value: categories.length, icon: "layers", color: "#4F6BED" },
    { href: "/admin/news", label: "اخبار", value: news.length, icon: "newspaper", color: "#00A896", badge: pendingNews },
    { href: "/admin/articles", label: "مقاله‌ها", value: articles.length, icon: "file", color: "#8764B8", badge: pendingArticles },
    { href: "/admin/media", label: "رسانه", value: mediaCount, icon: "image", color: "#107C10" },
    { href: "/admin/messages", label: "پیام‌ها", value: messages.length, icon: "mail", color: "#E81123", badge: unread }
  ];

  const quickLinks = [
    { href: "/admin/products/new", label: "محصول جدید", icon: "package" },
    { href: "/admin/news", label: "افزودن خبر", icon: "newspaper" },
    { href: "/admin/categories", label: "سری محصولات", icon: "layers" },
    { href: "/admin/media", label: "گالری و رسانه", icon: "image" },
    { href: "/admin/content", label: "مرکز محتوا", icon: "sparkles" },
    { href: "/admin/site-chrome", label: "هدر و فوتر", icon: "settings" },
    { href: "/admin/cv-tables", label: "جدول Cv", icon: "checkout" },
    { href: "/admin/settings", label: "تنظیمات کلی", icon: "palette" }
  ];

  return (
    <div>
      <section className="dash-hero anim-in">
        <div className="dash-hero-copy">
          <span className="dash-eyebrow">
            <Ico name="sparkles" size={12} />
            مرکز فرمان پتروسازه میهن
          </span>
          <h1>سلام، به پنل مدیریت خوش آمدید</h1>
          <p>
            وضعیت محتوا، محصولات و پیام‌های سایت در یک نگاه. {products.length} محصول در {categories.length} دسته،
            {" "}{services.length} خدمت و {mediaCount} فایل رسانه‌ای فعال است.
          </p>
          <div className="dash-hero-meta">
            <span><Ico name="calendar" size={13} /> {todayLabel}</span>
            {unread > 0 ? (
              <span><Ico name="mail" size={13} /> {unread} پیام خوانده‌نشده</span>
            ) : (
              <span><Ico name="checkout" size={13} /> صندوق پیام‌ها خالی است</span>
            )}
            {pendingTotal > 0 && (
              <span><Ico name="file" size={13} /> {pendingTotal} مورد در انتظار بررسی</span>
            )}
          </div>
        </div>
        <div className="dash-hero-side">
          <Link href="/admin/products/new" className="dash-hero-action dash-hero-action-primary">
            <Ico name="plus" size={15} /> محصول جدید
          </Link>
          <Link href="/admin/news" className="dash-hero-action">
            <Ico name="newspaper" size={15} /> افزودن خبر
          </Link>
          <Link href="/fa" target="_blank" rel="noopener noreferrer" className="dash-hero-action">
            <Ico name="external" size={15} /> مشاهده سایت
          </Link>
        </div>
      </section>

      <div className="dash-stats">
        {stats.map(function (s, i) {
          return (
            <Link
              key={s.href + i}
              href={s.href}
              className="dash-stat anim-in"
              style={{ "--dash-color": s.color, animationDelay: (i * 35) + "ms" }}
            >
              <div className="dash-stat-top">
                <span className="dash-stat-icon"><Ico name={s.icon} size={17} /></span>
                {s.badge > 0 ? (
                  <span className="dash-stat-badge">{s.badge > 9 ? "9+" : s.badge}</span>
                ) : null}
              </div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="dash-grid">
        <section className="dash-card anim-in" style={{ animationDelay: "180ms" }}>
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Ico name="mail" size={15} /> آخرین پیام‌ها</h2>
            <Link href="/admin/messages" className="dash-card-link">
              همه پیام‌ها <Ico name="arrowLeft" size={12} />
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="dash-card-empty">
              <div className="dash-card-empty-icon"><Ico name="mail" size={24} /></div>
              <strong>هنوز پیامی دریافت نشده</strong>
              <p>پیام‌های فرم تماس سایت در این بخش نمایش داده می‌شوند.</p>
            </div>
          ) : (
            <div>
              {messages.slice(0, 6).map(function (m) {
                return (
                  <Link key={m.id} href="/admin/messages" className="dash-message">
                    <span className={"dash-message-dot" + (m.read ? "" : " dash-message-dot-unread")} />
                    <span className="dash-message-body">
                      <span className="dash-message-name">
                        {m.name || "کاربر"}
                        {!m.read && <span className="chip chip-red">جدید</span>}
                      </span>
                      <span className="dash-message-text">{m.message || "—"}</span>
                    </span>
                    <span className="dash-message-date">{new Date(m.createdAt).toLocaleDateString("fa-IR")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="dash-card anim-in" style={{ animationDelay: "240ms" }}>
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Ico name="sparkles" size={15} /> دسترسی سریع</h2>
          </div>
          <div className="dash-quick-grid">
            {quickLinks.map(function (item) {
              return (
                <Link key={item.href + item.label} href={item.href} className="dash-quick">
                  <span className="dash-quick-icon"><Ico name={item.icon} size={14} /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
