import { PageHeader } from "@/components/PageHeader";
import { EinkommenManager } from "@/components/EinkommenManager";

export default function EinnahmenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="incomes" />

      <EinkommenManager />
    </div>
  );
}
