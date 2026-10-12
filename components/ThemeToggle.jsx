"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Theme"
        className="w-10 h-10 rounded-lg border border-silver-500/30 text-silver-300 grid place-items-center"
      >
        <Sun size={18} />
      </button>
    );
  }

  const current = resolvedTheme || theme;
  const isDark = current === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 rounded-lg border border-silver-500/30 text-silver-300 hover:text-gold-500 hover:border-gold-500 transition grid place-items-center"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
