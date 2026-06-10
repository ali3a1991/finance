import { PageHeader } from "@/components/PageHeader";
import { ThemeSettings } from "@/components/ThemeSettings";

export default function EinstellungenPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Einstellungen"
        title="Darstellung anpassen."
        description="Wechsle zwischen hellem und dunklem Modus fur eine angenehme, gut lesbare Ansicht."
      />
      <ThemeSettings />
    </div>
  );
}
