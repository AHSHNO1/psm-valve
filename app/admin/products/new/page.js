import ProductWizard from "@/components/admin/ProductWizard";
import ContentStudioNav from "@/components/admin/ContentStudioNav";
import { getCategories } from "@/lib/category-store";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="admin-page-stack">
      <ContentStudioNav />

      <div className="metro-in">
        <Link href="/admin/products" className="product-edit-back" style={{ marginBottom: 12 }}>
          <ArrowRight size={14} /> بازگشت به لیست محصولات
        </Link>
        <div className="product-edit-hero">
          <div className="product-edit-hero-icon"
            style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
            <Sparkles size={28} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <h1>محصول جدید</h1>
            <p>۵ مرحله ساده برای افزودن محصول در ۴ زبان</p>
          </div>
        </div>
      </div>
      <ProductWizard isNew categories={getCategories()} />
    </div>
  );
}
