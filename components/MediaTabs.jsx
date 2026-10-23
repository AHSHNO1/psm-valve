"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Film, Library, Camera, Newspaper, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import VideoEmbed from "./VideoEmbed";
import MediaImage from "./MediaImage";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function MediaTabs({ media, news, articles, dict, locale }) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") || "news";
  const [tab, setTab] = useState(urlTab);

  useEffect(function() { setTab(urlTab); }, [urlTab]);

  const tabs = [
    { id: "news", label: dict.media && dict.media.news || "اخبار", icon: Newspaper, count: (news || []).length, color: "#00C2CE" },
    { id: "articles", label: dict.media && dict.media.articles || "مقالات و آموزش", icon: FileText, count: (articles || []).length, color: "#8764B8" },
    { id: "videos", label: dict.media && dict.media.videos || "ویدئوها", icon: Film, count: (media.videos || []).length, color: "#E81123" },
    { id: "catalogs", label: dict.media && dict.media.catalogs || "کاتالوگ‌ها", icon: Library, count: (media.catalogs || []).length, color: "#0078D4" },
    { id: "gallery", label: dict.media && dict.media.gallery || "تصاویر", icon: Camera, count: (media.gallery || []).length, color: "#107C10" }
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl mb-8 overflow-x-auto"
        style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
        {tabs.map(function(tb) {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button key={tb.id} onClick={function() { setTab(tb.id); }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
              style={{
                background: active ? "var(--gold-grad)" : "transparent",
                color: active ? "#1A1D21" : "var(--text-soft)"
              }}>
              <Icon size={15} />
              {tb.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? "rgba(0,0,0,0.15)" : "var(--bg-card)"
                }}>
                {tb.count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}>
          {tab === "news" && <NewsGrid items={news || []} locale={locale} dict={dict} />}
          {tab === "articles" && <ArticlesGrid items={articles || []} locale={locale} dict={dict} />}
          {tab === "videos" && <VideosGrid videos={media.videos || []} locale={locale} dict={dict} />}
          {tab === "catalogs" && <CatalogsGrid catalogs={media.catalogs || []} dict={dict} />}
          {tab === "gallery" && <GalleryGrid items={media.gallery || []} dict={dict} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ text, icon: Icon }) {
  const I = Icon || Newspaper;
  return (
    <div className="rounded-2xl p-12 text-center"
      style={{ background: "var(--bg-card)", border: "1px dashed var(--border-strong)" }}>
      <I size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}

function NewsGrid({ items, locale, dict }) {
  const active = items.filter(function(n) { return n.active !== false; });
  if (active.length === 0) return <EmptyState text={dict.media && dict.media.empty || "به‌زودی محتوا اضافه می‌شود"} icon={Newspaper} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {active.map(function(n) {
        return (
          <div key={n.id} className="card-glass overflow-hidden hover:border-gold-500/40 transition flex flex-col">
            {n.image && (
              <div className="relative aspect-video overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <MediaImage src={n.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-xs font-bold mb-3" style={{ color: "var(--gold)" }}>{pick(n.category, locale)}</div>
              <h3 className="font-bold text-base leading-7 mb-3" style={{ color: "var(--text)" }}>{pick(n.title, locale)}</h3>
              <p className="text-sm leading-6 flex-1" style={{ color: "var(--text-soft)" }}>{pick(n.excerpt, locale)}</p>
              <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1"><Calendar size={12} /> {n.date || "—"}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                  {dict.media && dict.media.readMore || "ادامه"} <ArrowLeft size={12} />
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
  if (!items.length) return <EmptyState text={dict.media && dict.media.empty || "به‌زودی"} icon={FileText} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(function(a) {
        return (
          <Link key={a.slug} href={"/" + locale + "/articles/" + a.slug}
            className="card-glass p-6 hover:border-gold-500/40 transition-all group">
            <div className="text-xs font-bold" style={{ color: "var(--gold)" }}>{pick(a.category, locale)}</div>
            <h3 className="mt-3 font-bold text-base leading-7 transition group-hover:text-gold-500"
              style={{ color: "var(--text)" }}>{pick(a.title, locale)}</h3>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-soft)" }}>{pick(a.excerpt, locale)}</p>
            <div className="mt-5 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{pick(a.date, locale)}</span>
              <span>
                {a.readMinutes
                  ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
                  : a.readTime}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function VideosGrid({ videos, locale, dict }) {
  if (!videos.length) return <EmptyState text={dict.media && dict.media.empty || "به‌زودی"} icon={Film} />;
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
  if (!catalogs.length) return <EmptyState text={dict.media && dict.media.empty || "به‌زودی"} icon={Library} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {catalogs.map(function(c) {
        return (
          <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" download
            className="card-glass p-6 group hover:border-gold-500/50 transition flex flex-col">
            <div className="w-14 h-14 rounded-xl grid place-items-center mb-4"
              style={{ background: "var(--glow)", color: "var(--gold)" }}>
              <FileText size={26} />
            </div>
            <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{c.title || "Catalog"}</h3>
            {c.description && (
              <p className="text-xs leading-5 flex-1" style={{ color: "var(--text-soft)" }}>{c.description}</p>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--gold)" }}>
              <Download size={14} /> {dict.media && dict.media.downloadCatalog || "دانلود"}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function GalleryGrid({ items, dict }) {
  if (!items.length) return <EmptyState text={dict.media && dict.media.empty || "به‌زودی"} icon={Camera} />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map(function(img) {
        return (
          <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer"
            className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
            <MediaImage src={img.url} alt={img.title || "Gallery"} fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          </a>
        );
      })}
    </div>
  );
}
