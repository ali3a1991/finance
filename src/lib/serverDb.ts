import { prisma } from "@/lib/prisma";
import type { Expense, FinanceDb, GeneralContract, Income, Insurance, Loan, MonthlyPayment } from "@/lib/types";

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
  startDate: Date | null;
  endDate: Date | null;
  nextPayment: Date;
  status: string;
}): Loan {
  return {
    ...loan,
    endDate: loan.endDate ? toDateInput(loan.endDate) : null,
    nextPayment: toDateInput(loan.nextPayment),
    startDate: loan.startDate ? toDateInput(loan.startDate) : null
  };
}

function mapInsurance(insurance: {
  id: string;
  name: string;
  provider: string;
  monthlyPremium: number;
  debitDay: number;
  startDate: Date | null;
  endDate: Date | null;
  renewalDate: Date | null;
  coverage: string;
}): Insurance {
  return {
    ...insurance,
    endDate: insurance.endDate ? toDateInput(insurance.endDate) : null,
    renewalDate: insurance.renewalDate ? toDateInput(insurance.renewalDate) : null,
    startDate: insurance.startDate ? toDateInput(insurance.startDate) : null
  };
}

function mapGeneralContract(contract: {
  id: string;
  title: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  debitDay: number;
  startDate: Date;
  endDate: Date | null;
  note: string | null;
  status: string;
}): GeneralContract {
  return {
    ...contract,
    endDate: contract.endDate ? toDateInput(contract.endDate) : null,
    startDate: toDateInput(contract.startDate)
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
  const [loans, insurances, generalContracts, incomes, expenses, monthlyBudgets, paymentConfirmations] = await Promise.all([
    prisma.loan.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insurance.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.generalContract.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.income.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.monthlyBudget.findMany({ orderBy: { category: "asc" } }),
    prisma.paymentConfirmation.findMany()
  ]);

  return {
    expenses: expenses.map(mapExpense),
    generalContracts: generalContracts.map(mapGeneralContract),
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

export async function listLoans(): Promise<Loan[]> {
  const loans = await prisma.loan.findMany({ orderBy: { createdAt: "desc" } });
  return loans.map(mapLoan);
}

export async function createLoan(loan: Loan): Promise<Loan> {
  const createdLoan = await prisma.loan.create({
    data: {
      ...loan,
      endDate: loan.endDate ? toDate(loan.endDate) : null,
      nextPayment: toDate(loan.nextPayment),
      startDate: loan.startDate ? toDate(loan.startDate) : null
    }
  });
  return mapLoan(createdLoan);
}

export async function updateLoan(id: string, patch: Omit<Loan, "id" | "status">): Promise<Loan | null> {
  try {
    const loan = await prisma.loan.update({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        nextPayment: toDate(patch.nextPayment),
        startDate: patch.startDate ? toDate(patch.startDate) : null
      },
      where: { id }
    });
    return mapLoan(loan);
  } catch {
    return null;
  }
}

export async function deleteLoan(id: string): Promise<boolean> {
  try {
    await prisma.loan.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listInsurances(): Promise<Insurance[]> {
  const insurances = await prisma.insurance.findMany({ orderBy: { createdAt: "desc" } });
  return insurances.map(mapInsurance);
}

export async function createInsurance(insurance: Insurance): Promise<Insurance> {
  const createdInsurance = await prisma.insurance.create({
    data: {
      ...insurance,
      endDate: insurance.endDate ? toDate(insurance.endDate) : null,
      renewalDate: insurance.renewalDate ? toDate(insurance.renewalDate) : null,
      startDate: insurance.startDate ? toDate(insurance.startDate) : null
    }
  });
  return mapInsurance(createdInsurance);
}

export async function updateInsurance(id: string, patch: Omit<Insurance, "id">): Promise<Insurance | null> {
  try {
    const insurance = await prisma.insurance.update({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        renewalDate: patch.renewalDate ? toDate(patch.renewalDate) : null,
        startDate: patch.startDate ? toDate(patch.startDate) : null
      },
      where: { id }
    });
    return mapInsurance(insurance);
  } catch {
    return null;
  }
}

export async function deleteInsurance(id: string): Promise<boolean> {
  try {
    await prisma.insurance.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listGeneralContracts(): Promise<GeneralContract[]> {
  const contracts = await prisma.generalContract.findMany({ orderBy: { createdAt: "desc" } });
  return contracts.map(mapGeneralContract);
}

export async function createGeneralContract(contract: GeneralContract): Promise<GeneralContract> {
  const createdContract = await prisma.generalContract.create({
    data: {
      ...contract,
      endDate: contract.endDate ? toDate(contract.endDate) : null,
      note: contract.note || null,
      startDate: toDate(contract.startDate)
    }
  });
  return mapGeneralContract(createdContract);
}

export async function updateGeneralContract(
  id: string,
  patch: Omit<GeneralContract, "id">
): Promise<GeneralContract | null> {
  try {
    const contract = await prisma.generalContract.update({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        note: patch.note || null,
        startDate: toDate(patch.startDate)
      },
      where: { id }
    });
    return mapGeneralContract(contract);
  } catch {
    return null;
  }
}

export async function deleteGeneralContract(id: string): Promise<boolean> {
  try {
    await prisma.generalContract.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listIncomes(): Promise<Income[]> {
  const incomes = await prisma.income.findMany({ orderBy: { createdAt: "desc" } });
  return incomes.map(mapIncome);
}

export async function createIncome(income: Income): Promise<Income> {
  const createdIncome = await prisma.income.create({
    data: {
      ...income,
      date: toDate(income.date),
      entryDay: income.entryDay ?? null
    }
  });
  return mapIncome(createdIncome);
}

export async function updateIncome(id: string, patch: Omit<Income, "id">): Promise<Income | null> {
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

export async function deleteIncome(id: string): Promise<boolean> {
  try {
    await prisma.income.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listExpenses(): Promise<Expense[]> {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return expenses.map(mapExpense);
}

export async function createExpense(expense: Expense): Promise<Expense> {
  const createdExpense = await prisma.expense.create({
    data: {
      ...expense,
      date: toDate(expense.date)
    }
  });
  return mapExpense(createdExpense);
}

export async function updateExpense(id: string, patch: Omit<Expense, "id">): Promise<Expense | null> {
  try {
    const expense = await prisma.expense.update({
      data: {
        ...patch,
        date: toDate(patch.date)
      },
      where: { id }
    });
    return mapExpense(expense);
  } catch {
    return null;
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  try {
    await prisma.expense.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateFromMonthKey(monthKey?: string | null) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return new Date();
  }

  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

function getMonthKeyFromPaymentId(id: string) {
  const monthKey = id.split(":").at(-1);
  return /^\d{4}-\d{2}$/.test(monthKey ?? "") ? monthKey : null;
}

function getCurrentMonthDate(day: number, date = new Date()) {
  const safeDay = Math.min(Math.max(day, 1), 28);
  return new Date(date.getFullYear(), date.getMonth(), safeDay).toISOString();
}

function isSameOrBeforeCurrentMonth(startDate: Date, date = new Date()) {
  const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime();
  const currentMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  return startMonth <= currentMonth;
}

function isActiveInMonth(startValue: string | null | undefined, endValue: string | null | undefined, date = new Date()) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
  const start = startValue ? new Date(`${startValue}T00:00:00`) : null;
  const end = endValue ? new Date(`${endValue}T00:00:00`) : null;
  const startsBeforeMonthEnds = !start || start.getTime() <= monthEnd;
  const endsAfterMonthStarts = !end || end.getTime() >= monthStart;

  return startsBeforeMonthEnds && endsAfterMonthStarts;
}

function getPaymentStatus(db: FinanceDb, id: string) {
  return db.paymentConfirmations?.find((payment) => payment.id === id)?.paidAmount ?? 0;
}

export function buildMonthlyPayments(db: FinanceDb, date = new Date()): MonthlyPayment[] {
  const monthKey = getMonthKey(date);
  const loanPayments: MonthlyPayment[] = db.loans
    .filter((loan) => isSameOrBeforeCurrentMonth(new Date(`${loan.nextPayment}T00:00:00`), date))
    .filter((loan) => isActiveInMonth(loan.startDate ?? loan.nextPayment, loan.endDate, date))
    .map((loan) => {
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

  const insurancePayments: MonthlyPayment[] = db.insurances
    .filter((insurance) => isActiveInMonth(insurance.startDate, insurance.endDate ?? insurance.renewalDate, date))
    .map((insurance) => {
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

  const contractPayments: MonthlyPayment[] = (db.generalContracts ?? [])
    .filter((contract) => contract.status === "Aktiv")
    .filter((contract) => isSameOrBeforeCurrentMonth(new Date(`${contract.startDate}T00:00:00`), date))
    .filter((contract) => isActiveInMonth(contract.startDate, contract.endDate, date))
    .map((contract) => {
      const id = `contract:${contract.id}:${monthKey}`;

      return {
        amount: contract.monthlyAmount,
        category: contract.provider,
        dueDate: getCurrentMonthDate(contract.debitDay, date),
        id,
        paidAmount: getPaymentStatus(db, id),
        sourceType: "contract",
        title: contract.title
      };
    });

  return [...loanPayments, ...insurancePayments, ...recurringExpensePayments, ...contractPayments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

export async function getDashboardData(monthKey?: string | null) {
  const db = await readFinanceDb();
  const selectedDate = getDateFromMonthKey(monthKey);
  const monthlyPayments = buildMonthlyPayments(db, selectedDate);
  const incomeTotal = (db.incomes ?? [])
    .filter((income) => {
      if (income.recurring) {
        return true;
      }

      const incomeDate = new Date(`${income.date}T00:00:00`);
      return incomeDate.getFullYear() === selectedDate.getFullYear() && incomeDate.getMonth() === selectedDate.getMonth();
    })
    .reduce((sum, income) => sum + income.amount, 0);
  const monthlyExpenseTotal = db.expenses
    .filter((expense) => {
      if (expense.recurring) {
        return true;
      }

      const expenseDate = new Date(`${expense.date}T00:00:00`);
      return expenseDate.getFullYear() === selectedDate.getFullYear() && expenseDate.getMonth() === selectedDate.getMonth();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const loanTotal = db.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const insuranceTotal = db.insurances.reduce((sum, insurance) => sum + insurance.monthlyPremium, 0);
  const committed = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    month: getMonthKey(selectedDate),
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
  const payments = buildMonthlyPayments(db, getDateFromMonthKey(getMonthKeyFromPaymentId(id)));
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
