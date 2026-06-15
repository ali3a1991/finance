import { PageHeader } from "@/components/PageHeader";
import { TetherPricePanel } from "@/components/TetherPricePanel";

export default function TetherPage() {
  return (
    <div className="page-stack">
      <PageHeader page="tether" />
      <TetherPricePanel />
    </div>
  );
}
