"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ExternalLink, Send, ShieldCheck } from "lucide-react";
import { PublicPreferences } from "@/components/PublicPreferences";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

type StartResponse = {
  botLink?: string | null;
  challengeId?: string;
  message?: string;
  requiresTransferConfirmation?: boolean;
};

export default function RegisterPage() {
  const { t } = useLanguage();
  const [challengeId, setChallengeId] = useState("");
  const [botLink, setBotLink] = useState("");
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
        setWarning(body.message ?? t("auth.transferWarning"));
        setConfirmTransfer(true);
        return;
      }

      if (body.challengeId) {
        setChallengeId(body.challengeId);
        setBotLink(body.botLink ?? "");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t("auth.registrationFailed"));
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
      setError(error instanceof Error ? error.message : t("auth.codeFailed"));
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <PublicPreferences />
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <ShieldCheck size={26} />
        </div>
        <div className="login-copy">
          <span>{t("app.brand")}</span>
          <h1>{t("auth.registerTitle")}</h1>
          <p>{t("auth.registerDescription")}</p>
        </div>

        {!challengeId ? (
          <form autoComplete="off" className="login-form" onSubmit={startRegistration}>
            <label>
              <span>{t("auth.usernameOrTelegram")}</span>
              <input
                autoComplete="off"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label>
              <span>{t("settings.password")}</span>
              <input
                autoComplete="off"
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {warning ? (
              <div className="form-warning">
                <strong>{t("auth.accessRemovedTitle")}</strong>
                <p>{warning}</p>
              </div>
            ) : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" disabled={isLoading} type="submit">
              <Send size={18} aria-hidden="true" />
              {isLoading
                ? t("auth.preparing")
                : warning
                  ? t("auth.confirmAndContinue")
                  : t("auth.startRegistration")}
            </button>
          </form>
        ) : (
          <div className="login-form">
            <div className="form-warning">
              <strong>{t("auth.openTelegramTitle")}</strong>
              <p>{t("auth.openTelegramDescription")}</p>
            </div>
            {botLink ? (
              <a className="button primary" href={botLink} rel="noreferrer" target="_blank">
                <ExternalLink size={18} aria-hidden="true" />
                {t("auth.openTelegram")}
              </a>
            ) : (
              <p className="form-error">{t("auth.telegramUsernameMissing")}</p>
            )}
            <form autoComplete="off" className="login-form" onSubmit={verifyCode}>
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
              {error ? <p className="form-error">{error}</p> : null}
              <button className="button primary" disabled={isLoading} type="submit">
                {isLoading ? t("auth.checking") : t("auth.finishRegistration")}
              </button>
            </form>
          </div>
        )}

        <p className="auth-switch">
          {t("auth.alreadyRegistered")} <Link href="/login">{t("auth.loginAction")}</Link>
        </p>
      </section>
    </main>
  );
}
