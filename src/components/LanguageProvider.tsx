"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "de" | "en";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

const translations = {
  de: {
    app: {
      brand: "FyNest",
      cockpit: "Privates Cockpit"
    },
    nav: {
      home: "Startseite",
      loans: "Kredit",
      insurances: "Versicherungen",
      incomes: "Einnahmen",
      expenses: "Ausgaben",
      savings: "Sparen",
      investments: "Investitionen",
      contracts: "Verträge",
      general: "Allgemein",
      settings: "Einstellungen",
      openMenu: "Menu offnen",
      closeMenu: "Menu schliessen",
      main: "Hauptnavigation",
      signedInAs: "Angemeldet als",
      version: "Version",
      initialVersion: "Erste stabile Version",
      owner: "Inhaber",
      readonly: "Nebenbenutzer · Readonly",
      readwrite: "Nebenbenutzer · Read & Write"
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
      investments: {
        eyebrow: "Investitionen",
        title: "Depot und Krypto verwalten.",
        description: "Erfasse deine Käufe und vergleiche Kaufpreis, Menge und aktuellen Marktpreis."
      },
      savings: {
        eyebrow: "Sparen",
        title: "Spartöpfe verwalten.",
        description: "Behalte Guthaben, automatische Meilensteine und Sparbuchungen im Blick."
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
      investmentOverview: "Investment-Ubersicht",
      investmentItems: "Positionen",
      investedTotal: "Gekauft",
      currentInvestmentValue: "Wert heute",
      returnRate: "Rendite",
      investmentResult: "Gewinn / Verlust",
      savings: "Sparen",
      savingsTotal: "Gesamtes Sparguthaben",
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
      description: "Beschreibung",
      descriptionPlaceholder: "Notiz, Zweck oder wichtige Details",
      selectPlaceholder: "Bitte auswahlen",
      total: "Summe",
      day: "Tag",
      paymentInterval: "Zahlungsrhythmus",
      everyMonth: "Jeden Monat",
      everyThreeMonths: "Alle 3 Monate",
      everySixMonths: "Alle 6 Monate",
      everyYear: "Jahrlich",
      paymentInterval1: "Monatlich",
      paymentInterval3: "Alle 3 Monate",
      paymentInterval6: "Alle 6 Monate",
      paymentInterval12: "Jahrlich",
      oneTime: "Einmalig",
      recurring: "Wiederkehrend"
    },
    loading: {
      data: "Daten werden geladen",
      wait: "Bitte warten..."
    },
    auth: {
      preferences: "Darstellung und Sprache",
      loginTitle: "Anmelden",
      loginDescription: "Bitte melde dich an, um deine Finanzdaten zu verwalten.",
      loginAction: "Anmelden",
      loggingIn: "Anmelden...",
      loginFailed: "Login fehlgeschlagen.",
      forgotPassword: "Passwort vergessen?",
      noAccount: "Noch kein Konto?",
      registerAction: "Registrieren",
      registerTitle: "Registrieren",
      registerDescription: "Erstelle dein eigenes Konto, offne den Telegram-Bot und bestatige den Code.",
      usernameOrTelegram: "Benutzername oder Telegram-Nummer",
      transferWarning: "Dieser Benutzer hat bereits Zugriff auf ein anderes Konto.",
      registrationFailed: "Registrierung fehlgeschlagen.",
      codeFailed: "Code konnte nicht bestatigt werden.",
      accessRemovedTitle: "Zugriff wird entfernt",
      preparing: "Vorbereiten...",
      confirmAndContinue: "Bestatigen und fortfahren",
      startRegistration: "Registrierung starten",
      openTelegramTitle: "Telegram offnen",
      openTelegramDescription: "Offne den Bot, tippe auf Start und gib danach den Code hier ein.",
      openTelegram: "Telegram Bot offnen",
      telegramUsernameMissing: "TELEGRAM_BOT_USERNAME fehlt in den Environment Variables.",
      telegramCode: "Telegram-Code",
      checking: "Prufen...",
      finishRegistration: "Registrierung abschliessen",
      alreadyRegistered: "Schon registriert?",
      forgotTitle: "Passwort vergessen",
      forgotDescription: "Fordere einen Telegram-Code an und lege danach ein neues Passwort fest.",
      resetCodeSent: "Ein Code wurde an deinen Telegram-Bot gesendet.",
      resetNoContact: "Wenn kein Code ankommt, ist fur diesen Benutzer noch kein Telegram-Kontakt gespeichert.",
      resetStartFailed: "Reset konnte nicht gestartet werden.",
      passwordChangeFailed: "Passwort konnte nicht geandert werden.",
      sending: "Senden...",
      sendCode: "Code senden",
      newPassword: "Neues Passwort",
      savePassword: "Passwort speichern",
      backTo: "Zuruck zum"
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
      description: "Beschreibung",
      descriptionPlaceholder: "Notiz, Zweck oder wichtige Details zum Kredit",
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
      amount: "Betrag",
      monthly: "Monatlich",
      debitDay: "Abbuchungstag",
      firstDebitDate: "Erste Abbuchung",
      startDate: "Startdatum",
      endDate: "Enddatum",
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
      addTitle: "Neue Ausgabe eintragen",
      editTitle: "Ausgabe bearbeiten",
      deleteLabel: "Ausgabe loschen",
      deleteTitle: "Ausgabe wirklich loschen?",
      saveError: "Die Ausgabe konnte nicht gespeichert werden."
    },
    investments: {
      add: "Investition hinzufugen",
      loading: "Investitionen werden geladen...",
      investment: "Investition",
      addTitle: "Neue Investition eintragen",
      editTitle: "Investition bearbeiten",
      asset: "Wert",
      symbol: "Symbol",
      quantity: "Anzahl",
      purchasePrice: "Kaufpreis (EUR)",
      currentPrice: "Aktueller Preis",
      currentValue: "Aktueller Wert",
      result: "Gewinn / Verlust",
      purchaseDate: "Kaufdatum",
      investedTotal: "Investiert",
      currentTotal: "Aktueller Wert",
      priceUnavailable: "Nicht verfugbar",
      empty: "Noch keine Investitionen vorhanden.",
      deleteLabel: "Investition loschen",
      deleteTitle: "Investition wirklich loschen?",
      deleteText: "wird aus deinem Depot entfernt."
    },
    savings: {
      add: "Spartopf hinzufugen",
      loading: "Spartopfe werden geladen...",
      saving: "Spartopf",
      addTitle: "Neuen Spartopf eintragen",
      editTitle: "Spartopf bearbeiten",
      goal: "Spartopf",
      targetAmount: "Zielbetrag",
      currentAmount: "Aktueller Betrag",
      monthlyContribution: "Monatlich sparen",
      targetDate: "Zieldatum",
      progress: "Fortschritt",
      savedTotal: "Gespart",
      targetTotal: "Ziel gesamt",
      details: "Details",
      detailsTitle: "Buchungen",
      deposit: "Einzahlen",
      withdraw: "Auszahlen",
      depositTitle: "Geld einzahlen",
      withdrawTitle: "Geld auszahlen",
      editTransactionTitle: "Sparbuchung bearbeiten",
      transactionAmount: "Betrag",
      transactionDate: "Datum",
      transactionType: "Typ",
      loadingTransactions: "Buchungen werden geladen...",
      noTransactions: "Noch keine Buchungen vorhanden.",
      transactionDeleteLabel: "Sparbuchung loschen",
      transactionDeleteTitle: "Sparbuchung wirklich loschen?",
      transactionDeleteText: "wird aus diesem Spartopf entfernt.",
      manageOnlyInSavings: "Nur unter Sparen bearbeitbar",
      depositHint: "Die Einzahlung wird automatisch als Ausgabe gespeichert.",
      withdrawHint: "Die Auszahlung wird automatisch als Einnahme gespeichert.",
      empty: "Noch keine Spartopfe vorhanden.",
      deleteLabel: "Spartopf loschen",
      deleteTitle: "Spartopf wirklich loschen?",
      deleteText: "wird aus deiner Sparplanung entfernt."
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
      english: "Englisch",
      accessLabel: "Zugriff",
      accessTitle: "Benutzer und Berechtigungen",
      accessDescription: "Erstelle Benutzer, die deine Daten sehen durfen. Readonly darf nur lesen, Read & Write darf auch speichern.",
      addUser: "Benutzer hinzufugen",
      addUserTitle: "Neuen Benutzer hinzufugen",
      editUserTitle: "Benutzer bearbeiten",
      username: "Benutzername",
      password: "Passwort",
      passwordUnchanged: "Leer lassen, wenn unverandert",
      permission: "Berechtigung",
      readonly: "Readonly",
      readwrite: "Read & Write",
      noUsers: "Noch keine freigegebenen Benutzer vorhanden.",
      deleteUserLabel: "Benutzer loschen",
      deleteUserTitle: "Benutzer wirklich loschen?",
      deleteUserText: "verliert den Zugriff auf deine Daten.",
      logoutLabel: "Sitzung",
      logoutTitle: "Abmelden",
      logoutDescription: "Beende deine aktuelle Sitzung auf diesem Gerat.",
      logout: "Logout",
      loggingOut: "Abmelden..."
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
      amount: "Betrag",
      monthlyAmount: "Monatlich",
      debitDay: "Abbuchungstag",
      startDate: "Startdatum",
      endDate: "Enddatum",
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
      savings: "Savings",
      investments: "Investments",
      contracts: "Contracts",
      general: "General",
      settings: "Settings",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      main: "Main navigation",
      signedInAs: "Signed in as",
      version: "Version",
      initialVersion: "First stable version",
      owner: "Owner",
      readonly: "Shared user · Readonly",
      readwrite: "Shared user · Read & Write"
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
      investments: {
        eyebrow: "Investments",
        title: "Manage portfolio and crypto.",
        description: "Track purchases and compare purchase price, quantity and current market price."
      },
      savings: {
        eyebrow: "Savings",
        title: "Manage savings funds.",
        description: "Track balances, automatic milestones and savings transactions."
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
      investmentOverview: "Investment overview",
      investmentItems: "positions",
      investedTotal: "Bought",
      currentInvestmentValue: "Value today",
      returnRate: "Return",
      investmentResult: "Gain / loss",
      savings: "Savings",
      savingsTotal: "Total saved",
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
      description: "Description",
      descriptionPlaceholder: "Note, purpose or important details",
      selectPlaceholder: "Please select",
      total: "Total",
      day: "day",
      paymentInterval: "Payment interval",
      everyMonth: "Every month",
      everyThreeMonths: "Every 3 months",
      everySixMonths: "Every 6 months",
      everyYear: "Yearly",
      paymentInterval1: "Monthly",
      paymentInterval3: "Every 3 months",
      paymentInterval6: "Every 6 months",
      paymentInterval12: "Yearly",
      oneTime: "One-time",
      recurring: "Recurring"
    },
    loading: {
      data: "Loading data",
      wait: "Please wait..."
    },
    auth: {
      preferences: "Appearance and language",
      loginTitle: "Sign in",
      loginDescription: "Sign in to manage your financial data.",
      loginAction: "Sign in",
      loggingIn: "Signing in...",
      loginFailed: "Login failed.",
      forgotPassword: "Forgot password?",
      noAccount: "No account yet?",
      registerAction: "Register",
      registerTitle: "Register",
      registerDescription: "Create your own account, open the Telegram bot and confirm the code.",
      usernameOrTelegram: "Username or Telegram number",
      transferWarning: "This user already has access to another account.",
      registrationFailed: "Registration failed.",
      codeFailed: "Code could not be confirmed.",
      accessRemovedTitle: "Access will be removed",
      preparing: "Preparing...",
      confirmAndContinue: "Confirm and continue",
      startRegistration: "Start registration",
      openTelegramTitle: "Open Telegram",
      openTelegramDescription: "Open the bot, tap Start and then enter the code here.",
      openTelegram: "Open Telegram bot",
      telegramUsernameMissing: "TELEGRAM_BOT_USERNAME is missing in the environment variables.",
      telegramCode: "Telegram code",
      checking: "Checking...",
      finishRegistration: "Finish registration",
      alreadyRegistered: "Already registered?",
      forgotTitle: "Forgot password",
      forgotDescription: "Request a Telegram code and then set a new password.",
      resetCodeSent: "A code was sent to your Telegram bot.",
      resetNoContact: "If no code arrives, this user does not have a stored Telegram contact yet.",
      resetStartFailed: "Reset could not be started.",
      passwordChangeFailed: "Password could not be changed.",
      sending: "Sending...",
      sendCode: "Send code",
      newPassword: "New password",
      savePassword: "Save password",
      backTo: "Back to"
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
      description: "Description",
      descriptionPlaceholder: "Note, purpose or important credit details",
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
      amount: "Amount",
      monthly: "Monthly",
      debitDay: "Debit day",
      firstDebitDate: "First debit",
      startDate: "Start date",
      endDate: "End date",
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
      addTitle: "Add new expense",
      editTitle: "Edit expense",
      deleteLabel: "Delete expense",
      deleteTitle: "Delete this expense?",
      saveError: "The expense could not be saved."
    },
    investments: {
      add: "Add investment",
      loading: "Loading investments...",
      investment: "Investment",
      addTitle: "Add new investment",
      editTitle: "Edit investment",
      asset: "Asset",
      symbol: "Symbol",
      quantity: "Quantity",
      purchasePrice: "Purchase price (EUR)",
      currentPrice: "Current price",
      currentValue: "Current value",
      result: "Gain / loss",
      purchaseDate: "Purchase date",
      investedTotal: "Invested",
      currentTotal: "Current value",
      priceUnavailable: "Unavailable",
      empty: "No investments yet.",
      deleteLabel: "Delete investment",
      deleteTitle: "Delete this investment?",
      deleteText: "will be removed from your portfolio."
    },
    savings: {
      add: "Add savings fund",
      loading: "Loading savings funds...",
      saving: "Savings fund",
      addTitle: "Add new savings fund",
      editTitle: "Edit savings fund",
      goal: "Savings fund",
      targetAmount: "Target amount",
      currentAmount: "Current amount",
      monthlyContribution: "Monthly saving",
      targetDate: "Target date",
      progress: "Progress",
      savedTotal: "Saved",
      targetTotal: "Total target",
      details: "Details",
      detailsTitle: "Transactions",
      deposit: "Deposit",
      withdraw: "Withdraw",
      depositTitle: "Deposit money",
      withdrawTitle: "Withdraw money",
      editTransactionTitle: "Edit savings transaction",
      transactionAmount: "Amount",
      transactionDate: "Date",
      transactionType: "Type",
      loadingTransactions: "Loading transactions...",
      noTransactions: "No transactions yet.",
      transactionDeleteLabel: "Delete savings transaction",
      transactionDeleteTitle: "Delete this savings transaction?",
      transactionDeleteText: "will be removed from this savings fund.",
      manageOnlyInSavings: "Editable only in Savings",
      depositHint: "The deposit is automatically saved as an expense.",
      withdrawHint: "The withdrawal is automatically saved as income.",
      empty: "No savings funds yet.",
      deleteLabel: "Delete savings fund",
      deleteTitle: "Delete this savings fund?",
      deleteText: "will be removed from your savings plan."
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
      english: "English",
      accessLabel: "Access",
      accessTitle: "Users and permissions",
      accessDescription: "Create users who may see your data. Readonly can only view, Read & Write can also save changes.",
      addUser: "Add user",
      addUserTitle: "Add new user",
      editUserTitle: "Edit user",
      username: "Username",
      password: "Password",
      passwordUnchanged: "Leave empty to keep unchanged",
      permission: "Permission",
      readonly: "Readonly",
      readwrite: "Read & Write",
      noUsers: "No shared users yet.",
      deleteUserLabel: "Delete user",
      deleteUserTitle: "Delete this user?",
      deleteUserText: "will lose access to your data.",
      logoutLabel: "Session",
      logoutTitle: "Sign out",
      logoutDescription: "End your current session on this device.",
      logout: "Logout",
      loggingOut: "Logging out..."
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
      amount: "Amount",
      monthlyAmount: "Monthly",
      debitDay: "Debit day",
      startDate: "Start date",
      endDate: "End date",
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
