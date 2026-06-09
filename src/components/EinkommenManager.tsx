"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, PlusCircle, Save, Trash2, TrendingUp, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatting";
import type { Income } from "@/lib/types";

type IncomeForm = {
  title: string;
  source: string;
  amount: string;
  date: string;
  recurring: boolean;
  entryDay: string;
};

const emptyForm: IncomeForm = {
  title: "",
  source: "",
  amount: "",
  date: "",
  recurring: true,
  entryDay: ""
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

function toPayload(form: IncomeForm): Omit<Income, "id"> {
  return {
    amount: Number(form.amount),
    date: form.date || new Date().toISOString().slice(0, 10),
    entryDay: form.recurring ? Number(form.entryDay) : undefined,
    recurring: form.recurring,
    source: form.source.trim(),
    title: form.title.trim()
  };
}

export function EinkommenManager() {
  const [activeType, setActiveType] = useState<"recurring" | "oneTime">("recurring");
  const [editForm, setEditForm] = useState<IncomeForm>(emptyForm);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadIncomes() {
      const body = await requestJson<{ incomes: Income[] }>("/api/incomes");
      setIncomes(body.incomes);
      setIsLoading(false);
    }

    loadIncomes().catch(() => setIsLoading(false));
  }, []);

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
    const body = await requestJson<{ income: Income }>("/api/incomes", {
      body: JSON.stringify(toPayload(form)),
      method: "POST"
    });

    setIncomes((current) => [body.income, ...current]);
    closeAddModal();
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = await requestJson<{ income: Income }>(`/api/incomes/${editingIncomeId}`, {
      body: JSON.stringify(toPayload(editForm)),
      method: "PUT"
    });

    setIncomes((current) => current.map((income) => (income.id === editingIncomeId ? body.income : income)));
    closeEditModal();
  }

  async function confirmDeleteIncome() {
    if (!incomeToDelete) {
      return;
    }

    await requestJson(`/api/incomes/${incomeToDelete.id}`, {
      method: "DELETE"
    });
    setIncomes((current) => current.filter((income) => income.id !== incomeToDelete.id));
    setIncomeToDelete(null);
  }

  const visibleIncomes = incomes.filter((income) => (activeType === "recurring" ? income.recurring : !income.recurring));
  const visibleIncomeTotal = visibleIncomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <>
      <div className="action-row">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
          <PlusCircle size={18} aria-hidden="true" />
          Einnahme hinzufugen
        </button>
      </div>

      <nav className="tab-row" aria-label="Einnahmenarten">
        <button
          className={`tab-link ${activeType === "recurring" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveType("recurring")}
        >
          Feste Einnahmen
        </button>
        <button
          className={`tab-link ${activeType === "oneTime" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveType("oneTime")}
        >
          Einmalige Eingange
        </button>
      </nav>

      {isLoading ? <p className="muted-text">Einnahmen werden geladen...</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Quelle</th>
                <th>Betrag</th>
                <th>Datum</th>
                <th>Typ</th>
                <th>Aktionen</th>
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
                  <td>{income.recurring ? `${income.entryDay}. Tag` : formatDate(income.date)}</td>
                  <td>{income.recurring ? "Fest" : "Einmalig"}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => openEditModal(income)}
                        aria-label={`${income.title} bearbeiten`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => setIncomeToDelete(income)}
                        aria-label={`${income.title} loschen`}
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
        {!isLoading && visibleIncomes.length === 0 ? (
          <p className="empty-table-text">Keine Einnahmen in dieser Kategorie vorhanden.</p>
        ) : null}
        <div className="table-total-row">
          <span>Summe</span>
          <strong>{formatCurrency(visibleIncomeTotal)}</strong>
        </div>
      </section>

      {isOpen ? (
        <IncomeModal
          form={form}
          onClose={closeAddModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          title="Neue Einnahme hinzufugen"
        />
      ) : null}

      {editingIncomeId ? (
        <IncomeModal
          form={editForm}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          title="Einnahme bearbeiten"
        />
      ) : null}

      {incomeToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="income-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>Einnahme loschen</span>
              <h2 id="income-delete-modal-title">Einnahme wirklich loschen?</h2>
              <p>
                <strong>{incomeToDelete.title}</strong> wird aus der aktuellen Tabelle entfernt.
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setIncomeToDelete(null)}>
                Abbrechen
              </button>
              <button className="button danger" type="button" onClick={confirmDeleteIncome}>
                <Trash2 size={18} aria-hidden="true" />
                Loschen
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
  title
}: {
  form: IncomeForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof IncomeForm, value: string | boolean) => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="income-modal-title">
        <div className="modal-header">
          <div>
            <span>Einnahmen</span>
            <h2 id="income-modal-title">{title}</h2>
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
              placeholder="z. B. Gehalt"
            />
          </label>
          <label>
            <span>Quelle</span>
            <input
              required
              value={form.source}
              onChange={(event) => onUpdate("source", event.target.value)}
              placeholder="z. B. Arbeitgeber"
            />
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
              placeholder="2500"
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={form.recurring}
              type="checkbox"
              onChange={(event) => onUpdate("recurring", event.target.checked)}
            />
            <span>Feste monatliche Einnahme</span>
          </label>
          {form.recurring ? (
            <label>
              <span>Eingangstag</span>
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
              <span>Datum</span>
              <input required type="date" value={form.date} onChange={(event) => onUpdate("date", event.target.value)} />
            </label>
          )}
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              Abbrechen
            </button>
            <button className="button primary" type="submit">
              <Save size={18} aria-hidden="true" />
              Speichern
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
