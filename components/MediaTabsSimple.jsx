"use client";
import { useState } from "react";
import { FileText, Download, Film, Library, Camera, Newspaper, ArrowLeft, Calendar, Images, Clock } from "lucide-react";
import Link from "next/link";
import VideoEmbed from "./VideoEmbed";
import { newsGallery, formatNewsDate } from "@/lib/news-utils";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const MEDIA_COPY = {
  fa: {
    news: "تازه‌ترین خبرها و اطلاعیه‌های پتروسازه میهن را در این بخش دنبال کنید.",
    article: "مطالب تخصصی و آموزشی برای آشنایی بیشتر با محصولات و مهندسی شیرآلات.",
    video: "ویدئو را پخش کنید تا با محصولات، فرایندها و فعالیت‌های شرکت بیشتر آشنا شوید.",
    videoTag: "ویدئو",
    videoCaption: "ویدئوی رسمی پتروسازه میهن؛ برای پخش روی تصویر کلیک کنید.",
    catalog: "برای مشاهده اطلاعات تکمیلی، کاتالوگ PDF را باز کنید یا آن را دانلود کنید.",
    gallery: "تصاویری از محصولات، امکانات و فعالیت‌های پتروسازه میهن.",
    newsEmpty: "خبر تازه‌ای منتشر نشده است. خبرها پس از انتشار در این بخش نمایش داده می‌شوند.",
    articleEmpty: "مقاله‌ای برای نمایش موجود نیست. مطالب آموزشی جدید در همین بخش قرار می‌گیرند.",
    videoEmpty: "ویدئویی در این بخش موجود نیست. ویدئوهای تازه پس از انتشار نمایش داده می‌شوند.",
    catalogEmpty: "کاتالوگی برای نمایش موجود نیست. کاتالوگ‌های منتشرشده از اینجا در دسترس خواهند بود.",
    galleryEmpty: "تصویری در گالری موجود نیست. تصاویر تازه پس از بارگذاری در این بخش نمایش داده می‌شوند.",
    view: "مشاهده",
    galleryTitle: "تصویر گالری"
  },
  en: {
    news: "Follow the latest news and announcements from Petro Sazeh Mihan.",
    article: "Technical and educational resources about our products and valve engineering.",
    video: "Play the video to learn more about our products, processes, and activities.",
    videoTag: "Video",
    videoCaption: "Official Petro Sazeh Mihan video — click to play.",
    catalog: "Open or download the PDF catalog for additional product information.",
    gallery: "Images of Petro Sazeh Mihan products, facilities, and activities.",
    newsEmpty: "There is no recent news to display. New announcements will appear here.",
    articleEmpty: "There are no articles to display. New educational resources will appear here.",
    videoEmpty: "There are no videos to display. New videos will appear here when available.",
    catalogEmpty: "There are no catalogs to display. Published catalogs will be available here.",
    galleryEmpty: "The gallery is empty. New images will appear here after they are uploaded.",
    view: "View",
    galleryTitle: "Gallery image"
  },
  ar: {
    news: "تابعوا أحدث أخبار وإعلانات شركة بترو سازه ميهن.",
    article: "مواد فنية وتعليمية للتعرف على منتجاتنا وهندسة الصمامات.",
    video: "شغّل الفيديو للتعرف أكثر على منتجاتنا وعملياتنا وأنشطتنا.",
    videoTag: "فيديو",
    videoCaption: "فيديو رسمي من بترو سازه ميهن — انقر للتشغيل.",
    catalog: "افتح كتالوج PDF أو نزّله للاطلاع على معلومات إضافية عن المنتجات.",
    gallery: "صور منتجات ومرافق وأنشطة شركة بترو سازه ميهن.",
    newsEmpty: "لا توجد أخبار حديثة للعرض. ستظهر الإعلانات الجديدة هنا.",
    articleEmpty: "لا توجد مقالات للعرض. ستتوفر المواد التعليمية الجديدة هنا.",
    videoEmpty: "لا توجد فيديوهات للعرض. ستظهر الفيديوهات الجديدة عند توفرها.",
    catalogEmpty: "لا توجد كتالوجات للعرض. ستكون الكتالوجات المنشورة متاحة هنا.",
    galleryEmpty: "المعرض فارغ. ستظهر الصور الجديدة هنا بعد رفعها.",
    view: "عرض",
    galleryTitle: "صورة من المعرض"
  },
  ru: {
    news: "Следите за последними новостями и объявлениями Petro Sazeh Mihan.",
    article: "Технические и образовательные материалы о продукции и арматуре.",
    video: "Посмотрите видео, чтобы узнать больше о продукции, процессах и работе компании.",
    videoTag: "Видео",
    videoCaption: "Официальное видео Petro Sazeh Mihan — нажмите, чтобы воспроизвести.",
    catalog: "Откройте или скачайте PDF-каталог для получения дополнительной информации.",
    gallery: "Фотографии продукции, объектов и деятельности Petro Sazeh Mihan.",
    newsEmpty: "Свежих новостей пока нет. Новые объявления появятся здесь.",
    articleEmpty: "Статей пока нет. Новые обучающие материалы будут опубликованы здесь.",
    videoEmpty: "Видео пока нет. Новые ролики появятся здесь после публикации.",
    catalogEmpty: "Каталогов пока нет. Опубликованные каталоги будут доступны здесь.",
    galleryEmpty: "Галерея пуста. Новые изображения появятся здесь после загрузки.",
    view: "Открыть",
    galleryTitle: "Изображение галереи"
  }
};

