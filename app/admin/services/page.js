import { getServices } from "@/lib/content";
import ServicesClient from "@/components/admin/ServicesClient";

export default function AdminServicesPage() {
  const items = getServices();
  return <ServicesClient initial={items} />;
}
