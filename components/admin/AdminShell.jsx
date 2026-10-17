"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import NotificationsPanel from "./NotificationsPanel";

function Ico({ name, size }) {
  const s = size || 16;
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    package: <><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    newspaper: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9a2 2 0 0 1 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></>,
    sparkles: <><path d="M12 3l1.9 5.8L20 10.5l-5.8 1.9L12 18.3l-1.9-5.9L4.3 10.5l5.8-1.7L12 3z"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.grid}
    </svg>
  );
}

const NAV_GROUPS = [
  {
    label: "داشبورد",
    items: [
      { href: "/admin", label: "داشبورد", icon: "grid" }
    ]
  },
  {
    label: "محتوا",
    items: [
      { href: "/admin/content", label: "مدیریت محتوای سایت", icon: "layers" },
      { href: "/admin/services", label: "خدمات", icon: "cog" },
      { href: "/admin/news", label: "اخبار", icon: "newspaper" },
      { href: "/admin/articles", label: "مقاله‌ها", icon: "file" },
      { href: "/admin/certificates", label: "گواهینامه‌ها", icon: "award" },
      { href: "/admin/faq", label: "سوالات متداول", icon: "help" },
      { href: "/admin/projects", label: "پروژه‌ها", icon: "package" }
    ]
  },
  {
    label: "ارتباطات",
    items: [
      { href: "/admin/messages", label: "پیام‌ها", icon: "mail" },
      { href: "/admin/testimonials", label: "نظرات مشتریان", icon: "star" },
      { href: "/admin/partners", label: "همراهان", icon: "building" }
    ]
  },
  {
    label: "سیستم",
  items: [
    { href: "/admin/security", label: "امنیت", icon: "lock" },
      { href: "/admin/users", label: "نویسندگان", icon: "user" },
      { href: "/admin/help", label: "راهنما", icon: "help" }
    ]
  }
];

export default function AdminShell({ children, notifications = [], unreadCount = 0, userRole = "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [liveMessages, setLiveMessages] = useState(null);
  const [liveMessageUnreadCount, setLiveMessageUnreadCount] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const navigationGroups = userRole === "author"
    ? [{ label: "نویسنده", items: [{ href: "/admin/author", label: "پیش‌نویس‌های من", icon: "file" }] }]
    : NAV_GROUPS;
  const staticNotifications = notifications.filter((item) => item.type !== "message");
  const visibleNotifications = liveMessages === null
    ? notifications
    : staticNotifications.concat(liveMessages);
  const staticUnreadCount = staticNotifications.filter((item) => item.unread).length;
  const visibleUnreadCount = liveMessageUnreadCount === null
    ? unreadCount
    : liveMessageUnreadCount + staticUnreadCount;

  useEffect(function() { setSidebarOpen(false); }, [pathname]);

  useEffect(function() {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setNotifOpen(true);
      }
      if (e.key === "Escape") {
        setNotifOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(function() {
    if (userRole !== "admin") return;
    let active = true;

    async function refreshMessages() {
      try {
        const response = await fetch("/api/messages?summary=1", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.ok || !Array.isArray(data.messages)) {
          throw new Error(data.error || "Unable to refresh notifications");
        }
        if (!active) return;
        setLiveMessages(data.messages.map((message) => {
          const createdAt = message.createdAt || "";
          return {
            id: "msg-" + message.id,
            type: "message",
            title: message.name || "پیام جدید",
            description: (message.message || "").substring(0, 100),
            href: "/admin/messages",
            unread: !message.read,
            createdAt,
            time: createdAt ? new Date(createdAt).toLocaleString("fa-IR") : "—"
          };
        }));
        setLiveMessageUnreadCount(Number(data.unreadCount) || 0);
        setNotificationError("");
      } catch (error) {
        if (active) {
          setNotificationError("به‌روزرسانی اعلان پیام‌ها ناموفق بود.");
          console.error("Unable to refresh admin message notifications:", error);
        }
      }
    }

    refreshMessages();
    const timer = setInterval(refreshMessages, 30000);
    return function() {
      active = false;
      clearInterval(timer);
    };
  }, [userRole]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem("psm_splash_seen");
    router.push("/admin/login");
    router.refresh();
  }

  let currentLabel = "داشبورد";
  for (let g = 0; g < navigationGroups.length; g++) {
    for (let i = 0; i < navigationGroups[g].items.length; i++) {
      const item = navigationGroups[g].items[i];
      if (item.href === "/admin" && pathname === "/admin") {
        currentLabel = item.label;
      } else if (item.href !== "/admin" && pathname.startsWith(item.href)) {
        currentLabel = item.label;
      }
    }
    if (pathname.startsWith("/admin/products")) currentLabel = "محصولات";
    else if (pathname.startsWith("/admin/slider")) currentLabel = "اسلایدر صفحه اصلی";
    else if (pathname.startsWith("/admin/media")) currentLabel = "گالری و رسانه";
    else if (pathname.startsWith("/admin/content/text")) currentLabel = "متن‌ها و تصاویر سایت";
  }

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="admin-layout">
      <SplashScreen duration={1400} />

      <aside className={"admin-sidebar" + (sidebarOpen ? " admin-sidebar-open" : "")}>
        <div className="admin-brand">
          <div className="admin-brand-logo">PSM</div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div className="admin-brand-title">پنل مدیریت</div>
            <div className="admin-brand-sub">PSM VALVE</div>
          </div>
          <button
            className="head-icon-btn"
            onClick={function() { setSidebarOpen(false); }}
            aria-label="بستن"
            style={{ display: "none" }}
          >
            <Ico name="close" />
          </button>
        </div>

        <nav className="admin-groups">
          {navigationGroups.map(function(group, gi) {
            return (
              <div key={gi} className="admin-group">
                <div className="admin-group-title">{group.label}</div>
                {group.items.map(function(item) {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={"admin-nav-item" + (active ? " admin-nav-item-active" : "")}
                    >
                      <span className="admin-nav-icon">
                        <Ico name={item.icon} size={14} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/fa" target="_blank" className="admin-nav-item">
            <span className="admin-nav-icon"><Ico name="external" size={14} /></span>
            <span>مشاهده سایت</span>
          </Link>
          <button onClick={logout} className="admin-nav-item">
            <span className="admin-nav-icon" style={{ color: "#E81123" }}>
              <Ico name="logout" size={14} />
            </span>
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-overlay" onClick={function() { setSidebarOpen(false); }} />
      )}

      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="head-icon-btn"
              onClick={function() { setSidebarOpen(true); }}
              aria-label="منو"
              style={{ display: "flex" }}
            >
              <Ico name="menu" size={17} />
            </button>
            <div className="admin-breadcrumb">
              <span>پنل</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <span className="admin-breadcrumb-current">{currentLabel}</span>
            </div>
          </div>

          {userRole === "admin" && <button
            onClick={function() { setNotifOpen(true); }}
            className="head-icon-btn"
            aria-label="اعلان‌ها"
            title="اعلان‌ها (Ctrl+K)"
          >
            <Ico name="bell" size={17} />
            {visibleUnreadCount > 0 && (
              <span className="head-badge">
                {visibleUnreadCount > 9 ? "9+" : visibleUnreadCount}
              </span>
            )}
          </button>}
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>

      {userRole === "admin" && (
        <NotificationsPanel
          open={notifOpen}
          onClose={function() { setNotifOpen(false); }}
          items={visibleNotifications}
          unreadCount={visibleUnreadCount}
          error={notificationError}
        />
      )}
    </div>
  );
}
