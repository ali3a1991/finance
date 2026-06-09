import { prisma } from "@/lib/prisma";
import type { Expense, FinanceDb, Income, Insurance, Loan, MonthlyPayment } from "@/lib/types";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function mapLoan(loan: {
  id: string;
  name: string;
  bank: string;
  balance: number;
  totalInterest: number;
  monthlyRate: number;
  interestRate: number;
  nextPayment: Date;
  status: string;
}): Loan {
  return {
    ...loan,
    nextPayment: toDateInput(loan.nextPayment)
  };
}

function mapInsurance(insurance: {
  id: string;
  name: string;
  provider: string;
  monthlyPremium: number;
  debitDay: number;
  renewalDate: Date;
  coverage: string;
}): Insurance {
  return {
    ...insurance,
    renewalDate: toDateInput(insurance.renewalDate)
  };
}

function mapIncome(income: {
  id: string;
  title: string;
  source: string;
  amount: number;
  date: Date;
  recurring: boolean;
  entryDay: number | null;
}): Income {
  return {
    ...income,
    date: toDateInput(income.date),
    entryDay: income.entryDay ?? undefined
  };
}

function mapExpense(expense: {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  recurring: boolean;
}): Expense {
  return {
    ...expense,
    date: toDateInput(expense.date)
  };
}

export async function readFinanceDb(): Promise<FinanceDb> {
  const [loans, insurances, incomes, expenses, monthlyBudgets, paymentConfirmations] = await Promise.all([
    prisma.loan.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insurance.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.income.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.monthlyBudget.findMany({ orderBy: { category: "asc" } }),
    prisma.paymentConfirmation.findMany()
  ]);

  return {
    expenses: expenses.map(mapExpense),
    incomes: incomes.map(mapIncome),
    insurances: insurances.map(mapInsurance),
    loans: loans.map(mapLoan),
    monthlyBudgets,
    owner: {
      currency: "EUR",
      monthlyNetIncome: 0,
      name: "Ali"
    },
    paymentConfirmations: paymentConfirmations.map((payment) => ({
      id: payment.id,
      paidAmount: payment.paidAmount,
      updatedAt: payment.updatedAt.toISOString()
    }))
  };
}

export async function writeFinanceDb() {
  throw new Error("writeFinanceDb is not used with PostgreSQL. Use typed CRUD helpers instead.");
}

export async function listLoans() {
  const loans = await prisma.loan.findMany({ orderBy: { createdAt: "desc" } });
  return loans.map(mapLoan);
}

export async function createLoan(loan: Loan) {
  const createdLoan = await prisma.loan.create({
    data: {
      ...loan,
      nextPayment: toDate(loan.nextPayment)
    }
  });
  return mapLoan(createdLoan);
}

export async function updateLoan(id: string, patch: Omit<Loan, "id" | "status">) {
  try {
    const loan = await prisma.loan.update({
      data: {
        ...patch,
        nextPayment: toDate(patch.nextPayment)
      },
      where: { id }
    });
    return mapLoan(loan);
  } catch {
    return null;
  }
}

export async function deleteLoan(id: string) {
  try {
    await prisma.loan.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listInsurances() {
  const insurances = await prisma.insurance.findMany({ orderBy: { createdAt: "desc" } });
  return insurances.map(mapInsurance);
}

export async function createInsurance(insurance: Insurance) {
  const createdInsurance = await prisma.insurance.create({
    data: {
      ...insurance,
      renewalDate: toDate(insurance.renewalDate)
    }
  });
  return mapInsurance(createdInsurance);
}

export async function updateInsurance(id: string, patch: Omit<Insurance, "id">) {
  try {
    const insurance = await prisma.insurance.update({
      data: {
        ...patch,
        renewalDate: toDate(patch.renewalDate)
      },
      where: { id }
    });
    return mapInsurance(insurance);
  } catch {
    return null;
  }
}

export async function deleteInsurance(id: string) {
  try {
    await prisma.insurance.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listIncomes() {
  const incomes = await prisma.income.findMany({ orderBy: { createdAt: "desc" } });
  return incomes.map(mapIncome);
}

export async function createIncome(income: Income) {
  const createdIncome = await prisma.income.create({
    data: {
      ...income,
      date: toDate(income.date),
      entryDay: income.entryDay ?? null
    }
  });
  return mapIncome(createdIncome);
}

export async function updateIncome(id: string, patch: Omit<Income, "id">) {
  try {
    const income = await prisma.income.update({
      data: {
        ...patch,
        date: toDate(patch.date),
        entryDay: patch.entryDay ?? null
      },
      where: { id }
    });
    return mapIncome(income);
  } catch {
    return null;
  }
}

export async function deleteIncome(id: string) {
  try {
    await prisma.income.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listExpenses() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return expenses.map(mapExpense);
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
      incomeTotal,
      insuranceTotal,
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
  const confirmation = await prisma.paymentConfirmation.upsert({
    create: {
      id,
      paidAmount: normalizedPaidAmount
    },
    update: {
      paidAmount: normalizedPaidAmount
    },
    where: { id }
  });

  return { ...payment, paidAmount: confirmation.paidAmount };
}
