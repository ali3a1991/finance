# FyNest

**Aktuelle Version:** `v1.0.0`  
**Current version:** `v1.0.0`

FyNest ist ein privater Finanzmanager fur Alltag, Vertrage, Sparen und Investments. Die App ist auf Deutsch und Englisch nutzbar, funktioniert responsiv auf Mobile, Tablet und Desktop und speichert Daten benutzerbezogen in PostgreSQL.

FyNest is a private finance manager for daily money, contracts, savings and investments. The app supports German and English, works responsively on mobile, tablet and desktop, and stores user-scoped data in PostgreSQL.

## Version 1.0.0

### Deutsch

Version `1.0.0` ist die erste stabile Ausgangsversion. Sie enthalt:

- Geschutzte Anmeldung mit 30 Tage gultigem Token.
- Registrierung und Passwort-Reset per Telegram-Code.
- Benutzerbezogene Daten: Jeder Account sieht nur die eigenen Daten.
- Freigabe von Zugriffen uber Einstellungen mit `Readonly` oder `Read & Write`.
- Dashboard mit Monatswechsel, Monatskompass, freiem Betrag, Investment-Ubersicht und Sparsumme.
- Zahlungen im Dashboard konnen bezahlt oder teilweise bezahlt markiert werden.
- Einnahmen mit festen und einmaligen Eintragen.
- Ausgaben mit Monatswechsel, Popup-Formular, Bearbeiten und Loschen.
- Vertrage:
  - Versicherungen mit Zahlungsrhythmus, erster Abbuchung, Start- und Enddatum.
  - Kredite mit erster Zahlung, Rate und Tilgungsdetails.
  - Allgemeine Vertrage mit Zahlungsrhythmus, Start- und Enddatum.
- Spartopfe mit manueller Einzahlung und Auszahlung.
- Sparbuchungen erzeugen automatisch passende Ausgaben oder Einnahmen.
- Sparbuchungen sind nur im Bereich Sparen bearbeitbar oder loschbar.
- Investments mit Kaufpreis, Menge, aktuellem Preis in EUR und Gewinn/Verlust.
- Unterstutzte Investment-Auswahl: Tesla, Nvidia, Apple, SpaceX, S&P 500 und Bitcoin.
- Helle und dunkle Darstellung mit umschaltbarer App-Sprache.
- Englische App-Routen mit deutschen Weiterleitungen fur bestehende Links.

### English

Version `1.0.0` is the first stable baseline release. It includes:

- Protected login with a 30-day token.
- Registration and password reset by Telegram code.
- User-scoped data: every account only sees its own data.
- Shared access in Settings with `Readonly` or `Read & Write`.
- Dashboard with month switching, monthly compass, free amount, investment overview and savings total.
- Dashboard payments can be marked as paid or partially paid.
- Income management with fixed and one-time entries.
- Expense management with month switching, popup form, edit and delete.
- Contracts:
  - Insurances with payment interval, first debit date, start date and end date.
  - Credits with first payment, installment and repayment details.
  - General contracts with payment interval, start date and end date.
- Savings funds with manual deposit and withdrawal.
- Savings transactions automatically create matching expenses or income.
- Savings transactions can only be edited or deleted inside Savings.
- Investments with purchase price, quantity, current EUR price and profit/loss.
- Supported investment choices: Tesla, Nvidia, Apple, SpaceX, S&P 500 and Bitcoin.
- Light and dark mode with switchable app language.
- English app routes with German redirects for existing links.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Prisma 7
- PostgreSQL / Neon
- Vercel deployment
- Telegram Bot API for registration, password reset and manual release broadcasts

## Environment Variables

Required for production:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_USERNAME=
AUTH_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
APP_URL=
UPDATE_BROADCAST_SECRET=
```

`APP_URL` and `UPDATE_BROADCAST_SECRET` are only required for manual Telegram release broadcasts.

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

The build runs `prisma generate` before `next build`.

## Release Process

Telegram update reports are **not sent automatically on every commit or push**.

For a new version:

1. Update `package.json`, `package-lock.json` and `src/lib/appVersion.ts`.
2. Update this `README.md` with the new version notes.
3. Commit and push the release changes.
4. Run the GitHub Action **Broadcast release update** manually.
5. Enter:
   - version number
   - German multiline release summary
   - English multiline release summary

The Telegram message must be a real release note, not only a commit message.

## Release Notes Template

### Deutsch

```text
FyNest vX.Y.Z

Neu:
- ...

Verbessert:
- ...

Hinweis:
- ...
```

### English

```text
FyNest vX.Y.Z

New:
- ...

Improved:
- ...

Note:
- ...
```
