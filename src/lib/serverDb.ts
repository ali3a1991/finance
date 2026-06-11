import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getPasswordHash } from "@/lib/auth";
import type {
  AccessLevel,
  Expense,
  FinanceDb,
  GeneralContract,
  Income,
  Insurance,
  Investment,
  InvestmentQuote,
  InvestmentWithQuote,
  Loan,
  MonthlyPayment,
  SharedUser
} from "@/lib/types";

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

function mapInvestment(investment: {
  id: string;
  assetName: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
}): Investment {
  return {
    ...investment,
    purchaseDate: toDateInput(investment.purchaseDate)
  };
}

export async function readFinanceDb(ownerId: string): Promise<FinanceDb> {
  const [loans, insurances, generalContracts, incomes, expenses, investments, monthlyBudgets, paymentConfirmations] =
    await Promise.all([
    prisma.loan.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.insurance.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.generalContract.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.income.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.investment.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } }),
    prisma.monthlyBudget.findMany({ orderBy: { category: "asc" }, where: { ownerId } }),
    prisma.paymentConfirmation.findMany({ where: { ownerId } })
  ]);

  return {
    expenses: expenses.map(mapExpense),
    generalContracts: generalContracts.map(mapGeneralContract),
    incomes: incomes.map(mapIncome),
    investments: investments.map(mapInvestment),
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

export async function listLoans(ownerId: string): Promise<Loan[]> {
  const loans = await prisma.loan.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } });
  return loans.map(mapLoan);
}

export async function createLoan(ownerId: string, loan: Loan): Promise<Loan> {
  const createdLoan = await prisma.loan.create({
    data: {
      ...loan,
      endDate: loan.endDate ? toDate(loan.endDate) : null,
      nextPayment: toDate(loan.nextPayment),
      ownerId,
      startDate: loan.startDate ? toDate(loan.startDate) : null
    }
  });
  return mapLoan(createdLoan);
}

