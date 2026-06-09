import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { FinanceDb, Income, Insurance, Loan, MonthlyPayment } from "@/lib/types";

const dbPath = path.join(process.cwd(), "data", "finance-db.json");

export async function readFinanceDb() {
  const raw = await readFile(dbPath, "utf8");
  const db = JSON.parse(raw) as FinanceDb;
  db.incomes ??= [];
  db.paymentConfirmations ??= [];
  return db;
}

export async function writeFinanceDb(db: FinanceDb) {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function listLoans() {
  const db = await readFinanceDb();
  return db.loans;
}

export async function createLoan(loan: Loan) {
  const db = await readFinanceDb();
  db.loans.unshift(loan);
  await writeFinanceDb(db);
  return loan;
}

export async function updateLoan(id: string, patch: Omit<Loan, "id" | "status">) {
  const db = await readFinanceDb();
  const index = db.loans.findIndex((loan) => loan.id === id);

  if (index === -1) {
    return null;
  }

  db.loans[index] = { ...db.loans[index], ...patch };
  await writeFinanceDb(db);
  return db.loans[index];
}

export async function deleteLoan(id: string) {
  const db = await readFinanceDb();
  const nextLoans = db.loans.filter((loan) => loan.id !== id);

  if (nextLoans.length === db.loans.length) {
    return false;
  }

  db.loans = nextLoans;
  await writeFinanceDb(db);
  return true;
}

export async function listInsurances() {
  const db = await readFinanceDb();
  return db.insurances;
}

export async function createInsurance(insurance: Insurance) {
  const db = await readFinanceDb();
  db.insurances.unshift(insurance);
  await writeFinanceDb(db);
  return insurance;
}

export async function updateInsurance(id: string, patch: Omit<Insurance, "id">) {
  const db = await readFinanceDb();
  const index = db.insurances.findIndex((insurance) => insurance.id === id);

  if (index === -1) {
    return null;
  }

  db.insurances[index] = { ...db.insurances[index], ...patch };
  await writeFinanceDb(db);
  return db.insurances[index];
}

export async function deleteInsurance(id: string) {
  const db = await readFinanceDb();
  const nextInsurances = db.insurances.filter((insurance) => insurance.id !== id);

  if (nextInsurances.length === db.insurances.length) {
    return false;
  }

  db.insurances = nextInsurances;
  await writeFinanceDb(db);
  return true;
}

export async function listIncomes() {
  const db = await readFinanceDb();
  return db.incomes ?? [];
}

export async function createIncome(income: Income) {
  const db = await readFinanceDb();
  db.incomes ??= [];
  db.incomes.unshift(income);
  await writeFinanceDb(db);
  return income;
}

export async function updateIncome(id: string, patch: Omit<Income, "id">) {
  const db = await readFinanceDb();
  db.incomes ??= [];
  const index = db.incomes.findIndex((income) => income.id === id);

  if (index === -1) {
    return null;
  }

  db.incomes[index] = { ...db.incomes[index], ...patch };
  await writeFinanceDb(db);
  return db.incomes[index];
}

export async function deleteIncome(id: string) {
  const db = await readFinanceDb();
  db.incomes ??= [];
  const nextIncomes = db.incomes.filter((income) => income.id !== id);

  if (nextIncomes.length === db.incomes.length) {
    return false;
  }

  db.incomes = nextIncomes;
  await writeFinanceDb(db);
  return true;
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthDate(day: number, date = new Date()) {
  const safeDay = Math.min(Math.max(day, 1), 28);
  return new Date(date.getFullYear(), date.getMonth(), safeDay).toISOString();
}

function getPaymentStatus(db: FinanceDb, id: string) {
  return db.paymentConfirmations?.find((payment) => payment.id === id)?.paidAmount ?? 0;
}

export function buildMonthlyPayments(db: FinanceDb, date = new Date()): MonthlyPayment[] {
  const monthKey = getMonthKey(date);
  const loanPayments: MonthlyPayment[] = db.loans.map((loan) => {
    const dueDay = new Date(`${loan.nextPayment}T00:00:00`).getDate();
    const id = `loan:${loan.id}:${monthKey}`;

    return {
      amount: loan.monthlyRate,
      category: loan.bank,
      dueDate: getCurrentMonthDate(dueDay, date),
      id,
      paidAmount: getPaymentStatus(db, id),
      sourceType: "loan",
      title: loan.name
    };
  });

  const insurancePayments: MonthlyPayment[] = db.insurances.map((insurance) => {
    const id = `insurance:${insurance.id}:${monthKey}`;

    return {
      amount: insurance.monthlyPremium,
      category: insurance.provider,
      dueDate: getCurrentMonthDate(insurance.debitDay, date),
      id,
      paidAmount: getPaymentStatus(db, id),
      sourceType: "insurance",
      title: insurance.coverage
    };
  });

  const recurringExpensePayments: MonthlyPayment[] = db.expenses
    .filter((expense) => expense.recurring)
    .map((expense) => {
      const dueDay = new Date(`${expense.date}T00:00:00`).getDate();
      const id = `expense:${expense.id}:${monthKey}`;

      return {
        amount: expense.amount,
        category: expense.category,
        dueDate: getCurrentMonthDate(dueDay, date),
        id,
        paidAmount: getPaymentStatus(db, id),
        sourceType: "expense",
        title: expense.title
      };
    });

  return [...loanPayments, ...insurancePayments, ...recurringExpensePayments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

export async function getDashboardData() {
  const db = await readFinanceDb();
  const monthlyPayments = buildMonthlyPayments(db);
  const now = new Date();
  const incomeTotal = (db.incomes ?? [])
    .filter((income) => {
      if (income.recurring) {
        return true;
      }

      const incomeDate = new Date(`${income.date}T00:00:00`);
      return incomeDate.getFullYear() === now.getFullYear() && incomeDate.getMonth() === now.getMonth();
    })
    .reduce((sum, income) => sum + income.amount, 0);
  const monthlyExpenseTotal = db.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const loanTotal = db.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const insuranceTotal = db.insurances.reduce((sum, insurance) => sum + insurance.monthlyPremium, 0);
  const committed =
    monthlyExpenseTotal + db.loans.reduce((sum, loan) => sum + loan.monthlyRate, 0) + insuranceTotal;

  return {
    monthlyPayments,
    summary: {
      freeAmount: incomeTotal - committed,
      insuranceTotal,
      incomeTotal,
      loanCount: db.loans.length,
      loanTotal,
      monthlyExpenseTotal
    }
  };
}

export async function updateMonthlyPayment(id: string, paidAmount: number) {
  const db = await readFinanceDb();
  const payments = buildMonthlyPayments(db);
  const payment = payments.find((item) => item.id === id);

  if (!payment) {
    return null;
  }

  const normalizedPaidAmount = Math.max(0, Math.min(paidAmount, payment.amount));
  db.paymentConfirmations ??= [];
  const index = db.paymentConfirmations.findIndex((item) => item.id === id);
  const confirmation = {
    id,
    paidAmount: normalizedPaidAmount,
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    db.paymentConfirmations.push(confirmation);
  } else {
    db.paymentConfirmations[index] = confirmation;
  }

  await writeFinanceDb(db);
  return { ...payment, paidAmount: normalizedPaidAmount };
}
