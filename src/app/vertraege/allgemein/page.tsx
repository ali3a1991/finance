import { GeneralContractsManager } from "@/components/GeneralContractsManager";
import { PageHeader } from "@/components/PageHeader";

export default function AllgemeineVertraegePage() {
  return (
    <div className="page-stack">
      <PageHeader page="contractsGeneral" />

      <GeneralContractsManager />
    </div>
  );
}
