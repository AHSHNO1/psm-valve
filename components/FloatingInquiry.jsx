"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Headset } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary } from "./Providers";

// CTA شناور موبایل: در میانهٔ اسکرول ظاهر می‌شود و قبل از نمایش BottomPopup کنار می‌رود
export default function FloatingInquiry() {
  const { locale, t } = useDictionary();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [ratio, setRatio] = useState(0);

  useEffect(function() {
    const onScroll = function() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setRatio(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);

  const hidden = pathname.endsWith("/contact") || pathname.endsWith("/sizing");
  const show = ratio > 0.12 && ratio < 0.55 && !hidden;

  const link = (
    <Link
      href={"/" + locale + "/contact"}
      aria-label={t.nav.consult}
      className="flex items-center gap-2 rounded-full px-4 h-12 font-black text-sm"
      style={{
        background: "var(--gold-grad)",
        color: "#1A1D21",
        boxShadow: "0 10px 30px rgba(201, 149, 13, 0.45)"
      }}
    >
      <Headset size={18} aria-hidden="true" />
      {t.nav.consult}
    </Link>
  );

  return (
    <div className="lg:hidden fixed bottom-5 right-4 z-40">
      <AnimatePresence>
        {show && (reduceMotion ? link : (
          <motion.div
            key="inquiry"
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            {link}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
