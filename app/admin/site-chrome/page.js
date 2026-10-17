import SiteChromeClient from "@/components/admin/SiteChromeClient";
import { getTranslations } from "@/lib/translations";
import { getSiteChrome } from "@/lib/site-chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminSiteChromePage() {
  return (
    <SiteChromeClient
      initialTranslations={getTranslations()}
      initialSettings={getSiteChrome()}
    />
  );
}
