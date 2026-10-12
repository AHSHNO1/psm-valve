"use client";
import { useState } from "react";
import {
  Film, Library, Camera, Trash2, Plus, X, Loader2,
  Link as LinkIcon, FileText, AlertTriangle, CheckCircle2, ExternalLink, Play
} from "lucide-react";
import UploadDropzone from "./UploadDropzone";

export default function MediaManager({ initial }) {
  const [media, setMedia] = useState(initial);
  const [tab, setTab] = useState("gallery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/media");
    const data = await res.json();
    if (data.ok) setMedia(data.media);
  };

  const notify = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const submitVideo = async (form) => {
    if (!form.url && !form.videoUrl) {
      notify("لینک ویدئو یا فایل لازم است", true);
      return;
    }
    if (!form.title.trim()) {
      notify("عنوان ویدئو الزامی است", true);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "videos",
          item: {
            url: form.videoUrl || form.url,
            poster: form.poster || "",
            title: { fa: form.title, en: form.title, ar: form.title, ru: form.title },
            description: { fa: form.description, en: form.description, ar: form.description, ru: form.description }
          }
        })
      });
      notify("✓ ویدئو اضافه شد");
      setShowForm(false);
      refresh();
    } catch (e) {
      notify(e.message, true);
    }
    setBusy(false);
  };

  const submitCatalog = async (form) => {
    if (!form.url) {
      notify("فایل PDF را آپلود کنید", true);
      return;
    }
    if (!form.title.trim()) {
      notify("عنوان کاتالوگ الزامی است", true);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "catalogs",
          item: { url: form.url, title: form.title, description: form.description }
        })
      });
      notify("✓ کاتالوگ اضافه شد");
      setShowForm(false);
      refresh();
    } catch (e) {
      notify(e.message, true);
    }
    setBusy(false);
  };

  const submitGallery = async (form) => {
    if (!form.url) {
      notify("عکس را آپلود کنید", true);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gallery",
          item: { url: form.url, title: form.title }
        })
      });
      notify("✓ تصویر اضافه شد");
      setShowForm(false);
      refresh();
    } catch (e) {
      notify(e.message, true);
    }
    setBusy(false);
  };

  const removeItem = async (id, type) => {
    if (!confirm("این آیتم حذف شود؟")) return;
    await fetch(`/api/media?id=${id}&type=${type}`, { method: "DELETE" });
    refresh();
  };

  const saveIntroVideo = async (url) => {
    await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ introVideoUrl: url })
    });
    notify("✓ ویدئو معرفی ذخیره شد");
    refresh();
  };

  const tabs = [
    { id: "gallery", label: "تصاویر", icon: Camera, count: (media.gallery || []).length },
    { id: "videos", label: "ویدئوها", icon: Film, count: (media.videos || []).length },
    { id: "catalogs", label: "کاتالوگ‌ها", icon: Library, count: (media.catalogs || []).length }
  ];

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-xl mb-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-xl mb-4" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Intro video */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.12)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Play size={16} style={{ color: "#B8860B" }} />
          <h3 className="font-black text-sm">ویدئو معرفی شرکت (صفحه اصلی)</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: "#5C6370" }}>
          لینک یوتیوب، ویمئو یا فایل MP4 خود را وارد کنید. این ویدئو در صفحه اصلی نمایش داده می‌شود.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            defaultValue={media.introVideoUrl || ""}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 rounded-xl text-sm font-mono"
            style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
            onBlur={(e) => {
              if (e.target.value !== (media.introVideoUrl || "")) saveIntroVideo(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Tabs + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.12)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setShowForm(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition"
              style={{
                background: tab === t.id ? "linear-gradient(135deg, #C9950D, #F5C518)" : "transparent",
                color: tab === t.id ? "#1A1D21" : "#5C6370"
              }}
            >
              <t.icon size={15} /> {t.label}
              <span className="text-[10px] px-1.5 rounded-full"
                style={{ background: tab === t.id ? "rgba(0,0,0,0.15)" : "#F1F3F5" }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition"
          style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "بستن" : `افزودن ${tabs.find((x) => x.id === tab)?.label}`}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: "#FFFFFF", border: "2px solid #C9950D" }}>
          {tab === "gallery" && <GalleryForm onSubmit={submitGallery} busy={busy} onCancel={() => setShowForm(false)} />}
          {tab === "videos" && <VideoForm onSubmit={submitVideo} busy={busy} onCancel={() => setShowForm(false)} />}
          {tab === "catalogs" && <CatalogForm onSubmit={submitCatalog} busy={busy} onCancel={() => setShowForm(false)} />}
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(media[tab] || []).map((item) => (
          <div key={item.id} className="rounded-2xl overflow-hidden group"
            style={{ background: "#FFFFFF", border: "1px solid rgba(26, 29, 33, 0.12)" }}>
            <div className="relative">
              {tab === "gallery" && <img src={item.url} alt="" className="w-full aspect-square object-cover" />}
              {tab === "videos" && (
                <div className="aspect-video bg-black grid place-items-center relative">
                  {item.poster ? (
                    <img src={item.poster} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <Film size={40} className="text-gray-500" />
                  )}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="w-14 h-14 rounded-full grid place-items-center" style={{ background: "rgba(255,255,255,0.9)" }}>
                      <Play size={22} style={{ color: "#1A1D21" }} fill="#1A1D21" />
                    </div>
                  </div>
                </div>
              )}
              {tab === "catalogs" && (
                <div className="aspect-video grid place-items-center" style={{ background: "#F1F3F5" }}>
                  <FileText size={48} style={{ color: "#B8860B" }} />
                </div>
              )}

              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => removeItem(item.id, tab)}
                  className="w-8 h-8 rounded-lg grid place-items-center"
                  style={{ background: "rgba(220, 38, 38, 0.9)", color: "white" }}
                >
                  <Trash2 size={14} />
                </button>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg grid place-items-center"
                  style={{ background: "rgba(0, 0, 0, 0.7)", color: "white" }}>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div className="p-3">
              <div className="font-bold text-sm truncate mb-1" style={{ color: "#1A1D21" }}>
                {typeof item.title === "string" ? item.title : item.title?.fa || item.title?.en || "بدون عنوان"}
              </div>
              {item.description && (
                <div className="text-xs line-clamp-2 mb-1" style={{ color: "#5C6370" }}>
                  {typeof item.description === "string" ? item.description : item.description?.fa}
                </div>
              )}
            </div>
          </div>
        ))}

        {(media[tab] || []).length === 0 && (
          <div className="col-span-full rounded-2xl p-16 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed rgba(26, 29, 33, 0.2)" }}>
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 grid place-items-center"
              style={{ background: "rgba(184, 134, 11, 0.1)" }}>
              {tab === "gallery" && <Camera size={32} style={{ color: "#B8860B" }} />}
              {tab === "videos" && <Film size={32} style={{ color: "#B8860B" }} />}
              {tab === "catalogs" && <Library size={32} style={{ color: "#B8860B" }} />}
            </div>
            <div className="font-bold mb-1" style={{ color: "#1A1D21" }}>
              هنوز {tabs.find((x) => x.id === tab)?.label} اضافه نشده
            </div>
            <p className="text-xs mb-4" style={{ color: "#5C6370" }}>
              روی دکمه بالا کلیک کنید یا فایل را داخل کادر رها کنید
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
            >
              <Plus size={16} /> افزودن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- forms ----------
