import { PageHeader } from "@/components/PageHeader";
import { VersicherungManager } from "@/components/VersicherungManager";

export default function VersicherungenPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Versicherungen"
        title="Policen, Kosten und Laufzeiten."
        description="Eine kompakte Ubersicht uber Pramien, Anbieter und Verlangerungen."
      />

      <VersicherungManager />
    </div>
  );
}