function fallbackText(locale, key) {
  return MEDIA_COPY[locale]?.[key] || MEDIA_COPY.en[key];
}

function videoTitle(video, locale) {
  const title = video && video.title;
  if (!title) return "";
  if (typeof title === "string") return title;
  return title[locale] || title.fa || title.en || "";
}

function formatVideoDuration(value, locale) {
  if (typeof value === "string" && value.includes(":")) return value;
  const seconds = Math.round(Number(value) || 0);
  if (seconds <= 0) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const padded = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  return hours
    ? `${hours}:${padded.format(minutes)}:${padded.format(rest)}`
    : `${padded.format(minutes)}:${padded.format(rest)}`;
}

function MediaCover({ src, title, alt, fallback }) {
  return (
    <div className="aspect-video overflow-hidden bg-[var(--bg-soft)]">
      <img
        src={src || fallback}
        alt={alt || title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        loading="lazy"
      />
    </div>
  );
}

export default function MediaTabsSimple({ media, news, articles, locale, dict, initialTab }) {
  const validTabs = ["news", "articles", "videos", "catalogs", "gallery"];
  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : "news");

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
              aria-pressed={active}
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
          <VideosGrid
            videos={media.videos || []}
            locale={locale}
            dict={dict}
            aparatUnavailable={media.aparatUnavailable}
          />
        )}
        {tab === "catalogs" && (
          <CatalogsGrid
            catalogs={media.catalogs || []}
            dict={dict}
            locale={locale}
          />
        )}
        {tab === "gallery" && (
          <GalleryGrid items={media.gallery || []} dict={dict} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, description, Icon, image }) {
  const I = Icon || Newspaper;
  return (
    <div className="card-glass mx-auto max-w-2xl overflow-hidden rounded-2xl">
      <MediaCover src={image} title={text} fallback="/images/media/article-cover.svg" />
      <div className="p-6 text-center sm:p-8">
        <I size={28} style={{ color: "var(--gold)", margin: "0 auto 12px" }} aria-hidden="true" />
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{text}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-soft">{description}</p>
      </div>
    </div>
  );
}

