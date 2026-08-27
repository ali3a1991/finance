"use client";

import { Check, ChevronDown, RefreshCw, Share2, ShieldCheck, WalletCards } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

const KUCOIN_EURO_FEE = 1;
const TETHER_TRANSFER_FEE = 1.5;
const TOMAN_WITHDRAWAL_FEE = 15000;
const PRICE_REFRESH_INTERVAL_MS = 60_000;

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

function formatTomanNumber(value: number | null | undefined, language: "de" | "en") {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 0 }).format(value);
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

function groupDigits(value: string, language: "de" | "en") {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 0 }).format(Number(digits));
}

function formatCalculatorInput(value: string, mode: CalculatorMode, language: "de" | "en") {
  if (mode === "toman-to-eur") {
    return groupDigits(value, language);
  }

  const decimalSeparator = language === "de" ? "," : ".";
  const sanitizedValue = value.replace(/[^\d.,]/g, "");
  const decimalIndex = sanitizedValue.lastIndexOf(decimalSeparator);

  if (decimalIndex >= 0) {
    const integerPart = groupDigits(sanitizedValue.slice(0, decimalIndex), language) || "0";
    const decimalPart = sanitizedValue.slice(decimalIndex + 1).replace(/\D/g, "").slice(0, 2);
    return `${integerPart}${decimalSeparator}${decimalPart}`;
  }

  return groupDigits(sanitizedValue, language);
}

function parseAmount(value: string, mode: CalculatorMode, language: "de" | "en") {
  if (mode === "toman-to-eur") {
    const parsedToman = Number(value.replace(/\D/g, ""));
    return Number.isFinite(parsedToman) && parsedToman > 0 ? parsedToman : 0;
  }

  const decimalSeparator = language === "de" ? "," : ".";
  const groupSeparator = language === "de" ? "." : ",";
  const normalizedValue = value
    .replace(/\s/g, "")
    .replaceAll(groupSeparator, "")
    .replace(decimalSeparator, ".");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function TetherPricePanel() {
  const { language, t } = useLanguage();
  const [priceData, setPriceData] = useState<TetherPricePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>("eur-to-toman");
  const [calculatorAmount, setCalculatorAmount] = useState("100");
  const isLoadingPriceRef = useRef(false);

  const loadPrice = useCallback(async () => {
    if (isLoadingPriceRef.current) return;
    isLoadingPriceRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      const body = await requestJson<TetherPricePayload>("/api/tether-price", { cache: "no-store" });
      setPriceData(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("exchange.error"));
    } finally {
      isLoadingPriceRef.current = false;
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPrice();
    const intervalId = window.setInterval(() => void loadPrice(), PRICE_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadPrice]);

  useEffect(() => {
    setCalculatorAmount((currentAmount) => formatCalculatorInput(currentAmount, calculatorMode, language));
  }, [calculatorMode, language]);

  function changeCalculatorMode(mode: CalculatorMode) {
    setCalculatorMode(mode);
    setCalculatorAmount((currentAmount) => formatCalculatorInput(currentAmount, mode, language));
  }

  function changeCalculatorAmount(value: string) {
    setCalculatorAmount(formatCalculatorInput(value, calculatorMode, language));
  }

  async function sharePage() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: t("exchange.shareTitle"), url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2500);
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }

      setShareStatus("error");
      window.setTimeout(() => setShareStatus("idle"), 2500);
    }
  }

  const amount = parseAmount(calculatorAmount, calculatorMode, language);
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
  const resultValue =
    calculatorMode === "eur-to-toman"
      ? formatToman(finalToman, language, t("exchange.toman"))
      : formatEuro(neededEuro, language);
  const resultSummaryLabel =
    calculatorMode === "eur-to-toman" ? t("exchange.calculator.approxReceive") : t("exchange.calculator.approxSend");
  const inputUnit = calculatorMode === "eur-to-toman" ? "EUR" : t("exchange.toman");

  return (
    <section className="exchange-converter-panel">
      <div className="exchange-share-row">
        <button className="button secondary compact" type="button" onClick={sharePage}>
          {shareStatus === "copied" ? <Check size={17} aria-hidden="true" /> : <Share2 size={17} aria-hidden="true" />}
          {shareStatus === "copied" ? t("exchange.linkCopied") : t("exchange.share")}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {shareStatus === "copied" ? t("exchange.linkCopied") : shareStatus === "error" ? t("exchange.shareError") : ""}
        </span>
      </div>

      <div className="exchange-rate-card">
        <button className="exchange-refresh-button" type="button" onClick={loadPrice} disabled={isLoading} aria-label={t("exchange.refresh")}>
          <RefreshCw size={18} aria-hidden="true" className={isLoading ? "spin-icon" : ""} />
        </button>
        <span className="exchange-pair">{t("exchange.pair")}</span>
        <div className="exchange-rate-meta">
          <span>{t("exchange.lastPrice")}</span>
          <small>{formatDateTime(priceData?.lastTradeTime ?? priceData?.fetchedAt, language)}</small>
        </div>
        <strong>{formatTomanNumber(priceData?.lastPrice, language)}</strong>
        <small>{t("exchange.toman")} / USDT</small>
      </div>

      <div className="exchange-calculator">
        <div
          className={`exchange-mode-switch ${calculatorMode === "eur-to-toman" ? "is-left" : "is-right"}`}
          role="group"
          aria-label={t("exchange.calculator.mode")}
        >
          <button
            type="button"
            className={calculatorMode === "eur-to-toman" ? "active" : ""}
            onClick={() => changeCalculatorMode("eur-to-toman")}
          >
            {"Euro -> Toman"}
          </button>
          <button
            type="button"
            className={calculatorMode === "toman-to-eur" ? "active" : ""}
            onClick={() => changeCalculatorMode("toman-to-eur")}
          >
            {"Toman -> Euro"}
          </button>
        </div>

        <label className="exchange-input-label">
          <span>{calculatorMode === "eur-to-toman" ? t("exchange.calculator.euroInput") : t("exchange.calculator.tomanInput")}</span>
          <div className="exchange-input-wrap">
            <input
              type="text"
              inputMode={calculatorMode === "eur-to-toman" ? "decimal" : "numeric"}
              value={calculatorAmount}
              onChange={(event) => changeCalculatorAmount(event.target.value)}
              placeholder={calculatorMode === "eur-to-toman" ? "100" : formatCalculatorInput("500000", calculatorMode, language)}
            />
            <small>{inputUnit}</small>
          </div>
        </label>

        <div className="exchange-result">
          <span>{resultSummaryLabel}</span>
          <strong>{canCalculate ? resultValue : "-"}</strong>
        </div>

        <details className="exchange-fee-details">
          <summary>
            {t("exchange.calculator.feeDetails")}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <p>{t("exchange.calculator.feeHint")}</p>
          <p>
            {t("exchange.calculator.rateNote")} {formatEuro(kucoinRate, language)} / USDT ·{" "}
            {formatToman(tabdealSellRate, language, t("exchange.toman"))} / USDT
          </p>
        </details>
      </div>

      {isLoading && !priceData ? <p className="muted-text exchange-status">{t("exchange.loading")}</p> : null}
      {error ? <p className="empty-table-text exchange-status">{error}</p> : null}

      <div className="exchange-source">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{t("exchange.source")}:</span>
        <WalletCards size={17} aria-hidden="true" />
        <span>{priceData?.source ?? "Tabdeal"} · {priceData?.kucoin.source ?? "KuCoin"}</span>
      </div>
    </section>
  );
}
