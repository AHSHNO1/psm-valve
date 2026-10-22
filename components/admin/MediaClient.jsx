"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { DeleteBtn, EditBtn, SaveBtn, CancelBtn, ToggleBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";
import { useToast, Toast } from "./useToast";

const TABS = [
  { id: "gallery", label: "تصاویر", icon: "image" },
  { id: "videos", label: "ویدئوها", icon: "package" },
  { id: "catalogs", label: "کاتالوگ‌ها", icon: "file" }
];

export default function MediaClient({ initial }) {
  const [media, setMedia] = useState(initial || { videos: [], catalogs: [], gallery: [], introVideoUrl: "" });
  const [tab, setTab] = useState("gallery");
  const [editing, setEditing] = useState(null);
  const [introUrl, setIntroUrl] = useState(media.introVideoUrl || "");
  const { notify, toast } = useToast();

  async function refresh() {
    const res = await fetch("/api/media");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "بارگذاری اطلاعات مدیا ناموفق بود");
    setMedia(data.media);
  }

  async function saveIntro() {
    const res = await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ introVideoUrl: introUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      notify(data.error || "ذخیره ویدئو ناموفق بود", true);
      return;
    }
    notify("ویدئو معرفی ذخیره شد");
    refresh().catch((error) => notify(error.message, true));
  }

  async function removeItem(id, type, force) {
    if (!force && !confirm("این آیتم حذف شود؟")) return;
    try {
      let url = "/api/media?id=" + encodeURIComponent(id) + "&type=" + encodeURIComponent(type);
      if (force) url += "&force=1";
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(function () { return {}; });

      // فایل در بخش‌های دیگر استفاده شده → 409؛ تأیید ارجاع و حذف اجباری.
      if (res.status === 409) {
        const refs = Array.isArray(data.references) ? data.references : [];
        const warning = "این فایل در بخش‌های دیگری از سایت استفاده شده است" +
          (refs.length ? " (" + refs.join("، ") + ")" : "") +
          ".\n\nحذف اجباری ممکن است آن بخش‌ها را خراب کند. با این حال حذف شود؟";
        if (confirm(warning)) {
          await removeItem(id, type, true);
          return;
        }
        notify("حذف انجام نشد", true);
        return;
      }

      if (!res.ok || !data.ok) throw new Error(data.error || "حذف ناموفق بود");
      await refresh();
      notify(data.fileDeleted ? "فایل و رکورد حذف شد" : "رکورد حذف شد");
    } catch (error) {
      notify(error.message || "حذف ناموفق بود", true);
    }
  }

  async function toggleItem(item, type) {
    const title = typeof item.title === "string"
      ? item.title
      : (item.title && (item.title.fa || item.title.en)) || "ویدئو";
    const updated = { ...item, title, active: item.active === false };
    try {
      const res = await fetch("/api/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: item.id, item: updated })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "تغییر وضعیت ناموفق بود");
      await refresh();
      notify(updated.active ? "آیتم در سایت نمایش داده می‌شود" : "آیتم از سایت پنهان شد");
    } catch (error) {
      notify(error.message || "تغییر وضعیت ناموفق بود", true);
    }
  }

  const activeList = media[tab] || [];

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #107C10, #0A5F0A)" }}>
            <Icon name="image" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">گالری و مدیا</div>
            <div className="page-header-sub">مدیریت تصاویر، ویدئوها و کاتالوگ‌ها</div>
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      {/* Intro video tile */}
      <div className="anim-in" style={{
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16
      }}>
        <label className="form-label">
          <Icon name="package" size={14} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
          ویدئو معرفی شرکت (صفحه اصلی)
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" dir="ltr" value={introUrl} onChange={function(e) { setIntroUrl(e.target.value); }}
            placeholder="https://youtube.com/watch?v=..." className="form-input" style={{ flex: 1 }} />
          <SaveBtn onClick={saveIntro} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs anim-in">
        {TABS.map(function(t) {
          const count = (media[t.id] || []).length;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); setEditing(null); }}
              className={"tab" + (tab === t.id ? " tab-active" : "")}>
              <Icon name={t.icon} size={13} />
              {t.label}
              <span className="tab-badge">{count}</span>
            </button>
          );
        })}
        <button onClick={function() { setEditing("new"); }}
          className="btn-add" style={{ marginInlineStart: "auto", fontSize: 12, padding: "7px 14px" }}>
          <Icon name="plus" size={14} /> افزودن
        </button>
      </div>

      {/* New item form */}
      {editing === "new" && (
        <div className="anim-in" style={{
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16
        }}>
          <MediaForm type={tab}
            onSave={async function() {
              try {
                await refresh();
                setEditing(null);
                notify("ذخیره شد");
              } catch (error) {
                notify(error.message, true);
              }
            }}
            onCancel={function() { setEditing(null); }} />
        </div>
      )}

      {editing && editing !== "new" && activeList.some((item) => item.id === editing) && (
        <div className="anim-in" style={{
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16
        }}>
          <MediaForm
            key={editing}
            type={tab}
            initialItem={activeList.find((item) => item.id === editing)}
            onSave={async function() {
              try {
                await refresh();
                setEditing(null);
                notify("تغییرات ذخیره شد");
              } catch (error) {
                notify(error.message, true);
              }
            }}
            onCancel={function() { setEditing(null); }}
          />
        </div>
      )}

      {/* List */}
      {activeList.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="image" size={30} /></div>
          <div className="empty-title">هنوز آیتمی اضافه نشده</div>
          <div className="empty-desc">از دکمه افزودن بالا استفاده کنید</div>
        </div>
      ) : (
        <div className="card-grid">
          {activeList.map(function(item, i) {
            return (
              <div key={item.id} className="card-item anim-in" style={{ animationDelay: (i * 25) + "ms" }}>
                <div style={{
                  aspectRatio: tab === "gallery" ? "1" : "16/9",
                  borderRadius: 10,
                  background: "#F4F5F7",
                  border: "1px solid #D1D5DB",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center"
                }}>
                  {tab === "gallery" && item.url && (
                    <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {tab === "videos" && (
                    item.poster ? (
                      <img src={item.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="package" size={26} />
                    )
                  )}
                  {tab === "catalogs" && (
                    <img
                      src={item.cover || "/images/media/catalog-cover.svg"}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

                <div className="card-item-title" style={{
                  fontSize: 12, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {(typeof item.title === "string" ? item.title : (item.title && item.title.fa)) || "بدون عنوان"}
                </div>
                {item.source === "aparat" && (
                  <div style={{ fontSize: 10, color: "#7A8290", marginTop: 4 }}>
                    همگام‌شده از کانال آپارات
                  </div>
                )}
                {item.active === false && (
                  <div style={{ fontSize: 10, color: "#B42318", marginTop: 4 }}>در سایت پنهان است</div>
                )}

                <div className="card-item-foot">
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="act-btn act-btn-view" title="باز کردن">
                    <Icon name="external" />
                  </a>
                  <EditBtn onClick={function() { setEditing(item.id); }} title="ویرایش" />
                  <ToggleBtn active={item.active !== false}
                    onClick={function() { toggleItem(item, tab); }}
                    title={item.active === false ? "نمایش در سایت" : "پنهان کردن از سایت"} />
                  {item.source !== "aparat" && (
                    <DeleteBtn onClick={function() { removeItem(item.id, tab); }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MediaForm({ type, initialItem, onSave, onCancel }) {
  const initialTitle = initialItem && typeof initialItem.title === "object"
    ? initialItem.title.fa || initialItem.title.en || ""
    : (initialItem && initialItem.title) || "";
  const [url, setUrl] = useState((initialItem && initialItem.url) || "");
  const [poster, setPoster] = useState((initialItem && initialItem.poster) || "");
  const [cover, setCover] = useState((initialItem && initialItem.cover) || "");
  const [title, setTitle] = useState(initialTitle);
  const initialDescription = initialItem && initialItem.description;
  const [description, setDescription] = useState(
    typeof initialDescription === "string"
      ? initialDescription
      : initialDescription?.fa || initialDescription?.en || ""
  );
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const posterInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const labels = {
    gallery: { title: "تصویر", accept: "image/*", uploadType: "images" },
    videos: { title: "ویدئو", accept: "video/*", uploadType: "videos" },
    catalogs: { title: "کاتالوگ PDF", accept: "application/pdf", uploadType: "catalogs" }
  };
  const label = labels[type];
  const isEditing = Boolean(initialItem);

  async function upload(file, target) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", target === "poster" ? "posters" : target === "cover" ? "images" : label.uploadType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "آپلود فایل انجام نشد");
      }
      if (target === "poster") setPoster(data.url);
      else if (target === "cover") setCover(data.url);
      else setUrl(data.url);
    } catch (uploadError) {
      setError(uploadError.message || "آپلود فایل انجام نشد");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) {
      setError("لطفاً عنوان را وارد کنید");
      return;
    }
    if (!url.trim()) {
      setError(type === "videos" ? "لطفاً لینک ویدئو یا فایل آن را انتخاب کنید" : "لطفاً فایل را انتخاب کنید");
      return;
    }
    if (type === "catalogs" && !description.trim()) {
      setError("لطفاً توضیحات کاتالوگ را وارد کنید");
      return;
    }
    if (type === "catalogs" && !cover.trim()) {
      setError("لطفاً تصویر روی جلد کاتالوگ را بارگذاری کنید");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const item = {
        url: url.trim(),
        title: title.trim(),
        description: description.trim(),
        ...(initialItem && initialItem.aparatId ? { aparatId: initialItem.aparatId, source: "aparat" } : {}),
        ...(initialItem && initialItem.active === false ? { active: false } : {})
      };
      if (type === "videos") item.poster = poster;
      if (type === "catalogs") item.cover = cover;
      const res = await fetch("/api/media", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, id: initialItem && initialItem.id, item: item })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ذخیره اطلاعات انجام نشد");
      await onSave();
    } catch (saveError) {
      setError(saveError.message || "ذخیره اطلاعات انجام نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="form-label">عنوان {label.title}</label>
      <input type="text" value={title} onChange={function(e) { setTitle(e.target.value); }}
        className="form-input" required />

      {type === "videos" && (
        <>
          <label className="form-label" style={{ marginTop: 10 }}>لینک ویدئو (آپارات، یوتیوب یا ویمئو)</label>
          <input type="url" dir="ltr" value={url.startsWith("/uploads/") ? "" : url}
            onChange={function(e) { setUrl(e.target.value); }}
            placeholder="https://www.aparat.com/v/..." className="form-input" />
          <div style={{ fontSize: 11, color: "#7A8290", marginTop: 6, textAlign: "center", fontWeight: 900 }}>— یا آپلود فایل ویدئو —</div>
        </>
      )}

      <label className="form-label" style={{ marginTop: 10 }}>
        {type === "videos" ? "فایل ویدئو" : type === "catalogs" ? "فایل PDF کاتالوگ" : "فایل تصویر"}
      </label>
      <div onClick={function() { inputRef.current && inputRef.current.click(); }}
        style={{
          border: "2px dashed #D1D5DB", background: "#F4F5F7", borderRadius: 10,
          padding: 18, textAlign: "center", cursor: "pointer"
        }}>
        <input ref={inputRef} type="file" accept={label.accept} style={{ display: "none" }}
          onChange={function(e) {
            upload(e.target.files[0]);
            e.target.value = "";
          }} />
        {uploading ? <Icon name="loader" size={20} /> : <Icon name="upload" size={22} />}
        {url && <div style={{ fontSize: 10, marginTop: 6, color: "#8A6508", fontWeight: 800 }}>فایل انتخاب شده است؛ برای جایگزینی انتخاب کنید</div>}
      </div>

      {type === "videos" && (
        <div style={{ marginTop: 10 }}>
          <label className="form-label">تصویر کاور ویدئو (اختیاری)</label>
          <button type="button" className="btn-cancel" onClick={function() { posterInputRef.current && posterInputRef.current.click(); }}>
            <Icon name="upload" size={14} /> انتخاب تصویر کاور
          </button>
          <input ref={posterInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
            onChange={function(e) {
              upload(e.target.files[0], "poster");
              e.target.value = "";
            }} />
          {poster && <div style={{ fontSize: 11, marginTop: 6, color: "#8A6508" }}>کاور انتخاب شده است</div>}
        </div>
      )}

      {type === "catalogs" && (
        <div style={{ marginTop: 10 }}>
          <label className="form-label">تصویر روی جلد کاتالوگ *</label>
          <button type="button" className="btn-cancel" onClick={function() { coverInputRef.current && coverInputRef.current.click(); }}>
            <Icon name="upload" size={14} /> انتخاب تصویر کاور
          </button>
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
            onChange={function(e) {
              upload(e.target.files[0], "cover");
              e.target.value = "";
            }} />
          {cover && <img src={cover} alt="پیش‌نمایش جلد کاتالوگ" style={{ width: "100%", maxWidth: 360, aspectRatio: "16/9", objectFit: "cover", borderRadius: 10, marginTop: 8 }} />}
        </div>
      )}

      <label className="form-label" style={{ marginTop: 10 }}>
        توضیحات {type === "catalogs" ? "*" : "(اختیاری)"}
      </label>
      <textarea rows={2} value={description} onChange={function(e) { setDescription(e.target.value); }}
        className="form-input" required={type === "catalogs"} />

      {error && <div className="msg msg-error" role="alert">{error}</div>}
      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy || uploading} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
