"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { requestJson } from "@/lib/requestJson";

type StartResponse = {
  challengeId?: string;
  message?: string;
  requiresTransferConfirmation?: boolean;
};

export default function RegisterPage() {
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [warning, setWarning] = useState("");

  async function startRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWarning("");
    setIsLoading(true);

    try {
      const body = await requestJson<StartResponse>("/api/auth/register/start", {
        authenticated: false,
        body: JSON.stringify({ confirmTransfer, password, username }),
        method: "POST"
      });

      if (body.requiresTransferConfirmation) {
        setWarning(body.message ?? "Dieser Benutzer hat bereits Zugriff auf ein anderes Konto.");
        setConfirmTransfer(true);
        return;
      }

      if (body.challengeId) {
        setChallengeId(body.challengeId);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registrierung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const body = await requestJson<{ token: string }>("/api/auth/register/verify", {
        authenticated: false,
        body: JSON.stringify({ challengeId, code }),
        method: "POST"
      });

      localStorage.setItem("finance_token", body.token);
      window.location.href = "/";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Code konnte nicht bestatigt werden.");
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <ShieldCheck size={26} />
        </div>
        <div className="login-copy">
          <span>Finanzmanager</span>
          <h1>Registrieren</h1>
          <p>Erstelle dein eigenes Konto und bestatige es mit einem Telegram-Code.</p>
        </div>

        {!challengeId ? (
          <form className="login-form" onSubmit={startRegistration}>
            <label>
              <span>Benutzername oder Telegram-Nummer</span>
              <input required value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              <span>Passwort</span>
              <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {warning ? (
              <div className="form-warning">
                <strong>Zugriff wird entfernt</strong>
                <p>{warning}</p>
              </div>
            ) : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              <Send size={18} aria-hidden="true" />
              {isLoading ? "Code senden..." : warning ? "Bestatigen und Code senden" : "Code senden"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={verifyCode}>
            <label>
              <span>Telegram-Code</span>
              <input required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? "Prufen..." : "Registrierung abschliessen"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Schon registriert? <Link href="/login">Anmelden</Link>
        </p>
      </section>
    </main>
  );
}
