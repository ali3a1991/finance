"use client";

import { useLanguage } from "@/components/LanguageProvider";

type PageHeaderProps = {
  page: "home" | "loans" | "insurances" | "incomes" | "expenses" | "investments" | "contractsGeneral" | "settings";
};

export function PageHeader({ page }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="page-header">
      <span>{t(`pages.${page}.eyebrow`)}</span>
      <h1>{t(`pages.${page}.title`)}</h1>
      <p>{t(`pages.${page}.description`)}</p>
    </header>
  );
}
