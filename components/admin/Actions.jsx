"use client";
import { Icon } from "./AdminIcons";

export function EditBtn({ href, onClick, title }) {
  const props = {
    className: "act-btn act-btn-edit",
    title: title || "ویرایش"
  };
  if (href) return <a href={href} {...props}><Icon name="pencil" /></a>;
  return <button type="button" onClick={onClick} {...props}><Icon name="pencil" /></button>;
}

export function ViewBtn({ href, onClick, title }) {
  const props = {
    className: "act-btn act-btn-view",
    title: title || "مشاهده",
    target: href ? "_blank" : undefined,
    rel: href ? "noopener noreferrer" : undefined
  };
  if (href) return <a href={href} {...props}><Icon name="external" /></a>;
  return <button type="button" onClick={onClick} {...props}><Icon name="external" /></button>;
}

export function DeleteBtn({ onClick, title }) {
  return (
    <button type="button" onClick={onClick} className="act-btn act-btn-delete" title={title || "حذف"}>
      <Icon name="trash" />
    </button>
  );
}

export function ToggleBtn({ active, onClick, title }) {
  return (
    <button type="button" onClick={onClick} className="act-btn act-btn-toggle"
      title={title || (active ? "غیرفعال کردن" : "فعال کردن")}>
      <Icon name={active ? "eye" : "eyeOff"} />
    </button>
  );
}

export function SaveBtn({ onClick, disabled, busy }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className="btn-add">
      {busy ? <Icon name="loader" /> : <Icon name="save" />}
      ذخیره
    </button>
  );
}

export function CancelBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="btn-cancel">
      <Icon name="x" /> انصراف
    </button>
  );
}