function Input({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-bold mb-1.5 block" style={{ color: "#3D4451" }}>{label}</span>
      {hint && <div className="text-[11px] mb-1" style={{ color: "#9CA3AF" }}>{hint}</div>}
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
        style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
      />
    </label>
  );
}

function GalleryForm({ onSubmit, busy, onCancel }) {
  const [form, setForm] = useState({ title: "", url: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <UploadDropzone
        type="images"
        guidelineKey="galleryImage"
        value={form.url}
        onChange={(url) => setForm({ ...form, url })}
        label="فایل تصویر"
        accept="image/*"
      />
      <Input
        label="عنوان (اختیاری)"
        hint="توضیح کوتاه برای تصویر"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <FormButtons busy={busy} onCancel={onCancel} />
    </form>
  );
}

function VideoForm({ onSubmit, busy, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", url: "", videoUrl: "", poster: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input
        label="عنوان ویدئو *"
        hint="نام ویدئو برای نمایش در صفحه"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Input
        label="لینک یوتیوب / ویمئو"
        hint="اگر فایل MP4 دارید این فیلد را خالی بگذارید و فایل زیر را آپلود کنید"
        placeholder="https://youtube.com/watch?v=..."
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
      />
      <div className="text-xs text-center font-bold py-1" style={{ color: "#9CA3AF" }}>— یا —</div>
      <UploadDropzone
        type="videos"
        guidelineKey="video"
        value={form.videoUrl}
        onChange={(url) => setForm({ ...form, videoUrl: url })}
        label="فایل MP4 (اختیاری)"
        accept="video/*"
      />
      <UploadDropzone
        type="posters"
        guidelineKey="videoPoster"
        value={form.poster}
        onChange={(url) => setForm({ ...form, poster: url })}
        label="پوستر ویدئو (اختیاری)"
        accept="image/*"
      />
      <label className="block">
        <span className="text-xs font-bold mb-1.5 block" style={{ color: "#3D4451" }}>توضیحات (اختیاری)</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
          style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
        />
      </label>
      <FormButtons busy={busy} onCancel={onCancel} />
    </form>
  );
}

function CatalogForm({ onSubmit, busy, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", url: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <UploadDropzone
        type="catalogs"
        guidelineKey="catalog"
        value={form.url}
        onChange={(url) => setForm({ ...form, url })}
        label="فایل PDF *"
        accept="application/pdf"
      />
      <Input
        label="عنوان کاتالوگ *"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Input
        label="توضیحات"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <FormButtons busy={busy} onCancel={onCancel} />
    </form>
  );
}

function FormButtons({ busy, onCancel }) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="submit"
        disabled={busy}
        className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
        style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        ذخیره
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-3 rounded-xl font-bold text-sm"
        style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
      >
        انصراف
      </button>
    </div>
  );
}
