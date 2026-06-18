import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.BACKUP_SECRET || process.env.UPDATE_BROADCAST_SECRET;
  return Boolean(secret && request.headers.get("x-backup-secret") === secret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  const loans = await prisma.loan.findMany();
  const insurances = await prisma.insurance.findMany();
  const generalContracts = await prisma.generalContract.findMany();
  const incomes = await prisma.income.findMany();
  const expenses = await prisma.expense.findMany();
  const investments = await prisma.investment.findMany();
  const savingsGoals = await prisma.savingsGoal.findMany();
  const savingsTransactions = await prisma.savingsTransaction.findMany();
  const monthlyBudgets = await prisma.monthlyBudget.findMany();
  const monthlyCarryOvers = await prisma.monthlyCarryOver.findMany();
  const paymentConfirmations = await prisma.paymentConfirmation.findMany();
  const appUsers = await prisma.appUser.findMany();
  const telegramContacts = await prisma.telegramContact.findMany();

  return NextResponse.json({
    app: "FyNest",
    createdAt: new Date().toISOString(),
    formatVersion: 1,
    tables: {
      appUsers,
      expenses,
      generalContracts,
      incomes,
      insurances,
      investments,
      loans,
      monthlyBudgets,
      monthlyCarryOvers,
      paymentConfirmations,
      savingsGoals,
      savingsTransactions,
      telegramContacts
    },
    counts: {
      appUsers: appUsers.length,
      expenses: expenses.length,
      generalContracts: generalContracts.length,
      incomes: incomes.length,
      insurances: insurances.length,
      investments: investments.length,
      loans: loans.length,
      monthlyBudgets: monthlyBudgets.length,
      monthlyCarryOvers: monthlyCarryOvers.length,
      paymentConfirmations: paymentConfirmations.length,
      savingsGoals: savingsGoals.length,
      savingsTransactions: savingsTransactions.length,
      telegramContacts: telegramContacts.length
    }
  });
}
