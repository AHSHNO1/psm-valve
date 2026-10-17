import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * مسیر قدیمی دیتاشیت برای سازگاری با لینک‌های قبلی.
 * دیتاشیت به مسیر مستقل /datasheet/[locale]/[slug] منتقل شده است
 * تا بدون نوار سایت و تم تاریک چاپ شود.
 */
export default function LegacyDatasheetPage({ params }) {
  redirect(`/${params.locale}/datasheet/${params.slug}`);
}
