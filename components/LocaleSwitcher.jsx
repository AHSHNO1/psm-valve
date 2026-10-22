"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { locales, localeNames, localeFlags } from "@/lib/i18n";

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLocale = pathname.split("/")[1] || "fa";
  const changeLanguageLabel = {
    fa: "تغییر زبان",
    en: "Change language",
    ar: "تغيير اللغة",
    ru: "Сменить язык"
  }[currentLocale] || "Change language";

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchTo = (newLocale) => {
    const segments = pathname.split("/").filter(Boolean);
    segments[0] = newLocale;
    router.push("/" + segments.join("/"));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={changeLanguageLabel + " " + localeNames[currentLocale] + " " + localeFlags[currentLocale]}
        aria-expanded={open}
        aria-controls={open ? "locale-switcher-menu" : undefined}
        className="header-control flex items-center gap-2 h-10 px-3 rounded-lg border transition text-sm font-bold"
        style={{ color: "var(--gold-text)", borderColor: "var(--text-soft)", background: "var(--bg-card)" }}
      >
        <Globe size={16} />
        <span>{localeFlags[currentLocale]}</span>
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open && (
        <div
          id="locale-switcher-menu"
          className="absolute top-12 right-0 w-40 rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden z-50"
          style={{ background: "var(--bg-card)", borderColor: "var(--text-soft)" }}
        >
          {locales.map((loc) => (
            <button
              type="button"
              key={loc}
              onClick={() => switchTo(loc)}
              aria-current={loc === currentLocale ? "true" : undefined}
              className="locale-switcher-option w-full px-4 py-3 flex items-center justify-between text-sm transition"
              style={{
                color: loc === currentLocale ? "var(--gold)" : "var(--text-soft)",
                fontWeight: loc === currentLocale ? 800 : 600
              }}
            >
              <span>{localeNames[loc]}</span>
              <span className="text-xs opacity-70">{localeFlags[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
