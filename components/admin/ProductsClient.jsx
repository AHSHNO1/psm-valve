"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import { EditBtn, ViewBtn, DeleteBtn } from "./Actions";
import { getCategoryLabel } from "@/lib/categories";
import ContentStudioNav from "./ContentStudioNav";

function pick(obj) {
  if (!obj) return "بدون نام";
  if (typeof obj === "string") return obj;
  return obj.fa || obj.en || "بدون نام";
}

function initial(series) {
  if (!series) return "P";
  const parts = series.split("-");
  const last = parts[parts.length - 1];
  return last.charAt ? last.charAt(0).toUpperCase() : "P";
}

const COLORS = [
  ["#E0A81A", "#B8850A"], ["#0078D4", "#005A9E"], ["#00A896", "#007A6D"],
  ["#107C10", "#0A5F0A"], ["#F7630C", "#CA5010"], ["#8764B8", "#6B4C9C"],
  ["#B4009E", "#8A007A"], ["#4F6BED", "#3B52C4"], ["#CA5010", "#A83C0A"],
  ["#00A896", "#007A6D"], ["#6380F0", "#3B52C4"], ["#5D5A58", "#363A44"]
];

export default function ProductsClient({ products: initialProducts, categories }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [busySlug, setBusySlug] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });

  const filtered = products.filter(function(p) {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      pick(p.name).toLowerCase().indexOf(q) !== -1 ||
      (p.series || "").toLowerCase().indexOf(q) !== -1;
    const activeCategory = categories.find(function(category) { return category.id === activeCat; });
    const matchCat = activeCat === "all" ||
      p.categoryId === activeCat ||
      (activeCategory?.children || []).includes(p.categoryId) ||
      categories.some(function(category) { return category.id === p.categoryId && category.parentId === activeCat; });
    return matchSearch && matchCat;
  });

  async function handleDelete(slug, label) {
    if (!confirm("محصول «" + label + "» حذف شود؟ این عمل قابل بازگشت نیست.")) return;
    setBusySlug(slug);
    try {
      const res = await fetch("/api/products/" + encodeURIComponent(slug), { method: "DELETE" });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.ok) {
        setNotice({ type: "error", text: data.error || "حذف محصول ناموفق بود." });
        return;
      }
      setProducts(function (current) {
        return current.filter(function (item) { return item.slug !== slug; });
      });
      setNotice({ type: "success", text: "محصول حذف شد." });
    } catch {
      setNotice({ type: "error", text: "خطای شبکه در حذف محصول." });
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div>
      <ContentStudioNav />

      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
            <Icon name="package" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">محصولات</div>
            <div className="page-header-sub">
              {products.length} محصول در {categories.length} دسته‌بندی
            </div>
          </div>
        </div>
        <Link href="/admin/products/new" className="btn-add">
          <Icon name="plus" /> افزودن محصول
        </Link>
      </div>

      {notice.text && (
        <div role="status" style={{
          marginBottom: 12, padding: "9px 13px", borderRadius: 10,
          background: notice.type === "error" ? "#FEF2F2" : "#ECFDF5",
          border: "1px solid " + (notice.type === "error" ? "#FECACA" : "#A7F3D0"),
          color: notice.type === "error" ? "#991B1B" : "#065F46",
          fontSize: 11.5, fontWeight: 800
        }}>
          {notice.text}
        </div>
      )}

      {/* Search + filter row */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10,
        marginBottom: 16,
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 12,
        padding: 12
      }} className="anim-in">
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            placeholder="جستجوی محصول یا کد سری..."
            className="form-input"
            style={{ paddingInlineStart: 38 }}
          />
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            insetInlineStart: 12, color: "#7A8290", pointerEvents: "none"
          }}>
            <Icon name="search" size={16} />
          </div>
        </div>

        <div className="tabs" style={{ margin: 0 }}>
          <button onClick={function() { setActiveCat("all"); }}
            className={"tab" + (activeCat === "all" ? " tab-active" : "")}>
            همه
            <span className="tab-badge">{products.length}</span>
          </button>
          {categories.map(function(c) {
            const count = products.filter(function(p) {
              return p.categoryId === c.id ||
                (c.children || []).includes(p.categoryId) ||
                categories.some(function(child) { return child.id === p.categoryId && child.parentId === c.id; });
            }).length;
            if (count === 0 && !c.children) return null;
            return (
              <button key={c.id} onClick={function() { setActiveCat(c.id); }}
                className={"tab" + (activeCat === c.id ? " tab-active" : "")}>
                {getCategoryLabel(c)}
                <span className="tab-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="search" size={30} /></div>
          <div className="empty-title">محصولی یافت نشد</div>
          <div className="empty-desc">عبارت جستجو یا فیلتر را تغییر دهید</div>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(function(p, i) {
            const colors = COLORS[(categories.findIndex(function(c) { return c.id === p.categoryId; })) % COLORS.length];
            return (
              <div key={p.slug} className="card-item anim-in" style={{ animationDelay: (i * 20) + "ms" }}>
                <div style={{
                  aspectRatio: "16/10", borderRadius: 10,
                  display: "grid", placeItems: "center",
                  background: p.image ? "#F1F3F6" : "linear-gradient(135deg, " + colors[0] + "15, " + colors[1] + "08)",
                  overflow: "hidden",
                  position: "relative"
                }}>
                  {p.image ? (
                    <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      display: "grid", placeItems: "center",
                      background: "linear-gradient(135deg, " + colors[0] + ", " + colors[1] + ")",
                      color: "#FFFFFF", fontSize: 18, fontWeight: 900
                    }}>
                      {initial(p.series)}
                    </div>
                  )}
                  <span className="chip chip-gray" style={{
                    position: "absolute", top: 8, insetInlineEnd: 8,
                    background: "#FFFFFF", border: "1px solid #D1D5DB",
                    color: colors[1]
                  }}>
                    {p.series}
                  </span>
                </div>

                <div className="card-item-title" style={{
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden"
                }}>
                  {pick(p.name)}
                </div>

                <div className="card-item-desc" style={{
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden"
                }}>
                  {pick(p.short)}
                </div>

                <div className="card-item-foot">
                  <EditBtn href={"/admin/products/" + p.slug} />
                  <ViewBtn href={"/fa/products/" + p.slug} />
                  <span style={{ opacity: busySlug === p.slug ? 0.4 : 1 }}>
                    <DeleteBtn
                      onClick={function () { handleDelete(p.slug, pick(p.name)); }}
                      title="حذف محصول"
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