function NewsGrid({ items, locale, dict }) {
  const active = items.filter(function(n) { return n.active !== false; });
  if (active.length === 0) {
    return <EmptyState text={fallbackText(locale, "newsEmpty")} description={fallbackText(locale, "news")} Icon={Newspaper} image="/images/media/news-cover.svg" />;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {active.map(function(n) {
        const title = pick(n.title, locale) || fallbackText(locale, "newsEmpty");
        const images = newsGallery(n);
        return (
          <Link
            key={n.slug || n.id}
            href={"/" + locale + "/news/" + n.slug}
            className="card-glass group flex h-full flex-col overflow-hidden transition hover:border-gold-500/40"
          >
            <div className="relative">
              <MediaCover src={images[0]} title={title} fallback="/images/media/news-cover.svg" />
              {images.length > 1 && (
                <span className="absolute bottom-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-white"
                  style={{ insetInlineStart: 8, background: "rgba(0,0,0,0.65)" }}>
                  <Images size={10} /> {images.length}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 min-h-4 text-xs font-bold" style={{ color: "var(--gold)" }}>
                {pick(n.category, locale) || fallbackText(locale, "news").split(".")[0]}
              </div>
              <h3 className="mb-2 font-bold text-base leading-7" style={{ color: "var(--text)" }}>{title}</h3>
              <p className="flex-1 text-sm leading-6 text-soft">
                {pick(n.excerpt, locale) || fallbackText(locale, "news")}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatNewsDate(n.date, locale) || "—"}
                </span>
                <span className="flex items-center gap-1 font-bold" style={{ color: "var(--gold)" }}>
                  {(dict.media && dict.media.readMore) || "ادامه"} <ArrowLeft size={12} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ArticlesGrid({ items, locale, dict }) {
  if (!items.length) return <EmptyState text={fallbackText(locale, "articleEmpty")} description={fallbackText(locale, "article")} Icon={FileText} image="/images/media/article-cover.svg" />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(function(a) {
        const title = pick(a.title, locale) || fallbackText(locale, "articleEmpty");
        const readTime = a.readMinutes
          ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
          : a.readTime;
        return (
          <Link
            key={a.slug}
            href={"/" + locale + "/articles/" + a.slug}
            className="card-glass group flex h-full flex-col overflow-hidden transition hover:border-gold-500/40"
          >
            <MediaCover src={a.image || a.cover || a.thumbnail} title={title} fallback="/images/media/article-cover.svg" />
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 min-h-4 text-xs font-bold" style={{ color: "var(--gold)" }}>
                {pick(a.category, locale) || fallbackText(locale, "article").split(".")[0]}
              </div>
              <h3 className="font-bold text-base leading-7 transition group-hover:text-gold-500" style={{ color: "var(--text)" }}>
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-soft">
                {pick(a.excerpt, locale) || fallbackText(locale, "article")}
              </p>
              <div className="mt-5 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{pick(a.date, locale)}</span>
                <span>{readTime}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function VideosGrid({ videos, locale, dict, aparatUnavailable }) {
  const unavailableText = {
    fa: "اتصال به کانال آپارات برقرار نشد؛ ویدئوهای ذخیره‌شده در سایت نمایش داده می‌شوند.",
    en: "Could not reach the Aparat channel. Videos saved on this site are shown instead.",
    ar: "تعذر الاتصال بقناة آپارات؛ يتم عرض الفيديوهات المحفوظة على هذا الموقع.",
    ru: "Не удалось подключиться к каналу Aparat. Показаны видео, сохраненные на этом сайте."
  }[locale] || "Could not reach the Aparat channel.";

  return (
    <>
      {aparatUnavailable && (
        <p className="mb-5 rounded-xl px-4 py-3 text-sm"
          role="status"
          style={{ color: "var(--text-soft)", background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
          {unavailableText}
        </p>
      )}
      {!videos.length ? (
        <EmptyState text={fallbackText(locale, "videoEmpty")} description={fallbackText(locale, "video")} Icon={Film} image="/images/media/video-cover.svg" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map(function(v) {
            const title = videoTitle(v, locale) || fallbackText(locale, "videoTag");
            const caption = pick(v.description, locale) || fallbackText(locale, "videoCaption");
            const duration = formatVideoDuration(v.duration, locale);
            const date = v.publishedAt ? formatNewsDate(v.publishedAt, locale) : "";
            return (
              <div key={v.id} className="card-glass group flex h-full flex-col overflow-hidden">
                <VideoEmbed url={v.url} title={title} poster={v.poster || "/images/media/video-cover.svg"} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "var(--gold)" }}>
                    <Film size={11} aria-hidden="true" />
                    {fallbackText(locale, "videoTag")}
                    {duration ? (
                      <span className="ms-auto inline-flex items-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                        <Clock size={10} aria-hidden="true" />
                        {duration}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold leading-6 transition group-hover:text-gold-500" style={{ color: "var(--text)" }}>
                    {title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-soft">{caption}</p>
                  {date ? (
                    <div className="mt-3 flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <Calendar size={10} aria-hidden="true" />
                      {date}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function CatalogsGrid({ catalogs, dict, locale }) {
  if (!catalogs.length) return <EmptyState text={fallbackText(locale, "catalogEmpty")} description={fallbackText(locale, "catalog")} Icon={Library} image="/images/media/catalog-cover.svg" />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {catalogs.map(function(c) {
        const title = pick(c.title, locale) || "Catalog";
        return (
          <article key={c.id} className="card-glass group flex h-full flex-col overflow-hidden transition hover:border-gold-500/50">
            <MediaCover src={c.cover} title={title} fallback="/images/media/catalog-cover.svg" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-bold text-base leading-7" style={{ color: "var(--text)" }}>{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-soft">
                {pick(c.description, locale) || fallbackText(locale, "catalog")}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={c.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: "var(--text-soft)" }} aria-label={`${fallbackText(locale, "view")} ${title}`}>
                <FileText size={14} />
                {fallbackText(locale, "view")}
              </a>
              <a href={c.url} download
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: "var(--gold)" }}>
                <Download size={14} />
                {(dict.media && dict.media.downloadCatalog) || "دانلود"}
              </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function GalleryGrid({ items, dict, locale }) {
  if (!items.length) return <EmptyState text={fallbackText(locale, "galleryEmpty")} description={fallbackText(locale, "gallery")} Icon={Camera} image="/images/media/article-cover.svg" />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(function(img) {
        const title = pick(img.title, locale) || fallbackText(locale, "galleryTitle");
        return (
          <a
            key={img.id}
            href={img.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-glass group flex h-full flex-col overflow-hidden"
          >
            <MediaCover src={img.url} title={title} alt={img.alt || title} fallback="/images/media/article-cover.svg" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{title}</h3>
              <p className="mt-2 text-sm leading-6 text-soft">{fallbackText(locale, "gallery")}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
