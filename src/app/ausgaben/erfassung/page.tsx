import { AusgabeForm } from "@/components/AusgabeForm";
import { PageHeader } from "@/components/PageHeader";

export default function ErfassungPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ausgaben / Erfassung"
        title="Neue Ausgabe eintragen."
        description="Ein klares Formular fur schnelle Testbuchungen im Finanzmanager."
      />

      <AusgabeForm />
    </div>
  );
}
