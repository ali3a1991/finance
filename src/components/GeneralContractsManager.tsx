"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileText, Pencil, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { GeneralContract } from "@/lib/types";

type ContractForm = {
  title: string;
  provider: string;
  category: string;
  monthlyAmount: string;
  debitDay: string;
  startDate: string;
  endDate: string;
  note: string;
  status: string;
};

const emptyForm: ContractForm = {
  title: "",
  provider: "",
  category: "",
  monthlyAmount: "",
  debitDay: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  note: "",
  status: "Aktiv"
};

const categoryOptions = ["Mobilfunk", "Streaming", "Mitgliedschaft", "Software", "Wohnen", "Sonstiges"];
const statusOptions = ["Aktiv", "Pausiert", "Gekündigt"];

function toPayload(form: ContractForm): Omit<GeneralContract, "id"> {
  return {
    category: form.category.trim(),
    debitDay: Number(form.debitDay),
    monthlyAmount: Number(form.monthlyAmount),
    note: form.note.trim() || null,
    provider: form.provider.trim(),
    endDate: form.endDate,
    startDate: form.startDate,
    status: form.status,
    title: form.title.trim()
  };
}

function toForm(contract: GeneralContract): ContractForm {
  return {
    category: contract.category,
    debitDay: String(contract.debitDay),
    monthlyAmount: String(contract.monthlyAmount),
    note: contract.note ?? "",
    provider: contract.provider,
    endDate: contract.endDate ?? "",
    startDate: contract.startDate,
    status: contract.status,
    title: contract.title
  };
}

function getStatusLabel(status: string, t: (path: string) => string) {
  if (status === "Pausiert") {
    return t("contracts.paused");
  }

  if (status === "Gekündigt") {
    return t("contracts.cancelled");
  }

  return t("contracts.active");
}

export function GeneralContractsManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [contracts, setContracts] = useState<GeneralContract[]>([]);
  const [contractToDelete, setContractToDelete] = useState<GeneralContract | null>(null);
  const [editForm, setEditForm] = useState<ContractForm>(emptyForm);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");

  useEffect(() => {
    async function loadContracts() {
      const body = await requestJson<{ contracts: GeneralContract[] }>("/api/general-contracts");
      setContracts(body.contracts);
      setIsLoading(false);
    }

    loadContracts().catch(() => setIsLoading(false));
  }, []);

  function updateForm(field: keyof ContractForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm(field: keyof ContractForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function closeAddModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  function openEditModal(contract: GeneralContract) {
    setEditingContractId(contract.id);
    setEditForm(toForm(contract));
  }

  function closeEditModal() {
    setEditingContractId(null);
    setEditForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-contract");

    try {
      const body = await requestJson<{ contract: GeneralContract }>("/api/general-contracts", {
        body: JSON.stringify(toPayload(form)),
        method: "POST"
      });

      setContracts((current) => [body.contract, ...current]);
      closeAddModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-contract");

    try {
      const body = await requestJson<{ contract: GeneralContract }>(`/api/general-contracts/${editingContractId}`, {
        body: JSON.stringify(toPayload(editForm)),
        method: "PUT"
      });

      setContracts((current) => current.map((contract) => (contract.id === editingContractId ? body.contract : contract)));
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteContract() {
    if (!contractToDelete) {
      return;
    }

    setOperationLabel("delete-contract");

    try {
      await requestJson(`/api/general-contracts/${contractToDelete.id}`, {
        method: "DELETE"
      });
      setContracts((current) => current.filter((contract) => contract.id !== contractToDelete.id));
      setContractToDelete(null);
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
            {t("contracts.add")}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted-text">{t("contracts.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("contracts.title")}</th>
                <th>{t("contracts.provider")}</th>
                <th>{t("contracts.category")}</th>
                <th>{t("contracts.monthlyAmount")}</th>
                <th>{t("contracts.debitDay")}</th>
                <th>{t("contracts.startDate")}</th>
                <th>{t("contracts.endDate")}</th>
                <th>{t("contracts.status")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>
                    <span className="table-title">
                      <FileText size={16} aria-hidden="true" />
                      {contract.title}
                    </span>
                  </td>
                  <td>{contract.provider}</td>
                  <td>{contract.category}</td>
                  <td>{formatCurrency(contract.monthlyAmount)}</td>
                  <td>{contract.debitDay}. {t("common.day")}</td>
                  <td>{formatDate(contract.startDate)}</td>
                  <td>{contract.endDate ? formatDate(contract.endDate) : "-"}</td>
                  <td>{getStatusLabel(contract.status, t)}</td>
                  {canWrite ? (
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openEditModal(contract)}
                          aria-label={`${contract.title} ${t("common.edit")}`}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          onClick={() => setContractToDelete(contract)}
                          aria-label={`${contract.title} ${t("common.delete")}`}
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
        {!isLoading && contracts.length === 0 ? <p className="empty-table-text">{t("contracts.empty")}</p> : null}
      </section>

      {isOpen ? (
        <ContractModal
          form={form}
          isSubmitting={operationLabel === "save-contract"}
          onClose={closeAddModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          title={t("contracts.addTitle")}
        />
      ) : null}

      {editingContractId ? (
        <ContractModal
          form={editForm}
          isSubmitting={operationLabel === "edit-contract"}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          title={t("contracts.editTitle")}
        />
      ) : null}

      {contractToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="contract-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("contracts.deleteLabel")}</span>
              <h2 id="contract-delete-modal-title">{t("contracts.deleteTitle")}</h2>
              <p>
                <strong>{contractToDelete.title}</strong> {t("contracts.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setContractToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteContract}
                disabled={operationLabel === "delete-contract"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-contract" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ContractModal({
  form,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdate,
  title
}: {
  form: ContractForm;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof ContractForm, value: string) => void;
  title: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title">
        <div className="modal-header">
          <div>
            <span>{t("contracts.generalLabel")}</span>
            <h2 id="contract-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("contracts.title")}</span>
            <input
              required
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
              placeholder="z. B. Mobilfunkvertrag"
            />
          </label>
          <label>
            <span>{t("contracts.provider")}</span>
            <input
              required
              value={form.provider}
              onChange={(event) => onUpdate("provider", event.target.value)}
              placeholder="z. B. Telekom"
            />
          </label>
          <label>
            <span>{t("contracts.category")}</span>
            <select required value={form.category} onChange={(event) => onUpdate("category", event.target.value)}>
              <option value="">{t("common.selectPlaceholder")}</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("contracts.monthlyAmount")}</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.monthlyAmount}
              onChange={(event) => onUpdate("monthlyAmount", event.target.value)}
              placeholder="19.99"
            />
          </label>
          <label>
            <span>{t("contracts.debitDay")}</span>
            <input
              required
              min="1"
              max="31"
              step="1"
              type="number"
              value={form.debitDay}
              onChange={(event) => onUpdate("debitDay", event.target.value)}
              placeholder="15"
            />
          </label>
          <label>
            <span>{t("contracts.startDate")}</span>
            <input required type="date" value={form.startDate} onChange={(event) => onUpdate("startDate", event.target.value)} />
          </label>
          <label>
            <span>{t("contracts.endDate")}</span>
            <input required type="date" value={form.endDate} onChange={(event) => onUpdate("endDate", event.target.value)} />
          </label>
          <label>
            <span>{t("contracts.status")}</span>
            <select required value={form.status} onChange={(event) => onUpdate("status", event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {getStatusLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("contracts.note")}</span>
            <input value={form.note} onChange={(event) => onUpdate("note", event.target.value)} placeholder="Optional" />
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
