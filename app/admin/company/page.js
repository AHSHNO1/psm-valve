import { getCompanyInfo } from "@/lib/company-info";
import CompanyInfoClient from "@/components/admin/CompanyInfoClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminCompanyPage() {
  return <CompanyInfoClient initial={getCompanyInfo()} />;
}
