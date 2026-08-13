"use client";

import { useLanguage } from "@/components/LanguageProvider";

type PageHeaderProps = {
  page:
    | "home"
    | "monthlyPayments"
    | "loans"
    | "insurances"
    | "incomes"
    | "expenses"
    | "projects"
    | "shoppingList"
    | "savings"
    | "investments"
    | "exchange"
    | "contractsGeneral"
    | "settings";
};

export function PageHeader({ page }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="page-header">
      <span>{t(`pages.${page}.eyebrow`)}</span>
    </header>
  );
}
