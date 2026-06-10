"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Pencil, PlusCircle, Repeat, ReceiptText, Save, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { Expense } from "@/lib/types";

type ExpenseForm = {
  title: string;
  category: string;
  amount: string;
  date: string;
  recurring: boolean;
};

const categories = ["Haushalt", "Wohnen", "Mobilitat", "Versicherungen", "Freizeit"];

const emptyForm: ExpenseForm = {
  title: "",
  category: categories[0],
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  recurring: false
};

function toPayload(form: ExpenseForm): Omit<Expense, "id"> {
  return {
    amount: Number(form.amount),
    category: form.category,
    date: form.date,
    recurring: form.recurring,
    title: form.title.trim()
  };
}

export function AusgabenManager({ initialType }: { initialType: "einmalig" | "wiederkehrend" }) {
  const [editForm, setEditForm] = useState<ExpenseForm>(emptyForm);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLabel, setOperationLabel] = useState("");
  const activeType = initialType;

  useEffect(() => {
    async function loadExpenses() {
      const body = await requestJson<{ expenses: Expense[] }>("/api/expenses");
      setExpenses(body.expenses);
      setIsLoading(false);
    }

    loadExpenses().catch(() => setIsLoading(false));
  }, []);

  function updateEditForm(field: keyof ExpenseForm, value: string | boolean) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function openEditModal(expense: Expense) {
    setEditingExpenseId(expense.id);
    setEditForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      recurring: expense.recurring,
      title: expense.title
    });
  }

  function closeEditModal() {
    setEditingExpenseId(null);
    setEditForm(emptyForm);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-expense");

    try {
      const body = await requestJson<{ expense: Expense }>(`/api/expenses/${editingExpenseId}`, {
        body: JSON.stringify(toPayload(editForm)),
        method: "PUT"
      });

      setExpenses((current) => current.map((expense) => (expense.id === editingExpenseId ? body.expense : expense)));
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteExpense() {
    if (!expenseToDelete) {
      return;
    }

    setOperationLabel("delete-expense");

    try {
      await requestJson(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE"
      });
      setExpenses((current) => current.filter((expense) => expense.id !== expenseToDelete.id));
      setExpenseToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  const visibleExpenses = expenses.filter((expense) =>
    activeType === "wiederkehrend" ? expense.recurring : !expense.recurring
  );

  return (
    <>
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

      {isLoading ? <p className="muted-text">Ausgaben werden geladen...</p> : null}

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
                <th>Aktionen</th>
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
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => openEditModal(expense)}
                        aria-label={`${expense.title} bearbeiten`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        aria-label={`${expense.title} loschen`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && visibleExpenses.length === 0 ? (
          <p className="empty-table-text">Keine Ausgaben in dieser Kategorie vorhanden.</p>
        ) : null}
      </section>

      {editingExpenseId ? (
        <ExpenseModal
          form={editForm}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          isSubmitting={operationLabel === "edit-expense"}
        />
      ) : null}

      {expenseToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="expense-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>Ausgabe loschen</span>
              <h2 id="expense-delete-modal-title">Ausgabe wirklich loschen?</h2>
              <p>
                <strong>{expenseToDelete.title}</strong> wird aus der aktuellen Tabelle entfernt.
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setExpenseToDelete(null)}>
                Abbrechen
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteExpense}
                disabled={operationLabel === "delete-expense"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-expense" ? "Loschen..." : "Loschen"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ExpenseModal({
  form,
  onClose,
  onSubmit,
  onUpdate,
  isSubmitting
}: {
  form: ExpenseForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof ExpenseForm, value: string | boolean) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div className="modal-header">
          <div>
            <span>Ausgaben</span>
            <h2 id="expense-modal-title">Ausgabe bearbeiten</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schliessen">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>Titel</span>
            <input
              required
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
              placeholder="z. B. Lebensmittel"
            />
          </label>
          <label>
            <span>Kategorie</span>
            <select required value={form.category} onChange={(event) => onUpdate("category", event.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Betrag</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => onUpdate("amount", event.target.value)}
              placeholder="0,00"
            />
          </label>
          <label>
            <span>Datum</span>
            <input required type="date" value={form.date} onChange={(event) => onUpdate("date", event.target.value)} />
          </label>
          <label className="checkbox-row">
            <input
              checked={form.recurring}
              type="checkbox"
              onChange={(event) => onUpdate("recurring", event.target.checked)}
            />
            <span>Wiederkehrende Ausgabe</span>
          </label>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              Abbrechen
            </button>
            <button className="button primary" type="submit" disabled={isSubmitting}>
              <Save size={18} aria-hidden="true" />
              {isSubmitting ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
