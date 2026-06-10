import { AusgabenManager } from "@/components/AusgabenManager";
import { PageHeader } from "@/components/PageHeader";

export default function AusgabenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="expenses" />

      <AusgabenManager />
    </div>
  );
}
