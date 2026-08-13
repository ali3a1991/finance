"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

export function LogoutSettings() {
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await requestJson("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      window.localStorage.removeItem("finance_token");
      window.location.href = "/login";
    }
  }

  return (
    <section className="settings-panel logout-settings-panel" aria-label={t("settings.logout")}>
      <button className="button danger" type="button" onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut size={18} aria-hidden="true" />
        {isLoggingOut ? t("settings.loggingOut") : t("settings.logout")}
      </button>
    </section>
  );
}
