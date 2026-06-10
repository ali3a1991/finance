"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, PlusCircle, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { Insurance } from "@/lib/types";

type InsuranceForm = {
  provider: string;
  coverage: string;
  monthlyPremium: string;
  debitDay: string;
  startDate: string;
  endDate: string;
};

const emptyForm: InsuranceForm = {
  provider: "",
  coverage: "",
  monthlyPremium: "",
  debitDay: "",
  startDate: "",
  endDate: ""
};

const coverageOptions = [
  "Privat & Familie",
  "Wohnung",
  "Vollkasko",
  "Teilkasko",
  "Haftpflicht",
  "Hausrat",
  "Rechtsschutz",
  "Berufsunfahigkeit",
  "Unfall",
  "Zahnzusatz",
  "Reise",
  "Tier"
];

export function VersicherungManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [insuranceToDelete, setInsuranceToDelete] = useState<Insurance | null>(null);
  const [form, setForm] = useState<InsuranceForm>(emptyForm);
  const [editForm, setEditForm] = useState<InsuranceForm>(emptyForm);
  const [operationLabel, setOperationLabel] = useState("");

  useEffect(() => {
    async function loadInsurances() {
      const body = await requestJson<{ insurances: Insurance[] }>("/api/insurances");
      setInsurances(body.insurances);
      setIsLoading(false);
    }

    loadInsurances().catch(() => setIsLoading(false));
  }, []);

  function updateForm<Key extends keyof InsuranceForm>(field: Key, value: InsuranceForm[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm<Key extends keyof InsuranceForm>(field: Key, value: InsuranceForm[Key]) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function closeAddModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  function openEditModal(insurance: Insurance) {
    setEditingInsuranceId(insurance.id);
    setEditForm({
      provider: insurance.provider,
      coverage: insurance.coverage,
      monthlyPremium: String(insurance.monthlyPremium),
      debitDay: String(insurance.debitDay),
      startDate: insurance.startDate ?? "",
      endDate: insurance.endDate ?? insurance.renewalDate ?? ""
    });
  }

  function closeEditModal() {
    setEditingInsuranceId(null);
    setEditForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-insurance");

    try {
      const body = await requestJson<{ insurance: Insurance }>("/api/insurances", {
        body: JSON.stringify({
          name: `${form.coverage} - ${form.provider}`.trim(),
          provider: form.provider.trim(),
          coverage: form.coverage.trim(),
          monthlyPremium: Number(form.monthlyPremium),
          debitDay: Number(form.debitDay),
          startDate: form.startDate,
          endDate: form.endDate,
          renewalDate: form.endDate
        }),
        method: "POST"
      });

      setInsurances((current) => [body.insurance, ...current]);
      closeAddModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-insurance");

    try {
      const body = await requestJson<{ insurance: Insurance }>(`/api/insurances/${editingInsuranceId}`, {
        body: JSON.stringify({
          name: `${editForm.coverage} - ${editForm.provider}`.trim(),
          provider: editForm.provider.trim(),
          coverage: editForm.coverage.trim(),
          monthlyPremium: Number(editForm.monthlyPremium),
          debitDay: Number(editForm.debitDay),
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          renewalDate: editForm.endDate
        }),
        method: "PUT"
      });

      setInsurances((current) =>
        current.map((insurance) => (insurance.id === editingInsuranceId ? body.insurance : insurance))
      );
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteInsurance() {
    if (!insuranceToDelete) {
      return;
    }

    setOperationLabel("delete-insurance");

    try {
      await requestJson(`/api/insurances/${insuranceToDelete.id}`, {
        method: "DELETE"
      });
      setInsurances((current) => current.filter((insurance) => insurance.id !== insuranceToDelete.id));
      setInsuranceToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("insurances.add")}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted-text">{t("insurances.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("insurances.provider")}</th>
                <th>{t("insurances.coverage")}</th>
                <th>{t("insurances.monthly")}</th>
                <th>{t("insurances.debitDay")}</th>
                <th>{t("insurances.startDate")}</th>
                <th>{t("insurances.endDate")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {insurances.map((insurance) => (
                <tr key={insurance.id}>
                  <td>
                    <span className="table-title">
                      <ShieldCheck size={16} aria-hidden="true" />
                      {insurance.provider}
                    </span>
                  </td>
                  <td>{insurance.coverage}</td>
                  <td>{formatCurrency(insurance.monthlyPremium)}</td>
                  <td>{insurance.debitDay}. {t("common.day")}</td>
                  <td>{insurance.startDate ? formatDate(insurance.startDate) : "-"}</td>
                  <td>{insurance.endDate ? formatDate(insurance.endDate) : "-"}</td>
                  {canWrite ? (
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openEditModal(insurance)}
                          aria-label={`${insurance.provider} ${t("common.edit")}`}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          onClick={() => setInsuranceToDelete(insurance)}
                          aria-label={`${insurance.provider} ${t("common.delete")}`}
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
      </section>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="insurance-modal-title">
            <div className="modal-header">
              <div>
                <span>{t("insurances.insurance")}</span>
                <h2 id="insurance-modal-title">{t("insurances.addTitle")}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeAddModal} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                <span>{t("insurances.provider")}</span>
                <input
                  required
                  value={form.provider}
                  onChange={(event) => updateForm("provider", event.target.value)}
                  placeholder="z. B. Allianz"
                />
              </label>
              <label>
                <span>{t("insurances.coverage")}</span>
                <select
                  required
                  value={form.coverage}
                  onChange={(event) => updateForm("coverage", event.target.value)}
                >
                  <option value="">{t("common.selectPlaceholder")}</option>
                  {coverageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t("insurances.monthly")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.monthlyPremium}
                  onChange={(event) => updateForm("monthlyPremium", event.target.value)}
                  placeholder="29"
                />
              </label>
              <label>
                <span>{t("insurances.debitDay")}</span>
                <input
                  required
                  min="1"
                  max="31"
                  step="1"
                  type="number"
                  value={form.debitDay}
                  onChange={(event) => updateForm("debitDay", event.target.value)}
                  placeholder="15"
                />
              </label>
              <label>
                <span>{t("insurances.startDate")}</span>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateForm("startDate", event.target.value)}
                />
              </label>
              <label>
                <span>{t("insurances.endDate")}</span>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(event) => updateForm("endDate", event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeAddModal}>
                  {t("common.cancel")}
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "save-insurance"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "save-insurance" ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {insuranceToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="insurance-delete-modal-title"
          >
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("insurances.deleteLabel")}</span>
              <h2 id="insurance-delete-modal-title">{t("insurances.deleteTitle")}</h2>
              <p>
                <strong>{insuranceToDelete.provider}</strong> {t("insurances.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setInsuranceToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteInsurance}
                disabled={operationLabel === "delete-insurance"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-insurance" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editingInsuranceId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="insurance-edit-modal-title">
            <div className="modal-header">
              <div>
                <span>{t("insurances.insurance")}</span>
                <h2 id="insurance-edit-modal-title">{t("insurances.editTitle")}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeEditModal} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditSubmit}>
              <label>
                <span>{t("insurances.provider")}</span>
                <input
                  required
                  value={editForm.provider}
                  onChange={(event) => updateEditForm("provider", event.target.value)}
                  placeholder="z. B. Allianz"
                />
              </label>
              <label>
                <span>{t("insurances.coverage")}</span>
                <select
                  required
                  value={editForm.coverage}
                  onChange={(event) => updateEditForm("coverage", event.target.value)}
                >
                  <option value="">{t("common.selectPlaceholder")}</option>
                  {coverageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t("insurances.monthly")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={editForm.monthlyPremium}
                  onChange={(event) => updateEditForm("monthlyPremium", event.target.value)}
                  placeholder="29"
                />
              </label>
              <label>
                <span>{t("insurances.debitDay")}</span>
                <input
                  required
                  min="1"
                  max="31"
                  step="1"
                  type="number"
                  value={editForm.debitDay}
                  onChange={(event) => updateEditForm("debitDay", event.target.value)}
                  placeholder="15"
                />
              </label>
              <label>
                <span>{t("insurances.startDate")}</span>
                <input
                  required
                  type="date"
                  value={editForm.startDate}
                  onChange={(event) => updateEditForm("startDate", event.target.value)}
                />
              </label>
              <label>
                <span>{t("insurances.endDate")}</span>
                <input
                  required
                  type="date"
                  value={editForm.endDate}
                  onChange={(event) => updateEditForm("endDate", event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeEditModal}>
                  {t("common.cancel")}
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "edit-insurance"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "edit-insurance" ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
