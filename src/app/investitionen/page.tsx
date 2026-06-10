import { InvestmentsManager } from "@/components/InvestmentsManager";
import { PageHeader } from "@/components/PageHeader";

export default function InvestitionenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="investments" />

      <InvestmentsManager />
    </div>
  );
}
