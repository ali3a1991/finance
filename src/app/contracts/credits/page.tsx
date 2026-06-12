import { KreditManager } from "@/components/KreditManager";
import { PageHeader } from "@/components/PageHeader";

export default function CreditsPage() {
  return (
    <div className="page-stack">
      <PageHeader page="loans" />

      <KreditManager />
    </div>
  );
}
