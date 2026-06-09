import db from "../../data/finance-db.json";
import { formatCurrency, formatDate } from "@/lib/formatting";
import type { Expense, FinanceDb, Insurance, Loan, MonthlyBudget } from "@/lib/types";

export type { Expense, Insurance, Loan, MonthlyBudget };

const financeDb = db as FinanceDb;

export function getFinanceDb() {
  return financeDb;
}

export { formatCurrency, formatDate };

export function getMonthlyExpenseTotal() {
  return financeDb.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function getLoanTotalBalance() {
  return financeDb.loans.reduce((sum, loan) => sum + loan.balance, 0);
}

export function getInsuranceMonthlyTotal() {
  return financeDb.insurances.reduce((sum, insurance) => sum + insurance.monthlyPremium, 0);
}

export function getSavingsPotential() {
  const committed =
    getMonthlyExpenseTotal() +
    financeDb.loans.reduce((sum, loan) => sum + loan.monthlyRate, 0) +
    getInsuranceMonthlyTotal();

  return db.owner.monthlyNetIncome - committed;
}
