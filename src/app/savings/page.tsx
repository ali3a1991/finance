import { PageHeader } from "@/components/PageHeader";
import { SparenManager } from "@/components/SparenManager";

export default function SavingsPage() {
  return (
    <div className="page-stack">
      <PageHeader page="savings" />

      <SparenManager />
    </div>
  );
}
