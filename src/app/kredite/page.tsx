import { KreditManager } from "@/components/KreditManager";
import { PageHeader } from "@/components/PageHeader";

export default function KreditePage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Kredite"
        title="Kreditverpflichtungen verwalten."
        description="Alle laufenden Kredite mit Betrag, Gesamtzinsen, Rate und erster Zahlung."
      />

      <KreditManager />
    </div>
  );
}
