"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, List, Pencil, PiggyBank, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { SavingsGoal, SavingsTransaction } from "@/lib/types";

type SavingsForm = {
  name: string;
  currentAmount: string;
  note: string;
};

type TransactionForm = {
  amount: string;
  date: string;
  note: string;
};

type TransactionMode = "deposit" | "withdrawal";

const emptyForm: SavingsForm = {
  currentAmount: "",
  name: "",
  note: ""
};

const emptyTransactionForm: TransactionForm = {
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: ""
};

function toPayload(form: SavingsForm): Omit<SavingsGoal, "id"> {
  const currentAmount = Number(form.currentAmount);

  return {
    currentAmount,
    monthlyContribution: 0,
    name: form.name.trim(),
    note: form.note.trim() || null,
    targetAmount: getNextSavingsMilestone(currentAmount),
    targetDate: null
  };
}

function getProgress(goal: SavingsGoal) {
  return Math.min(Math.max(goal.currentAmount / getNextSavingsMilestone(goal.currentAmount), 0), 1);
}

function getNextSavingsMilestone(amount: number) {
  if (amount < 500) {
    return 500;
  }

  if (amount < 1000) {
    return 1000;
  }

  if (amount < 5000) {
    return 5000;
  }

  if (amount < 10000) {
    return 10000;
  }

  return Math.ceil((amount + 1) / 10000) * 10000;
}

function formFromGoal(goal: SavingsGoal): SavingsForm {
  return {
    currentAmount: String(goal.currentAmount),
    name: goal.name,
    note: goal.note ?? ""
  };
}

