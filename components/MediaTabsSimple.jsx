"use client";
import { useState } from "react";
import { FileText, Download, Film, Library, Camera, Newspaper, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import VideoEmbed from "./VideoEmbed";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function MediaTabsSimple({ media, news, articles, locale, dict }) {
  const [tab, setTab] = useState("news");

  const tabs = [
    { id: "news", label: (dict.media && dict.media.news) || "اخبار", Icon: Newspaper, count: (news || []).length, color: "#00C2CE" },
    { id: "articles", label: (dict.media && dict.media.articles) || "مقالات", Icon: FileText, count: (articles || []).length, color: "#8764B8" },
    { id: "videos", label: (dict.media && dict.media.videos) || "ویدئوها", Icon: Film, count: (media.videos || []).length, color: "#E81123" },
    { id: "catalogs", label: (dict.media && dict.media.catalogs) || "کاتالوگ‌ها", Icon: Library, count: (media.catalogs || []).length, color: "#0078D4" },
    { id: "gallery", label: (dict.media && dict.media.gallery) || "تصاویر", Icon: Camera, count: (media.gallery || []).length, color: "#107C10" }
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(function(tb) {
          const Icon = tb.Icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={function() { setTab(tb.id); }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all"
              style={{
                background: active ? tb.color : "var(--bg-card)",
                color: active ? "#FFFFFF" : "var(--text-soft)",
                border: "2px solid " + (active ? tb.color : "var(--border)"),
                boxShadow: active ? "0 6px 20px " + tb.color + "40" : "none",
                transform: active ? "translateY(-2px)" : "translateY(0)"
              }}
            >
              <Icon size={16} />
              {tb.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? "rgba(255,255,255,0.25)" : "var(--bg-soft)",
                  color: active ? "#FFFFFF" : "var(--text-muted)"
                }}
              >
                {tb.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === "news" && (
          <NewsGrid items={news || []} locale={locale} dict={dict} />
        )}
        {tab === "articles" && (
          <ArticlesGrid items={articles || []} locale={locale} dict={dict} />
        )}
        {tab === "videos" && (
          <VideosGrid videos={media.videos || []} locale={locale} dict={dict} />
        )}
        {tab === "catalogs" && (
          <CatalogsGrid catalogs={media.catalogs || []} dict={dict} />
        )}
        {tab === "gallery" && (
          <GalleryGrid items={media.gallery || []} dict={dict} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, Icon }) {
  const I = Icon || Newspaper;
  return (
    <div
      className="rounded-2xl p-16 text-center"
      style={{ background: "var(--bg-card)", border: "2px dashed var(--border-strong)" }}
    >
      <I size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
      <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
        {text}
      </p>
    </div>
  );
}

function NewsGrid({ items, locale, dict }) {
  const active = items.filter(function(n) { return n.active !== false; });
  if (active.length === 0) {
    return <EmptyState text={(dict.media && dict.media.empty) || "به‌زودی"} Icon={Newspaper} />;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {active.map(function(n) {
        return (
          <div key={n.id} className="card-glass overflow-hidden hover:border-gold-500/40 transition flex flex-col">
            {n.image && (
              <div className="aspect-video overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <img src={n.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-xs font-bold mb-3" style={{ color: "var(--gold)" }}>
                {pick(n.category, locale)}
              </div>
              <h3 className="font-bold text-base leading-7 mb-3" style={{ color: "var(--text)" }}>
                {pick(n.title, locale)}
              </h3>
              <p className="text-sm leading-6 flex-1" style={{ color: "var(--text-soft)" }}>
                {pick(n.excerpt, locale)}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {n.date || "—"}
                </span>
                <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                  {(dict.media && dict.media.readMore) || "ادامه"} <ArrowLeft size={12} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArticlesGrid({ items, locale, dict }) {
  if (!items.length) return <EmptyState text={(dict.media && dict.media.empty) || "به‌زودی"} Icon={FileText} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(function(a) {
        const readTime = a.readMinutes
          ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
          : a.readTime;
        return (
          <Link
            key={a.slug}
            href={"/" + locale + "/articles/" + a.slug}
            className="card-glass p-6 hover:border-gold-500/40 transition-all group"
          >
            <div className="text-xs font-bold" style={{ color: "var(--gold)" }}>
              {pick(a.category, locale)}
            </div>
            <h3 className="mt-3 font-bold text-base leading-7 transition group-hover:text-gold-500"
              style={{ color: "var(--text)" }}>
              {pick(a.title, locale)}
            </h3>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
              {pick(a.excerpt, locale)}
            </p>
            <div className="mt-5 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{pick(a.date, locale)}</span>
              <span>{readTime}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function VideosGrid({ videos, locale, dict }) {
  if (!videos.length) return <EmptyState text={(dict.media && dict.media.empty) || "به‌زودی"} Icon={Film} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {videos.map(function(v) {
        const title = (v.title && (v.title[locale] || v.title.fa || v.title.en)) || "Video";
        return (
          <div key={v.id} className="card-glass overflow-hidden">
            <VideoEmbed url={v.url} title={title} poster={v.poster} />
            <div className="p-4">
              <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>{title}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatalogsGrid({ catalogs, dict }) {
  if (!catalogs.length) return <EmptyState text={(dict.media && dict.media.empty) || "به‌زودی"} Icon={Library} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {catalogs.map(function(c) {
        return (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="card-glass p-6 group hover:border-gold-500/50 transition flex flex-col"
          >
            <div className="w-14 h-14 rounded-xl grid place-items-center mb-4"
              style={{ background: "var(--glow)", color: "var(--gold)" }}>
              <FileText size={26} />
            </div>
            <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>
              {c.title || "Catalog"}
            </h3>
            {c.description && (
              <p className="text-xs leading-5 flex-1" style={{ color: "var(--text-soft)" }}>
                {c.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--gold)" }}>
              <Download size={14} /> {(dict.media && dict.media.downloadCatalog) || "دانلود"}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function GalleryGrid({ items, dict }) {
  if (!items.length) return <EmptyState text={(dict.media && dict.media.empty) || "به‌زودی"} Icon={Camera} />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map(function(img) {
        return (
          <a
            key={img.id}
            href={img.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}
          >
            <img
              src={img.url}
              alt={img.title || "Gallery"}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          </a>
        );
      })}
    </div>
  );
}
