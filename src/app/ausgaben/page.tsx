import Link from "next/link";
import { PlusCircle, Repeat, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatDate, getFinanceDb } from "@/lib/database";

type AusgabenPageProps = {
  searchParams: Promise<{
    typ?: string;
  }>;
};

export default async function AusgabenPage({ searchParams }: AusgabenPageProps) {
  const params = await searchParams;
  const { expenses } = getFinanceDb();
  const activeType = params.typ === "wiederkehrend" ? "wiederkehrend" : "einmalig";
  const visibleExpenses = expenses.filter((expense) =>
    activeType === "wiederkehrend" ? expense.recurring : !expense.recurring
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ausgaben"
        title="Ausgaben erfassen und auswerten."
        description="Ausgaben werden nach einmaligen und wiederkehrenden Buchungen getrennt."
      />

      <div className="action-row">
        <Link className="button primary" href="/ausgaben/erfassung">
          <PlusCircle size={18} aria-hidden="true" />
          Neue Ausgabe
        </Link>
      </div>

      <nav className="tab-row" aria-label="Ausgabenarten">
        <Link className={`tab-link ${activeType === "einmalig" ? "active" : ""}`} href="/ausgaben?typ=einmalig">
          <ReceiptText size={18} aria-hidden="true" />
          Einmalige Ausgaben
        </Link>
        <Link
          className={`tab-link ${activeType === "wiederkehrend" ? "active" : ""}`}
          href="/ausgaben?typ=wiederkehrend"
        >
          <Repeat size={18} aria-hidden="true" />
          Wiederkehrende Ausgaben
        </Link>
      </nav>

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Kategorie</th>
                <th>Datum</th>
                <th>Betrag</th>
                <th>Typ</th>
              </tr>
            </thead>
            <tbody>
              {visibleExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.title}</td>
                  <td>{expense.category}</td>
                  <td>{formatDate(expense.date)}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.recurring ? "Wiederkehrend" : "Einmalig"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleExpenses.length === 0 ? (
          <p className="empty-table-text">Keine Ausgaben in dieser Kategorie vorhanden.</p>
        ) : null}
      </section>
    </div>
  );
}
