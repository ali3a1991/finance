import { AusgabenManager } from "@/components/AusgabenManager";
import { PageHeader } from "@/components/PageHeader";

type AusgabenPageProps = {
  searchParams: Promise<{
    typ?: string;
  }>;
};

export default async function AusgabenPage({ searchParams }: AusgabenPageProps) {
  const params = await searchParams;
  const activeType = params.typ === "wiederkehrend" ? "wiederkehrend" : "einmalig";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ausgaben"
        title="Ausgaben erfassen und auswerten."
        description="Ausgaben werden nach einmaligen und wiederkehrenden Buchungen getrennt."
      />

      <AusgabenManager initialType={activeType} />
    </div>
  );
}
