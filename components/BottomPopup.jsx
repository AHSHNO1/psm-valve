"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useDictionary } from "./Providers";

const STORAGE_KEY = "psm_popup_dismissed";

export default function BottomPopup() {
  const { locale, t } = useDictionary();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // initially true to prevent flash

  // On mount, check sessionStorage
  useEffect(function() {
    if (typeof window === "undefined") return;
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (wasDismissed === "1") {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  // Scroll listener
  useEffect(function() {
    if (dismissed) return;

    function onScroll() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const percent = total > 0 ? scrolled / total : 0;
      if (percent > 0.55) setVisible(true);
      else setVisible(false);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return function() { window.removeEventListener("scroll", onScroll); };
  }, [dismissed]);

  const close = useCallback(function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setVisible(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  const popupTexts = {
    fa: {
      badge: "مشاوره رایگان",
      title: "پروژه‌ای در ذهن دارید؟",
      desc: "تیم مهندسی ما آماده بررسی فنی و ارائه قیمت است.",
      cta: "گفتگو با کارشناس",
      cta2: "نرم‌افزار سایزینگ"
    },
    en: {
      badge: "Free Consultation",
      title: "Have a project in mind?",
      desc: "Our engineering team is ready for technical review and pricing.",
      cta: "Talk to Expert",
      cta2: "Sizing Tool"
    },
    ar: {
      badge: "استشارة مجانية",
      title: "هل لديك مشروع؟",
      desc: "فريقنا الهندسي جاهز للمراجعة الفنية والتسعير.",
      cta: "تحدث مع خبير",
      cta2: "أداة تحديد الحجم"
    },
    ru: {
      badge: "Бесплатная консультация",
      title: "Есть проект?",
      desc: "Наша команда готова к техническому обзору и ценообразованию.",
      cta: "Связаться",
      cta2: "Подбор размера"
    }
  };

  const txt = popupTexts[locale] || popupTexts.fa;

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-[60]"
        >
          <div
            className="relative rounded-2xl p-6 backdrop-blur-xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
            }}
          >
            {/* Decorative gradient */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
            />

            {/* Close button — positioned top-left */}
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="absolute top-3 left-3 w-9 h-9 grid place-items-center rounded-lg transition-all hover:scale-110 z-20"
              style={{
                color: "var(--text)",
                background: "var(--bg-soft)",
                border: "1px solid var(--border)"
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="relative">
              <div className="flex items-center gap-2 mb-3 pl-10">
                <span className="chip">
                  <Sparkles size={12} /> {txt.badge}
                </span>
              </div>

              <h3 className="font-black text-lg mb-2" style={{ color: "var(--text)" }}>
                {txt.title}
              </h3>
              <p className="text-sm leading-6 mb-5" style={{ color: "var(--text-soft)" }}>
                {txt.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={"/" + locale + "/contact"}
                  className="btn-gold text-sm flex-1 justify-center"
                  onClick={close}
                >
                  <MessageCircle size={16} /> {txt.cta}
                </Link>
                <Link
                  href={"/" + locale + "/sizing"}
                  className="btn-outline text-sm"
                  onClick={close}
                >
                  {txt.cta2} <ArrowLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
