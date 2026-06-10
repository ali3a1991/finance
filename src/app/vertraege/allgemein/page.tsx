import { GeneralContractsIntro } from "@/components/GeneralContractsIntro";
import { PageHeader } from "@/components/PageHeader";

export default function AllgemeineVertraegePage() {
  return (
    <div className="page-stack">
      <PageHeader page="contractsGeneral" />

      <GeneralContractsIntro />
    </div>
  );
}
