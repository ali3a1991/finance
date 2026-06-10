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
      loans: "Kredit",
      insurances: "Versicherungen",
      incomes: "Einnahmen",
      expenses: "Ausgaben",
      contracts: "Verträge",
      general: "Allgemein",
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
        description: "Alle einzelnen Ausgaben werden klar erfasst und in einer Tabelle gepflegt."
      },
      expenseCapture: {
        eyebrow: "Ausgaben / Erfassung",
        title: "Neue Ausgabe eintragen.",
        description: "Ein klares Formular fur schnelle Testbuchungen im Finanzmanager."
      },
      contractsGeneral: {
        eyebrow: "Verträge",
        title: "Allgemeine Verträge.",
        description: "Ein zentraler Ort für weitere laufende Verträge außerhalb von Krediten und Versicherungen."
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
    common: {
      actions: "Aktionen",
      add: "hinzufugen",
      edit: "bearbeiten",
      delete: "loschen",
      save: "Speichern",
      saving: "Speichern...",
      cancel: "Abbrechen",
      deleting: "Loschen...",
      closeDialog: "Dialog schliessen",
      selectPlaceholder: "Bitte auswahlen",
      total: "Summe",
      day: "Tag",
      oneTime: "Einmalig",
      recurring: "Wiederkehrend"
    },
    loading: {
      data: "Daten werden geladen",
      wait: "Bitte warten..."
    },
    loans: {
      add: "Kredit hinzufugen",
      loading: "Kredite werden geladen...",
      loan: "Kredit",
      bank: "Bank",
      amount: "Kreditbetrag",
      totalInterest: "Gesamtzinsen",
      rate: "Rate",
      monthlyRate: "Monatsrate",
      interest: "Zins",
      interestRate: "Zinssatz",
      firstPayment: "Erste Zahlung",
      status: "Status",
      details: "Details anzeigen",
      addTitle: "Neuen Kredit hinzufugen",
      editTitle: "Kredit bearbeiten",
      name: "Kreditname",
      amortization: "Tilgungsplan",
      installments: "Anzahl Raten",
      date: "Datum",
      remainingAfter: "Rest danach",
      deleteLabel: "Kredit loschen",
      deleteTitle: "Kredit wirklich loschen?",
      deleteText: "wird aus der aktuellen Tabelle entfernt."
    },
    insurances: {
      add: "Versicherung hinzufugen",
      loading: "Versicherungen werden geladen...",
      insurance: "Versicherung",
      provider: "Anbieter",
      coverage: "Schutz",
      monthly: "Monatlich",
      debitDay: "Abbuchungstag",
      renewal: "Verlangerung",
      noTerm: "Keine Laufzeit",
      addTitle: "Neue Versicherung hinzufugen",
      editTitle: "Versicherung bearbeiten",
      noRenewal: "Keine Verlangerung / kein Ablaufdatum",
      deleteLabel: "Versicherung loschen",
      deleteTitle: "Versicherung wirklich loschen?",
      deleteText: "wird aus der aktuellen Tabelle entfernt."
    },
    incomes: {
      add: "Einnahme hinzufugen",
      loading: "Einnahmen werden geladen...",
      ariaTabs: "Einnahmenarten",
      recurringTab: "Feste Einnahmen",
      oneTimeTab: "Einmalige Eingange",
      title: "Titel",
      source: "Quelle",
      amount: "Betrag",
      date: "Datum",
      type: "Typ",
      fixed: "Fest",
      empty: "Keine Einnahmen in dieser Kategorie vorhanden.",
      addTitle: "Neue Einnahme hinzufugen",
      editTitle: "Einnahme bearbeiten",
      deleteLabel: "Einnahme loschen",
      deleteTitle: "Einnahme wirklich loschen?",
      recurringMonthly: "Feste monatliche Einnahme",
      entryDay: "Eingangstag"
    },
    expenses: {
      add: "Neue Ausgabe",
      loading: "Ausgaben werden geladen...",
      title: "Titel",
      category: "Kategorie",
      date: "Datum",
      amount: "Betrag",
      empty: "Keine Ausgaben in dieser Kategorie vorhanden.",
      editTitle: "Ausgabe bearbeiten",
      deleteLabel: "Ausgabe loschen",
      deleteTitle: "Ausgabe wirklich loschen?",
      saveError: "Die Ausgabe konnte nicht gespeichert werden."
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
    },
    contracts: {
      generalLabel: "Allgemein",
      generalTitle: "Weitere Verträge",
      generalDescription: "Hier kann später eine eigene Tabelle für allgemeine Verträge wie Mobilfunk, Streaming oder Mitgliedschaften entstehen.",
      add: "Vertrag hinzufügen",
      loading: "Verträge werden geladen...",
      title: "Titel",
      provider: "Anbieter",
      category: "Kategorie",
      monthlyAmount: "Monatlich",
      debitDay: "Abbuchungstag",
      startDate: "Startdatum",
      status: "Status",
      note: "Notiz",
      active: "Aktiv",
      paused: "Pausiert",
      cancelled: "Gekündigt",
      addTitle: "Neuen Vertrag hinzufügen",
      editTitle: "Vertrag bearbeiten",
      deleteLabel: "Vertrag löschen",
      deleteTitle: "Vertrag wirklich löschen?",
      deleteText: "wird aus der aktuellen Tabelle entfernt.",
      empty: "Noch keine allgemeinen Verträge vorhanden."
    }
  },
  en: {
    app: {
      brand: "Finance Manager",
      cockpit: "Private cockpit"
    },
    nav: {
      home: "Home",
      loans: "Credit",
      insurances: "Insurance",
      incomes: "Income",
      expenses: "Expenses",
      contracts: "Contracts",
      general: "General",
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
        description: "All individual expenses are tracked clearly and managed in one table."
      },
      expenseCapture: {
        eyebrow: "Expenses / Capture",
        title: "Add a new expense.",
        description: "A clear form for quick test bookings in the finance manager."
      },
      contractsGeneral: {
        eyebrow: "Contracts",
        title: "General contracts.",
        description: "A central place for other recurring contracts outside loans and insurance."
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
    common: {
      actions: "Actions",
      add: "add",
      edit: "edit",
      delete: "delete",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      deleting: "Deleting...",
      closeDialog: "Close dialog",
      selectPlaceholder: "Please select",
      total: "Total",
      day: "day",
      oneTime: "One-time",
      recurring: "Recurring"
    },
    loading: {
      data: "Loading data",
      wait: "Please wait..."
    },
    loans: {
      add: "Add credit",
      loading: "Loading credits...",
      loan: "Credit",
      bank: "Bank",
      amount: "Credit amount",
      totalInterest: "Total interest",
      rate: "Installment",
      monthlyRate: "Monthly installment",
      interest: "Interest",
      interestRate: "Interest rate",
      firstPayment: "First payment",
      status: "Status",
      details: "show details",
      addTitle: "Add new credit",
      editTitle: "Edit credit",
      name: "Credit name",
      amortization: "Repayment plan",
      installments: "Installments",
      date: "Date",
      remainingAfter: "Remaining after",
      deleteLabel: "Delete credit",
      deleteTitle: "Delete this credit?",
      deleteText: "will be removed from the current table."
    },
    insurances: {
      add: "Add insurance",
      loading: "Loading insurance...",
      insurance: "Insurance",
      provider: "Provider",
      coverage: "Coverage",
      monthly: "Monthly",
      debitDay: "Debit day",
      renewal: "Renewal",
      noTerm: "No term",
      addTitle: "Add new insurance",
      editTitle: "Edit insurance",
      noRenewal: "No renewal / no expiry date",
      deleteLabel: "Delete insurance",
      deleteTitle: "Delete this insurance?",
      deleteText: "will be removed from the current table."
    },
    incomes: {
      add: "Add income",
      loading: "Loading income...",
      ariaTabs: "Income types",
      recurringTab: "Fixed income",
      oneTimeTab: "One-time inflows",
      title: "Title",
      source: "Source",
      amount: "Amount",
      date: "Date",
      type: "Type",
      fixed: "Fixed",
      empty: "No income exists in this category.",
      addTitle: "Add new income",
      editTitle: "Edit income",
      deleteLabel: "Delete income",
      deleteTitle: "Delete this income?",
      recurringMonthly: "Fixed monthly income",
      entryDay: "Entry day"
    },
    expenses: {
      add: "New expense",
      loading: "Loading expenses...",
      title: "Title",
      category: "Category",
      date: "Date",
      amount: "Amount",
      empty: "No expenses exist in this category.",
      editTitle: "Edit expense",
      deleteLabel: "Delete expense",
      deleteTitle: "Delete this expense?",
      saveError: "The expense could not be saved."
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
    },
    contracts: {
      generalLabel: "General",
      generalTitle: "Other contracts",
      generalDescription: "A dedicated table for general contracts such as mobile plans, streaming or memberships can be added here later.",
      add: "Add contract",
      loading: "Loading contracts...",
      title: "Title",
      provider: "Provider",
      category: "Category",
      monthlyAmount: "Monthly",
      debitDay: "Debit day",
      startDate: "Start date",
      status: "Status",
      note: "Note",
      active: "Active",
      paused: "Paused",
      cancelled: "Cancelled",
      addTitle: "Add new contract",
      editTitle: "Edit contract",
      deleteLabel: "Delete contract",
      deleteTitle: "Delete this contract?",
      deleteText: "will be removed from the current table.",
      empty: "No general contracts yet."
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
