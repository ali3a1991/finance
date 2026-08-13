export const ACTION_PERMISSION_GROUPS = [
  { section: "monthlyPayments", actions: ["dashboard.payments.update"] },
  { section: "incomes", actions: ["incomes.create", "incomes.edit", "incomes.delete", "incomes.carryover"] },
  { section: "expenses", actions: ["expenses.create", "expenses.edit", "expenses.delete"] },
  { section: "savings", actions: ["savings.goals.create", "savings.goals.edit", "savings.goals.delete", "savings.deposit", "savings.withdraw", "savings.transactions.edit", "savings.transactions.delete"] },
  { section: "investments", actions: ["investments.create", "investments.edit", "investments.delete"] },
  { section: "shopping", actions: ["shopping.create", "shopping.edit", "shopping.complete", "shopping.delete"] },
  { section: "projects", actions: ["projects.create", "projects.edit", "projects.delete", "projects.expenses.create", "projects.expenses.edit", "projects.expenses.delete"] },
  { section: "insurances", actions: ["insurances.create", "insurances.edit", "insurances.delete"] },
  { section: "loans", actions: ["loans.create", "loans.edit", "loans.delete"] },
  { section: "contracts", actions: ["contracts.create", "contracts.edit", "contracts.delete"] }
] as const;

export type ActionPermission = (typeof ACTION_PERMISSION_GROUPS)[number]["actions"][number];

export const ALL_ACTION_PERMISSIONS = ACTION_PERMISSION_GROUPS.flatMap((group) => group.actions) as ActionPermission[];

export function isActionPermission(value: unknown): value is ActionPermission {
  return typeof value === "string" && ALL_ACTION_PERMISSIONS.includes(value as ActionPermission);
}

export function permissionActionName(permission: ActionPermission) {
  if (permission === "dashboard.payments.update") return "updatePayments";
  if (permission === "incomes.carryover") return "updateCarryover";
  if (permission === "savings.deposit") return "deposit";
  if (permission === "savings.withdraw") return "withdraw";
  if (permission === "shopping.complete") return "complete";
  const parts = permission.split(".");
  const action = parts.at(-1)!;
  return parts.includes("transactions") ? `${action}Transaction` : parts.includes("expenses") && parts[0] === "projects" ? `${action}ProjectExpense` : action;
}
