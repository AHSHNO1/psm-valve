"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { DeleteBtn, EditBtn, SaveBtn, CancelBtn, ToggleBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { FormSection, FormGrid, Field } from "./EditorPanel";
import UploadDropzone from "./UploadDropzone";
import { useToast, Toast } from "./useToast";

const TABS = [
  { id: "gallery", label: "تصاویر", noun: "تصویر", icon: "image" },
  { id: "videos", label: "ویدئوها", noun: "ویدئو", icon: "package" },
  { id: "catalogs", label: "کاتالوگ‌ها", noun: "کاتالوگ", icon: "file" }
];

export default function MediaClient({ initial }) {
  const [media, setMedia] = useState(initial || { videos: [], catalogs: [], gallery: [], introVideoUrl: "" });
  const [tab, setTab] = useState("gallery");
  const [editing, setEditing] = useState(null);
  const [introUrl, setIntroUrl] = useState(media.introVideoUrl || "");
  const [savingIntro, setSavingIntro] = useState(false);
  const { notify, toast } = useToast();

  const tabMeta = TABS.find((item) => item.id === tab) || TABS[0];
  const activeList = media[tab] || [];
  const editingItem = editing && editing !== "new"
    ? activeList.find((item) => item.id === editing)
    : null;

  async function refresh() {
    const res = await fetch("/api/media");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "بارگذاری اطلاعات مدیا ناموفق بود");
    setMedia(data.media);
  }

  async function saveIntro() {
    setSavingIntro(true);
    try {
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
      await refresh();
    } catch (error) {
      notify(error.message || "ذخیره ویدئو ناموفق بود", true);
    } finally {
      setSavingIntro(false);
    }
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

      <EditorPanel
        title="ویدئوی معرفی شرکت"
        subtitle="ویدئویی که در صفحه اصلی سایت نمایش داده می‌شود"
        icon={<Icon name="package" size={17} />}
        badge={<span className="chip chip-gold">صفحه اصلی</span>}
      >
        <FormSection>
          <FormGrid>
            <Field
              as="div"
              wide
              label="نشانی ویدئو"
              hint="لینک آپارات، یوتیوب یا ویمئو را وارد کنید. برای تغییر، پس از ویرایش دکمه ذخیره را بزنید."
            >
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  dir="ltr"
                  value={introUrl}
                  onChange={function (e) { setIntroUrl(e.target.value); }}
                  placeholder="https://www.aparat.com/v/..."
                  className="form-input"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <SaveBtn onClick={saveIntro} busy={savingIntro} />
              </div>
            </Field>
          </FormGrid>
        </FormSection>
      </EditorPanel>

      <div className="tabs anim-in">
        {TABS.map(function (t) {
          const count = (media[t.id] || []).length;
          return (
            <button key={t.id} onClick={function () { setTab(t.id); setEditing(null); }}
              className={"tab" + (tab === t.id ? " tab-active" : "")}>
              <Icon name={t.icon} size={13} />
              {t.label}
              <span className="tab-badge">{count}</span>
            </button>
          );
        })}
        <button onClick={function () { setEditing("new"); }}
          className="btn-add" style={{ marginInlineStart: "auto", fontSize: 12, padding: "7px 14px" }}>
          <Icon name="plus" size={14} /> افزودن {tabMeta.noun}
        </button>
      </div>

      {editing === "new" && (
        <EditorPanel
          title={"افزودن " + tabMeta.noun}
          subtitle="اطلاعات و فایل آیتم جدید را وارد کنید؛ پس از ذخیره در فهرست نمایش داده می‌شود."
          icon={<Icon name={tabMeta.icon} size={17} />}
          badge={<span className="chip chip-blue">{tabMeta.label}</span>}
          onClose={function () { setEditing(null); }}
        >
          <MediaForm type={tab}
            onSave={async function () {
              await refresh();
              setEditing(null);
              notify("ذخیره شد");
            }}
            onCancel={function () { setEditing(null); }} />
        </EditorPanel>
      )}

      {editingItem && (
        <EditorPanel
          title={"ویرایش " + tabMeta.noun}
          subtitle="تغییرات پس از ذخیره روی سایت اعمال می‌شود."
          icon={<Icon name={tabMeta.icon} size={17} />}
          badge={<span className="chip chip-gold">در حال ویرایش</span>}
          onClose={function () { setEditing(null); }}
        >
          <MediaForm
            key={editingItem.id}
            type={tab}
            initialItem={editingItem}
            onSave={async function () {
              await refresh();
              setEditing(null);
              notify("تغییرات ذخیره شد");
            }}
            onCancel={function () { setEditing(null); }}
          />
        </EditorPanel>
      )}

      {activeList.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name={tabMeta.icon} size={30} /></div>
          <div className="empty-title">هنوز {tabMeta.noun}ی اضافه نشده</div>
          <div className="empty-desc">از دکمه افزودن {tabMeta.noun} بالا استفاده کنید</div>
        </div>
      ) : (
        <div className="card-grid">
          {activeList.map(function (item, i) {
            return (
              <div
                key={item.id}
                className={"card-item anim-in" + (editing === item.id ? " card-item-editing" : "")}
                style={{ animationDelay: (i * 25) + "ms" }}
              >
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
                {editing === item.id && (
                  <div style={{ marginTop: 4 }}>
                    <span className="chip chip-gold">در حال ویرایش</span>
                  </div>
                )}
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
                  <EditBtn onClick={function () { setEditing(item.id); }} title="ویرایش" />
                  <ToggleBtn active={item.active !== false}
                    onClick={function () { toggleItem(item, tab); }}
                    title={item.active === false ? "نمایش در سایت" : "پنهان کردن از سایت"} />
                  {item.source !== "aparat" && (
                    <DeleteBtn onClick={function () { removeItem(item.id, tab); }} />
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(initialItem);

  const labels = {
    gallery: { title: "تصویر", noun: "تصویر", uploadType: "images", accept: "image/*", guidelineKey: "galleryImage" },
    videos: { title: "ویدئو", noun: "ویدئو", uploadType: "videos", accept: "video/*", guidelineKey: "video" },
    catalogs: { title: "کاتالوگ PDF", noun: "کاتالوگ", uploadType: "catalogs", accept: "application/pdf", guidelineKey: "catalog" }
  };
  const label = labels[type];

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
      <FormSection title="اطلاعات آیتم" description="عنوان و توضیحی که در سایت نمایش داده می‌شود">
        <FormGrid>
          <Field label={"عنوان " + label.title} wide required>
            <input type="text" value={title} onChange={function (e) { setTitle(e.target.value); }}
              className="form-input" required />
          </Field>
          <Field label="توضیحات" wide required={type === "catalogs"}
            hint={type === "catalogs" ? "توضیح کوتاه درباره محتوای کاتالوگ." : "اختیاری"}>
            <textarea rows={2} value={description} onChange={function (e) { setDescription(e.target.value); }}
              className="form-input" required={type === "catalogs"} />
          </Field>
        </FormGrid>
      </FormSection>

      {type === "videos" && (
        <FormSection title="فایل ویدئو" description="یکی از دو روش لینک یا بارگذاری را انتخاب کنید">
          <FormGrid>
            <Field label="لینک ویدئو" hint="آپارات، یوتیوب یا ویمئو">
              <input type="url" dir="ltr" value={url.startsWith("/uploads/") ? "" : url}
                onChange={function (e) { setUrl(e.target.value); }}
                placeholder="https://www.aparat.com/v/..." className="form-input" />
            </Field>
            <Field as="div" label="یا بارگذاری فایل ویدئو" hint="حداکثر ۵۰ مگابایت؛ برای فایل‌های سنگین از لینک استفاده کنید.">
              <UploadDropzone
                type="videos"
                guidelineKey="video"
                value={url.startsWith("/uploads/") ? url : ""}
                onChange={function (next) { setUrl(next || ""); }}
                accept="video/*"
                label=""
              />
            </Field>
          </FormGrid>
          <Field as="div" label="تصویر کاور ویدئو" hint="اختیاری؛ تصویر پیش‌نمایش قبل از پخش." className="content-image-field">
            <UploadDropzone
              type="posters"
              guidelineKey="videoPoster"
              value={poster}
              onChange={function (next) { setPoster(next || ""); }}
              accept="image/jpeg,image/png,image/webp"
              label=""
            />
          </Field>
        </FormSection>
      )}

      {type === "gallery" && (
        <FormSection title="فایل تصویر" description="تصویر گالری سایت">
          <Field as="div" label="بارگذاری تصویر" hint="پس از آپلود، تصویر بهینه‌سازی و ذخیره می‌شود.">
            <UploadDropzone
              type="images"
              guidelineKey="galleryImage"
              value={url}
              onChange={function (next) { setUrl(next || ""); }}
              accept="image/*"
              label=""
            />
          </Field>
        </FormSection>
      )}

      {type === "catalogs" && (
        <FormSection title="فایل کاتالوگ و جلد" description="فایل PDF و تصویر روی جلد آن">
          <FormGrid>
            <Field as="div" label="فایل PDF کاتالوگ" required>
              <UploadDropzone
                type="catalogs"
                guidelineKey="catalog"
                value={url}
                onChange={function (next) { setUrl(next || ""); }}
                accept="application/pdf"
                label=""
              />
            </Field>
            <Field as="div" label="تصویر روی جلد کاتالوگ" required>
              <UploadDropzone
                type="images"
                guidelineKey="catalogCover"
                value={cover}
                onChange={function (next) { setCover(next || ""); }}
                accept="image/*"
                label=""
              />
            </Field>
          </FormGrid>
        </FormSection>
      )}

      {error && <div className="msg msg-error" role="alert">{error}</div>}
      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
        <CancelBtn onClick={onCancel} />
      </div>
    </div>
  );
}
