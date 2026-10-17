import "./admin.css";
import AdminShell from "@/components/admin/AdminShell";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMessages } from "@/lib/db";
import { getMedia } from "@/lib/media";
import { getBranding, getNews } from "@/lib/content";
import { getArticles } from "@/lib/articles";

export const metadata = {
  title: "پنل مدیریت | پترو سازه میهن",
  robots: { index: false, follow: false }
};

function buildNotifications(messages, media, articles, news) {
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
  (articles || []).filter((article) => article.status === "pending").slice(0, 8).forEach((article) => {
    items.push({
      id: "review-article-" + article.id,
      type: "review",
      title: "مقاله برای بررسی مدیر",
      description: article.title?.fa || article.title?.en || article.slug,
      href: "/admin/articles",
      unread: true,
      createdAt: article.updatedAt || article.createdAt
    });
  });
  (news || []).filter((item) => item.status === "pending").slice(0, 8).forEach((item) => {
    items.push({
      id: "review-news-" + item.id,
      type: "review",
      title: "خبر برای بررسی مدیر",
      description: item.title?.fa || item.title?.en || item.slug,
      href: "/admin/news",
      unread: true,
      createdAt: item.updatedAt || item.createdAt
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

export default async function AdminLayout({ children }) {
  const session = await getSession({ cookies: cookies() }, { allowAuthor: true });
  const isAdmin = session && session.role === "admin";

  // دفاع لایه‌ای: فقط middleware نباید نگهبان باشد. مسیر جاری را middleware
  // در هدر می‌گذارد؛ اگر هدر نبود (دور زدن middleware) رفتار fail-closed است.
  const pathname = headers().get("x-psm-pathname") || "";
  const isLoginPage = pathname === "/admin/login";
  const isAuthorArea = pathname === "/admin/author" || pathname.startsWith("/admin/author/");

  if (!session && !isLoginPage) redirect("/admin/login");
  if (session && session.role === "author" && !isAuthorArea) redirect("/admin/author");

  const messages = isAdmin ? getMessages() : [];
  const media = isAdmin ? getMedia() : { gallery: [], videos: [] };
  const articles = isAdmin ? getArticles() : [];
  const news = isAdmin ? getNews() : [];
  const branding = getBranding();
  const notifications = buildNotifications(messages, media, articles, news);
  const unreadCount = messages.filter((m) => !m.read).length +
    articles.filter((item) => item.status === "pending").length +
    news.filter((item) => item.status === "pending").length;

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
        {session ? (
          <AdminShell
            notifications={notifications}
            unreadCount={unreadCount}
            userRole={session.role}
          >
            {children}
          </AdminShell>
        ) : children}
      </body>
    </html>
  );
}
