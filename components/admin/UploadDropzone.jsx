"use client";
import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle, Info, FileVideo } from "lucide-react";
import { GUIDELINES } from "@/lib/upload-guidelines";

export default function UploadDropzone({
  type = "images",
  guidelineKey = "productImage",
  value = "",
  onChange,
  label,
  accept = "image/*",
  hint = "",
  showHelp: showHelpDefault = false
}) {
  const guide = GUIDELINES[guidelineKey] || GUIDELINES.galleryImage;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(showHelpDefault);
  const inputRef = useRef(null);

  const upload = useCallback(
    async (file) => {
      if (!file || uploading) return;
      setError("");
      setUploading(true);
      setProgress(10);

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);

        setProgress(40);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "خطای آپلود");
        setProgress(100);
        onChange(data.url);
        setTimeout(() => setProgress(0), 500);
      } catch (e) {
        setError(e.message || "خطا");
      }
      setUploading(false);
    },
    [type, onChange, uploading]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) upload(f);
    },
    [upload]
  );

  const clear = () => {
    onChange("");
    setError("");
  };
  const isPdf = typeof value === "string" && value.toLowerCase().endsWith(".pdf");
  const isVideo = type === "videos" || (typeof value === "string" && /\.(mp4|webm|mov)(\?|$)/i.test(value));
  const isFile = isPdf || isVideo;
  const changeLabel = isFile ? "تغییر فایل" : "تغییر تصویر";
  const fileName = typeof value === "string" ? value.split("/").pop()?.split("?")[0] : "";

  return (
    <div className="upload-field">
      <div className="upload-field-head">
        {label ? <span className="upload-field-label">{label}</span> : <span />}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          aria-expanded={showHelp}
          className="upload-help-toggle"
        >
          <Info size={12} /> {showHelp ? "بستن راهنما" : "مشخصات فایل"}
        </button>
      </div>

      {showHelp && (
        <div className="upload-help">
          <div className="upload-help-title">{guide.label}</div>
          <div className="upload-help-grid">
            <div><strong>ابعاد:</strong> {guide.dimensions}</div>
            <div><strong>حجم:</strong> {guide.maxSize}</div>
            <div><strong>فرمت:</strong> {guide.formats}</div>
            <div><strong>نسبت:</strong> {guide.ratio}</div>
          </div>
          <div className="upload-help-tip">{guide.tip}</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="upload-input-hidden"
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {value ? (
        <div className="upload-preview">
          {isFile ? (
            <div className="upload-preview-file">
              <div>
                <div className="upload-file-icon">
                  {isVideo ? <FileVideo size={30} /> : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <div className="upload-preview-file-title">{isVideo ? "فایل ویدئو" : "فایل PDF"}</div>
                <div className="upload-preview-file-name" dir="ltr" title={value}>{fileName}</div>
              </div>
            </div>
          ) : (
            <img src={value} alt="" className="upload-preview-media" />
          )}

          <div className="upload-preview-actions">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="upload-preview-btn"
            >
              {uploading ? <Loader2 size={14} className="upload-spin" /> : <UploadCloud size={14} />}
              {uploading ? "در حال بارگذاری..." : changeLabel}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={uploading}
              className="upload-preview-btn upload-preview-btn-danger"
              aria-label={isFile ? "حذف فایل" : "حذف تصویر"}
              title={isFile ? "حذف فایل" : "حذف تصویر"}
            >
              <X size={14} />
            </button>
          </div>

          <div className="upload-preview-badge">
            <CheckCircle2 size={12} style={{ color: "#34D399" }} />
            {isFile ? "فایل بارگذاری شده" : "تصویر بارگذاری شده"}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => { if (!uploading) inputRef.current?.click(); }}
          className={"upload-dropzone" + (dragging ? " upload-dropzone-drag" : "")}
        >
          {uploading ? (
            <div className="upload-progress-wrap">
              <Loader2 size={26} className="upload-spin upload-dropzone-icon" style={{ margin: "0 auto 8px" }} />
              <div className="upload-dropzone-title">در حال آپلود...</div>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: progress + "%" }} />
              </div>
            </div>
          ) : (
            <div>
              <UploadCloud size={26} className="upload-dropzone-icon" />
              <div className="upload-dropzone-title">فایل را رها کنید یا برای انتخاب کلیک کنید</div>
              <div className="upload-dropzone-hint">
                {hint || (guide.formats + " · حداکثر " + guide.maxSize)}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="upload-error">
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}
