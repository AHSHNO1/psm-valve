import "./admin.css";
import AdminShell from "@/components/admin/AdminShell";
import { getMessages } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getBranding } from "@/lib/content";

export const metadata = {
  title: "پنل مدیریت | پترو سازه میهن",
  robots: { index: false, follow: false }
};

function buildNotifications(messages, media) {
  const items = [];
  (messages || []).slice(0, 8).forEach((m) => {
    items.push({
      id: "msg-" + m.id,
      type: "message",
      title: m.name || "پیام جدید",
      description: (m.message || "").substring(0, 100),
      href: "/admin/messages",
      unread: !m.read,
      createdAt: m.createdAt
    });
  });
  (media.gallery || []).slice(0, 3).forEach((g) => {
    items.push({
      id: "gallery-" + g.id,
      type: "media",
      title: typeof g.title === "string" ? g.title : (g.title && g.title.fa) || "تصویر جدید",
      description: "تصویر جدید در گالری آپلود شد",
      href: "/admin/media",
      createdAt: g.createdAt
    });
  });
  (media.videos || []).slice(0, 3).forEach((v) => {
    items.push({
      id: "video-" + v.id,
      type: "video",
      title: (v.title && typeof v.title === "object" ? v.title.fa : v.title) || "ویدئو جدید",
      description: "ویدئو جدید آپلود شد",
      href: "/admin/media",
      createdAt: v.createdAt
    });
  });
  items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const now = Date.now();
  return items.map((it) => {
    const created = it.createdAt ? new Date(it.createdAt).getTime() : now;
    const diff = now - created;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    let time = "";
    if (minutes < 1) time = "همین حالا";
    else if (minutes < 60) time = minutes + " دقیقه پیش";
    else if (hours < 24) time = hours + " ساعت پیش";
    else if (days < 30) time = days + " روز پیش";
    else time = new Date(created).toLocaleDateString("fa-IR");
    return { ...it, time };
  });
}

export default function AdminLayout({ children }) {
  const messages = getMessages();
  const media = getMedia();
  const branding = getBranding();
  const notifications = buildNotifications(messages, media);
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        {branding && branding.favicon && (
          <link rel="icon" href={branding.favicon} />
        )}
      </head>
      <body className="admin-body">
        <AdminShell notifications={notifications} unreadCount={unreadCount}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
