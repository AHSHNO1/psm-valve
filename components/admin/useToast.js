"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./AdminIcons";

// جانشین مشترک برای ~۲۵ پیاده‌سازی notify() در کامپوننت‌های ادمین.
// notify(text, isError) پیام را نشان می‌دهد و بعد از مدتی پنهان می‌کند.
export function useToast(duration = 3200) {
  const [toast, setToast] = useState({ type: "", text: "" });
  const timer = useRef(null);

  const notify = useCallback(function (text, isError) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type: isError ? "error" : "success", text: text });
    timer.current = setTimeout(function () {
      setToast({ type: "", text: "" });
    }, duration);
  }, [duration]);

  const dismiss = useCallback(function () {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type: "", text: "" });
  }, []);

  useEffect(function () {
    return function () {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { notify, toast, dismiss };
}

// رندر استاندارد پیام. استفاده: <Toast toast={toast} />
export function Toast({ toast }) {
  if (!toast || !toast.text) return null;
  const isError = toast.type === "error";
  return (
    <div className={"msg anim-in " + (isError ? "msg-error" : "msg-success")}>
      <Icon name={isError ? "alert" : "check"} /> {toast.text}
    </div>
  );
}
