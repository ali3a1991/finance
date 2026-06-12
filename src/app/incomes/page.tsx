import { EinkommenManager } from "@/components/EinkommenManager";
import { PageHeader } from "@/components/PageHeader";

export default function IncomesPage() {
  return (
    <div className="page-stack">
      <PageHeader page="incomes" />

      <EinkommenManager />
    </div>
  );
}
