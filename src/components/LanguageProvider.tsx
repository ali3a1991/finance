"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "de" | "en";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

const translations = {
  de: {
    app: {
      brand: "Finanzmanager",
      cockpit: "Privates Cockpit"
    },
    nav: {
      home: "Startseite",
      loans: "Kredite",
      insurances: "Versicherungen",
      incomes: "Einnahmen",
      expenses: "Ausgaben",
      settings: "Einstellungen",
      openMenu: "Menu offnen",
      closeMenu: "Menu schliessen",
      main: "Hauptnavigation"
    },
    pages: {
      home: {
        eyebrow: "Startseite",
        title: "Finanzen klar im Blick.",
        description: "Ein ruhiges Dashboard fur Kredite, Versicherungen, Ausgaben und monatliche Planung."
      },
      loans: {
        eyebrow: "Kredite",
        title: "Kreditverpflichtungen verwalten.",
        description: "Alle laufenden Kredite mit Betrag, Gesamtzinsen, Rate und erster Zahlung."
      },
      insurances: {
        eyebrow: "Versicherungen",
        title: "Policen, Kosten und Laufzeiten.",
        description: "Eine kompakte Ubersicht uber Pramien, Anbieter und Verlangerungen."
      },
      incomes: {
        eyebrow: "Einnahmen",
        title: "Geldzuflusse verwalten.",
        description: "Feste Einkommen und einmalige Eingange werden getrennt erfasst."
      },
      expenses: {
        eyebrow: "Ausgaben",
        title: "Ausgaben erfassen und auswerten.",
        description: "Ausgaben werden nach einmaligen und wiederkehrenden Buchungen getrennt."
      },
      expenseCapture: {
        eyebrow: "Ausgaben / Erfassung",
        title: "Neue Ausgabe eintragen.",
        description: "Ein klares Formular fur schnelle Testbuchungen im Finanzmanager."
      },
      settings: {
        eyebrow: "Einstellungen",
        title: "Darstellung anpassen.",
        description: "Wechsle Theme und Sprache fur eine angenehme, gut lesbare Ansicht."
      }
    },
    dashboard: {
      monthPicker: "Monat auswahlen",
      previousMonth: "Vorheriger Monat",
      nextMonth: "Nachster Monat",
      currentMonth: "Aktueller Monat",
      selectedMonth: "Ausgewahlter Monat",
      today: "Heute",
      compass: "Monatskompass",
      gaugeTitle: "Einnahmen gegen Zahlungen",
      relaxed: "Entspannt",
      attentive: "Aufmerksam bleiben",
      critical: "Kritisch",
      noIncome: "Keine Einnahmen",
      used: "genutzt",
      income: "Einnahmen",
      payments: "Zahlungen",
      monthlyExpenses: "Monatliche Ausgaben",
      currentBookings: "Aktuelle Buchungen",
      loanAmount: "Kreditbetrag",
      activeLoans: "aktive Kredite",
      insurances: "Versicherungen",
      monthlyPremiums: "Monatliche Pramien",
      freeAmount: "Freier Betrag",
      afterFixedPayments: "Nach festen Zahlungen",
      loadingPayments: "Zahlungen werden geladen...",
      noPayments: "Fur diesen Monat sind noch keine Zahlungen vorhanden.",
      markPaid: "als bezahlt markieren",
      updating: "Aktualisiert...",
      paid: "Bezahlt",
      partiallyPaid: "Teilweise bezahlt",
      open: "Offen",
      paidAmount: "Bezahlt",
      savePaidAmount: "bezahlten Betrag speichern"
    },
    settings: {
      themeLabel: "Theme",
      themeTitle: "Farbmodus",
      themeDescription: "Der dunkle Modus nutzt hohere Kontraste, ruhige Flachen und klare Akzentfarben.",
      themeGroup: "Farbmodus auswahlen",
      languageLabel: "Sprache",
      languageTitle: "App-Sprache",
      languageDescription: "Wechsle die wichtigsten Bereiche der App zwischen Deutsch und Englisch.",
      languageGroup: "Sprache auswahlen",
      german: "Deutsch",
      english: "Englisch"
    }
  },
  en: {
    app: {
      brand: "Finance Manager",
      cockpit: "Private cockpit"
    },
    nav: {
      home: "Home",
      loans: "Loans",
      insurances: "Insurance",
      incomes: "Income",
      expenses: "Expenses",
      settings: "Settings",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      main: "Main navigation"
    },
    pages: {
      home: {
        eyebrow: "Home",
        title: "Your finances at a glance.",
        description: "A calm dashboard for loans, insurance, expenses and monthly planning."
      },
      loans: {
        eyebrow: "Loans",
        title: "Manage loan obligations.",
        description: "All active loans with principal, total interest, installment and first payment."
      },
      insurances: {
        eyebrow: "Insurance",
        title: "Policies, costs and terms.",
        description: "A compact overview of premiums, providers and renewals."
      },
      incomes: {
        eyebrow: "Income",
        title: "Manage incoming money.",
        description: "Fixed income and one-time inflows are tracked separately."
      },
      expenses: {
        eyebrow: "Expenses",
        title: "Track and review expenses.",
        description: "Expenses are separated into one-time and recurring bookings."
      },
      expenseCapture: {
        eyebrow: "Expenses / Capture",
        title: "Add a new expense.",
        description: "A clear form for quick test bookings in the finance manager."
      },
      settings: {
        eyebrow: "Settings",
        title: "Adjust appearance.",
        description: "Switch theme and language for a comfortable, readable experience."
      }
    },
    dashboard: {
      monthPicker: "Select month",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      currentMonth: "Current month",
      selectedMonth: "Selected month",
      today: "Today",
      compass: "Monthly compass",
      gaugeTitle: "Income versus payments",
      relaxed: "Relaxed",
      attentive: "Stay alert",
      critical: "Critical",
      noIncome: "No income",
      used: "used",
      income: "Income",
      payments: "Payments",
      monthlyExpenses: "Monthly expenses",
      currentBookings: "Current bookings",
      loanAmount: "Loan amount",
      activeLoans: "active loans",
      insurances: "Insurance",
      monthlyPremiums: "Monthly premiums",
      freeAmount: "Free amount",
      afterFixedPayments: "After fixed payments",
      loadingPayments: "Loading payments...",
      noPayments: "There are no payments for this month yet.",
      markPaid: "mark as paid",
      updating: "Updating...",
      paid: "Paid",
      partiallyPaid: "Partially paid",
      open: "Open",
      paidAmount: "Paid",
      savePaidAmount: "save paid amount"
    },
    settings: {
      themeLabel: "Theme",
      themeTitle: "Color mode",
      themeDescription: "Dark mode uses stronger contrast, calm surfaces and clear accent colors.",
      themeGroup: "Select color mode",
      languageLabel: "Language",
      languageTitle: "App language",
      languageDescription: "Switch the main parts of the app between German and English.",
      languageGroup: "Select language",
      german: "German",
      english: "English"
    }
  }
} as const;

type TranslationPath = string;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (path: TranslationPath) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readTranslation(language: AppLanguage, path: TranslationPath) {
  const value = path.split(".").reduce<string | TranslationTree | undefined>((current, key) => {
    if (!current || typeof current === "string") {
      return undefined;
    }

    return current[key];
  }, translations[language]);

  return typeof value === "string" ? value : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("de");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("finance-language");
    if (savedLanguage === "de" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
      document.documentElement.lang = savedLanguage;
      document.documentElement.dataset.language = savedLanguage;
    }
  }, []);

  function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dataset.language = nextLanguage;
    window.localStorage.setItem("finance-language", nextLanguage);
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (path: TranslationPath) => readTranslation(language, path)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
