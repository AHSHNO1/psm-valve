"use client";
import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { GUIDELINES } from "@/lib/upload-guidelines";

export default function UploadDropzone({
  type = "images",
  guidelineKey = "productImage",
  value = "",
  onChange,
  label,
  accept = "image/*"
}) {
  const guide = GUIDELINES[guidelineKey] || GUIDELINES.galleryImage;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(true);
  const inputRef = useRef(null);

  const upload = useCallback(
    async (file) => {
      if (!file) return;
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

        if (!data.ok) throw new Error(data.error || "خطای آپلود");
        setProgress(100);
        onChange(data.url);
        setTimeout(() => setProgress(0), 500);
      } catch (e) {
        setError(e.message || "خطا");
      }
      setUploading(false);
    },
    [type, onChange]
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

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: "#1A1D21" }}>{label}</span>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: "#B8860B" }}
          >
            <Info size={12} /> راهنما
          </button>
        </div>
      )}

      {showHelp && (
        <div
          className="rounded-xl p-3 mb-3 text-xs space-y-1"
          style={{ background: "#FEF9E7", border: "1px solid #F5C518" }}
        >
          <div className="font-bold" style={{ color: "#B8860B" }}>
            {guide.label}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: "#5C6370" }}>
            <div>📐 <strong>ابعاد:</strong> {guide.dimensions}</div>
            <div>📦 <strong>حجم:</strong> {guide.maxSize}</div>
            <div>🎨 <strong>فرمت:</strong> {guide.formats}</div>
            <div>📊 <strong>نسبت:</strong> {guide.ratio}</div>
          </div>
          <div className="text-[11px] pt-1" style={{ color: "#5C6370" }}>
            💡 {guide.tip}
          </div>
        </div>
      )}

      {value ? (
        <div
          className="relative rounded-xl overflow-hidden group"
          style={{ border: "1px solid rgba(26, 29, 33, 0.15)", background: "#F1F3F5" }}
        >
          {type === "catalogs" || value.endsWith(".pdf") ? (
            <div className="aspect-video grid place-items-center">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-xl mx-auto grid place-items-center mb-2"
                  style={{ background: "rgba(184, 134, 11, 0.15)", color: "#B8860B" }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="text-sm font-bold">فایل PDF</div>
                <div className="text-[10px] font-mono mt-1" style={{ color: "#5C6370" }} dir="ltr">{value}</div>
              </div>
            </div>
          ) : (
            <img src={value} alt="" className="w-full max-h-56 object-contain" />
          )}

          <button
            type="button"
            onClick={clear}
            className="absolute top-2 left-2 w-8 h-8 rounded-lg grid place-items-center opacity-0 group-hover:opacity-100 transition"
            style={{ background: "rgba(220, 38, 38, 0.9)", color: "white" }}
            aria-label="حذف"
          >
            <X size={14} />
          </button>

          <div
            className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur text-white text-[10px] px-3 py-1.5 flex items-center gap-1.5"
          >
            <CheckCircle2 size={12} style={{ color: "#10B981" }} />
            آپلود شد
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl p-6 text-center cursor-pointer transition"
          style={{
            background: dragging ? "#FEF9E7" : "#F8F9FA",
            border: dragging ? "2px dashed #C9950D" : "2px dashed rgba(26, 29, 33, 0.2)",
            minHeight: "140px"
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />

          {uploading ? (
            <div>
              <Loader2 size={32} className="mx-auto mb-2 animate-spin" style={{ color: "#C9950D" }} />
              <div className="text-sm font-bold">در حال آپلود...</div>
              <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div
                  className="h-full transition-all"
                  style={{ width: progress + "%", background: "linear-gradient(90deg, #C9950D, #F5C518)" }}
                />
              </div>
            </div>
          ) : (
            <div>
              <UploadCloud size={32} className="mx-auto mb-2" style={{ color: "#B8860B" }} />
              <div className="text-sm font-bold mb-1" style={{ color: "#1A1D21" }}>
                فایل را اینجا رها کنید یا کلیک کنید
              </div>
              <div className="text-xs" style={{ color: "#5C6370" }}>
                {guide.formats} · حداکثر {guide.maxSize}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="mt-2 flex items-center gap-2 text-xs p-2 rounded-lg"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}
