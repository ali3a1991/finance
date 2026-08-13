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
      <div className="page-header-label">
        <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        <span>{t(`pages.${page}.eyebrow`)}</span>
      </div>
    </header>
  );
}
