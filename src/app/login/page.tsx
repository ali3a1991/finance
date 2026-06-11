"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { requestJson } from "@/lib/requestJson";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("admin");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const body = await requestJson<{ token: string }>("/api/auth/login", {
        authenticated: false,
        body: JSON.stringify({ password, username }),
        method: "POST"
      });

      localStorage.setItem("finance_token", body.token);
      window.location.href = "/";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login fehlgeschlagen.");
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <LockKeyhole size={26} />
        </div>
        <div className="login-copy">
          <span>Finanzmanager</span>
          <h1>Anmelden</h1>
          <p>Bitte melden Sie sich an, um Ihre Finanzdaten zu verwalten.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Benutzername</span>
            <input required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>Passwort</span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin123"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button primary" disabled={isLoading} type="submit">
            {isLoading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>

        <p className="auth-switch">
          <Link href="/forgot-password">Passwort vergessen?</Link>
        </p>

        <p className="auth-switch">
          Noch kein Konto? <Link href="/register">Registrieren</Link>
        </p>
      </section>
    </main>
  );
}
