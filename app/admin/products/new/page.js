import ProductWizard from "@/components/admin/ProductWizard";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="metro-in">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "#B8850A" }}>
          <ArrowRight size={14} /> بازگشت به لیست محصولات
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl grid place-items-center"
            style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)" }}>
            <Sparkles size={28} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-5xl font-black mb-1" style={{ color: "var(--m-text)" }}>
              محصول جدید
            </h1>
            <p className="text-sm" style={{ color: "var(--m-text-soft)" }}>
              ۵ مرحله ساده برای افزودن محصول در ۴ زبان
            </p>
          </div>
        </div>
      </div>
      <ProductWizard isNew />
    </div>
  );
}
