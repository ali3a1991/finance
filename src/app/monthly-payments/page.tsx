import { HomeDashboard } from "@/components/HomeDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function MonthlyPaymentsPage() {
  return (
    <div className="page-stack">
      <PageHeader page="monthlyPayments" />

      <HomeDashboard view="monthlyPayments" />
    </div>
  );
}
