import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const runtime = "nodejs";

export const metadata = {
  title: "پنل مدیریت | پترو سازه میهن",
  robots: { index: false, follow: false }
};

export default async function AdminLoginPage({ searchParams }) {
  const { reset } = await searchParams;
  return <AdminLoginForm resetToken={typeof reset === "string" ? reset : ""} />;
}
