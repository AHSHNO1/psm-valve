"use client";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock } from "lucide-react";
import { FLUIDS, FLUID_CATEGORIES, searchFluids } from "@/lib/fluids-database";

const RECENT_KEY = "psm_recent_fluids";

export default function FluidPicker({ isOpen, onClose, onSelect, locale = "fa", currentFluidType }) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [recent, setRecent] = useState([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const filtered = useMemo(() => searchFluids(query, category, locale), [query, category, locale]);

  function handleSelect(fluid) {
    try {
      const next = [fluid.id, ...recent.filter(id => id !== fluid.id)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch (e) {}
    onSelect(fluid);
    onClose();
  }

  const recentFluids = useMemo(() => {
    return recent.map(id => FLUIDS.find(f => f.id === id)).filter(Boolean);
  }, [recent]);

  const L = {
    fa: {
      title: "انتخاب سیال", subtitle: "۳۰+ سیال صنعتی",
      search: "جستجو...", recent: "اخیر", results: "نتیجه",
      noResults: "سیالی یافت نشد",
      liquid: "مایع", gas: "گاز", steam: "بخار"
    },
    en: {
      title: "Select Fluid", subtitle: "30+ industrial fluids",
      search: "Search...", recent: "Recent", results: "results",
      noResults: "No fluid found",
      liquid: "Liquid", gas: "Gas", steam: "Steam"
    },
    ar: {
      title: "اختر السائل", subtitle: "٣٠+ سائل",
      search: "بحث...", recent: "الأخيرة", results: "نتيجة",
      noResults: "لا يوجد", liquid: "سائل", gas: "غاز", steam: "بخار"
    },
    ru: {
      title: "Выбор среды", subtitle: "30+ сред",
      search: "Поиск...", recent: "Недавние", results: "результатов",
      noResults: "Не найдено", liquid: "Жидкость", gas: "Газ", steam: "Пар"
    }
  }[locale] || {};

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              background: "rgba(10, 12, 16, 0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 9998
            }}
          />
          <div
            className="no-print"
            style={{
              position: "fixed", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
              zIndex: 9999, pointerEvents: "none"
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              style={{
                width: "100%", maxWidth: 720,
                maxHeight: "90vh", overflow: "hidden",
                display: "flex", flexDirection: "column",
                background: "var(--bg-card)",
                borderRadius: 20,
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--shadow-lg)",
                pointerEvents: "auto"
              }}
            >
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
                    {L.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>
                    {L.subtitle}
                  </div>
                </div>
                <button onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "var(--bg-soft)", border: "none", cursor: "pointer",
                    display: "grid", placeItems: "center",
                    color: "var(--text-soft)"
                  }}>
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div style={{ padding: "14px 20px 8px", flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <Search size={15} color="var(--text-muted)"
                    style={{ position: "absolute", top: "50%", insetInlineStart: 12, transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={L.search}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      paddingInlineStart: 36,
                      borderRadius: 10,
                      border: "1.5px solid var(--border-strong)",
                      background: "var(--bg-soft)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      outline: "none"
                    }}
                    onFocus={e => { e.target.style.borderColor = "var(--gold)"; e.target.style.boxShadow = "0 0 0 3px var(--glow)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Categories */}
              <div style={{ padding: "8px 20px 12px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                {FLUID_CATEGORIES.map(c => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 20, border: "none",
                        cursor: "pointer", fontFamily: "inherit",
                        fontSize: 11.5, fontWeight: 900,
                        background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "var(--bg-soft)",
                        color: active ? "#FFFFFF" : "var(--text-soft)",
                        display: "flex", alignItems: "center", gap: 5,
                        transition: "all 0.15s"
                      }}>
                      <span>{c.icon}</span>
                      {c.names[locale] || c.names.en}
                    </button>
                  );
                })}
              </div>

              {/* Recent */}
              {!query && recentFluids.length > 0 && (
                <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 5
                  }}>
                    <Clock size={11} /> {L.recent}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recentFluids.map(f => (
                      <button key={f.id} onClick={() => handleSelect(f)}
                        style={{
                          padding: "6px 12px", borderRadius: 8,
                          background: "var(--bg-soft)",
                          border: "1px solid var(--border)",
                          cursor: "pointer", fontFamily: "inherit",
                          fontSize: 11, fontWeight: 800,
                          color: "var(--text)",
                          display: "flex", alignItems: "center", gap: 5
                        }}>
                        <span>{f.icon}</span>
                        {f.names[locale] || f.names.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Count */}
              <div style={{ padding: "0 20px 10px", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                {filtered.length} {L.results}
              </div>

              {/* Results */}
              <div style={{ padding: "0 20px 20px", overflowY: "auto", flex: 1 }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
                    {L.noResults}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {filtered.map(f => {
                      const name = f.names[locale] || f.names.en;
                      const isLiquid = f.type === "liquid";
                      return (
                        <motion.button
                          key={f.id}
                          onClick={() => handleSelect(f)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: 14, borderRadius: 12,
                            background: "var(--bg-soft)",
                            border: "1.5px solid var(--border)",
                            cursor: "pointer", fontFamily: "inherit",
                            textAlign: "start",
                            display: "flex", alignItems: "flex-start", gap: 10,
                            transition: "border-color 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "var(--bg-card)",
                            display: "grid", placeItems: "center",
                            fontSize: 18, flexShrink: 0
                          }}>
                            {f.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text)", lineHeight: 1.3, marginBottom: 4 }}>
                              {name}
                            </div>
                            <div style={{
                              display: "flex", gap: 6, flexWrap: "wrap",
                              fontSize: 9.5, fontWeight: 700,
                              color: "var(--text-muted)",
                              fontFamily: "monospace", direction: "ltr"
                            }}>
                              {isLiquid ? (
                                <><span>Gf={f.Gf}</span><span>·</span><span>Pv={f.Pv}</span></>
                              ) : (
                                <><span>Gg={f.Gg}</span><span>·</span><span>k={f.k}</span></>
                              )}
                            </div>
                            <div style={{
                              marginTop: 6, padding: "2px 7px", borderRadius: 5,
                              display: "inline-block",
                              background: f.type === "liquid" ? "rgba(0,120,212,0.15)" : f.type === "gas" ? "rgba(247,99,12,0.15)" : "rgba(232,17,35,0.15)",
                              color: f.type === "liquid" ? "#0078D4" : f.type === "gas" ? "#F7630C" : "#E81123",
                              fontSize: 9, fontWeight: 900
                            }}>
                              {f.type === "liquid" ? L.liquid : f.type === "gas" ? L.gas : L.steam}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}