import { MonthlyPayments } from "@/components/MonthlyPayments";
import { PageHeader } from "@/components/PageHeader";

export default function MonthlyPaymentsPage() {
  return (
    <div className="page-stack">
      <PageHeader page="monthlyPayments" />

      <MonthlyPayments />
    </div>
  );
}
