"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type ThemeMode = "light" | "dark";

export function PublicPreferences() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("finance-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("finance-theme", nextTheme);
  }

  return (
    <div className="public-preferences" aria-label={t("auth.preferences")}>
      <div className="public-preference-group" role="group" aria-label={t("settings.themeGroup")}>
        <button
          className={`public-preference-button ${theme === "light" ? "active" : ""}`}
          type="button"
          onClick={() => updateTheme("light")}
          aria-pressed={theme === "light"}
        >
          <Sun size={16} aria-hidden="true" />
          <span>Light</span>
        </button>
        <button
          className={`public-preference-button ${theme === "dark" ? "active" : ""}`}
          type="button"
          onClick={() => updateTheme("dark")}
          aria-pressed={theme === "dark"}
        >
          <Moon size={16} aria-hidden="true" />
          <span>Dark</span>
        </button>
      </div>

      <div className="public-preference-group" role="group" aria-label={t("settings.languageGroup")}>
        <button
          className={`public-preference-button ${language === "de" ? "active" : ""}`}
          type="button"
          onClick={() => setLanguage("de")}
          aria-pressed={language === "de"}
        >
          DE
        </button>
        <button
          className={`public-preference-button ${language === "en" ? "active" : ""}`}
          type="button"
          onClick={() => setLanguage("en")}
          aria-pressed={language === "en"}
        >
          EN
        </button>
      </div>
    </div>
  );
}
