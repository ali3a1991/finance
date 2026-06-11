"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { PublicPreferences } from "@/components/PublicPreferences";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
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
      setInfo(body.challengeId ? t("auth.resetCodeSent") : t("auth.resetNoContact"));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("auth.resetStartFailed"));
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
      setError(error instanceof Error ? error.message : t("auth.passwordChangeFailed"));
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <PublicPreferences />
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <KeyRound size={26} />
        </div>
        <div className="login-copy">
          <span>{t("app.brand")}</span>
          <h1>{t("auth.forgotTitle")}</h1>
          <p>{t("auth.forgotDescription")}</p>
        </div>

        {!challengeId ? (
          <form autoComplete="off" className="login-form" onSubmit={requestReset}>
            <label>
              <span>{t("settings.username")}</span>
              <input
                autoComplete="off"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            {info ? <p className="form-info">{info}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? t("auth.sending") : t("auth.sendCode")}
            </button>
          </form>
        ) : (
          <form autoComplete="off" className="login-form" onSubmit={resetPassword}>
            {info ? <p className="form-info">{info}</p> : null}
            <label>
              <span>{t("auth.telegramCode")}</span>
              <input
                autoComplete="off"
                required
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <label>
              <span>{t("auth.newPassword")}</span>
              <input
                autoComplete="off"
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              {isLoading ? t("common.saving") : t("auth.savePassword")}
            </button>
          </form>
        )}

        <p className="auth-switch">
          {t("auth.backTo")} <Link href="/login">{t("auth.loginAction")}</Link>
        </p>
      </section>
    </main>
  );
}
