"use client";

import Link from "next/link";
import { LineChart, PiggyBank, ShoppingBasket } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency } from "@/lib/formatting";
import type { DashboardSummary } from "@/lib/types";

export function HomeOverview({ summary }: { summary: DashboardSummary }) {
  const { language, t } = useLanguage();
  const showSavingsTotal = summary.savingsTotal !== 0;
  const showInvestmentTotal = summary.investmentCurrentTotal !== 0;
  const investmentResultClass = summary.investmentResult >= 0 ? "positive" : "negative";

  return (
    <>
      {showSavingsTotal ? (
        <section className="investment-summary-panel savings-summary-panel" aria-label={t("dashboard.savings")}>
          <div className="investment-summary-heading">
            <Link className="summary-icon" href="/savings" aria-label={t("nav.savings")} title={t("nav.savings")}>
              <PiggyBank size={20} aria-hidden="true" />
            </Link>
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
      ) : null}

      {summary.shoppingOpenItemCount > 0 ? (
        <Link
          className="shopping-notification"
          href="/shopping-list"
          aria-label={`${t("dashboard.viewShoppingList")}: ${summary.shoppingOpenItemCount} ${t("dashboard.openShoppingItems")}`}
          title={t("dashboard.viewShoppingList")}
        >
          <ShoppingBasket size={22} aria-hidden="true" />
          <span className="shopping-notification-badge" aria-hidden="true">
            {summary.shoppingOpenItemCount > 99 ? "99+" : summary.shoppingOpenItemCount}
          </span>
        </Link>
      ) : null}

      {showInvestmentTotal ? (
        <section className="investment-summary-panel" aria-label={t("dashboard.investmentOverview")}>
          <div className="investment-summary-heading">
            <Link className="summary-icon" href="/investments" aria-label={t("nav.investments")} title={t("nav.investments")}>
              <LineChart size={20} aria-hidden="true" />
            </Link>
            <div>
              <span>{t("dashboard.investmentOverview")}</span>
              <strong>{summary.investmentItemCount} {t("dashboard.investmentItems")}</strong>
            </div>
          </div>
          <div className="investment-summary-grid">
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
                })}%
              </strong>
            </div>
            <div>
              <span>{t("dashboard.investmentResult")}</span>
              <strong className={investmentResultClass}>{formatCurrency(summary.investmentResult)}</strong>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
