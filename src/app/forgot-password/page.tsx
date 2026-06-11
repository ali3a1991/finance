"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { requestJson } from "@/lib/requestJson";

export default function ForgotPasswordPage() {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const body = await requestJson<{ challengeId: string | null; message: string }>("/api/auth/password-reset/start", {
        authenticated: false,
        body: JSON.stringify({ username }),
        method: "POST"
      });
      setChallengeId(body.challengeId);
      setInfo(
        body.challengeId
          ? "Ein Code wurde an deinen Telegram-Bot gesendet."
          : "Wenn kein Code ankommt, ist fur diesen Benutzer noch kein Telegram-Kontakt gespeichert."
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Reset konnte nicht gestartet werden.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await requestJson("/api/auth/password-reset/verify", {
        authenticated: false,
        body: JSON.stringify({ challengeId, code, password }),
        method: "POST"
      });
      window.location.href = "/login";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Passwort konnte nicht geandert werden.");
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <KeyRound size={26} />
        </div>
        <div className="login-copy">
          <span>Finanzmanager</span>
          <h1>Passwort vergessen</h1>
          <p>Fordere einen Telegram-Code an und lege danach ein neues Passwort fest.</p>
        </div>

        {!challengeId ? (
          <form className="login-form" onSubmit={requestReset}>
            <label>
              <span>Benutzername</span>
              <input required value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            {info ? <p className="form-info">{info}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? "Senden..." : "Code senden"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={resetPassword}>
            {info ? <p className="form-info">{info}</p> : null}
            <label>
              <span>Telegram-Code</span>
              <input required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <label>
              <span>Neues Passwort</span>
              <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? "Speichern..." : "Passwort speichern"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Zuruck zum <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
