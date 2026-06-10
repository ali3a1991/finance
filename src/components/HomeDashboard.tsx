"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Banknote, Check, PiggyBank, ShieldCheck, WalletCards } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatDate } from "@/lib/formatting";
import type { MonthlyPayment } from "@/lib/types";

type DashboardSummary = {
  freeAmount: number;
  incomeTotal: number;
  insuranceTotal: number;
  loanCount: number;
  loanTotal: number;
  monthlyExpenseTotal: number;
};

type DashboardPayload = {
  monthlyPayments: MonthlyPayment[];
  summary: DashboardSummary;
};

const emptySummary: DashboardSummary = {
  freeAmount: 0,
  incomeTotal: 0,
  insuranceTotal: 0,
  loanCount: 0,
  loanTotal: 0,
  monthlyExpenseTotal: 0
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

export function HomeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const body = await requestJson<DashboardPayload>("/api/dashboard");
      setPayments(body.monthlyPayments);
      setSummary(body.summary);
      setIsLoading(false);
    }

    loadDashboard().catch(() => setIsLoading(false));
  }, []);

  async function updatePayment(id: string, paidAmount: number) {
    setUpdatingPaymentId(id);

    try {
      const body = await requestJson<{ payment: MonthlyPayment }>("/api/monthly-payments", {
        body: JSON.stringify({ id, paidAmount }),
        method: "PATCH"
      });

      setPayments((current) => current.map((payment) => (payment.id === id ? body.payment : payment)));
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  function handlePartialChange(payment: MonthlyPayment, event: ChangeEvent<HTMLInputElement>) {
    const paidAmount = Number(event.target.value);
    updatePayment(payment.id, Number.isNaN(paidAmount) ? 0 : paidAmount);
  }

  const paidTotal = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const monthTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pressureRatio = summary.incomeTotal > 0 ? Math.min(monthTotal / summary.incomeTotal, 1.35) : 0;
  const needleRotation = -72 + Math.min(pressureRatio, 1) * 144;
  const gaugeStatus =
    pressureRatio <= 0.55 ? "Entspannt" : pressureRatio <= 0.85 ? "Aufmerksam bleiben" : "Kritisch";

  return (
    <>
      <section className="cash-gauge-panel" aria-label="Monatlicher Finanzdruck">
        <div className="gauge-copy">
          <span>Monatskompass</span>
          <h2>Einnahmen gegen Zahlungen</h2>
        </div>
        <div className="gauge-wrap">
          <div className="gauge-arc">
            <div className="gauge-needle" style={{ transform: `rotate(${needleRotation}deg)` }} />
            <div className="gauge-center" />
          </div>
          <div className="gauge-status">
            <strong>{gaugeStatus}</strong>
            <span>{summary.incomeTotal > 0 ? `${Math.round(pressureRatio * 100)}% genutzt` : "Keine Einnahmen"}</span>
          </div>
        </div>
        <div className="gauge-values">
          <div className="gauge-value income">
            <span>Einnahmen</span>
            <strong>{formatCurrency(summary.incomeTotal)}</strong>
          </div>
          <div className="gauge-value outgoing">
            <span>Zahlungen</span>
            <strong>{formatCurrency(monthTotal)}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Finanzubersicht">
        <StatCard
          icon={WalletCards}
          label="Monatliche Ausgaben"
          value={formatCurrency(summary.monthlyExpenseTotal)}
          helper="Aktuelle Buchungen"
        />
        <StatCard
          icon={Banknote}
          label="Kreditbetrag"
          value={formatCurrency(summary.loanTotal)}
          helper={`${summary.loanCount} aktive Kredite`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Versicherungen"
          value={formatCurrency(summary.insuranceTotal)}
          helper="Monatliche Pramien"
        />
        <StatCard
          icon={PiggyBank}
          label="Freier Betrag"
          value={formatCurrency(summary.freeAmount)}
          helper="Nach festen Zahlungen"
        />
      </section>

      <section className="payment-panel">
        <div className="section-title">
          <span>Dieser Monat</span>
          <strong>
            {formatCurrency(paidTotal)} / {formatCurrency(monthTotal)}
          </strong>
        </div>

        {isLoading ? <p className="muted-text">Zahlungen werden geladen...</p> : null}

        {!isLoading && payments.length === 0 ? (
          <p className="empty-table-text">Fur diesen Monat sind noch keine Zahlungen vorhanden.</p>
        ) : null}

        <div className="payment-list">
          {payments.map((payment) => {
            const isPaid = payment.paidAmount >= payment.amount;
            const isPartial = payment.paidAmount > 0 && !isPaid;
            const isUpdating = updatingPaymentId === payment.id;

            return (
              <article
                className={`payment-row ${isPaid ? "paid" : ""} ${isPartial ? "partial" : ""}`}
                key={payment.id}
              >
                <button
                  className="payment-check"
                  type="button"
                  onClick={() => updatePayment(payment.id, isPaid ? 0 : payment.amount)}
                  aria-label={`${payment.title} als bezahlt markieren`}
                  disabled={isUpdating}
                >
                  {isPaid ? <Check size={18} aria-hidden="true" /> : null}
                </button>
                <div className="payment-main">
                  <strong>{payment.title}</strong>
                  <span>
                    {payment.category} · {formatDate(payment.dueDate)}
                  </span>
                </div>
                <div className="payment-amount">
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <span>{isUpdating ? "Aktualisiert..." : isPaid ? "Bezahlt" : isPartial ? "Teilweise bezahlt" : "Offen"}</span>
                </div>
                <label className="partial-input">
                  <span>Bezahlt</span>
                  <input
                    min="0"
                    max={payment.amount}
                    step="0.01"
                    type="number"
                    value={payment.paidAmount}
                    onChange={(event) => handlePartialChange(payment, event)}
                    disabled={isUpdating}
                  />
                </label>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
