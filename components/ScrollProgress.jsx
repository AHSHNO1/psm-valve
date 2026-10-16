"use client";

// ============================================================
// SCROLL PROGRESS — نوار پیشرفت مطالعه در بالای صفحه
// به کاربر نشان میدهد چقدر از صفحه را دیده است.
// با ویژگی accessibility کاهش حرکت، نادیده گرفته میشود.
// ============================================================

import { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(function () {
    // احترام به تنظیم کاهش حرکت کاربر
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      setEnabled(false);
      return;
    }

    let frame = null;

    function update() {
      frame = null;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const value = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, value)));
    }

    function onScroll() {
      // با requestAnimationFrame گلوگاه اسکرول را آزاد نگه میداریم
      if (frame === null) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return function () {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!enabled || progress <= 0) return null;

  return (
    <div
      className="scroll-progress"
      style={{ width: progress + "%" }}
      role="presentation"
      aria-hidden="true"
    />
  );
}