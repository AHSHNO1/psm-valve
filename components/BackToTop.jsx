"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let frame = null;
    function update() {
      frame = null;
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, doc.scrollTop / total)) : 0);
      setVisible(window.scrollY > 400);
    }
    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-24 md:bottom-28 left-4 md:left-6 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full grid place-items-center shadow-lg"
          style={{
            background: "var(--gold-grad)",
            color: "#1A1D21",
            boxShadow: "0 8px 25px rgba(212, 160, 23, 0.4)"
          }}
        >
          <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="rgba(23, 25, 29, 0.25)" strokeWidth="3" />
            <circle
              cx="24" cy="24" r={RADIUS} fill="none" stroke="#17191D" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <ArrowUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
