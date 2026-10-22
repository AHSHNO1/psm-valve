"use client";

import { useEffect } from "react";

export function useUnsavedChanges(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}

export function confirmDiscard(dirty) {
  if (!dirty) return true;
  return window.confirm("تغییرات ذخیره‌نشده دارید. با ادامه، این تغییرات از بین می‌رود. ادامه می‌دهید؟");
}

export function isDirty(current, saved) {
  try {
    return JSON.stringify(current) !== JSON.stringify(saved);
  } catch {
    return true;
  }
}
