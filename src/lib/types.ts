export type Loan = {
  id: string;
  name: string;
  bank: string;
  balance: number;
  totalInterest: number;
  monthlyRate: number;
  interestRate: number;
  nextPayment: string;
  status: string;
};

export type Insurance = {
  id: string;
  name: string;
  provider: string;
  monthlyPremium: number;
  debitDay: number;
  renewalDate: string | null;
  coverage: string;
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
  sourceType: "loan" | "insurance" | "expense";
  category: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
};

export type FinanceDb = {
  owner: {
    name: string;
    currency: string;
    monthlyNetIncome: number;
  };
  loans: Loan[];
  insurances: Insurance[];
  incomes?: Income[];
  expenses: Expense[];
  monthlyBudgets: MonthlyBudget[];
  paymentConfirmations?: PaymentConfirmation[];
};
