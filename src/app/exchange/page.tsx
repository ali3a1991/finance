import { PageHeader } from "@/components/PageHeader";
import { TetherPricePanel } from "@/components/TetherPricePanel";

export default function ExchangePage() {
  return (
    <div className="page-stack">
      <PageHeader page="exchange" />
      <TetherPricePanel />
    </div>
  );
}
