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
    <div className="admin-page-stack">
      <ContentStudioNav />

      <div className="metro-in product-edit-topbar">
        <Link href="/admin/products" className="product-edit-back">
          <ArrowRight size={14} /> بازگشت به لیست محصولات
        </Link>
        <Link href={"/fa/products/" + slug} target="_blank" className="admin-chip-link">
          <ExternalLink size={14} /> مشاهده در سایت
        </Link>
      </div>

      <div className="metro-in product-edit-hero">
        <div className="product-edit-hero-icon"
          style={{ background: "linear-gradient(135deg, #0078D4, #005A9E)" }}>
          <Pencil size={26} style={{ color: "#FFFFFF" }} />
        </div>
        <div>
          <h1>ویرایش محصول</h1>
          <p>{name}</p>
        </div>
      </div>

      <ProductWizard initial={product} categories={getCategories()} initialStep={2} />
    </div>
  );
}
