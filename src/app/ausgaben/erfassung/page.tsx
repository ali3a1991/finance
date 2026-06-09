import { Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function ErfassungPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ausgaben / Erfassung"
        title="Neue Ausgabe eintragen."
        description="Ein klares Formular fur schnelle Testbuchungen im Finanzmanager."
      />

      <form className="form-panel">
        <label>
          <span>Titel</span>
          <input name="title" placeholder="z. B. Lebensmittel" />
        </label>
        <label>
          <span>Kategorie</span>
          <select name="category" defaultValue="Haushalt">
            <option>Haushalt</option>
            <option>Wohnen</option>
            <option>Mobilitat</option>
            <option>Versicherungen</option>
            <option>Freizeit</option>
          </select>
        </label>
        <label>
          <span>Betrag</span>
          <input name="amount" type="number" min="0" step="0.01" placeholder="0,00" />
        </label>
        <label>
          <span>Datum</span>
          <input name="date" type="date" defaultValue="2026-06-09" />
        </label>
        <label className="checkbox-row">
          <input name="recurring" type="checkbox" />
          <span>Wiederkehrende Ausgabe</span>
        </label>
        <button className="button primary" type="button">
          <Save size={18} aria-hidden="true" />
          Speichern
        </button>
      </form>
    </div>
  );
}
