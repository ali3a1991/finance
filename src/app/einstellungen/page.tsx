import { PageHeader } from "@/components/PageHeader";
import { AccessSettings } from "@/components/AccessSettings";
import { ThemeSettings } from "@/components/ThemeSettings";

export default function EinstellungenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="settings" />
      <ThemeSettings />
      <AccessSettings />
    </div>
  );
}
