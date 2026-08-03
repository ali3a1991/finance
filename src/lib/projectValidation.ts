import type { ExpenseProjectInput, ProjectExpenseInput } from "@/lib/types";

function hasUniqueNames(values: string[]) {
  const normalized = values.map((value) => value.trim().toLocaleLowerCase());
  return new Set(normalized).size === normalized.length;
}

export function isValidProjectInput(input: ExpenseProjectInput) {
  return (
    Boolean(input.title?.trim()) &&
    Boolean(input.startDate) &&
    Array.isArray(input.categories) &&
    input.categories.length > 0 &&
    input.categories.every((category) => Boolean(category.name?.trim())) &&
    hasUniqueNames(input.categories.map((category) => category.name)) &&
    Array.isArray(input.members) &&
    input.members.length > 0 &&
    input.members.every(
      (member) => Boolean(member.name?.trim()) && Number.isFinite(member.shareWeight) && member.shareWeight > 0
    ) &&
    hasUniqueNames(input.members.map((member) => member.name))
  );
}

export function isValidProjectExpenseInput(input: ProjectExpenseInput) {
  return (
    Number.isFinite(input.amount) &&
    input.amount >= 0.01 &&
    Boolean(input.date) &&
    Boolean(input.categoryId) &&
    Boolean(input.paidByMemberId)
  );
}
