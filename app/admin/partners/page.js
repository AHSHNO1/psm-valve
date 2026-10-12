import { getPartners } from "@/lib/content";
import PartnersClient from "@/components/admin/PartnersClient";

export default function AdminPartnersPage() {
  const items = getPartners();
  return <PartnersClient initial={items} />;
}
