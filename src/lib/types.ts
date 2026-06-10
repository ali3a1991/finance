export type Loan = {
  id: string;
  name: string;
  bank: string;
  balance: number;
  totalInterest: number;
  monthlyRate: number;
  interestRate: number;
  startDate: string | null;
  endDate: string | null;
  nextPayment: string;
  status: string;
};

export type Insurance = {
  id: string;
  name: string;
  provider: string;
  monthlyPremium: number;
  debitDay: number;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  coverage: string;
};

export type GeneralContract = {
  id: string;
  title: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  debitDay: number;
  startDate: string;
  endDate: string | null;
  note: string | null;
  status: string;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  recurring: boolean;
};

export type Income = {
  id: string;
  title: string;
  source: string;
  amount: number;
  date: string;
  recurring: boolean;
  entryDay?: number;
};

export type Investment = {
  id: string;
  assetName: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
};

export type InvestmentQuote = {
  currency: string;
  currentPrice: number | null;
  symbol: string;
};

export type InvestmentWithQuote = Investment & {
  currentPrice: number | null;
  currency: string;
};

export type MonthlyBudget = {
  category: string;
  planned: number;
  spent: number;
};

export type PaymentConfirmation = {
  id: string;
  paidAmount: number;
  updatedAt: string;
};

export type MonthlyPayment = {
  id: string;
  title: string;
  sourceType: "loan" | "insurance" | "expense" | "contract";
  category: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
};

export type AccessLevel = "readonly" | "readwrite";

export type SharedUser = {
  id: string;
  username: string;
  accessLevel: AccessLevel;
  ownerId: string;
  createdAt: string;
};

export type FinanceDb = {
  owner: {
    name: string;
    currency: string;
    monthlyNetIncome: number;
  };
  loans: Loan[];
  insurances: Insurance[];
  generalContracts?: GeneralContract[];
  incomes?: Income[];
  investments?: Investment[];
  expenses: Expense[];
  monthlyBudgets: MonthlyBudget[];
  paymentConfirmations?: PaymentConfirmation[];
};
