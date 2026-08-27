"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { pageIcons, type PageKey } from "@/lib/navigation";

type PageHeaderProps = {
  page: PageKey;
};

export function PageHeader({ page }: PageHeaderProps) {
  const { t } = useLanguage();
  const Icon = pageIcons[page];

  return (
    <header className="page-header">
      <div className="page-header-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div className="page-header-copy">
        <span>{t(`pages.${page}.eyebrow`)}</span>
        <h1>{t(`pages.${page}.title`)}</h1>
        <p>{t(`pages.${page}.description`)}</p>
      </div>
    </header>
  );
}
