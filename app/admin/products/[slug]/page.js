import { getProduct } from "@/lib/product-store";
import { getCategories } from "@/lib/category-store";
import { notFound } from "next/navigation";
import ProductWizard from "@/components/admin/ProductWizard";
import ContentStudioNav from "@/components/admin/ContentStudioNav";
import Link from "next/link";
import { ArrowRight, ExternalLink, Pencil } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function EditProductPage({ params }) {
  const { slug } = params;
  const product = getProduct(slug);
  if (!product) notFound();

  const name = product.name && (product.name.fa || product.name.en) || slug;

  return (
    <div className="space-y-6">
      <ContentStudioNav />

      <div className="metro-in flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm hover:underline"
          style={{ color: "#B8850A" }}>
          <ArrowRight size={14} /> بازگشت به لیست محصولات
        </Link>
        <Link href={"/fa/products/" + slug} target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black"
          style={{ background: "rgba(0, 120, 212, 0.1)", color: "#0078D4" }}>
          <ExternalLink size={14} /> مشاهده در سایت
        </Link>
      </div>

      <div className="metro-in flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl grid place-items-center"
          style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
          <Pencil size={26} style={{ color: "#FFFFFF" }} />
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-black mb-1" style={{ color: "var(--m-text)" }}>
            ویرایش محصول
          </h1>
          <p className="text-sm" style={{ color: "var(--m-text-soft)" }}>{name}</p>
        </div>
      </div>

      <ProductWizard initial={product} categories={getCategories()} initialStep={2} />
    </div>
  );
}
