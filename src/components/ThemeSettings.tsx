"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeSettings() {
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
    <section className="settings-panel" aria-labelledby="theme-title">
      <div className="settings-copy">
        <span>Theme</span>
        <h2 id="theme-title">Farbmodus</h2>
        <p>Der dunkle Modus nutzt hohere Kontraste, ruhige Flachen und klare Akzentfarben.</p>
      </div>
      <div className="theme-switcher" role="group" aria-label="Farbmodus auswahlen">
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
  );
}
