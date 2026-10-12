"use client";
import { useState, useRef } from "react";
import { Icon } from "./AdminIcons";
import { DeleteBtn, SaveBtn, CancelBtn } from "./Actions";

const TABS = [
  { id: "gallery", label: "تصاویر", icon: "image" },
  { id: "videos", label: "ویدئوها", icon: "package" },
  { id: "catalogs", label: "کاتالوگ‌ها", icon: "file" }
];

export default function MediaClient({ initial }) {
  const [media, setMedia] = useState(initial || { videos: [], catalogs: [], gallery: [], introVideoUrl: "" });
  const [tab, setTab] = useState("gallery");
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [introUrl, setIntroUrl] = useState(media.introVideoUrl || "");

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function refresh() {
    const res = await fetch("/api/media");
    const data = await res.json();
    if (data.ok) setMedia(data.media);
  }

  async function saveIntro() {
    await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ introVideoUrl: introUrl })
    });
    notify("ویدئو معرفی ذخیره شد");
    refresh();
  }

  async function removeItem(id, type) {
    if (!confirm("این آیتم حذف شود؟")) return;
    await fetch("/api/media?id=" + id + "&type=" + type, { method: "DELETE" });
    refresh();
    notify("حذف شد");
  }

  const activeList = media[tab] || [];

  return (
    <div>
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

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

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
            onSave={function() { refresh(); setEditing(null); notify("ذخیره شد"); }}
            onCancel={function() { setEditing(null); }} />
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
                  {tab === "catalogs" && <Icon name="file" size={30} />}
                </div>

                <div className="card-item-title" style={{
                  fontSize: 12, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {(typeof item.title === "string" ? item.title : (item.title && item.title.fa)) || "بدون عنوان"}
                </div>

                <div className="card-item-foot">
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="act-btn act-btn-view" title="باز کردن">
                    <Icon name="external" />
                  </a>
                  <DeleteBtn onClick={function() { removeItem(item.id, tab); }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MediaForm({ type, onSave, onCancel }) {
  const [url, setUrl] = useState("");
  const [poster, setPoster] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  async function upload(file, target) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type === "catalogs" ? "catalogs" : (type === "videos" ? "videos" : "images"));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        if (target === "poster") setPoster(data.url);
        else setUrl(data.url);
      }
    } catch (e) {}
    setUploading(false);
  }

  async function save() {
    if (!url && type !== "videos") { return; }
    setBusy(true);
    try {
      const item = { url: url, title: title, description: description };
      if (type === "videos") item.poster = poster;
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, item: item })
      });
      onSave();
    } catch (e) {}
    setBusy(false);
  }

  const labels = {
    gallery: { title: "تصویر", accept: "image/*" },
    videos: { title: "ویدئو", accept: "video/*" },
    catalogs: { title: "کاتالوگ PDF", accept: "application/pdf" }
  };
  const L = labels[type];

  return (
    <div>
      <label className="form-label">عنوان {L.title}</label>
      <input type="text" value={title} onChange={function(e) { setTitle(e.target.value); }}
        className="form-input" />

      {type === "videos" && (
        <>
          <label className="form-label" style={{ marginTop: 10 }}>لینک ویدئو (یوتیوب/ویمئو)</label>
          <input type="text" dir="ltr" value={url} onChange={function(e) { setUrl(e.target.value); }}
            placeholder="https://youtube.com/watch?v=..." className="form-input" />
          <div style={{ fontSize: 11, color: "#7A8290", marginTop: 6, textAlign: "center", fontWeight: 900 }}>— یا آپلود فایل —</div>
        </>
      )}

      <label className="form-label" style={{ marginTop: 10 }}>فایل</label>
      <div onClick={function() { inputRef.current && inputRef.current.click(); }}
        style={{
          border: "2px dashed #D1D5DB", background: "#F4F5F7", borderRadius: 10,
          padding: 18, textAlign: "center", cursor: "pointer"
        }}>
        <input ref={inputRef} type="file" accept={L.accept} style={{ display: "none" }}
          onChange={function(e) { upload(e.target.files[0]); }} />
        {uploading ? <Icon name="loader" size={20} /> : <Icon name="upload" size={22} />}
        {url && <div style={{ fontSize: 10, marginTop: 6, color: "#8A6508", fontWeight: 800 }}>فایل انتخاب شد</div>}
      </div>

      <label className="form-label" style={{ marginTop: 10 }}>توضیحات (اختیاری)</label>
      <textarea rows={2} value={description} onChange={function(e) { setDescription(e.target.value); }}
        className="form-input" />

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
