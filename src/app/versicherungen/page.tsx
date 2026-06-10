import { PageHeader } from "@/components/PageHeader";
import { VersicherungManager } from "@/components/VersicherungManager";

export default function VersicherungenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="insurances" />

      <VersicherungManager />
    </div>
  );
}
