"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, PiggyBank, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { SavingsGoal } from "@/lib/types";

type SavingsForm = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  monthlyContribution: string;
  targetDate: string;
  note: string;
};

const emptyForm: SavingsForm = {
  currentAmount: "",
  monthlyContribution: "",
  name: "",
  note: "",
  targetAmount: "",
  targetDate: ""
};

function toPayload(form: SavingsForm): Omit<SavingsGoal, "id"> {
  return {
    currentAmount: Number(form.currentAmount),
    monthlyContribution: Number(form.monthlyContribution),
    name: form.name.trim(),
    note: form.note.trim() || null,
    targetAmount: Number(form.targetAmount),
    targetDate: form.targetDate || null
  };
}

function getProgress(goal: SavingsGoal) {
  return Math.min(Math.max(goal.currentAmount / goal.targetAmount, 0), 1);
}

function formFromGoal(goal: SavingsGoal): SavingsForm {
  return {
    currentAmount: String(goal.currentAmount),
    monthlyContribution: String(goal.monthlyContribution),
    name: goal.name,
    note: goal.note ?? "",
    targetAmount: String(goal.targetAmount),
    targetDate: goal.targetDate ?? ""
  };
}

export function SparenManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<SavingsForm>(emptyForm);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
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

  const savedTotal = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const targetTotal = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

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
                <th>{t("savings.monthlyContribution")}</th>
                <th>{t("savings.targetDate")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const progress = getProgress(goal);
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
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </small>
                      </div>
                    </td>
                    <td>{formatCurrency(goal.monthlyContribution)}</td>
                    <td>{goal.targetDate ? formatDate(goal.targetDate) : "-"}</td>
                    {canWrite ? (
                      <td>
                        <div className="table-actions">
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
                        </div>
                      </td>
                    ) : null}
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
          <span>{t("savings.targetTotal")}</span>
          <strong>{formatCurrency(targetTotal)}</strong>
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
            <span>{t("savings.targetAmount")}</span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.targetAmount}
              onChange={(event) => onUpdate("targetAmount", event.target.value)}
              placeholder="10000"
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
          <label>
            <span>{t("savings.monthlyContribution")}</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.monthlyContribution}
              onChange={(event) => onUpdate("monthlyContribution", event.target.value)}
              placeholder="300"
            />
          </label>
          <label>
            <span>{t("savings.targetDate")}</span>
            <input type="date" value={form.targetDate} onChange={(event) => onUpdate("targetDate", event.target.value)} />
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
