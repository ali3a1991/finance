"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { Expense } from "@/lib/types";

type ExpenseForm = {
  title: string;
  category: string;
  amount: string;
  date: string;
  note: string;
};

const categories = ["Haushalt", "Wohnen", "Freizeit", "Kraftstoff", "Urlaub", "Kreditkarte", "Sparen", "Broker"];

const emptyForm: ExpenseForm = {
  title: "",
  category: categories[0],
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: ""
};

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return getMonthKey(date);
}

function getMonthKeyFromDateInput(value: string) {
  return value.slice(0, 7);
}

function formatMonthLabel(monthKey: string, language: "de" | "en") {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function toPayload(form: ExpenseForm): Omit<Expense, "id"> {
  return {
    amount: Number(form.amount),
    category: form.category,
    date: form.date,
    note: form.note.trim() || null,
    recurring: false,
    title: form.title.trim()
  };
}

function isSavingsGeneratedExpense(expense: Expense) {
  return expense.id.startsWith("exp-saving-");
}

export function AusgabenManager() {
  const { canWrite } = useAuth();
  const { language, t } = useLanguage();
  const [editForm, setEditForm] = useState<ExpenseForm>(emptyForm);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLabel, setOperationLabel] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());

  useEffect(() => {
    async function loadExpenses() {
      const body = await requestJson<{ expenses: Expense[] }>("/api/expenses");
      setExpenses(body.expenses);
      setIsLoading(false);
    }

    loadExpenses().catch(() => setIsLoading(false));
  }, []);

  function updateEditForm(field: keyof ExpenseForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function updateForm(field: keyof ExpenseForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeAddModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-expense");

    try {
      const body = await requestJson<{ expense: Expense }>("/api/expenses", {
        body: JSON.stringify(toPayload(form)),
        method: "POST"
      });

      setExpenses((current) => [body.expense, ...current]);
      setSelectedMonth(getMonthKeyFromDateInput(body.expense.date));
      closeAddModal();
    } finally {
      setOperationLabel("");
    }
  }

  function openEditModal(expense: Expense) {
    setEditingExpenseId(expense.id);
    setEditForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      note: expense.note ?? "",
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
      setSelectedMonth(getMonthKeyFromDateInput(body.expense.date));
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

  const visibleExpenses = expenses.filter((expense) => getMonthKeyFromDateInput(expense.date) === selectedMonth);
  const visibleExpenseTotal = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const isCurrentMonth = selectedMonth === getMonthKey();

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("expenses.add")}
          </button>
        </div>
      ) : null}

      <section className="month-switcher" aria-label={t("dashboard.monthPicker")}>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, -1))}
          aria-label={t("dashboard.previousMonth")}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="month-switcher-current">
          <CalendarDays size={20} aria-hidden="true" />
          <div>
            <span>{isCurrentMonth ? t("dashboard.currentMonth") : t("dashboard.selectedMonth")}</span>
            <strong>{formatMonthLabel(selectedMonth, language)}</strong>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
          aria-label={t("dashboard.nextMonth")}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        {!isCurrentMonth ? (
          <button className="button secondary month-today-button" type="button" onClick={() => setSelectedMonth(getMonthKey())}>
            {t("dashboard.today")}
          </button>
        ) : null}
      </section>

      {isLoading ? <p className="muted-text">{t("expenses.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("expenses.title")}</th>
                <th>{t("expenses.date")}</th>
                <th>{t("expenses.amount")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.title}</td>
                  <td>{formatDate(expense.date)}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  {canWrite ? (
                    <td>
                      {isSavingsGeneratedExpense(expense) ? (
                        <span className="table-note">{t("savings.manageOnlyInSavings")}</span>
                      ) : (
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => openEditModal(expense)}
                            aria-label={`${expense.title} ${t("common.edit")}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => setExpenseToDelete(expense)}
                            aria-label={`${expense.title} ${t("common.delete")}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && visibleExpenses.length === 0 ? (
          <p className="empty-table-text">{t("expenses.empty")}</p>
        ) : null}
        <div className="table-total-row">
          <span>{t("common.total")}</span>
          <strong>{formatCurrency(visibleExpenseTotal)}</strong>
        </div>
      </section>

      {isOpen ? (
        <ExpenseModal
          form={form}
          onClose={closeAddModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          isSubmitting={operationLabel === "save-expense"}
          title={t("expenses.addTitle")}
        />
      ) : null}

      {editingExpenseId ? (
        <ExpenseModal
          form={editForm}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          isSubmitting={operationLabel === "edit-expense"}
          title={t("expenses.editTitle")}
        />
      ) : null}

      {expenseToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="expense-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("expenses.deleteLabel")}</span>
              <h2 id="expense-delete-modal-title">{t("expenses.deleteTitle")}</h2>
              <p>
                <strong>{expenseToDelete.title}</strong> {t("loans.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setExpenseToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteExpense}
                disabled={operationLabel === "delete-expense"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-expense" ? t("common.deleting") : t("common.delete")}
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
  isSubmitting,
  title
}: {
  form: ExpenseForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof ExpenseForm, value: string) => void;
  isSubmitting: boolean;
  title: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div className="modal-header">
          <div>
            <span>{t("nav.expenses")}</span>
            <h2 id="expense-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("expenses.title")}</span>
            <input
              required
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
              placeholder="z. B. Lebensmittel"
            />
          </label>
          <label>
            <span>{t("expenses.category")}</span>
            <select required value={form.category} onChange={(event) => onUpdate("category", event.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("expenses.amount")}</span>
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
            <span>{t("expenses.date")}</span>
            <input required type="date" value={form.date} onChange={(event) => onUpdate("date", event.target.value)} />
          </label>
          <label className="form-field-full">
            <span>{t("common.description")}</span>
            <textarea
              value={form.note}
              onChange={(event) => onUpdate("note", event.target.value)}
              placeholder={t("common.descriptionPlaceholder")}
            />
          </label>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button className="button primary" type="submit" disabled={isSubmitting}>
              <Save size={18} aria-hidden="true" />
              {isSubmitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
