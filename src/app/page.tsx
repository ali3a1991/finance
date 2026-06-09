import { HomeDashboard } from "@/components/HomeDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Startseite"
        title="Finanzen klar im Blick."
        description="Ein ruhiges Dashboard fur Kredite, Versicherungen, Ausgaben und monatliche Planung."
      />

      <HomeDashboard />
    </div>
  );
}
