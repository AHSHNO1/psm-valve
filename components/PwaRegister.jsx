"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const TEXT = {
  fa: { install: "نصب اپلیکیشن", hint: "PSM Valve را مثل یک اپ نصب کنید", close: "بستن" },
  en: { install: "Install app", hint: "Install PSM Valve as an app", close: "Close" },
  ar: { install: "تثبيت التطبيق", hint: "ثبّت PSM Valve كتطبيق", close: "إغلاق" },
  ru: { install: "Установить", hint: "Установите PSM Valve как приложение", close: "Закрыть" }
};

/**
 * ثبت Service Worker + نمایش دکمهٔ «نصب اپلیکیشن» (PWA).
 * روی کروم/اج اندروید و دسکتاپ از beforeinstallprompt استفاده می‌کند؛
 * روی iOS دکمه ظاهر نمی‌شود و کاربر از Share → Add to Home Screen نصب می‌کند.
 */
export default function PwaRegister({ locale = "fa" }) {
  const t = TEXT[locale] || TEXT.en;
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function onPrompt(event) {
      event.preventDefault();
      setDeferred(event);
      if (!sessionStorage.getItem("psm-install-dismissed")) {
        setVisible(true);
      }
    }

    function onInstalled() {
      setVisible(false);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem("psm-install-dismissed", "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice && choice.outcome === "accepted") setVisible(false);
    } catch {}
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="pwa-install" role="region" aria-label={t.install}>
      <div className="pwa-install-icon">
        <Download size={16} />
      </div>
      <div className="pwa-install-text">
        <strong>{t.install}</strong>
        <span>{t.hint}</span>
      </div>
      <button type="button" onClick={install} className="pwa-install-btn">
        {t.install}
      </button>
      <button type="button" onClick={dismiss} className="pwa-install-close" aria-label={t.close}>
        <X size={14} />
      </button>

      <style jsx>{`
        .pwa-install {
          position: fixed;
          z-index: 70;
          inset-inline: 16px;
          bottom: 16px;
          margin-inline: auto;
          max-width: 440px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          box-shadow: var(--shadow-lg);
        }
        @media (min-width: 640px) {
          .pwa-install { inset-inline: auto; inset-inline-start: 24px; }
        }
        .pwa-install-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(224, 168, 26, 0.14);
          color: var(--gold);
          flex-shrink: 0;
        }
        .pwa-install-text { flex: 1; min-width: 0; display: grid; line-height: 1.4; }
        .pwa-install-text strong { font-size: 12px; color: var(--text); }
        .pwa-install-text span { font-size: 10px; color: var(--text-muted); }
        .pwa-install-btn {
          border: none;
          border-radius: 9px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 900;
          font-family: inherit;
          cursor: pointer;
          color: #1A1D21;
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          white-space: nowrap;
        }
        .pwa-install-close {
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
        }
      `}</style>
    </div>
  );
}
