"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Images } from "lucide-react";
import MediaImage from "./MediaImage";

const LABELS = {
  fa: { previous: "تصویر قبلی", next: "تصویر بعدی", open: "باز کردن تصویر", count: "تصویر" },
  en: { previous: "Previous image", next: "Next image", open: "Open image", count: "images" },
  ar: { previous: "الصورة السابقة", next: "الصورة التالية", open: "فتح الصورة", count: "صور" },
  ru: { previous: "Предыдущее изображение", next: "Следующее изображение", open: "Открыть изображение", count: "изображений" }
};

export default function NewsGallery({ images = [], title, locale = "fa" }) {
  const [active, setActive] = useState(0);
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const labels = LABELS[locale] || LABELS.en;

  if (list.length === 0) return null;
  const index = Math.min(active, list.length - 1);
  const current = list[index];

  function move(direction) {
    setActive(function(value) {
      return (value + direction + list.length) % list.length;
    });
  }

  return (
    <div className="news-gallery">
      <div className="news-gallery-main">
        <MediaImage
          src={current}
          alt={title ? `${title} — ${index + 1}` : ""}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
        />
        <div className="news-gallery-tools">
          {list.length > 1 && (
            <>
              <button type="button" onClick={function() { move(-1); }} aria-label={labels.previous}>
                <ChevronRight size={17} />
              </button>
              <span dir="ltr">{index + 1} / {list.length}</span>
              <button type="button" onClick={function() { move(1); }} aria-label={labels.next}>
                <ChevronLeft size={17} />
              </button>
            </>
          )}
          <a href={current} target="_blank" rel="noopener noreferrer" aria-label={labels.open}>
            <Expand size={15} />
          </a>
        </div>
      </div>

      {list.length > 1 && (
        <div className="news-gallery-thumbs" role="group" aria-label={labels.count}>
          {list.map(function(image, imageIndex) {
            return (
              <button
                key={image + "-" + imageIndex}
                type="button"
                className={imageIndex === index ? "news-gallery-thumb-active" : ""}
                onClick={function() { setActive(imageIndex); }}
                aria-label={`${labels.count} ${imageIndex + 1}`}
                aria-pressed={imageIndex === index}
              >
                <MediaImage src={image} alt="" fill sizes="120px" />
              </button>
            );
          })}
        </div>
      )}

      {list.length > 1 && (
        <div className="news-gallery-count">
          <Images size={12} /> {list.length} {labels.count}
        </div>
      )}

      <style jsx>{`
        .news-gallery { display: flex; flex-direction: column; gap: 10px; margin: 24px 0; }
        .news-gallery-main { position: relative; overflow: hidden; border: 1px solid var(--border); border-radius: 16px; background: var(--bg-soft); aspect-ratio: 16 / 10; max-height: 560px; }
        .news-gallery-main img { display: block; width: 100%; height: 100%; object-fit: contain; }
        .news-gallery-tools { position: absolute; inset-inline: 10px; bottom: 10px; display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .news-gallery-tools button, .news-gallery-tools a { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9px; background: rgba(15, 17, 20, 0.78); color: #FFFFFF; cursor: pointer; text-decoration: none; transition: background 0.15s; }
        .news-gallery-tools button:hover, .news-gallery-tools a:hover { background: rgba(201, 149, 13, 0.92); }
        .news-gallery-tools span { padding: 5px 8px; border-radius: 7px; background: rgba(15, 17, 20, 0.78); color: #FFFFFF; font-family: monospace; font-size: 10.5px; font-weight: 800; }
        .news-gallery-thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 6px; }
        .news-gallery-thumbs button { position: relative; padding: 0; overflow: hidden; aspect-ratio: 4 / 3; border: 2px solid transparent; border-radius: 9px; background: var(--bg-soft); cursor: pointer; opacity: 0.75; transition: all 0.15s; }
        .news-gallery-thumbs button:hover { opacity: 1; }
        .news-gallery-thumbs .news-gallery-thumb-active { border-color: var(--gold); opacity: 1; }
        .news-gallery-thumbs img { width: 100%; height: 100%; object-fit: cover; }
        .news-gallery-count { display: inline-flex; align-items: center; gap: 4px; align-self: flex-end; color: var(--text-muted); font-size: 10.5px; font-weight: 700; }
      `}</style>
    </div>
  );
}
