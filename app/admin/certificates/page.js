import { getCertificates } from "@/lib/content";
import CertificatesClient from "@/components/admin/CertificatesClient";

export default function AdminCertificatesPage() {
  const items = getCertificates();
  return <CertificatesClient initial={items} />;
}
