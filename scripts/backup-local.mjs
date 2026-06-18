import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_BACKUP_DIR = "/Volumes/Ali-Artif/finance-backup";

function loadEnvFile(path = ".env") {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

function getTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:]/g, "-");
}

async function exportFromDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Bitte .env prufen.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });

  try {
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

    return {
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
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function exportFromApp() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const secret = process.env.BACKUP_SECRET || process.env.UPDATE_BROADCAST_SECRET;

  if (!appUrl || !secret) {
    return null;
  }

  const response = await fetch(`${appUrl}/api/backups/export`, {
    headers: {
      "x-backup-secret": secret
    }
  });

  if (!response.ok) {
    throw new Error(`Backup export API failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  loadEnvFile();

  const backupDir = resolve(process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR);
  const backup = (await exportFromApp()) || (await exportFromDatabase());

  await mkdir(backupDir, { recursive: true });

  const filePath = resolve(backupDir, `fynest-backup-${getTimestamp()}.json`);
  await writeFile(filePath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

  console.log(`Backup written: ${filePath}`);
  console.log(JSON.stringify(backup.counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
