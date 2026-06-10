import { AusgabeForm } from "@/components/AusgabeForm";
import { PageHeader } from "@/components/PageHeader";

export default function ErfassungPage() {
  return (
    <div className="page-stack">
      <PageHeader page="expenseCapture" />

      <AusgabeForm />
    </div>
  );
}
