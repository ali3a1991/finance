import { PageHeader } from "@/components/PageHeader";
import { ThemeSettings } from "@/components/ThemeSettings";

export default function EinstellungenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="settings" />
      <ThemeSettings />
    </div>
  );
}
