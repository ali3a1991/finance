"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  LineChart,
  PiggyBank,
  Save,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type { MonthlyPayment } from "@/lib/types";

type DashboardSummary = {
  freeAmount: number;
  incomeTotal: number;
  insuranceTotal: number;
  investmentCurrentTotal: number;
  investmentInvestedTotal: number;
  investmentItemCount: number;
  investmentResult: number;
  investmentReturnRate: number;
  loanCount: number;
  loanTotal: number;
  monthlyExpenseTotal: number;
  previousMonthBalance: number;
  savingsTotal: number;
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
  investmentCurrentTotal: 0,
  investmentInvestedTotal: 0,
  investmentItemCount: 0,
  investmentResult: 0,
  investmentReturnRate: 0,
  loanCount: 0,
  loanTotal: 0,
  monthlyExpenseTotal: 0,
  previousMonthBalance: 0,
  savingsTotal: 0
};

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

function toPaymentInputValue(value: number) {
  return String(value).replace(".", ",");
}

function parsePaymentInputValue(value: string) {
  const paidAmount = Number(value.replace(",", "."));
  return Number.isNaN(paidAmount) ? 0 : paidAmount;
}

export function HomeDashboard() {
  const { canWrite } = useAuth();
  const { language, t } = useLanguage();
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
  const availableTotal = summary.incomeTotal + summary.previousMonthBalance;
  const pressureRatio = availableTotal > 0 ? Math.min(monthTotal / availableTotal, 1.35) : 0;
  const needleRotation = -90 + Math.min(pressureRatio, 1) * 180;
  const gaugeStatus =
    pressureRatio <= 0.55
      ? t("dashboard.relaxed")
      : pressureRatio <= 0.85
        ? t("dashboard.attentive")
        : t("dashboard.critical");
  const isCurrentMonth = selectedMonth === getMonthKey();
  const investmentResultClass = summary.investmentResult >= 0 ? "positive" : "negative";

  return (
    <>
      <section className="investment-summary-panel" aria-label={t("dashboard.investmentOverview")}>
        <div className="investment-summary-heading">
          <div className="summary-icon">
            <LineChart size={20} aria-hidden="true" />
          </div>
          <div>
            <span>{t("dashboard.investmentOverview")}</span>
            <strong>
              {summary.investmentItemCount} {t("dashboard.investmentItems")}
            </strong>
          </div>
        </div>
        <div className="investment-summary-grid">
          <div>
            <span>{t("dashboard.investedTotal")}</span>
            <strong>{formatCurrency(summary.investmentInvestedTotal)}</strong>
          </div>
          <div>
            <span>{t("dashboard.currentInvestmentValue")}</span>
            <strong>{formatCurrency(summary.investmentCurrentTotal)}</strong>
          </div>
          <div>
            <span>{t("dashboard.returnRate")}</span>
            <strong className={investmentResultClass}>
              {summary.investmentReturnRate.toLocaleString(language === "de" ? "de-DE" : "en-US", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
              %
            </strong>
          </div>
          <div>
            <span>{t("dashboard.investmentResult")}</span>
            <strong className={investmentResultClass}>{formatCurrency(summary.investmentResult)}</strong>
          </div>
        </div>
      </section>

      <section className="investment-summary-panel savings-summary-panel" aria-label={t("dashboard.savings")}>
        <div className="investment-summary-heading">
          <div className="summary-icon">
            <PiggyBank size={20} aria-hidden="true" />
          </div>
          <div>
            <span>{t("dashboard.savings")}</span>
            <strong>{t("dashboard.savingsTotal")}</strong>
          </div>
        </div>
        <div className="investment-summary-grid savings-summary-grid">
          <div>
            <span>{t("dashboard.savings")}</span>
            <strong>{formatCurrency(summary.savingsTotal)}</strong>
          </div>
        </div>
      </section>

      <section className="month-switcher" aria-label={t("dashboard.monthPicker")}>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, -1))}
          aria-label={t("dashboard.previousMonth")}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="month-switcher-current">
          <CalendarDays size={18} aria-hidden="true" />
          <div>
            <span>{isCurrentMonth ? t("dashboard.currentMonth") : t("dashboard.selectedMonth")}</span>
            <strong>{formatMonthLabel(selectedMonth, language)}</strong>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
          aria-label={t("dashboard.nextMonth")}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        {!isCurrentMonth ? (
          <button className="button secondary month-today-button" type="button" onClick={() => setSelectedMonth(getMonthKey())}>
            {t("dashboard.today")}
          </button>
        ) : null}
      </section>

      <section className="cash-gauge-panel" aria-label={t("dashboard.compass")}>
        <div className="gauge-copy">
          <span>{t("dashboard.compass")}</span>
          <h2>{t("dashboard.gaugeTitle")}</h2>
          <div className="gauge-values">
            <div className="gauge-value income">
              <span>{t("dashboard.income")}</span>
              <strong>{formatCurrency(summary.incomeTotal)}</strong>
            </div>
            <div className="gauge-value carryover">
              <span>{t("dashboard.previousBalance")}</span>
              <strong>{formatCurrency(summary.previousMonthBalance)}</strong>
            </div>
            <div className="gauge-value outgoing">
              <span>{t("dashboard.payments")}</span>
              <strong>{formatCurrency(monthTotal)}</strong>
            </div>
          </div>
        </div>
        <div className="gauge-wrap">
          <div className="gauge-arc">
            <div className="gauge-marker gauge-marker-0">
              <span>0</span>
            </div>
            <div className="gauge-marker gauge-marker-50">
              <span>50</span>
            </div>
            <div className="gauge-marker gauge-marker-100">
              <span>100</span>
            </div>
            <div className="gauge-needle" style={{ transform: `rotate(${needleRotation}deg)` }} />
            <div className="gauge-center" />
          </div>
          <div className="gauge-status">
            <strong>{gaugeStatus}</strong>
            <span>
              {availableTotal > 0 ? `${Math.round(pressureRatio * 100)}% ${t("dashboard.used")}` : t("dashboard.noIncome")}
            </span>
            <div className="gauge-free-amount">
              <span>{t("dashboard.freeAmount")}</span>
              <strong>{formatCurrency(summary.freeAmount)}</strong>
              <small>{t("dashboard.afterFixedPayments")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="payment-panel">
        <div className="section-title">
          <span>{formatMonthLabel(selectedMonth, language)}</span>
          <strong>
            {formatCurrency(paidTotal)} / {formatCurrency(monthTotal)}
          </strong>
        </div>

        {isLoading ? <p className="muted-text">{t("dashboard.loadingPayments")}</p> : null}

        {!isLoading && payments.length === 0 ? (
          <p className="empty-table-text">{t("dashboard.noPayments")}</p>
        ) : null}

        <div className="payment-list">
          {payments.map((payment) => {
            const isPaid = payment.paidAmount >= payment.amount;
            const isPartial = payment.paidAmount > 0 && !isPaid;
            const isUpdating = updatingPaymentId === payment.id;
            const draftValue = paymentDrafts[payment.id] ?? toPaymentInputValue(payment.paidAmount);
            const draftAmount = parsePaymentInputValue(draftValue);
            const hasDraftChange = Math.abs(draftAmount - payment.paidAmount) > 0.009;
            const canUpdatePayment = canWrite && !payment.lockedBySavings;

            return (
              <article
                className={`payment-row ${!canWrite ? "readonly" : ""} ${payment.lockedBySavings ? "locked" : ""} ${isPaid ? "paid" : ""} ${isPartial ? "partial" : ""}`}
                key={payment.id}
              >
                {canUpdatePayment ? (
                  <button
                    className="payment-check"
                    type="button"
                    onClick={() => updatePayment(payment.id, isPaid ? 0 : payment.amount)}
                    aria-label={`${payment.title} ${t("dashboard.markPaid")}`}
                    disabled={isUpdating}
                  >
                    {isPaid ? <Check size={18} aria-hidden="true" /> : null}
                  </button>
                ) : payment.lockedBySavings ? (
                  <span className="payment-check locked-check" aria-hidden="true">
                    <Check size={18} />
                  </span>
                ) : null}
                <div className="payment-main">
                  <strong>{payment.title}</strong>
                  <span>
                    {payment.category} · {formatDate(payment.dueDate)}
                  </span>
                </div>
                <div className="payment-amount">
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <span>
                    {isUpdating
                      ? t("dashboard.updating")
                      : isPaid
                        ? t("dashboard.paid")
                        : isPartial
                          ? t("dashboard.partiallyPaid")
                          : t("dashboard.open")}
                  </span>
                </div>
                {canUpdatePayment ? (
                  <div className="partial-input">
                    <label>
                      <span>{t("dashboard.paidAmount")}</span>
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
                        aria-label={`${payment.title} ${t("dashboard.savePaidAmount")}`}
                      >
                        <Save size={18} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ) : payment.lockedBySavings ? (
                  <div className="payment-lock-note">
                    {t("savings.manageOnlyInSavings")}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
