"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";
import { SaveBtn } from "./Actions";
import ContentStudioNav from "./ContentStudioNav";
import EditorPanel, { FormSection, FormGrid, Field } from "./EditorPanel";
import UploadDropzone from "./UploadDropzone";
import { useUnsavedChanges, isDirty } from "./useUnsavedChanges";

const LOGO_FIELDS = [
  {
    key: "logo",
    label: "لوگوی اصلی",
    hint: "در هدر، فوتر و اسلایدر استفاده می‌شود. PNG شفاف یا SVG.",
    guidelineKey: "partnerLogo"
  },
  {
    key: "logoLight",
    label: "لوگوی روشن",
    hint: "برای پس‌زمینه‌های تیره؛ نسخه سفید و شفاف.",
    guidelineKey: "partnerLogo"
  },
  {
    key: "logoIcon",
    label: "نشان لوگو",
    hint: "نسخه مربعی و خوانا برای اندازه‌های کوچک.",
    guidelineKey: "productImage"
  },
  {
    key: "favicon",
    label: "فاویکون",
    hint: "آیکون مرورگر؛ تصویر مربعی کوچک.",
    guidelineKey: "productImage"
  }
];

const SOCIAL_FIELDS = [
  ["instagram", "اینستاگرام", "https://instagram.com/..."],
  ["linkedin", "لینکدین", "https://linkedin.com/..."],
  ["telegram", "تلگرام", "https://t.me/..."],
  ["whatsapp", "واتساپ", "https://wa.me/..."],
  ["youtube", "یوتیوب", "https://youtube.com/..."],
  ["aparat", "آپارات", "https://aparat.com/..."],
  ["bale", "بله", "https://ble.ir/..."],
  ["rubika", "روبیکا", "https://rubika.ir/..."],
  ["eitaa", "ایتا", "https://eitaa.com/..."]
];

function initialForm(initial) {
  return {
    logo: (initial && initial.logo) || "",
    logoLight: (initial && initial.logoLight) || "",
    logoIcon: (initial && initial.logoIcon) || "",
    favicon: (initial && initial.favicon) || "",
    primaryColor: (initial && initial.primaryColor) || "#D4A017",
    secondaryColor: (initial && initial.secondaryColor) || "#C0C0C0",
    socialLinks: (initial && initial.socialLinks) || {}
  };
}

export default function BrandingClient({ initial }) {
  const [form, setForm] = useState(() => initialForm(initial));
  const [saved, setSaved] = useState(() => initialForm(initial));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const dirty = isDirty(form, saved);
  useUnsavedChanges(dirty);

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  function update(patch) {
    setForm(Object.assign({}, form, patch));
  }

  function updateSocial(key, val) {
    update({ socialLinks: Object.assign({}, form.socialLinks, { [key]: val }) });
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) {
        const next = initialForm(data.branding || form);
        setForm(next);
        setSaved(next);
        notify("تنظیمات برند ذخیره شد");
      } else {
        notify("خطا در ذخیره", true);
      }
    } catch (e) {
      notify("خطای شبکه", true);
    }
    setBusy(false);
  }

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #B4009E, #8A007A)" }}>
            <Icon name="palette" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">هویت برند</div>
            <div className="page-header-sub">لوگو، رنگ‌ها و شبکه‌های اجتماعی</div>
          </div>
        </div>
        {dirty && <span className="chip chip-gold">تغییرات ذخیره‌نشده</span>}
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")} role="status">
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      <EditorPanel
        title="لوگوهای برند"
        subtitle="برای هر جایگاه، فایل مناسب همان اندازه را بارگذاری کنید."
        icon={<Icon name="image" size={17} />}
      >
        <FormGrid>
          {LOGO_FIELDS.map(function (field) {
            return (
              <Field as="div" key={field.key} label={field.label} hint={field.hint}>
                <UploadDropzone
                  type="images"
                  guidelineKey={field.guidelineKey}
                  value={form[field.key]}
                  onChange={function (url) { update({ [field.key]: url }); }}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  label=""
                />
              </Field>
            );
          })}
        </FormGrid>
      </EditorPanel>

      <EditorPanel
        title="رنگ‌های برند"
        subtitle="رنگ اصلی در دکمه‌ها و تأکیدها و رنگ ثانویه در جزئیات استفاده می‌شود."
        icon={<Icon name="sparkles" size={17} />}
      >
        <FormGrid>
          {[
            ["primaryColor", "رنگ اصلی"],
            ["secondaryColor", "رنگ ثانویه"]
          ].map(function ([key, label]) {
            return (
              <Field as="div" key={key} label={label}>
                <div className="branding-color-row">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={function (e) { update({ [key]: e.target.value }); }}
                    className="branding-color-swatch"
                    aria-label={label}
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={form[key]}
                    onChange={function (e) { update({ [key]: e.target.value }); }}
                    className="form-input"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </Field>
            );
          })}
        </FormGrid>
      </EditorPanel>

      <EditorPanel
        title="شبکه‌های اجتماعی"
        subtitle="نشانی‌های خالی در سایت نمایش داده نمی‌شوند."
        icon={<Icon name="globe" size={17} />}
      >
        <FormSection>
          <FormGrid>
            {SOCIAL_FIELDS.map(function ([key, label, placeholder]) {
              return (
                <Field key={key} label={label}>
                  <input
                    type="url"
                    dir="ltr"
                    value={form.socialLinks[key] || ""}
                    onChange={function (e) { updateSocial(key, e.target.value); }}
                    placeholder={placeholder}
                    className="form-input"
                  />
                </Field>
              );
            })}
          </FormGrid>
        </FormSection>
      </EditorPanel>

      <div className="save-bar">
        <SaveBtn onClick={save} busy={busy} />
        {dirty && <span className="text-soft" style={{ fontSize: 12, fontWeight: 700 }}>تغییرات ذخیره نشده است</span>}
      </div>
    </div>
  );
}
