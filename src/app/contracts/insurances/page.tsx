import { PageHeader } from "@/components/PageHeader";
import { VersicherungManager } from "@/components/VersicherungManager";

export default function InsurancesPage() {
  return (
    <div className="page-stack">
      <PageHeader page="insurances" />

      <VersicherungManager />
    </div>
  );
}
