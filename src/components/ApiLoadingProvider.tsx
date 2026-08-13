"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { getApiLoadingSnapshot, subscribeApiLoading } from "@/lib/requestJson";

const ApiLoadingContext = createContext(false);

export function ApiLoadingProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const isLoading = useSyncExternalStore(subscribeApiLoading, getApiLoadingSnapshot, () => false);

  return (
    <ApiLoadingContext.Provider value={isLoading}>
      {children}
      {isLoading ? (
        <div className="api-loading-overlay" role="status" aria-live="polite" aria-label={t("loading.data")}>
          <div className="api-loading-card">
            <div className="api-loading-spinner" aria-hidden="true" />
            <span>{t("loading.wait")}</span>
          </div>
        </div>
      ) : null}
    </ApiLoadingContext.Provider>
  );
}

export function useApiLoading() {
  return useContext(ApiLoadingContext);
}
