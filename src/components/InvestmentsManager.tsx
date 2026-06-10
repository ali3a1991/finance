"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bitcoin, LineChart, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { InvestmentWithQuote } from "@/lib/types";

type InvestmentForm = {
  assetName: string;
  symbol: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: string;
};

const assetOptions = [
  { name: "Tesla", symbol: "TSLA" },
  { name: "Nvidia", symbol: "NVDA" },
  { name: "Apple", symbol: "AAPL" },
  { name: "S&P 500", symbol: "SXR8" },
  { name: "Bitcoin", symbol: "BTC-USD" }
];

const emptyForm: InvestmentForm = {
  assetName: assetOptions[0].name,
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchasePrice: "",
  quantity: "",
  symbol: assetOptions[0].symbol
};

function toPayload(form: InvestmentForm) {
  return {
    assetName: form.assetName,
    purchaseDate: form.purchaseDate,
    purchasePrice: Number(form.purchasePrice),
    quantity: Number(form.quantity),
    symbol: form.symbol
  };
}

export function InvestmentsManager() {
  const { canWrite } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState<InvestmentForm>(emptyForm);
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentWithQuote | null>(null);
  const [investments, setInvestments] = useState<InvestmentWithQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");

  useEffect(() => {
    async function loadInvestments() {
      const body = await requestJson<{ investments: InvestmentWithQuote[] }>("/api/investments");
      setInvestments(body.investments);
      setIsLoading(false);
    }

    loadInvestments().catch(() => setIsLoading(false));
  }, []);

  function updateForm(field: keyof InvestmentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAsset(symbol: string) {
    const asset = assetOptions.find((option) => option.symbol === symbol);

    if (!asset) {
      return;
    }

    setForm((current) => ({
      ...current,
      assetName: asset.name,
      symbol: asset.symbol
    }));
  }

  function closeModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-investment");

    try {
      await requestJson<{ investment: InvestmentWithQuote }>("/api/investments", {
        body: JSON.stringify(toPayload(form)),
        method: "POST"
      });
      const body = await requestJson<{ investments: InvestmentWithQuote[] }>("/api/investments");
      setInvestments(body.investments);
      closeModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteInvestment() {
    if (!investmentToDelete) {
      return;
    }

    setOperationLabel("delete-investment");

    try {
      await requestJson(`/api/investments/${investmentToDelete.id}`, {
        method: "DELETE"
      });
      setInvestments((current) => current.filter((investment) => investment.id !== investmentToDelete.id));
      setInvestmentToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  const investedTotal = investments.reduce((sum, investment) => sum + investment.quantity * investment.purchasePrice, 0);
  const currentTotal = investments.reduce(
    (sum, investment) => sum + investment.quantity * (investment.currentPrice ?? investment.purchasePrice),
    0
  );

  return (
    <>
      {canWrite ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("investments.add")}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted-text">{t("investments.loading")}</p> : null}

      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("investments.asset")}</th>
                <th>{t("investments.symbol")}</th>
                <th>{t("investments.quantity")}</th>
                <th>{t("investments.purchasePrice")}</th>
                <th>{t("investments.currentPrice")}</th>
                <th>{t("investments.currentValue")}</th>
                <th>{t("investments.result")}</th>
                <th>{t("investments.purchaseDate")}</th>
                {canWrite ? <th>{t("common.actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {investments.map((investment) => {
                const investedValue = investment.quantity * investment.purchasePrice;
                const currentValue = investment.quantity * (investment.currentPrice ?? investment.purchasePrice);
                const result = currentValue - investedValue;
                const resultClass = result >= 0 ? "positive" : "negative";

                return (
                  <tr key={investment.id}>
                    <td>
                      <span className="table-title">
                        {investment.symbol === "BTC-USD" ? (
                          <Bitcoin size={16} aria-hidden="true" />
                        ) : (
                          <LineChart size={16} aria-hidden="true" />
                        )}
                        {investment.assetName}
                      </span>
                    </td>
                    <td>{investment.symbol}</td>
                    <td>{investment.quantity}</td>
                    <td>{formatCurrency(investment.purchasePrice, "EUR")}</td>
                    <td>
                      {investment.currentPrice === null
                        ? t("investments.priceUnavailable")
                        : formatCurrency(investment.currentPrice, "EUR")}
                    </td>
                    <td>{formatCurrency(currentValue, "EUR")}</td>
                    <td>
                      <span className={`investment-result ${resultClass}`}>
                        {formatCurrency(result, "EUR")}
                      </span>
                    </td>
                    <td>{formatDate(investment.purchaseDate)}</td>
                    {canWrite ? (
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => setInvestmentToDelete(investment)}
                            aria-label={`${investment.assetName} ${t("common.delete")}`}
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
        {!isLoading && investments.length === 0 ? <p className="empty-table-text">{t("investments.empty")}</p> : null}
        <div className="table-total-row">
          <span>{t("investments.investedTotal")}</span>
          <strong>{formatCurrency(investedTotal, "EUR")}</strong>
          <span>{t("investments.currentTotal")}</span>
          <strong>{formatCurrency(currentTotal, "EUR")}</strong>
        </div>
      </section>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="investment-modal-title">
            <div className="modal-header">
              <div>
                <span>{t("investments.investment")}</span>
                <h2 id="investment-modal-title">{t("investments.addTitle")}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeModal} aria-label={t("common.closeDialog")}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                <span>{t("investments.asset")}</span>
                <select required value={form.symbol} onChange={(event) => updateAsset(event.target.value)}>
                  {assetOptions.map((option) => (
                    <option key={option.symbol} value={option.symbol}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t("investments.quantity")}</span>
                <input
                  required
                  min="0"
                  step="0.00000001"
                  type="number"
                  value={form.quantity}
                  onChange={(event) => updateForm("quantity", event.target.value)}
                  placeholder="1"
                />
              </label>
              <label>
                <span>{t("investments.purchasePrice")}</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.purchasePrice}
                  onChange={(event) => updateForm("purchasePrice", event.target.value)}
                  placeholder="250"
                />
              </label>
              <label>
                <span>{t("investments.purchaseDate")}</span>
                <input
                  required
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) => updateForm("purchaseDate", event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
                <button className="button primary" type="submit" disabled={operationLabel === "save-investment"}>
                  <Save size={18} aria-hidden="true" />
                  {operationLabel === "save-investment" ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {investmentToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="investment-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("investments.deleteLabel")}</span>
              <h2 id="investment-delete-modal-title">{t("investments.deleteTitle")}</h2>
              <p>
                <strong>{investmentToDelete.assetName}</strong> {t("investments.deleteText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setInvestmentToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteInvestment}
                disabled={operationLabel === "delete-investment"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-investment" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
