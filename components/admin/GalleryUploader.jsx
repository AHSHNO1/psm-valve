"use client";

import { useRef, useState } from "react";
import {
  UploadCloud, Loader2, Image as ImageIcon, Star, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info, Images
} from "lucide-react";
import { GUIDELINES } from "@/lib/upload-guidelines";

export default function GalleryUploader({
  images = [],
  onChange,
  cover = "",
  onCoverChange,
  label = "گالری تصاویر خبر",
  max = 24,
  guidelineKey = "galleryImage"
}) {
  const guide = GUIDELINES[guidelineKey] || GUIDELINES.galleryImage;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef(null);

  const list = Array.isArray(images) ? images : [];
  const remaining = Math.max(0, max - list.length);

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      setError("فقط فایل تصویری مجاز است.");
      return;
    }
    if (remaining === 0) {
      setError(`حداکثر ${max} تصویر برای هر خبر مجاز است.`);
      return;
    }
    const batch = files.slice(0, remaining);
    setError("");
    setUploading(true);
    setProgress({ done: 0, total: batch.length });
    const uploaded = [];
    const failed = [];

    for (const file of batch) {
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("type", "images");
        const response = await fetch("/api/upload", { method: "POST", body });
        const data = await response.json().catch(function() { return {}; });
        if (!response.ok || !data.ok || !data.url) {
          throw new Error(data.error || "خطای آپلود");
        }
        uploaded.push(data.url);
      } catch (uploadError) {
        failed.push(file.name);
      }
      setProgress(function(current) { return { ...current, done: current.done + 1 }; });
    }

    if (uploaded.length > 0) {
      const next = list.concat(uploaded);
      onChange(next);
      if (!cover && onCoverChange && uploaded[0]) onCoverChange(uploaded[0]);
    }
    if (failed.length > 0) {
      setError("آپلود این فایل‌ها ناموفق بود: " + failed.join("، "));
    }
    if (files.length > remaining) {
      setError(function() {
        return `فقط ${remaining} تصویر دیگر قابل افزودن بود؛ مابقی نادیده گرفته شد.`;
      });
    }
    setUploading(false);
    setProgress({ done: 0, total: 0 });
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (!uploading) uploadFiles(event.dataTransfer.files);
  }

  function removeAt(index) {
    const next = list.filter(function(_, itemIndex) { return itemIndex !== index; });
    onChange(next);
    if (onCoverChange && list[index] === cover) {
      onCoverChange(next[0] || "");
    }
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = list.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="gallery-uploader">
      <div className="gallery-head">
        <div className="gallery-title">
          <span className="gallery-title-icon"><Images size={16} /></span>
          <div>
            <strong>{label}</strong>
            <small>{list.length} تصویر ثبت شده · حداکثر {max} تصویر</small>
          </div>
        </div>
        <button type="button" className="gallery-help-btn" onClick={function() { setShowHelp(!showHelp); }}>
          <Info size={12} /> راهنما
        </button>
      </div>

      {showHelp && (
        <div className="gallery-help">
          <span><strong>ابعاد:</strong> {guide.dimensions}</span>
          <span><strong>حجم:</strong> {guide.maxSize}</span>
          <span><strong>فرمت:</strong> {guide.formats}</span>
          <span><strong>نسبت:</strong> {guide.ratio}</span>
          <p>{guide.tip}</p>
        </div>
      )}

      {list.length > 0 && (
        <div className="gallery-grid">
          {list.map(function(url, index) {
            const isCover = Boolean(cover && url === cover);
            return (
              <div key={url + "-" + index} className={"gallery-item" + (isCover ? " gallery-item-cover" : "")}>
                <img src={url} alt={`تصویر ${index + 1}`} />
                {isCover && <span className="gallery-cover-badge"><Star size={10} /> کاور</span>}
                <div className="gallery-item-actions">
                  <button type="button" onClick={function() { onCoverChange && onCoverChange(url); }}
                    disabled={isCover} title="تعیین به‌عنوان تصویر کاور" aria-label="تعیین به‌عنوان تصویر کاور">
                    <Star size={13} />
                  </button>
                  <button type="button" onClick={function() { move(index, -1); }} disabled={index === 0}
                    title="جابه‌جایی به قبل" aria-label="جابه‌جایی به قبل">
                    <ChevronRight size={14} />
                  </button>
                  <button type="button" onClick={function() { move(index, 1); }} disabled={index === list.length - 1}
                    title="جابه‌جایی به بعد" aria-label="جابه‌جایی به بعد">
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" className="gallery-remove" onClick={function() { removeAt(index); }}
                    title="حذف تصویر" aria-label="حذف تصویر">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length < 3 && (
        <div className="gallery-min-note">
          <AlertCircle size={13} />
          برای یک خبر کامل، دست‌کم ۳ تصویر پیشنهاد می‌شود؛ می‌توانید همین حالا چند فایل را هم‌زمان انتخاب کنید.
        </div>
      )}

      {uploading ? (
        <div className="gallery-progress">
          <Loader2 size={18} className="gallery-spin" />
          <span>در حال آپلود {progress.done} از {progress.total} تصویر...</span>
          <div className="gallery-progress-bar">
            <span style={{ width: (progress.total ? (progress.done / progress.total) * 100 : 0) + "%" }} />
          </div>
        </div>
      ) : (
        <div
          className={"gallery-drop" + (dragging ? " gallery-drop-active" : "")}
          onDragOver={function(event) { event.preventDefault(); setDragging(true); }}
          onDragLeave={function() { setDragging(false); }}
          onDrop={onDrop}
          onClick={function() { inputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          onKeyDown={function(event) { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        >
          <UploadCloud size={22} />
          <strong>افزودن تصویر به گالری</strong>
          <small>چند فایل را هم‌زمان انتخاب یا اینجا رها کنید</small>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="gallery-input"
        onChange={function(event) {
          uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {error && (
        <div className="gallery-error" role="alert">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {list.length >= 3 && (
        <div className="gallery-ok" role="status">
          <CheckCircle2 size={13} /> گالری این خبر آماده است. با ستاره، تصویر کاور را انتخاب کنید.
        </div>
      )}

      <style jsx>{`
        .gallery-uploader { display: flex; flex-direction: column; gap: 10px; }
        .gallery-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .gallery-title { display: flex; align-items: center; gap: 8px; }
        .gallery-title-icon { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: #FFF7E0; color: #A87B0A; }
        .gallery-title strong { display: block; color: #1A1D21; font-size: 12px; font-weight: 900; }
        .gallery-title small { display: block; margin-top: 1px; color: #8B93A1; font-size: 9.5px; font-weight: 700; }
        .gallery-help-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 0; border-radius: 6px; background: transparent; color: #A87B0A; font-family: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
        .gallery-help-btn:hover { background: #FFF7E0; }
        .gallery-help { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid #F5D98B; border-radius: 10px; background: #FEF9E7; color: #6B5A2A; font-size: 10px; font-weight: 600; }
        .gallery-help p { margin: 4px 0 0; }

        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
        .gallery-item { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border: 1px solid #E1E5EA; border-radius: 10px; background: #F4F5F7; }
        .gallery-item-cover { border-color: #C9950D; box-shadow: 0 0 0 2px rgba(201, 149, 13, 0.16); }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-cover-badge { position: absolute; top: 6px; inset-inline-start: 6px; display: inline-flex; align-items: center; gap: 3px; padding: 3px 6px; border-radius: 5px; background: rgba(201, 149, 13, 0.94); color: #FFFFFF; font-size: 8.5px; font-weight: 900; }
        .gallery-item-actions { position: absolute; inset-inline: 0; bottom: 0; display: flex; justify-content: center; gap: 2px; padding: 5px; background: linear-gradient(to top, rgba(10, 12, 14, 0.78), transparent); opacity: 0; transition: opacity 0.16s; }
        .gallery-item:hover .gallery-item-actions, .gallery-item:focus-within .gallery-item-actions { opacity: 1; }
        .gallery-item-actions button { display: grid; width: 25px; height: 25px; place-items: center; border: 0; border-radius: 6px; background: rgba(255, 255, 255, 0.92); color: #3C434E; cursor: pointer; transition: background 0.14s, color 0.14s; }
        .gallery-item-actions button:hover:not(:disabled) { background: #FFFFFF; color: #A87B0A; }
        .gallery-item-actions button:disabled { opacity: 0.4; cursor: default; }
        .gallery-item-actions .gallery-remove:hover { background: #FEE2E2; color: #C81E2E; }

        .gallery-min-note, .gallery-error, .gallery-ok { display: flex; align-items: flex-start; gap: 6px; padding: 7px 9px; border-radius: 8px; font-size: 9.5px; font-weight: 700; line-height: 1.7; }
        .gallery-min-note { border: 1px solid #F3DCA6; background: #FFFBF0; color: #8A6508; }
        .gallery-error { border: 1px solid #FECACA; background: #FEF2F2; color: #991B1B; }
        .gallery-ok { border: 1px solid #A7F3D0; background: #ECFDF5; color: #065F46; }

        .gallery-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 18px 12px; border: 1.5px dashed #C9D0D8; border-radius: 10px; background: #F8F9FA; color: #8B93A1; cursor: pointer; transition: all 0.15s; text-align: center; }
        .gallery-drop:hover, .gallery-drop-active { border-color: #C9950D; background: #FEF9E7; color: #A87B0A; }
        .gallery-drop strong { color: #4B5160; font-size: 10.5px; font-weight: 850; }
        .gallery-drop small { font-size: 9.5px; font-weight: 600; }
        .gallery-input { display: none; }

        .gallery-progress { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px; border: 1px solid #E1E5EA; border-radius: 10px; background: #FAFBFC; color: #5C6472; font-size: 10px; font-weight: 800; }
        .gallery-progress-bar { flex: 1; height: 4px; overflow: hidden; border-radius: 999px; background: #E5E7EB; }
        .gallery-progress-bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #C9950D, #F5C518); transition: width 0.2s; }
        .gallery-spin { animation: gallerySpin 0.9s linear infinite; color: #C9950D; }
        @keyframes gallerySpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
