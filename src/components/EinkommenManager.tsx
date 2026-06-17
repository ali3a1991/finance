"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Pencil, PlusCircle, Save, Trash2, TrendingUp, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { Income } from "@/lib/types";

type IncomeForm = {
  title: string;
  source: string;
  amount: string;
  date: string;
  recurring: boolean;
  entryDay: string;
  note: string;
};

type PreviousMonthBalance = {
  amount: number;
  isManual: boolean;
  month: string;
};

const emptyForm: IncomeForm = {
  title: "",
  source: "",
  amount: "",
  date: "",
  recurring: true,
  entryDay: "",
  note: ""
};

function toPayload(form: IncomeForm): Omit<Income, "id"> {
  return {
    amount: Number(form.amount),
    date: form.date || new Date().toISOString().slice(0, 10),
    entryDay: form.recurring ? Number(form.entryDay) : undefined,
    note: form.note.trim() || null,
    recurring: form.recurring,
    source: form.source.trim(),
    title: form.title.trim()
  };
}

function isSavingsGeneratedIncome(income: Income) {
  return income.id.startsWith("income-saving-");
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return getMonthKey(date);
}

function formatMonthLabel(monthKey: string, language: "de" | "en") {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function toAmountInputValue(value: number) {
  return String(value).replace(".", ",");
}

function parseAmountInputValue(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isNaN(amount) ? 0 : amount;
}

export function EinkommenManager() {
  const { canWrite } = useAuth();
  const { language, t } = useLanguage();
  const [activeType, setActiveType] = useState<"recurring" | "oneTime">("recurring");
  const [visibleType, setVisibleType] = useState<"recurring" | "oneTime">("recurring");
  const [editForm, setEditForm] = useState<IncomeForm>(emptyForm);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");
  const [previousBalance, setPreviousBalance] = useState<PreviousMonthBalance>({
    amount: 0,
    isManual: false,
    month: getMonthKey()
  });
  const [previousBalanceDraft, setPreviousBalanceDraft] = useState("0");
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [, startTabTransition] = useTransition();

  useEffect(() => {
    async function loadIncomes() {
      const body = await requestJson<{ incomes: Income[]; previousMonthBalance: PreviousMonthBalance }>(
        `/api/incomes?month=${selectedMonth}`
      );
      setIncomes(body.incomes);
      setPreviousBalance(body.previousMonthBalance);
      setPreviousBalanceDraft(toAmountInputValue(body.previousMonthBalance.amount));
      setSelectedMonth(body.previousMonthBalance.month);
      setIsLoading(false);
    }

    loadIncomes().catch(() => setIsLoading(false));
  }, [selectedMonth]);

  function updateForm(field: keyof IncomeForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm(field: keyof IncomeForm, value: string | boolean) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function closeAddModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  function openEditModal(income: Income) {
    setEditingIncomeId(income.id);
    setEditForm({
      amount: String(income.amount),
      date: income.date,
      entryDay: income.entryDay ? String(income.entryDay) : "",
      note: income.note ?? "",
      recurring: income.recurring,
      source: income.source,
      title: income.title
    });
  }

  function closeEditModal() {
    setEditingIncomeId(null);
    setEditForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-income");

    try {
      const body = await requestJson<{ income: Income }>("/api/incomes", {
        body: JSON.stringify(toPayload(form)),
        method: "POST"
      });

      setIncomes((current) => [body.income, ...current]);
      closeAddModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-income");

    try {
      const body = await requestJson<{ income: Income }>(`/api/incomes/${editingIncomeId}`, {
        body: JSON.stringify(toPayload(editForm)),
        method: "PUT"
      });

      setIncomes((current) => current.map((income) => (income.id === editingIncomeId ? body.income : income)));
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteIncome() {
    if (!incomeToDelete) {
      return;
    }

    setOperationLabel("delete-income");

    try {
      await requestJson(`/api/incomes/${incomeToDelete.id}`, {
        method: "DELETE"
      });
      setIncomes((current) => current.filter((income) => income.id !== incomeToDelete.id));
      setIncomeToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  function handlePreviousBalanceChange(value: string) {
    if (/^-?\d*([,.]\d{0,2})?$/.test(value)) {
      setPreviousBalanceDraft(value);
    }
  }

  async function submitPreviousBalance() {
    setOperationLabel("save-previous-balance");

    try {
      const body = await requestJson<{ previousMonthBalance: PreviousMonthBalance }>("/api/incomes", {
        body: JSON.stringify({
          amount: parseAmountInputValue(previousBalanceDraft),
          month: selectedMonth
        }),
        method: "PATCH"
      });

      setPreviousBalance(body.previousMonthBalance);
      setPreviousBalanceDraft(toAmountInputValue(body.previousMonthBalance.amount));
      setSelectedMonth(body.previousMonthBalance.month);
    } finally {
      setOperationLabel("");
    }
  }

  function changeActiveType(type: "recurring" | "oneTime") {
    setActiveType(type);
    startTabTransition(() => {
      setVisibleType(type);
    });
  }

  const visibleIncomes = incomes.filter((income) => (visibleType === "recurring" ? income.recurring : !income.recurring));
  const visibleIncomeTotal = visibleIncomes.reduce((sum, income) => sum + income.amount, 0);
  const previousBalanceAmount = parseAmountInputValue(previousBalanceDraft);
  const hasPreviousBalanceChange = Math.abs(previousBalanceAmount - previousBalance.amount) > 0.009;

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("incomes.add")}
          </button>
        </div>
      ) : null}

      <section className="income-carryover-panel" aria-label={t("incomes.previousBalance")}>
        <div className="income-carryover-heading">
          <span>{t("incomes.previousBalance")}</span>
          <strong>{formatMonthLabel(selectedMonth, language)}</strong>
          <small>
            {previousBalance.isManual ? t("incomes.previousBalanceManual") : t("incomes.previousBalanceAutomatic")}
          </small>
        </div>
        <div className="income-carryover-controls">
          <button
            className="icon-button"
            type="button"
            onClick={() => setSelectedMonth((current) => addMonths(current, -1))}
            aria-label={t("dashboard.previousMonth")}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
            aria-label={t("dashboard.nextMonth")}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          {canWrite ? (
            <>
              <label className="income-carryover-input">
                <span>{t("incomes.amount")}</span>
                <input
                  autoComplete="off"
                  inputMode="decimal"
                  value={previousBalanceDraft}
                  onChange={(event) => handlePreviousBalanceChange(event.target.value)}
                />
              </label>
              <button
                className="button primary compact"
                type="button"
                onClick={submitPreviousBalance}
                disabled={!hasPreviousBalanceChange || operationLabel === "save-previous-balance"}
              >
                <Save size={16} aria-hidden="true" />
                {operationLabel === "save-previous-balance" ? t("common.saving") : t("common.save")}
              </button>
            </>
          ) : (
            <strong className="income-carryover-readonly">{formatCurrency(previousBalance.amount)}</strong>
          )}
        </div>
      </section>

      <nav
        className={`tab-row income-tab-row ${activeType === "recurring" ? "is-left" : "is-right"}`}
        aria-label={t("incomes.ariaTabs")}
      >
        <button
          className={`tab-link income-tab-link ${activeType === "recurring" ? "active" : ""}`}
          type="button"
          onClick={() => changeActiveType("recurring")}
        >
          {t("incomes.recurringTab")}
        </button>
        <button
          className={`tab-link income-tab-link ${activeType === "oneTime" ? "active" : ""}`}
          type="button"
          onClick={() => changeActiveType("oneTime")}
        >
          {t("incomes.oneTimeTab")}
        </button>
      </nav>

      {isLoading ? <p className="muted-text">{t("incomes.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("incomes.title")}</th>
                <th>{t("incomes.source")}</th>
                <th>{t("incomes.amount")}</th>
                <th>{t("incomes.date")}</th>
                <th>{t("incomes.type")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleIncomes.map((income) => (
                <tr key={income.id}>
                  <td>
                    <span className="table-title">
                      <TrendingUp size={16} aria-hidden="true" />
                      {income.title}
                    </span>
                  </td>
                  <td>{income.source}</td>
                  <td>{formatCurrency(income.amount)}</td>
                  <td>{income.recurring ? `${income.entryDay}. ${t("common.day")}` : formatDate(income.date)}</td>
                  <td>{income.recurring ? t("incomes.fixed") : t("common.oneTime")}</td>
                  {canWrite ? (
                    <td>
                      {isSavingsGeneratedIncome(income) ? (
                        <span className="table-note">{t("savings.manageOnlyInSavings")}</span>
                      ) : (
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => openEditModal(income)}
                            aria-label={`${income.title} ${t("common.edit")}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => setIncomeToDelete(income)}
                            aria-label={`${income.title} ${t("common.delete")}`}
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
        {!isLoading && visibleIncomes.length === 0 ? (
          <p className="empty-table-text">{t("incomes.empty")}</p>
        ) : null}
        <div className="table-total-row">
          <span>{t("common.total")}</span>
          <strong>{formatCurrency(visibleIncomeTotal)}</strong>
        </div>
      </section>

      {isOpen ? (
        <IncomeModal
          form={form}
          onClose={closeAddModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          isSubmitting={operationLabel === "save-income"}
          title={t("incomes.addTitle")}
        />
      ) : null}

      {editingIncomeId ? (
        <IncomeModal
          form={editForm}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          isSubmitting={operationLabel === "edit-income"}
          title={t("incomes.editTitle")}
        />
      ) : null}

      {incomeToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="income-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("incomes.deleteLabel")}</span>
              <h2 id="income-delete-modal-title">{t("incomes.deleteTitle")}</h2>
              <p>
                <strong>{incomeToDelete.title}</strong> {t("loans.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setIncomeToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteIncome}
                disabled={operationLabel === "delete-income"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-income" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function IncomeModal({
  form,
  onClose,
  onSubmit,
  onUpdate,
  isSubmitting,
  title
}: {
  form: IncomeForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof IncomeForm, value: string | boolean) => void;
  isSubmitting: boolean;
  title: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="income-modal-title">
        <div className="modal-header">
          <div>
            <span>{t("nav.incomes")}</span>
            <h2 id="income-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("incomes.title")}</span>
            <input
              required
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
              placeholder="z. B. Gehalt"
            />
          </label>
          <label>
            <span>{t("incomes.source")}</span>
            <input
              required
              value={form.source}
              onChange={(event) => onUpdate("source", event.target.value)}
              placeholder="z. B. Arbeitgeber"
            />
          </label>
          <label>
            <span>{t("incomes.amount")}</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => onUpdate("amount", event.target.value)}
              placeholder="2500"
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={form.recurring}
              type="checkbox"
              onChange={(event) => onUpdate("recurring", event.target.checked)}
            />
            <span>{t("incomes.recurringMonthly")}</span>
          </label>
          {form.recurring ? (
            <label>
              <span>{t("incomes.entryDay")}</span>
              <input
                required
                min="1"
                max="31"
                step="1"
                type="number"
                value={form.entryDay}
                onChange={(event) => onUpdate("entryDay", event.target.value)}
                placeholder="1"
              />
            </label>
          ) : (
            <label>
              <span>{t("incomes.date")}</span>
              <input required type="date" value={form.date} onChange={(event) => onUpdate("date", event.target.value)} />
            </label>
          )}
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
