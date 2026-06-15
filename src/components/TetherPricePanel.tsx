"use client";

import { Calculator, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

const KUCOIN_EURO_FEE = 1;
const TETHER_TRANSFER_FEE = 1.5;
const TOMAN_WITHDRAWAL_FEE = 15000;

type TetherPricePayload = {
  source: string;
  symbol: string;
  lastPrice: number | null;
  bestAsk: number | null;
  bestBid: number | null;
  spread: number | null;
  lastTradeTime: string | null;
  kucoin: {
    source: string;
    symbol: string;
    eurPerUsdt: number | null;
    bestAsk: number | null;
    bestBid: number | null;
    fetchedAt: string | null;
  };
  fetchedAt: string;
};

type CalculatorMode = "eur-to-toman" | "toman-to-eur";

function getLocale(language: "de" | "en") {
  return language === "de" ? "de-DE" : "en-US";
}

function formatToman(value: number | null | undefined, language: "de" | "en", tomanLabel: string) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 0 }).format(value)} ${tomanLabel}`;
}

function formatEuro(value: number | null | undefined, language: "de" | "en") {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
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

function parseAmount(value: string) {
  const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function TetherPricePanel() {
  const { language, t } = useLanguage();
  const [priceData, setPriceData] = useState<TetherPricePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>("eur-to-toman");
  const [calculatorAmount, setCalculatorAmount] = useState("100");

  async function loadPrice() {
    setIsLoading(true);
    setError("");

    try {
      const body = await requestJson<TetherPricePayload>("/api/tether-price");
      setPriceData(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("exchange.error"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPrice();
  }, []);

  const amount = parseAmount(calculatorAmount);
  const kucoinRate = priceData?.kucoin.bestAsk ?? priceData?.kucoin.eurPerUsdt ?? null;
  const tabdealSellRate = priceData?.bestBid ?? priceData?.lastPrice ?? null;
  const canCalculate = amount > 0 && kucoinRate !== null && kucoinRate > 0 && tabdealSellRate !== null && tabdealSellRate > 0;
  const euroAfterFee = calculatorMode === "eur-to-toman" ? Math.max(amount - KUCOIN_EURO_FEE, 0) : 0;
  const boughtUsdt = canCalculate && calculatorMode === "eur-to-toman" ? euroAfterFee / kucoinRate : 0;
  const receivedUsdt = canCalculate && calculatorMode === "eur-to-toman" ? Math.max(boughtUsdt - TETHER_TRANSFER_FEE, 0) : 0;
  const grossToman = canCalculate && calculatorMode === "eur-to-toman" ? receivedUsdt * tabdealSellRate : 0;
  const finalToman = canCalculate && calculatorMode === "eur-to-toman" ? Math.max(grossToman - TOMAN_WITHDRAWAL_FEE, 0) : 0;
  const neededGrossToman =
    canCalculate && calculatorMode === "toman-to-eur" ? amount + TOMAN_WITHDRAWAL_FEE : 0;
  const neededReceivedUsdt =
    canCalculate && calculatorMode === "toman-to-eur" ? neededGrossToman / tabdealSellRate : 0;
  const neededBoughtUsdt =
    canCalculate && calculatorMode === "toman-to-eur" ? neededReceivedUsdt + TETHER_TRANSFER_FEE : 0;
  const neededEuroAfterFee =
    canCalculate && calculatorMode === "toman-to-eur" ? neededBoughtUsdt * kucoinRate : 0;
  const neededEuro =
    canCalculate && calculatorMode === "toman-to-eur" ? neededEuroAfterFee + KUCOIN_EURO_FEE : 0;
  const resultLabel =
    calculatorMode === "eur-to-toman" ? t("exchange.calculator.tomanResult") : t("exchange.calculator.euroResult");
  const resultValue =
    calculatorMode === "eur-to-toman"
      ? formatToman(finalToman, language, t("exchange.toman"))
      : formatEuro(neededEuro, language);

  return (
    <section className="tether-panel">
      <div className="tether-panel-heading">
        <div className="investment-summary-heading">
          <div className="stat-icon main-icon" aria-hidden="true">
            <TrendingUp size={22} aria-hidden="true" />
          </div>
          <div>
            <span>{t("exchange.pair")}</span>
            <strong>{t("exchange.liveTitle")}</strong>
          </div>
        </div>
        <button className="button secondary tether-refresh-button" type="button" onClick={loadPrice} disabled={isLoading}>
          <RefreshCw size={18} aria-hidden="true" className={isLoading ? "spin-icon" : ""} />
          {isLoading ? t("exchange.refreshing") : t("exchange.refresh")}
        </button>
      </div>

      {isLoading && !priceData ? <p className="muted-text">{t("exchange.loading")}</p> : null}
      {error ? <p className="empty-table-text">{error}</p> : null}

      <div className="tether-price-card">
        <div className="tether-price-card-header">
          <span>{t("exchange.lastPrice")}</span>
          <small>
            {t("exchange.updatedAt")}: {formatDateTime(priceData?.lastTradeTime ?? priceData?.fetchedAt, language)}
          </small>
        </div>
        <strong>{formatToman(priceData?.lastPrice, language, t("exchange.toman"))}</strong>
        <small>{priceData?.symbol ?? "USDTIRT"}</small>
      </div>

      <div className="tether-calculator">
        <div className="tether-calculator-heading">
          <div className="investment-summary-heading">
            <div className="stat-icon main-icon" aria-hidden="true">
              <Calculator size={22} aria-hidden="true" />
            </div>
            <div>
              <span>{t("exchange.calculator.eyebrow")}</span>
              <strong>{t("exchange.calculator.title")}</strong>
            </div>
          </div>
          <div className="tether-mode-switch" role="group" aria-label={t("exchange.calculator.mode")}>
            <button
              type="button"
              className={calculatorMode === "eur-to-toman" ? "active" : ""}
              onClick={() => setCalculatorMode("eur-to-toman")}
            >
              {t("exchange.calculator.eurToToman")}
            </button>
            <button
              type="button"
              className={calculatorMode === "toman-to-eur" ? "active" : ""}
              onClick={() => setCalculatorMode("toman-to-eur")}
            >
              {t("exchange.calculator.tomanToEur")}
            </button>
          </div>
        </div>

        <label className="form-field tether-calculator-input">
          <span>{calculatorMode === "eur-to-toman" ? t("exchange.calculator.euroInput") : t("exchange.calculator.tomanInput")}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={calculatorAmount}
            onChange={(event) => setCalculatorAmount(event.target.value)}
            placeholder={calculatorMode === "eur-to-toman" ? "100" : "500000"}
          />
        </label>

        <div className="tether-result-card">
          <span>{resultLabel}</span>
          <strong>{canCalculate ? resultValue : "-"}</strong>
          <small>{t("exchange.calculator.feeHint")}</small>
        </div>

        <p className="tether-calculator-note">
          {t("exchange.calculator.rateNote")} {formatEuro(kucoinRate, language)} / USDT ·{" "}
          {formatToman(tabdealSellRate, language, t("exchange.toman"))} / USDT
        </p>
      </div>

      <div className="tether-source">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>
          {t("exchange.source")}: {priceData?.source ?? "Tabdeal"} · {priceData?.kucoin.source ?? "KuCoin"}
        </span>
      </div>
    </section>
  );
}
