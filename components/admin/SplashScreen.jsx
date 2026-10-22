"use client";
import { useEffect, useState } from "react";

export default function SplashScreen({ duration = 1500 }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("psm_splash_seen");
    if (seen) return;
    setShow(true);
    sessionStorage.setItem("psm_splash_seen", "1");
    const t1 = setTimeout(() => setFading(true), duration - 300);
    const t2 = setTimeout(() => setShow(false), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration]);

  if (!show) return null;

  return (
    <div
      className="splash"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease"
      }}
    >
      <div className="text-center">
        <div
          className="splash-logo w-28 h-28 rounded-2xl mx-auto grid place-items-center mb-6"
          style={{
            background: "linear-gradient(135deg, #E0A81A, #B8850A)",
            boxShadow: "0 20px 60px rgba(201, 149, 13, 0.45)"
          }}
        >
          <span className="text-white font-black text-3xl">PSM</span>
        </div>
        <div className="splash-text mb-8">
          <div className="text-2xl font-black" style={{ color: "var(--text)" }}>
            پنل مدیریت
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: "var(--text-muted)" }}>
            پترو سازه میهن · PSM VALVE
          </div>
        </div>
        <div
          className="w-56 h-1.5 rounded-full mx-auto overflow-hidden"
          style={{ background: "rgba(20, 22, 27, 0.08)" }}
        >
          <div
            className="splash-progress-inner h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #E0A81A, #F5C518)" }}
          />
        </div>
      </div>
    </div>
  );
}
