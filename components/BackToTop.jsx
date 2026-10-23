"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          className="fixed bottom-24 md:bottom-28 left-4 md:left-6 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full grid place-items-center shadow-lg transition-all hover:scale-110"
          style={{
            background: "var(--gold-grad)",
            color: "#1A1D21",
            boxShadow: "0 8px 25px rgba(212, 160, 23, 0.4)"
          }}
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