export function SparenManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [detailGoal, setDetailGoal] = useState<SavingsGoal | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<SavingsTransaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<SavingsForm>(emptyForm);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<SavingsTransaction | null>(null);
  const [transactionGoal, setTransactionGoal] = useState<SavingsGoal | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(emptyTransactionForm);
  const [transactionMode, setTransactionMode] = useState<TransactionMode>("deposit");
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");

  useEffect(() => {
    async function loadGoals() {
      const body = await requestJson<{ savingsGoals: SavingsGoal[] }>("/api/savings");
      setGoals(body.savingsGoals);
      setIsLoading(false);
    }

    loadGoals().catch(() => setIsLoading(false));
  }, []);

  function updateForm(field: keyof SavingsForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openAddModal() {
    setEditingGoal(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEditModal(goal: SavingsGoal) {
    setEditingGoal(goal);
    setForm(formFromGoal(goal));
    setIsOpen(true);
  }

  function closeModal() {
    setEditingGoal(null);
    setForm(emptyForm);
    setIsOpen(false);
  }

  function openTransactionModal(goal: SavingsGoal, mode: TransactionMode) {
    setEditingTransaction(null);
    setTransactionGoal(goal);
    setTransactionMode(mode);
    setTransactionForm(emptyTransactionForm);
  }

  function closeTransactionModal() {
    setEditingTransaction(null);
    setTransactionGoal(null);
    setTransactionForm(emptyTransactionForm);
  }

  async function openDetailsModal(goal: SavingsGoal) {
    setDetailGoal(goal);
    setIsDetailLoading(true);

    try {
      const body = await requestJson<{ transactions: SavingsTransaction[] }>(`/api/savings/${goal.id}/transactions`);
      setTransactions(body.transactions);
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetailsModal() {
    setDetailGoal(null);
    setTransactions([]);
    setTransactionToDelete(null);
  }

  function openEditTransaction(transaction: SavingsTransaction) {
    if (!detailGoal) {
      return;
    }

    setEditingTransaction(transaction);
    setTransactionGoal(detailGoal);
    setTransactionMode(transaction.type);
    setTransactionForm({
      amount: String(transaction.amount),
      date: transaction.date,
      note: transaction.note ?? ""
    });
  }

  function updateTransactionForm(field: keyof TransactionForm, value: string) {
    setTransactionForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-saving");

    try {
      const payload = toPayload(form);
      if (editingGoal) {
        const body = await requestJson<{ savingsGoal: SavingsGoal }>(`/api/savings/${editingGoal.id}`, {
          body: JSON.stringify(payload),
          method: "PUT"
        });
        setGoals((current) => current.map((goal) => (goal.id === editingGoal.id ? body.savingsGoal : goal)));
      } else {
        const body = await requestJson<{ savingsGoal: SavingsGoal }>("/api/savings", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        setGoals((current) => [body.savingsGoal, ...current]);
      }

      closeModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteGoal() {
    if (!goalToDelete) {
      return;
    }

    setOperationLabel("delete-saving");

    try {
      await requestJson(`/api/savings/${goalToDelete.id}`, {
        method: "DELETE"
      });
      setGoals((current) => current.filter((goal) => goal.id !== goalToDelete.id));
      setGoalToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!transactionGoal) {
      return;
    }

    setOperationLabel("save-saving-transaction");

    try {
      const body = await requestJson<{ savingsGoal: SavingsGoal }>(`/api/savings/${transactionGoal.id}/transactions`, {
        body: JSON.stringify({
          amount: Number(transactionForm.amount),
          date: transactionForm.date,
          note: transactionForm.note.trim() || null,
          type: transactionMode
        }),
        method: "POST"
      });

      setGoals((current) => current.map((goal) => (goal.id === transactionGoal.id ? body.savingsGoal : goal)));
      closeTransactionModal();
      if (detailGoal?.id === transactionGoal.id) {
        await openDetailsModal(body.savingsGoal);
      }
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!transactionGoal || !editingTransaction) {
      return;
    }

    setOperationLabel("edit-saving-transaction");

    try {
      const body = await requestJson<{ savingsGoal: SavingsGoal; transaction: SavingsTransaction }>(
        `/api/savings/${transactionGoal.id}/transactions/${editingTransaction.id}`,
        {
          body: JSON.stringify({
            amount: Number(transactionForm.amount),
            date: transactionForm.date,
            note: transactionForm.note.trim() || null
          }),
          method: "PUT"
        }
      );

      setGoals((current) => current.map((goal) => (goal.id === transactionGoal.id ? body.savingsGoal : goal)));
      setDetailGoal(body.savingsGoal);
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === editingTransaction.id ? body.transaction : transaction))
      );
      closeTransactionModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteTransaction() {
    if (!detailGoal || !transactionToDelete) {
      return;
    }

    setOperationLabel("delete-saving-transaction");

    try {
      const body = await requestJson<{ savingsGoal: SavingsGoal }>(
        `/api/savings/${detailGoal.id}/transactions/${transactionToDelete.id}`,
        { method: "DELETE" }
      );
      setGoals((current) => current.map((goal) => (goal.id === detailGoal.id ? body.savingsGoal : goal)));
      setDetailGoal(body.savingsGoal);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionToDelete.id));
      setTransactionToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  const savedTotal = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={openAddModal}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("savings.add")}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted-text">{t("savings.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("savings.goal")}</th>
                <th>{t("savings.progress")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const progress = getProgress(goal);
                const nextMilestone = getNextSavingsMilestone(goal.currentAmount);
                return (
                  <tr key={goal.id}>
                    <td>
                      <span className="table-title">
                        <PiggyBank size={16} aria-hidden="true" />
                        {goal.name}
                      </span>
                    </td>
                    <td>
                      <div className="savings-progress">
                        <div className="savings-progress-line">
                          <span style={{ width: `${progress * 100}%` }} />
                        </div>
                        <small>
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(nextMilestone)}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        {canWrite ? (
                          <>
                            <button
                              className="button secondary compact-action"
                              type="button"
                              onClick={() => openTransactionModal(goal, "deposit")}
                              aria-label={`${goal.name} ${t("savings.deposit")}`}
                            >
                              <ArrowDownToLine size={16} aria-hidden="true" />
                              {t("savings.deposit")}
                            </button>
                            <button
                              className="button secondary compact-action"
                              type="button"
                              onClick={() => openTransactionModal(goal, "withdrawal")}
                              aria-label={`${goal.name} ${t("savings.withdraw")}`}
                            >
                              <ArrowUpFromLine size={16} aria-hidden="true" />
                              {t("savings.withdraw")}
                            </button>
                          </>
                        ) : null}
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openDetailsModal(goal)}
                          aria-label={`${goal.name} ${t("savings.details")}`}
                        >
                          <List size={16} aria-hidden="true" />
                        </button>
                        {canWrite ? (
                          <>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => openEditModal(goal)}
                            aria-label={`${goal.name} ${t("common.edit")}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => setGoalToDelete(goal)}
                            aria-label={`${goal.name} ${t("common.delete")}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && goals.length === 0 ? <p className="empty-table-text">{t("savings.empty")}</p> : null}
        <div className="table-total-row">
          <span>{t("savings.savedTotal")}</span>
          <strong>{formatCurrency(savedTotal)}</strong>
        </div>
      </section>

      {isOpen ? (
        <SavingsModal
          form={form}
          isEditing={Boolean(editingGoal)}
          isSubmitting={operationLabel === "save-saving"}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
        />
      ) : null}

      {transactionGoal ? (
        <SavingsTransactionModal
          editingTransaction={editingTransaction}
          form={transactionForm}
          goal={transactionGoal}
          isSubmitting={operationLabel === "save-saving-transaction" || operationLabel === "edit-saving-transaction"}
          mode={transactionMode}
          onClose={closeTransactionModal}
          onSubmit={editingTransaction ? handleEditTransactionSubmit : handleTransactionSubmit}
          onUpdate={updateTransactionForm}
        />
      ) : null}

      {detailGoal ? (
        <SavingsDetailsModal
          canWrite={canWrite}
          goal={detailGoal}
          isLoading={isDetailLoading}
          onClose={closeDetailsModal}
          onDelete={setTransactionToDelete}
          onEdit={openEditTransaction}
          transactions={transactions}
        />
      ) : null}

      {goalToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="saving-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("savings.deleteLabel")}</span>
              <h2 id="saving-delete-modal-title">{t("savings.deleteTitle")}</h2>
              <p>
                <strong>{goalToDelete.name}</strong> {t("savings.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setGoalToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteGoal}
                disabled={operationLabel === "delete-saving"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-saving" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {transactionToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="saving-transaction-delete-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("savings.transactionDeleteLabel")}</span>
              <h2 id="saving-transaction-delete-title">{t("savings.transactionDeleteTitle")}</h2>
              <p>
                <strong>{formatCurrency(transactionToDelete.amount)}</strong> {t("savings.transactionDeleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setTransactionToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteTransaction}
                disabled={operationLabel === "delete-saving-transaction"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-saving-transaction" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SavingsModal({
  form,
  isEditing,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdate
}: {
  form: SavingsForm;
  isEditing: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof SavingsForm, value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="saving-modal-title">
        <div className="modal-header">
          <div>
            <span>{t("savings.saving")}</span>
            <h2 id="saving-modal-title">{isEditing ? t("savings.editTitle") : t("savings.addTitle")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("savings.goal")}</span>
            <input
              required
              value={form.name}
              onChange={(event) => onUpdate("name", event.target.value)}
              placeholder="z. B. Notgroschen"
            />
          </label>
          <label>
            <span>{t("savings.currentAmount")}</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.currentAmount}
              onChange={(event) => onUpdate("currentAmount", event.target.value)}
              placeholder="2500"
            />
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

function SavingsTransactionModal({
  editingTransaction,
  form,
  goal,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
  onUpdate
}: {
  editingTransaction: SavingsTransaction | null;
  form: TransactionForm;
  goal: SavingsGoal;
  isSubmitting: boolean;
  mode: TransactionMode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof TransactionForm, value: string) => void;
}) {
  const { t } = useLanguage();
  const isDeposit = mode === "deposit";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="saving-transaction-modal-title">
        <div className="modal-header">
          <div>
            <span>{goal.name}</span>
            <h2 id="saving-transaction-modal-title">
              {editingTransaction
                ? t("savings.editTransactionTitle")
                : isDeposit
                  ? t("savings.depositTitle")
                  : t("savings.withdrawTitle")}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("savings.transactionAmount")}</span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => onUpdate("amount", event.target.value)}
              placeholder="100"
            />
          </label>
          <label>
            <span>{t("savings.transactionDate")}</span>
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
          <p className="form-hint">
            {isDeposit ? t("savings.depositHint") : t("savings.withdrawHint")}
          </p>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button className="button primary" type="submit" disabled={isSubmitting}>
              {isDeposit ? <ArrowDownToLine size={18} aria-hidden="true" /> : <ArrowUpFromLine size={18} aria-hidden="true" />}
              {isSubmitting ? t("common.saving") : isDeposit ? t("savings.deposit") : t("savings.withdraw")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SavingsDetailsModal({
  canWrite,
  goal,
  isLoading,
  onClose,
  onDelete,
  onEdit,
  transactions
}: {
  canWrite: boolean;
  goal: SavingsGoal;
  isLoading: boolean;
  onClose: () => void;
  onDelete: (transaction: SavingsTransaction) => void;
  onEdit: (transaction: SavingsTransaction) => void;
  transactions: SavingsTransaction[];
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel detail-panel" role="dialog" aria-modal="true" aria-labelledby="saving-details-title">
        <div className="modal-header">
          <div>
            <span>{goal.name}</span>
            <h2 id="saving-details-title">{t("savings.detailsTitle")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {isLoading ? <p className="muted-text">{t("savings.loadingTransactions")}</p> : null}

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("savings.transactionType")}</th>
                <th>{t("savings.transactionDate")}</th>
                <th>{t("savings.transactionAmount")}</th>
                <th>{t("common.description")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.type === "deposit" ? t("savings.deposit") : t("savings.withdraw")}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{transaction.note || "-"}</td>
                  {canWrite ? (
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => onEdit(transaction)}
                          aria-label={`${formatCurrency(transaction.amount)} ${t("common.edit")}`}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          onClick={() => onDelete(transaction)}
                          aria-label={`${formatCurrency(transaction.amount)} ${t("common.delete")}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && transactions.length === 0 ? <p className="empty-table-text">{t("savings.noTransactions")}</p> : null}
      </section>
    </div>
  );
}
