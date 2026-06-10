"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function GeneralContractsIntro() {
  const { t } = useLanguage();

  return (
    <section className="panel empty-contract-panel">
      <div className="settings-copy">
        <span>{t("contracts.generalLabel")}</span>
        <h2>{t("contracts.generalTitle")}</h2>
        <p>{t("contracts.generalDescription")}</p>
      </div>
    </section>
  );
}
