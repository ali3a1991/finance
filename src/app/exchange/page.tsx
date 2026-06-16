import { TetherPricePanel } from "@/components/TetherPricePanel";
import { PageHeader } from "@/components/PageHeader";

export default function ExchangePage() {
  return (
    <div className="page-stack">
      <PageHeader page="exchange" />
      
      <TetherPricePanel />
    </div>
  );
}
