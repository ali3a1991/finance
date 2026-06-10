"use client";

import { FormEvent, useEffect, useState } from "react";
import { Landmark, ListOrdered, Pencil, PlusCircle, Save, Trash2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatting";
import type { Loan } from "@/lib/types";

type KreditForm = {
  name: string;
  bank: string;
  balance: string;
  totalInterest: string;
  monthlyRate: string;
  interestRate: string;
  nextPayment: string;
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
  interestRate: "",
  nextPayment: ""
};

function getAuthHeaders() {
  const token = localStorage.getItem("finance_token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

async function requestJson<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Nicht autorisiert");
  }

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return (await response.json()) as T;
}

export function KreditManager() {
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
      interestRate: String(loan.interestRate),
      nextPayment: loan.nextPayment
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
          interestRate: Number(form.interestRate),
          nextPayment: form.nextPayment
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
          interestRate: Number(editForm.interestRate),
          nextPayment: editForm.nextPayment
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
      <div className="action-row">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
          <PlusCircle size={18} aria-hidden="true" />
          Kredit hinzufugen
        </button>
      </div>

      {isLoading ? <p className="muted-text">Kredite werden geladen...</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Kredit</th>
                <th>Bank</th>
                <th>Kreditbetrag</th>
                <th>Gesamtzinsen</th>
                <th>Rate</th>
                <th>Zins</th>
                <th>Erste Zahlung</th>
                <th>Status</th>
                <th>Aktionen</th>
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
                  <td>{loan.interestRate}%</td>
                  <td>{formatDate(loan.nextPayment)}</td>
                  <td>{loan.status}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => setDetailLoan(loan)}
                        aria-label={`${loan.name} Details anzeigen`}
                      >
                        <ListOrdered size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => openEditModal(loan)}
                        aria-label={`${loan.name} bearbeiten`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => setLoanToDelete(loan)}
                        aria-label={`${loan.name} loschen`}
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
      </section>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="kredit-modal-title">
            <div className="modal-header">
              <div>
                <span>Kredit</span>
                <h2 id="kredit-modal-title">Neuen Kredit hinzufugen</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeModal} aria-label="Dialog schliessen">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                <span>Kreditname</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="z. B. Modernisierungskredit"
                />
              </label>
              <label>
                <span>Bank</span>
                <input
                  required
                  value={form.bank}
                  onChange={(event) => updateForm("bank", event.target.value)}
                  placeholder="z. B. Deutsche Bank"
                />
              </label>
              <label>
                <span>Kreditbetrag</span>
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
                <span>Gesamtzinsen</span>
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
                <span>Monatsrate</span>
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
                <span>Zinssatz</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.interestRate}
                  onChange={(event) => updateForm("interestRate", event.target.value)}
                  placeholder="3.8"
                />
              </label>
              <label>
                <span>Erste Zahlung</span>
                <input
                  required
                  type="date"
                  value={form.nextPayment}
                  onChange={(event) => updateForm("nextPayment", event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeModal}>
                  Abbrechen
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "save-loan"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "save-loan" ? "Speichern..." : "Speichern"}
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
                <span>Tilgungsplan</span>
                <h2 id="kredit-detail-modal-title">{detailLoan.name}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDetailLoan(null)} aria-label="Dialog schliessen">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Kreditbetrag</span>
                <strong>{formatCurrency(detailLoan.balance)}</strong>
              </div>
              <div>
                <span>Gesamtzinsen</span>
                <strong>{formatCurrency(detailLoan.totalInterest)}</strong>
              </div>
              <div>
                <span>Monatsrate</span>
                <strong>{formatCurrency(detailLoan.monthlyRate)}</strong>
              </div>
              <div>
                <span>Anzahl Raten</span>
                <strong>{detailInstallments.length}</strong>
              </div>
            </div>

            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Rate</th>
                    <th>Datum</th>
                    <th>Betrag</th>
                    <th>Rest danach</th>
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
              <span>Kredit loschen</span>
              <h2 id="kredit-delete-modal-title">Kredit wirklich loschen?</h2>
              <p>
                Der Kredit <strong>{loanToDelete.name}</strong> wird aus der aktuellen Tabelle entfernt.
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setLoanToDelete(null)}>
                Abbrechen
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteLoan}
                disabled={operationLabel === "delete-loan"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-loan" ? "Loschen..." : "Loschen"}
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
                <span>Kredit</span>
                <h2 id="kredit-edit-modal-title">Kredit bearbeiten</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeEditModal} aria-label="Dialog schliessen">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditSubmit}>
              <label>
                <span>Kreditname</span>
                <input
                  required
                  value={editForm.name}
                  onChange={(event) => updateEditForm("name", event.target.value)}
                  placeholder="z. B. Modernisierungskredit"
                />
              </label>
              <label>
                <span>Bank</span>
                <input
                  required
                  value={editForm.bank}
                  onChange={(event) => updateEditForm("bank", event.target.value)}
                  placeholder="z. B. Deutsche Bank"
                />
              </label>
              <label>
                <span>Kreditbetrag</span>
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
                <span>Gesamtzinsen</span>
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
                <span>Monatsrate</span>
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
                <span>Zinssatz</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={editForm.interestRate}
                  onChange={(event) => updateEditForm("interestRate", event.target.value)}
                  placeholder="3.8"
                />
              </label>
              <label>
                <span>Erste Zahlung</span>
                <input
                  required
                  type="date"
                  value={editForm.nextPayment}
                  onChange={(event) => updateEditForm("nextPayment", event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeEditModal}>
                  Abbrechen
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "edit-loan"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "edit-loan" ? "Speichern..." : "Speichern"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
