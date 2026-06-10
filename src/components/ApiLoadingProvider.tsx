"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const ApiLoadingContext = createContext(false);

export function ApiLoadingProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [pendingRequests, setPendingRequests] = useState(0);
  const isLoading = pendingRequests > 0;

  useEffect(() => {
    function startLoading() {
      setPendingRequests((current) => current + 1);
    }

    function stopLoading() {
      setPendingRequests((current) => Math.max(0, current - 1));
    }

    window.addEventListener("finance-api-loading-start", startLoading);
    window.addEventListener("finance-api-loading-end", stopLoading);

    return () => {
      window.removeEventListener("finance-api-loading-start", startLoading);
      window.removeEventListener("finance-api-loading-end", stopLoading);
    };
  }, []);

  const value = useMemo(() => isLoading, [isLoading]);

  return (
    <ApiLoadingContext.Provider value={value}>
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
