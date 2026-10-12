import { getSettings } from "@/lib/db";
import SettingsClient from "@/components/admin/SettingsClient";

export default function AdminSettingsPage() {
  const settings = getSettings();
  return <SettingsClient initial={settings} />;
}
