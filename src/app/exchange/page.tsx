import { TetherPricePanel } from "@/components/TetherPricePanel";
import { PageHeader } from "@/components/PageHeader";

export default function ExchangePage() {
  return (
    <div className="exchange-page">
      <PageHeader page="exchange" />
      
      <TetherPricePanel />
    </div>
  );
}