export async function updateLoan(ownerId: string, id: string, patch: Omit<Loan, "id" | "status">): Promise<Loan | null> {
  try {
    const result = await prisma.loan.updateMany({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        nextPayment: toDate(patch.nextPayment),
        startDate: patch.startDate ? toDate(patch.startDate) : null
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const loan = await prisma.loan.findFirst({ where: { id, ownerId } });
    if (!loan) {
      return null;
    }

    return mapLoan(loan);
  } catch {
    return null;
  }
}

export async function deleteLoan(ownerId: string, id: string): Promise<boolean> {
  try {
    const result = await prisma.loan.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listInsurances(ownerId: string): Promise<Insurance[]> {
  const insurances = await prisma.insurance.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } });
  return insurances.map(mapInsurance);
}

export async function createInsurance(ownerId: string, insurance: Insurance): Promise<Insurance> {
  const createdInsurance = await prisma.insurance.create({
    data: {
      ...insurance,
      endDate: insurance.endDate ? toDate(insurance.endDate) : null,
      ownerId,
      renewalDate: insurance.renewalDate ? toDate(insurance.renewalDate) : null,
      startDate: insurance.startDate ? toDate(insurance.startDate) : null
    }
  });
  return mapInsurance(createdInsurance);
}

export async function updateInsurance(ownerId: string, id: string, patch: Omit<Insurance, "id">): Promise<Insurance | null> {
  try {
    const result = await prisma.insurance.updateMany({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        renewalDate: patch.renewalDate ? toDate(patch.renewalDate) : null,
        startDate: patch.startDate ? toDate(patch.startDate) : null
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const insurance = await prisma.insurance.findFirst({ where: { id, ownerId } });
    if (!insurance) {
      return null;
    }

    return mapInsurance(insurance);
  } catch {
    return null;
  }
}

export async function deleteInsurance(ownerId: string, id: string): Promise<boolean> {
  try {
    const result = await prisma.insurance.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listGeneralContracts(ownerId: string): Promise<GeneralContract[]> {
  const contracts = await prisma.generalContract.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } });
  return contracts.map(mapGeneralContract);
}

export async function createGeneralContract(ownerId: string, contract: GeneralContract): Promise<GeneralContract> {
  const createdContract = await prisma.generalContract.create({
    data: {
      ...contract,
      endDate: contract.endDate ? toDate(contract.endDate) : null,
      note: contract.note || null,
      ownerId,
      startDate: toDate(contract.startDate)
    }
  });
  return mapGeneralContract(createdContract);
}

export async function updateGeneralContract(
  ownerId: string,
  id: string,
  patch: Omit<GeneralContract, "id">
): Promise<GeneralContract | null> {
  try {
    const result = await prisma.generalContract.updateMany({
      data: {
        ...patch,
        endDate: patch.endDate ? toDate(patch.endDate) : null,
        note: patch.note || null,
        startDate: toDate(patch.startDate)
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const contract = await prisma.generalContract.findFirst({ where: { id, ownerId } });
    if (!contract) {
      return null;
    }

    return mapGeneralContract(contract);
  } catch {
    return null;
  }
}

export async function deleteGeneralContract(ownerId: string, id: string): Promise<boolean> {
  try {
    const result = await prisma.generalContract.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listIncomes(ownerId: string): Promise<Income[]> {
  const incomes = await prisma.income.findMany({ orderBy: { createdAt: "desc" }, where: { ownerId } });
  return incomes.map(mapIncome);
}

export async function createIncome(ownerId: string, income: Income): Promise<Income> {
  const createdIncome = await prisma.income.create({
    data: {
      ...income,
      date: toDate(income.date),
      entryDay: income.entryDay ?? null,
      ownerId
    }
  });
  return mapIncome(createdIncome);
}

export async function updateIncome(ownerId: string, id: string, patch: Omit<Income, "id">): Promise<Income | null> {
  try {
    const result = await prisma.income.updateMany({
      data: {
        ...patch,
        date: toDate(patch.date),
        entryDay: patch.entryDay ?? null
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const income = await prisma.income.findFirst({ where: { id, ownerId } });
    if (!income) {
      return null;
    }

    return mapIncome(income);
  } catch {
    return null;
  }
}

export async function deleteIncome(ownerId: string, id: string): Promise<boolean> {
  try {
    const result = await prisma.income.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listExpenses(ownerId: string): Promise<Expense[]> {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" }, where: { ownerId } });
  return expenses.map(mapExpense);
}

export async function createExpense(ownerId: string, expense: Expense): Promise<Expense> {
  const createdExpense = await prisma.expense.create({
    data: {
      ...expense,
      date: toDate(expense.date),
      ownerId
    }
  });
  return mapExpense(createdExpense);
}

export async function updateExpense(ownerId: string, id: string, patch: Omit<Expense, "id">): Promise<Expense | null> {
  try {
    const result = await prisma.expense.updateMany({
      data: {
        ...patch,
        date: toDate(patch.date)
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const expense = await prisma.expense.findFirst({ where: { id, ownerId } });
    if (!expense) {
      return null;
    }

    return mapExpense(expense);
  } catch {
    return null;
  }
}

export async function deleteExpense(ownerId: string, id: string): Promise<boolean> {
  try {
    const result = await prisma.expense.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listInvestments(ownerId: string): Promise<Investment[]> {
  const investments = await prisma.investment.findMany({
    orderBy: { createdAt: "desc" },
    where: { ownerId }
  });
  return investments.map(mapInvestment);
}

export async function createInvestment(ownerId: string, investment: Investment): Promise<Investment> {
  const createdInvestment = await prisma.investment.create({
    data: {
      ...investment,
      ownerId,
      purchaseDate: toDate(investment.purchaseDate),
      symbol: investment.symbol.toUpperCase()
    }
  });
  return mapInvestment(createdInvestment);
}

export async function updateInvestment(ownerId: string, id: string, patch: Omit<Investment, "id">): Promise<Investment | null> {
  try {
    const result = await prisma.investment.updateMany({
      data: {
        ...patch,
        assetName: patch.assetName.trim(),
        purchaseDate: toDate(patch.purchaseDate),
        symbol: patch.symbol.trim().toUpperCase()
      },
      where: { id, ownerId }
    });

    if (result.count === 0) {
      return null;
    }

    const updatedInvestment = await prisma.investment.findFirst({ where: { id, ownerId } });
    return updatedInvestment ? mapInvestment(updatedInvestment) : null;
  } catch {
    return null;
  }
}

export async function deleteInvestment(ownerId: string, id: string): Promise<boolean> {
  const result = await prisma.investment.deleteMany({ where: { id, ownerId } });
  return result.count > 0;
}

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        symbol?: string;
      };
    }>;
  };
};

const investmentQuoteAliases: Record<string, string> = {
  SPY: "SXR8.SG",
  SXR8: "SXR8.SG",
  "SXR8.DE": "SXR8.SG"
};

const investmentDisplayAliases: Record<string, Pick<Investment, "assetName" | "symbol">> = {
  SPY: {
    assetName: "S&P 500",
    symbol: "SXR8"
  },
  SXR8: {
    assetName: "S&P 500",
    symbol: "SXR8"
  },
  "SXR8.DE": {
    assetName: "S&P 500",
    symbol: "SXR8"
  }
};

function getInvestmentQuoteSymbol(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  return investmentQuoteAliases[normalizedSymbol] ?? normalizedSymbol;
}

function getInvestmentDisplay(symbol: string) {
  return investmentDisplayAliases[symbol.toUpperCase()] ?? null;
}

async function fetchYahooChartMeta(symbol: string) {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as YahooChartResponse;
  return body.chart?.result?.[0]?.meta ?? null;
}

async function fetchUsdToEurRate() {
  try {
    const meta = await fetchYahooChartMeta("EURUSD=X");
    const eurUsdRate = meta?.regularMarketPrice;

    if (typeof eurUsdRate !== "number" || eurUsdRate <= 0) {
      return null;
    }

    return 1 / eurUsdRate;
  } catch {
    return null;
  }
}

export async function fetchInvestmentQuotes(symbols: string[]): Promise<Record<string, InvestmentQuote>> {
  const uniqueSymbols = Array.from(new Set(symbols.map(getInvestmentQuoteSymbol).filter(Boolean)));

  if (uniqueSymbols.length === 0) {
    return {};
  }

  const usdToEurRate = await fetchUsdToEurRate();
  const quoteEntries = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        const meta = await fetchYahooChartMeta(symbol);
        const quoteSymbol = meta?.symbol?.toUpperCase() ?? symbol;
        const quoteCurrency = meta?.currency?.toUpperCase() ?? "USD";
        const rawPrice = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
        const currentPrice =
          rawPrice === null
            ? null
            : quoteCurrency === "EUR"
              ? rawPrice
              : quoteCurrency === "USD" && usdToEurRate
                ? rawPrice * usdToEurRate
                : null;

        return [
          quoteSymbol,
          {
            currency: "EUR",
            currentPrice,
            symbol: quoteSymbol
          }
        ] as const;
      } catch {
        return null;
      }
    })
  );

  return Object.fromEntries(quoteEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)));
}

export async function listInvestmentsWithQuotes(ownerId: string): Promise<InvestmentWithQuote[]> {
  const investments = await listInvestments(ownerId);
  const quotes = await fetchInvestmentQuotes(investments.map((investment) => investment.symbol));

  return investments.map((investment) => {
    const quoteSymbol = getInvestmentQuoteSymbol(investment.symbol);
    const quote = quotes[quoteSymbol];
    const display = getInvestmentDisplay(investment.symbol);

    return {
      ...investment,
      assetName: display?.assetName ?? investment.assetName,
      currency: quote?.currency ?? "EUR",
      currentPrice: quote?.currentPrice ?? null,
      symbol: display?.symbol ?? investment.symbol
    };
  });
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
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDayOfMonth);
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

function hasDebitDateReachedStart(startValue: string | null | undefined, debitDay: number, date = new Date()) {
  if (!startValue) {
    return true;
  }

  const start = new Date(`${startValue}T00:00:00`);

  if (start.getFullYear() !== date.getFullYear() || start.getMonth() !== date.getMonth()) {
    return true;
  }

  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const safeDebitDay = Math.min(Math.max(debitDay, 1), lastDayOfMonth);
  return safeDebitDay >= start.getDate();
}

function getPaymentStatus(db: FinanceDb, id: string) {
  return db.paymentConfirmations?.find((payment) => payment.id === id)?.paidAmount ?? 0;
}

export function buildMonthlyPayments(db: FinanceDb, date = new Date()): MonthlyPayment[] {
  const monthKey = getMonthKey(date);
  const loanPayments: MonthlyPayment[] = db.loans
    .filter((loan) => isSameOrBeforeCurrentMonth(new Date(`${loan.nextPayment}T00:00:00`), date))
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
    .filter((insurance) => hasDebitDateReachedStart(insurance.startDate, insurance.debitDay, date))
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
    .filter((contract) => hasDebitDateReachedStart(contract.startDate, contract.debitDay, date))
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

export async function getDashboardData(ownerId: string, monthKey?: string | null) {
  const db = await readFinanceDb(ownerId);
  const selectedDate = getDateFromMonthKey(monthKey);
  const monthlyPayments = buildMonthlyPayments(db, selectedDate);
  const investmentQuotes = await fetchInvestmentQuotes((db.investments ?? []).map((investment) => investment.symbol));
  const investmentSummary = (db.investments ?? []).reduce(
    (summary, investment) => {
      const investedValue = investment.quantity * investment.purchasePrice;
      const quote = investmentQuotes[getInvestmentQuoteSymbol(investment.symbol)];
      const currentUnitPrice = quote?.currentPrice ?? investment.purchasePrice;
      const currentValue = investment.quantity * currentUnitPrice;

      return {
        currentTotal: summary.currentTotal + currentValue,
        investedTotal: summary.investedTotal + investedValue,
        itemCount: summary.itemCount + 1
      };
    },
    { currentTotal: 0, investedTotal: 0, itemCount: 0 }
  );
  const investmentResult = investmentSummary.currentTotal - investmentSummary.investedTotal;
  const investmentReturnRate =
    investmentSummary.investedTotal > 0 ? (investmentResult / investmentSummary.investedTotal) * 100 : 0;
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
      investmentCurrentTotal: investmentSummary.currentTotal,
      investmentInvestedTotal: investmentSummary.investedTotal,
      investmentItemCount: investmentSummary.itemCount,
      investmentResult,
      investmentReturnRate,
      loanCount: db.loans.length,
      loanTotal,
      monthlyExpenseTotal
    }
  };
}

export async function updateMonthlyPayment(ownerId: string, id: string, paidAmount: number) {
  const db = await readFinanceDb(ownerId);
  const payments = buildMonthlyPayments(db, getDateFromMonthKey(getMonthKeyFromPaymentId(id)));
  const payment = payments.find((item) => item.id === id);

  if (!payment) {
    return null;
  }

  const normalizedPaidAmount = Math.max(0, Math.min(paidAmount, payment.amount));
  const confirmation = await prisma.paymentConfirmation.upsert({
    create: {
      id,
      ownerId,
      paidAmount: normalizedPaidAmount
    },
    update: {
      paidAmount: normalizedPaidAmount
    },
    where: { id }
  });

  return { ...payment, paidAmount: confirmation.paidAmount };
}

function mapSharedUser(user: {
  id: string;
  username: string;
  accessLevel: string;
  ownerId: string;
  createdAt: Date;
}): SharedUser {
  return {
    accessLevel: user.accessLevel === "readonly" ? "readonly" : "readwrite",
    createdAt: user.createdAt.toISOString(),
    id: user.id,
    ownerId: user.ownerId,
    username: user.username
  };
}

export async function listSharedUsers(ownerId: string): Promise<SharedUser[]> {
  const users = await prisma.appUser.findMany({
    orderBy: { createdAt: "desc" },
    where: { ownerId }
  });

  return users.map(mapSharedUser);
}

export async function createSharedUser({
  accessLevel,
  ownerId,
  password,
  username
}: {
  accessLevel: AccessLevel;
  ownerId: string;
  password: string;
  username: string;
}): Promise<SharedUser> {
  const user = await prisma.appUser.create({
    data: {
      accessLevel,
      ownerId,
      passwordHash: getPasswordHash(password),
      username
    }
  });

  return mapSharedUser(user);
}

export async function updateSharedUser(
  ownerId: string,
  id: string,
  patch: {
    accessLevel: AccessLevel;
    password?: string;
    username: string;
  }
): Promise<SharedUser | null> {
  const result = await prisma.appUser.updateMany({
    data: {
      accessLevel: patch.accessLevel,
      passwordHash: patch.password ? getPasswordHash(patch.password) : undefined,
      username: patch.username
    },
    where: { id, ownerId }
  });

  if (result.count === 0) {
    return null;
  }

  const user = await prisma.appUser.findFirst({ where: { id, ownerId } });
  return user ? mapSharedUser(user) : null;
}

export async function deleteSharedUser(ownerId: string, id: string) {
  const result = await prisma.appUser.deleteMany({ where: { id, ownerId } });
  return result.count > 0;
}

export async function findRegistrationAccount(username: string) {
  return prisma.appUser.findUnique({ where: { username } });
}

async function ensureRegistrationTables() {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "RegistrationChallenge" ("id" TEXT PRIMARY KEY, "username" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "telegramContact" TEXT NOT NULL, "code" TEXT NOT NULL DEFAULT \'\', "codeHash" TEXT NOT NULL, "transferSharedUserId" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "RegistrationChallenge" ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL DEFAULT \'\''
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "TelegramContact" ("id" TEXT PRIMARY KEY, "username" TEXT NOT NULL UNIQUE, "contact" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "PasswordResetChallenge" ("id" TEXT PRIMARY KEY, "username" TEXT NOT NULL, "codeHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  );
}

export async function createRegistrationChallenge({
  code,
  password,
  telegramContact,
  transferSharedUserId,
  username
}: {
  code: string;
  password: string;
  telegramContact: string;
  transferSharedUserId?: string;
  username: string;
}) {
  await ensureRegistrationTables();
  await prisma.registrationChallenge.deleteMany({ where: { username } });

  return prisma.registrationChallenge.create({
    data: {
      code,
      codeHash: getPasswordHash(code),
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      id: `reg_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      passwordHash: getPasswordHash(password),
      telegramContact,
      transferSharedUserId,
      username
    }
  });
}

export async function activateRegistrationChallenge(challengeId: string, telegramContact: string) {
  await ensureRegistrationTables();
  const challenge = await prisma.registrationChallenge.findUnique({ where: { id: challengeId } });

  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await prisma.registrationChallenge.update({
    data: { telegramContact },
    where: { id: challengeId }
  });

  return {
    code: challenge.code,
    username: challenge.username
  };
}

export async function completeRegistration(challengeId: string, code: string) {
  await ensureRegistrationTables();
  const challenge = await prisma.registrationChallenge.findUnique({ where: { id: challengeId } });

  if (!challenge || challenge.expiresAt.getTime() < Date.now() || challenge.codeHash !== getPasswordHash(code)) {
    return null;
  }

  const ownerId = `owner-${randomUUID()}`;

  return prisma.$transaction(async (tx) => {
    if (challenge.transferSharedUserId) {
      await tx.appUser.deleteMany({
        where: {
          accessLevel: { not: "owner" },
          id: challenge.transferSharedUserId
        }
      });
    }

    const existingOwner = await tx.appUser.findUnique({ where: { username: challenge.username } });

    if (existingOwner?.accessLevel === "owner") {
      await tx.registrationChallenge.delete({ where: { id: challenge.id } });
      return null;
    }

    if (existingOwner) {
      await tx.appUser.delete({ where: { id: existingOwner.id } });
    }

    const user = await tx.appUser.create({
      data: {
        accessLevel: "owner",
        ownerId,
        passwordHash: challenge.passwordHash,
        username: challenge.username
      }
    });

    await tx.telegramContact.upsert({
      create: {
        contact: challenge.telegramContact,
        username: challenge.username
      },
      update: {
        contact: challenge.telegramContact
      },
      where: { username: challenge.username }
    });

    await tx.registrationChallenge.delete({ where: { id: challenge.id } });

    return {
      accessLevel: "owner" as const,
      ownerId: user.ownerId,
      username: user.username
    };
  });
}

export async function listTelegramContacts() {
  await ensureRegistrationTables();
  return prisma.telegramContact.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      contact: true,
      username: true
    }
  });
}

export async function createPasswordResetChallenge(username: string, code: string) {
  await ensureRegistrationTables();
  const [user, contact] = await Promise.all([
    prisma.appUser.findUnique({ where: { username } }),
    prisma.telegramContact.findUnique({ where: { username } })
  ]);

  if (!user || !contact) {
    return null;
  }

  await prisma.passwordResetChallenge.deleteMany({ where: { username } });

  const challenge = await prisma.passwordResetChallenge.create({
    data: {
      codeHash: getPasswordHash(code),
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      id: `reset_${randomUUID().replace(/-/g, "").slice(0, 22)}`,
      username
    }
  });

  return {
    challengeId: challenge.id,
    contact: contact.contact
  };
}

export async function completePasswordReset(challengeId: string, code: string, password: string) {
  await ensureRegistrationTables();
  const challenge = await prisma.passwordResetChallenge.findUnique({ where: { id: challengeId } });

  if (!challenge || challenge.expiresAt.getTime() < Date.now() || challenge.codeHash !== getPasswordHash(code)) {
    return false;
  }

  await prisma.$transaction([
    prisma.appUser.update({
      data: { passwordHash: getPasswordHash(password) },
      where: { username: challenge.username }
    }),
    prisma.passwordResetChallenge.delete({ where: { id: challenge.id } })
  ]);

  return true;
}
