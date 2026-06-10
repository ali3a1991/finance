"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type ThemeMode = "light" | "dark";

export function ThemeSettings() {
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
    <div className="settings-stack">
      <section className="settings-panel" aria-labelledby="theme-title">
        <div className="settings-copy">
          <span>{t("settings.themeLabel")}</span>
          <h2 id="theme-title">{t("settings.themeTitle")}</h2>
          <p>{t("settings.themeDescription")}</p>
        </div>
        <div className="theme-switcher" role="group" aria-label={t("settings.themeGroup")}>
          <button
            className={`theme-choice ${theme === "light" ? "active" : ""}`}
            type="button"
            onClick={() => updateTheme("light")}
            aria-pressed={theme === "light"}
          >
            <Sun size={20} aria-hidden="true" />
            <span>Light</span>
          </button>
          <button
            className={`theme-choice ${theme === "dark" ? "active" : ""}`}
            type="button"
            onClick={() => updateTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <Moon size={20} aria-hidden="true" />
            <span>Dark</span>
          </button>
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="language-title">
        <div className="settings-copy">
          <span>{t("settings.languageLabel")}</span>
          <h2 id="language-title">{t("settings.languageTitle")}</h2>
          <p>{t("settings.languageDescription")}</p>
        </div>
        <div className="theme-switcher" role="group" aria-label={t("settings.languageGroup")}>
          <button
            className={`theme-choice ${language === "de" ? "active" : ""}`}
            type="button"
            onClick={() => setLanguage("de")}
            aria-pressed={language === "de"}
          >
            <span>DE</span>
            <span>{t("settings.german")}</span>
          </button>
          <button
            className={`theme-choice ${language === "en" ? "active" : ""}`}
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
          >
            <span>EN</span>
            <span>{t("settings.english")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
