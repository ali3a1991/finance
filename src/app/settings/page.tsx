import { AccessSettings } from "@/components/AccessSettings";
import { LogoutSettings } from "@/components/LogoutSettings";
import { PageHeader } from "@/components/PageHeader";
import { ThemeSettings } from "@/components/ThemeSettings";

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader page="settings" />
      <ThemeSettings />
      <AccessSettings />
      <LogoutSettings />
    </div>
  );
}
