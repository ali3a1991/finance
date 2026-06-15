"use client";

import { RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

type TetherPricePayload = {
  source: string;
  symbol: string;
  lastPrice: number | null;
  bestAsk: number | null;
  bestBid: number | null;
  spread: number | null;
  lastTradeTime: string | null;
  fetchedAt: string;
};

function getLocale(language: "de" | "en") {
  return language === "de" ? "de-DE" : "en-US";
}

function formatToman(value: number | null | undefined, language: "de" | "en", tomanLabel: string) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 0 }).format(value)} ${tomanLabel}`;
}

function formatDateTime(value: string | null | undefined, language: "de" | "en") {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TetherPricePanel() {
  const { language, t } = useLanguage();
  const [priceData, setPriceData] = useState<TetherPricePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPrice() {
    setIsLoading(true);
    setError("");

    try {
      const body = await requestJson<TetherPricePayload>("/api/tether-price");
      setPriceData(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("tether.error"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPrice();
  }, []);

  return (
    <section className="tether-panel">
      <div className="tether-panel-heading">
        <div className="investment-summary-heading">
          <span className="summary-icon">
            <TrendingUp size={22} aria-hidden="true" />
          </span>
          <div>
            <span>{t("tether.pair")}</span>
            <strong>{t("tether.liveTitle")}</strong>
          </div>
        </div>
        <button className="button secondary tether-refresh-button" type="button" onClick={loadPrice} disabled={isLoading}>
          <RefreshCw size={18} aria-hidden="true" className={isLoading ? "spin-icon" : ""} />
          {isLoading ? t("tether.refreshing") : t("tether.refresh")}
        </button>
      </div>

      {isLoading && !priceData ? <p className="muted-text">{t("tether.loading")}</p> : null}
      {error ? <p className="empty-table-text">{error}</p> : null}

      <div className="tether-price-card">
        <span>{t("tether.lastPrice")}</span>
        <strong>{formatToman(priceData?.lastPrice, language, t("tether.toman"))}</strong>
        <small>{priceData?.symbol ?? "USDTIRT"}</small>
      </div>

      <div className="tether-grid">
        <div>
          <span>{t("tether.bestBid")}</span>
          <strong>{formatToman(priceData?.bestBid, language, t("tether.toman"))}</strong>
        </div>
        <div>
          <span>{t("tether.bestAsk")}</span>
          <strong>{formatToman(priceData?.bestAsk, language, t("tether.toman"))}</strong>
        </div>
        <div>
          <span>{t("tether.spread")}</span>
          <strong>{formatToman(priceData?.spread, language, t("tether.toman"))}</strong>
        </div>
        <div>
          <span>{t("tether.lastTrade")}</span>
          <strong>{formatDateTime(priceData?.lastTradeTime, language)}</strong>
        </div>
      </div>

      <div className="tether-source">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>
          {t("tether.source")}: {priceData?.source ?? "Tabdeal"} · {t("tether.fetchedAt")}:{" "}
          {formatDateTime(priceData?.fetchedAt, language)}
        </span>
      </div>
    </section>
  );
}
