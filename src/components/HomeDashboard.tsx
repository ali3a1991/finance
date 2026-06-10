"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Banknote, CalendarDays, Check, ChevronLeft, ChevronRight, PiggyBank, Save, ShieldCheck, WalletCards } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
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
  month: string;
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

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return getMonthKey(date);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function toPaymentInputValue(value: number) {
  return String(value).replace(".", ",");
}

function parsePaymentInputValue(value: string) {
  const paidAmount = Number(value.replace(",", "."));
  return Number.isNaN(paidAmount) ? 0 : paidAmount;
}

export function HomeDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      const body = await requestJson<DashboardPayload>(`/api/dashboard?month=${selectedMonth}`);
      setPayments(body.monthlyPayments);
      setPaymentDrafts(
        Object.fromEntries(body.monthlyPayments.map((payment) => [payment.id, toPaymentInputValue(payment.paidAmount)]))
      );
      setSummary(body.summary);
      setSelectedMonth(body.month);
      setIsLoading(false);
    }

    loadDashboard().catch(() => setIsLoading(false));
  }, [selectedMonth]);

  async function updatePayment(id: string, paidAmount: number) {
    setUpdatingPaymentId(id);

    try {
      const body = await requestJson<{ payment: MonthlyPayment }>("/api/monthly-payments", {
        body: JSON.stringify({ id, paidAmount }),
        method: "PATCH"
      });

      setPayments((current) => current.map((payment) => (payment.id === id ? body.payment : payment)));
      setPaymentDrafts((current) => ({ ...current, [id]: toPaymentInputValue(body.payment.paidAmount) }));
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  function handlePartialChange(payment: MonthlyPayment, event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;

    if (/^\d*([,.]\d{0,2})?$/.test(nextValue)) {
      setPaymentDrafts((current) => ({ ...current, [payment.id]: nextValue }));
    }
  }

  function submitPartialPayment(payment: MonthlyPayment) {
    updatePayment(payment.id, parsePaymentInputValue(paymentDrafts[payment.id] ?? String(payment.paidAmount)));
  }

  const paidTotal = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const monthTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pressureRatio = summary.incomeTotal > 0 ? Math.min(monthTotal / summary.incomeTotal, 1.35) : 0;
  const needleRotation = -72 + Math.min(pressureRatio, 1) * 144;
  const gaugeStatus =
    pressureRatio <= 0.55 ? "Entspannt" : pressureRatio <= 0.85 ? "Aufmerksam bleiben" : "Kritisch";
  const isCurrentMonth = selectedMonth === getMonthKey();

  return (
    <>
      <section className="month-switcher" aria-label="Monat auswahlen">
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, -1))}
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="month-switcher-current">
          <CalendarDays size={18} aria-hidden="true" />
          <div>
            <span>{isCurrentMonth ? "Aktueller Monat" : "Ausgewahlter Monat"}</span>
            <strong>{formatMonthLabel(selectedMonth)}</strong>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
          aria-label="Nachster Monat"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        {!isCurrentMonth ? (
          <button className="button secondary month-today-button" type="button" onClick={() => setSelectedMonth(getMonthKey())}>
            Heute
          </button>
        ) : null}
      </section>

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
          <span>{formatMonthLabel(selectedMonth)}</span>
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
            const draftValue = paymentDrafts[payment.id] ?? toPaymentInputValue(payment.paidAmount);
            const draftAmount = parsePaymentInputValue(draftValue);
            const hasDraftChange = Math.abs(draftAmount - payment.paidAmount) > 0.009;

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
                <div className="partial-input">
                  <label>
                    <span>Bezahlt</span>
                    <input
                      inputMode="decimal"
                      min="0"
                      max={payment.amount}
                      step="0.01"
                      type="text"
                      value={draftValue}
                      onChange={(event) => handlePartialChange(payment, event)}
                      disabled={isUpdating}
                    />
                  </label>
                  {hasDraftChange ? (
                    <button
                      className="icon-button partial-submit"
                      type="button"
                      onClick={() => submitPartialPayment(payment)}
                      disabled={isUpdating}
                      aria-label={`${payment.title} bezahlten Betrag speichern`}
                    >
                      <Save size={18} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
