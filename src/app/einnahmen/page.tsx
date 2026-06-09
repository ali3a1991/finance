import { PageHeader } from "@/components/PageHeader";
import { EinkommenManager } from "@/components/EinkommenManager";

export default function EinnahmenPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Einnahmen"
        title="Geldzuflusse verwalten."
        description="Feste Einkommen und einmalige Eingange werden getrennt erfasst."
      />

      <EinkommenManager />
    </div>
  );
}
