"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Package, Info } from "lucide-react";
import { suggestProducts, PRODUCTS_META } from "@/data/psm-products-preview";
import { track } from "@/lib/analytics";

export default function ProductSuggestions({ result, form, locale = "fa" }) {
  if (!result || !result.Cv || result.error) return null;
  const suggestions = suggestProducts(result.Cv, form, locale);
  if (suggestions.length === 0) return null;

  const L = {
    fa: {
      title: "محصولات پیشنهادی PSM",
      subtitle: "بر اساس Cv محاسبه‌شده شما",
      recommended: "پیشنهاد ویژه",
      matchedSize: "سایز مناسب",
      opening: "بازشدگی",
      reqQuote: "درخواست قیمت",
      viewProduct: "مشاهده محصول",
      preview: PRODUCTS_META.message.fa
    },
    en: {
      title: "Suggested PSM Products",
      subtitle: "Based on your calculated Cv",
      recommended: "Best Match",
      matchedSize: "Matched Size",
      opening: "Opening",
      reqQuote: "Request Quote",
      viewProduct: "View Product",
      preview: PRODUCTS_META.message.en
    },
    ar: {
      title: "منتجات PSM المقترحة",
      subtitle: "بناءً على Cv المحسوب",
      recommended: "الأفضل",
      matchedSize: "الحجم",
      opening: "الفتح",
      reqQuote: "طلب سعر",
      viewProduct: "عرض",
      preview: PRODUCTS_META.message.ar
    },
    ru: {
      title: "Рекомендуемые продукты PSM",
      subtitle: "По вашему Cv",
      recommended: "Лучший",
      matchedSize: "Размер",
      opening: "Открытие",
      reqQuote: "Запросить",
      viewProduct: "Смотреть",
      preview: PRODUCTS_META.message.ru
    }
  }[locale] || {};

  return (
    <div className="card-glass" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, #E0A81A, #B8850A)",
          color: "#FFFFFF"
        }}>
          <Package size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{L.title}</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>{L.subtitle}</div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(224,168,26,0.12)",
          color: "#B8850A", fontSize: 10, fontWeight: 900,
          fontFamily: "monospace"
        }}>
          Cv {result.Cv}
        </div>
      </div>

      <div style={{
        padding: "8px 12px", borderRadius: 9,
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.30)",
        display: "flex", alignItems: "center", gap: 7,
        fontSize: 10.5, fontWeight: 700,
        color: "#D97706", marginBottom: 12
      }}>
        <Info size={12} />
        {L.preview}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {suggestions.map((s, i) => {
          const p = s.product;
          const isTop = i === 0;
          const tags = p.tags[locale] || p.tags.en;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: 14, borderRadius: 14,
                background: isTop
                  ? `linear-gradient(135deg, ${p.color}12, ${p.color}04)`
                  : "#FFFFFF",
                border: isTop
                  ? `1.5px solid ${p.color}60`
                  : "1px solid var(--border)",
                position: "relative"
              }}
            >
              {isTop && (
                <div style={{
                  position: "absolute", top: -8, insetInlineEnd: 12,
                  padding: "3px 9px", borderRadius: 20,
                  background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                  color: "#FFFFFF",
                  fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", gap: 3,
                  boxShadow: `0 4px 12px ${p.color}50`
                }}>
                  <Star size={8} fill="#FFFFFF" /> {L.recommended}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 12,
                  background: `linear-gradient(135deg, ${p.color}20, ${p.color}08)`,
                  border: `1px solid ${p.color}30`,
                  display: "grid", placeItems: "center",
                  flexShrink: 0,
                  fontSize: 26
                }}>
                  ⚙️
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 4, flexWrap: "wrap"
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 900,
                      color: p.color, fontFamily: "monospace",
                      direction: "ltr"
                    }}>
                      {p.series}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-soft)" }}>
                      · {p.type[locale] || p.type.en}
                    </span>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8, marginTop: 8, marginBottom: 10
                  }}>
                    <MiniStat label={L.matchedSize} value={s.matchedSize.dn} color={p.color} />
                    <MiniStat label="Cv" value={s.matchedSize.cv} color={p.color} />
                    <MiniStat label={L.opening} value={s.openingPercent + "%"} color={
                      s.openingPercent >= 20 && s.openingPercent <= 80 ? "#10B981" : "#F59E0B"
                    } />
                  </div>

                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                    {tags.map((t, ti) => (
                      <span key={ti} style={{
                        padding: "2px 7px", borderRadius: 6,
                        background: p.color + "10",
                        color: p.color,
                        fontSize: 9, fontWeight: 800
                      }}>{t}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <Link
                      href={"/" + locale + "/contact?product=" + p.series}
                      onClick={() => track.quoteRequested({ product: p.series, source: "suggestions" })}
                      className="btn-gold justify-center"
                      style={{
                        flex: 1, padding: "8px 12px", fontSize: 11,
                        textDecoration: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                      }}
                    >
                      {L.reqQuote} <ArrowLeft size={11} />
                    </Link>
                    <Link
                      href={"/" + locale + "/contact?product=" + p.series}
                      onClick={() => track.productViewed({ product: p.series })}
                      style={{
                        padding: "8px 12px", fontSize: 11, fontWeight: 900,
                        textDecoration: "none",
                        background: "#FFFFFF",
                        border: "1.5px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      {L.viewProduct}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      padding: "6px 8px", borderRadius: 8,
      background: "#FFFFFF", border: "1px solid var(--border)",
      textAlign: "center"
    }}>
      <div style={{
        fontSize: 8.5, fontWeight: 800, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 2
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 12.5, fontWeight: 900,
        color: color || "var(--text)",
        fontFamily: "monospace", direction: "ltr"
      }}>
        {value}
      </div>
    </div>
  );
}