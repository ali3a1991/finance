"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { PublicPreferences } from "@/components/PublicPreferences";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

export default function LoginPage() {
  const { t } = useLanguage();
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
      setError(error instanceof Error ? error.message : t("auth.loginFailed"));
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <PublicPreferences />
      <section className="login-panel">
        <div className="login-mark" aria-hidden="true">
          <LockKeyhole size={26} />
        </div>
        <div className="login-copy">
          <span>{t("app.brand")}</span>
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDescription")}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>{t("settings.username")}</span>
            <input required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>{t("settings.password")}</span>
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
            {isLoading ? t("auth.loggingIn") : t("auth.loginAction")}
          </button>
        </form>

        <p className="auth-switch">
          <Link href="/forgot-password">{t("auth.forgotPassword")}</Link>
        </p>

        <p className="auth-switch">
          {t("auth.noAccount")} <Link href="/register">{t("auth.registerAction")}</Link>
        </p>
      </section>
    </main>
  );
}
