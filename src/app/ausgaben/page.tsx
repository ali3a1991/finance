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
      <PageHeader page="expenses" />

      <AusgabenManager initialType={activeType} />
    </div>
  );
}
