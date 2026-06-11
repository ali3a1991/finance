"use client";

import { FormEvent, useEffect, useState } from "react";
import { Landmark, ListOrdered, Pencil, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { Loan } from "@/lib/types";

type KreditForm = {
  name: string;
  bank: string;
  balance: string;
  totalInterest: string;
  monthlyRate: string;
  nextPayment: string;
  note: string;
};

type Installment = {
  amount: number;
  date: string;
  number: number;
  remainingAfterPayment: number;
};

const emptyForm: KreditForm = {
  name: "",
  bank: "",
  balance: "",
  totalInterest: "",
  monthlyRate: "",
  nextPayment: "",
  note: ""
};

export function KreditManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState<KreditForm>(emptyForm);
  const [editForm, setEditForm] = useState<KreditForm>(emptyForm);
  const [operationLabel, setOperationLabel] = useState("");

  useEffect(() => {
    async function loadLoans() {
      const body = await requestJson<{ loans: Loan[] }>("/api/loans");
      setLoans(body.loans);
      setIsLoading(false);
    }

    loadLoans().catch(() => setIsLoading(false));
  }, []);

  function updateForm(field: keyof KreditForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  function updateEditForm(field: keyof KreditForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function openEditModal(loan: Loan) {
    setEditingLoanId(loan.id);
    setEditForm({
      name: loan.name,
      bank: loan.bank,
      balance: String(loan.balance),
      totalInterest: String(loan.totalInterest),
      monthlyRate: String(loan.monthlyRate),
      nextPayment: loan.nextPayment,
      note: loan.note ?? ""
    });
  }

  function closeEditModal() {
    setEditingLoanId(null);
    setEditForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-loan");

    try {
      const body = await requestJson<{ loan: Loan }>("/api/loans", {
        body: JSON.stringify({
          name: form.name.trim(),
          bank: form.bank.trim(),
          balance: Number(form.balance),
          totalInterest: Number(form.totalInterest),
          monthlyRate: Number(form.monthlyRate),
          interestRate: 0,
          startDate: null,
          endDate: null,
          nextPayment: form.nextPayment,
          note: form.note.trim() || null
        }),
        method: "POST"
      });

      setLoans((current) => [body.loan, ...current]);
      closeModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-loan");

    try {
      const body = await requestJson<{ loan: Loan }>(`/api/loans/${editingLoanId}`, {
        body: JSON.stringify({
          name: editForm.name.trim(),
          bank: editForm.bank.trim(),
          balance: Number(editForm.balance),
          totalInterest: Number(editForm.totalInterest),
          monthlyRate: Number(editForm.monthlyRate),
          interestRate: 0,
          startDate: null,
          endDate: null,
          nextPayment: editForm.nextPayment,
          note: editForm.note.trim() || null
        }),
        method: "PUT"
      });

      setLoans((current) => current.map((loan) => (loan.id === editingLoanId ? body.loan : loan)));
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteLoan() {
    if (!loanToDelete) {
      return;
    }

    setOperationLabel("delete-loan");

    try {
      await requestJson(`/api/loans/${loanToDelete.id}`, {
        method: "DELETE"
      });
      setLoans((current) => current.filter((item) => item.id !== loanToDelete.id));
      setLoanToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  function getInstallmentPlan(loan: Loan): Installment[] {
    const installments: Installment[] = [];
    const monthlyRate = Math.max(loan.monthlyRate, 0);
    let remaining = Math.max(loan.balance + loan.totalInterest, 0);
    const startDate = new Date(`${loan.nextPayment}T00:00:00`);

    if (monthlyRate <= 0 || remaining <= 0 || Number.isNaN(startDate.getTime())) {
      return installments;
    }

    for (let index = 0; remaining > 0; index += 1) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + index);
      const amount = Math.min(monthlyRate, remaining);
      remaining = Math.max(remaining - amount, 0);

      installments.push({
        amount,
        date: paymentDate.toISOString(),
        number: index + 1,
        remainingAfterPayment: remaining
      });
    }

    return installments;
  }

  function isCurrentMonth(value: string) {
    const date = new Date(value);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }

  const detailInstallments = detailLoan ? getInstallmentPlan(detailLoan) : [];

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("loans.add")}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted-text">{t("loans.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("loans.loan")}</th>
                <th>{t("loans.bank")}</th>
                <th>{t("loans.amount")}</th>
                <th>{t("loans.totalInterest")}</th>
                <th>{t("loans.rate")}</th>
                <th>{t("loans.firstPayment")}</th>
                <th>{t("loans.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <span className="table-title">
                      <Landmark size={16} aria-hidden="true" />
                      {loan.name}
                    </span>
                  </td>
                  <td>{loan.bank}</td>
                  <td>{formatCurrency(loan.balance)}</td>
                  <td>{formatCurrency(loan.totalInterest)}</td>
                  <td>{formatCurrency(loan.monthlyRate)}</td>
                  <td>{formatDate(loan.nextPayment)}</td>
                  <td>{loan.status}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => setDetailLoan(loan)}
                        aria-label={`${loan.name} ${t("loans.details")}`}
                      >
                        <ListOrdered size={16} aria-hidden="true" />
                      </button>
                      {canWrite ? (
                        <>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => openEditModal(loan)}
                            aria-label={`${loan.name} ${t("common.edit")}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => setLoanToDelete(loan)}
                            aria-label={`${loan.name} ${t("common.delete")}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="kredit-modal-title">
            <div className="modal-header">
              <div>
                <span>{t("loans.loan")}</span>
                <h2 id="kredit-modal-title">{t("loans.addTitle")}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeModal} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                <span>{t("loans.name")}</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="z. B. Modernisierungskredit"
                />
              </label>
              <label>
                <span>{t("loans.bank")}</span>
                <input
                  required
                  value={form.bank}
                  onChange={(event) => updateForm("bank", event.target.value)}
                  placeholder="z. B. Deutsche Bank"
                />
              </label>
              <label>
                <span>{t("loans.amount")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.balance}
                  onChange={(event) => updateForm("balance", event.target.value)}
                  placeholder="25000"
                />
              </label>
              <label>
                <span>{t("loans.totalInterest")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.totalInterest}
                  onChange={(event) => updateForm("totalInterest", event.target.value)}
                  placeholder="1800"
                />
              </label>
              <label>
                <span>{t("loans.monthlyRate")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.monthlyRate}
                  onChange={(event) => updateForm("monthlyRate", event.target.value)}
                  placeholder="450"
                />
              </label>
              <label>
                <span>{t("loans.firstPayment")}</span>
                <input
                  required
                  type="date"
                  value={form.nextPayment}
                  onChange={(event) => updateForm("nextPayment", event.target.value)}
                />
              </label>
              <label className="form-field-full">
                <span>{t("loans.description")}</span>
                <textarea
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  placeholder={t("loans.descriptionPlaceholder")}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "save-loan"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "save-loan" ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {detailLoan ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal-panel detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kredit-detail-modal-title"
          >
            <div className="modal-header">
              <div>
                <span>{t("loans.amortization")}</span>
                <h2 id="kredit-detail-modal-title">{detailLoan.name}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDetailLoan(null)} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>{t("loans.amount")}</span>
                <strong>{formatCurrency(detailLoan.balance)}</strong>
              </div>
              <div>
                <span>{t("loans.totalInterest")}</span>
                <strong>{formatCurrency(detailLoan.totalInterest)}</strong>
              </div>
              <div>
                <span>{t("loans.monthlyRate")}</span>
                <strong>{formatCurrency(detailLoan.monthlyRate)}</strong>
              </div>
              <div>
                <span>{t("loans.installments")}</span>
                <strong>{detailInstallments.length}</strong>
              </div>
            </div>

            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>{t("loans.rate")}</th>
                    <th>{t("loans.date")}</th>
                    <th>{t("incomes.amount")}</th>
                    <th>{t("loans.remainingAfter")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInstallments.map((installment) => (
                    <tr className={isCurrentMonth(installment.date) ? "current-installment-row" : undefined} key={installment.number}>
                      <td>#{installment.number}</td>
                      <td>{formatDate(installment.date)}</td>
                      <td>{formatCurrency(installment.amount)}</td>
                      <td>{formatCurrency(installment.remainingAfterPayment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {loanToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kredit-delete-modal-title"
          >
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("loans.deleteLabel")}</span>
              <h2 id="kredit-delete-modal-title">{t("loans.deleteTitle")}</h2>
              <p>
                <strong>{loanToDelete.name}</strong> {t("loans.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setLoanToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteLoan}
                disabled={operationLabel === "delete-loan"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-loan" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editingLoanId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="kredit-edit-modal-title">
            <div className="modal-header">
              <div>
                <span>{t("loans.loan")}</span>
                <h2 id="kredit-edit-modal-title">{t("loans.editTitle")}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeEditModal} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditSubmit}>
              <label>
                <span>{t("loans.name")}</span>
                <input
                  required
                  value={editForm.name}
                  onChange={(event) => updateEditForm("name", event.target.value)}
                  placeholder="z. B. Modernisierungskredit"
                />
              </label>
              <label>
                <span>{t("loans.bank")}</span>
                <input
                  required
                  value={editForm.bank}
                  onChange={(event) => updateEditForm("bank", event.target.value)}
                  placeholder="z. B. Deutsche Bank"
                />
              </label>
              <label>
                <span>{t("loans.amount")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={editForm.balance}
                  onChange={(event) => updateEditForm("balance", event.target.value)}
                  placeholder="25000"
                />
              </label>
              <label>
                <span>{t("loans.totalInterest")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={editForm.totalInterest}
                  onChange={(event) => updateEditForm("totalInterest", event.target.value)}
                  placeholder="1800"
                />
              </label>
              <label>
                <span>{t("loans.monthlyRate")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={editForm.monthlyRate}
                  onChange={(event) => updateEditForm("monthlyRate", event.target.value)}
                  placeholder="450"
                />
              </label>
              <label>
                <span>{t("loans.firstPayment")}</span>
                <input
                  required
                  type="date"
                  value={editForm.nextPayment}
                  onChange={(event) => updateEditForm("nextPayment", event.target.value)}
                />
              </label>
              <label className="form-field-full">
                <span>{t("loans.description")}</span>
                <textarea
                  value={editForm.note}
                  onChange={(event) => updateEditForm("note", event.target.value)}
                  placeholder={t("loans.descriptionPlaceholder")}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeEditModal}>
                  {t("common.cancel")}
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "edit-loan"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "edit-loan" ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
