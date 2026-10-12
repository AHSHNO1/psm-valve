import { getBranding } from "@/lib/content";
import BrandingClient from "@/components/admin/BrandingClient";

export default function AdminBrandingPage() {
  const branding = getBranding();
  return <BrandingClient initial={branding} />;
}
