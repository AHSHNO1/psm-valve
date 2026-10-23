"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useDictionary } from "./Providers";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale } = useDictionary();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", (resolvedTheme || theme) === "dark" ? "#10141B" : "#F6F8FB");
  }, [mounted, theme, resolvedTheme]);

  const labels = {
    fa: { theme: "تغییر پوسته", light: "تغییر به حالت روشن", dark: "تغییر به حالت تاریک" },
    en: { theme: "Change theme", light: "Switch to light mode", dark: "Switch to dark mode" },
    ar: { theme: "تغيير المظهر", light: "التبديل إلى الوضع الفاتح", dark: "التبديل إلى الوضع الداكن" },
    ru: { theme: "Сменить тему", light: "Включить светлую тему", dark: "Включить темную тему" }
  }[locale] || { theme: "Change theme", light: "Switch to light mode", dark: "Switch to dark mode" };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={labels.theme}
        className="header-control w-10 h-10 rounded-lg border grid place-items-center"
        style={{ color: "var(--gold)", borderColor: "var(--border-strong)", background: "var(--bg-card)" }}
      >
        <Sun size={18} />
      </button>
    );
  }

  const current = resolvedTheme || theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? labels.light : labels.dark}
      className="header-control w-10 h-10 rounded-lg border transition grid place-items-center"
      style={{ color: "var(--gold)", borderColor: "var(--border-strong)", background: "var(--bg-card)" }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
