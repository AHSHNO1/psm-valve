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
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-silver-500/30 text-silver-300 hover:text-gold-500 hover:border-gold-500 transition text-sm font-bold"
      >
        <Globe size={16} />
        <span>{localeFlags[currentLocale]}</span>
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-40 rounded-xl border border-silver-500/30 bg-silver-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchTo(loc)}
              className={`w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-gold-500/10 hover:text-gold-500 transition ${
                loc === currentLocale ? "text-gold-500 font-bold" : "text-silver-200"
              }`}
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
