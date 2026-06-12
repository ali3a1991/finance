import { PageHeader } from "@/components/PageHeader";
import { SparenManager } from "@/components/SparenManager";

export default function SparenPage() {
  return (
    <div className="page-stack">
      <PageHeader page="savings" />

      <SparenManager />
    </div>
  );
}
